/**
 * CC Allocation Service
 * Handles tracking of expenses from Purchase Orders (PO) and Local Purchase Orders (LPO)
 * linked to warrants with vote_code 080702
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse } from '@/types'
import type {
  CCExpense,
  CCExpenseWithRelations,
  CCAllocationSummary,
} from '@/types/pharmacy'
import { getWarrants, getSharedDepartments, normalize } from './warrantService'

/**
 * Get CC expenses for a hospital
 * @deprecated Use getExpenseList from budgetEngine.ts instead.
 */
export async function getCCExpenses(
  hospitalId: string,
  fiscalYear: number,
  filters?: {
    startDate?: string
    endDate?: string
    status?: string
    poType?: string
    category?: string
    voteActivity?: string
  }
): Promise<ApiResponse<CCExpenseWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_cc_expenses')
        .select(`
          *,
          warrant:pharmacy_warrants(*),
          purchase_order:pharmacy_purchase_orders(*),
          created_by_user:users(id, full_name, email)
        `)
        .eq('hospital_id', hospitalId)
        .eq('fiscal_year', fiscalYear)

      if (filters?.startDate) {
        query = query.gte('expense_date', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('expense_date', filters.endDate)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.poType) {
        query = query.eq('po_type', filters.poType)
      }

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.voteActivity) {
        query = query.eq('vote_activity', filters.voteActivity)
      }

      const { data, error } = await query.order('expense_date', { ascending: false })

      if (error) throw error

      const rows = (data || []) as any[]

      // Collect PO IDs that need approver fallback
      const poIdsToLookup = rows
        .filter(row => row.purchase_order && !row.purchase_order.approver && !row.purchase_order.signature_snapshot?.headName)
        .map(row => row.purchase_order.id)

      if (poIdsToLookup.length > 0) {
        try {
          const { data: allLogs } = await supabase
            .from('approval_logs')
            .select(`
              entity_id,
              approved_by,
              users:users!approval_logs_approved_by_fkey1(full_name)
            `)
            .in('entity_id', poIdsToLookup)
            .order('created_at', { ascending: false })

          if (allLogs) {
            // Map latest log for each PO
            const latestLogsMap = new Map()
            allLogs.forEach((log: any) => {
              if (!latestLogsMap.has(log.entity_id)) {
                latestLogsMap.set(log.entity_id, log)
              }
            })

            // Apply to rows
            rows.forEach(row => {
              if (row.purchase_order && !row.purchase_order.approver) {
                const log = latestLogsMap.get(row.purchase_order.id)
                if (log && log.users) {
                  row.purchase_order.approver = {
                    full_name: log.users.full_name
                  }
                }
              }
            })
          }
        } catch (fallbackError) {
          console.warn('Approver fallback failed:', fallbackError)
          // Don't throw, just continue with N/A names
        }
      }

      return { data: rows as CCExpenseWithRelations[], error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching CC expenses:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch CC expenses',
    }
  }
}

/**
 * Sync CC expenses from Purchase Orders
 * Automatically creates expense records from POs linked to warrants with vote_code 080702
 * @deprecated Legacy synchronization logic is no longer used. budgetEngine queries POs directly.
 */
