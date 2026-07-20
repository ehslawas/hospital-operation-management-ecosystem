// @ts-nocheck
import { supabase } from '@/services/supabase'
import { 
  SupplierLPOBreakdown, 
  ETASummary, 
  SupplierLPODetail, 
  DeliveryProgress 
} from '../../types/pharmacy'

export interface ProcurementReportData {
  metadata: {
    hospitalName: string
    dateFrom: string
    dateTo: string
    generatedAt: string
    generatedBy: string
  }
  
  executive: {
    totalPOs: number
    totalValue: number
    completionRate: number
    onTimeDeliveryRate: number
    totalPenalties: number
    totalCreditNotes: number
    avgSupplierScore: number
  }
  
  purchaseOrders: {
    stats: { total: number, value: number, completed: number }
    statusBreakdown: Record<string, number>
    categoryBreakdown: Record<string, number>
    monthlyTrend: { month: string, count: number, value: number }[]
    list: any[]
  }
  
  lpo: {
    stats: { total: number, verified: number, sent: number, pending: number }
    coverageRate: number
    documentStatus: { withDoc: number, withoutDoc: number }
    list: any[]
  }
  
  orderTracking: {
    stats: { total: number, pending: number, partial: number, completed: number, overdue: number }
    overdueAnalysis: { count: number, avgDays: number, maxDays: number }
    reminderStats: { total: number, avgPerLPO: number }
    list: any[]
    supplierBreakdown: SupplierLPOBreakdown[]
    etaSummary: ETASummary
  }
  
  receivedItems: {
    stats: { totalGRs: number, totalItems: number, acceptedItems: number, rejectedItems: number }
    monthlyGRs: { month: string, count: number }[]
    list: any[]
  }
  
  payment: {
    stats: { totalTransactions: number, paidValue: number, outstandingValue: number }
    statusBreakdown: Record<string, number>
    voteCodeBreakdown: Record<string, number>
    list: any[]
  }
  
  creditNotes: {
    stats: { total: number, value: number, pending: number }
    reasonBreakdown: Record<string, number>
    list: any[]
  }
  
  penalties: {
    stats: { total: number, applValue: number, ccValue: number }
    statusBreakdown: Record<string, number>
    list: any[]
  }
  
  lou: {
    stats: { total: number, active: number, expired: number, value: number }
    statusBreakdown: Record<string, number>
    list: any[]
  }
  
  supplierPerformance: {
    stats: { totalEvaluations: number, avgScore: number, avgQuality: number, avgDelivery: number, avgSupport: number }
    distribution: Record<string, number>
    list: any[]
  }
}

