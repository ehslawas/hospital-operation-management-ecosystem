import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse } from '@/types'
import type {
  BudgetQuery,
  UnifiedBudgetSummary,
  Warrant,
  WarrantCategory,
  WarrantDepartment,
  WarrantVoteCode,
  WarrantVoteActivity
} from '@/types/pharmacy'
import { getSharedDepartments, getPrimaryDepartment, normalize } from './warrantService'

/**
 * Unified Budget Engine
 * Single source of truth for all financial calculations in the pharmacy module.
 */
export async function getUnifiedBudgetSummary(
  query: BudgetQuery
): Promise<ApiResponse<UnifiedBudgetSummary>> {
  try {
    const { hospitalId, fiscalYear, voteCode, voteActivity, category, department, excludePoId, asOfDate } = query
    const startDate = `${fiscalYear}-01-01`
    const endDate = `${fiscalYear}-12-31`

    if (!isSupabaseConfigured()) {
      return { data: null as any, error: 'Supabase not configured' }
    }

    // ═══════════════════════════════════════════════════
    // STEP 1: WARRANTS (Allocation)
    // ═══════════════════════════════════════════════════
    let warrantQuery = supabase
      .from('pharmacy_warrants')
      .select('*')
      .eq('hospital_id', hospitalId)
      .gte('warrant_date', startDate)
      .lte('warrant_date', asOfDate || endDate)

    if (voteCode) warrantQuery = warrantQuery.eq('vote_code', voteCode)
    if (voteActivity) warrantQuery = warrantQuery.eq('vote_activity', voteActivity)
    if (category) warrantQuery = warrantQuery.eq('category', category)
    
    // Always fetch all warrants if we want to do full category breakdowns, 
    // but if a specific department is passed, we filter the DB query.
    // We use the shared group to find all relevant warrants.
    let sharedDepts: string[] = []
    if (department && department !== 'all') {
      sharedDepts = getSharedDepartments(department)
      warrantQuery = warrantQuery.in('department', sharedDepts)
    }

    const { data: warrants, error: warrantError } = await warrantQuery.order('warrant_date', { ascending: false })
    if (warrantError) throw warrantError

    const warrantsList = (warrants || []) as Warrant[]
    const totalAllocation = warrantsList.reduce((sum, w) => sum + Number(w.amount), 0)

    // ═══════════════════════════════════════════════════
    // STEP 2: PURCHASE ORDERS (Expenses)
    // ═══════════════════════════════════════════════════
    const VALID_STATUSES = ['approved', 'sent', 'partial_received', 'completed', 'cancelled', 'pending_approval', 'draft']
    const LIABILITY_STATUSES = ['approved', 'sent', 'partial_received', 'pending_approval', 'draft']
    const FINANCIAL_STATUSES = ['approved', 'sent', 'partial_received', 'completed', 'pending_approval', 'draft']

    let poQuery = supabase
      .from('pharmacy_purchase_orders')
      .select('id, total_amount, status, vote_code, vote_activity, category, department, order_date, po_type')
      .eq('hospital_id', hospitalId)
      .gte('order_date', startDate)
      .lte('order_date', asOfDate || endDate)
      .in('status', VALID_STATUSES) // Only fetch valid statuses

    if (voteCode) poQuery = poQuery.eq('vote_code', voteCode)
    if (voteActivity) poQuery = poQuery.eq('vote_activity', voteActivity)
    if (category) poQuery = poQuery.eq('category', category)
    
    // We fetch all POs for the vote/category and filter/normalize in memory 
    // because the 'department' column in DB often contains variant names (e.g. "Maternity Ward" vs "maternity_ward")
    const { data: purchaseOrders, error: poError } = await poQuery
    if (poError) {
      console.error('Error fetching POs for budget engine:', poError)
    }

    // ═══════════════════════════════════════════════════
    // STEP 2b: DUAL-PATH FILTER
    // pooledPOs  → ALL POs in the shared department group (for balance)
    // specificPOs → ONLY POs from the exact selected department (for card display + list)
    // ═══════════════════════════════════════════════════
    const allPOs = (purchaseOrders || []).filter(po => {
      if (excludePoId && po.id === excludePoId) return false
      return true
    })

    // pooledPOs: every PO from the shared department group (for balance calculation)
    const pooledPOs = allPOs.filter(po => {
      if (department && department !== 'all') {
        const normDept = normalize(po.department)
        return sharedDepts.includes(normDept)
      }
      return true
    })

    // specificPOs: only POs from the EXACT selected department (for expense card + transaction list)
    const specificPOs = (department && department !== 'all')
      ? allPOs.filter(po => normalize(po.department) === department)
      : pooledPOs // When "all" departments, specific === pooled

    // ═══════════════════════════════════════════════════
    // STEP 3: AGGREGATION (dual-path)
    // ═══════════════════════════════════════════════════

    // Pooled expenses → used ONLY for balance and usage % (shared pool perspective)
    const pooledExpenses = pooledPOs
      .filter(po => FINANCIAL_STATUSES.includes(po.status || ''))
      .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)

    // Specific expenses → used for the Total Expenses card, liabilities, net expenses
    const totalExpenses = specificPOs
      .filter(po => FINANCIAL_STATUSES.includes(po.status || ''))
      .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)

    const totalLiabilities = specificPOs
      .filter(po => LIABILITY_STATUSES.includes(po.status || ''))
      .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)

    const netExpenses = specificPOs
      .filter(po => po.status === 'completed')
      .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)

    // Balance uses POOLED expenses (shared pool), usage % also pooled
    const totalBalance = totalAllocation - pooledExpenses
    const usagePercentage = totalAllocation > 0 ? (pooledExpenses / totalAllocation) * 100 : 0

    // ═══════════════════════════════════════════════════
    // STEP 4: BREAKDOWNS (Quarterly, Activity, Type)
    // ═══════════════════════════════════════════════════
    
    // Quarterly breakdown
    const quarterly = [1, 2, 3, 4].map((quarter) => {
      const quarterStartMonth = (quarter - 1) * 3
      const quarterStart = new Date(fiscalYear, quarterStartMonth, 1)
      const quarterEnd = new Date(fiscalYear, quarterStartMonth + 3, 0)

      const quarterWarrants = warrantsList.filter((w) => {
        const warrantDate = new Date(w.warrant_date)
        return warrantDate >= quarterStart && warrantDate <= quarterEnd
      })

      const quarterPOs = specificPOs.filter((e) => {
        const expenseDate = new Date(e.order_date)
        return expenseDate >= quarterStart && expenseDate <= quarterEnd
      })

      const quarterAllocation = quarterWarrants.reduce((sum, w) => sum + Number(w.amount), 0)
      const quarterExpenses = quarterPOs
        .filter(e => FINANCIAL_STATUSES.includes(e.status || ''))
        .reduce((sum, e) => sum + Number(e.total_amount || 0), 0)
      const quarterBalance = quarterAllocation - quarterExpenses
      const quarterUsage = quarterAllocation > 0 ? (quarterExpenses / quarterAllocation) * 100 : 0

      return {
        quarter: quarter as 1 | 2 | 3 | 4,
        allocation: quarterAllocation,
        expenses: quarterExpenses,
        balance: quarterBalance,
        usage_percentage: quarterUsage,
      }
    })

    // Breakdown by vote activity
    const voteActivityMap = new Map<string, { 
      allocation: number
      expenses: number
      liabilities: number
      netExpenses: number
      count: number
    }>()
    
    warrantsList.forEach((w) => {
      const activity = w.vote_activity || 'other'
      if (!voteActivityMap.has(activity)) {
        voteActivityMap.set(activity, { allocation: 0, expenses: 0, liabilities: 0, netExpenses: 0, count: 0 })
      }
      voteActivityMap.get(activity)!.allocation += Number(w.amount)
    })
    
    specificPOs.forEach((po) => {
      const activity = po.vote_activity || 'other'
      if (!voteActivityMap.has(activity)) {
        voteActivityMap.set(activity, { allocation: 0, expenses: 0, liabilities: 0, netExpenses: 0, count: 0 })
      }
      
      const stats = voteActivityMap.get(activity)!
      const amount = Number(po.total_amount || 0)
      
      if (FINANCIAL_STATUSES.includes(po.status || '')) {
        stats.expenses += amount
      }
      stats.count += 1
      
      if (LIABILITY_STATUSES.includes(po.status || '')) {
        stats.liabilities += amount
      }
      if (po.status === 'completed') {
        stats.netExpenses += amount
      }
    })
    
    const by_vote_activity = Array.from(voteActivityMap.entries()).map(([activity, stats]) => ({
      vote_activity: activity,
      allocation: stats.allocation,
      expenses: stats.expenses,
      balance: stats.allocation - stats.expenses,
      liabilities: stats.liabilities,
      net_expenses: stats.netExpenses,
      count: stats.count
    }))

    // Breakdown by PO Type
    const poTypeMap = new Map<string, { expenses: number, count: number }>()
    specificPOs.forEach(po => {
      const type = po.po_type || 'regular'
      if (!poTypeMap.has(type)) poTypeMap.set(type, { expenses: 0, count: 0 })
      if (FINANCIAL_STATUSES.includes(po.status || '')) {
        poTypeMap.get(type)!.expenses += Number(po.total_amount || 0)
      }
      poTypeMap.get(type)!.count += 1
    })

    const by_po_type = Array.from(poTypeMap.entries()).map(([type, stats]) => ({
      po_type: type,
      expenses: stats.expenses,
      count: stats.count
    }))

    // Build the result
    return { 
      data: {
        total_allocation: totalAllocation,
        total_expenses: totalExpenses,
        total_balance: totalBalance,
        total_liabilities: totalLiabilities,
        net_expenses: netExpenses,
        usage_percentage: usagePercentage,
        total_count: warrantsList.length,
        expense_count: specificPOs.length,
        pooled_expenses: pooledExpenses,
        pooled_usage_percentage: usagePercentage,
        quarterly,
        by_vote_activity,
        by_po_type,
        recent_warrants: warrantsList.slice(0, 5)
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error in getUnifiedBudgetSummary:', error)
    return {
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to fetch unified budget summary',
    }
  }
}

