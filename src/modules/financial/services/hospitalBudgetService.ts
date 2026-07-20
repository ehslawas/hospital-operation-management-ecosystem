import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse } from '@/types'
import type { WarrantCategory, WarrantVoteCode, WarrantVoteActivity } from '@/types/pharmacy'

export interface ForecastJustification {
  id?: string
  hospital_id: string
  fiscal_year: number
  category_id: string
  proposed_topup: number
  justification_text: string
  priority: string
  updated_by?: string
  updated_at?: string
}

export interface ScenarioForecastItem {
  id: string
  voteCode: string
  voteActivity: string
  categoryName: string
  baseAllocation: number
  baseMonthlyBurn: number
  trend: 'increasing' | 'decreasing' | 'stable'
  confidence: number
  justifications: {
    id: string
    code: string
    name: string
    monthlyConsumption: string
    reason: string
    addedCost: number
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }[]
  allocation: number
  ytdSpent: number
  avgMonthlyUse: number
  projectedRemaining: number
  eoyProjectedSpend: number
  shortfall: number
  variance: number
  isDeficit: boolean
  // User justifications overlay
  savedTopup?: number
  savedJustification?: string
  savedPriority?: string
}

/**
 * Fetch saved forecast justifications from database
 */
export async function getForecastJustifications(
  hospitalId: string,
  fiscalYear: number
): Promise<ApiResponse<ForecastJustification[]>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('hospital_forecast_justifications')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('fiscal_year', fiscalYear)

    if (error) throw error
    return { data: (data || []) as ForecastJustification[], error: null }
  } catch (error) {
    console.error('Error fetching forecast justifications:', error)
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch justifications',
    }
  }
}

/**
 * Save/Upsert a forecast justification
 */
export async function saveForecastJustification(
  justification: Omit<ForecastJustification, 'id' | 'updated_at'>
): Promise<ApiResponse<ForecastJustification>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: justification as ForecastJustification, error: null }
    }

    const { data, error } = await supabase
      .from('hospital_forecast_justifications')
      .upsert(
        {
          hospital_id: justification.hospital_id,
          fiscal_year: justification.fiscal_year,
          category_id: justification.category_id,
          proposed_topup: justification.proposed_topup,
          justification_text: justification.justification_text,
          priority: justification.priority,
          updated_by: justification.updated_by,
        },
        { onConflict: 'hospital_id,fiscal_year,category_id' }
      )
      .select('*')
      .single()

    if (error) throw error
    return { data: data as ForecastJustification, error: null }
  } catch (error) {
    console.error('Error saving forecast justification:', error)
    return {
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to save justification',
    }
  }
}
