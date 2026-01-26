/**
 * Pharmacy Procurement Service
 * Handles purchase orders, goods receipts, and supplier management
 */

import { supabase } from '../supabase'
import {
  checkApprovalNeeded,
  createApprovalRequest
} from '@/services/approvalService';
import { canUserApprovePurchaseOrder } from '@/services/approvalRouteService';
import { syncSinglePOToAPPLAllocation } from './applAllocationService'
import { syncSinglePOToCCAllocation } from './ccAllocationService'
import { getPharmacyPOSignatures, DEPT_CODE_MAPPING } from './pharmacySettingsService'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  PurchaseOrder,
  PurchaseOrderWithRelations,
  GoodsReceipt,
  Supplier,
  SupplierWithRelations,
  ProcurementFilter,
  PurchaseOrderFormData,
  GoodsReceiptFormData,
  OrderTracking,
  ProcurementStats,
} from '@/types/pharmacy'
import { getCached, setCache, invalidateCache, CACHE_TTL } from '@/lib/queryCache'

// =====================================================
// PURCHASE ORDER MANAGEMENT
// =====================================================

/**
 * Get all purchase orders with optional filtering
 */


/**
 * Get procurement statistics
 */
export async function getProcurementStats(hospitalId: string): Promise<ApiResponse<ProcurementStats>> {
  // Check cache first
  const cacheKey = `procurement-stats-${hospitalId}`
  const cached = getCached<ProcurementStats>(cacheKey)
  if (cached) {
    return { data: cached, error: null }
  }

  try {
    const currentYear = new Date().getFullYear()
    const startDate = `${currentYear}-01-01`
    const endDate = `${currentYear}-12-31`

    // Fetch all POs (lightweight query) to calculate stats
    // We only need specific fields for aggregation
    // Filter by current year and relevant vote codes to match Warrant/Allocation logic
    const { data, error } = await supabase
      .from('pharmacy_purchase_orders')
      .select('id, status, total_amount, category, department, vote_code, vote_activity, po_type')
      .eq('hospital_id', hospitalId)
      .gte('order_date', startDate)
      .lte('order_date', endDate)
      .neq('status', 'cancelled')

    if (error) throw error

    const orders = (data || []) as any[]
    const poIds = orders.map(o => o.id)

    let totalItems = 0
    const itemsBreakdown: Record<string, number> = {}

    let itemsData: { id: string, item_type: string, po_id: string }[] = []

    if (poIds.length > 0) {
      // Fetch items for these POs
      const { data, error: itemsError } = await supabase
        .from('pharmacy_purchase_order_items')
        .select('id, item_type, po_id')
        .in('po_id', poIds)

      if (!itemsError && data) {
        itemsData = data
        // Count distinct line items instead of summing quantities
        totalItems = itemsData.length

        // Calculate breakdown
        itemsData.forEach(item => {
          const type = item.item_type === 'drug' ? 'Drugs' :
            item.item_type === 'non_drug' ? 'Non-Drugs' : 'Others'
          itemsBreakdown[type] = (itemsBreakdown[type] || 0) + 1
        })
      }
    }

    // CRITICAL: Calculate Total Purchase Value from Expense Tables
    // This ensures 100% alignment with Warrant Dashboard
    const { data: ccExpenses } = await supabase
      .from('pharmacy_cc_expenses')
      .select('amount')
      .eq('hospital_id', hospitalId)
      .eq('fiscal_year', currentYear)
      .neq('status', 'cancelled')

    const { data: applExpenses } = await supabase
      .from('pharmacy_appl_expenses')
      .select('amount')
      .eq('hospital_id', hospitalId)
      .eq('fiscal_year', currentYear)
      .neq('status', 'cancelled')

    const totalValue = (ccExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0) +
      (applExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0)

    const stats: ProcurementStats = {
      total_orders: orders.filter(o => o.po_type !== 'sq').length,
      total_value: totalValue,
      pending_orders: orders.filter(o => ['draft', 'pending_approval', 'approved', 'sent'].includes(o.status) && o.po_type !== 'sq').length,
      completed_orders: orders.filter(o => ['completed', 'received'].includes(o.status)).length,
      total_items: totalItems,
      items_breakdown: itemsBreakdown,
      by_status: {},
      by_category: {},
      by_department: {},
      by_vote_code: {},
      // New breakdown for alignment
      total_sq: orders.filter(o => o.po_type === 'sq').length,
      total_regular_po: orders.filter(o => o.po_type !== 'sq').length
    }

    // Calculate breakdowns
    orders.forEach(order => {
      // Status
      stats.by_status[order.status] = (stats.by_status[order.status] || 0) + 1

      // Category
      if (order.category) {
        stats.by_category[order.category] = (stats.by_category[order.category] || 0) + 1
      }

      // Department
      if (order.department) {
        stats.by_department[order.department] = (stats.by_department[order.department] || 0) + 1
      }

      // Vote Code
      if (order.vote_code) {
        stats.by_vote_code[order.vote_code] = (stats.by_vote_code[order.vote_code] || 0) + 1
      }
    })

    // Calculate detailed department breakdown
    const deptMap = new Map<string, Map<string, { orders: number, items: number, activities: Map<string, { orders: number, items: number }> }>>()

    orders.forEach(order => {
      const dept = order.department || 'Unassigned'
      const vc = order.vote_code || 'Unassigned'

      if (!deptMap.has(dept)) {
        deptMap.set(dept, new Map())
      }
      const vcMap = deptMap.get(dept)!

      if (!vcMap.has(vc)) {
        vcMap.set(vc, { orders: 0, items: 0, activities: new Map() })
      }

      const entry = vcMap.get(vc)!
      entry.orders += 1

      // Count items for this order
      let orderItemsCount = 0
      if (itemsData) {
        orderItemsCount = itemsData.filter(i => i.po_id === order.id).length
        entry.items += orderItemsCount
      }

      // Group by activity
      const act = order.vote_activity || 'Unassigned'
      const actMap = entry.activities
      if (!actMap.has(act)) {
        actMap.set(act, { orders: 0, items: 0 })
      }
      const actEntry = actMap.get(act)!
      actEntry.orders += 1
      actEntry.items += orderItemsCount
    })

    const department_breakdown = Array.from(deptMap.entries()).map(([dept, vcMap]) => ({
      department: dept,
      vote_codes: Array.from(vcMap.entries()).map(([code, data]) => ({
        code,
        total_orders: data.orders,
        total_items: data.items,
        activities: Array.from(data.activities.entries()).map(([actCode, actData]) => ({
          code: actCode,
          total_orders: actData.orders,
          total_items: actData.items
        }))
      }))
    }))

    stats.department_breakdown = department_breakdown

    // Cache the stats for 30 seconds
    setCache(cacheKey, stats, CACHE_TTL.STATS)

    return { data: stats, error: null }

  } catch (error) {
    console.error('Error fetching procurement stats:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch stats'
    }
  }
}