export async function syncCCExpensesFromPOs(
  hospitalId: string,
  fiscalYear: number
): Promise<ApiResponse<{ synced: number; errors: string[] }>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: { synced: 0, errors: [] }, error: null }
    }

    // Get all warrants with vote_code 080702 for the fiscal year
    const startDate = `${fiscalYear}-01-01`
    const endDate = `${fiscalYear}-12-31`
    
    const warrantsResult = await getWarrants(hospitalId, {
      startDate,
      endDate,
      voteCode: '080702',
    })

    if (warrantsResult.error || !warrantsResult.data) {
      return {
        data: null,
        error: warrantsResult.error || 'Failed to fetch warrants',
      }
    }

    // Get purchase orders for the fiscal year - CRITICAL: only vote_code 080702
    const { data: purchaseOrders, error: poError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('vote_code', '080702') // CRITICAL: Only sync POs with CC vote code
      .gte('order_date', startDate)
      .lte('order_date', endDate)
      .in('status', ['approved', 'sent', 'partial_received', 'completed', 'cancelled'])

    if (poError) throw poError

    if (!purchaseOrders || purchaseOrders.length === 0) {
      return { data: { synced: 0, errors: [] }, error: null }
    }

    // Get existing expenses to avoid duplicates
    const { data: existingExpenses, error: existingError } = await supabase
      .from('pharmacy_cc_expenses')
      .select('po_id')
      .eq('hospital_id', hospitalId)
      .eq('fiscal_year', fiscalYear)

    if (existingError) throw existingError

    const existingPoIds = new Set((existingExpenses || []).map((e: any) => e.po_id))

    const expensesToCreate: any[] = []
    const errors: string[] = []

    for (const po of purchaseOrders) {
      // CRITICAL: Runtime guard - skip any PO that is NOT vote_code 080702
      if (po.vote_code !== '080702') continue

      // Skip if already tracked
      if (existingPoIds.has(po.id)) continue

      // Find matching warrant by vote_activity and department (normalize PO dept for comparison)
      const normalizedPoDept = normalize(po.department)
      let matchingWarrant = warrantsResult.data.find((w) =>
        w.vote_activity === po.vote_activity &&
        w.department === normalizedPoDept
      )

      // Fallback: match by shared department group
      if (!matchingWarrant) {
        const sharedDepts = getSharedDepartments(normalizedPoDept)
        matchingWarrant = warrantsResult.data.find((w) =>
          w.vote_activity === po.vote_activity &&
          sharedDepts.includes(w.department)
        )
      }

      // Last fallback: match by vote_activity only
      if (!matchingWarrant) {
        matchingWarrant = warrantsResult.data.find((w) =>
          w.vote_activity === po.vote_activity
        )
      }

      // Determine category from PO fields first, then items, then warrant
      let category = po.category || undefined
      if (!category) {
        const { data: poItems } = await supabase
          .from('pharmacy_purchase_order_items')
          .select('item_type')
          .eq('po_id', po.id)
          .limit(1)
        if (poItems && poItems.length > 0) {
          category = poItems[0].item_type === 'drug' ? 'drug' : 'non_drug'
        }
      }
      if (!category && matchingWarrant) {
        category = matchingWarrant.category || undefined
      }

      // Map PO status to expense status
      let expenseStatus = 'pending'
      if (po.status === 'completed') {
        expenseStatus = 'completed'
      } else if (po.status === 'approved' || po.status === 'sent' || po.status === 'partial_received') {
        expenseStatus = 'approved'
      } else if (po.status === 'cancelled') {
        expenseStatus = 'cancelled'
      }

      if (po.total_amount && po.total_amount > 0) {
        expensesToCreate.push({
          hospital_id: hospitalId,
          fiscal_year: fiscalYear,
          warrant_id: matchingWarrant?.id || null,
          po_id: po.id,
          expense_date: po.order_date,
          po_number: po.po_number,
          lpo_number: po.po_type === 'lpo' ? po.po_number : null,
          po_type: po.po_type,
          amount: Number(po.total_amount),
          status: expenseStatus,
          category: category || null,
          // Use PO's vote_activity as source of truth
          vote_activity: po.vote_activity || matchingWarrant?.vote_activity || null,
          created_by: po.created_by,
        })
      }
    }

    if (expensesToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('pharmacy_cc_expenses')
        .insert(expensesToCreate)

      if (insertError) {
        errors.push(insertError.message)
      }
    }

    return {
      data: {
        synced: expensesToCreate.length,
        errors,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error syncing CC expenses:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to sync CC expenses',
    }
  }
}

/**
 * Get CC allocation summary
 * @deprecated Use getUnifiedBudgetSummary from budgetEngine.ts instead.
 */
