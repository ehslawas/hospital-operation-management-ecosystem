// @ts-nocheck
/**
 * Pharmacy Budget Service
 * Handles financial management including APPL, CC/DP, and forecasting
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  Budget,
  BudgetWithRelations,
  BudgetTransaction,
  APPL,
  APPLWithRelations,
  BudgetSummary,
  BudgetType,
  BudgetCategory,
} from '@/types/pharmacy'
import { mockBudgets } from '@/services/pharmacy/mockData'

/**
 * Get all budgets for a hospital
 */
export async function getBudgets(
  hospitalId: string,
  fiscalYear?: number,
  budgetType?: BudgetType
): Promise<ApiResponse<Budget[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_budgets')
        .select('*')
        .eq('hospital_id', hospitalId)

      if (fiscalYear) {
        query = query.eq('fiscal_year', fiscalYear)
      }

      if (budgetType) {
        query = query.eq('budget_type', budgetType)
      }

      const { data, error } = await query
        .order('fiscal_year', { ascending: false })
        .order('budget_type', { ascending: true })

      if (error) throw error

      return { data: (data || []) as Budget[], error: null }
    }

    let budgets = [...mockBudgets]

    if (fiscalYear) {
      budgets = budgets.filter(b => b.fiscal_year === fiscalYear)
    }

    if (budgetType) {
      budgets = budgets.filter(b => b.budget_type === budgetType)
    }

    return { data: budgets, error: null }
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch budgets',
    }
  }
}

/**
 * Get budget summary
 */
export async function getBudgetSummary(
  hospitalId: string,
  fiscalYear: number
): Promise<ApiResponse<BudgetSummary>> {
  try {
    let budgets: Budget[]

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_budgets')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('fiscal_year', fiscalYear)

      if (error) throw error
      budgets = (data || []) as Budget[]
    } else {
      budgets = mockBudgets.filter(b => b.fiscal_year === fiscalYear)
    }

    const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated_amount, 0)
    const totalUtilized = budgets.reduce((sum, b) => sum + b.utilized_amount, 0)
    const totalCommitted = budgets.reduce((sum, b) => sum + b.committed_amount, 0)
    const totalAvailable = budgets.reduce((sum, b) => sum + b.available_amount, 0)

    const summary: BudgetSummary = {
      fiscal_year: fiscalYear,
      total_allocated: totalAllocated,
      total_utilized: totalUtilized,
      total_committed: totalCommitted,
      total_available: totalAvailable,
      utilization_percentage: totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0,
      by_type: [
        {
          type: 'appl',
          allocated: budgets.filter(b => b.budget_type === 'appl').reduce((s, b) => s + b.allocated_amount, 0),
          utilized: budgets.filter(b => b.budget_type === 'appl').reduce((s, b) => s + b.utilized_amount, 0),
          available: budgets.filter(b => b.budget_type === 'appl').reduce((s, b) => s + b.available_amount, 0),
        },
        {
          type: 'cc',
          allocated: budgets.filter(b => b.budget_type === 'cc').reduce((s, b) => s + b.allocated_amount, 0),
          utilized: budgets.filter(b => b.budget_type === 'cc').reduce((s, b) => s + b.utilized_amount, 0),
          available: budgets.filter(b => b.budget_type === 'cc').reduce((s, b) => s + b.available_amount, 0),
        },
        {
          type: 'dp',
          allocated: budgets.filter(b => b.budget_type === 'dp').reduce((s, b) => s + b.allocated_amount, 0),
          utilized: budgets.filter(b => b.budget_type === 'dp').reduce((s, b) => s + b.utilized_amount, 0),
          available: budgets.filter(b => b.budget_type === 'dp').reduce((s, b) => s + b.available_amount, 0),
        },
      ],
      by_category: [
        {
          category: 'drug',
          allocated: budgets.filter(b => b.category === 'drug').reduce((s, b) => s + b.allocated_amount, 0),
          utilized: budgets.filter(b => b.category === 'drug').reduce((s, b) => s + b.utilized_amount, 0),
          available: budgets.filter(b => b.category === 'drug').reduce((s, b) => s + b.available_amount, 0),
        },
        {
          category: 'non_drug',
          allocated: budgets.filter(b => b.category === 'non_drug').reduce((s, b) => s + b.allocated_amount, 0),
          utilized: budgets.filter(b => b.category === 'non_drug').reduce((s, b) => s + b.utilized_amount, 0),
          available: budgets.filter(b => b.category === 'non_drug').reduce((s, b) => s + b.available_amount, 0),
        },
      ],
    }

    return { data: summary, error: null }
  } catch (error) {
    console.error('Error fetching budget summary:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch budget summary',
    }
  }
}