/**
 * Get purchase orders (paginated)
 */
export async function getPurchaseOrders(
  hospitalId: string,
  filter?: ProcurementFilter,
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = 'po_number',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse<PaginatedResponse<PurchaseOrderWithRelations>>> {
  try {
    let query = supabase
      .from('pharmacy_purchase_orders')
      .select(
        `
        id,
        hospital_id,
        po_number,
        po_type,
        supplier_id,
        budget_id,
        vote_code,
        vote_activity,
        category,
        department,
        order_date,
        expected_delivery_date,
        actual_delivery_date,
        subtotal,
        tax_amount,
        total_amount,
        payment_terms,
        delivery_address,
        status,
        created_by,
        approved_by,
        approved_at,
        notes,
        created_at,
        updated_at,
        supplier:suppliers(*),
        budget:pharmacy_budgets(*)
      `,
        { count: 'exact' }
      )
      .eq('hospital_id', hospitalId)

    if (filter?.search) {
      const search = filter.search.trim()
      if (search) {
        // Search for matching drug and non-drug items (including APPL) to include them in PO search
        const [
          { data: drugMatches },
          { data: nonDrugMatches },
          { data: applDrugMatches },
          { data: applNonDrugMatches },
          { data: supplierMatches },
          { data: poItemMatches }
        ] = await Promise.all([
          supabase.from('drugs').select('id').eq('hospital_id', hospitalId).or(`drug_name.ilike.%${search}%,drug_code.ilike.%${search}%`),
          supabase.from('non_drugs').select('id').eq('hospital_id', hospitalId).or(`item_name.ilike.%${search}%,item_code.ilike.%${search}%`),
          supabase.from('appl_drugs').select('id').eq('hospital_id', hospitalId).or(`item_name.ilike.%${search}%,item_code.ilike.%${search}%`),
          supabase.from('appl_non_drugs').select('id').eq('hospital_id', hospitalId).or(`item_name.ilike.%${search}%,item_code.ilike.%${search}%`),
          supabase.from('suppliers').select('id').ilike('company_name', `%${search}%`),
          supabase.from('pharmacy_purchase_order_items').select('po_id').or(`item_name.ilike.%${search}%,item_code.ilike.%${search}%`)
        ])

        const itemIds = [
          ...(drugMatches?.map(d => d.id) || []),
          ...(nonDrugMatches?.map(nd => nd.id) || []),
          ...(applDrugMatches?.map(ad => ad.id) || []),
          ...(applNonDrugMatches?.map(and => and.id) || [])
        ]

        const supplierIds = supplierMatches?.map(s => s.id) || []
        const directPoIds = poItemMatches?.map(p => p.po_id) || []

        let poIdsFromItems: string[] = [...directPoIds]
        if (itemIds.length > 0) {
          // Batch the itemIds to avoid URL length limits
          const BATCH_SIZE = 50
          const batches = []
          for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
            batches.push(itemIds.slice(i, i + BATCH_SIZE))
          }

          const itemPosResults = await Promise.all(
            batches.map(batch =>
              supabase
                .from('pharmacy_purchase_order_items')
                .select('po_id')
                .in('item_id', batch)
            )
          )

          const allItemPos = itemPosResults.flatMap(result => result.data || [])
          poIdsFromItems = Array.from(new Set([...poIdsFromItems, ...allItemPos.map(ip => ip.po_id)]))
        }

        const orConditions = [
          `po_number.ilike.%${search}%`,
          `delivery_address.ilike.%${search}%`,
          `notes.ilike.%${search}%`
        ]

        if (poIdsFromItems.length > 0) {
          orConditions.push(`id.in.(${poIdsFromItems.join(',')})`)
        }

        if (supplierIds.length > 0) {
          orConditions.push(`supplier_id.in.(${supplierIds.join(',')})`)
        }

        query = query.or(orConditions.join(','))
      }
    }

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status)
    }

    if (filter?.supplier_id) {
      query = query.eq('supplier_id', filter.supplier_id)
    }

    if (filter?.po_type && filter.po_type !== 'all') {
      if (filter.po_type === 'po_only') {
        query = query.neq('po_type', 'sq')
      } else {
        query = query.eq('po_type', filter.po_type)
      }
    }

    if (filter?.vote_code) {
      query = query.eq('vote_code', filter.vote_code)
    }

    if (filter?.vote_activity) {
      query = query.eq('vote_activity', filter.vote_activity)
    }

    if (filter?.category) {
      query = query.eq('category', filter.category)
    }

    if (filter?.department) {
      query = query.eq('department', filter.department)
    }

    if (filter?.date_from) {
      query = query.gte('order_date', filter.date_from)
    }

    if (filter?.date_to) {
      query = query.lte('order_date', filter.date_to)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to)

    if (error) throw error

    const rows = (data || []).map(row => ({
      ...row,
      supplier: Array.isArray(row.supplier) ? row.supplier[0] : row.supplier,
      budget: Array.isArray(row.budget) ? row.budget[0] : row.budget
    })) as unknown as PurchaseOrderWithRelations[]

    return {
      data: {
        data: rows,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch purchase orders',
    }
  }
}

