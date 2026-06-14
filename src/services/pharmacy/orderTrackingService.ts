import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '@/lib/utils'
import { supabase, isSupabaseConfigured } from '../supabase'
import { addDays, parseISO, format, isValid, differenceInDays } from 'date-fns'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { 
  OrderTrackingStats, 
  OrderTrackingListItem, 
  OrderTrackingDetail, 
  OrderTrackingItem,
  DeliveryProgress,
  LPOReminder,
  GoodsReceipt,
  CreditNote,
  PurchaseOrderItem,
  SupplierPenalty
} from '@/types/pharmacy'
import { getGoodsReceiptHistory } from './receivingService'
import { extractDatesFromPdf } from '@/lib/pdfParser'
import { checkAndCreateLatePenalty } from './penaltyService'

export interface OrderTrackingFilter {
  search?: string
  status?: string
  category?: string
  vote_code?: string
}

/**
 * Get aggregated statistics for the order tracking dashboard
 */
export async function getOrderTrackingStats(hospitalId: string): Promise<ApiResponse<OrderTrackingStats>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: {
          total_tracked: 0,
          pending_count: 0,
          partially_delivered_count: 0,
          fully_delivered_count: 0,
          overdue_count: 0,
          cancelled_count: 0,
          total_reminders: 0
        },
        error: null
      }
    }

    // We aggregate at the LPO level. An LPO is overdue if any item is overdue.
    // It is fully delivered if all items are delivered.
    // Otherwise it's pending (or partially delivered).
    
    // First get raw item-level data
    // Fetch all tracking items for this hospital
    // We join with pharmacy_lpo and pharmacy_purchase_orders to include 'approved' and 'cancelled' ones
    const { data: items, error } = await supabase
      .from('pharmacy_order_tracking')
      .select(`
        lpo_id, 
        status, 
        expected_delivery_date,
        reminder_count,
        lpo:pharmacy_lpo!inner(
          lpo_number,
          document_url,
          status,
          po:pharmacy_purchase_orders!inner(status, category, po_number, vote_code)
        )
      `)
      .eq('hospital_id', hospitalId)
      .eq('lpo.status', 'verified')
      .in('lpo.po.vote_code', ['080702', '990102'])
      .not('lpo.document_url', 'is', null)
      .not('lpo.po.category', 'in', '("ALAT TULIS", "Alat Tulis", "PRINTING SERVICE", "BEKALAN MAKANAN")')
      .in('lpo.po.status', ['approved', 'cancelled', 'completed', 'partial_received'])

    if (error) throw error

    // Group by LPO
    const lpoStatusMap = new Map<string, { total: number, delivered: number, hasOverdue: boolean, isCancelled: boolean }>()
    const today = new Date().toISOString().split('T')[0]
    let totalReminders = 0
    
    for (const item of (items || [])) {
      const lpo = item.lpo as any
      const po = lpo?.po
      
      // Strict Filter: Only include in tracking if we have a verified LPO, allowed vote code and a document is present
      if (!lpo || !po || !lpo.document_url || lpo.status !== 'verified' || (po.vote_code !== '080702' && po.vote_code !== '990102')) {
        continue
      }

      if (!lpoStatusMap.has(item.lpo_id)) {
        lpoStatusMap.set(item.lpo_id, { 
          total: 0, 
          delivered: 0, 
          hasOverdue: false,
          isCancelled: po.status === 'cancelled'
        })
      }
      
      const stats = lpoStatusMap.get(item.lpo_id)!
      stats.total++
      
      if (item.status === 'delivered') {
        stats.delivered++
      } else if (!stats.isCancelled && (item.status === 'overdue' || (item.expected_delivery_date && item.expected_delivery_date < today))) {
        stats.hasOverdue = true
      }

      totalReminders += (item.reminder_count || 0)
    }
    
    // Calculate final stats
    const result: OrderTrackingStats = {
      total_tracked: lpoStatusMap.size,
      pending_count: 0,
      partially_delivered_count: 0,
      fully_delivered_count: 0,
      overdue_count: 0,
      cancelled_count: 0,
      total_reminders: totalReminders
    }
    
    lpoStatusMap.forEach(stats => {
      if (stats.isCancelled) {
        result.cancelled_count++
      } else if (stats.hasOverdue) {
        result.overdue_count++
      } else if (stats.delivered === stats.total && stats.total > 0) {
        result.fully_delivered_count++
      } else if (stats.delivered > 0) {
        result.partially_delivered_count++
      } else {
        result.pending_count++
      }
    })

    return { data: result, error: null }
  } catch (error) {
    console.error('Error fetching order tracking stats:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch stats' }
  }
}

/**
 * Get paginated list of tracked LPOs with aggregated item statuses
 */