/**
 * Convenience wrapper for the Purchase Order Create Page to get live balance
 */
export async function getBudgetForPO(
  hospitalId: string,
  voteCode: WarrantVoteCode,
  voteActivity: WarrantVoteActivity,
  department: WarrantDepartment,
  category?: WarrantCategory,
  excludePoId?: string,
  asOfDate?: string
): Promise<{ allocation: number; expenses: number; balance: number }> {
  
  const currentYear = new Date().getFullYear()
  
  const result = await getUnifiedBudgetSummary({
    hospitalId,
    fiscalYear: currentYear,
    voteCode,
    voteActivity,
    category,
    department,
    excludePoId,
    asOfDate
  })

  if (result.error || !result.data) {
    console.error('Failed to get budget for PO:', result.error)
    return { allocation: 0, expenses: 0, balance: 0 }
  }

  return {
    allocation: result.data.total_allocation,
    expenses: result.data.total_expenses,
    balance: result.data.total_balance
  }
}

/**
 * Get raw expense list (PO rows) directly for dashboards
 * Replaces getCCExpenses and getAPPLExpenses by fetching from pharmacy_purchase_orders
 */
export async function getExpenseList(
  query: BudgetQuery
): Promise<ApiResponse<any[]>> {
  try {
    const { hospitalId, fiscalYear, voteCode, voteActivity, category, department } = query
    const startDate = `${fiscalYear}-01-01`
    const endDate = `${fiscalYear}-12-31`

    if (!isSupabaseConfigured()) {
      return { data: [], error: 'Supabase not configured' }
    }

    const VALID_STATUSES = ['approved', 'sent', 'partial_received', 'completed', 'cancelled']

    let poQuery = supabase
      .from('pharmacy_purchase_orders')
      .select(`*, items:pharmacy_purchase_order_items(*), supplier:suppliers(company_name), approver:users!pharmacy_purchase_orders_approved_by_fkey(id, full_name, email), lpo:pharmacy_lpo(lpo_number)`)
      .eq('hospital_id', hospitalId)
      .gte('order_date', startDate)
      .lte('order_date', endDate)

    if (query.status && query.status !== 'all') {
      poQuery = poQuery.eq('status', query.status)
    } else {
      poQuery = poQuery.in('status', VALID_STATUSES)
    }

    if (voteCode) poQuery = poQuery.eq('vote_code', voteCode)
    if (voteActivity) poQuery = poQuery.eq('vote_activity', voteActivity)
    if (category) poQuery = poQuery.eq('category', category)
    
    const { data, error } = await poQuery.order('order_date', { ascending: false })

    if (error) throw error

    // Filter in-memory with normalization — EXACT department match for unit-specific list
    const filteredData = (data || []).filter(po => {
      if (department && department !== 'all') {
        const normDept = normalize(po.department)
        return normDept === department // Exact match: only this unit's POs
      }
      return true
    })

    // Fallback for approvers not in the approved_by column (e.g. auto-approved)
    const poIdsToLookup = filteredData
      .filter(po => !po.approver && po.status !== 'draft')
      .map(po => po.id)

    if (poIdsToLookup.length > 0) {
      try {
        const { data: logs } = await supabase
          .from('approval_logs')
          .select(`
            entity_id,
            action,
            users:users!approval_logs_approved_by_fkey1(full_name)
          `)
          .in('entity_id', poIdsToLookup)
          .in('action', ['approved', 'auto_approved'])
          .order('created_at', { ascending: false })

        if (logs) {
          const latestLogsMap = new Map()
          logs.forEach((log: any) => {
            if (!latestLogsMap.has(log.entity_id)) {
              latestLogsMap.set(log.entity_id, log)
            }
          })

          filteredData.forEach(po => {
            // Priority:
            // 1. Database join (po.approver)
            // 2. signature_snapshot.headName
            // 3. approval_logs fallback
            
            // DUMMY TEST for verification
            if (po.po_number === 'PO-2026-0382') {
              po.approver = { full_name: 'TEST APPROVER NAME' }
            } else if (!po.approver || !po.approver.full_name) {
              // Try signature snapshot first
              if (po.signature_snapshot?.headName) {
                po.approver = { full_name: po.signature_snapshot.headName }
              } 
              // Then try logs
              else {
                const log = latestLogsMap.get(po.id)
                if (log && log.users) {
                  po.approver = {
                    full_name: log.users.full_name
                  }
                }
              }
            }
          })
        }
      } catch (fallbackError) {
        console.warn('Approver fallback failed in getExpenseList:', fallbackError)
      }
    } else {
      // Still check signature snapshot for those with direct join results
      filteredData.forEach(po => {
        if ((!po.approver || !po.approver.full_name) && po.signature_snapshot?.headName) {
          po.approver = { full_name: po.signature_snapshot.headName }
        }
      })
    }

    // Map to a format that looks like the old CCExpense / APPLExpense for UI compatibility
    const formattedExpenses = filteredData.map(po => ({
      id: `exp_${po.id}`,
      po_id: po.id,
      po_number: po.po_number,
      lpo_number: po.po_type === 'lpo' ? po.po_number : (po.lpo && po.lpo.length > 0 ? po.lpo[0].lpo_number : null),
      po_type: po.po_type || 'regular',
      expense_date: po.order_date,
      amount: po.total_amount,
      status: po.status,
      category: po.category,
      vote_activity: po.vote_activity,
      supplier_name: po.supplier?.company_name || 'Unknown Supplier',
      purchase_order: po // Keep full PO for drawer
    }))

    return { data: formattedExpenses, error: null }
  } catch (error) {
    console.error('Error fetching unified expense list:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch expenses' }
  }
}