/**
 * Get single purchase order by ID
 */
export async function getPurchaseOrderById(
  poId: string
): Promise<ApiResponse<PurchaseOrderWithRelations>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_purchase_orders')
      .select(
        `
        *,
        supplier:suppliers(id, supplier_code, company_name, contact_person, email, phone, address, registration_number, bank_account, bank_name, account_number, account_document_url, mof_certificate_url, bumiputera_registration_certificate_url, supplier_type, status, performance_rating, notes, hospital_id, created_at, updated_at),
        budget:pharmacy_budgets(*),
        items:pharmacy_purchase_order_items(*),
        goods_receipts:pharmacy_goods_receipts(*)
      `
      )
      .eq('id', poId)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return { data: null, error: 'Purchase order not found' }
      }
      throw error
    }

    const po = data as unknown as PurchaseOrderWithRelations

    // Resolve item details manually since DB relations are polymorphic/non-explicit
    if (po.items && po.items.length > 0) {
      po.items = await Promise.all(
        po.items.map(async (item) => {
          if (item.item_type === 'manual') return item
          try {
            let resolved = null
            if (item.item_type === 'drug') {
              // Try standard drug
              const { data: drug } = await supabase.from('drugs').select('drug_name, drug_code').eq('id', item.item_id).maybeSingle()
              if (drug) resolved = { name: drug.drug_name, code: drug.drug_code }

              // Try APPL drug if regular drug failed
              if (!resolved) {
                const { data: applDrug } = await supabase.from('appl_drugs').select('item_name, item_code').eq('id', item.item_id).maybeSingle()
                if (applDrug) resolved = { name: applDrug.item_name, code: applDrug.item_code }
              }
            } else if (item.item_type === 'non_drug') {
              const { data: nonDrug } = await supabase.from('non_drugs').select('item_name, item_code').eq('id', item.item_id).maybeSingle()
              if (nonDrug) resolved = { name: nonDrug.item_name, code: nonDrug.item_code }

              if (!resolved) {
                const { data: applNonDrug } = await supabase.from('appl_non_drugs').select('item_name, item_code').eq('id', item.item_id).maybeSingle()
                if (applNonDrug) resolved = { name: applNonDrug.item_name, code: applNonDrug.item_code }
              }
            }

            return {
              ...item,
              item_name: item.item_name || resolved?.name || 'Unknown Item',
              item_code: item.item_code || resolved?.code || item.item_id
            }
          } catch (err) {
            return item
          }
        })
      )
    }

    return { data: po, error: null }
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch purchase order',
    }
  }
}

/**
 * Create new purchase order
 */
export async function createPurchaseOrder(
  hospitalId: string,
  userId: string,
  data: PurchaseOrderFormData
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax_amount = 0 // No tax
    const total_amount = subtotal
    const poType = data.po_type || 'regular'

    const today = new Date()
    const orderDate = today.toISOString().split('T')[0]
    const year = today.getFullYear()

    // Determine Prefix based on PO Type
    // SQ-2026-xxxx for 'sq'
    // PO-2026-xxxx for others
    const prefix = poType === 'sq' ? 'SQ' : 'PO'
    const searchPattern = `${prefix}-${year}-%`

    // Get the highest number for the current year and type
    const { data: existingRecords, error: poError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('po_number')
      .eq('hospital_id', hospitalId)
      .like('po_number', searchPattern)
      .order('po_number', { ascending: false })
      .limit(1)

    let nextNumber = 1
    if (!poError && existingRecords && existingRecords.length > 0) {
      const lastNumber = existingRecords[0].po_number
      // Match suffix digits
      const match = lastNumber.match(new RegExp(`${prefix}-${year}-(\\d{4})`))
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const documentNumber = `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`

    const insertPayload: any = {
      hospital_id: hospitalId,
      po_number: documentNumber,
      po_type: poType,
      supplier_id: data.supplier_id || null, // Allow null for Manual PO
      manual_supplier_name: data.manual_supplier_name,
      manual_supplier_address: data.manual_supplier_address,
      sq_suppliers: data.sq_suppliers,
      budget_id: data.budget_id || null,
      vote_code: data.vote_code || null,
      vote_activity: data.vote_activity || null,
      category: data.category || null,
      department: data.department || null,
      order_date: orderDate,
      expected_delivery_date: data.expected_delivery_date,
      subtotal,
      tax_amount,
      total_amount,
      payment_terms: data.payment_terms,
      delivery_address: data.delivery_address,
      status: 'draft',
      created_by: userId,
      notes: data.notes,
      kkm_contract_number: data.kkm_contract_number,
      program_name: data.program_name,
    }

    const { data: inserted, error } = await supabase
      .from('pharmacy_purchase_orders')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) throw error

    if (data.items.length > 0) {
      const poItems = data.items.map((item) => ({
        po_id: inserted.id,
        item_type: item.item_type,
        item_id: item.item_id || null, // Allow null for manual
        item_name: item.item_name, // Store manual name
        item_code: item.item_code, // Store manual code
        quantity_ordered: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        packaging_description: item.packaging_description,
      }))

      const { error: itemsError } = await supabase
        .from('pharmacy_purchase_order_items')
        .insert(poItems)

      if (itemsError) throw itemsError
    }

    // Background sync to CC/APPL Allocation if relevant
    if (poType === 'regular' || poType === 'manual') {
      const [ccSync, applSync] = await Promise.all([
        syncSinglePOToCCAllocation(hospitalId, inserted.id),
        syncSinglePOToAPPLAllocation(hospitalId, inserted.id)
      ])

      if (!ccSync.success || !applSync.success) {
        console.error('Budget sync error during PO creation:', ccSync.error || applSync.error)
      }
    }

    // Invalidate stats cache after PO creation
    invalidateCache(`procurement-stats-${hospitalId}`)

    return { data: inserted as PurchaseOrder, error: null }
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create purchase order',
    }
  }
}

/**
 * Update existing purchase order
 */