export async function getOrderTrackingList(
  hospitalId: string,
  filter?: OrderTrackingFilter,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<OrderTrackingListItem>>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: { data: [], total: 0, page, pageSize, totalPages: 0 },
        error: null
      }
    }

    // Step 1: Query the tracking table joined with LPO, PO and Supplier
    let query = supabase
      .from('pharmacy_order_tracking')
      .select(`
        id,
        lpo_id,
        expected_delivery_date,
        status,
        days_overdue,
        reminder_count,
        last_reminder_sent,
        item_name,
        lpo:pharmacy_lpo!inner(
          id, 
          lpo_number, 
          status,
          document_date,
          document_url,
          expected_delivery_date,
          po:pharmacy_purchase_orders!inner(
            id,
            po_number,
            vote_code,
            category,
            kkm_contract_number,
            manual_supplier_name,
            supplier:suppliers(
              id,
              company_name,
              email
            )
          )
        )
      `)
      .eq('hospital_id', hospitalId)
      .eq('lpo.status', 'verified')
      .in('lpo.po.vote_code', ['080702', '990102'])
      .not('lpo.document_url', 'is', null)
      .not('lpo.po.category', 'in', '("ALAT TULIS", "Alat Tulis", "PRINTING SERVICE", "BEKALAN MAKANAN")')
      .in('lpo.po.status', ['approved', 'cancelled', 'completed', 'partial_received'])

    // Optional filters applied to the PO
    if (filter?.category) {
      if (filter.category === 'APPL') {
        query = query.eq('lpo.po.vote_code', '990102')
      } else if (filter.category === 'CC') {
        query = query.eq('lpo.po.vote_code', '080702')
      } else {
        query = query.eq('lpo.po.category', filter.category)
      }
    }
    
    if (filter?.vote_code) {
      query = query.eq('lpo.po.vote_code', filter.vote_code)
    }

    const { data: trackingData, error } = await query

    if (error) throw error

    // Step 2: Aggregate by LPO ID manually in JS (since Supabase doesn't easily do complex GROUP BY across joins)
    const lpoMap = new Map<string, any>()
    
    const today = new Date().toISOString().split('T')[0]

    for (const item of (trackingData || [])) {
      const lpoInfo = item.lpo as any
      if (!lpoInfo || !lpoInfo.po) continue
      
      const poInfo = lpoInfo.po
      
      // Strict Filter: Only include in tracking if we have a verified LPO, allowed vote code and a document is present.
      if (!lpoInfo.document_url || lpoInfo.status !== 'verified' || (poInfo.vote_code !== '080702' && poInfo.vote_code !== '990102')) {
        continue
      }

      const supplierName = poInfo.supplier?.company_name || poInfo.manual_supplier_name || 'Unknown Supplier'
      const supplierEmail = poInfo.supplier?.email || ''
      
        if (!lpoMap.has(item.lpo_id)) {
          lpoMap.set(item.lpo_id, {
            lpo_id: item.lpo_id,
            lpo_number: lpoInfo.lpo_number,
            lpo_date: lpoInfo.document_date,
            document_url: lpoInfo.document_url,
            po_number: poInfo.po_number,
            vote_code: poInfo.vote_code,
            category: poInfo.category,
            kkm_contract_number: poInfo.kkm_contract_number,
            supplier_name: supplierName,
            supplier_email: supplierEmail,
            total_items: 0,
            delivered_items: 0,
            earliest_eta: lpoInfo.expected_delivery_date || item.expected_delivery_date,
            latest_eta: lpoInfo.expected_delivery_date || item.expected_delivery_date,
            max_days_overdue: item.days_overdue || 0,
          reminder_count: item.reminder_count || 0,
          last_reminder_sent: item.last_reminder_sent,
          has_overdue: false,
          has_penalties: false,
          search_text: `${lpoInfo.lpo_number} ${poInfo.po_number} ${supplierName}`.toLowerCase(),
          po_status: poInfo.status
        })
      }
      
      const lpoAgg = lpoMap.get(item.lpo_id)
      lpoAgg.total_items++
      
      const resolvedEta = lpoInfo.expected_delivery_date || item.expected_delivery_date
      
      if (item.status === 'delivered') {
        lpoAgg.delivered_items++
      } else if (poInfo.status !== 'cancelled' && (item.status === 'overdue' || (resolvedEta && resolvedEta < today))) {
        lpoAgg.has_overdue = true
        if (resolvedEta && resolvedEta < today) {
           const daysDiff = Math.floor((new Date(today).getTime() - new Date(resolvedEta).getTime()) / (1000 * 60 * 60 * 24));
           lpoAgg.max_days_overdue = Math.max(lpoAgg.max_days_overdue, daysDiff)
        }
      }

      // Add item name to search text if not already included
      if (item.item_name && !lpoAgg.search_text.includes(item.item_name.toLowerCase())) {
        lpoAgg.search_text += ` ${item.item_name.toLowerCase()}`
      }
      
      if (resolvedEta) {
        if (!lpoAgg.earliest_eta || resolvedEta < lpoAgg.earliest_eta) {
          lpoAgg.earliest_eta = resolvedEta
        }
        if (!lpoAgg.latest_eta || resolvedEta > lpoAgg.latest_eta) {
          lpoAgg.latest_eta = resolvedEta
        }
      }
      
      if (item.reminder_count > lpoAgg.reminder_count) {
        lpoAgg.reminder_count = item.reminder_count
      }
      
      if (item.last_reminder_sent && (!lpoAgg.last_reminder_sent || item.last_reminder_sent > lpoAgg.last_reminder_sent)) {
        lpoAgg.last_reminder_sent = item.last_reminder_sent
      }
    }
    
    // Step 3: Check for penalties for these LPOs
    const lpoIds = Array.from(lpoMap.keys())
    if (lpoIds.length > 0) {
      const { data: penalties } = await supabase
        .from('pharmacy_penalties')
        .select('lpo_id')
        .in('lpo_id', lpoIds)
      
      const penaltyLpoIds = new Set(penalties?.map(p => p.lpo_id) || [])
      for (const lpo of lpoMap.values()) {
        if (penaltyLpoIds.has(lpo.lpo_id)) {
          lpo.has_penalties = true
        }
      }
    }

    // Step 4: Final formatting and sorting
    let results: OrderTrackingListItem[] = Array.from(lpoMap.values()).map(lpo => {
      let delivery_progress: DeliveryProgress = 'pending'
      if ((lpo as any).po_status === 'cancelled') {
        delivery_progress = 'cancelled'
      } else if (lpo.has_overdue) {
        delivery_progress = 'overdue'
      } else if (lpo.delivered_items === lpo.total_items && lpo.total_items > 0) {
        delivery_progress = 'fully_delivered'
      } else if (lpo.delivered_items > 0) {
        delivery_progress = 'partially_delivered'
      }
      
      return {
        ...lpo,
        delivery_progress
      }
    })
    
    // Apply client-side filters (for search and status)
    if (filter?.search) {
      const search = filter.search.toLowerCase()
      results = results.filter(r => r.search_text.includes(search))
    }
    
    if (filter?.status && filter.status !== 'all') {
      results = results.filter(r => r.delivery_progress === filter.status)
    }
    
    // Sort by latest ETA (ascending) for pending, descending for overdue
    results.sort((a, b) => {
      if (a.delivery_progress === 'overdue' && b.delivery_progress !== 'overdue') return -1;
      if (a.delivery_progress !== 'overdue' && b.delivery_progress === 'overdue') return 1;
      
      if (a.delivery_progress === 'overdue') {
        return b.max_days_overdue - a.max_days_overdue; // Most overdue first
      }
      
      return new Date(a.latest_eta).getTime() - new Date(b.latest_eta).getTime(); // Soonest ETA first
    })

    // Pagination
    const total = results.length
    const totalPages = Math.ceil(total / pageSize)
    const from = (page - 1) * pageSize
    const data = results.slice(from, from + pageSize)

    return {
      data: { data, total, page, pageSize, totalPages },
      error: null
    }

  } catch (error) {
    console.error('Error fetching order tracking list:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch list' }
  }
}

/**
 * Get detailed tracking info for a specific LPO, including items and reminder history
 */
