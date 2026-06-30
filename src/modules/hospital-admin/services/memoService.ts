// @ts-nocheck
// Memo Service - Hospital Admin Module
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type {
  Memo,
  MemoWithRelations,
  MemoType,
  MemoStatus,
  MemoPriority,
  PaginatedResponse,
  SortConfig,
} from '@/types'
import { mockUsers, mockDepartments, mockHospitals } from '@/services/mockData'

// Mock Memos Data
export const mockMemos: Memo[] = [
  {
    id: 'memo-001',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    title: 'New COVID-19 Protocol Update',
    content: '<p>Effective immediately, all staff must adhere to the updated COVID-19 protocols:</p><ul><li>Mandatory mask wearing in all patient areas</li><li>Hand sanitization every 30 minutes</li><li>Temperature checks at entry points</li></ul><p>Please review the full document attached.</p>',
    memo_type: 'policy',
    priority: 'high',
    status: 'pending_approval',
    created_by: 'user-003-pharmgr',
    publish_date: '2026-01-06',
    expiry_date: '2026-02-06',
    target_departments: ['dept-001-pharmacy', 'dept-003-nursing'],
    created_at: '2026-01-05T08:00:00Z',
    updated_at: '2026-01-05T08:00:00Z',
  },
  {
    id: 'memo-002',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    title: 'Annual Staff Appreciation Day',
    content: '<p>We are pleased to announce the Annual Staff Appreciation Day scheduled for January 15, 2026.</p><p>Location: Hospital Auditorium<br>Time: 2:00 PM - 6:00 PM</p><p>Light refreshments will be served. All staff are encouraged to attend.</p>',
    memo_type: 'event',
    priority: 'normal',
    status: 'approved',
    created_by: 'user-002-hospadmin',
    approved_by: 'user-002-hospadmin',
    approved_at: '2026-01-04T10:00:00Z',
    publish_date: '2026-01-05',
    expiry_date: '2026-01-15',
    created_at: '2026-01-04T09:00:00Z',
    updated_at: '2026-01-04T10:00:00Z',
  },
  {
    id: 'memo-003',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    title: 'System Maintenance Notice',
    content: '<p><strong>Scheduled Maintenance</strong></p><p>The hospital information system will undergo maintenance on January 10, 2026 from 2:00 AM to 4:00 AM.</p><p>During this time, the system will be unavailable. Please plan accordingly.</p>',
    memo_type: 'maintenance',
    priority: 'urgent',
    status: 'published',
    created_by: 'user-001-sysadmin',
    approved_by: 'user-002-hospadmin',
    approved_at: '2026-01-03T14:00:00Z',
    publish_date: '2026-01-03',
    expiry_date: '2026-01-10',
    created_at: '2026-01-03T12:00:00Z',
    updated_at: '2026-01-03T14:00:00Z',
  },
  {
    id: 'memo-004',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    title: 'Emergency: Blood Donation Drive',
    content: '<p><strong>URGENT: Blood Supply Critical</strong></p><p>The blood bank is experiencing critically low supplies. All eligible staff are encouraged to donate blood.</p><p>Blood donation center: Level 2, Block C<br>Operating hours: 8:00 AM - 5:00 PM</p>',
    memo_type: 'emergency',
    priority: 'urgent',
    status: 'published',
    created_by: 'user-002-hospadmin',
    approved_by: 'user-002-hospadmin',
    approved_at: '2026-01-05T06:00:00Z',
    publish_date: '2026-01-05',
    expiry_date: '2026-01-12',
    created_at: '2026-01-05T06:00:00Z',
    updated_at: '2026-01-05T06:00:00Z',
  },
  {
    id: 'memo-005',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    title: 'Updated Pharmacy Operating Hours',
    content: '<p>Starting January 15, 2026, the pharmacy department will have extended hours:</p><p>Monday - Friday: 7:00 AM - 10:00 PM<br>Saturday: 8:00 AM - 6:00 PM<br>Sunday: 9:00 AM - 4:00 PM</p>',
    memo_type: 'announcement',
    priority: 'normal',
    status: 'draft',
    created_by: 'user-003-pharmgr',
    target_departments: ['dept-001-pharmacy'],
    created_at: '2026-01-04T16:00:00Z',
    updated_at: '2026-01-04T16:00:00Z',
  },
  {
    id: 'memo-006',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    title: 'New Leave Application Process',
    content: '<p>Effective February 1, 2026, all leave applications must be submitted through the new HR portal.</p><p>Training sessions will be conducted on January 20-25, 2026. Please register with your department head.</p>',
    memo_type: 'policy',
    priority: 'normal',
    status: 'pending_approval',
    created_by: 'user-003-pharmgr',
    created_at: '2026-01-05T10:00:00Z',
    updated_at: '2026-01-05T10:00:00Z',
  },
]

// Helper to enrich memo with relations
const enrichMemoWithRelations = (memo: Memo): MemoWithRelations => {
  const hospital = mockHospitals.find(h => h.id === memo.hospital_id)
  const createdByUser = mockUsers.find(u => u.id === memo.created_by)
  const approvedByUser = memo.approved_by ? mockUsers.find(u => u.id === memo.approved_by) : undefined
  const targetDepartmentDetails = memo.target_departments
    ? mockDepartments.filter(d => memo.target_departments?.includes(d.id))
    : undefined

  return {
    ...memo,
    hospital,
    created_by_user: createdByUser,
    approved_by_user: approvedByUser,
    target_department_details: targetDepartmentDetails,
  }
}

export interface GetMemosParams {
  page?: number
  pageSize?: number
  hospitalId?: string
  status?: string
  memoType?: string
  search?: string
  sort?: SortConfig
}

/**
 * Get memos with filtering and pagination
 */
