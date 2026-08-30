// @ts-nocheck
/**
 * Pharmacy Warrant Service
 * Handles government allocated funds (warrants) for hospital pharmacy use
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
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
 * Shared department groups for budget allocation
 */
export const SHARED_DEPARTMENT_GROUPS: Record<string, string[]> = {
  general_ward: ['general_ward', 'maternity_ward', 'paediatric_ward'],
  emergency_trauma: ['emergency_trauma', 'klinik_pakar'],
}

/**
 * Returns all departments that share a budget with the given department
 */
export function getSharedDepartments(department: string): string[] {
  for (const group of Object.values(SHARED_DEPARTMENT_GROUPS)) {
    if (group.includes(department)) {
      return group
    }
  }
  return [department]
}

/**
 * Returns the primary department for a shared group
 */
export function getPrimaryDepartment(department: string): string {
  for (const [primary, group] of Object.entries(SHARED_DEPARTMENT_GROUPS)) {
    if (group.includes(department)) {
      return primary
    }
  }
  return department
}

/**
 * Normalize department names from various sources (legacy POs, etc.)
 */
export function normalize(d: string | null): string {
  if (!d) return ''
  const lower = d.trim().toLowerCase()
  
  // Strict matching to prevent "General Surgery" from being counted as "General Ward"
  if (lower === 'general ward' || lower === 'general_ward' || lower === 'wad general' || lower === 'general') return 'general_ward'
  if (lower === 'maternity ward' || lower === 'maternity_ward' || lower === 'wad maternity' || lower === 'wad bersalin' || lower === 'maternity') return 'maternity_ward'
  if (lower === 'paediatric ward' || lower === 'paediatric_ward' || lower === 'wad pediatrik' || lower === 'paediatric' || lower === 'paed') return 'paediatric_ward'
  if (lower === 'emergency' || lower === 'trauma' || lower === 'emergency_trauma' || lower === 'kecemasan') return 'emergency_trauma'
  if (lower === 'klinik pakar' || lower === 'klinik_pakar' || lower === 'specialist clinic' || lower === 'pakar') return 'klinik_pakar'
  
  return d as string
}

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
    voteActivity?: string
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

      if (filters?.department && (filters.department as string) !== 'all') {
        const sharedDepts = getSharedDepartments(filters.department)
        query = query.in('department', sharedDepts)
      }

      if (filters?.voteCode) {
        query = query.eq('vote_code', filters.voteCode)
      }

      if (filters?.voteActivity) {
        query = query.eq('vote_activity', filters.voteActivity)
      }

      const { data, error } = await query.order('warrant_date', { ascending: false })

      if (error) throw error

      return { data: (data || []) as Warrant[], error: null }
    }

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
    return { data: null, error: 'Supabase not configured' }
  } catch (error: any) {
    console.error('Error creating warrant:', error)
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

      if (filters?.department && (filters.department as string) !== 'all') {
        const sharedDepts = getSharedDepartments(filters.department)
        query = query.in('department', sharedDepts)
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

      if (filters?.department && (filters.department as string) !== 'all') {
        const sharedDepts = getSharedDepartments(filters.department)
        poQuery = poQuery.in('department', sharedDepts)
      }

      if (filters?.voteCode) {
        poQuery = poQuery.eq('vote_code', filters.voteCode)
      }

      const { data: purchaseOrders, error: poError } = await poQuery
      if (poError) {
        console.error('Error fetching POs for summary:', poError)
      }

      const summary = calculateWarrantSummary(warrantsList, purchaseOrders || [])
      return { data: summary, error: null }
    }

    return { data: null as any, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error fetching warrant summary:', error)
    return {
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to fetch warrant summary',
    }
  }
}

/**
 * Core calculation logic for warrant aggregation
 */