export async function getOrderTrackingDetail(lpoId: string): Promise<ApiResponse<OrderTrackingDetail>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Database not connected' }
    }

    // Get the LPO base info
    const { data: trackingData, error } = await supabase
      .from('pharmacy_order_tracking')
      .select(`
        *,
        lpo:pharmacy_lpo!inner(
          id, 
          lpo_number, 
          document_date,
          document_url,
          file_hash,
          expected_delivery_date,
          po:pharmacy_purchase_orders!inner(
            id,
            po_number,
            vote_code,
            category,
            vote_activity,
            department,
            order_date,
            expected_delivery_date,
            total_amount,
            created_by,
            approved_by,
            approved_at,
            kkm_contract_number,
            manual_supplier_name,
            supplier:suppliers(
              id,
              company_name,
              email,
              address
            ),
            creator:users!pharmacy_purchase_orders_created_by_fkey(id, full_name),
            approver:users!pharmacy_purchase_orders_approved_by_fkey(id, full_name)
          )
        )
      `)
      .eq('lpo_id', lpoId)

    if (error) throw error
    if (!trackingData || trackingData.length === 0) {
      return { data: null, error: 'Tracking data not found for this LPO' }
    }

    // Get reminder history
    const { data: reminders, error: reminderError } = await supabase
      .from('pharmacy_lpo_reminders')
      .select('*, sender:users!pharmacy_lpo_reminders_sent_by_fkey(full_name)')
      .eq('lpo_id', lpoId)
      .order('sent_at', { ascending: false })

    if (reminderError) throw reminderError

    // Extract common LPO info from the first item
    const firstItem = trackingData[0]
    const lpoInfo = firstItem.lpo as any
    const poInfo = lpoInfo.po

    // Get PO items
    const { data: poItemsRaw, error: poItemsError } = await supabase
      .from('pharmacy_purchase_order_items')
      .select('*')
      .eq('po_id', poInfo.id)

    if (poItemsError) throw poItemsError

    // Fetch names manually for drugs and non-drugs since there's no explicit FK for polymorphic join
    const drugIds = poItemsRaw?.filter(i => i.item_type === 'drug').map(i => i.item_id) || []
    const nonDrugIds = poItemsRaw?.filter(i => i.item_type === 'non_drug').map(i => i.item_id) || []

    let drugsData: any[] = []
    let nonDrugsData: any[] = []

    if (drugIds.length > 0) {
      const { data } = await supabase.from('drugs').select('id, drug_name').in('id', drugIds)
      drugsData = data || []
    }

    if (nonDrugIds.length > 0) {
      const { data } = await supabase.from('non_drugs').select('id, item_name').in('id', nonDrugIds)
      nonDrugsData = data || []
    }

    // Map names to PO items
    const poItems: PurchaseOrderItem[] = (poItemsRaw || []).map(item => {
      let name = item.item_name
      if (!name) {
        if (item.item_type === 'drug') {
          name = drugsData.find(d => d.id === item.item_id)?.drug_name
        } else {
          name = nonDrugsData.find(d => d.id === item.item_id)?.item_name
        }
      }
      return { ...item, item_name: name || item.packaging_description || item.item_id }
    })

    // Fetch Goods Receipts
    let goods_receipts: GoodsReceipt[] = []
    try {
      const grRes = await getGoodsReceiptHistory(poInfo.id)
      if (grRes.data) goods_receipts = grRes.data
    } catch(e) { console.error('Error fetching GRs:', e) }

    // Fetch Credit Notes
    let credit_notes: CreditNote[] = []
    try {
      const { data: cnData } = await supabase
        .from('pharmacy_credit_notes')
        .select('*')
        .eq('po_id', poInfo.id)
        .order('created_at', { ascending: false })
      if (cnData) credit_notes = cnData
    } catch(e) { console.error('Error fetching CNs:', e) }

    // Fetch Approval Logs for accurate creator/approver resolution
    let approvalLogs: any[] = []
    try {
      const { data: logData } = await supabase
        .from('approval_logs')
        .select(`
          *,
          users:users!approval_logs_approved_by_fkey1(full_name)
        `)
        .eq('entity_id', poInfo.id)
        .eq('entity_type', 'purchase_order')
        .order('created_at', { ascending: false })
      if (logData) approvalLogs = logData
    } catch(e) { console.error('Error fetching approval logs:', e) }

    // Fetch Penalties
    let penalties: SupplierPenalty[] = []
    try {
      let penaltyQuery = supabase
        .from('pharmacy_penalties')
        .select('*')
        
      if (poInfo?.id) {
        penaltyQuery = penaltyQuery.or(`po_id.eq.${poInfo.id},lpo_id.eq.${lpoId}`)
      } else {
        penaltyQuery = penaltyQuery.eq('lpo_id', lpoId)
      }

      const { data: penaltyData } = await penaltyQuery
        .order('created_at', { ascending: false })
        
      if (penaltyData) penalties = penaltyData as any
    } catch(e) { console.error('Error fetching penalties:', e) }

    const supplierName = poInfo.supplier?.company_name || poInfo.manual_supplier_name || 'Unknown Supplier'
    const supplierEmail = poInfo.supplier?.email || ''

    // Calculate aggregated stats
    let totalItems = 0
    let deliveredItems = 0
    const firstResolvedEta = lpoInfo.expected_delivery_date || trackingData[0].expected_delivery_date
    let earliestEta = firstResolvedEta
    let latestEta = firstResolvedEta
    let maxDaysOverdue = 0
    let hasOverdue = false
    let maxReminderCount = 0
    let lastReminderSent: string | null = null
    
    const today = new Date().toISOString().split('T')[0]

    const items: OrderTrackingItem[] = trackingData.map(item => {
      totalItems++
      
      // Match with PO item to get the name
      const matchedPoItem = poItems.find(pi => pi.item_id === item.item_id)
      if (matchedPoItem) {
        item.item_name = matchedPoItem.item_name
      }

      const resolvedEta = lpoInfo.expected_delivery_date || item.expected_delivery_date
      item.expected_delivery_date = resolvedEta
      
      if (item.status === 'delivered') {
        deliveredItems++
        item.is_overdue = false
        item.days_overdue = 0
      } else {
        const isPastDue = resolvedEta && resolvedEta < today
        if (item.status === 'overdue' || isPastDue) {
          hasOverdue = true
          item.is_overdue = true
          if (resolvedEta && resolvedEta < today) {
             const daysDiff = Math.floor((new Date(today).getTime() - new Date(resolvedEta).getTime()) / (1000 * 60 * 60 * 24));
             item.days_overdue = daysDiff
             maxDaysOverdue = Math.max(maxDaysOverdue, daysDiff)
          }
        } else {
          item.is_overdue = false
          item.days_overdue = 0
        }
      }
      
      if (resolvedEta) {
        if (!earliestEta || resolvedEta < earliestEta) earliestEta = resolvedEta
        if (!latestEta || resolvedEta > latestEta) latestEta = resolvedEta
      }
      
      if (item.reminder_count > maxReminderCount) maxReminderCount = item.reminder_count
      
      if (item.last_reminder_sent) {
        if (!lastReminderSent || item.last_reminder_sent > lastReminderSent) lastReminderSent = item.last_reminder_sent
      }
      
      // Clean up the object to match type
      const { lpo, ...cleanItem } = item
      return cleanItem as OrderTrackingItem
    })

    let delivery_progress: DeliveryProgress = 'pending'
    if (hasOverdue) {
      delivery_progress = 'overdue'
    } else if (deliveredItems === totalItems && totalItems > 0) {
      delivery_progress = 'fully_delivered'
    } else if (deliveredItems > 0) {
      delivery_progress = 'partially_delivered'
    }

    const result: OrderTrackingDetail = {
      lpo_id: lpoId,
      lpo_number: lpoInfo.lpo_number,
      lpo_date: lpoInfo.document_date,
      document_url: lpoInfo.document_url,
      po_number: poInfo.po_number,
      vote_code: poInfo.vote_code,
      category: poInfo.category,
      kkm_contract_number: poInfo.kkm_contract_number,
      supplier_name: supplierName,
      supplier_email: supplierEmail,
      total_items: totalItems,
      delivered_items: deliveredItems,
      delivery_progress,
      search_text: `${lpoInfo.lpo_number} ${poInfo.po_number} ${supplierName}`.toLowerCase(),
      earliest_eta: earliestEta,
      latest_eta: latestEta,
      max_days_overdue: maxDaysOverdue,
      reminder_count: reminders?.length || 0,
      last_reminder_sent: lastReminderSent || undefined,
      items,
      reminders: reminders || [],
      po_id: poInfo.id,
      total_amount: poInfo.total_amount,
      department: poInfo.department,
      order_date: poInfo.order_date,
      created_by_name: poInfo.creator?.full_name || (Array.isArray(poInfo.creator) ? poInfo.creator[0]?.full_name : null),
      approved_by_name: poInfo.approver?.full_name || (Array.isArray(poInfo.approver) ? poInfo.approver[0]?.full_name : null),
      approved_at: poInfo.approved_at,
      po_items: poItems,
      goods_receipts,
      credit_notes,
      penalties,
      approval_logs: approvalLogs,
      supplier_address: poInfo.supplier?.address || '',
      hospital_name: poInfo.hospital?.name || 'Hospital Lawas',
      hospital_address: poInfo.hospital?.address || 'Jalan Hospital, 98850 Lawas, Sarawak',
      hospital_phone: poInfo.hospital?.phone || '085-283781'
    }

    // Post-process names using logs if needed
    if (approvalLogs.length > 0) {
      // Look for the last approval action
      const approvalLog = approvalLogs.find((l: any) => 
        l.action === 'approved' || 
        l.action === 'auto_approved' || 
        l.action === 'verified'
      )
      
      if (approvalLog) {
        if (!result.approved_by_name || result.approved_by_name === '-') {
          const approverName = approvalLog.users?.full_name 
            || (Array.isArray(approvalLog.users) ? approvalLog.users[0]?.full_name : null)
            || result.created_by_name
            || 'Unknown User'
          result.approved_by_name = approverName
        }
        if (!result.approved_at) {
          result.approved_at = approvalLog.created_at
        }
      }
    }

    return { data: result, error: null }
  } catch (error) {
    console.error('Error fetching tracking detail:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch tracking detail' }
  }
}