export async function updatePurchaseOrder(
  poId: string,
  _userId: string,
  data: Partial<PurchaseOrderFormData>
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Calculate totals
    const subtotal = data.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0
    const tax_amount = 0 // No tax
    const total_amount = subtotal

    // First, get the existing PO to preserve po_number
    const { data: existingPO, error: fetchError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('*')
      .eq('id', poId)
      .single()

    if (fetchError) throw fetchError
    if (!existingPO) {
      return { data: null, error: 'Purchase order not found' }
    }

    // Only allow editing if status is draft or pending_approval
    if (existingPO.status !== 'draft' && existingPO.status !== 'pending_approval') {
      return { data: null, error: 'Only draft or pending purchase orders can be edited' }
    }

    // Update the purchase order
    const { data: updated, error } = await supabase
      .from('pharmacy_purchase_orders')
      .update({
        status: 'draft', // Reset to draft on edit so it can be submitted again
        supplier_id: data.supplier_id || null,
        manual_supplier_name: data.manual_supplier_name,
        manual_supplier_address: data.manual_supplier_address,
        sq_suppliers: data.sq_suppliers,
        budget_id: data.budget_id || null,
        vote_code: data.vote_code || null,
        vote_activity: data.vote_activity || null,
        category: data.category || null,
        department: data.department || null,
        expected_delivery_date: data.expected_delivery_date,
        subtotal,
        tax_amount,
        total_amount,
        payment_terms: data.payment_terms,
        delivery_address: data.delivery_address,
        notes: data.notes,
        kkm_contract_number: data.kkm_contract_number,
        program_name: data.program_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId)
      .select('*')
      .single()

    if (error) throw error

    // Delete existing items and insert new ones
    const { error: deleteItemsError } = await supabase
      .from('pharmacy_purchase_order_items')
      .delete()
      .eq('po_id', poId)

    if (deleteItemsError) throw deleteItemsError

    if (data.items && data.items.length > 0) {
      const poItems = data.items.map((item) => ({
        po_id: poId,
        item_type: item.item_type,
        item_id: item.item_id || null,
        item_name: item.item_name,
        item_code: item.item_code,
        quantity_ordered: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        packaging_description: item.packaging_description,
      }))

      const { error: itemsError } = await supabase
        .from('pharmacy_purchase_order_items')
        .insert(poItems)

      if (itemsError) throw itemsError
    }

    // Background sync to CC/APPL Allocation if relevant
    const [ccSync, applSync] = await Promise.all([
      syncSinglePOToCCAllocation(existingPO.hospital_id, poId),
      syncSinglePOToAPPLAllocation(existingPO.hospital_id, poId)
    ])

    // If sync fails, we still return the updated PO but we should log the sync error
    if (!ccSync.success || !applSync.success) {
      console.error('Budget sync error during PO update:', ccSync.error || applSync.error)
    }

    // Invalidate stats cache after PO update
    invalidateCache(`procurement-stats-${existingPO.hospital_id}`)

    return { data: updated as PurchaseOrder, error: null }
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update purchase order',
    }
  }
}

/**
 * Submit purchase order for approval
 */
