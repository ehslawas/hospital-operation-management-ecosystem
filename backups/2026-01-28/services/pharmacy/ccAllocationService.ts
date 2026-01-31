/**
 * CC Allocation Service
 * Handles tracking of expenses from Purchase Orders (PO) and Local Purchase Orders (LPO)
 * linked to warrants with vote_code 080702
 */

import { supabase } from '../supabase'
import type { ApiResponse } from '@/types'
import type {
  CCExpense,
  CCExpenseWithRelations,
  CCAllocationSummary,
} from '@/types/pharmacy'
import { getWarrants, WARRANT_DEPARTMENTS } from './warrantService'

// Helper to validate UUID format
const isUUID = (str: string | null | undefined): boolean => {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Resolves missing item names and codes for purchase order items in bulk.
 * Used for legacy records where item_name was not persisted in pharmacy_purchase_order_items.
 */
async function resolveItemNames(purchaseOrders: any[]) {
  const itemsToResolve = purchaseOrders.flatMap(po =>
    (po.items || []).filter((item: any) => !item.item_name && item.item_id && item.item_type !== 'manual')
  )

  if (itemsToResolve.length === 0) return

  // Group by type
  const drugIds = [...new Set(itemsToResolve.filter((i: any) => i.item_type === 'drug').map((i: any) => i.item_id))]
  const nonDrugIds = [...new Set(itemsToResolve.filter((i: any) => i.item_type === 'non_drug').map((i: any) => i.item_id))]

  // Fetch in bulk from all possible catalogs
  const [drugs, nonDrugs, applDrugs, applNonDrugs] = await Promise.all([
    drugIds.length > 0 ? supabase.from('drugs').select('id, drug_name, drug_code').in('id', drugIds) : Promise.resolve({ data: [] }),
    nonDrugIds.length > 0 ? supabase.from('non_drugs').select('id, item_name, item_code').in('id', nonDrugIds) : Promise.resolve({ data: [] }),
    drugIds.length > 0 ? supabase.from('appl_drugs').select('id, item_name, item_code').in('id', drugIds) : Promise.resolve({ data: [] }),
    nonDrugIds.length > 0 ? supabase.from('appl_non_drugs').select('id, item_name, item_code').in('id', nonDrugIds) : Promise.resolve({ data: [] }),
  ])

  const drugMap = new Map()
  drugs.data?.forEach(d => drugMap.set(d.id, { name: d.drug_name, code: d.drug_code }))
  applDrugs.data?.forEach(d => drugMap.set(d.id, { name: d.item_name, code: d.item_code }))

  const nonDrugMap = new Map()
  nonDrugs.data?.forEach(d => nonDrugMap.set(d.id, { name: d.item_name, code: d.item_code }))
  applNonDrugs.data?.forEach(d => nonDrugMap.set(d.id, { name: d.item_name, code: d.item_code }))

  // Apply back to the objects
  itemsToResolve.forEach((item: any) => {
    const map = item.item_type === 'drug' ? drugMap : nonDrugMap
    const resolved = map.get(item.item_id)
    if (resolved) {
      item.item_name = resolved.name
      item.item_code = resolved.code
    } else {
      item.item_name = 'Unknown Item'
    }
  })
}

/**
 * Get CC expenses for a hospital
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
    department?: string
  }
): Promise<ApiResponse<CCExpenseWithRelations[]>> {
  try {
    let query = supabase
      .from('pharmacy_cc_expenses')
      .select(`
        *,
        warrant:pharmacy_warrants(*),
        purchase_order:pharmacy_purchase_orders(
          *,
          items:pharmacy_purchase_order_items(*)
        ),
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

    if (filters?.department) {
      query = query.eq('department', filters.department)
    }

    const { data, error } = await query.order('expense_date', { ascending: false })

    if (error) throw error

    const expenses = (data || []) as CCExpenseWithRelations[]

    // Resolve missing item names in bulk for legacy records
    await resolveItemNames(expenses.map(e => e.purchase_order).filter(Boolean) as any[])

    return { data: expenses, error: null }
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
 */
export async function syncCCExpensesFromPOs(
  hospitalId: string,
  fiscalYear: number
): Promise<ApiResponse<{ synced: number; errors: string[] }>> {
  try {
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

    // Get all purchase orders for the fiscal year with vote_code 080702
    const { data: purchaseOrders, error: poError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('vote_code', '080702')
      .gte('order_date', startDate)
      .lte('order_date', endDate)
      .neq('status', 'cancelled')

    if (poError) throw poError

    if (!purchaseOrders || purchaseOrders.length === 0) {
      return { data: { synced: 0, errors: [] }, error: null }
    }

    // Prepare expenses for upsert
    const expensesToCreate: any[] = []
    const errors: string[] = []

    for (const po of purchaseOrders) {
      // Find matching warrant
      const poDate = new Date(po.order_date)
      const matchingWarrant = warrantsResult.data.find((w) => {
        const warrantDate = new Date(w.warrant_date)
        const daysDiff = Math.abs((poDate.getTime() - warrantDate.getTime()) / (1000 * 60 * 60 * 24))
        if (po.vote_activity && w.vote_activity) {
          return po.vote_activity === w.vote_activity && daysDiff <= 180
        }
        return daysDiff <= 90
      })

      let category = po.category

      if (!category) {
        // Fallback: check items if category is missing on PO
        const { data: poItems } = await supabase
          .from('pharmacy_purchase_order_items')
          .select('item_type')
          .eq('po_id', po.id)
          .limit(1)

        category = poItems && poItems.length > 0
          ? (poItems[0].item_type === 'drug' ? 'drug' : 'non_drug')
          : matchingWarrant?.category || null
      }

      let dept = po.department || matchingWarrant?.department || null
      if (dept) {
        const normalizedInput = dept.trim().toLowerCase()
          .replace(/\s+and\s+/g, '_')
          .replace(/\s+department$/i, '')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')

        const found = WARRANT_DEPARTMENTS.find(d =>
          d.value.toLowerCase() === normalizedInput ||
          d.label.toLowerCase() === dept.trim().toLowerCase()
        )

        if (found) {
          dept = found.value
        }
      }

      const amount = Number(po.total_amount)
      if (!amount || amount <= 0) {
        continue
      }

      const expenseFiscalYear = po.order_date ? new Date(po.order_date).getFullYear() : fiscalYear
      if (isNaN(expenseFiscalYear)) {
        continue
      }

      expensesToCreate.push({
        hospital_id: hospitalId,
        fiscal_year: expenseFiscalYear,
        warrant_id: matchingWarrant?.id || null,
        po_id: po.id,
        expense_date: po.order_date,
        po_number: po.po_number,
        lpo_number: po.po_type === 'lpo' ? po.po_number : null,
        po_type: po.po_type || 'regular',
        amount: amount,
        status: po.status === 'cancelled' ? 'cancelled' :
          po.status === 'completed' ? 'completed' :
            (po.status === 'approved' || po.status === 'sent' || po.status === 'partial_received') ? 'approved' : 'pending',
        category: category,
        vote_activity: po.vote_activity || matchingWarrant?.vote_activity || null,
        department: dept,
        created_by: isUUID(po.created_by) ? po.created_by : null,
      })
    }

    if (expensesToCreate.length > 0) {
      const { error: upsertError } = await supabase
        .from('pharmacy_cc_expenses')
        .upsert(expensesToCreate, {
          onConflict: 'hospital_id,fiscal_year,po_id'
        })

      if (upsertError) {
        console.error('Batch upsert FAILED:', upsertError)
        for (const exp of expensesToCreate) {
          const { error: indError } = await supabase
            .from('pharmacy_cc_expenses')
            .upsert(exp, { onConflict: 'hospital_id,fiscal_year,po_id' })
          if (indError) errors.push(`PO ${exp.po_number}: ${indError.message}`)
        }
      }
    }

    return { data: { synced: expensesToCreate.length, errors }, error: null }
  } catch (error) {
    console.error('Error syncing CC expenses:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to sync CC expenses',
    }
  }
}

/**
 * Sync a single purchase order to CC expenses immediately
 */
export async function syncSinglePOToCCAllocation(
  hospitalId: string,
  poId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the PO details
    const { data: po, error: poError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('id, vote_code, order_date, status, total_amount')
      .eq('id', poId)
      .single()

    if (poError) {
      console.error('Error fetching PO for sync:', poError)
      return { success: false, error: `Failed to fetch PO: ${poError.message}` }
    }

    if (!po) return { success: false, error: 'PO not found' }

    // If PO is cancelled, delete the corresponding CC expense record
    if (po.status === 'cancelled') {
      const { error: deleteError } = await supabase
        .from('pharmacy_cc_expenses')
        .delete()
        .eq('hospital_id', hospitalId)
        .eq('po_id', poId)

      if (deleteError) {
        console.error('Error deleting expense for cancelled PO:', deleteError)
        return { success: false, error: `Failed to remove expense: ${deleteError.message}` }
      }
      return { success: true }
    }

    // Only sync if vote_code is 080702
    if (po.vote_code !== '080702') {
      return { success: true }
    }

    const fiscalYear = new Date(po.order_date).getFullYear()

    // Trigger the full sync for this year to handle warrant matching and dependencies
    const result = await syncCCExpensesFromPOs(hospitalId, fiscalYear)

    if (result.error) {
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in single PO sync:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown sync error' }
  }
}

/**
 * Get CC allocation summary
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
    const startDate = `${fiscalYear}-01-01`
    const endDate = `${fiscalYear}-12-31`

    const warrantsResult = await getWarrants(hospitalId, {
      startDate,
      endDate,
      voteCode: '080702',
    })

    let filteredWarrants = warrantsResult.data || []

    if (filters?.department && filters.department !== 'all') {
      const deptFilter = filters.department.toLowerCase()
      filteredWarrants = filteredWarrants.filter((w) =>
        w.department?.toLowerCase() === deptFilter
      )
    }

    if (filters?.voteActivity && filters.voteActivity !== 'all') {
      filteredWarrants = filteredWarrants.filter((w) => w.vote_activity === filters.voteActivity)
    }

    if (filters?.category && filters.category !== 'all') {
      filteredWarrants = filteredWarrants.filter((w) =>
        w.category?.toLowerCase() === filters.category?.toLowerCase()
      )
    }

    const warrants = filteredWarrants
    const totalAllocation = warrants.reduce((sum, w) => sum + Number(w.amount), 0)

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

    const expenses = (expensesResult.data || []).filter((e) => {
      if (filters?.department && filters.department !== 'all') {
        if (e.department?.toLowerCase() !== filters.department.toLowerCase()) return false
      }
      if (filters?.voteActivity && filters.voteActivity !== 'all') {
        const activity = e.vote_activity || e.warrant?.vote_activity
        if (activity !== filters.voteActivity) return false
      }
      if (filters?.category && filters.category !== 'all') {
        if (e.category?.toLowerCase() !== filters.category.toLowerCase()) return false
      }
      return true
    })

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const totalBalance = totalAllocation - totalExpenses
    const totalLiabilities = expenses
      .filter((e) => e.status === 'approved')
      .reduce((sum, e) => sum + Number(e.amount), 0)
    const netExpenses = expenses
      .filter((e) => e.status === 'completed')
      .reduce((sum, e) => sum + Number(e.amount), 0)
    const usagePercentage = totalAllocation > 0 ? (totalExpenses / totalAllocation) * 100 : 0

    const quarterly = [1, 2, 3, 4].map((quarter) => {
      const quarterStartMonth = (quarter - 1) * 3
      const quarterStart = new Date(fiscalYear, quarterStartMonth, 1)
      const quarterEnd = new Date(fiscalYear, quarterStartMonth + 3, 0)

      const quarterWarrants = warrants.filter((w) => {
        const warrantDate = new Date(w.warrant_date)
        return warrantDate >= quarterStart && warrantDate <= quarterEnd
      })

      const quarterExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.expense_date)
        return expenseDate >= quarterStart && expenseDate <= quarterEnd
      })

      const quarterAllocation = quarterWarrants.reduce((sum, w) => sum + Number(w.amount), 0)
      const quarterExpensesAmount = quarterExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const quarterBalance = quarterAllocation - quarterExpensesAmount
      const quarterUsage = quarterAllocation > 0 ? (quarterExpensesAmount / quarterAllocation) * 100 : 0

      return {
        quarter: quarter as 1 | 2 | 3 | 4,
        allocation: quarterAllocation,
        expenses: quarterExpensesAmount,
        balance: quarterBalance,
        usage_percentage: quarterUsage,
      }
    })

    const voteActivityMap = new Map<string, {
      allocation: number
      expenses: number
      liabilities: number
      netExpenses: number
      count: number
    }>()

    warrants.forEach((w) => {
      const activity = w.vote_activity || 'other'
      const current = voteActivityMap.get(activity) || { allocation: 0, expenses: 0, liabilities: 0, netExpenses: 0, count: 0 }
      current.allocation += Number(w.amount)
      voteActivityMap.set(activity, current)
    })

    expenses.forEach((e) => {
      const activity = e.vote_activity || 'other'
      const current = voteActivityMap.get(activity) || { allocation: 0, expenses: 0, liabilities: 0, netExpenses: 0, count: 0 }
      current.expenses += Number(e.amount)
      if (e.status === 'approved') current.liabilities += Number(e.amount)
      if (e.status === 'completed') current.netExpenses += Number(e.amount)
      current.count += 1
      voteActivityMap.set(activity, current)
    })

    const byVoteActivity = Array.from(voteActivityMap.entries()).map(([vote_activity, data]) => ({
      vote_activity,
      allocation: data.allocation,
      expenses: data.expenses,
      balance: data.allocation - data.expenses,
      liabilities: data.liabilities,
      net_expenses: data.netExpenses,
      count: data.count,
    }))

    const categoryMap = new Map<string, { allocation: number; expenses: number; count: number }>()
    warrants.forEach((w) => {
      const cat = w.category || 'other'
      const current = categoryMap.get(cat) || { allocation: 0, expenses: 0, count: 0 }
      current.allocation += Number(w.amount)
      categoryMap.set(cat, current)
    })
    expenses.forEach((e) => {
      const cat = e.category || 'other'
      const current = categoryMap.get(cat) || { allocation: 0, expenses: 0, count: 0 }
      current.expenses += Number(e.amount)
      current.count += 1
      categoryMap.set(cat, current)
    })
    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      allocation: data.allocation,
      expenses: data.expenses,
      balance: data.allocation - data.expenses,
      count: data.count,
    }))

    const poTypeMap = new Map<string, { expenses: number; count: number }>()
    expenses.forEach((e) => {
      const current = poTypeMap.get(e.po_type) || { expenses: 0, count: 0 }
      current.expenses += Number(e.amount)
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
      total_count: expenses.length,
      quarterly,
      by_vote_activity: byVoteActivity,
      by_category: byCategory,
      by_po_type: byPoType,
    }

    return { data: summary, error: null }
  } catch (error) {
    console.error('Error calculating CC allocation summary:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to calculate CC allocation summary' }
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
      .upsert(expenseData, { onConflict: 'hospital_id,fiscal_year,po_id' })
      .select('*')
      .single()

    if (error) throw error
    return { data: inserted as CCExpense, error: null }
  } catch (error) {
    console.error('Error upserting CC expense:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to upsert CC expense' }
  }
}