/**
 * Helper to convert image URL to base64
 */
async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result as string), false);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Failed to load image for PDF:', e);
    return '';
  }
}

/**
 * Generate and record a reminder for an LPO
 */
export async function sendReminder(
  lpoId: string, 
  userId: string,
  lpoInfo: { 
    lpoNumber: string, 
    poNumber: string, 
    supplierName: string, 
    supplierEmail: string,
    orderDate?: string,
    supplierAddress?: string,
    items?: OrderTrackingItem[],
    poItems?: any[],
    hospitalName?: string,
    hospitalAddress?: string,
    hospitalPhone?: string,
    expected_delivery_date?: string
  },
  reminderType: 'eta' | 'late',
  reminderNumber: number,
  userName?: string,
  userDesignation?: string
): Promise<ApiResponse<LPOReminder>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Database not connected')

    // 1. Generate Real PDF content using jsPDF
    const doc = new jsPDF()
    const fileName = `reminder_${reminderType}_${reminderNumber}_${Date.now()}.pdf`
    
    // Load logo
    const logoBase64 = await getBase64ImageFromUrl('/512px-Jata_MalaysiaV2.svg.png')
    
    // Page settings
    const margin = 20
    const pageWidth = 210
    const contentWidth = pageWidth - (margin * 2)
    
    // Header
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 10, 25, 20)
    }
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(30, 41, 59)
    doc.text("JABATAN KESIHATAN NEGERI SARAWAK", 50, 18)
    doc.text("HOSPITAL LAWAS", 50, 24)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`${lpoInfo.hospitalAddress || 'Jalan Hospital, 98850 Lawas, Sarawak'} • Tel: ${lpoInfo.hospitalPhone || '085-283781'}`, 50, 30)
    
    doc.setDrawColor(30, 41, 59)
    doc.setLineWidth(0.5)
    doc.line(margin, 32, pageWidth - margin, 32)
    
    // To Section
    let currentY = 42
    
    // Recipient
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text("TO:", margin, currentY)
    
    currentY += 6
    doc.setFontSize(11)
    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'bold')
    doc.text("PENGARAH URUSAN", margin, currentY)
    
    currentY += 5
    doc.text(lpoInfo.supplierName.toUpperCase(), margin, currentY)
    
    currentY += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const supplierAddress = lpoInfo.supplierAddress || ''
    const splitAddress = doc.splitTextToSize(supplierAddress, 100)
    doc.text(splitAddress, margin, currentY)
    
    // Ref Box
    const refBoxX = 120
    const refBoxY = 38
    const refBoxWidth = 70
    const refBoxHeight = 20
    
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(refBoxX, refBoxY, refBoxWidth, refBoxHeight, 2, 2, 'FD')
    
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text("Our Ref", refBoxX + 5, refBoxY + 7)
    doc.text("Date", refBoxX + 5, refBoxY + 15)
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(`: ${lpoInfo.lpoNumber}/REM-${reminderNumber}`, refBoxX + 22, refBoxY + 7)
    doc.text(`: ${formatDate(new Date().toISOString())}`, refBoxX + 22, refBoxY + 15)
    
    // Title
    currentY = Math.max(currentY + (splitAddress.length * 5) + 6, 75)
    const isLate = reminderType === 'late'
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    if (isLate) {
      doc.setTextColor(220, 38, 38) // Red
      doc.text(`REMINDER ${reminderNumber}: NOTICE OF LATE DELIVERY`, margin, currentY)
    } else {
      doc.setTextColor(37, 99, 235) // Blue
      doc.text(`REQUEST FOR EXPECTED TIME OF ARRIVAL (ETA)`, margin, currentY)
    }
    
    // Greeting
    currentY += 6
    doc.setFontSize(11)
    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'normal')
    doc.text("Tuan/Puan,", margin, currentY)
    
    // Opening Paragraph
    currentY += 6
    const openingText = isLate 
      ? `Perkara di atas adalah dirujuk. Pihak hospital mendapati bahawa bekalan bagi Pesanan Tempatan (LPO) ${lpoInfo.lpoNumber} masih belum diterima dan telah melebihi tarikh jangkaan penghantaran.`
      : `Perkara di atas adalah dirujuk. Pihak hospital ingin mendapatkan status terkini bagi bekalan item-item di bawah Pesanan Tempatan (LPO) ${lpoInfo.lpoNumber}.`
    
    const splitOpening = doc.splitTextToSize(openingText, contentWidth)
    doc.text(splitOpening, margin, currentY)
    
    // LPO Info Box
    currentY += (splitOpening.length * 6) + 3
    doc.setFillColor(248, 250, 252)
    doc.rect(margin, currentY, contentWidth, 25, 'F')
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(1)
    doc.line(margin, currentY, margin, currentY + 25)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text("LPO Number", margin + 5, currentY + 7)
    doc.text("Order Date", margin + 5, currentY + 14)
    doc.text("PO Number", margin + 5, currentY + 21)
    
    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'bold')
    doc.text(`: ${lpoInfo.lpoNumber}`, margin + 45, currentY + 7)
    doc.text(`: ${lpoInfo.orderDate ? formatDate(lpoInfo.orderDate) : 'N/A'}`, margin + 45, currentY + 14)
    doc.text(`: ${lpoInfo.poNumber}`, margin + 45, currentY + 21)
    
    // Table Header Text
    currentY += 28
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text(isLate ? "SENARAI ITEM BELUM DITERIMA" : "SENARAI ITEM PESANAN", margin, currentY)
    
    // Table
    currentY += 5
    const tableItems = (lpoInfo.poItems || []).map((poItem, index) => {
      const trackingItem = lpoInfo.items?.find(ti => ti.item_id === poItem.item_id)
      const qty = poItem.quantity_ordered || poItem.quantity || 0
      
      let overdueStatus = isLate ? 'Overdue' : 'Pending'
      if (trackingItem) {
        if (trackingItem.status === 'delivered') overdueStatus = 'Delivered'
        else if (trackingItem.days_overdue > 0) overdueStatus = `+${trackingItem.days_overdue} Days`
      }
      
      const etaDate = lpoInfo.expected_delivery_date || trackingItem?.expected_delivery_date || poItem.expected_delivery_date
      
      return [
        index + 1,
        poItem.item_code || 'N/A',
        poItem.item_name || 'N/A',
        qty,
        etaDate ? formatDate(etaDate) : 'N/A',
        overdueStatus
      ]
    })
    
    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Item Code', 'Item Name', 'Qty (Unit)', 'ETA Date', 'Overdue']],
      body: tableItems,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 30 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 25 }
      },
      willDrawCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const text = data.cell.text[0]
          if (text.startsWith('+') || text === 'Pending') {
            // Prevent default text drawing as we will draw a badge in didDrawCell
            data.cell.text = ['']
          }
        }
      },
      didDrawCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          // We need to re-read the original text value if we cleared it in willDrawCell
          // Or we can just use the row data
          const rowData = data.row.raw as any[]
          const text = rowData[5] as string
          
          if (text && text.startsWith('+')) {
            // Draw red badge
            const centerX = data.cell.x + data.cell.width / 2
            const centerY = data.cell.y + data.cell.height / 2
            
            doc.setFillColor(254, 226, 226)
            doc.setDrawColor(239, 68, 68)
            doc.circle(centerX, centerY, 4.5, 'FD')
            
            doc.setTextColor(185, 28, 28)
            doc.setFontSize(7)
            doc.text(text.split(' ')[0], centerX, centerY - 1, { align: 'center' })
            doc.text("Days", centerX, centerY + 2.5, { align: 'center' })
            
            // Clear original text
            data.cell.text = ['']
          } else if (text === 'Pending') {
            const centerX = data.cell.x + data.cell.width / 2
            const centerY = data.cell.y + data.cell.height / 2
            
            doc.setFillColor(219, 234, 254)
            doc.setDrawColor(37, 99, 235)
            doc.roundedRect(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4, 2, 2, 'FD')
            
            doc.setTextColor(30, 64, 175)
            doc.setFontSize(8)
            doc.text("Pending", centerX, centerY + 1, { align: 'center' })
            data.cell.text = ['']
          }
        }
      }
    })
    
    // Bottom Section
    let finalY = (doc as any).lastAutoTable.finalY + 10
    
    // Check if we have enough vertical space for closing text and signature block (approx 110-120mm needed)
    // Page height is 297mm (A4). If finalY is beyond 165mm, push the entire closing block to a new page.
    if (finalY > 165) {
      doc.addPage()
      finalY = 25
    }
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)
    
    const closingText1 = `2. Sehubungan itu, sila maklumkan pihak kami mengenai Tarikh Jangkaan Tiba (ETA) bagi item-item di atas selewat-lewatnya dalam tempoh 3 hari bekerja dari tarikh surat ini.`
    const splitClosing1 = doc.splitTextToSize(closingText1, contentWidth)
    doc.text(splitClosing1, margin, finalY)
    
    finalY += (splitClosing1.length * 6) + 1
    const closingText2 = `3. Pihak kami amat menghargai sekiranya pihak tuan/puan dapat memberikan perhatian segera berhubung perkara ini.`
    const splitClosing2 = doc.splitTextToSize(closingText2, contentWidth)
    doc.text(splitClosing2, margin, finalY)
    
    finalY += (splitClosing2.length * 6) + 3
    doc.text("Kerjasama pihak tuan/puan didahului dengan ucapan terima kasih.", margin, finalY)
    
    finalY += 10
    doc.setFont('helvetica', 'bold')
    doc.text("\"MALAYSIA MADANI\"", margin, finalY)
    finalY += 6
    doc.text("\"BERKHIDMAT UNTUK NEGARA\"", margin, finalY)
    
    finalY += 10
    doc.setFont('helvetica', 'normal')
    doc.text("Saya yang menjalankan amanah,", margin, finalY)
    
    finalY += 32
    doc.setFont('helvetica', 'bold')
    doc.text(`( ${userName?.toUpperCase() || 'TAN YUAN ZHANG'} )`, margin, finalY)
    
    finalY += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(userDesignation || 'Pegawai Farmasi UF 12', margin, finalY)
    
    finalY += 5
    doc.text(`Farmasi Logistik ${lpoInfo.hospitalName || 'Hospital Lawas'}`, margin, finalY)
    
    console.log('Generating PDF outputs...')
    const pdfBlob = doc.output('blob')
    const pdfDataUri = doc.output('datauristring')
    
    // 2. Attempt Upload to Supabase Storage
    const storagePath = `reminders/${lpoId}/${fileName}`
    let finalPdfUrl = pdfDataUri

    try {
      console.log('Attempting storage upload...', storagePath)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lpo-documents')
        .upload(storagePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        })
      
      if (uploadError) {
        console.warn('Storage upload error:', uploadError)
      } else {
        console.log('Storage upload successful:', uploadData.path)
        const { data: { publicUrl } } = supabase.storage
          .from('lpo-documents')
          .getPublicUrl(storagePath)
        finalPdfUrl = publicUrl
      }
    } catch (e) {
      console.warn('Storage upload failed exception:', e)
    }
    
    // Ensure URL is clean if it's a data URI (jsPDF adds a non-standard filename param)
    if (finalPdfUrl.startsWith('data:') && finalPdfUrl.includes(';filename=')) {
      const base64Index = finalPdfUrl.indexOf(';base64')
      if (base64Index !== -1) {
        finalPdfUrl = finalPdfUrl.substring(0, finalPdfUrl.indexOf(';')) + finalPdfUrl.substring(base64Index)
      }
    }

    console.log('Saving reminder record to database...', { urlType: finalPdfUrl.startsWith('data') ? 'DATA_URI' : 'STORAGE_URL' })
    // 3. Insert reminder record
    const { data: reminder, error: insertError } = await supabase
      .from('pharmacy_lpo_reminders')
      .insert({
        lpo_id: lpoId,
        sent_by: userId,
        recipient_email: lpoInfo.supplierEmail,
        recipient_name: lpoInfo.supplierName,
        pdf_url: finalPdfUrl,
        reminder_number: reminderNumber,
        reminder_type: reminderType
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw insertError
    }

    console.log('Updating tracking records...')
    // 4. Update reminder count on LPO items
    const { error: updateError } = await supabase
      .from('pharmacy_order_tracking')
      .update({
        reminder_count: reminderNumber,
        last_reminder_sent: new Date().toISOString()
      })
      .eq('lpo_id', lpoId)

    if (updateError) console.error('Error updating reminder count:', updateError)

    console.log('Reminder process complete!')
    return { data: reminder as LPOReminder, error: null }
  } catch (error) {
    console.error('CRITICAL: Error in sendReminder:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to send reminder' }
  }
}

