// @ts-nocheck
// Sensitive Data Request Service - Hospital Admin Module
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type {
  SensitiveDataRequest,
  SensitiveDataRequestWithRelations,
  SensitiveDataCategory,
  SensitiveDataUrgency,
  SensitiveDataRequestStatus,
  PaginatedResponse,
  SortConfig,
} from '@/types'
import { mockUsers } from '@/services/mockData'

// Mock Sensitive Data Requests
export const mockSensitiveDataRequests: SensitiveDataRequest[] = [
  {
    id: 'sdr-001',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    requestor_id: 'user-003-pharmgr',
    patient_id: 'patient-001',
    patient_name: 'Ahmad bin Hassan',
    patient_ic: '850612-01-5566',
    data_category: 'phi',
    justification: 'Need to verify patient medication history for drug interaction check before dispensing new prescription.',
    urgency: 'routine',
    status: 'pending',
    access_duration_hours: 1,
    created_at: '2026-01-05T09:00:00Z',
    updated_at: '2026-01-05T09:00:00Z',
  },
  {
    id: 'sdr-002',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    requestor_id: 'user-003-pharmgr',
    patient_id: 'patient-002',
    patient_name: 'Siti Aminah binti Yusof',
    patient_ic: '900315-08-7788',
    data_category: 'all',
    justification: 'Emergency patient transfer - need complete medical history for receiving hospital.',
    urgency: 'emergency',
    status: 'approved',
    access_duration_hours: 4,
    approved_by: 'user-002-hospadmin',
    approved_at: '2026-01-05T08:35:00Z',
    access_expires_at: '2026-01-05T12:35:00Z',
    created_at: '2026-01-05T08:30:00Z',
    updated_at: '2026-01-05T08:35:00Z',
  },
  {
    id: 'sdr-003',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    requestor_id: 'user-003-pharmgr',
    patient_id: 'patient-003',
    patient_name: 'Tan Mei Ling',
    patient_ic: '880720-10-4455',
    data_category: 'financial',
    justification: 'Patient requesting billing statement for insurance claim.',
    urgency: 'routine',
    status: 'denied',
    access_duration_hours: 1,
    approved_by: 'user-002-hospadmin',
    approved_at: '2026-01-04T16:00:00Z',
    denial_reason: 'Financial records should be requested through billing department. Please redirect patient to billing counter.',
    created_at: '2026-01-04T15:30:00Z',
    updated_at: '2026-01-04T16:00:00Z',
  },
  {
    id: 'sdr-004',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    requestor_id: 'user-003-pharmgr',
    patient_id: 'patient-004',
    patient_name: 'Muthu a/l Krishnan',
    patient_ic: '750505-05-3344',
    data_category: 'phi',
    justification: 'Need to review patient allergy history before administering new medication.',
    urgency: 'urgent',
    status: 'pending',
    access_duration_hours: 2,
    created_at: '2026-01-05T10:15:00Z',
    updated_at: '2026-01-05T10:15:00Z',
  },
  {
    id: 'sdr-005',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    requestor_id: 'user-003-pharmgr',
    patient_id: 'patient-005',
    patient_name: 'Noraini binti Abdullah',
    patient_ic: '820910-14-6677',
    data_category: 'contact',
    justification: 'Need to contact patient next of kin regarding medication pickup.',
    urgency: 'routine',
    status: 'expired',
    access_duration_hours: 1,
    approved_by: 'user-002-hospadmin',
    approved_at: '2026-01-03T10:00:00Z',
    access_expires_at: '2026-01-03T11:00:00Z',
    created_at: '2026-01-03T09:30:00Z',
    updated_at: '2026-01-03T11:00:00Z',
  },
]

