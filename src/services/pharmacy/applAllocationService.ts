/**
 * APPL Allocation Service
 * Handles tracking of expenses from Purchase Orders (PO) and Local Purchase Orders (LPO)
 * linked to warrants with vote_code 990102
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse } from '@/types'
import type {
  APPLExpense,
  APPLExpenseWithRelations,
  APPLAllocationSummary,
  Warrant,
} from '@/types/pharmacy'
import { getWarrants, getSharedDepartments, normalize } from './warrantService'

/**
 * Get APPL expenses for a hospital
 * @deprecated Use getExpenseList from budgetEngine.ts instead.
 */
export async function getAPPLExpenses(
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
): Promise<ApiResponse<APPLExpenseWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_appl_expenses')
        .select(`
          *,
          warrant:pharmacy_warrants(*),
          purchase_order:pharmacy_purchase_orders(*, approver:users!pharmacy_purchase_orders_approved_by_fkey(full_name)),
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
            .eq('entity_type', 'purchase_order')
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
        }
      }

      return { data: rows as APPLExpenseWithRelations[], error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching APPL expenses:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch APPL expenses',
    }
  }
}

/**
 * Sync APPL expenses from Purchase Orders
 * Automatically creates expense records from POs linked to warrants with vote_code 990102
 * @deprecated Legacy synchronization logic is no longer used. budgetEngine queries POs directly.
 */
export async function syncAPPLExpensesFromPOs(
  hospitalId: string,
  fiscalYear: number
): Promise<ApiResponse<{ synced: number; errors: string[] }>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: { synced: 0, errors: [] }, error: null }
    }

    // Get all warrants with vote_code 990102 for the fiscal year
    const startDate = `${fiscalYear}-01-01`
    const endDate = `${fiscalYear}-12-31`
    
    const warrantsResult = await getWarrants(hospitalId, {
      startDate,
      endDate,
      voteCode: '990102',
    })

    if (warrantsResult.error || !warrantsResult.data) {
      return {
        data: null,
        error: warrantsResult.error || 'Failed to fetch warrants',
      }
    }

    // Get ALL purchase orders for the fiscal year with vote_code 990102
    // Include all statuses (draft, pending_approval, approved, sent, etc.) so we can track them
    const { data: purchaseOrders, error: poError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('vote_code', '990102') // CRITICAL: Only sync POs with vote_code 990102
      .gte('order_date', startDate)
      .lte('order_date', endDate)
      // Include all statuses - we want to track expenses at all stages
      // .in('status', ['approved', 'sent', 'partial_received', 'completed'])

    if (poError) throw poError

    if (!purchaseOrders || purchaseOrders.length === 0) {
      return { data: { synced: 0, errors: [] }, error: null }
    }

    // Get existing expenses to check for duplicates and fix incorrect vote_activity
    const { data: existingExpenses, error: existingError } = await supabase
      .from('pharmacy_appl_expenses')
      .select('id, po_id, vote_activity')
      .eq('hospital_id', hospitalId)
      .eq('fiscal_year', fiscalYear)

    if (existingError) throw existingError

    // Create a map of existing expenses by po_id for quick lookup
    const existingExpensesMap = new Map((existingExpenses || []).map((e: any) => [e.po_id, e]))
    const existingPoIds = new Set((existingExpenses || []).map((e: any) => e.po_id))
    
    // Track expenses that need to be updated (wrong vote_activity)
    const expensesToUpdate: Array<{ id: string; vote_activity: string | null }> = []

    // Filter POs that should be tracked (must have vote_code 990102)
    const expensesToCreate: any[] = []
    const errors: string[] = []

    for (const po of purchaseOrders) {
      // CRITICAL: Only process POs with vote_code 990102
      if (po.vote_code !== '990102') {
        continue
      }

      // Check if expense already exists
      const existingExpense = existingExpensesMap.get(po.id)
      
      // If expense exists, check if vote_activity needs to be corrected
      if (existingExpense) {
        if (existingExpense.vote_activity !== po.vote_activity) {
          // Vote activity mismatch - needs to be updated
          expensesToUpdate.push({
            id: existingExpense.id,
            vote_activity: po.vote_activity || null,
          })
        }
        // Skip creating new expense, but we'll update the vote_activity if needed
        continue
      }

      // Find matching warrant by vote_activity - MUST match PO's vote_activity exactly
      // This ensures expenses are allocated to the correct activity
      let matchingWarrant = null
      if (po.vote_activity) {
        // Only match warrant if it has the SAME vote_activity as the PO
        matchingWarrant = warrantsResult.data.find((w) => 
          w.vote_activity === po.vote_activity
        )
      }

      // CRITICAL: Do NOT match by date proximity if vote_activity doesn't match
      // This prevents expenses from being allocated to the wrong activity
      // If no matching warrant found, that's okay - we'll still use the PO's vote_activity

      // Determine category from PO items if available, otherwise use PO's category field
      const { data: poItems } = await supabase
        .from('pharmacy_purchase_order_items')
        .select('item_type')
        .eq('po_id', po.id)
        .limit(1)

      let category = po.category || undefined
      if (!category && poItems && poItems.length > 0) {
        category = poItems[0].item_type === 'drug' ? 'drug' : 'non_drug'
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
      } else if (po.status === 'pending_approval') {
        expenseStatus = 'pending'
      } else if (po.status === 'draft') {
        expenseStatus = 'pending'
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
          po_type: po.po_type || 'regular',
          amount: Number(po.total_amount),
          status: expenseStatus,
          category: category || null,
          // CRITICAL: Always use PO's vote_activity - never override with warrant's vote_activity
          // The PO's vote_activity is the source of truth
          vote_activity: po.vote_activity || null,
          created_by: po.created_by,
        })
      }
    }

    // Update existing expenses with incorrect vote_activity
    if (expensesToUpdate.length > 0) {
      for (const update of expensesToUpdate) {
        const { error: updateError } = await supabase
          .from('pharmacy_appl_expenses')
          .update({ vote_activity: update.vote_activity })
          .eq('id', update.id)

        if (updateError) {
          errors.push(`Failed to update expense ${update.id}: ${updateError.message}`)
          console.error('Error updating APPL expense vote_activity:', updateError)
        }
      }
    }

    // Insert new expenses
    if (expensesToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('pharmacy_appl_expenses')
        .insert(expensesToCreate)

      if (insertError) {
        errors.push(insertError.message)
        console.error('Error inserting APPL expenses:', insertError)
      }
    }

    return {
      data: {
        synced: expensesToCreate.length + expensesToUpdate.length,
        errors,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error syncing APPL expenses:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to sync APPL expenses',
    }
  }
}

/**
 * Get APPL allocation summary
 * @deprecated Use getUnifiedBudgetSummary from budgetEngine.ts instead.
 */
export async function getAPPLAllocationSummary(
  hospitalId: string,
  fiscalYear: number,
  filters?: {
    category?: string
    poType?: string
    voteActivity?: string
    department?: string
  }
): Promise<ApiResponse<APPLAllocationSummary>> {
  try {
    // Get allocation from warrants (vote_code 990102)
    const startDate = `${fiscalYear}-01-01`
    const endDate = `${fiscalYear}-12-31`

    const warrantsResult = await getWarrants(hospitalId, {
      startDate,
      endDate,
      voteCode: '990102',
    })
    
    // Filter by vote activity if specified
    let filteredWarrants = warrantsResult.data || []
    if (filters?.voteActivity) {
      filteredWarrants = filteredWarrants.filter((w) => w.vote_activity === filters.voteActivity)
    }
    if (filters?.department && filters.department !== 'all') {
      filteredWarrants = filteredWarrants.filter((w) => w.department === filters.department)
    }
    if (filters?.category) {
      filteredWarrants = filteredWarrants.filter((w) => w.category === filters.category)
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
    const expensesResult = await getAPPLExpenses(hospitalId, fiscalYear, {
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
    
    // Filter out cancelled expenses first to ensure they don't block active ones during deduplication
    const nonCancelledExpenses = rawExpenses.filter(e => e.status !== 'cancelled')
    
    // Deduplicate by po_id to prevent double counting
    const uniqueExpensesMap = new Map()
    nonCancelledExpenses.forEach(e => {
      if (!uniqueExpensesMap.has(e.po_id)) {
        uniqueExpensesMap.set(e.po_id, e)
      }
    })
    let validExpenses = Array.from(uniqueExpensesMap.values())

    const selectedDept = filters?.department !== 'all' ? filters?.department : null
    const sharedDepts = selectedDept ? getSharedDepartments(selectedDept) : []

    let pooledExpenses = validExpenses
    let specificExpenses = validExpenses

    if (selectedDept) {
      // Pooled expenses (all departments in the shared group)
      pooledExpenses = validExpenses.filter((e) => {
        const normWarrantDept = normalize(e.warrant?.department || null)
        const normPoDept = normalize(e.purchase_order?.department || null)
        return sharedDepts.includes(normWarrantDept) || sharedDepts.includes(normPoDept)
      })
      
      // Specific expenses (only the selected department)
      specificExpenses = validExpenses.filter((e) => {
        const normWarrantDept = normalize(e.warrant?.department || null)
        const normPoDept = normalize(e.purchase_order?.department || null)
        return normWarrantDept === selectedDept || normPoDept === selectedDept
      })
    }

    const VALID_STATUSES = ['approved', 'sent', 'partial_received', 'completed']
    const LIABILITY_STATUSES = ['approved', 'sent', 'partial_received']

    // Metrics based on specific data for accuracy
    const totalExpenses = specificExpenses
      .filter((e) => VALID_STATUSES.includes(e.status))
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const totalLiabilities = specificExpenses
      .filter((e) => LIABILITY_STATUSES.includes(e.status))
      .reduce((sum, e) => sum + Number(e.amount), 0)
      
    const netExpenses = specificExpenses
      .filter((e) => e.status === 'completed')
      .reduce((sum, e) => sum + Number(e.amount), 0)

    // Balance calculation: Use pooled data ONLY if no specific activity filter is applied
    // If an activity filter is applied, we must use specificExpenses to avoid "leakage"
    const relevantExpensesForBalance = filters?.voteActivity || filters?.category ? specificExpenses : pooledExpenses
    
    const totalEffectiveExpenses = relevantExpensesForBalance
      .filter((e) => VALID_STATUSES.includes(e.status))
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const totalBalance = totalAllocation - totalEffectiveExpenses
    const usagePercentage = totalAllocation > 0 ? (totalEffectiveExpenses / totalAllocation) * 100 : 0

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

    // Breakdown by PO type
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

    const summary: APPLAllocationSummary = {
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
    console.error('Error calculating APPL allocation summary:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to calculate APPL allocation summary',
    }
  }
}

/**
 * Create or update APPL expense manually
 */
export async function upsertAPPLExpense(
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
): Promise<ApiResponse<APPLExpense>> {
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
        .from('pharmacy_appl_expenses')
        .upsert(expenseData, {
          onConflict: 'hospital_id,fiscal_year,po_id',
        })
        .select('*')
        .single()

      if (error) throw error

      return { data: inserted as APPLExpense, error: null }
    }

    return {
      data: null,
      error: 'Supabase not configured',
    }
  } catch (error) {
    console.error('Error upserting APPL expense:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to upsert APPL expense',
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
        canceller:users!pharmacy_purchase_orders_cancelled_by_fkey(id, full_name, email),
        lpo:pharmacy_lpo(lpo_number)
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
      // Use action instead of status (the DB schema uses 'action')
      const approvalLog = logs.find((l: any) => l.action === 'approved' || l.action === 'auto_approved')
      const cancellationLog = logs.find((l: any) => l.action === 'cancelled' || l.action === 'rejected')

      if (approvalLog) {
        row.approver_name = approvalLog.users?.full_name || row.creator?.full_name || 'Unknown User'
        row.approved_at = approvalLog.created_at
      } else if (row.approver) {
        row.approver_name = row.approver.full_name
        // row.approved_at is already set from row.approved_at join
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
    console.error('Error fetching PO details:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch PO details',
    }
  }
}