export async function generateProcurementReport(
  hospitalId: string, 
  hospitalName: string, 
  userName: string,
  dateFrom: string, 
  dateTo: string
): Promise<{ data: ProcurementReportData | null, error: string | null }> {
  try {
    // We execute bulk queries in parallel for efficiency

    // 1. POs
    const poPromise = supabase
      .from('pharmacy_purchase_orders')
      .select('id, po_number, po_type, status, total_amount, category, vote_code, order_date, manual_supplier_name, supplier:suppliers(company_name)')
      .eq('hospital_id', hospitalId)
      .gte('order_date', dateFrom)
      .lte('order_date', dateTo)
      .not('po_number', 'ilike', 'SQ-%')
      .not('po_number', 'ilike', 'INV-%')

    // 2. LPOs
    const lpoPromise = supabase
      .from('pharmacy_lpo')
      .select('id, lpo_number, status, payment_status, document_date, document_url, verify_tracking, po_id, po:pharmacy_purchase_orders(po_number, total_amount, vote_code, manual_supplier_name, supplier:suppliers(company_name))')
      .eq('hospital_id', hospitalId)
      .gte('document_date', dateFrom)
      .lte('document_date', dateTo)

    // 3. Order Tracking 
    const trackingPromise = supabase
      .from('pharmacy_order_tracking')
      .select(`
        id, 
        lpo_id, 
        status, 
        is_overdue, 
        days_overdue, 
        reminder_count, 
        last_reminder_sent,
        expected_delivery_date, 
        actual_delivery_date, 
        lpo:pharmacy_lpo(
          id,
          lpo_number,
          status,
          document_date,
          document_url,
          expected_delivery_date,
          po:pharmacy_purchase_orders(
            id,
            po_number,
            vote_code,
            category,
            manual_supplier_name,
            supplier:suppliers(
              id,
              company_name
            )
          )
        )
      `)
      .eq('hospital_id', hospitalId)
      
    // 4. Goods Receipts
    const grPromise = supabase
      .from('pharmacy_goods_receipts')
      .select('id, gr_number, receipt_date, status, po_id, lpo_id, po:pharmacy_purchase_orders(manual_supplier_name, supplier:suppliers(company_name)), lpo:pharmacy_lpo(po:pharmacy_purchase_orders(manual_supplier_name, supplier:suppliers(company_name))), items:pharmacy_goods_receipt_items(quantity_received, quantity_accepted, quantity_rejected)')
      .eq('hospital_id', hospitalId)
      .gte('receipt_date', dateFrom)
      .lte('receipt_date', dateTo)

    // 5. Credit Notes
    const cnPromise = supabase
      .from('pharmacy_credit_notes')
      .select('id, cn_number, cn_date, total_amount, reason, status')
      .eq('hospital_id', hospitalId)
      .gte('cn_date', dateFrom)
      .lte('cn_date', dateTo)

    // 6. Penalties
    const penaltyPromise = supabase
      .from('pharmacy_penalties')
      .select('id, penalty_amount, status, penalty_type, days_delayed, item_name, item_code, expected_delivery_date, actual_delivery_date, issue_date, penalty_paid, payment_kaedah, po_id, lpo_id, supplier_id, supplier:suppliers(company_name), purchase_order:pharmacy_purchase_orders(vote_code, manual_supplier_name, supplier:suppliers(company_name)), created_at')
      .eq('hospital_id', hospitalId)
      .gte('created_at', dateFrom)
      .lte('created_at', `${dateTo}T23:59:59.999Z`)

    // 7. LOUs
    const louPromise = supabase
      .from('pharmacy_lou')
      .select('id, lou_number, valid_until, amount, status, created_at')
      .gte('created_at', dateFrom)
      .lte('created_at', `${dateTo}T23:59:59.999Z`)

    // 8. Supplier Assessments
    const evalPromise = supabase
      .from('pharmacy_supplier_assessments')
      .select(`
        id, created_at, percentage, ratings, total_score, performance_level,
        lpo:pharmacy_lpo!inner(
          hospital_id,
          po:pharmacy_purchase_orders(
            id,
            manual_supplier_name,
            total_amount,
            supplier_id,
            supplier:suppliers(id, company_name)
          )
        )
      `)
      .eq('lpo.hospital_id', hospitalId)
      .gte('created_at', dateFrom)
      .lte('created_at', `${dateTo}T23:59:59.999Z`)

    // Await all
    const [poRes, lpoRes, trackingRes, grRes, cnRes, penaltyRes, louRes, evalRes] = await Promise.all([
      poPromise, lpoPromise, trackingPromise, grPromise, cnPromise, penaltyPromise, louPromise, evalPromise
    ])

    // --- AGGREGATION LOGIC ---

    // 1. Purchase Orders
    const pos = poRes.data || []
    let poTotalValue = 0
    let poCompleted = 0
    const poStatusCount: Record<string, number> = {}
    const poCategoryCount: Record<string, number> = {}
    const poMonthly: Record<string, { count: number, value: number }> = {}

// --- Category Mapping Helper ---
const CATEGORY_LABELS: Record<string, string> = {
  drug: 'Drug',
  non_drug: 'Non Drug',
  non_standard: 'Non Standard',
  reagent: 'Reagent',
  vaccine: 'Vaccine',
  insulin: 'Insulin',
  hepc: 'HepC',
  medical_oxygen: 'Medical Oxygen',
  sglt2: 'SGLT-2',
  pathologist: 'Pathologist',
  medical_cylinder: 'Medical Cylinder',
  x_ray: 'X-Ray',
}

function normalizeCategory(cat: string | null): string {
  if (!cat) return 'non_drug'
  const normalized = cat.trim().toLowerCase()
  
  if (['drug', 'drugs'].includes(normalized)) return 'drug'
  if (['non_drug', 'non_drugs', 'non-drug', 'non-drugs'].includes(normalized)) return 'non_drug'
  if (['non_standard', 'non-standard', 'non standard'].includes(normalized)) return 'non_standard'
  if (['reagent', 'reagents'].includes(normalized)) return 'reagent'
  if (['vaccine', 'vaccines', 'vaksin'].includes(normalized)) return 'vaccine'
  if (['insulin'].includes(normalized)) return 'insulin'
  if (['hepc', 'hep-c', 'hep c'].includes(normalized)) return 'hepc'
  if (['medical_oxygen', 'oxygen', 'oksigen'].includes(normalized)) return 'medical_oxygen'
  if (['sglt2', 'sglt-2'].includes(normalized)) return 'sglt2'
  if (['pathologist', 'patologi'].includes(normalized)) return 'pathologist'
  if (['medical_cylinder', 'silinder'].includes(normalized)) return 'medical_cylinder'
  if (['x_ray', 'xray', 'x-ray'].includes(normalized)) return 'x_ray'
  
  const isStationery = /tulis|alat|pejabat|cetak|printing|stationery|paper|kertas/i.test(normalized)
  const isComputer = /komputer|computer|it|software|hardware/i.test(normalized)
  const isGeneral = /am|lain|general|others|unknown/i.test(normalized)
  const isFood = /makanan|minuman|food|beverage/i.test(normalized)
  const isScientific = /saintifik|penyelidikan|scientific|research/i.test(normalized)

  if (isStationery || isComputer || isGeneral || isFood) return 'non_drug'
  if (isScientific) return 'non_standard'

  return 'non_drug'
}

    pos.forEach(po => {
      poTotalValue += po.total_amount || 0
      if (po.status === 'completed') poCompleted++
      
      poStatusCount[po.status] = (poStatusCount[po.status] || 0) + 1
      
      const rawCat = po.category || 'UNKNOWN'
      const normCat = normalizeCategory(rawCat)
      const displayCat = CATEGORY_LABELS[normCat] || 'Non Drug'
      poCategoryCount[displayCat] = (poCategoryCount[displayCat] || 0) + 1
      
      if (po.order_date) {
        const monthStr = po.order_date.substring(0, 7) // YYYY-MM
        if (!poMonthly[monthStr]) poMonthly[monthStr] = { count: 0, value: 0 }
        poMonthly[monthStr].count++
        poMonthly[monthStr].value += po.total_amount || 0
      }
    })

    const poMonthlyTrend = Object.keys(poMonthly).sort().map(m => ({ month: m, count: poMonthly[m].count, value: poMonthly[m].value }))

    // 2. LPOs & Payments
    const lpos = lpoRes.data || []
    let lpoVerified = 0, lpoSent = 0, lpoPending = 0
    let lpoWithDoc = 0, lpoWithoutDoc = 0
    let paymentPaidValue = 0, paymentOutstandingValue = 0
    const paymentStatusCount: Record<string, number> = {}
    const paymentVoteCount: Record<string, number> = {}

    lpos.forEach(lpo => {
      // LPO Stats
      if (lpo.status === 'verified') lpoVerified++
      else if (lpo.status === 'sent') lpoSent++
      else lpoPending++
      
      if (lpo.document_url) lpoWithDoc++
      else lpoWithoutDoc++
      
      // Payment Stats
      const pStatus = lpo.payment_status || 'pending'
      paymentStatusCount[pStatus] = (paymentStatusCount[pStatus] || 0) + 1
      
      const poObj = Array.isArray(lpo.po) ? lpo.po[0] : lpo.po
      const amt = poObj?.total_amount || 0
      const vote = poObj?.vote_code || 'UNKNOWN'
      
      if (pStatus === 'paid') {
        paymentPaidValue += amt
      } else if (pStatus === 'sent_for_payment') {
        paymentOutstandingValue += amt
      }
      
      paymentVoteCount[vote] = (paymentVoteCount[vote] || 0) + 1
    })

    // 3. Order Tracking (LPO-level aggregation)
    const rawTracking = trackingRes.data || []
    
    // Group raw items by lpo_id first
    const lpoGroupMap = new Map<string, {
      lpo_id: string
      lpo_number: string
      document_date: string
      document_url: string
      expected_delivery_date: string
      po_number: string
      vote_code: string
      category: string
      supplier_name: string
      total_items: number
      delivered_items: number
      has_overdue: boolean
      max_days_overdue: number
      reminder_count: number
      last_reminder_sent?: string
      po_status: string
      raw_items: any[]
    }>()

    const todayStr = new Date().toISOString().split('T')[0]

    for (const item of rawTracking) {
      const lpoInfo = item.lpo as any
      if (!lpoInfo || !lpoInfo.po) continue
      const poInfo = lpoInfo.po

      // Strict filters (similar to getOrderTrackingList):
      // Only track if verified LPO, allowed vote code (080702 / 990102), has document URL, allowed category, PO status approved/completed/etc.
      if (!lpoInfo.document_url || lpoInfo.status !== 'verified' || (poInfo.vote_code !== '080702' && poInfo.vote_code !== '990102')) {
        continue
      }
      if (poInfo.category && ["ALAT TULIS", "Alat Tulis", "PRINTING SERVICE", "BEKALAN MAKANAN"].includes(poInfo.category.toUpperCase())) {
        continue
      }
      if (!['approved', 'cancelled', 'completed', 'partial_received'].includes(poInfo.status)) {
        continue
      }

      const supplierName = poInfo.supplier?.company_name || poInfo.manual_supplier_name || 'Unknown Supplier'

      if (!lpoGroupMap.has(item.lpo_id)) {
        lpoGroupMap.set(item.lpo_id, {
          lpo_id: item.lpo_id,
          lpo_number: lpoInfo.lpo_number,
          document_date: lpoInfo.document_date || '',
          document_url: lpoInfo.document_url || '',
          expected_delivery_date: lpoInfo.expected_delivery_date || item.expected_delivery_date || '',
          po_number: poInfo.po_number || '',
          vote_code: poInfo.vote_code || '',
          category: poInfo.category || '',
          supplier_name: supplierName,
          total_items: 0,
          delivered_items: 0,
          has_overdue: false,
          max_days_overdue: item.days_overdue || 0,
          reminder_count: item.reminder_count || 0,
          last_reminder_sent: item.last_reminder_sent,
          po_status: poInfo.status,
          raw_items: []
        })
      }

      const lpoAgg = lpoGroupMap.get(item.lpo_id)!
      lpoAgg.total_items++
      lpoAgg.raw_items.push(item)

      const resolvedEta = lpoInfo.expected_delivery_date || item.expected_delivery_date

      if (item.status === 'delivered') {
        lpoAgg.delivered_items++
      } else if (poInfo.status !== 'cancelled' && (item.status === 'overdue' || (resolvedEta && resolvedEta < todayStr))) {
        lpoAgg.has_overdue = true
        if (resolvedEta && resolvedEta < todayStr) {
          const daysDiff = Math.floor((new Date(todayStr).getTime() - new Date(resolvedEta).getTime()) / (1000 * 60 * 60 * 24));
          lpoAgg.max_days_overdue = Math.max(lpoAgg.max_days_overdue, daysDiff)
        }
      }

      if (item.reminder_count > lpoAgg.reminder_count) {
        lpoAgg.reminder_count = item.reminder_count
      }
    }

    // Now format aggregated LPOs and map their delivery_progress
    const lpoList = Array.from(lpoGroupMap.values()).map(lpo => {
      let delivery_progress: DeliveryProgress = 'pending'
      if (lpo.po_status === 'cancelled') {
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

    // Now perform supplier aggregation and ETA analysis based on our list of formatted LPOs!
    const trackingSupplierMap = new Map<string, SupplierLPOBreakdown>()
    
    // ETA Summary setup
    let approachingETACount = 0
    let pastETACount = 0
    let noETACount = 0
    const etaLPOs: SupplierLPODetail[] = []
    const lateLPOs: SupplierLPODetail[] = []

    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split('T')[0]

    for (const lpo of lpoList) {
      const supplierName = lpo.supplier_name
      if (!trackingSupplierMap.has(supplierName)) {
        trackingSupplierMap.set(supplierName, {
          supplierName,
          totalLPOs: 0,
          lateLPOs: 0,
          fullyArrivedLPOs: 0,
          partiallyArrivedLPOs: 0,
          pendingLPOs: 0,
          avgDaysOverdue: 0,
          maxDaysOverdue: 0,
          totalReminders: 0,
          onTimeRate: 0,
          lpoDetails: []
        })
      }

      const sup = trackingSupplierMap.get(supplierName)!
      sup.totalLPOs++
      sup.totalReminders += lpo.reminder_count

      const lpoDetail: SupplierLPODetail = {
        lpoNumber: lpo.lpo_number,
        poNumber: lpo.po_number,
        status: lpo.delivery_progress,
        expectedDeliveryDate: lpo.expected_delivery_date,
        actualDeliveryDate: undefined,
        daysOverdue: lpo.max_days_overdue,
        deliveredItems: lpo.delivered_items,
        totalItems: lpo.total_items,
        reminderCount: lpo.reminder_count,
        voteCode: lpo.vote_code,
        category: lpo.category
      }

      sup.lpoDetails.push(lpoDetail)

      // ETA analysis
      const eta = lpo.expected_delivery_date
      if (lpo.delivery_progress !== 'fully_delivered' && lpo.delivery_progress !== 'cancelled') {
        if (!eta) {
          noETACount++
        } else if (eta < todayStr) {
          pastETACount++
          lateLPOs.push(lpoDetail)
        } else if (eta <= sevenDaysFromNowStr) {
          approachingETACount++
          etaLPOs.push(lpoDetail)
        }
      }

      // Supplier breakdown count update
      if (lpo.delivery_progress === 'overdue') {
        sup.lateLPOs++
        sup.maxDaysOverdue = Math.max(sup.maxDaysOverdue, lpo.max_days_overdue)
      } else if (lpo.delivery_progress === 'fully_delivered') {
        sup.fullyArrivedLPOs++
      } else if (lpo.delivery_progress === 'partially_delivered') {
        sup.partiallyArrivedLPOs++
      } else if (lpo.delivery_progress === 'pending') {
        sup.pendingLPOs++
      }
    }

    // Post-process supplier breakdowns (onTimeRate, avgDaysOverdue)
    trackingSupplierMap.forEach(sup => {
      sup.onTimeRate = sup.totalLPOs > 0 ? (sup.fullyArrivedLPOs / sup.totalLPOs) * 100 : 0
      // Calculate avg overdue days for late LPOs
      let totalOverdueDaysForSupplier = 0
      let lateCountForSupplier = 0
      sup.lpoDetails.forEach(d => {
        if (d.status === 'overdue' && d.daysOverdue > 0) {
          totalOverdueDaysForSupplier += d.daysOverdue
          lateCountForSupplier++
        }
      })
      sup.avgDaysOverdue = lateCountForSupplier > 0 ? totalOverdueDaysForSupplier / lateCountForSupplier : 0
    })

    const supplierBreakdown = Array.from(trackingSupplierMap.values())
    const etaSummary: ETASummary = {
      approachingETA: approachingETACount,
      pastETA: pastETACount,
      noETA: noETACount,
      etaLPOs,
      lateLPOs
    }

    // Overdue analysis and summary metrics based on LPO-level aggregation
    let trkPending = 0, trkPartial = 0, trkCompleted = 0, trkOverdueCount = 0
    let totalOverdueDays = 0, maxOverdueDays = 0
    let totalReminders = 0

    lpoList.forEach(lpo => {
      if (lpo.delivery_progress === 'pending') trkPending++
      else if (lpo.delivery_progress === 'partially_delivered') trkPartial++
      else if (lpo.delivery_progress === 'fully_delivered') trkCompleted++
      else if (lpo.delivery_progress === 'overdue') trkOverdueCount++

      if (lpo.delivery_progress === 'overdue') {
        totalOverdueDays += lpo.max_days_overdue
        maxOverdueDays = Math.max(maxOverdueDays, lpo.max_days_overdue)
      }
      totalReminders += lpo.reminder_count
    })

    // 4. Goods Receipts
    const grs = grRes.data || []
    let totalItems = 0, acceptedItems = 0, rejectedItems = 0
    const grMonthly: Record<string, number> = {}

    grs.forEach(gr => {
      if (gr.receipt_date) {
        const monthStr = gr.receipt_date.substring(0, 7)
        grMonthly[monthStr] = (grMonthly[monthStr] || 0) + 1
      }
      
      const items = gr.items || []
      items.forEach((item: any) => {
        totalItems += (item.quantity_received || 0)
        acceptedItems += (item.quantity_accepted || 0)
        rejectedItems += (item.quantity_rejected || 0)
      })
    })
    const grMonthlyArr = Object.keys(grMonthly).sort().map(m => ({ month: m, count: grMonthly[m] }))

    // 5. Credit Notes
    const cns = cnRes.data || []
    let cnValue = 0, cnPendingCount = 0
    const cnReasonCount: Record<string, number> = {}

    cns.forEach(cn => {
      cnValue += cn.total_amount || 0
      if (cn.status !== 'approved' && cn.status !== 'applied') cnPendingCount++
      cnReasonCount[cn.reason] = (cnReasonCount[cn.reason] || 0) + 1
    })

    // 6. Penalties
    const penalties = penaltyRes.data || []
    let applPenaltyValue = 0, ccPenaltyValue = 0
    const penaltyStatusCount: Record<string, number> = {}

    penalties.forEach(pen => {
      const poObj = Array.isArray(pen.purchase_order) ? pen.purchase_order[0] : pen.purchase_order
      const vote = poObj?.vote_code || ''
      if (vote === '990102') applPenaltyValue += pen.penalty_amount || 0
      else ccPenaltyValue += pen.penalty_amount || 0
      
      penaltyStatusCount[pen.status] = (penaltyStatusCount[pen.status] || 0) + 1
    })

    // 7. LOU
    const lous = louRes.data || []
    let louActive = 0, louExpired = 0, louValue = 0
    const louStatusCount: Record<string, number> = {}

    lous.forEach(lou => {
      louValue += lou.amount || 0
      if (lou.status === 'active' || lou.status === 'issued') louActive++
      else if (lou.status === 'expired') louExpired++
      
      louStatusCount[lou.status] = (louStatusCount[lou.status] || 0) + 1
    })

    // 8. Supplier Assessments
    // 8. Supplier Assessments
    const evals = evalRes.data || []
    let totalScore = 0, totalQuality = 0, totalDelivery = 0, totalSupport = 0
    const evalDistribution: Record<string, number> = {}

    evals.forEach(ev => {
      totalScore += ev.percentage || 0
      totalQuality += ev.ratings?.quality || 0
      totalDelivery += ev.ratings?.delivery || 0
      totalSupport += ev.ratings?.support || 0
      
      evalDistribution[ev.performance_level || 'UNKNOWN'] = (evalDistribution[ev.performance_level || 'UNKNOWN'] || 0) + 1
    })
    
    const evalCount = evals.length || 1 // Avoid divide by zero

    // Map to aggregate supplier performance stats
    const supplierMap = new Map<string, {
      name: string
      totalCost: number
      poCount: number
      lpoCount: number
      doCount: number
      lateCount: number
      penaltyCount: number
      scores: number[]
      levels: string[]
      qualities: number[]
      deliveries: number[]
      supports: number[]
    }>()

    const ensureSupplier = (supplierName: string) => {
      if (!supplierName || supplierName.trim() === '') return
      if (!supplierMap.has(supplierName)) {
        supplierMap.set(supplierName, {
          name: supplierName,
          totalCost: 0,
          poCount: 0,
          lpoCount: 0,
          doCount: 0,
          lateCount: 0,
          penaltyCount: 0,
          scores: [],
          levels: [],
          qualities: [],
          deliveries: [],
          supports: []
        })
      }
    }

    // Step 1: Scan all evaluations to register evaluations and basic scores
    evals.forEach(ev => {
      const evAny = ev as any
      const lpoObj = Array.isArray(evAny.lpo) ? evAny.lpo[0] : evAny.lpo
      const poObj = Array.isArray(lpoObj?.po) ? lpoObj.po[0] : lpoObj?.po
      const supplierName = poObj?.manual_supplier_name || (Array.isArray(poObj?.supplier) ? poObj.supplier[0]?.company_name : poObj?.supplier?.company_name) || 'Direct Procurement'
      
      ensureSupplier(supplierName)
      const sup = supplierMap.get(supplierName)!
      sup.scores.push(ev.percentage || ev.total_score || 0)
      if (ev.performance_level) {
        sup.levels.push(ev.performance_level)
      }
      sup.qualities.push(ev.ratings?.quality || 0)
      sup.deliveries.push(ev.ratings?.delivery || 0)
      sup.supports.push(ev.ratings?.support || 0)
    })

    // Scan POs to ensure all active suppliers in the period are present
    pos.forEach(po => {
      const poAny = po as any
      const supplierName = poAny.manual_supplier_name || (Array.isArray(poAny.supplier) ? poAny.supplier[0]?.company_name : poAny.supplier?.company_name) || 'Direct Procurement'
      ensureSupplier(supplierName)
    })

    // Step 2: Loop over ALL LPOs in the report's date range to aggregate total LPOs and cost
    lpos.forEach(lpo => {
      const lpoAny = lpo as any
      const poObj = Array.isArray(lpoAny.po) ? lpoAny.po[0] : lpoAny.po
      const supplierName = poObj?.manual_supplier_name || (Array.isArray(poObj?.supplier) ? poObj.supplier[0]?.company_name : poObj?.supplier?.company_name) || 'Direct Procurement'
      
      ensureSupplier(supplierName)
      const sup = supplierMap.get(supplierName)!
      sup.totalCost += poObj?.total_amount || 0
      sup.lpoCount++
      sup.poCount++
    })

    // Step 3: Loop over ALL Goods Receipts (DOs) in the date range to count total DOs
    grs.forEach(gr => {
      const grAny = gr as any
      const lpoObj = Array.isArray(grAny.lpo) ? grAny.lpo[0] : grAny.lpo
      const poObj = Array.isArray(grAny.po) ? grAny.po[0] : (grAny.po || lpoObj?.po)
      const supplierName = poObj?.manual_supplier_name || (Array.isArray(poObj?.supplier) ? poObj.supplier[0]?.company_name : poObj?.supplier?.company_name) || 'Direct Procurement'
      
      ensureSupplier(supplierName)
      const sup = supplierMap.get(supplierName)!
      sup.doCount++
    })

    // Step 4: Loop over ALL Penalties in the date range to count total penalty cases
    penalties.forEach(pen => {
      const penAny = pen as any
      const poObj = Array.isArray(penAny.purchase_order) ? penAny.purchase_order[0] : penAny.purchase_order
      const supplierName = penAny.supplier?.company_name || poObj?.manual_supplier_name || (Array.isArray(poObj?.supplier) ? poObj.supplier[0]?.company_name : poObj?.supplier?.company_name) || 'Direct Procurement'
      
      ensureSupplier(supplierName)
      const sup = supplierMap.get(supplierName)!
      sup.penaltyCount++
    })

    // Step 5: Loop over ALL Order Tracking records in the date range to count total late deliveries
    rawTracking.forEach(trk => {
      const trkAny = trk as any
      const lpoObj = Array.isArray(trkAny.lpo) ? trkAny.lpo[0] : trkAny.lpo
      const poObj = Array.isArray(lpoObj?.po) ? lpoObj.po[0] : lpoObj?.po
      const supplierName = poObj?.manual_supplier_name || (Array.isArray(poObj?.supplier) ? poObj.supplier[0]?.company_name : poObj?.supplier?.company_name) || 'Direct Procurement'
      
      ensureSupplier(supplierName)
      const sup = supplierMap.get(supplierName)!
      const isLate = trk.is_overdue || trk.status === 'overdue' || (trk.days_overdue && trk.days_overdue > 0)
      if (isLate) {
        sup.lateCount++
      }
    })

    // Step 6: Assemble finalized assessed supplier entries
    const supplierList = Array.from(supplierMap.values()).map(sup => {
      const avgScore = sup.scores.length > 0 ? (sup.scores.reduce((a, b) => a + b, 0) / sup.scores.length) : 0
      
      let level = 'Belum Dinilai'
      let analysis = 'Tiada penilaian prestasi direkodkan untuk pembekal ini.'
      
      if (sup.scores.length > 0) {
        if (avgScore < 60) {
          level = 'Tidak Memuaskan'
          analysis = 'Under compliance review. Direct quality deficiencies identified.'
        } else if (avgScore < 80) {
          level = 'Memuaskan'
          analysis = 'Good standard. Consistent delivery, with minor quality delays.'
        } else {
          level = 'Sangat Memuaskan'
          analysis = 'Excellent performance. Meets and exceeds all clinical delivery terms.'
        }
      }

      const avgQuality = sup.qualities.length > 0 ? (sup.qualities.reduce((a, b) => a + b, 0) / sup.qualities.length) : 0
      const avgDelivery = sup.deliveries.length > 0 ? (sup.deliveries.reduce((a, b) => a + b, 0) / sup.deliveries.length) : 0
      const avgSupport = sup.supports.length > 0 ? (sup.supports.reduce((a, b) => a + b, 0) / sup.supports.length) : 0

      return {
        supplierName: sup.name,
        score: avgScore,
        itemsCount: sup.poCount * 12, // Standard catalog items metric
        poCount: sup.poCount,
        lpoCount: sup.lpoCount, 
        doCount: sup.doCount,
        lateCount: sup.lateCount,
        penaltyCount: sup.penaltyCount,
        cost: sup.totalCost,
        level,
        analysis,
        quality: Number(avgQuality.toFixed(1)),
        delivery: Number(avgDelivery.toFixed(1)),
        support: Number(avgSupport.toFixed(1))
      }
    })

    // Final Assembly
    const data: ProcurementReportData = {
      metadata: {
        hospitalName,
        dateFrom,
        dateTo,
        generatedAt: new Date().toISOString(),
        generatedBy: userName
      },
      executive: {
        totalPOs: pos.length,
        totalValue: poTotalValue,
        completionRate: pos.length > 0 ? (poCompleted / pos.length) * 100 : 0,
        onTimeDeliveryRate: rawTracking.length > 0 ? ((rawTracking.length - trkOverdueCount) / rawTracking.length) * 100 : 100, // naive
        totalPenalties: penalties.length,
        totalCreditNotes: cns.length,
        avgSupplierScore: evals.length > 0 ? (totalScore / evalCount) : 0
      },
      purchaseOrders: {
        stats: { total: pos.length, value: poTotalValue, completed: poCompleted },
        statusBreakdown: poStatusCount,
        categoryBreakdown: poCategoryCount,
        monthlyTrend: poMonthlyTrend,
        list: pos
      },
      lpo: {
        stats: { total: lpos.length, verified: lpoVerified, sent: lpoSent, pending: lpoPending },
        coverageRate: pos.length > 0 ? (lpos.length / pos.length) * 100 : 0,
        documentStatus: { withDoc: lpoWithDoc, withoutDoc: lpoWithoutDoc },
        list: lpos
      },
      orderTracking: {
        stats: { total: rawTracking.length, pending: trkPending, partial: trkPartial, completed: trkCompleted, overdue: trkOverdueCount },
        overdueAnalysis: { count: trkOverdueCount, avgDays: trkOverdueCount > 0 ? totalOverdueDays / trkOverdueCount : 0, maxDays: maxOverdueDays },
        reminderStats: { total: totalReminders, avgPerLPO: rawTracking.length > 0 ? totalReminders / rawTracking.length : 0 },
        list: rawTracking,
        supplierBreakdown,
        etaSummary
      },
      receivedItems: {
        stats: { totalGRs: grs.length, totalItems, acceptedItems, rejectedItems },
        monthlyGRs: grMonthlyArr,
        list: grs
      },
      payment: {
        stats: { totalTransactions: lpos.length, paidValue: paymentPaidValue, outstandingValue: paymentOutstandingValue },
        statusBreakdown: paymentStatusCount,
        voteCodeBreakdown: paymentVoteCount,
        list: lpos.filter(l => l.payment_status === 'paid' || l.payment_status === 'sent_for_payment')
      },
      creditNotes: {
        stats: { total: cns.length, value: cnValue, pending: cnPendingCount },
        reasonBreakdown: cnReasonCount,
        list: cns
      },
      penalties: {
        stats: { total: penalties.length, applValue: applPenaltyValue, ccValue: ccPenaltyValue },
        statusBreakdown: penaltyStatusCount,
        list: penalties
      },
      lou: {
        stats: { total: lous.length, active: louActive, expired: louExpired, value: louValue },
        statusBreakdown: louStatusCount,
        list: lous
      },
      supplierPerformance: {
        stats: { 
          totalEvaluations: evals.length, 
          avgScore: evals.length > 0 ? totalScore / evalCount : 0, 
          avgQuality: evals.length > 0 ? totalQuality / evalCount : 0, 
          avgDelivery: evals.length > 0 ? totalDelivery / evalCount : 0,
          avgSupport: evals.length > 0 ? totalSupport / evalCount : 0
        },
        distribution: evalDistribution,
        list: supplierList
      }
    }

    return { data, error: null }
  } catch (err: any) {
    console.error('generateProcurementReport error', err)
    return { data: null, error: err.message || 'Failed to generate report' }
  }
}
