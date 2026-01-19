import { supabase } from '@/services/supabase'
import { Memo, MemoStatus, MemoType, MemoPriority, MemoWithRelations } from '@/types'

export interface CreateMemoParams {
  hospital_id: string
  title: string
  content: string
  memo_type: MemoType
  priority: MemoPriority
  target_departments?: string[]
  expiry_date?: string
  attachments?: string[]
  // New fields
  ref_number?: string
  is_letter?: boolean
  recipient_name?: string
  recipient_address?: string
  through_name?: string
  through_designation?: string
}

export interface UpdateMemoStatusParams {
  memoId: string
  status: MemoStatus
  rejection_reason?: string
}

export const getMemos = async (hospitalId: string, status?: MemoStatus | MemoStatus[]): Promise<{ data: MemoWithRelations[] | null, error: any }> => {
  let query = supabase
    .from('memos')
    .select(`
      *,
      created_by_user:created_by(
        id, 
        full_name, 
        role,
        department:departments(name)
      ),
      approved_by_user:approved_by(id, full_name)
    `)
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false })

  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status)
    } else {
      query = query.eq('status', status)
    }
  }

  const { data, error } = await query
  return { data: data as MemoWithRelations[], error }
}

export const createMemo = async (params: CreateMemoParams): Promise<{ data: Memo | null, error: any }> => {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('memos')
    .insert({
      ...params,
      created_by: userData.user.id,
      status: 'pending_approval' // Default status
    })
    .select()
    .single()

  return { data, error }
}

export const updateMemoStatus = async (params: UpdateMemoStatusParams): Promise<{ data: Memo | null, error: any }> => {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const updateData: any = {
    status: params.status,
    updated_at: new Date().toISOString()
  }

  if (params.status === 'approved') {
    updateData.approved_by = userData.user.id
    updateData.approved_at = new Date().toISOString()
  } else if (params.status === 'rejected') {
    updateData.rejection_reason = params.rejection_reason
  }

  const { data, error } = await supabase
    .from('memos')
    .update(updateData)
    .eq('id', params.memoId)
    .select()
    .single()

  return { data, error }
}

export const getMemoCountsByStatus = async (hospitalId: string): Promise<Record<MemoStatus, number>> => {
  const { data, error } = await supabase
    .from('memos')
    .select('status')
    .eq('hospital_id', hospitalId)

  const counts: Record<MemoStatus, number> = {
    draft: 0,
    pending_approval: 0,
    approved: 0,
    rejected: 0,
    published: 0,
    archived: 0
  }

  if (error) {
    console.error('Error fetching memo counts:', error)
    return counts
  }

  if (data) {
    data.forEach(memo => {
      const status = memo.status as MemoStatus
      if (counts[status] !== undefined) {
        counts[status]++
      }
    })
  }

  return counts
}

export const getLowStockSummary = async (_hospitalId: string): Promise<string> => {
  try {
    // Placeholder logic
    return ""
  } catch (e) {
    return ""
  }
}

export const memoService = {
  getMemos,
  createMemo,
  updateMemoStatus,
  getMemoCountsByStatus,
  getLowStockSummary
}
