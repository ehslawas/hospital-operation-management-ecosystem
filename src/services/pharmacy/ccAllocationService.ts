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
import { getWarrants } from './warrantService'

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

      return { data: (data || []) as CCExpenseWithRelations[], error: null }
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

    // Get all purchase orders for the fiscal year
    const { data: purchaseOrders, error: poError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('*')
      .eq('hospital_id', hospitalId)
      .gte('order_date', startDate)
      .lte('order_date', endDate)
      .in('status', ['approved', 'sent', 'partial_received', 'completed'])

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

    // Filter POs that should be tracked (linked to 080702 warrants or have matching categories)
    const expensesToCreate: any[] = []
    const errors: string[] = []

    for (const po of purchaseOrders) {
      // Skip if already tracked
      if (existingPoIds.has(po.id)) continue

      // Find matching warrant (by date proximity, category, and vote activity)
      const poDate = new Date(po.order_date)
      // First try to match by vote activity and date proximity
      let matchingWarrant = warrantsResult.data.find((w) => {
        const warrantDate = new Date(w.warrant_date)
        const daysDiff = Math.abs((poDate.getTime() - warrantDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff <= 90 // Within 90 days
      })
      
      // If no match found, try to find by category match
      if (!matchingWarrant) {
        matchingWarrant = warrantsResult.data.find((w) => {
          const warrantDate = new Date(w.warrant_date)
          const daysDiff = Math.abs((poDate.getTime() - warrantDate.getTime()) / (1000 * 60 * 60 * 24))
          return daysDiff <= 180 // Within 180 days for category match
        })
      }

      // Determine category from PO items if available
      const { data: poItems } = await supabase
        .from('pharmacy_purchase_order_items')
        .select('item_type')
        .eq('po_id', po.id)
        .limit(1)

      const category = poItems && poItems.length > 0 
        ? (poItems[0].item_type === 'drug' ? 'drug' : 'non_drug')
        : undefined

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
          status: po.status === 'completed' ? 'completed' : po.status === 'approved' || po.status === 'sent' ? 'approved' : 'pending',
          category: category || matchingWarrant?.category || null,
          vote_activity: matchingWarrant?.vote_activity || null,
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
    if (filters?.department) {
      filteredWarrants = filteredWarrants.filter((w) => w.department === filters.department)
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

    const expenses = expensesResult.data || []

    // Calculate metrics
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const totalBalance = totalAllocation - totalExpenses
    const totalLiabilities = expenses
      .filter((e) => e.status === 'pending' || e.status === 'approved')
      .reduce((sum, e) => sum + Number(e.amount), 0)
    const netExpenses = expenses
      .filter((e) => e.status === 'completed')
      .reduce((sum, e) => sum + Number(e.amount), 0)
    const usagePercentage = totalAllocation > 0 ? (totalExpenses / totalAllocation) * 100 : 0

    // Quarterly breakdown
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

    // Breakdown by vote activity
    const voteActivityMap = new Map<string, { 
      allocation: number
      expenses: number
      liabilities: number
      netExpenses: number
      count: number
    }>()
    
    warrants.forEach((w) => {
      const activity = w.vote_activity || 'other'
      const current = voteActivityMap.get(activity) || { 
        allocation: 0, 
        expenses: 0, 
        liabilities: 0,
        netExpenses: 0,
        count: 0 
      }
      current.allocation += Number(w.amount)
      voteActivityMap.set(activity, current)
    })

    expenses.forEach((e) => {
      const activity = e.vote_activity || 'other'
      const current = voteActivityMap.get(activity) || { 
        allocation: 0, 
        expenses: 0, 
        liabilities: 0,
        netExpenses: 0,
        count: 0 
      }
      current.expenses += Number(e.amount)
      
      // Calculate liabilities (pending + approved)
      if (e.status === 'pending' || e.status === 'approved') {
        current.liabilities += Number(e.amount)
      }
      
      // Calculate net expenses (completed only)
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
      balance: data.allocation - data.expenses,
      liabilities: data.liabilities,
      net_expenses: data.netExpenses,
      count: data.count,
    }))

    // Breakdown by category
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

    // Breakdown by PO type
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