/**
 * Update tracking item delivery status (usually triggered by receiving module)
 */
export async function updateTrackingItemStatus(
  trackingId: string,
  status: 'pending' | 'overdue' | 'delivered',
  actualDeliveryDate?: string
): Promise<ApiResponse<boolean>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Database not connected')

    const updateData: any = { status, updated_at: new Date().toISOString() }
    
    if (status === 'delivered') {
      updateData.actual_delivery_date = actualDeliveryDate || new Date().toISOString().split('T')[0]
      updateData.is_overdue = false
    }

    const { error } = await supabase
      .from('pharmacy_order_tracking')
      .update(updateData)
      .eq('id', trackingId)

    if (error) throw error
    return { data: true, error: null }
  } catch (error) {
    console.error('Error updating tracking status:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update tracking status' }
  }
}

/**
 * Recalculate overdue statuses based on current date
 * In a real app, this might be a cron job. Here it can be called on page load.
 */
export async function recalculateOverdueStatus(
  hospitalId: string,
  onProgress?: (msg: string) => void
): Promise<ApiResponse<boolean>> {
  try {
    if (!isSupabaseConfigured()) return { data: true, error: null }

    const today = new Date().toISOString().split('T')[0]

    // 1. Synchronize expected_delivery_date of tracking items with their underlying LPO or PO expected delivery dates
    const { data: allTrackingItems, error: trackError } = await supabase
      .from('pharmacy_order_tracking')
      .select(`
        id,
        lpo_id,
        expected_delivery_date,
        order_placed_date,
        lpo:pharmacy_lpo(
          expected_delivery_date,
          document_date,
          po:pharmacy_purchase_orders(
            expected_delivery_date,
            order_date
          )
        )
      `)
      .eq('hospital_id', hospitalId);

    if (!trackError && allTrackingItems) {
      const total = allTrackingItems.length;
      let count = 0;
      for (const item of allTrackingItems) {
        count++;
        if (onProgress && count % 5 === 0) {
          onProgress(`Syncing ETAs (${count}/${total})...`);
        }
        const lpo = item.lpo as any;
        if (!lpo) continue;
        const po = lpo.po as any;
        
        // Calculate the correct ETA
        const baseDateStr = item.order_placed_date || 
          (po?.order_date && lpo?.document_date
            ? (new Date(po.order_date) < new Date(lpo.document_date) ? po.order_date : lpo.document_date)
            : (po?.order_date || lpo?.document_date || new Date().toISOString().split('T')[0]));
        
        let calculatedEta = baseDateStr;
        try {
          const floorDate = '2026-04-20';
          const finalBaseDate = baseDateStr < floorDate ? floorDate : baseDateStr;
          const parsedBaseDate = parseISO(finalBaseDate);
          if (isValid(parsedBaseDate)) {
            calculatedEta = format(addDays(parsedBaseDate, 21), 'yyyy-MM-dd');
          }
        } catch (e) {}

        const correctEta = lpo.expected_delivery_date || po?.expected_delivery_date || calculatedEta;
        
        if (correctEta && item.expected_delivery_date !== correctEta) {
          console.log(`[SYNC ETA] Updating item ${item.id} expected_delivery_date from ${item.expected_delivery_date} to ${correctEta}`);
          await supabase
            .from('pharmacy_order_tracking')
            .update({ 
              expected_delivery_date: correctEta,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
        }
      }
    }

    // Find items that are pending but past their ETA
    const { data: itemsToUpdate, error: fetchError } = await supabase
      .from('pharmacy_order_tracking')
      .select('id, expected_delivery_date')
      .eq('hospital_id', hospitalId)
      .eq('status', 'pending')
      .lt('expected_delivery_date', today)

    if (fetchError) throw fetchError

    if (itemsToUpdate && itemsToUpdate.length > 0) {
      const total = itemsToUpdate.length;
      let count = 0;
      // Update each item with its specific days_overdue
      for (const item of itemsToUpdate) {
        count++;
        if (onProgress && count % 5 === 0) {
          onProgress(`Updating Overdue (${count}/${total})...`);
        }
        const daysDiff = Math.max(0, differenceInDays(new Date(today), parseISO(item.expected_delivery_date)))
        
        await supabase
          .from('pharmacy_order_tracking')
          .update({ 
            status: 'overdue',
            is_overdue: true,
            days_overdue: daysDiff,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)
      }
    }

    // Also refresh days_overdue for items already marked as overdue
    const { data: currentOverdue } = await supabase
      .from('pharmacy_order_tracking')
      .select('id, expected_delivery_date')
      .eq('hospital_id', hospitalId)
      .eq('status', 'overdue')

    if (currentOverdue && currentOverdue.length > 0) {
      const total = currentOverdue.length;
      let count = 0;
      for (const item of currentOverdue) {
        count++;
        if (onProgress && count % 5 === 0) {
          onProgress(`Refreshing Overdue (${count}/${total})...`);
        }
        const daysDiff = Math.max(0, differenceInDays(new Date(today), parseISO(item.expected_delivery_date)))
        await supabase
          .from('pharmacy_order_tracking')
          .update({ 
            days_overdue: daysDiff,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)
      }
    }

    return { data: true, error: null }
  } catch (error) {
    console.error('Error recalculating overdue status:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to recalculate' }
  }
}

/**
 * Delete a reminder record and its associated PDF from storage
 */
export async function deleteReminder(reminderId: string): Promise<ApiResponse<boolean>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Database not connected')

    // 1. Get reminder details to find the PDF URL and LPO ID
    const { data: reminder, error: fetchError } = await supabase
      .from('pharmacy_lpo_reminders')
      .select('lpo_id, pdf_url')
      .eq('id', reminderId)
      .single()

    if (fetchError) throw fetchError
    const lpoId = reminder.lpo_id

    // 2. Delete from storage if it's a Supabase URL
    if (reminder?.pdf_url && reminder.pdf_url.includes('/storage/v1/object/public/lpo-documents/')) {
      // Extract the relative path within the bucket
      const urlParts = reminder.pdf_url.split('/lpo-documents/')
      if (urlParts.length > 1) {
        const fullPath = urlParts[1]
        console.log('Deleting PDF from storage:', fullPath)
        await supabase.storage.from('lpo-documents').remove([fullPath])
      }
    }

    // 3. Delete from database
    const { error: deleteError } = await supabase
      .from('pharmacy_lpo_reminders')
      .delete()
      .eq('id', reminderId)

    if (deleteError) throw deleteError

    // 4. Get the new count of reminders for this LPO
    const { count } = await supabase
      .from('pharmacy_lpo_reminders')
      .select('*', { count: 'exact', head: true })
      .eq('lpo_id', lpoId)
    
    // 5. Update the tracking table with the accurate count
    await supabase
      .from('pharmacy_order_tracking')
      .update({ reminder_count: count || 0 })
      .eq('lpo_id', lpoId)

    return { data: true, error: null }
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to delete reminder' }
  }
}

/**
 * Create initial tracking records for all items in an LPO
 * This is the single source of truth for initializing tracking.
 */
export async function createOrderTrackingForLPO(lpoId: string): Promise<ApiResponse<boolean>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    // 1. Fetch LPO and linked PO with its items
    const { data: lpo, error: lpoError } = await supabase
      .from('pharmacy_lpo')
      .select(`
        *,
        po:pharmacy_purchase_orders(
          *,
          items:pharmacy_purchase_order_items(*)
        )
      `)
      .eq('id', lpoId)
      .maybeSingle()

    if (lpoError) throw lpoError
    if (!lpo) throw new Error('LPO not found')

    // Guard: Only create tracking if a document is actually uploaded
    if (!lpo.document_url) {
      console.warn(`Skipping tracking creation for LPO ${lpo.lpo_number}: No document uploaded.`)
      return { data: true, error: null }
    }

    const po = lpo.po as any
    if (!po) throw new Error('Purchase Order not found for this LPO')

    const items = po.items as any[]
    if (!items || items.length === 0) {
      console.warn(`No items found for PO ${po.id} linked to LPO ${lpoId}`)
      return { data: true, error: null }
    }

    // 2. Determine category (APPL vs CC)
    // APPL = 990102, CC = 080702
    const itemCategory = po.vote_code === '990102' ? 'APPL' : 'CC'

    // 3. Check for existing tracking records to avoid duplicates
    const { data: existing } = await supabase
      .from('pharmacy_order_tracking')
      .select('item_id')
      .eq('lpo_id', lpoId)
    
    const existingItemIds = new Set(existing?.map(e => e.item_id) || [])

    // 4. Prepare tracking records
    const trackingRecords = items
      .filter(item => !existingItemIds.has(item.item_id || item.id))
      .map(item => {
        // Resolve base date for calculation: Earliest of PO order date (system entry) or LPO doc date (physical doc)
        // This ensures the 21-day fulfillment period starts as soon as either document exists.
        const baseDateStr = (po.order_date && lpo.document_date)
          ? (new Date(po.order_date) < new Date(lpo.document_date) ? po.order_date : lpo.document_date)
          : (po.order_date || lpo.document_date || new Date().toISOString().split('T')[0]);
        
        let calculatedEta = baseDateStr;
        try {
          const floorDate = '2026-04-20'
          const finalBaseDate = baseDateStr < floorDate ? floorDate : baseDateStr
          const parsedBaseDate = parseISO(finalBaseDate);
          
          if (isValid(parsedBaseDate)) {
            // Add 21 days offset
            calculatedEta = format(addDays(parsedBaseDate, 21), 'yyyy-MM-dd');
          }
        } catch (e) {
          console.warn(`[ETA CALCULATION] Failed to parse base date ${baseDateStr}`, e);
        }

        const finalEta = lpo.expected_delivery_date || po.expected_delivery_date || calculatedEta;
        
        // Diagnostic Logging to trace ETA
        console.log(`[ETA CALCULATION] Item: ${item.item_name || item.item_code}`);
        console.log(`[ETA CALCULATION] Base Date: ${baseDateStr}`);
        console.log(`[ETA CALCULATION] 21-Day Calculated ETA: ${calculatedEta}`);
        console.log(`[ETA CALCULATION] Final Assigned ETA: ${finalEta} (from LPO: ${lpo.expected_delivery_date}, PO: ${po.expected_delivery_date})`);

        return {
          hospital_id: lpo.hospital_id,
          lpo_id: lpo.id,
          po_id: po.id,
          item_id: item.item_id || item.id,
          item_type: item.item_type,
          item_name: item.item_name || item.packaging_description || 'Unknown Item',
          item_code: item.item_code || '',
          item_category: itemCategory,
          expected_delivery_date: finalEta,
          order_placed_date: baseDateStr,
          status: 'pending',
          is_overdue: false,
          days_overdue: 0,
          reminder_count: 0,
          kkm_contract_number: po.kkm_contract_number
        };
      })

    if (trackingRecords.length === 0) return { data: true, error: null }

    // 5. Insert records
    const { error: insertError } = await supabase
      .from('pharmacy_order_tracking')
      .insert(trackingRecords)

    if (insertError) throw insertError

    return { data: true, error: null }
  } catch (error) {
    console.error('Error creating tracking for LPO:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create tracking' }
  }
}