function calculateWarrantSummary(
  warrants: Warrant[],
  purchaseOrders: any[]
): WarrantSummary {
  const total_allocation = warrants.reduce((sum, w) => sum + Number(w.amount), 0)
  
  const total_expenses = purchaseOrders
    .filter((po) => po.total_amount && ['approved', 'sent', 'partial_received', 'completed'].includes(po.status || ''))
    .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)

  const total_liabilities = purchaseOrders
    .filter((po) => po.total_amount && ['approved', 'sent', 'partial_received'].includes(po.status || ''))
    .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)

  const total_balance = total_allocation - total_expenses
  const usage_percentage = total_allocation > 0 ? (total_expenses / total_allocation) * 100 : 0


  // groupStats to track pooled allocation and expenses by category + primary department
  const groupStats = new Map<string, { allocation: number, expenses: number }>()
  
  // Category-level tracking
  const categoryMap = new Map<WarrantCategory, { 
    allocation: number, 
    expenses: number, 
    departments: Map<string, {
      department: string,
      allocation: number, // The specific allocation assigned directly to this dept (if any)
      specific_expenses: number, // Expenses strictly for this dept
      voteCodes: Map<string, { vote_code: string, allocation: number, specific_expenses: number }>
    }>
  }>()

  // pass 1: Warrants (Allocations)
  warrants.forEach(w => {
    const primary = getPrimaryDepartment(w.department)
    const cat = w.category as WarrantCategory
    
    // 1. Group Stats (Pooled)
    // Keyed by category:primaryDept
    const gKey = `${cat}:${primary}`
    const gStat = groupStats.get(gKey) || { allocation: 0, expenses: 0 }
    gStat.allocation += Number(w.amount)
    groupStats.set(gKey, gStat)

    // 2. Category Map (Global Category view)
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { allocation: 0, expenses: 0, departments: new Map() })
    }
    const catData = categoryMap.get(cat)!
    catData.allocation += Number(w.amount)

    // Ensure all shared departments exist in the map if one gets a warrant
    // (so we can show maternity_ward even if only general_ward got the warrant, 
    // but they share a pool. Actually, let's only add the primary department as the "pool" owner, 
    // and we'll derive the sub-departments in pass 3, OR we add all shared depts right now)
    const sharedDepts = getSharedDepartments(w.department)
    sharedDepts.forEach(dept => {
      if (!catData.departments.has(dept)) {
        catData.departments.set(dept, {
          department: dept,
          allocation: 0,
          specific_expenses: 0,
          voteCodes: new Map()
        })
      }
    })

    // Add direct allocation to the specific department that received it
    const deptData = catData.departments.get(w.department)!
    deptData.allocation += Number(w.amount)

    if (!deptData.voteCodes.has(w.vote_code)) {
      deptData.voteCodes.set(w.vote_code, { vote_code: w.vote_code, allocation: 0, specific_expenses: 0 })
    }
    deptData.voteCodes.get(w.vote_code)!.allocation += Number(w.amount)
  })

  // pass 2: Purchase Orders (Expenses)
  purchaseOrders.forEach(po => {
    if (!['approved', 'sent', 'partial_received', 'completed'].includes(po.status || '')) {
      return
    }

    const normDept = normalize(po.department)
    const primary = getPrimaryDepartment(normDept)
    const cat = po.category as WarrantCategory
    const voteCode = po.vote_code as string
    const amount = Number(po.total_amount || 0)

    // Update group stats (Pooled expenses)
    const gKey = `${cat}:${primary}`
    if (groupStats.has(gKey)) {
      groupStats.get(gKey)!.expenses += amount
    }

    // Update Category global expenses
    if (categoryMap.has(cat)) {
      const catData = categoryMap.get(cat)!
      catData.expenses += amount

      // Add to specific department expenses
      if (!catData.departments.has(normDept)) {
        catData.departments.set(normDept, {
          department: normDept,
          allocation: 0,
          specific_expenses: 0,
          voteCodes: new Map()
        })
      }
      
      const deptData = catData.departments.get(normDept)!
      deptData.specific_expenses += amount

      if (voteCode) {
        if (!deptData.voteCodes.has(voteCode)) {
          deptData.voteCodes.set(voteCode, { vote_code: voteCode, allocation: 0, specific_expenses: 0 })
        }
        deptData.voteCodes.get(voteCode)!.specific_expenses += amount
      }
    }
  })

  // pass 3: Final Object Construction
  const by_category = Array.from(categoryMap.entries()).map(([category, data]) => {
    
    // Find all unique primary departments that have any activity in their pool
    const primaryDepts = new Set<string>()
    Array.from(data.departments.values()).forEach(dept => {
      if (dept.allocation > 0 || dept.specific_expenses > 0) {
        primaryDepts.add(getPrimaryDepartment(dept.department))
      }
    })

    const departments = Array.from(primaryDepts).map(primaryDept => {
      const gKey = `${category}:${primaryDept}`
      const poolStats = groupStats.get(gKey) || { allocation: 0, expenses: 0 }
      
      const pooledAllocation = poolStats.allocation
      const pooledExpenses = poolStats.expenses
      const pooledBalance = pooledAllocation - pooledExpenses

      // Sub-departments in this category pool (e.g. general_ward, maternity, paed)
      const sharedDepts = getSharedDepartments(primaryDept)
      const sub_departments = sharedDepts.map(sd => {
        const sdData = data.departments.get(sd)
        return {
          department: sd as WarrantDepartment,
          expenses: sdData ? sdData.specific_expenses : 0
        }
      }) // Removed filter to ensure all sub-departments in the shared pool are shown, even with 0 expenses
      
      // Merge vote codes across the entire shared pool
      const mergedVoteCodes = new Map<string, { allocation: number, expenses: number }>()
      sharedDepts.forEach(sd => {
        const sdData = data.departments.get(sd)
        if (sdData) {
          sdData.voteCodes.forEach(vc => {
            const mvc = mergedVoteCodes.get(vc.vote_code) || { allocation: 0, expenses: 0 }
            mvc.allocation += vc.allocation
            mvc.expenses += vc.specific_expenses
            mergedVoteCodes.set(vc.vote_code, mvc)
          })
        }
      })

      return {
        department: primaryDept as WarrantDepartment,
        allocation: pooledAllocation, // Show shared pool allocation
        expenses: pooledExpenses, // Show shared pool expenses
        balance: pooledBalance, // Show shared pool balance
        vote_codes: Array.from(mergedVoteCodes.entries()).map(([vc, stats]) => ({
          vote_code: vc as WarrantVoteCode,
          allocation: stats.allocation, 
          expenses: stats.expenses,
          balance: stats.allocation - stats.expenses,
          count: 0
        })),
        sub_departments: sub_departments
      }
    })

    return {
      category,
      allocation: data.allocation,
      expenses: data.expenses,
      balance: data.allocation - data.expenses,
      count: warrants.filter(w => w.category === category).length,
      departments: departments
    }
  })

  const by_department = Array.from(new Set(warrants.map(w => getPrimaryDepartment(w.department)))).map(primary => {
    let alloc = 0
    let exp = 0
    
    groupStats.forEach((stats, key) => {
      if (key.endsWith(`:${primary}`)) {
        alloc += stats.allocation
        exp += stats.expenses
      }
    })

    return {
      department: primary as WarrantDepartment,
      allocation: alloc,
      expenses: exp, // In top-level department view, expenses are the pooled expenses
      balance: alloc - exp,
      count: warrants.filter(w => getPrimaryDepartment(w.department) === primary).length,
      sub_departments: [] as any[]
    }
  })

  return {
    total_allocation,
    total_expenses,
    total_balance,
    total_liabilities,
    net_expenses: total_expenses - total_liabilities,
    usage_percentage,
    total_count: warrants.length,
    by_category,
    by_department,
    by_vote_code: [],
    recent_warrants: warrants.slice(0, 5)
  }
}

