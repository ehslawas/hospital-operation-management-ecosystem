/**
 * Pharmacy Distribution Service
 * Handles inter-facility and intra-facility transfers
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  TransferRequest,
  TransferRequestWithRelations,
  TransferRequestItem,
  TransferFilter,
  TransferRequestFormData,
} from '@/types/pharmacy'

/**
 * Get all transfer requests with optional filtering
 */
export async function getTransferRequests(
  hospitalId: string,
  filter?: TransferFilter,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<TransferRequestWithRelations>>> {
  try {
    let query = supabase
      .from('pharmacy_transfer_requests')
      .select(
        `
        *,
        items:pharmacy_transfer_request_items(*)
      `,
        { count: 'exact' }
      )
      .eq('from_hospital_id', hospitalId)

    if (filter?.search) {
      const search = filter.search.trim()
      if (search) {
        query = query.ilike('transfer_number', `%${search}%`)
      }
    }

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status)
    }

    if (filter?.transfer_type && filter.transfer_type !== 'all') {
      query = query.eq('transfer_type', filter.transfer_type)
    }

    if (filter?.priority && filter.priority !== 'all') {
      query = query.eq('priority', filter.priority)
    }

    if (filter?.date_from) {
      query = query.gte('request_date', filter.date_from)
    }

    if (filter?.date_to) {
      query = query.lte('request_date', filter.date_to)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order('request_date', { ascending: false })
      .range(from, to)

    if (error) throw error

    const rows = (data || []) as TransferRequestWithRelations[]

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
    console.error('Error fetching transfer requests:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch transfer requests',
    }
  }
}

/**
 * Get single transfer request by ID
 */
export async function getTransferRequestById(
  transferId: string
): Promise<ApiResponse<TransferRequestWithRelations>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_transfer_requests')
      .select(
        `
        *,
        items:pharmacy_transfer_request_items(*)
      `
      )
      .eq('id', transferId)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return { data: null, error: 'Transfer request not found' }
      }
      throw error
    }

    return { data: data as unknown as TransferRequestWithRelations, error: null }
  } catch (error) {
    console.error('Error fetching transfer request:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch transfer request',
    }
  }
}

/**
 * Create new transfer request
 */
export async function createTransferRequest(
  hospitalId: string,
  userId: string,
  data: TransferRequestFormData
): Promise<ApiResponse<TransferRequest>> {
  try {
    const now = new Date()
    const requestDate = now.toISOString()
    const transferNumber = `TR-${now.getFullYear()}-${String(Date.now()).slice(-4)}`

    const { data: inserted, error } = await supabase
      .from('pharmacy_transfer_requests')
      .insert({
        transfer_number: transferNumber,
        transfer_type: data.transfer_type,
        from_hospital_id: hospitalId,
        to_hospital_id: data.to_hospital_id,
        to_department_id: data.to_department_id,
        to_location_id: data.to_location_id,
        request_date: requestDate,
        required_date: data.required_date,
        status: 'pending',
        priority: data.priority,
        requested_by: userId,
        notes: data.notes,
      })
      .select('*')
      .single()

    if (error) throw error

    if (data.items && data.items.length > 0) {
      const items = data.items.map((item) => ({
        transfer_id: inserted.id,
        item_type: item.item_type,
        item_id: item.item_id,
        batch_id: item.batch_id,
        quantity_requested: item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from('pharmacy_transfer_request_items')
        .insert(items)

      if (itemsError) throw itemsError
    }

    return { data: inserted as TransferRequest, error: null }
  } catch (error) {
    console.error('Error creating transfer request:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create transfer request',
    }
  }
}

/**
 * Approve transfer request
 */
export async function approveTransferRequest(
  transferId: string,
  approverId: string
): Promise<ApiResponse<TransferRequest>> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('pharmacy_transfer_requests')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: now,
        updated_at: now,
      })
      .eq('id', transferId)
      .select('*')
      .single()

    if (error) throw error

    return { data: data as TransferRequest, error: null }
  } catch (error) {
    console.error('Error approving transfer request:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to approve transfer request',
    }
  }
}

/**
 * Reject transfer request
 */
export async function rejectTransferRequest(
  transferId: string,
  rejectorId: string,
  reason: string
): Promise<ApiResponse<TransferRequest>> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('pharmacy_transfer_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: now,
      })
      .eq('id', transferId)
      .select('*')
      .single()

    if (error) throw error

    return { data: data as TransferRequest, error: null }
  } catch (error) {
    console.error('Error rejecting transfer request:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to reject transfer request',
    }
  }
}

/**
 * Mark transfer as in transit
 */
export async function markTransferInTransit(
  transferId: string
): Promise<ApiResponse<TransferRequest>> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('pharmacy_transfer_requests')
      .update({
        status: 'in_transit',
        updated_at: now,
      })
      .eq('id', transferId)
      .select('*')
      .single()

    if (error) throw error

    return { data: data as TransferRequest, error: null }
  } catch (error) {
    console.error('Error updating transfer status:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update transfer status',
    }
  }
}

/**
 * Receive transfer
 */
export async function receiveTransfer(
  transferId: string,
  receiverId: string
): Promise<ApiResponse<TransferRequest>> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('pharmacy_transfer_requests')
      .update({
        status: 'completed',
        received_by: receiverId,
        received_at: now,
        updated_at: now,
      })
      .eq('id', transferId)
      .select('*')
      .single()

    if (error) throw error

    return { data: data as TransferRequest, error: null }
  } catch (error) {
    console.error('Error receiving transfer:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to receive transfer',
    }
  }
}

/**
 * Get pending transfers count
 */
export async function getPendingTransfersCount(
  hospitalId: string
): Promise<ApiResponse<{ incoming: number; outgoing: number }>> {
  try {
    const { data: incomingData, error: incomingError } = await supabase
      .from('pharmacy_transfer_requests')
      .select('id')
      .eq('to_hospital_id', hospitalId)
      .eq('status', 'pending')

    if (incomingError) throw incomingError

    const { data: outgoingData, error: outgoingError } = await supabase
      .from('pharmacy_transfer_requests')
      .select('id')
      .eq('from_hospital_id', hospitalId)
      .eq('status', 'pending')

    if (outgoingError) throw outgoingError

    return {
      data: {
        incoming: incomingData?.length || 0,
        outgoing: outgoingData?.length || 0,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error getting pending transfers count:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get pending transfers count',
    }
  }
}