export async function getMemos(params: GetMemosParams = {}): Promise<PaginatedResponse<MemoWithRelations>> {
  const {
    page = 1,
    pageSize = 10,
    hospitalId,
    status,
    memoType,
    search,
    sort,
  } = params

  if (isSupabaseConfigured()) {
    try {
      // Supabase implementation
      let query = supabase
        .from('memos')
        .select('*, hospital:hospitals(*), created_by_user:users!memos_created_by_fkey(*), approved_by_user:users!memos_approved_by_fkey(*)', { count: 'exact' })

      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId)
      }
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      if (memoType && memoType !== 'all') {
        query = query.eq('memo_type', memoType)
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
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
          console.warn('memos table not found, returning empty data')
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
        data: data as MemoWithRelations[],
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
          console.warn('memos table not found, returning empty data')
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

    let filtered = [...mockMemos]

    if (hospitalId) {
      filtered = filtered.filter(m => m.hospital_id === hospitalId)
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(m => m.status === status)
    }
    if (memoType && memoType !== 'all') {
      filtered = filtered.filter(m => m.memo_type === memoType)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(searchLower) ||
        m.content.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    if (sort) {
      filtered.sort((a, b) => {
        const aVal = a[sort.key as keyof Memo]
        const bVal = b[sort.key as keyof Memo]
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
      data: paginatedData.map(enrichMemoWithRelations),
      total,
      page,
      pageSize,
      totalPages,
    }
  }
}

/**
 * Get a single memo by ID
 */
export async function getMemoById(id: string): Promise<MemoWithRelations | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('memos')
      .select('*, hospital:hospitals(*), created_by_user:users!memos_created_by_fkey(*), approved_by_user:users!memos_approved_by_fkey(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as MemoWithRelations
  } else {
    await new Promise(resolve => setTimeout(resolve, 200))
    const memo = mockMemos.find(m => m.id === id)
    return memo ? enrichMemoWithRelations(memo) : null
  }
}

export interface CreateMemoParams {
  hospital_id: string
  title: string
  content: string
  memo_type: MemoType
  priority: MemoPriority
  created_by: string
  publish_date?: string
  expiry_date?: string
  target_departments?: string[]
  attachments?: string[]
}

/**
 * Create a new memo (as draft or submit for approval)
 */
export async function createMemo(params: CreateMemoParams, submitForApproval: boolean = false): Promise<Memo> {
  const status: MemoStatus = submitForApproval ? 'pending_approval' : 'draft'

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('memos')
      .insert({
        ...params,
        status,
      })
      .select()
      .single()

    if (error) throw error
    return data as Memo
  } else {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const newMemo: Memo = {
      id: `memo-${Date.now()}`,
      ...params,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    mockMemos.push(newMemo)
    return newMemo
  }
}

/**
 * Approve a memo
 */
export async function approveMemo(id: string, approvedBy: string): Promise<Memo> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('memos')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Memo
  } else {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const memo = mockMemos.find(m => m.id === id)
    if (!memo) throw new Error('Memo not found')

    memo.status = 'approved'
    memo.approved_by = approvedBy
    memo.approved_at = new Date().toISOString()
    memo.updated_at = new Date().toISOString()

    return memo
  }
}

/**
 * Reject a memo
 */
export async function rejectMemo(id: string, approvedBy: string, rejectionReason: string): Promise<Memo> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('memos')
      .update({
        status: 'rejected',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Memo
  } else {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const memo = mockMemos.find(m => m.id === id)
    if (!memo) throw new Error('Memo not found')

    memo.status = 'rejected'
    memo.approved_by = approvedBy
    memo.approved_at = new Date().toISOString()
    memo.rejection_reason = rejectionReason
    memo.updated_at = new Date().toISOString()

    return memo
  }
}

/**
 * Publish a memo
 */
export async function publishMemo(id: string): Promise<Memo> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('memos')
      .update({
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Memo
  } else {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const memo = mockMemos.find(m => m.id === id)
    if (!memo) throw new Error('Memo not found')

    memo.status = 'published'
    memo.updated_at = new Date().toISOString()

    return memo
  }
}

/**
 * Get memo counts by status for a hospital
 */
export async function getMemoCountsByStatus(hospitalId: string): Promise<Record<MemoStatus, number>> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('memos')
        .select('status')
        .eq('hospital_id', hospitalId)

      if (error) {
        // Handle table not found gracefully
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('memos table not found, returning zero counts')
          return {
            draft: 0,
            pending_approval: 0,
            approved: 0,
            rejected: 0,
            published: 0,
            archived: 0,
          }
        }
        throw error
      }

      const counts: Record<string, number> = {
        draft: 0,
        pending_approval: 0,
        approved: 0,
        rejected: 0,
        published: 0,
        archived: 0,
      }

      data?.forEach(m => {
        counts[m.status] = (counts[m.status] || 0) + 1
      })

      return counts as Record<MemoStatus, number>
    } catch (error) {
      // Handle any other errors gracefully
      if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as { code?: string; message?: string }
        if (supabaseError.code === 'PGRST205' || supabaseError.message?.includes('Could not find the table')) {
          console.warn('memos table not found, returning zero counts')
          return {
            draft: 0,
            pending_approval: 0,
            approved: 0,
            rejected: 0,
            published: 0,
            archived: 0,
          }
        }
      }
      throw error
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const memos = mockMemos.filter(m => m.hospital_id === hospitalId)
    const counts: Record<string, number> = {
      draft: 0,
      pending_approval: 0,
      approved: 0,
      rejected: 0,
      published: 0,
      archived: 0,
    }

    memos.forEach(m => {
      counts[m.status] = (counts[m.status] || 0) + 1
    })

    return counts as Record<MemoStatus, number>
  }
}

