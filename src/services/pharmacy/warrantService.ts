/**
 * Pharmacy Warrant Service
 * Handles government allocated funds (warrants) for hospital pharmacy use
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse } from '@/types'
import type {
  Warrant,
  WarrantFormData,
  WarrantSummary,
  WarrantCategory,
  WarrantDepartment,
  WarrantVoteCode,
} from '@/types/pharmacy'

/**
 * Get all warrants for a hospital
 */
export async function getWarrants(
  hospitalId: string,
  filters?: {
    startDate?: string
    endDate?: string
    category?: WarrantCategory
    department?: WarrantDepartment
    voteCode?: WarrantVoteCode
  }
): Promise<ApiResponse<Warrant[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_warrants')
        .select('*')
        .eq('hospital_id', hospitalId)

      if (filters?.startDate) {
        query = query.gte('warrant_date', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('warrant_date', filters.endDate)
      }

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.department) {
        query = query.eq('department', filters.department)
      }

      if (filters?.voteCode) {
        query = query.eq('vote_code', filters.voteCode)
      }

      const { data, error } = await query.order('warrant_date', { ascending: false })

      if (error) throw error

      return { data: (data || []) as Warrant[], error: null }
    }

    // Fallback: return empty array when Supabase is not configured
    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching warrants:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch warrants',
    }
  }
}

/**
 * Get a single warrant by ID with user relations
 */
export async function getWarrantById(warrantId: string): Promise<ApiResponse<Warrant & { created_by_user?: { full_name: string; email: string } }>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_warrants')
        .select(`
          *,
          created_by_user:users!created_by(full_name, email)
        `)
        .eq('id', warrantId)
        .single()

      if (error) throw error

      return { data: data as Warrant & { created_by_user?: { full_name: string; email: string } }, error: null }
    }

    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error fetching warrant:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch warrant',
    }
  }
}

/**
 * Create a new warrant
 */
export async function createWarrant(
  hospitalId: string,
  userId: string,
  data: WarrantFormData
): Promise<ApiResponse<Warrant>> {
  try {
    if (isSupabaseConfigured()) {
      const { data: inserted, error } = await supabase
        .from('pharmacy_warrants')
        .insert({
          hospital_id: hospitalId,
          warrant_date: data.warrant_date,
          document_no: data.document_no,
          vote_code: data.vote_code,
          vote_activity: data.vote_activity,
          category: data.category,
          department: data.department,
          amount: data.amount,
          created_by: userId,
        })
        .select('*')
        .single()

      if (error) throw error

      return { data: inserted as Warrant, error: null }
    }

    // Mock response for development
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newWarrant: Warrant = {
      id: `warrant-${Date.now()}`,
      hospital_id: hospitalId,
      warrant_date: data.warrant_date,
      document_no: data.document_no,
      vote_code: data.vote_code,
      vote_activity: data.vote_activity,
      category: data.category,
      department: data.department,
      amount: data.amount,
      created_by: userId,
      created_at: new Date().toISOString(),
    }

    return { data: newWarrant, error: null }
  } catch (error: any) {
    console.error('Error creating warrant:', error)
    
    // Handle unique constraint violation
    if (error?.code === '23505') {
      if (error?.constraint === 'unique_warrant_document_vote_dept') {
        return {
          data: null,
          error: 'A warrant with this document number, vote code, vote activity, and department already exists for this hospital.',
        }
      }
      return {
        data: null,
        error: 'A warrant with this combination already exists. Please use a different document number or change the vote code/activity/department.',
      }
    }
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create warrant',
    }
  }
}

/**
 * Update an existing warrant
 */
export async function updateWarrant(
  warrantId: string,
  data: Partial<WarrantFormData>
): Promise<ApiResponse<Warrant>> {
  try {
    if (isSupabaseConfigured()) {
      const { data: updated, error } = await supabase
        .from('pharmacy_warrants')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', warrantId)
        .select('*')
        .single()

      if (error) throw error

      return { data: updated as Warrant, error: null }
    }

    return { data: null, error: 'Supabase not configured' }
  } catch (error: any) {
    console.error('Error updating warrant:', error)
    
    // Handle unique constraint violation
    if (error?.code === '23505') {
      if (error?.constraint === 'unique_warrant_document_vote_dept') {
        return {
          data: null,
          error: 'A warrant with this document number, vote code, vote activity, and department already exists for this hospital.',
        }
      }
      return {
        data: null,
        error: 'A warrant with this combination already exists. Please use a different document number or change the vote code/activity/department.',
      }
    }
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update warrant',
    }
  }
}

