import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { CreditNote, CreditNoteItem, CreditNoteWithRelations } from '@/types/pharmacy'

export interface CreditNoteCreate {
  hospital_id: string;
  po_id: string;
  supplier_id: string; // Added supplier_id
  lpo_id?: string;
  gr_id?: string;
  reason: 'unavailable' | 'quality_issue' | 'other' | string;
  notes?: string;
  amount: number;
  items: {
    po_item_id: string;
    item_id: string;
    item_name?: string;
    item_code?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    reason: string;
  }[];
}

export interface CreditNoteFilter {
  search?: string;
  status?: string;
  supplier_id?: string;
  po_id?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Generate CN number
 */
export async function generateCNNumber(hospitalId: string, year: number): Promise<string> {
  if (!isSupabaseConfigured()) {
    return `CN-${year}-${String(Date.now()).slice(-4)}`
  }

  const { data, error } = await supabase
    .from('pharmacy_credit_notes')
    .select('cn_number')
    .eq('hospital_id', hospitalId)
    .like('cn_number', `CN-${year}-%`)
    .order('cn_number', { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (!error && data && data.length > 0) {
    const lastNum = data[0].cn_number
    const match = lastNum.match(/CN-\d{4}-(\d{4})/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  return `CN-${year}-${String(nextNumber).padStart(4, '0')}`
}

/**
 * Create Credit Note Draft
 */
export async function createCreditNoteDraft(
  data: CreditNoteCreate,
  createdBy: string
): Promise<ApiResponse<CreditNote>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase is not configured' }
    }

    const year = new Date().getFullYear()
    const cnNumber = await generateCNNumber(data.hospital_id, year)

    // Create CN header
    const { data: cnResult, error: cnError } = await supabase
      .from('pharmacy_credit_notes')
      .insert({
        hospital_id: data.hospital_id,
        po_id: data.po_id,
        supplier_id: data.supplier_id,
        lpo_id: data.lpo_id,
        gr_id: data.gr_id,
        cn_number: cnNumber,
        reason: data.reason,
        notes: data.notes,
        total_amount: data.amount,
        status: 'draft',
        created_by: createdBy
      })
      .select('*')
      .single()

    if (cnError) throw cnError

    // Insert Items
    if (data.items.length > 0) {
      const itemsToInsert = data.items.map(i => ({
        cn_id: cnResult.id,
        po_item_id: i.po_item_id,
        item_id: i.item_id,
        item_name: i.item_name,
        item_code: i.item_code,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
        reason: i.reason
      }))

      const { error: itemsError } = await supabase
        .from('pharmacy_credit_note_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError
    }

    return { data: cnResult as unknown as CreditNote, error: null }
  } catch (error) {
    console.error('Error creating credit note:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Approve Credit Note & Apply Budget Adjustment
 */
export async function approveCreditNote(
  cnId: string,
  approverId: string
): Promise<ApiResponse<CreditNote>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase is not configured' }
    }

    // 1. Get CN details
    const { data: cn, error: cnError } = await supabase
      .from('pharmacy_credit_notes')
      .select('*')
      .eq('id', cnId)
      .single()

    if (cnError) throw cnError
    if (!cn) throw new Error('Credit Note not found')
    if (cn.status !== 'draft' && cn.status !== 'pending') {
      throw new Error('Only draft or pending credit notes can be approved')
    }

    // 2. Adjust PO Total Amount to reflect the credit
    // Fetch PO
    const { data: po, error: poError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('subtotal, tax_amount, total_amount')
      .eq('id', cn.po_id)
      .single()

    if (poError) throw poError

    const cnAmount = Number(cn.total_amount || 0)
    
    // We reduce the subtotal and total_amount of the PO so that budgetEngine picks up the new, lower liability/expense
    const newSubtotal = Math.max(0, Number(po.subtotal || 0) - cnAmount)
    const newTotal = Math.max(0, Number(po.total_amount || 0) - cnAmount)

    const { error: updatePoError } = await supabase
      .from('pharmacy_purchase_orders')
      .update({
        subtotal: newSubtotal,
        total_amount: newTotal
      })
      .eq('id', cn.po_id)

    if (updatePoError) throw updatePoError

    // 3. Update CN Status
    const { data: updatedCn, error: updateCnError } = await supabase
      .from('pharmacy_credit_notes')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString()
      })
      .eq('id', cnId)
      .select('*')
      .single()

    if (updateCnError) throw updateCnError

    return { data: updatedCn as unknown as CreditNote, error: null }
  } catch (error) {
    console.error('Error approving credit note:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get Paginated Credit Notes
 */
export async function getCreditNotes(
  hospitalId: string,
  filter?: CreditNoteFilter,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<CreditNoteWithRelations>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        error: null
      }
    }

    let query = supabase
      .from('pharmacy_credit_notes')
      .select(`
        *,
        supplier:suppliers(id, company_name),
        purchase_order:pharmacy_purchase_orders(id, po_number),
        items:pharmacy_credit_note_items(id, item_id, item_name, quantity, unit_price, total_price)
      `, { count: 'exact' })
      .eq('hospital_id', hospitalId)

    if (filter?.status) {
      query = query.eq('status', filter.status)
    }

    if (filter?.po_id) {
      query = query.eq('po_id', filter.po_id)
    }

    if (filter?.supplier_id) {
      query = query.eq('supplier_id', filter.supplier_id)
    }

    if (filter?.search) {
      query = query.ilike('cn_number', `%${filter.search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      data: data as unknown as CreditNoteWithRelations[],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      },
      error: null
    }
  } catch (error: any) {
    console.error('Error fetching credit notes:', error)
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      error: error.message
    }
  }
}

/**
 * Get Credit Note By ID
 */
export async function getCreditNoteById(cnId: string): Promise<ApiResponse<CreditNoteWithRelations>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Database not configured' }
    }

    const { data, error } = await supabase
      .from('pharmacy_credit_notes')
      .select(`
        *,
        supplier:suppliers(*),
        purchase_order:pharmacy_purchase_orders(*),
        items:pharmacy_credit_note_items(
          *,
          po_item:pharmacy_purchase_order_items(*)
        ),
        created_by_user:users!pharmacy_credit_notes_created_by_fkey(id, name, employee_id),
        approved_by_user:users!pharmacy_credit_notes_approved_by_fkey(id, name, employee_id)
      `)
      .eq('id', cnId)
      .single()

    if (error) throw error

    return { data: data as unknown as CreditNoteWithRelations, error: null }
  } catch (error: any) {
    console.error('Error fetching credit note by id:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get Credit Note Stats
 */
export async function getCreditNoteStats(hospitalId: string): Promise<ApiResponse<any>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: {
          total_value: 0,
          total_count: 0,
          pending_count: 0,
          avg_value: 0
        },
        error: null
      }
    }

    const { data, error } = await supabase
      .from('pharmacy_credit_notes')
      .select('total_amount, status')
      .eq('hospital_id', hospitalId)

    if (error) throw error

    let total_value = 0
    let pending_count = 0

    data.forEach(cn => {
      if (cn.status === 'approved' || cn.status === 'applied') {
        total_value += Number(cn.total_amount || 0)
      }
      if (cn.status === 'pending' || cn.status === 'draft') {
        pending_count++
      }
    })

    const approvedCount = data.length - pending_count
    const avg_value = approvedCount > 0 ? total_value / approvedCount : 0

    return {
      data: {
        total_value,
        total_count: data.length,
        pending_count,
        avg_value
      },
      error: null
    }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}