export async function getCCAllocationSummary(
  hospitalId: string,
  fiscalYear: number,
  filters?: {
    category?: string
    poType?: string
    voteActivity?: string
    department?: string
  }
): Promise<ApiResponse<CCAllocationSummary>> {
  try {
    // Get allocation from warrants (vote_code 080702)
    const startDate = `${fiscalYear}-01-01`
    const endDate = `${fiscalYear}-12-31`

    const warrantsResult = await getWarrants(hospitalId, {
      startDate,
      endDate,
      voteCode: '080702',
    })
    
    // Filter by vote activity, category, and department if specified
    let filteredWarrants = warrantsResult.data || []
    if (filters?.voteActivity) {
      filteredWarrants = filteredWarrants.filter((w) => w.vote_activity === filters.voteActivity)
    }
    if (filters?.category) {
      filteredWarrants = filteredWarrants.filter((w) => w.category === filters.category)
    }
    if (filters?.department && filters.department !== 'all') {
      const sharedDepts = getSharedDepartments(filters.department)
      filteredWarrants = filteredWarrants.filter((w) => w.department && sharedDepts.includes(w.department as string))
    }

    if (warrantsResult.error) {
      return {
        data: null,
        error: warrantsResult.error,
      }
    }

    const warrants = filteredWarrants
    const totalAllocation = warrants.reduce((sum, w) => sum + Number(w.amount), 0)

    // Get expenses
    const expensesResult = await getCCExpenses(hospitalId, fiscalYear, {
      ...filters,
      voteActivity: filters?.voteActivity,
    })

    if (expensesResult.error) {
      return {
        data: null,
        error: expensesResult.error,
      }
    }

    let rawExpenses = expensesResult.data || []
    
    // Deduplicate by po_id to prevent double counting
    const uniqueExpensesMap = new Map()
    rawExpenses.forEach(e => {
      if (!uniqueExpensesMap.has(e.po_id)) {
        uniqueExpensesMap.set(e.po_id, e)
      }
    })
    
    let validExpenses = Array.from(uniqueExpensesMap.values()).filter((e) => {
      // If the expense has a linked purchase_order, check its vote_code
      if (e.purchase_order?.vote_code) {
        return e.purchase_order.vote_code === '080702'
      }
      return true
    })

    // Filter by vote activity and category relationships
    if (filters?.voteActivity === '27401') {
      validExpenses = validExpenses.filter((e) => e.category !== 'non_drug')
    }
    if (filters?.category === 'non_drug') {
      validExpenses = validExpenses.filter((e) => e.vote_activity !== '27401')
    }

    const selectedDept = filters?.department !== 'all' ? filters?.department : null
    const sharedDepts = selectedDept ? getSharedDepartments(selectedDept) : []

    let pooledExpenses = validExpenses
    let specificExpenses = validExpenses

    if (selectedDept) {
      pooledExpenses = validExpenses.filter((e) => {
        const normWarrantDept = normalize(e.warrant?.department || null)
        const normPoDept = normalize(e.purchase_order?.department || null)
        return sharedDepts.includes(normWarrantDept) || sharedDepts.includes(normPoDept)
      })
      
      specificExpenses = validExpenses.filter((e) => {
        const normWarrantDept = normalize(e.warrant?.department || null)
        const normPoDept = normalize(e.purchase_order?.department || null)
        return normWarrantDept === selectedDept || normPoDept === selectedDept
      })
    }

    const VALID_STATUSES = ['approved', 'sent', 'partial_received', 'completed']
    const LIABILITY_STATUSES = ['approved', 'sent', 'partial_received']

    // Metrics based on pooled data for true balance, and specific data for usage
    const totalPooledExpenses = pooledExpenses
      .filter((e) => VALID_STATUSES.includes(e.status))
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const totalBalance = totalAllocation - totalPooledExpenses
    const usagePercentage = totalAllocation > 0 ? (totalPooledExpenses / totalAllocation) * 100 : 0

    const totalExpenses = specificExpenses
      .filter((e) => VALID_STATUSES.includes(e.status))
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const totalLiabilities = specificExpenses
      .filter((e) => LIABILITY_STATUSES.includes(e.status))
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const netExpenses = specificExpenses
      .filter((e) => e.status === 'completed')
      .reduce((sum, e) => sum + Number(e.amount), 0)

    // Quarterly breakdown
    const quarterly = [1, 2, 3, 4].map((quarter) => {
      const quarterStartMonth = (quarter - 1) * 3
      const quarterStart = new Date(fiscalYear, quarterStartMonth, 1)
      const quarterEnd = new Date(fiscalYear, quarterStartMonth + 3, 0)

      const quarterWarrants = warrants.filter((w) => {
        const warrantDate = new Date(w.warrant_date)
        return warrantDate >= quarterStart && warrantDate <= quarterEnd
      })

      const quarterPooled = pooledExpenses.filter((e) => {
        const expenseDate = new Date(e.expense_date)
        return expenseDate >= quarterStart && expenseDate <= quarterEnd
      })

      const quarterSpecific = specificExpenses.filter((e) => {
        const expenseDate = new Date(e.expense_date)
        return expenseDate >= quarterStart && expenseDate <= quarterEnd
      })

      const quarterAllocation = quarterWarrants.reduce((sum, w) => sum + Number(w.amount), 0)
      const quarterPooledAmount = quarterPooled
        .filter((e) => VALID_STATUSES.includes(e.status))
        .reduce((sum, e) => sum + Number(e.amount), 0)
      const quarterSpecificAmount = quarterSpecific
        .filter((e) => VALID_STATUSES.includes(e.status))
        .reduce((sum, e) => sum + Number(e.amount), 0)

      const quarterBalance = quarterAllocation - quarterPooledAmount
      const quarterUsage = quarterAllocation > 0 ? (quarterPooledAmount / quarterAllocation) * 100 : 0

      return {
        quarter: quarter as 1 | 2 | 3 | 4,
        allocation: quarterAllocation,
        expenses: quarterSpecificAmount,
        balance: quarterBalance,
        usage_percentage: quarterUsage,
      }
    })

    // Breakdown by vote activity
    const voteActivityMap = new Map<string, { 
      allocation: number
      expenses: number
      pooledExpenses: number
      liabilities: number
      netExpenses: number
      count: number
    }>()
    
    warrants.forEach((w) => {
      const activity = w.vote_activity || 'other'
      const current = voteActivityMap.get(activity) || { allocation: 0, expenses: 0, pooledExpenses: 0, liabilities: 0, netExpenses: 0, count: 0 }
      current.allocation += Number(w.amount)
      voteActivityMap.set(activity, current)
    })

    pooledExpenses.forEach((e) => {
      const activity = e.vote_activity || 'other'
      const current = voteActivityMap.get(activity) || { allocation: 0, expenses: 0, pooledExpenses: 0, liabilities: 0, netExpenses: 0, count: 0 }
      if (VALID_STATUSES.includes(e.status)) {
        current.pooledExpenses += Number(e.amount)
      }
      voteActivityMap.set(activity, current)
    })

    specificExpenses.forEach((e) => {
      const activity = e.vote_activity || 'other'
      const current = voteActivityMap.get(activity) || { allocation: 0, expenses: 0, pooledExpenses: 0, liabilities: 0, netExpenses: 0, count: 0 }
      if (VALID_STATUSES.includes(e.status)) {
        current.expenses += Number(e.amount)
      }
      if (LIABILITY_STATUSES.includes(e.status)) {
        current.liabilities += Number(e.amount)
      }
      if (e.status === 'completed') {
        current.netExpenses += Number(e.amount)
      }
      current.count += 1
      voteActivityMap.set(activity, current)
    })

    const byVoteActivity = Array.from(voteActivityMap.entries()).map(([vote_activity, data]) => ({
      vote_activity,
      allocation: data.allocation,
      expenses: data.expenses,
      balance: data.allocation - data.pooledExpenses,
      liabilities: data.liabilities,
      net_expenses: data.netExpenses,
      count: data.count,
    }))

    // Breakdown by category
    const categoryMap = new Map<string, { allocation: number; expenses: number; pooledExpenses: number; count: number }>()
    
    warrants.forEach((w) => {
      const cat = w.category || 'other'
      const current = categoryMap.get(cat) || { allocation: 0, expenses: 0, pooledExpenses: 0, count: 0 }
      current.allocation += Number(w.amount)
      categoryMap.set(cat, current)
    })

    pooledExpenses.forEach((e) => {
      const cat = e.category || 'other'
      const current = categoryMap.get(cat) || { allocation: 0, expenses: 0, pooledExpenses: 0, count: 0 }
      if (VALID_STATUSES.includes(e.status)) {
        current.pooledExpenses += Number(e.amount)
      }
      categoryMap.set(cat, current)
    })

    specificExpenses.forEach((e) => {
      const cat = e.category || 'other'
      const current = categoryMap.get(cat) || { allocation: 0, expenses: 0, pooledExpenses: 0, count: 0 }
      if (VALID_STATUSES.includes(e.status)) {
        current.expenses += Number(e.amount)
      }
      current.count += 1
      categoryMap.set(cat, current)
    })

    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      allocation: data.allocation,
      expenses: data.expenses,
      balance: data.allocation - data.pooledExpenses,
      count: data.count,
    }))

    // Breakdown by PO type (specific expenses only)
    const poTypeMap = new Map<string, { expenses: number; count: number }>()
    specificExpenses.forEach((e) => {
      const current = poTypeMap.get(e.po_type) || { expenses: 0, count: 0 }
      if (VALID_STATUSES.includes(e.status)) {
        current.expenses += Number(e.amount)
      }
      current.count += 1
      poTypeMap.set(e.po_type, current)
    })

    const byPoType = Array.from(poTypeMap.entries()).map(([po_type, data]) => ({
      po_type: po_type as any,
      expenses: data.expenses,
      count: data.count,
    }))

    const summary: CCAllocationSummary = {
      fiscal_year: fiscalYear,
      total_allocation: totalAllocation,
      total_expenses: totalExpenses,
      total_balance: totalBalance,
      total_liabilities: totalLiabilities,
      net_expenses: netExpenses,
      usage_percentage: usagePercentage,
      total_count: specificExpenses.length,
      quarterly,
      by_vote_activity: byVoteActivity,
      by_category: byCategory,
      by_po_type: byPoType,
    }

    return { data: summary, error: null }
  } catch (error) {
    console.error('Error calculating CC allocation summary:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to calculate CC allocation summary',
    }
  }
}