// Helper to enrich request with relations
const enrichRequestWithRelations = (request: SensitiveDataRequest): SensitiveDataRequestWithRelations => {
  const requestor = mockUsers.find(u => u.id === request.requestor_id)
  const approvedByUser = request.approved_by ? mockUsers.find(u => u.id === request.approved_by) : undefined

  return {
    ...request,
    requestor,
    approved_by_user: approvedByUser,
  }
}

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

  if (isSupabaseConfigured()) {
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
  } else {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300))

    let filtered = [...mockSensitiveDataRequests]

    if (hospitalId) {
      filtered = filtered.filter(r => r.hospital_id === hospitalId)
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(r => r.status === status)
    }
    if (urgency && urgency !== 'all') {
      filtered = filtered.filter(r => r.urgency === urgency)
    }
    if (category && category !== 'all') {
      filtered = filtered.filter(r => r.data_category === category)
    }
    if (requestorId) {
      filtered = filtered.filter(r => r.requestor_id === requestorId)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(r =>
        r.patient_name.toLowerCase().includes(searchLower) ||
        r.patient_ic.includes(search) ||
        r.justification.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    if (sort) {
      filtered.sort((a, b) => {
        const aVal = a[sort.key as keyof SensitiveDataRequest]
        const bVal = b[sort.key as keyof SensitiveDataRequest]
        if (aVal === undefined || bVal === undefined) return 0
        if (sort.direction === 'asc') {
          return aVal > bVal ? 1 : -1
        }
        return aVal < bVal ? 1 : -1
      })
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paginatedData = filtered.slice(start, start + pageSize)

    return {
      data: paginatedData.map(enrichRequestWithRelations),
      total,
      page,
      pageSize,
      totalPages,
    }
  }
}

/**
 * Get a single request by ID
 */
export async function getSensitiveDataRequestById(id: string): Promise<SensitiveDataRequestWithRelations | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('sensitive_data_requests')
      .select('*, requestor:users!sensitive_data_requests_requestor_id_fkey(*), approved_by_user:users!sensitive_data_requests_approved_by_fkey(*)')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data as SensitiveDataRequestWithRelations
  } else {
    await new Promise(resolve => setTimeout(resolve, 200))
    const request = mockSensitiveDataRequests.find(r => r.id === id)
    return request ? enrichRequestWithRelations(request) : null
  }
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
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('sensitive_data_requests')
      .insert({
        ...params,
        status: 'pending',
      })
      .select()
      .maybeSingle()

    if (error) throw error
    return data as SensitiveDataRequest
  } else {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const newRequest: SensitiveDataRequest = {
      id: `sdr-${Date.now()}`,
      ...params,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    mockSensitiveDataRequests.push(newRequest)
    return newRequest
  }
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

  if (isSupabaseConfigured()) {
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
      .maybeSingle()

    if (error) throw error
    return data as SensitiveDataRequest
  } else {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const request = mockSensitiveDataRequests.find(r => r.id === id)
    if (!request) throw new Error('Request not found')

    request.status = 'approved'
    request.approved_by = approvedBy
    request.approved_at = new Date().toISOString()
    request.access_expires_at = expiresAt.toISOString()
    request.updated_at = new Date().toISOString()

    return request
  }
}

/**
 * Deny a sensitive data request
 */
export async function denySensitiveDataRequest(
  id: string, 
  approvedBy: string,
  denialReason: string
): Promise<SensitiveDataRequest> {
  if (isSupabaseConfigured()) {
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
      .maybeSingle()

    if (error) throw error
    return data as SensitiveDataRequest
  } else {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const request = mockSensitiveDataRequests.find(r => r.id === id)
    if (!request) throw new Error('Request not found')

    request.status = 'denied'
    request.approved_by = approvedBy
    request.approved_at = new Date().toISOString()
    request.denial_reason = denialReason
    request.updated_at = new Date().toISOString()

    return request
  }
}

/**
 * Revoke access (for active approved requests)
 */
export async function revokeAccess(id: string, revokedBy: string): Promise<SensitiveDataRequest> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('sensitive_data_requests')
      .update({
        status: 'revoked',
        access_expires_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) throw error
    return data as SensitiveDataRequest
  } else {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const request = mockSensitiveDataRequests.find(r => r.id === id)
    if (!request) throw new Error('Request not found')

    request.status = 'revoked'
    request.access_expires_at = new Date().toISOString()
    request.updated_at = new Date().toISOString()

    return request
  }
}

/**
 * Get request counts by status for a hospital
 */
export async function getRequestCountsByStatus(hospitalId: string): Promise<Record<SensitiveDataRequestStatus, number>> {
  if (isSupabaseConfigured()) {
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
  } else {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const requests = mockSensitiveDataRequests.filter(r => r.hospital_id === hospitalId)
    const counts: Record<string, number> = {
      pending: 0,
      approved: 0,
      denied: 0,
      expired: 0,
      revoked: 0,
    }

    requests.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1
    })

    return counts as Record<SensitiveDataRequestStatus, number>
  }
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
  if (isSupabaseConfigured()) {
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
  } else {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const pending = mockSensitiveDataRequests.filter(
      r => r.hospital_id === hospitalId && r.status === 'pending'
    )

    return {
      total: pending.length,
      routine: pending.filter(r => r.urgency === 'routine').length,
      urgent: pending.filter(r => r.urgency === 'urgent').length,
      emergency: pending.filter(r => r.urgency === 'emergency').length,
    }
  }
}