/**
 * Delete a warrant
 */
export async function deleteWarrant(warrantId: string): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('pharmacy_warrants')
        .delete()
        .eq('id', warrantId)

      if (error) throw error

      return { data: true, error: null }
    }

    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error deleting warrant:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete warrant',
    }
  }
}

/**
 * Get warrant summary/dashboard data with filters
 */
export async function getWarrantSummary(
  hospitalId: string,
  year?: number,
  filters?: {
    category?: WarrantCategory
    department?: WarrantDepartment
    voteCode?: WarrantVoteCode
  }
): Promise<ApiResponse<WarrantSummary>> {
  try {
    const currentYear = year || new Date().getFullYear()
    const startDate = `${currentYear}-01-01`
    const endDate = `${currentYear}-12-31`

    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_warrants')
        .select('*')
        .eq('hospital_id', hospitalId)
        .gte('warrant_date', startDate)
        .lte('warrant_date', endDate)

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.department) {
        query = query.eq('department', filters.department)
      }

      if (filters?.voteCode) {
        query = query.eq('vote_code', filters.voteCode)
      }

      const { data: warrants, error } = await query.order('warrant_date', { ascending: false })

      if (error) throw error

      const warrantsList = (warrants || []) as Warrant[]

      // Fetch purchase orders for the same fiscal year to calculate expenses
      let poQuery = supabase
        .from('pharmacy_purchase_orders')
        .select('vote_code, vote_activity, category, department, total_amount, status')
        .eq('hospital_id', hospitalId)
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .in('status', ['approved', 'sent', 'partial_received', 'completed'])

      if (filters?.category) {
        poQuery = poQuery.eq('category', filters.category)
      }

      if (filters?.department) {
        poQuery = poQuery.eq('department', filters.department)
      }

      if (filters?.voteCode) {
        poQuery = poQuery.eq('vote_code', filters.voteCode)
      }

      const { data: purchaseOrders, error: poError } = await poQuery

      if (poError) {
        console.error('Error fetching purchase orders for warrant summary:', poError)
        // Continue with expenses = 0 if PO query fails
      }

      // Calculate summary with actual purchase order data
      const summary = calculateWarrantSummary(warrantsList, purchaseOrders || [])

      return { data: summary, error: null }
    }

    // Fallback: return empty summary
    const emptySummary: WarrantSummary = {
      total_allocation: 0,
      total_expenses: 0,
      total_balance: 0,
      total_liabilities: 0,
      net_expenses: 0,
      usage_percentage: 0,
      total_count: 0,
      by_category: [],
      by_department: [],
      by_vote_code: [],
      recent_warrants: [],
    }

    return { data: emptySummary, error: null }
  } catch (error) {
    console.error('Error fetching warrant summary:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch warrant summary',
    }
  }
}

/**
 * Helper function to calculate warrant summary from list
 * Now includes purchase orders to calculate actual expenses and liabilities
 */
