// Sensitive Data Request Service - Hospital Admin Module
import { supabase } from './supabase'
import type {
  SensitiveDataRequest,
  SensitiveDataRequestWithRelations,
  SensitiveDataCategory,
  SensitiveDataUrgency,
  SensitiveDataRequestStatus,
  PaginatedResponse,
  SortConfig,
} from '@/types'

export interface GetSensitiveDataRequestsParams {
  page?: number
  pageSize?: number
  hospitalId?: string
  status?: SensitiveDataRequestStatus | 'all'
  urgency?: SensitiveDataUrgency | 'all'
  category?: SensitiveDataCategory | 'all'
  requestorId?: string
  search?: string
  sort?: SortConfig
}

/**
 * Get sensitive data requests with filtering and pagination
 */
export async function getSensitiveDataRequests(
  params: GetSensitiveDataRequestsParams = {}
): Promise<PaginatedResponse<SensitiveDataRequestWithRelations>> {
  const {
    page = 1,
    pageSize = 10,
    hospitalId,
    status,
    urgency,
    category,
    requestorId,
    search,
    sort,
  } = params

  try {
    let query = supabase
      .from('sensitive_data_requests')
      .select('*, requestor:users!sensitive_data_requests_requestor_id_fkey(*), approved_by_user:users!sensitive_data_requests_approved_by_fkey(*)', { count: 'exact' })

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (urgency && urgency !== 'all') {
      query = query.eq('urgency', urgency)
    }
    if (category && category !== 'all') {
      query = query.eq('data_category', category)
    }
    if (requestorId) {
      query = query.eq('requestor_id', requestorId)
    }
    if (search) {
      query = query.or(`patient_name.ilike.%${search}%,patient_ic.ilike.%${search}%,justification.ilike.%${search}%`)
    }

    if (sort) {
      query = query.order(sort.key, { ascending: sort.direction === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      // Handle table not found (404) gracefully
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('sensitive_data_requests table not found, returning empty data')
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        }
      }
      throw error
    }

    return {
      data: data as SensitiveDataRequestWithRelations[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  } catch (error) {
    // Handle any other errors gracefully
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as { code?: string; message?: string }
      if (supabaseError.code === 'PGRST205' || supabaseError.message?.includes('Could not find the table')) {
        console.warn('sensitive_data_requests table not found, returning empty data')
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        }
      }
    }
    throw error
  }
}

/**
 * Get a single request by ID
 */
export async function getSensitiveDataRequestById(id: string): Promise<SensitiveDataRequestWithRelations | null> {
  const { data, error } = await supabase
    .from('sensitive_data_requests')
    .select('*, requestor:users!sensitive_data_requests_requestor_id_fkey(*), approved_by_user:users!sensitive_data_requests_approved_by_fkey(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as SensitiveDataRequestWithRelations
}

export interface CreateSensitiveDataRequestParams {
  hospital_id: string
  requestor_id: string
  patient_id: string
  patient_name: string
  patient_ic: string
  data_category: SensitiveDataCategory
  justification: string
  urgency: SensitiveDataUrgency
  access_duration_hours: number
}

/**
 * Create a new sensitive data request
 */
export async function createSensitiveDataRequest(params: CreateSensitiveDataRequestParams): Promise<SensitiveDataRequest> {
  const { data, error } = await supabase
    .from('sensitive_data_requests')
    .insert({
      ...params,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data as SensitiveDataRequest
}

/**
 * Approve a sensitive data request
 */
export async function approveSensitiveDataRequest(
  id: string,
  approvedBy: string,
  accessDurationHours?: number
): Promise<SensitiveDataRequest> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + (accessDurationHours || 1))

  const { data, error } = await supabase
    .from('sensitive_data_requests')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      access_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SensitiveDataRequest
}

/**
 * Deny a sensitive data request
 */
export async function denySensitiveDataRequest(
  id: string,
  approvedBy: string,
  denialReason: string
): Promise<SensitiveDataRequest> {
  const { data, error } = await supabase
    .from('sensitive_data_requests')
    .update({
      status: 'denied',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      denial_reason: denialReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SensitiveDataRequest
}

/**
 * Revoke access (for active approved requests)
 */
export async function revokeAccess(id: string, _revokedBy: string): Promise<SensitiveDataRequest> {
  const { data, error } = await supabase
    .from('sensitive_data_requests')
    .update({
      status: 'revoked',
      access_expires_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SensitiveDataRequest
}

/**
 * Get request counts by status for a hospital
 */
export async function getRequestCountsByStatus(hospitalId: string): Promise<Record<SensitiveDataRequestStatus, number>> {
  const { data, error } = await supabase
    .from('sensitive_data_requests')
    .select('status')
    .eq('hospital_id', hospitalId)

  if (error) throw error

  const counts: Record<string, number> = {
    pending: 0,
    approved: 0,
    denied: 0,
    expired: 0,
    revoked: 0,
  }

  data?.forEach(r => {
    counts[r.status] = (counts[r.status] || 0) + 1
  })

  return counts as Record<SensitiveDataRequestStatus, number>
}

/**
 * Get pending counts (for dashboard widget)
 */
export async function getPendingRequestsCount(hospitalId: string): Promise<{
  total: number
  routine: number
  urgent: number
  emergency: number
}> {
  try {
    const { data, error } = await supabase
      .from('sensitive_data_requests')
      .select('urgency')
      .eq('hospital_id', hospitalId)
      .eq('status', 'pending')

    if (error) {
      // Handle table not found gracefully
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('sensitive_data_requests table not found, returning zero counts')
        return { total: 0, routine: 0, urgent: 0, emergency: 0 }
      }
      throw error
    }

    const counts = {
      total: data?.length || 0,
      routine: data?.filter(r => r.urgency === 'routine').length || 0,
      urgent: data?.filter(r => r.urgency === 'urgent').length || 0,
      emergency: data?.filter(r => r.urgency === 'emergency').length || 0,
    }

    return counts
  } catch (error) {
    // Handle any other errors gracefully
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as { code?: string; message?: string }
      if (supabaseError.code === 'PGRST205' || supabaseError.message?.includes('Could not find the table')) {
        console.warn('sensitive_data_requests table not found, returning zero counts')
        return { total: 0, routine: 0, urgent: 0, emergency: 0 }
      }
    }
    throw error
  }
}