// Constants
export const WARRANT_VOTE_CODES = [
  { value: '080702', label: '080702' },
  { value: '990102', label: '990102' },
  { value: '080600 (APPL)', label: '080600 (APPL)' },
  { value: '080600 (CC)', label: '080600 (CC)' },
  { value: 'others', label: 'Others+' },
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
  { value: 'sglt2', label: 'SGLT-2' },
  { value: 'pathologist', label: 'Pathologist' },
  { value: 'medical_cylinder', label: 'Medical Cylinder' },
  { value: 'x_ray', label: 'X-Ray' },
  { value: 'duit_khas', label: 'Duit Khas' },
] as const

export const WARRANT_DEPARTMENTS = [
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'nephrology', label: 'Nephrology' },
  { value: 'radiology_radiography', label: 'Radiology & Radiography' },
  { value: 'emergency_trauma', label: 'Emergency & Trauma' },
  { value: 'cssu_cssd', label: 'CSSU & CSSD' },
  { value: 'operation_theater', label: 'Operation Theater' },
  { value: 'laboratory_pathology', label: 'Laboratory & Pathology' },
  { value: 'general_ward', label: 'General Ward' },
  { value: 'wound_care', label: 'Wound Care' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'anaesthesiology', label: 'Anaesthesiology' },
  { value: 'paediatric_ward', label: 'Paediatric Ward' },
  { value: 'maternity_ward', label: 'Maternity Ward' },
  { value: 'klinik_pakar', label: 'Klinik Pakar' },
] as const
