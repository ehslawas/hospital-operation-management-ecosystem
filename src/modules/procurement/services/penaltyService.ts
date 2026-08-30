// @ts-nocheck
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse } from '@/types'
import type { SupplierPenalty, PenaltyStatus } from '@/types/pharmacy'
import { getPurchaseOrderById as getPurchaseOrder } from './procurementService'
import { isApplOrder } from '@/shared/lib/utils'

export interface PenaltyFilter {
  status?: string
  search?: string
  supplier_id?: string
  penalty_type?: 'appl' | 'cc' | string
}

export interface PerformanceStandard {
  id: string
  code: string
  description_bm: string
  description_en: string | null
  penalty_formula: string
  penalty_type: string
  penalty_rate: number | null
  fixed_amount: number | null
  is_active: boolean
  sort_order: number
}

export async function createPenalty(
  data: Partial<SupplierPenalty>
): Promise<ApiResponse<SupplierPenalty>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Database not configured' }
    }

    const { data: penalty, error } = await supabase
      .from('pharmacy_penalties')
      .insert([data])
      .select()
      .single()

    if (error) throw error

    return { data: penalty, error: null }
  } catch (error: any) {
    console.error('Error creating penalty:', error)
    return { data: null, error: error.message }
  }
}

export interface PaginatedPenaltyResponse {
  data: SupplierPenalty[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  error: string | null
}

export async function getPenalties(
  hospitalId: string,
  filter?: PenaltyFilter,
  page = 1,
  limit = 10
): Promise<PaginatedPenaltyResponse> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        error: null
      }
    }

    let query = supabase
      .from('pharmacy_penalties')
      .select(`
        *,
        supplier:suppliers(id, company_name, address),
        purchase_order:pharmacy_purchase_orders(id, po_number, po_type),
        goods_receipt:pharmacy_goods_receipts(id, gr_number, delivery_note_number),
        lpo:pharmacy_lpo(id, lpo_number, document_date, document_url),
        order_tracking:pharmacy_order_tracking(id, expected_delivery_date, actual_delivery_date, tarikh_serahan, kkm_contract_number),
        receiving:pharmacy_receiving(id, do_number)
      `, { count: 'exact' })
      .eq('hospital_id', hospitalId)

    if (filter?.penalty_type) {
      query = query.eq('penalty_type', filter.penalty_type)
    }

    if (filter?.status) {
      query = query.eq('status', filter.status)
    }

    if (filter?.supplier_id) {
      query = query.eq('supplier_id', filter.supplier_id)
    }

    // Handle pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      data: data as SupplierPenalty[],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      },
      error: null
    }
  } catch (error: any) {
    console.error('Error fetching penalties:', error)
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      error: error.message
    }
  }
}