export async function submitPurchaseOrder(poId: string, userId: string): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // 1. Get current PO details including department
    const { data: po, error: fetchError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('*, hospital_id, items:pharmacy_purchase_order_items(*)')
      .eq('id', poId)
      .single()

    if (fetchError || !po) throw new Error('Purchase Order not found')

    // 2. Prepare Request Data for Approval Check
    const requestData = {
      amount: po.total_amount,
      department_id: po.department || po.department_id, // Handle potential schema variations
      po_type: po.po_type,
      supplier_id: po.supplier_id,
      item_count: po.items?.length || 0,
      is_emergency: false // Could be added to PO schema later
    }

    // 3. Determine Action Type
    const actionType = po.po_type === 'lpo' ? 'lpo_create' : 'purchase_order_create';

    // 4. Check if Approval is Needed
    const { needs_approval, workflow_id } = await checkApprovalNeeded(actionType, requestData);

    let updatedPO;

    if (needs_approval && workflow_id) {
      // A. Start Approval Workflow

      // Create Request Record
      const approvalRequest = await createApprovalRequest(
        workflow_id,
        userId,
        requestData,
        'purchase_order',
        poId
      );

      // Update PO Status
      const { data: updated, error: updateError } = await supabase
        .from('pharmacy_purchase_orders')
        .update({
          status: 'pending_approval',
          workflow_id: workflow_id,
          current_step: 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', poId)
        .select()
        .single()

      if (updateError) throw updateError
      updatedPO = updated;

      // Log Submission
      await supabase.from('approval_logs').insert({
        entity_type: 'purchase_order',
        entity_id: poId,
        workflow_id: workflow_id,
        step_order: 0,
        action: 'submitted',
        approved_by: userId,
        notes: 'Submitted for approval (Workflow triggered)',
        created_at: new Date().toISOString()
      });

    } else {
      // B. No Approval Needed - Auto Approve
      const { data: updated, error: updateError } = await supabase
        .from('pharmacy_purchase_orders')
        .update({
          status: 'approved', // Or 'sent' if configured
          workflow_id: null,
          approved_by: null, // Auto-approved - null since no user approved
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', poId)
        .select()
        .single()

      if (updateError) throw updateError
      updatedPO = updated;

      // Log Auto-Approval
      await supabase.from('approval_logs').insert({
        entity_type: 'purchase_order',
        entity_id: poId,
        step_order: 0,
        action: 'auto_approved',
        approved_by: userId,
        notes: 'Auto-approved (No workflow matched)',
        created_at: new Date().toISOString()
      });
    }

    // 5. Background Budget Sync
    if (updatedPO.hospital_id) {
      syncSinglePOToCCAllocation(updatedPO.hospital_id, updatedPO.id).catch(console.error)
      syncSinglePOToAPPLAllocation(updatedPO.hospital_id, updatedPO.id).catch(console.error)
    }

    return { data: updatedPO as PurchaseOrder, error: null }
  } catch (error) {
    console.error('Error submitting purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to submit purchase order',
    }
  }
}

/**
 * Approve purchase order
 */
export async function approvePurchaseOrder(
  poId: string,
  approverId: string
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // 1. Authorization Check (Workflow Enforcement)
    const { canApprove, message } = await canUserApprovePurchaseOrder(approverId, poId)
    if (!canApprove) {
      throw new Error(message || 'You are not authorized to approve this purchase order.')
    }

    // 2. Get current PO details including workflow info
    const { data: po, error: fetchError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('*, hospital_id')
      .eq('id', poId)
      .single()

    if (fetchError || !po) throw new Error('Purchase Order not found')

    let nextStep = po.current_step
    let isFinalStep = true

    // 2. Check Workflow Progress if workflow_id exists
    if (po.workflow_id) {
      // Check if there is next step greater than current
      const { data: nextSteps, error: stepError } = await supabase
        .from('approval_workflow_steps')
        .select('step_order')
        .eq('workflow_id', po.workflow_id)
        .gt('step_order', po.current_step || 0)
        .order('step_order', { ascending: true })
        .limit(1)

      if (!stepError && nextSteps && nextSteps.length > 0) {
        isFinalStep = false
        nextStep = nextSteps[0].step_order
      }
    }

    // 3. Update PO Status
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }

    if (isFinalStep) {
      updatePayload.status = 'approved'
      updatePayload.approved_by = approverId
      updatePayload.approved_at = new Date().toISOString()

      // CAPTURE SIGNATURE SNAPSHOT
      try {
        // 1. Get Approver's Department
        const { data: approver } = await supabase
          .from('users')
          .select('department_id, department')
          .eq('id', approverId)
          .single()

        let deptId = null
        if (approver?.department?.department_code) {
          deptId = approver.department.department_code
        } else if (po.department) {
          // Fallback to PO's department if approver deparment unknown
          deptId = DEPT_CODE_MAPPING[po.department] || po.department
        }

        // 2. Fetch Signatures for this department
        if (po.hospital_id) {
          const sigResult = await getPharmacyPOSignatures(po.hospital_id, deptId || undefined)
          if (sigResult.data) {
            updatePayload.signature_snapshot = {
              ...sigResult.data,
              capturedAt: new Date().toISOString(),
              capturedFromDepartment: deptId
            }
          }
        }
      } catch (sigError) {
        console.error('Error capturing signature snapshot:', sigError)
        // Ensure approval proceeds even if snapshot fails
      }

      // If workflow exists, ensure we sit at the last step number or just let it stay
    } else {
      updatePayload.status = 'pending_approval'
      updatePayload.current_step = nextStep
    }

    const { data: updated, error } = await supabase
      .from('pharmacy_purchase_orders')
      .update(updatePayload)
      .eq('id', poId)
      .select()
      .single()

    if (error) throw error

    // 4. Log Approval Action
    if (po.workflow_id) {
      const { error: logError } = await supabase
        .from('approval_logs')
        .insert({
          entity_type: 'purchase_order',
          entity_id: poId,
          workflow_id: po.workflow_id,
          step_order: po.current_step || 1,
          action: 'approved',
          approved_by: approverId,
          notes: isFinalStep ? 'Final Approval' : `Approved Step ${po.current_step}`,
          created_at: new Date().toISOString()
        })
      if (logError) console.error('Failed to log approval:', logError)
    }

    // Background sync to CC/APPL Allocation if relevant
    if (isFinalStep && updated.hospital_id) {
      syncSinglePOToCCAllocation(updated.hospital_id, updated.id).catch(console.error)
      syncSinglePOToAPPLAllocation(updated.hospital_id, updated.id).catch(console.error)
    }

    return { data: updated as PurchaseOrder, error: null }
  } catch (error) {
    console.error('Error approving purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to approve purchase order',
    }
  }
}

/**
 * Reject purchase order
 */
export async function rejectPurchaseOrder(
  poId: string,
  _rejectorId: string,
  reason: string
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Update status to cancelled and set notes
    const { data: updated, error } = await supabase
      .from('pharmacy_purchase_orders')
      .update({
        status: 'cancelled',
        notes: `Cancelled: ${reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId)
      .select()
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return { data: null, error: 'Purchase order not found' }
      }
      throw error
    }

    // Background sync to CC/APPL Allocation if relevant
    syncSinglePOToCCAllocation(updated.hospital_id, poId).catch(console.error)
    syncSinglePOToAPPLAllocation(updated.hospital_id, poId).catch(console.error)

    return { data: updated as PurchaseOrder, error: null }
  } catch (error) {
    console.error('Error rejecting purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to reject purchase order',
    }
  }
}

/**
 * Delete purchase order (only for draft status)
 */
export async function deletePurchaseOrder(
  poId: string,
  _userId: string
): Promise<ApiResponse<boolean>> {
  try {
    // First check if PO exists and is in draft status
    const { data: existingPO, error: fetchError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('id, status')
      .eq('id', poId)
      .single()

    if (fetchError || !existingPO) {
      return { data: null, error: 'Purchase order not found' }
    }

    if (existingPO.status !== 'draft') {
      return { data: null, error: 'Only draft purchase orders can be deleted' }
    }

    // Delete PO items first (cascade should handle this, but being explicit)
    const { error: itemsError } = await supabase
      .from('pharmacy_purchase_order_items')
      .delete()
      .eq('po_id', poId)

    if (itemsError) {
      console.error('Error deleting PO items:', itemsError)
    }

    // Delete the purchase order
    const { error: deleteError } = await supabase
      .from('pharmacy_purchase_orders')
      .delete()
      .eq('id', poId)

    if (deleteError) {
      throw deleteError
    }

    return { data: true, error: null }
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete purchase order',
    }
  }
}

/**
 * Send purchase order to supplier
 */
export async function sendPurchaseOrder(poId: string): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Update status to sent
    const { data: updated, error } = await supabase
      .from('pharmacy_purchase_orders')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId)
      .select()
      .single()

    if (error) throw error

    // Background sync to CC/APPL Allocation if relevant
    if (updated.hospital_id) {
      syncSinglePOToCCAllocation(updated.hospital_id, updated.id).catch(console.error)
      syncSinglePOToAPPLAllocation(updated.hospital_id, updated.id).catch(console.error)
    }

    return { data: updated as PurchaseOrder, error: null }
  } catch (error) {
    console.error('Error sending purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to send purchase order',
    }
  }
}

// =====================================================
// GOODS RECEIPT MANAGEMENT
// =====================================================

/**
 * Create goods receipt for a purchase order
 */
export async function createGoodsReceipt(
  hospitalId: string,
  userId: string,
  data: GoodsReceiptFormData
): Promise<ApiResponse<GoodsReceipt>> {
  try {
    const today = new Date()
    const receiptDate = today.toISOString().split('T')[0]
    const grNumber = `GR-${today.getFullYear()}-${String(Date.now()).slice(-4)}`

    const { data: inserted, error } = await supabase
      .from('pharmacy_goods_receipts')
      .insert({
        hospital_id: hospitalId,
        gr_number: grNumber,
        po_id: data.po_id,
        receipt_date: receiptDate,
        delivery_note_number: data.delivery_note_number,
        invoice_number: data.invoice_number,
        invoice_amount: data.invoice_amount,
        status: 'pending',
        received_by: userId,
        notes: data.notes,
      })
      .select('*')
      .single()

    if (error) throw error

    if (data.items && data.items.length > 0) {
      const items = data.items.map((item) => ({
        gr_id: inserted.id,
        po_item_id: item.po_item_id,
        quantity_received: item.quantity_received,
        quantity_accepted: item.quantity_accepted,
        quantity_rejected: item.quantity_rejected ?? 0,
        batch_number: item.batch_number,
        manufacturing_date: item.manufacturing_date,
        expiry_date: item.expiry_date,
        storage_location_id: item.storage_location_id,
        rejection_reason: item.rejection_reason,
        notes: item.notes,
      }))

      const { error: itemsError } = await supabase
        .from('pharmacy_goods_receipt_items')
        .insert(items)

      if (itemsError) throw itemsError
    }

    return { data: inserted as GoodsReceipt, error: null }
  } catch (error) {
    console.error('Error creating goods receipt:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create goods receipt',
    }
  }
}

// =====================================================
// SUPPLIER MANAGEMENT
// =====================================================

export interface SupplierFilter {
  search?: string
  status?: 'active' | 'inactive' | 'blacklisted' | 'all'
  supplier_type?: 'drug' | 'non_drug' | 'both' | 'all'
}

/**
 * Get suppliers with optional filtering (used by catalogs and supplier page)
 */
export async function getSuppliers(
  _hospitalId?: string,
  page: number = 1,
  pageSize: number = 10,
  filter?: SupplierFilter
): Promise<ApiResponse<PaginatedResponse<Supplier>>> {
  try {
    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' })

    // Always show global suppliers (hospital_id IS NULL)
    // If hospitalId is provided, also show hospital-specific suppliers
    // Note: For now, showing all suppliers regardless of hospital_id to ensure global suppliers are visible
    if (_hospitalId) {
      query = query.or(`hospital_id.eq.${_hospitalId},hospital_id.is.null`)
    } else {
      query = query.is('hospital_id', null)
    }

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status)
    }

    if (filter?.supplier_type && filter.supplier_type !== 'all') {
      query = query.eq('supplier_type', filter.supplier_type)
    }

    if (filter?.search) {
      const search = filter.search.trim()
      if (search) {
        query = query.or(
          [
            `company_name.ilike.%${search}%`,
            `supplier_code.ilike.%${search}%`,
            `contact_person.ilike.%${search}%`,
          ].join(',')
        )
      }
    }

    const { data, error, count } = await query
      .order('company_name', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error

    return {
      data: {
        data: (data || []) as Supplier[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch suppliers',
    }
  }
}

/**
 * Get single supplier by ID
 */
export async function getSupplierById(supplierId: string): Promise<ApiResponse<SupplierWithRelations>> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return { data: null, error: 'Supplier not found' }
      }
      throw error
    }

    return { data: data as SupplierWithRelations, error: null }
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch supplier',
    }
  }
}

/**
 * Get active suppliers for dropdown
 */
export async function getActiveSuppliers(hospitalId?: string): Promise<ApiResponse<Supplier[]>> {
  try {
    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'active')

    if (hospitalId) {
      // Include both hospital-specific suppliers AND global suppliers (hospital_id IS NULL)
      query = query.or(`hospital_id.eq.${hospitalId},hospital_id.is.null`)
    } else {
      // If no hospitalId provided, show only global suppliers
      query = query.is('hospital_id', null)
    }

    const { data, error } = await query.order('company_name', { ascending: true })

    if (error) throw error

    return { data: (data || []) as Supplier[], error: null }
  } catch (error) {
    console.error('Error fetching active suppliers:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch active suppliers',
    }
  }
}

/**
 * Get supplier statistics (order count, total value, by year)
 */
export interface SupplierStatistics {
  totalOrders: number
  totalValue: number
  averageOrderValue: number
  ordersByYear: Array<{
    year: number
    orderCount: number
    totalValue: number
  }>
  lastOrderDate?: string
}

export async function getSupplierStatistics(
  supplierId: string,
  hospitalId?: string
): Promise<ApiResponse<SupplierStatistics>> {
  try {
    // Supabase check removed, using direct calls

    let query = supabase
      .from('pharmacy_purchase_orders')
      .select('id, order_date, total_amount, status')
      .eq('supplier_id', supplierId)

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching supplier statistics:', error)
      throw error
    }

    if (!orders || orders.length === 0) {
      return {
        data: {
          totalOrders: 0,
          totalValue: 0,
          averageOrderValue: 0,
          ordersByYear: [],
        },
        error: null,
      }
    }

    // Calculate statistics
    const totalOrders = orders.length
    const totalValue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0

    // Group by year
    const ordersByYearMap = new Map<number, { orderCount: number; totalValue: number }>()
    let lastOrderDate: string | undefined

    orders.forEach(order => {
      if (order.order_date) {
        const year = new Date(order.order_date).getFullYear()
        const existing = ordersByYearMap.get(year) || { orderCount: 0, totalValue: 0 }
        ordersByYearMap.set(year, {
          orderCount: existing.orderCount + 1,
          totalValue: existing.totalValue + (Number(order.total_amount) || 0),
        })

        // Track latest order date
        if (!lastOrderDate || order.order_date > lastOrderDate) {
          lastOrderDate = order.order_date
        }
      }
    })

    const ordersByYear = Array.from(ordersByYearMap.entries())
      .map(([year, data]) => ({
        year,
        orderCount: data.orderCount,
        totalValue: data.totalValue,
      }))
      .sort((a, b) => b.year - a.year) // Sort by year descending

    return {
      data: {
        totalOrders,
        totalValue,
        averageOrderValue,
        ordersByYear,
        lastOrderDate,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching supplier statistics:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch supplier statistics',
    }
  }
}

/**
 * Create a new supplier
 * NOTE: Using direct REST API call instead of Supabase JS SDK due to hanging issue
 */
export async function createSupplier(
  hospitalId: string | null,
  data: Partial<Supplier>
): Promise<ApiResponse<Supplier>> {
  try {
    console.log('[createSupplier] Starting with hospitalId:', hospitalId)
    console.log('[createSupplier] Input data:', data)

    const insertData: Record<string, any> = {
      supplier_code: (data.supplier_code || `SUP-${Date.now().toString(36).toUpperCase()}`).trim(),
      company_name: (data.company_name || '').trim(),
      contact_person: data.contact_person?.trim() || null,
      contact_person_phone: data.contact_person_phone?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      registration_number: data.registration_number?.trim() || null,
      bank_account: data.bank_account?.trim() || null,
      bank_name: data.bank_name?.trim() || null,
      supplier_type: data.supplier_type || 'both',
      status: data.status || 'active',
      performance_rating: data.performance_rating || null,
      notes: data.notes?.trim() || null,
      account_number: data.account_number?.trim() || null,
      account_document_url: data.account_document_url || null,
      mof_certificate_url: data.mof_certificate_url || null,
      bumiputera_registration_certificate_url: data.bumiputera_registration_certificate_url || null,
      hospital_id: hospitalId,
    }

    console.log('[createSupplier] Prepared insert data:', insertData)

    // Get Supabase URL and key from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing')
    }

    // Get access token directly from localStorage to avoid SDK hanging
    // The Supabase SDK stores the session in localStorage with a specific key pattern
    let accessToken = supabaseKey
    try {
      const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
      const storedSession = localStorage.getItem(storageKey)
      if (storedSession) {
        const parsed = JSON.parse(storedSession)
        accessToken = parsed?.access_token || supabaseKey
      }
    } catch (e) {
      console.warn('[createSupplier] Could not get auth token from storage, using anon key')
    }

    console.log('[createSupplier] Using direct REST API insert...')


    // Use direct REST API call with fetch - this bypasses the Supabase JS SDK hanging issue
    const response = await fetch(`${supabaseUrl}/rest/v1/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(insertData),
    })

    console.log('[createSupplier] REST API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[createSupplier] REST API error:', errorText)

      // Parse error message
      let errorMessage = 'Failed to create supplier'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }

      return { data: null, error: errorMessage }
    }

    const created = await response.json()
    console.log('[createSupplier] Created supplier:', created)

    // Response is an array when using Prefer: return=representation
    const supplierData = Array.isArray(created) ? created[0] : created

    return { data: supplierData as Supplier, error: null }
  } catch (error) {
    console.error('Error creating supplier:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create supplier',
    }
  }
}