/**
 * Backfill missing tracking records for verified LPOs
 */
export async function backfillMissingTrackingRecords(
  hospitalId: string,
  onProgress?: (msg: string) => void
): Promise<ApiResponse<{ processed: number, created: number }>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    // 1. Get all verified LPOs for this hospital
    const { data: verifiedLPOs, error: lpoError } = await supabase
      .from('pharmacy_lpo')
      .select('id, lpo_number, po:pharmacy_purchase_orders!inner(category, po_number)')
      .eq('hospital_id', hospitalId)
      .eq('status', 'verified')
      .not('document_url', 'is', null)
      .not('po.category', 'in', '("ALAT TULIS", "Alat Tulis", "PRINTING SERVICE", "BEKALAN MAKANAN")')

    if (lpoError) throw lpoError
    if (!verifiedLPOs || verifiedLPOs.length === 0) return { data: { processed: 0, created: 0 }, error: null }

    // 2. Get LPOs that already have tracking records
    const { data: existingTracking } = await supabase
      .from('pharmacy_order_tracking')
      .select('lpo_id')
      .eq('hospital_id', hospitalId)
    
    const trackedLpoIds = new Set(existingTracking?.map(t => t.lpo_id) || [])

    // 3. Filter LPOs that need tracking
    const missingLpoIds = verifiedLPOs
      .filter(l => l.lpo_number !== (l.po as any)?.po_number)
      .map(l => l.id)
      .filter(id => !trackedLpoIds.has(id))

    if (missingLpoIds.length === 0) return { data: { processed: verifiedLPOs.length, created: 0 }, error: null }

    // 4. Create tracking for each missing LPO
    let createdCount = 0
    const totalMissing = missingLpoIds.length
    for (let i = 0; i < totalMissing; i++) {
      const lpoId = missingLpoIds[i]
      if (onProgress) {
        onProgress(`Creating Trackers (${i + 1}/${totalMissing})...`)
      }
      const res = await createOrderTrackingForLPO(lpoId)
      if (res.data) createdCount++
    }

    return { 
      data: { 
        processed: verifiedLPOs.length, 
        created: createdCount 
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error backfilling tracking records:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to backfill tracking' }
  }
}