/**
 * Create budget allocation
 */
export async function createBudgetAllocation(
  hospitalId: string,
  userId: string,
  data: {
    fiscal_year: number
    budget_type: BudgetType
    category: BudgetCategory
    allocated_amount: number
  }
): Promise<ApiResponse<Budget>> {
  try {
    if (isSupabaseConfigured()) {
      const { data: inserted, error } = await supabase
        .from('pharmacy_budgets')
        .insert({
          hospital_id: hospitalId,
          fiscal_year: data.fiscal_year,
          budget_type: data.budget_type,
          category: data.category,
          allocated_amount: data.allocated_amount,
          utilized_amount: 0,
          committed_amount: 0,
          available_amount: data.allocated_amount,
          created_by: userId,
          status: 'active',
        })
        .select('*')
        .single()

      if (error) throw error

      return { data: inserted as Budget, error: null }
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    const newBudget: Budget = {
      id: `bud-${Date.now()}`,
      hospital_id: hospitalId,
      fiscal_year: data.fiscal_year,
      budget_type: data.budget_type,
      category: data.category,
      allocated_amount: data.allocated_amount,
      utilized_amount: 0,
      committed_amount: 0,
      available_amount: data.allocated_amount,
      created_by: userId,
      status: 'active',
      created_at: new Date().toISOString(),
    }

    return { data: newBudget, error: null }
  } catch (error) {
    console.error('Error creating budget allocation:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create budget allocation',
    }
  }
}

/**
 * Record budget transaction
 */
export async function recordBudgetTransaction(
  budgetId: string,
  userId: string,
  data: {
    transaction_type: 'commitment' | 'expenditure' | 'release'
    amount: number
    reference_type?: string
    reference_id?: string
    description?: string
  }
): Promise<ApiResponse<BudgetTransaction>> {
  try {
    if (isSupabaseConfigured()) {
      const { data: inserted, error } = await supabase
        .from('pharmacy_budget_transactions')
        .insert({
          budget_id: budgetId,
          transaction_type: data.transaction_type,
          amount: data.amount,
          reference_type: data.reference_type,
          reference_id: data.reference_id,
          description: data.description,
          performed_by: userId,
        })
        .select('*')
        .single()

      if (error) throw error

      return { data: inserted as BudgetTransaction, error: null }
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    const transaction: BudgetTransaction = {
      id: `bt-${Date.now()}`,
      budget_id: budgetId,
      transaction_type: data.transaction_type,
      amount: data.amount,
      reference_type: data.reference_type,
      reference_id: data.reference_id,
      description: data.description,
      performed_by: userId,
      created_at: new Date().toISOString(),
    }

    return { data: transaction, error: null }
  } catch (error) {
    console.error('Error recording budget transaction:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to record budget transaction',
    }
  }
}

// =====================================================
// APPL MANAGEMENT
// =====================================================

/**
 * Get APPL applications
 */
export async function getAPPLApplications(
  hospitalId: string,
  fiscalYear?: number,
  status?: string
): Promise<ApiResponse<APPL[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_appl')
        .select('*')
        .eq('hospital_id', hospitalId)

      if (fiscalYear) {
        query = query.eq('fiscal_year', fiscalYear)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
        .order('fiscal_year', { ascending: false })
        .order('appl_number', { ascending: true })

      if (error) throw error

      return { data: (data || []) as APPL[], error: null }
    }

    // Fallback: no APPL rows when Supabase is not configured
    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching APPL applications:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch APPL applications',
    }
  }
}