/**
 * Update supplier
 */
export async function updateSupplier(
  supplierId: string,
  data: Partial<Supplier>
): Promise<ApiResponse<Supplier>> {
  try {
    const updateData: Partial<Supplier> = {
      ...data,
    }

    const TIMEOUT_MS = 30000 // 30 seconds - consistent with createSupplier

    const { error: updateError } = await Promise.race([
      supabase.from('suppliers').update(updateData).eq('id', supplierId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), TIMEOUT_MS))
    ]) as any

    if (updateError) {
      console.error('Error updating supplier in Supabase:', updateError)
      return {
        data: null,
        error: updateError.message || 'Failed to update supplier',
      }
    }

    const { data: updated, error: fetchError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single()

    if (fetchError) {
      console.warn('[updateSupplier] Fetch error (but update succeeded):', fetchError)
      return { data: { id: supplierId, ...data } as Supplier, error: null }
    }

    return { data: updated as Supplier, error: null }
  } catch (error) {
    console.error('Error updating supplier:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update supplier',
    }
  }
}

// =====================================================
// ORDER TRACKING
// =====================================================

/**
 * Get order tracking history
 */
export async function getOrderTracking(poId: string): Promise<ApiResponse<OrderTracking[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_order_tracking')
      .select('*')
      .eq('po_id', poId)
      .order('status_date', { ascending: true })

    if (error) throw error

    return { data: (data || []) as OrderTracking[], error: null }
  } catch (error) {
    console.error('Error fetching order tracking:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch order tracking',
    }
  }
}