function calculateWarrantSummary(
  warrants: Warrant[],
  purchaseOrders: Array<{
    vote_code?: string | null
    vote_activity?: string | null
    category?: string | null
    department?: string | null
    total_amount?: number | null
    status?: string | null
  }> = []
): WarrantSummary {
  const total_allocation = warrants.reduce((sum, w) => sum + Number(w.amount), 0)
  const total_count = warrants.length
  
  // Calculate expenses from purchase orders
  // Expenses: approved, sent, partial_received, completed (all committed/actual expenses)
  const total_expenses = purchaseOrders
    .filter((po) => po.total_amount && ['approved', 'sent', 'partial_received', 'completed'].includes(po.status || ''))
    .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)

  // Liabilities: approved, sent, partial_received (committed but not yet fully paid/completed)
  const total_liabilities = purchaseOrders
    .filter((po) => po.total_amount && ['approved', 'sent', 'partial_received'].includes(po.status || ''))
    .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)

  const total_balance = total_allocation - total_expenses
  const net_expenses = total_expenses - total_liabilities
  const usage_percentage = total_allocation > 0 ? (total_expenses / total_allocation) * 100 : 0

  // Group by category
  const categoryMap = new Map<WarrantCategory, { allocation: number; expenses: number; balance: number; count: number }>()
  warrants.forEach((w) => {
    const existing = categoryMap.get(w.category) || { allocation: 0, expenses: 0, balance: 0, count: 0 }
    const allocation = existing.allocation + Number(w.amount)
    
    // Calculate expenses for this category from matching purchase orders
    const categoryExpenses = purchaseOrders
      .filter((po) => 
        po.category === w.category &&
        po.total_amount &&
        ['approved', 'sent', 'partial_received', 'completed'].includes(po.status || '')
      )
      .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)
    
    categoryMap.set(w.category, {
      allocation,
      expenses: categoryExpenses,
      balance: allocation - categoryExpenses,
      count: existing.count + 1,
    })
  })
  const by_category = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      ...data,
    }))
    .sort((a, b) => b.allocation - a.allocation)

  // Group by department
  const deptMap = new Map<WarrantDepartment, { allocation: number; expenses: number; balance: number; count: number }>()
  warrants.forEach((w) => {
    const existing = deptMap.get(w.department) || { allocation: 0, expenses: 0, balance: 0, count: 0 }
    const allocation = existing.allocation + Number(w.amount)
    
    // Calculate expenses for this department from matching purchase orders
    const deptExpenses = purchaseOrders
      .filter((po) => 
        po.department === w.department &&
        po.total_amount &&
        ['approved', 'sent', 'partial_received', 'completed'].includes(po.status || '')
      )
      .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)
    
    deptMap.set(w.department, {
      allocation,
      expenses: deptExpenses,
      balance: allocation - deptExpenses,
      count: existing.count + 1,
    })
  })
  const by_department = Array.from(deptMap.entries())
    .map(([department, data]) => ({
      department,
      ...data,
    }))
    .sort((a, b) => b.allocation - a.allocation)

  // Group by vote code
  const voteCodeMap = new Map<WarrantVoteCode, { allocation: number; expenses: number; balance: number; count: number }>()
  warrants.forEach((w) => {
    const existing = voteCodeMap.get(w.vote_code) || { allocation: 0, expenses: 0, balance: 0, count: 0 }
    const allocation = existing.allocation + Number(w.amount)
    
    // Calculate expenses for this vote code from matching purchase orders
    // Match by vote_code and vote_activity
    const voteExpenses = purchaseOrders
      .filter((po) => 
        po.vote_code === w.vote_code &&
        po.vote_activity === w.vote_activity &&
        po.total_amount &&
        ['approved', 'sent', 'partial_received', 'completed'].includes(po.status || '')
      )
      .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)
    
    voteCodeMap.set(w.vote_code, {
      allocation,
      expenses: voteExpenses,
      balance: allocation - voteExpenses,
      count: existing.count + 1,
    })
  })
  const by_vote_code = Array.from(voteCodeMap.entries())
    .map(([vote_code, data]) => ({
      vote_code,
      ...data,
    }))
    .sort((a, b) => b.allocation - a.allocation)

  // Recent warrants (last 5)
  const recent_warrants = warrants.slice(0, 5)

  return {
    total_allocation,
    total_expenses,
    total_balance,
    total_liabilities,
    net_expenses,
    usage_percentage,
    total_count,
    by_category,
    by_department,
    by_vote_code,
    recent_warrants,
  }
}

// Export constants for dropdowns
export const WARRANT_VOTE_CODES = [
  { value: '080702', label: '080702' },
  { value: '990102', label: '990102' },
] as const

export const WARRANT_VOTE_ACTIVITIES = [
  { value: '27401', label: '27401' },
  { value: '27499', label: '27499' },
  { value: '27404', label: '27404' },
  { value: '27403', label: '27403' },
  { value: '27402', label: '27402' },
  { value: '27501', label: '27501' },
] as const

export const WARRANT_CATEGORIES = [
  { value: 'drug', label: 'Drug' },
  { value: 'non_drug', label: 'Non Drug' },
  { value: 'non_standard', label: 'Non Standard' },
  { value: 'reagent', label: 'Reagent' },
  { value: 'vaccine', label: 'Vaccine' },
  { value: 'insulin', label: 'Insulin' },
  { value: 'hepc', label: 'HepC' },
  { value: 'medical_oxygen', label: 'Medical Oxygen' },
] as const

export const WARRANT_DEPARTMENTS = [
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'nephrology', label: 'Nephrology' },
  { value: 'radiology_radiography', label: 'Radiology & Radiography' },
  { value: 'emergency_trauma', label: 'Emergency Trauma' },
  { value: 'cssu_cssd', label: 'CSSU & CSSD' },
  { value: 'operation_theater', label: 'Operation Theater' },
  { value: 'laboratory_pathology', label: 'Laboratory & Pathology' },
  { value: 'general_ward', label: 'General Ward' },
  { value: 'wound_care', label: 'Wound Care' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'anaesthesiology', label: 'Anaesthesiology' },
] as const