/**
 * Create APPL application
 */
export async function createAPPLApplication(
  hospitalId: string,
  userId: string,
  data: {
    fiscal_year: number
    amount_requested: number
    purpose: string
    justification: string
  }
): Promise<ApiResponse<APPL>> {
  try {
    if (isSupabaseConfigured()) {
      const now = new Date()
      const applNumber = `APPL-${data.fiscal_year}-${String(Date.now()).slice(-3)}`

      const { data: inserted, error } = await supabase
        .from('pharmacy_appl')
        .insert({
          hospital_id: hospitalId,
          appl_number: applNumber,
          fiscal_year: data.fiscal_year,
          amount_requested: data.amount_requested,
          purpose: data.purpose,
          justification: data.justification,
          status: 'draft',
          created_at: now.toISOString(),
        })
        .select('*')
        .single()

      if (error) throw error

      return { data: inserted as APPL, error: null }
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    const newAPPL: APPL = {
      id: `appl-${Date.now()}`,
      hospital_id: hospitalId,
      appl_number: `APPL-${data.fiscal_year}-${String(Date.now()).slice(-3)}`,
      fiscal_year: data.fiscal_year,
      amount_requested: data.amount_requested,
      purpose: data.purpose,
      justification: data.justification,
      status: 'draft',
      created_at: new Date().toISOString(),
    }

    return { data: newAPPL, error: null }
  } catch (error) {
    console.error('Error creating APPL application:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create APPL application',
    }
  }
}

/**
 * Submit APPL application
 */
export async function submitAPPLApplication(
  applId: string,
  userId: string
): Promise<ApiResponse<APPL>> {
  try {
    if (isSupabaseConfigured()) {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('pharmacy_appl')
        .update({
          status: 'submitted',
          submitted_by: userId,
          submitted_at: now,
        })
        .eq('id', applId)
        .select('*')
        .single()

      if (error) throw error

      return { data: data as APPL, error: null }
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      data: {
        id: applId,
        hospital_id: 'mock-hospital',
        appl_number: 'APPL-MOCK',
        fiscal_year: new Date().getFullYear(),
        amount_requested: 0,
        purpose: 'Mock',
        status: 'submitted',
        submitted_by: userId,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      } as APPL,
      error: null,
    }
  } catch (error) {
    console.error('Error submitting APPL application:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to submit APPL application',
    }
  }
}

/**
 * Get budget forecast
 */
export async function getBudgetForecast(
  hospitalId: string,
  fiscalYear: number
): Promise<ApiResponse<{
  monthly_forecast: { month: string; projected: number; actual: number }[]
  quarterly_forecast: { quarter: string; projected: number; actual: number }[]
  annual_projection: number
}>> {
  try {
    const forecast = {
      monthly_forecast: [
        { month: 'Jan', projected: 45000, actual: 42000 },
        { month: 'Feb', projected: 48000, actual: 51000 },
        { month: 'Mar', projected: 50000, actual: 47000 },
        { month: 'Apr', projected: 52000, actual: 0 },
        { month: 'May', projected: 48000, actual: 0 },
        { month: 'Jun', projected: 55000, actual: 0 },
        { month: 'Jul', projected: 50000, actual: 0 },
        { month: 'Aug', projected: 48000, actual: 0 },
        { month: 'Sep', projected: 52000, actual: 0 },
        { month: 'Oct', projected: 55000, actual: 0 },
        { month: 'Nov', projected: 58000, actual: 0 },
        { month: 'Dec', projected: 45000, actual: 0 },
      ],
      quarterly_forecast: [
        { quarter: 'Q1', projected: 143000, actual: 140000 },
        { quarter: 'Q2', projected: 155000, actual: 0 },
        { quarter: 'Q3', projected: 150000, actual: 0 },
        { quarter: 'Q4', projected: 158000, actual: 0 },
      ],
      annual_projection: 606000,
    }

    return { data: forecast, error: null }
  } catch (error) {
    console.error('Error fetching budget forecast:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch budget forecast',
    }
  }
}