/**
 * Add tracking update
 */
export async function addTrackingUpdate(
  poId: string,
  status: string,
  notes: string,
  userId: string
): Promise<ApiResponse<OrderTracking>> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('pharmacy_order_tracking')
      .insert({
        po_id: poId,
        status,
        status_date: now,
        notes,
        updated_by: userId,
      })
      .select('*')
      .single()

    if (error) throw error

    return { data: data as OrderTracking, error: null }
  } catch (error) {
    console.error('Error adding tracking update:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to add tracking update',
    }
  }
}

/**
 * Reallocate Purchase Order (Change Warrant Allocation)
 * Allows changing Vote Code, Activity, Department, and Category for an ALREADY APPROVED PO.
 * Handles cleanup of old expenses if moving between Vote Codes (e.g. APPL -> CC).
 */
export async function reallocatePurchaseOrder(
  poId: string,
  userId: string,
  data: {
    vote_code: string
    vote_activity: string
    department: string
    category: string
    budget_id?: string
  }
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // 1. Get current PO details to know OLD vote code
    const { data: oldPO, error: fetchError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('id, hospital_id, vote_code, po_number')
      .eq('id', poId)
      .single()

    if (fetchError || !oldPO) {
      return { data: null, error: 'Purchase Order not found' }
    }

    const hospitalId = oldPO.hospital_id

    // 2. Update the Purchase Order with NEW Allocation
    const { data: updated, error: updateError } = await supabase
      .from('pharmacy_purchase_orders')
      .update({
        vote_code: data.vote_code,
        vote_activity: data.vote_activity,
        department: data.department,
        category: data.category,
        budget_id: data.budget_id || null, // Optional
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId)
      .select('*')
      .single()

    if (updateError) throw updateError

    // 3. CLEANUP: If Vote Code changed type, remove old expense record
    // If we moved FROM CC (080702) TO something else (e.g. 990102 APPL)
    if (oldPO.vote_code === '080702' && data.vote_code !== '080702') {
      const { error: delError } = await supabase
        .from('pharmacy_cc_expenses')
        .delete()
        .eq('po_id', poId)
        .eq('hospital_id', hospitalId)

      if (delError) console.error('Error cleaning up old CC expense:', delError)
    }

    // If we moved FROM APPL (990102) TO something else (e.g. 080702 CC)
    if (oldPO.vote_code === '990102' && data.vote_code !== '990102') {
      const { error: delError } = await supabase
        .from('pharmacy_appl_expenses')
        .delete()
        .eq('po_id', poId)
        .eq('hospital_id', hospitalId)

      if (delError) console.error('Error cleaning up old APPL expense:', delError)
    }

    // 4. SYNC: Trigger syncs for BOTH types to ensure correct state
    // The sync functions will check the CURRENT vote_code of the PO and act accordingly.
    // If it's now APPL, APPL trigger will create expense. CC trigger will check info and see it's not CC and exit.
    // Note: We deliberately call both because we might have switched TO one of them, or stayed in same.

    await Promise.all([
      syncSinglePOToCCAllocation(hospitalId, poId),
      syncSinglePOToAPPLAllocation(hospitalId, poId)
    ])

    // Log the change (Optional, but good for audit)
    await supabase.from('approval_logs').insert({
      entity_type: 'purchase_order',
      entity_id: poId,
      action: 'reallocated',
      approved_by: userId,
      notes: `Reallocated from Vote Code ${oldPO.vote_code} to ${data.vote_code}`,
      created_at: new Date().toISOString()
    })

    return { data: updated as PurchaseOrder, error: null }

  } catch (error) {
    console.error('Error reallocating purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to reallocate purchase order'
    }
  }
}

/**
 * Update a specific item in an APPROVED Purchase Order.
 * Recalculates PO total and syncs with CC/APPL expenses.
 */
export async function updateApprovedPOItem(
  poId: string,
  itemId: string,
  userId: string,
  data: {
    quantity_ordered: number
    unit_price: number
    packaging_description: string
  }
): Promise<ApiResponse<PurchaseOrderWithRelations>> {
  try {
    // 1. Get PO and item to verify state
    const { data: po, error: poError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('*, items:pharmacy_purchase_order_items(*)')
      .eq('id', poId)
      .single()

    if (poError || !po) throw new Error('Purchase Order not found')

    // We only allow this for approved/sent/partial_received statuses
    const allowedStatuses = ['approved', 'sent', 'partial_received']
    if (!allowedStatuses.includes(po.status)) {
      throw new Error(`Cannot edit items for PO with status: ${po.status}`)
    }

    // 2. Update the specific item
    const { error: itemUpdateError } = await supabase
      .from('pharmacy_purchase_order_items')
      .update({
        quantity_ordered: data.quantity_ordered,
        unit_price: data.unit_price,
        total_price: data.quantity_ordered * data.unit_price,
        packaging_description: data.packaging_description
      })
      .eq('id', itemId)
      .eq('po_id', poId)

    if (itemUpdateError) throw itemUpdateError

    // 3. Recalculate PO totals
    // Fetch fresh items to be sure
    const { data: freshItems, error: itemsError } = await supabase
      .from('pharmacy_purchase_order_items')
      .select('*')
      .eq('po_id', poId)

    if (itemsError || !freshItems) throw new Error('Failed to fetch updated items')

    const newSubtotal = freshItems.reduce((sum, item) => sum + Number(item.total_price), 0)
    const newTotal = newSubtotal // Assuming no tax as per create logic

    // 4. Update PO record
    const { data: updatedPO, error: updateError } = await supabase
      .from('pharmacy_purchase_orders')
      .update({
        subtotal: newSubtotal,
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .select('*, items:pharmacy_purchase_order_items(*)')
      .single()

    if (updateError) throw updateError

    // 5. Sync Budget Expense records
    await Promise.all([
      syncSinglePOToCCAllocation(po.hospital_id, poId),
      syncSinglePOToAPPLAllocation(po.hospital_id, poId)
    ])

    // 6. Log the change
    await supabase.from('approval_logs').insert({
      entity_type: 'purchase_order',
      entity_id: poId,
      action: 'item_updated',
      approved_by: userId,
      notes: `Updated item ${itemId}: Qty ${data.quantity_ordered}, Price ${data.unit_price}`,
      created_at: new Date().toISOString()
    })

    // Invalidate stats cache
    invalidateCache(`procurement-stats-${po.hospital_id}`)

    return { data: updatedPO as PurchaseOrderWithRelations, error: null }
  } catch (error) {
    console.error('Error updating approved PO item:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update item'
    }
  }
}
