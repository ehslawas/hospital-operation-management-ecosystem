// @ts-nocheck
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse } from '@/types'

export interface LpAllocationSummary {
  total_items: number
  total_quota: number
  total_balance: number
  total_value: number
}

/**
 * Fetch LP items with pagination and filters
 */
export async function getLpItems(
  hospitalId: string,
  options: {
    type: 'sebut_harga_lq' | 'cfln' | 'non_drug'
    search?: string
    page?: number
    pageSize?: number
  }
): Promise<ApiResponse<{ data: any[]; total: number; totalPages: number }>> {
  try {
    const { type, search, page = 1, pageSize = 15 } = options
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    if (isSupabaseConfigured()) {
      if (type === 'non_drug') {
        let query = supabase
          .from('non_drugs')
          .select('*', { count: 'exact' })
          .eq('hospital_id', hospitalId)
          .eq('procurement_vote', 'lp')

        if (search) {
          query = query.or(`item_code.ilike.%${search}%,item_name.ilike.%${search}%`)
        }

        const { data, count, error } = await query
          .order('item_name', { ascending: true })
          .range(from, to)

        if (error) throw error

        return {
          data: {
            data: data || [],
            total: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize),
          },
          error: null,
        }
      } else {
        let query = supabase
          .from('drugs')
          .select('*', { count: 'exact' })
          .eq('hospital_id', hospitalId)
          .eq('procurement_vote', 'lp')
          .eq('lp_type', type)

        if (search) {
          query = query.or(`drug_code.ilike.%${search}%,drug_name.ilike.%${search}%`)
        }

        const { data, count, error } = await query
          .order('drug_name', { ascending: true })
          .range(from, to)

        if (error) throw error

        return {
          data: {
            data: data || [],
            total: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize),
          },
          error: null,
        }
      }
    }

    // Local Mock Fallback
    return {
      data: {
        data: [],
        total: 0,
        totalPages: 0,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching LP items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch LP items',
    }
  }
}

/**
 * Get overall summary of LP allocations
 */
export async function getLpAllocationSummary(
  hospitalId: string
): Promise<ApiResponse<LpAllocationSummary>> {
  try {
    if (isSupabaseConfigured()) {
      // Get all drugs under LP
      const { data: drugs, error: drugsError } = await supabase
        .from('drugs')
        .select('lp_quota, lp_balance, price')
        .eq('hospital_id', hospitalId)
        .eq('procurement_vote', 'lp')

      if (drugsError) throw drugsError

      // Get all non-drugs under LP
      const { data: nonDrugs, error: nonDrugsError } = await supabase
        .from('non_drugs')
        .select('lp_quota, lp_balance, price')
        .eq('hospital_id', hospitalId)
        .eq('procurement_vote', 'lp')

      if (nonDrugsError) throw nonDrugsError

      const allItems = [...(drugs || []), ...(nonDrugs || [])]
      
      const totalItems = allItems.length
      const totalQuota = allItems.reduce((sum, item) => sum + (item.lp_quota || 0), 0)
      const totalBalance = allItems.reduce((sum, item) => sum + (item.lp_balance || 0), 0)
      const totalValue = allItems.reduce((sum, item) => {
        const q = item.lp_quota || 0
        const p = item.price || 0
        return sum + (q * p)
      }, 0)

      return {
        data: {
          total_items: totalItems,
          total_quota: totalQuota,
          total_balance: totalBalance,
          total_value: totalValue,
        },
        error: null,
      }
    }

    return {
      data: {
        total_items: 0,
        total_quota: 0,
        total_balance: 0,
        total_value: 0,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error calculating LP summary:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to calculate LP summary',
    }
  }
}