/**
 * Automatically fetch, parse, and repair all historical LPOs in the database
 * by extracting their physical dates from PDFs and updating the system ETA and overdue metrics.
 */
export async function repairHistoricalLpoDates(
  hospitalId: string,
  userId: string,
  onProgress?: (msg: string) => void
): Promise<ApiResponse<{ scanned: number; repaired: number }>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    // 1. Get all LPOs that have document URLs but whose expected_delivery_date is NULL
    const { data: targetLPOs, error: lpoError } = await supabase
      .from('pharmacy_lpo')
      .select('id, lpo_number, document_url, po_id')
      .eq('hospital_id', hospitalId)
      .not('document_url', 'is', null)
      .is('expected_delivery_date', null);

    if (lpoError) throw lpoError;
    if (!targetLPOs || targetLPOs.length === 0) {
      return { data: { scanned: 0, repaired: 0 }, error: null };
    }

    const total = targetLPOs.length;
    let repairedCount = 0;

    for (let i = 0; i < total; i++) {
      const lpo = targetLPOs[i];
      if (onProgress) {
        onProgress(`Repairing LPO ${lpo.lpo_number} (${i + 1}/${total})...`);
      }

      try {
        // A. Fetch LPO PDF document
        const response = await fetch(lpo.document_url);
        if (!response.ok) continue;

        const blob = await response.blob();
        const file = new File([blob], 'lpo.pdf', { type: 'application/pdf' });

        // B. Run PDF parser to extract dates
        const extractedDates = await extractDatesFromPdf(file);
        const correctEta = extractedDates.expectedDeliveryDate;
        const documentDate = extractedDates.documentDate;

        if (correctEta) {
          // C. Update LPO in database
          const { error: dbLpoError } = await supabase
            .from('pharmacy_lpo')
            .update({
              expected_delivery_date: correctEta,
              document_date: documentDate || undefined,
              updated_at: new Date().toISOString()
            })
            .eq('id', lpo.id);

          if (dbLpoError) throw dbLpoError;

          // D. Update Order Tracking table items for this LPO
          const { error: dbTrackingError } = await supabase
            .from('pharmacy_order_tracking')
            .update({
              expected_delivery_date: correctEta,
              updated_at: new Date().toISOString()
            })
            .eq('lpo_id', lpo.id);

          if (dbTrackingError) throw dbTrackingError;

          repairedCount++;

          // E. Check and trigger late delivery penalties if received late
          // Fetch any Goods Receipts associated with this LPO
          const { data: grs } = await supabase
            .from('pharmacy_goods_receipts')
            .select('id, receipt_date, po_id')
            .eq('lpo_id', lpo.id);

          if (grs && grs.length > 0) {
            for (const gr of grs) {
              // Fetch Goods Receipt items to check late delivery for each product
              const { data: grItems } = await supabase
                .from('pharmacy_goods_receipt_items')
                .select('item_id, po_item_id')
                .eq('gr_id', gr.id);

              if (grItems && grItems.length > 0) {
                for (const item of grItems) {
                  // Fetch the item details (code, name) from order tracking
                  const { data: trackItem } = await supabase
                    .from('pharmacy_order_tracking')
                    .select('item_code, item_name')
                    .eq('lpo_id', lpo.id)
                    .eq('item_id', item.item_id)
                    .maybeSingle();

                  await checkAndCreateLatePenalty(
                    hospitalId,
                    userId,
                    gr.po_id,
                    gr.id,
                    gr.receipt_date,
                    trackItem?.item_name || undefined,
                    trackItem?.item_code || undefined,
                    lpo.id
                  );
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(`Failed to repair LPO ${lpo.lpo_number}:`, err);
      }
    }

    // 2. Trigger general status recalculation
    if (repairedCount > 0) {
      await recalculateOverdueStatus(hospitalId, onProgress);
    }

    return {
      data: {
        scanned: total,
        repaired: repairedCount
      },
      error: null
    };
  } catch (error) {
    console.error('Error repairing historical LPOs:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to repair LPO dates' };
  }
}