export async function getPenaltyStats(hospitalId: string): Promise<ApiResponse<any>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: {
          total: 0, pending: 0, enforced: 0, waived: 0, approved: 0,
          appl_count: 0, cc_count: 0,
          appl_amount: 0, cc_amount: 0
        },
        error: null
      }
    }

    const { data, error } = await supabase
      .from('pharmacy_penalties')
      .select('status, penalty_type, penalty_amount')
      .eq('hospital_id', hospitalId)

    if (error) throw error

    const stats = {
      total: data.length,
      pending: data.filter(p => p.status === 'pending').length,
      enforced: data.filter(p => p.status === 'enforced').length,
      waived: data.filter(p => p.status === 'waived').length,
      approved: data.filter(p => p.status === 'approved').length,
      appl_count: data.filter(p => p.penalty_type === 'appl').length,
      cc_count: data.filter(p => p.penalty_type === 'cc').length,
      appl_amount: data.filter(p => p.penalty_type === 'appl').reduce((s, p) => s + Number(p.penalty_amount || 0), 0),
      cc_amount: data.filter(p => p.penalty_type === 'cc').reduce((s, p) => s + Number(p.penalty_amount || 0), 0)
    }

    return { data: stats, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

/**
 * Fetches a single penalty by ID with full relational data
 */
export async function getPenaltyById(id: string): Promise<ApiResponse<any>> {
  try {
    if (!isSupabaseConfigured()) return { data: null, error: 'Database not configured' }

    const { data, error } = await supabase
      .from('pharmacy_penalties')
      .select(`
        *,
        supplier:suppliers(id, company_name, address, phone, email, contact_person, registration_number),
        purchase_order:pharmacy_purchase_orders(id, po_number, po_type, order_date, total_amount, vote_code, category, items:pharmacy_purchase_order_items(*)),
        goods_receipt:pharmacy_goods_receipts(id, gr_number, receipt_date, delivery_note_number),
        lpo:pharmacy_lpo(id, lpo_number, document_date, expected_delivery_date, document_url),
        order_tracking:pharmacy_order_tracking(id, expected_delivery_date, actual_delivery_date, tarikh_serahan, kkm_contract_number, item_name, item_code),
        receiving:pharmacy_receiving(id, receiving_date, do_number),
        prepared_by:users!pharmacy_penalties_prepared_by_user_id_fkey(id, full_name, jawatan),
        verified_by:users!pharmacy_penalties_verified_by_user_id_fkey(id, full_name, jawatan),
        approved_by_user:users!pharmacy_penalties_approved_by_fkey(id, full_name, jawatan)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Map performance standards UUIDs back to codes for the frontend
    if (data && data.performance_standards_violated && data.performance_standards_violated.length > 0) {
      const { data: standardsData } = await supabase
        .from('penalty_performance_standards')
        .select('id, code')
      
      if (standardsData && standardsData.length > 0) {
        const idToCodeMap = new Map(standardsData.map((s: any) => [s.id, s.code]))
        data.performance_standards_violated = data.performance_standards_violated
          .map((uid: string) => idToCodeMap.get(uid) || uid)
      }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Error fetching penalty by ID:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Updates penalty details (items, amounts, signatures, etc.)
 */
export async function updatePenaltyDetails(
  id: string,
  updates: Record<string, any>
): Promise<ApiResponse<any>> {
  try {
    if (!isSupabaseConfigured()) return { data: null, error: 'Database not configured' }

    // Strip out non-existent fields that are dynamically fetched
    const cleanedUpdates = { ...updates }
    delete cleanedUpdates.approved_by_name
    delete cleanedUpdates.approved_by_designation
    delete cleanedUpdates.do_number

    // Map performance standards codes to UUIDs if standard codes (like "PS05") are passed
    if (cleanedUpdates.performance_standards_violated && Array.isArray(cleanedUpdates.performance_standards_violated)) {
      const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
      const hasCodes = cleanedUpdates.performance_standards_violated.some((code: string) => !isUuid(code))

      if (hasCodes) {
        const { data: standardsData } = await supabase
          .from('penalty_performance_standards')
          .select('id, code')
        
        if (standardsData && standardsData.length > 0) {
          const codeToIdMap = new Map(standardsData.map((s: any) => [s.code, s.id]))
          cleanedUpdates.performance_standards_violated = cleanedUpdates.performance_standards_violated
            .map((code: string) => isUuid(code) ? code : codeToIdMap.get(code))
            .filter((val): val is string => !!val)
        }
      }
    }

    const { data, error } = await supabase
      .from('pharmacy_penalties')
      .update({ ...cleanedUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error updating penalty:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Approves a penalty record
 */
export async function approvePenalty(
  id: string,
  userId: string
): Promise<ApiResponse<any>> {
  try {
    if (!isSupabaseConfigured()) return { data: null, error: 'Database not configured' }

    const { data, error } = await supabase
      .from('pharmacy_penalties')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error approving penalty:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Fetches the APPL performance standards config table
 */
export async function getPerformanceStandards(): Promise<ApiResponse<PerformanceStandard[]>> {
  try {
    if (!isSupabaseConfigured()) return { data: [], error: null }

    const { data, error } = await supabase
      .from('penalty_performance_standards')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    return { data: data as PerformanceStandard[], error: null }
  } catch (error: any) {
    console.error('Error fetching performance standards:', error)
    return { data: [], error: error.message }
  }
}

export async function updatePenaltyStatus(
  id: string,
  status: PenaltyStatus,
  userId: string,
  reason?: string
): Promise<ApiResponse<SupplierPenalty>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Database not configured' }
    }

    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'enforced') {
      updates.enforced_by = userId
      updates.enforced_at = new Date().toISOString()
    } else if (status === 'waived') {
      updates.waiver_reason = reason
    }

    const { data, error } = await supabase
      .from('pharmacy_penalties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data: data as SupplierPenalty, error: null }
  } catch (error: any) {
    console.error('Error updating penalty:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Deletes a penalty record and creates an audit log entry
 */
export async function deletePenalty(
  id: string,
  userId: string,
  reason: string
): Promise<ApiResponse<boolean>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: false, error: 'Database not configured' }
    }

    // Insert into approval_logs first for auditability
    await supabase
      .from('approval_logs')
      .insert({
        entity_type: 'penalty',
        entity_id: id,
        action: 'deleted',
        approved_by: userId,
        notes: `Penalty deleted. Reason: ${reason}`,
        created_at: new Date().toISOString()
      })

    // Perform actual deletion
    const { error } = await supabase
      .from('pharmacy_penalties')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { data: true, error: null }
  } catch (error: any) {
    console.error('Error deleting penalty:', error)
    return { data: false, error: error.message }
  }
}

/**
 * Checks if a delivery is late and automatically creates a penalty record if so
 */
export async function checkAndCreateLatePenalty(
  hospitalId: string,
  userId: string,
  poId: string,
  grId: string,
  receiptDate: string,
  itemName?: string,
  itemCode?: string,
  lpoId?: string
): Promise<ApiResponse<SupplierPenalty | null>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Database not configured' }
    }

    // Get the PO to find the supplier
    const poRes = await getPurchaseOrder(poId)
    if (poRes.error || !poRes.data) {
      return { data: null, error: 'PO not found' }
    }

    const po = poRes.data
    
    // Check for existing penalty for this LPO / GR to prevent duplicates
    const actualLpoId = lpoId || (po as any).lpo_id
    if (actualLpoId) {
      const { data: existingPenalty } = await supabase
        .from('pharmacy_penalties')
        .select('id')
        .eq('lpo_id', actualLpoId)
        .maybeSingle()

      if (existingPenalty) {
        console.log(`[PENALTY] Duplicate prevention: Penalty already exists for LPO ${actualLpoId}`);
        return { data: null, error: null }
      }
    } else if (grId) {
      const { data: existingPenalty } = await supabase
        .from('pharmacy_penalties')
        .select('id')
        .eq('gr_id', grId)
        .maybeSingle()

      if (existingPenalty) {
        console.log(`[PENALTY] Duplicate prevention: Penalty already exists for GR ${grId}`);
        return { data: null, error: null }
      }
    }

    // Try to find the expected delivery date (ETA) and associate item info
    let expectedDate = po.expected_delivery_date
    let resolvedTrackingId: string | undefined = undefined
    let resolvedItemName = itemName
    let resolvedItemCode = itemCode
    
    if (actualLpoId) {
      // 1. Always prioritize LPO-level expected delivery date first
      const { data: lpoData } = await supabase
        .from('pharmacy_lpo')
        .select('expected_delivery_date')
        .eq('id', actualLpoId)
        .maybeSingle()
        
      if (lpoData?.expected_delivery_date) {
        expectedDate = lpoData.expected_delivery_date
      }

      // 2. Try Tracking table to resolve specific tracking item and fallback ETA
      let query = supabase
        .from('pharmacy_order_tracking')
        .select('id, expected_delivery_date, item_name, item_code')
        .eq('lpo_id', actualLpoId)
      
      if (resolvedItemCode) {
        query = query.eq('item_code', resolvedItemCode)
      }

      const { data: trackingItems } = await query.limit(1)
      if (trackingItems && trackingItems.length > 0) {
        resolvedTrackingId = trackingItems[0].id
        if (!expectedDate && trackingItems[0].expected_delivery_date) {
          expectedDate = trackingItems[0].expected_delivery_date
        }
        if (!resolvedItemName) {
          resolvedItemName = trackingItems[0].item_name
        }
        if (!resolvedItemCode) {
          resolvedItemCode = trackingItems[0].item_code
        }
      }
    }

    if (!expectedDate) {
      console.warn(`[PENALTY] Skipping: No ETA found for PO ${poId} / LPO ${lpoId}`);
      return { data: null, error: null }
    }

    const expected = new Date(expectedDate)
    const actual = new Date(receiptDate)

    expected.setHours(0, 0, 0, 0)
    actual.setHours(0, 0, 0, 0)

    if (actual > expected) {
      const diffTime = Math.abs(actual.getTime() - expected.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // Dynamically resolve penalty type ('appl' or 'cc') based on the PO's vote code or category
      let penaltyType = isApplOrder(po) ? 'appl' : 'cc'

      const penaltyData: Partial<SupplierPenalty> = {
        hospital_id: hospitalId,
        supplier_id: po.supplier_id,
        po_id: po.id,
        gr_id: grId,
        lpo_id: actualLpoId,
        order_tracking_id: resolvedTrackingId,
        item_name: resolvedItemName,
        item_code: resolvedItemCode,
        penalty_type: penaltyType as any,
        days_delayed: diffDays,
        expected_delivery_date: expectedDate,
        actual_delivery_date: receiptDate,
        issue_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        penalty_amount: 0,
        created_by: userId
      }

      return await createPenalty(penaltyData)
    }

    return { data: null, error: null }
  } catch (error: any) {
    console.error('Error checking late penalty:', error)
    return { data: null, error: error.message }
  }
}
