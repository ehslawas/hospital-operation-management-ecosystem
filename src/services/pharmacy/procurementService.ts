/**
 * Pharmacy Procurement Service
 * Handles purchase orders, goods receipts, and supplier management
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  PurchaseOrder,
  PurchaseOrderWithRelations,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptWithRelations,
  Supplier,
  SupplierWithRelations,
  ProcurementFilter,
  PurchaseOrderFormData,
  GoodsReceiptFormData,
  OrderTracking,
  SupplierPenalty,
  LOU,
} from '@/types/pharmacy'
import {
  mockPurchaseOrders,
  mockSuppliers,
} from './mockData'

// =====================================================
// PURCHASE ORDER MANAGEMENT
// =====================================================

/**
 * Get all purchase orders with optional filtering
 */
export async function getPurchaseOrders(
  hospitalId: string,
  filter?: ProcurementFilter,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<PurchaseOrderWithRelations>>> {
  try {
    if (isSupabaseConfigured()) {
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
          query = query.or(
            [
              `po_number.ilike.%${search}%`,
              `delivery_address.ilike.%${search}%`,
            ].join(',')
          )
        }
      }

      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status)
      }

      if (filter?.supplier_id) {
        query = query.eq('supplier_id', filter.supplier_id)
      }

      if (filter?.po_type && filter.po_type !== 'all') {
        query = query.eq('po_type', filter.po_type)
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
        .order('order_date', { ascending: false })
        .range(from, to)

      if (error) throw error

      const rows = (data || []) as PurchaseOrderWithRelations[]

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
    }

    // Fallback to mock data when Supabase is not configured
    let orders = [...mockPurchaseOrders]

    if (filter?.search) {
      const search = filter.search.toLowerCase()
      orders = orders.filter(o =>
        o.po_number.toLowerCase().includes(search) ||
        o.supplier?.company_name.toLowerCase().includes(search)
      )
    }

    if (filter?.status && filter.status !== 'all') {
      orders = orders.filter(o => o.status === filter.status)
    }

    if (filter?.supplier_id) {
      orders = orders.filter(o => o.supplier_id === filter.supplier_id)
    }

    if (filter?.po_type && filter.po_type !== 'all') {
      orders = orders.filter(o => o.po_type === filter.po_type)
    }

    if (filter?.date_from) {
      orders = orders.filter(o => o.order_date >= filter.date_from!)
    }

    if (filter?.date_to) {
      orders = orders.filter(o => o.order_date <= filter.date_to!)
    }

    orders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())

    const total = orders.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const data = orders.slice(start, start + pageSize)

    return {
      data: {
        data,
        total,
        page,
        pageSize,
        totalPages,
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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_purchase_orders')
        .select(
          `
          *,
          supplier:suppliers(id, supplier_code, company_name, contact_person, email, phone, address, registration_number, bank_account, bank_name, account_number, account_document_url, mof_certificate_url, supplier_type, status, performance_rating, notes, hospital_id, created_at, updated_at),
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

      return { data: data as unknown as PurchaseOrderWithRelations, error: null }
    }

    const order = mockPurchaseOrders.find(o => o.id === poId)
    
    if (!order) {
      return { data: null, error: 'Purchase order not found' }
    }

    return { data: order, error: null }
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

    if (isSupabaseConfigured()) {
      const today = new Date()
      const orderDate = today.toISOString().split('T')[0]
      const year = today.getFullYear()
      
      // Get the highest PO number for the current year and this hospital
      const { data: existingPOs, error: poError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('po_number')
        .eq('hospital_id', hospitalId)
        .like('po_number', `PO-${year}-%`)
        .order('po_number', { ascending: false })
        .limit(1)
      
      let nextNumber = 1
      if (!poError && existingPOs && existingPOs.length > 0) {
        const lastPONumber = existingPOs[0].po_number
        const match = lastPONumber.match(/PO-\d{4}-(\d{4})/)
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1
        }
      }
      
      const poNumber = `PO-${year}-${String(nextNumber).padStart(4, '0')}`

      const { data: inserted, error } = await supabase
        .from('pharmacy_purchase_orders')
        .insert({
          hospital_id: hospitalId,
          po_number: poNumber,
          po_type: data.po_type || 'regular',
          supplier_id: data.supplier_id,
          budget_id: data.budget_id,
          vote_code: data.vote_code,
          vote_activity: data.vote_activity,
          category: data.category,
          department: data.department,
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
        })
        .select('*')
        .single()

      if (error) throw error

      if (data.items.length > 0) {
        const poItems = data.items.map((item) => ({
          po_id: inserted.id,
          item_type: item.item_type,
          item_id: item.item_id,
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

      return { data: inserted as PurchaseOrder, error: null }
    }

    // Fallback mock implementation when Supabase is not configured
    await new Promise(resolve => setTimeout(resolve, 500))

    const year = new Date().getFullYear()
    const mockNextNumber = 1 // In mock mode, always start from 0001
    const poNumber = `PO-${year}-${String(mockNextNumber).padStart(4, '0')}`

    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      hospital_id: hospitalId,
      po_number: poNumber,
      po_type: data.po_type,
      supplier_id: data.supplier_id,
      budget_id: data.budget_id,
      vote_code: data.vote_code,
      vote_activity: data.vote_activity,
      category: data.category,
      department: data.department,
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: data.expected_delivery_date,
      subtotal,
      tax_amount,
      total_amount,
      payment_terms: data.payment_terms,
      delivery_address: data.delivery_address,
      status: 'draft',
      created_by: userId,
      notes: data.notes,
      created_at: new Date().toISOString(),
    }

    return { data: newOrder, error: null }
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
  userId: string,
  data: PurchaseOrderFormData
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax_amount = 0 // No tax
    const total_amount = subtotal

    if (isSupabaseConfigured()) {
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

      // Only allow editing if status is draft
      if (existingPO.status !== 'draft') {
        return { data: null, error: 'Only draft purchase orders can be edited' }
      }

      // Update the purchase order
      const { data: updated, error } = await supabase
        .from('pharmacy_purchase_orders')
        .update({
          supplier_id: data.supplier_id,
          budget_id: data.budget_id,
          vote_code: data.vote_code,
          vote_activity: data.vote_activity,
          category: data.category,
          department: data.department,
          expected_delivery_date: data.expected_delivery_date,
          subtotal,
          tax_amount,
          total_amount,
          payment_terms: data.payment_terms,
          delivery_address: data.delivery_address,
          notes: data.notes,
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

      if (data.items.length > 0) {
        const poItems = data.items.map((item) => ({
          po_id: poId,
          item_type: item.item_type,
          item_id: item.item_id,
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

      return { data: updated as PurchaseOrder, error: null }
    }

    // Fallback mock implementation when Supabase is not configured
    await new Promise(resolve => setTimeout(resolve, 500))

    const existingOrder = mockPurchaseOrders.find(o => o.id === poId)
    if (!existingOrder) {
      return { data: null, error: 'Purchase order not found' }
    }

    if (existingOrder.status !== 'draft') {
      return { data: null, error: 'Only draft purchase orders can be edited' }
    }

    const updated: PurchaseOrder = {
      ...existingOrder,
      supplier_id: data.supplier_id,
      budget_id: data.budget_id,
      vote_code: data.vote_code,
      vote_activity: data.vote_activity,
      category: data.category,
      department: data.department,
      expected_delivery_date: data.expected_delivery_date,
      subtotal,
      tax_amount,
      total_amount,
      payment_terms: data.payment_terms,
      delivery_address: data.delivery_address,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    }

    const idx = mockPurchaseOrders.findIndex(o => o.id === poId)
    if (idx !== -1) {
      mockPurchaseOrders[idx] = updated
    }

    return { data: updated, error: null }
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
export async function submitPurchaseOrder(poId: string): Promise<ApiResponse<PurchaseOrder>> {
  try {
    if (isSupabaseConfigured()) {
      // Update status to pending_approval
      const { data: updated, error } = await supabase
        .from('pharmacy_purchase_orders')
        .update({
          status: 'pending_approval',
          updated_at: new Date().toISOString(),
        })
        .eq('id', poId)
        .select()
        .single()

      if (error) throw error
      return { data: updated as PurchaseOrder, error: null }
    }

    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))

    const order = mockPurchaseOrders.find(o => o.id === poId)
    if (!order) {
      return { data: null, error: 'Purchase order not found' }
    }

    const updated = {
      ...order,
      status: 'pending_approval' as const,
      updated_at: new Date().toISOString(),
    }

    return { data: updated, error: null }
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
    if (isSupabaseConfigured()) {
      // Update status to approved and set approver info
      const { data: updated, error } = await supabase
        .from('pharmacy_purchase_orders')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', poId)
        .select()
        .single()

      if (error) throw error
      return { data: updated as PurchaseOrder, error: null }
    }

    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))

    const order = mockPurchaseOrders.find(o => o.id === poId)
    if (!order) {
      return { data: null, error: 'Purchase order not found' }
    }

    const updated = {
      ...order,
      status: 'approved' as const,
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return { data: updated, error: null }
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
  rejectorId: string,
  reason: string
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    const order = mockPurchaseOrders.find(o => o.id === poId)
    if (!order) {
      return { data: null, error: 'Purchase order not found' }
    }

    const updated = {
      ...order,
      status: 'cancelled' as const,
      notes: `Rejected: ${reason}`,
      updated_at: new Date().toISOString(),
    }

    return { data: updated, error: null }
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
  userId: string
): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured()) {
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
    }

    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))

    const orderIndex = mockPurchaseOrders.findIndex(o => o.id === poId)
    if (orderIndex === -1) {
      return { data: null, error: 'Purchase order not found' }
    }

    const order = mockPurchaseOrders[orderIndex]
    if (order.status !== 'draft') {
      return { data: null, error: 'Only draft purchase orders can be deleted' }
    }

    mockPurchaseOrders.splice(orderIndex, 1)
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
    if (isSupabaseConfigured()) {
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
      return { data: updated as PurchaseOrder, error: null }
    }

    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))

    const order = mockPurchaseOrders.find(o => o.id === poId)
    if (!order) {
      return { data: null, error: 'Purchase order not found' }
    }

    const updated = {
      ...order,
      status: 'sent' as const,
      updated_at: new Date().toISOString(),
    }

    return { data: updated, error: null }
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
    if (isSupabaseConfigured()) {
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
    }

    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))

    const newReceipt: GoodsReceipt = {
      id: `gr-${Date.now()}`,
      hospital_id: hospitalId,
      gr_number: `GR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      po_id: data.po_id,
      receipt_date: new Date().toISOString().split('T')[0],
      delivery_note_number: data.delivery_note_number,
      invoice_number: data.invoice_number,
      invoice_amount: data.invoice_amount,
      status: 'pending',
      received_by: userId,
      notes: data.notes,
      created_at: new Date().toISOString(),
    }

    return { data: newReceipt, error: null }
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
  hospitalId?: string,
  page: number = 1,
  pageSize: number = 10,
  filter?: SupplierFilter
): Promise<ApiResponse<PaginatedResponse<Supplier>>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('suppliers')
        .select('*', { count: 'exact' })

      // Always show global suppliers (hospital_id IS NULL)
      // If hospitalId is provided, also show hospital-specific suppliers
      // Note: For now, showing all suppliers regardless of hospital_id to ensure global suppliers are visible
      // TODO: Refine this to properly filter by hospital_id when needed
      // if (hospitalId) {
      //   query = query.or(`hospital_id.eq.${hospitalId},hospital_id.is.null`)
      // } else {
      //   query = query.is('hospital_id', null)
      // }

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
    }

    // Fallback to mock data
    let suppliers = [...mockSuppliers]

    if (filter?.status && filter.status !== 'all') {
      suppliers = suppliers.filter(s => s.status === filter.status)
    }

    if (filter?.supplier_type && filter.supplier_type !== 'all') {
      suppliers = suppliers.filter(s => s.supplier_type === filter.supplier_type)
    }

    if (filter?.search) {
      const search = filter.search.toLowerCase()
      suppliers = suppliers.filter(s =>
        s.company_name.toLowerCase().includes(search) ||
        s.supplier_code.toLowerCase().includes(search) ||
        (s.contact_person || '').toLowerCase().includes(search)
      )
    }

    const total = suppliers.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const data = suppliers.slice(start, start + pageSize)

    return {
      data: {
        data,
        total,
        page,
        pageSize,
        totalPages,
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
    if (isSupabaseConfigured()) {
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
    }

    const supplier = mockSuppliers.find(s => s.id === supplierId)
    
    if (!supplier) {
      return { data: null, error: 'Supplier not found' }
    }

    return { data: supplier as SupplierWithRelations, error: null }
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
    if (isSupabaseConfigured()) {
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
    }

    const suppliers = mockSuppliers.filter(s => s.status === 'active')
    return { data: suppliers, error: null }
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
    if (!isSupabaseConfigured()) {
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
 */
export async function createSupplier(
  hospitalId: string | null,
  data: Partial<Supplier>
): Promise<ApiResponse<Supplier>> {
  try {
    const insertData: Partial<Supplier> = {
      supplier_code: data.supplier_code || `SUP-${Date.now().toString(36).toUpperCase()}`,
      company_name: data.company_name || '',
      contact_person: data.contact_person || null || undefined,
      contact_person_phone: data.contact_person_phone || null || undefined,
      email: data.email || null || undefined,
      phone: data.phone || null || undefined,
      address: data.address || null || undefined,
      registration_number: data.registration_number || null || undefined,
      bank_account: data.bank_account || null || undefined,
      bank_name: data.bank_name || null || undefined,
      supplier_type: data.supplier_type || 'both',
      status: data.status || 'active',
      performance_rating: data.performance_rating || null || undefined,
      notes: data.notes || null || undefined,
      account_number: data.account_number || null || undefined,
      account_document_url: data.account_document_url || null || undefined,
      mof_certificate_url: data.mof_certificate_url || null || undefined,
      hospital_id: hospitalId || undefined,
    } as any

    if (isSupabaseConfigured()) {
      const { data: created, error } = await supabase
        .from('suppliers')
        .insert(insertData)
        .select('*')
        .single()

      if (error) {
        console.error('Error creating supplier in Supabase:', error)
        return {
          data: null,
          error: error.message || 'Failed to create supplier',
        }
      }

      return { data: created as Supplier, error: null }
    }

    // Fallback to mock data
    const newSupplier: Supplier = {
      id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      ...insertData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Supplier

    mockSuppliers.push(newSupplier)
    console.warn('[createSupplier] Created supplier in MOCK data only:', newSupplier.company_name)

    return { data: newSupplier, error: null }
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

    if (isSupabaseConfigured()) {
      const { data: updated, error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', supplierId)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating supplier in Supabase:', error)
        return {
          data: null,
          error: error.message || 'Failed to update supplier',
        }
      }

      return { data: updated as Supplier, error: null }
    }

    const existing = mockSuppliers.find(s => s.id === supplierId)
    if (!existing) {
      return { data: null, error: 'Supplier not found' }
    }

    const merged: Supplier = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    }

    const idx = mockSuppliers.findIndex(s => s.id === supplierId)
    if (idx !== -1) {
      mockSuppliers[idx] = merged
    }

    return { data: merged, error: null }
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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_order_tracking')
        .select('*')
        .eq('po_id', poId)
        .order('status_date', { ascending: true })

      if (error) throw error

      return { data: (data || []) as OrderTracking[], error: null }
    }

    // Minimal synthetic history when Supabase is not configured
    const tracking: OrderTracking[] = [
      {
        id: `track-${poId}-1`,
        po_id: poId,
        status: 'Order Created',
        status_date: new Date().toISOString(),
        notes: 'Purchase order created',
        updated_by: 'system',
        created_at: new Date().toISOString(),
      },
    ]

    return { data: tracking, error: null }
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
    if (isSupabaseConfigured()) {
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
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    const newTracking: OrderTracking = {
      id: `track-${Date.now()}`,
      po_id: poId,
      status,
      status_date: new Date().toISOString(),
      notes,
      updated_by: userId,
      created_at: new Date().toISOString(),
    }

    return { data: newTracking, error: null }
  } catch (error) {
    console.error('Error adding tracking update:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to add tracking update',
    }
  }
}