/**
 * Create or update CC expense manually
 */
export async function upsertCCExpense(
  hospitalId: string,
  userId: string,
  data: {
    fiscal_year: number
    po_id: string
    expense_date: string
    amount: number
    status?: string
    category?: string
    warrant_id?: string
  }
): Promise<ApiResponse<CCExpense>> {
  try {
    if (isSupabaseConfigured()) {
      // Get PO details
      const { data: po, error: poError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('po_number, po_type')
        .eq('id', data.po_id)
        .single()

      if (poError) throw poError

      const expenseData = {
        hospital_id: hospitalId,
        fiscal_year: data.fiscal_year,
        warrant_id: data.warrant_id || null,
        po_id: data.po_id,
        expense_date: data.expense_date,
        po_number: po.po_number,
        lpo_number: po.po_type === 'lpo' ? po.po_number : null,
        po_type: po.po_type,
        amount: data.amount,
        status: data.status || 'pending',
        category: data.category || null,
        created_by: userId,
      }

      const { data: inserted, error } = await supabase
        .from('pharmacy_cc_expenses')
        .upsert(expenseData, {
          onConflict: 'hospital_id,fiscal_year,po_id',
        })
        .select('*')
        .single()

      if (error) throw error

      return { data: inserted as CCExpense, error: null }
    }

    return {
      data: null,
      error: 'Supabase not configured',
    }
  } catch (error) {
    console.error('Error upserting CC expense:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to upsert CC expense',
    }
  }
}

/**
 * Get detailed purchase order information including items
 */
export async function getPurchaseOrderDetails(
  hospitalId: string,
  poId: string
): Promise<ApiResponse<any>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase not configured' }
    }

    const { data, error } = await supabase
      .from('pharmacy_purchase_orders')
      .select(`
        *,
        supplier:suppliers!pharmacy_purchase_orders_supplier_id_fkey(*),
        items:pharmacy_purchase_order_items(*),
        creator:users!pharmacy_purchase_orders_created_by_fkey(id, full_name, email),
        approver:users!pharmacy_purchase_orders_approved_by_fkey(id, full_name, email),
        canceller:users!pharmacy_purchase_orders_cancelled_by_fkey(id, full_name, email)
      `)
      .eq('hospital_id', hospitalId)
      .eq('id', poId)
      .single()

    if (error) throw error

    const row = data as any
    if (row.lpo && row.lpo.length > 0) {
      row.lpo_number = row.lpo[0].lpo_number
    }

    // Fetch all relevant logs for this PO
    const { data: logs } = await supabase
      .from('approval_logs')
      .select(`
        *,
        users!approval_logs_approved_by_fkey1(full_name)
      `)
      .eq('entity_id', poId)
      .eq('entity_type', 'purchase_order')
      .order('created_at', { ascending: false })

    if (logs) {
      const approvalLog = logs.find((l: any) => l.action === 'approved' || l.action === 'auto_approved')
      const cancellationLog = logs.find((l: any) => l.action === 'cancelled' || l.action === 'rejected')

      if (approvalLog) {
        row.approver_name = approvalLog.users?.full_name || row.creator?.full_name || 'Unknown User'
        row.approved_at = approvalLog.created_at
      } else if (row.approver) {
        row.approver_name = row.approver.full_name
      }

      if (row.canceller) {
        row.cancelled_by_name = row.canceller.full_name
      }

      if (cancellationLog) {
        if (!row.cancelled_by_name) {
          row.cancelled_by_name = cancellationLog.users?.full_name
        }
        if (!row.cancelled_at) {
          row.cancelled_at = cancellationLog.created_at
        }
        row.cancellation_reason = cancellationLog.notes || row.notes
      }
    }

    return { data: row, error: null }
  } catch (error) {
    console.error('Error in getPurchaseOrderDetails:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

