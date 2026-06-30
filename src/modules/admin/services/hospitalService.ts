// @ts-nocheck
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { Hospital, PaginatedResponse, SortConfig, FilterConfig } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

interface GetHospitalsParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  sort?: SortConfig
}

/**
 * Get paginated list of hospitals
 */
export async function getHospitals({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
  status,
  sort,
}: GetHospitalsParams): Promise<PaginatedResponse<Hospital>> {
  try {
    if (isSupabaseConfigured()) {
      // Supabase implementation
      let query = supabase.from('hospitals').select('*', { count: 'exact' })

      if (search) {
        query = query.or(
          `hospital_name.ilike.%${search}%,hospital_code.ilike.%${search}%,address.ilike.%${search}%`
        )
      }
      if (status) {
        query = query.eq('status', status)
      }

      if (sort) {
        query = query.order(sort.key, { ascending: sort.direction === 'asc' })
      } else {
        query = query.order('hospital_name', { ascending: true })
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching hospitals from Supabase:', error)
        throw new Error(error.message)
      }

      const totalPages = count ? Math.ceil(count / pageSize) : 0

      return {
        data: (data || []) as Hospital[],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      }
    } else {
      // Supabase is required
      throw new Error('Supabase is not configured. Hospital operations require database connection.')
    }
  } catch (error) {
    console.error('Error fetching hospitals:', error)
    throw error
  }
}

/**
 * Get hospital by ID
 */
export async function getHospitalById(id: string): Promise<Hospital | null> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('hospitals').select('*').eq('id', id).single()

      if (error) {
        console.error('Error fetching hospital from Supabase:', error)
        throw new Error(error.message)
      }
      return data as Hospital
    } else {
      // Supabase is required
      throw new Error('Supabase is not configured. Hospital operations require database connection.')
    }
  } catch (error) {
    console.error('Error fetching hospital:', error)
    throw error
  }
}

/**
 * Create new hospital
 */
export async function createHospital(hospital: Omit<Hospital, 'id' | 'created_at' | 'updated_at'>): Promise<Hospital> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('hospitals').insert(hospital).select().single()
      if (error) {
        console.error('Error creating hospital in Supabase:', error)
        throw new Error(error.message || 'Failed to create hospital')
      }
      if (!data) {
        throw new Error('Hospital was created but no data was returned')
      }
      return data as Hospital
    } else {
      // Supabase is required
      throw new Error('Supabase is not configured. Hospital creation requires database connection.')
    }
  } catch (error) {
    console.error('Error creating hospital:', error)
    throw error
  }
}

/**
 * Update hospital
 */
export async function updateHospital(id: string, updates: Partial<Hospital>): Promise<Hospital> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('hospitals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Hospital
    } else {
      // Supabase is required
      throw new Error('Supabase is not configured. Hospital update requires database connection.')
    }
  } catch (error) {
    console.error('Error updating hospital:', error)
    throw error
  }
}

/**
 * Delete hospital
 */
export async function deleteHospital(id: string): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('hospitals').delete().eq('id', id)
      if (error) {
        console.error('Error deleting hospital from Supabase:', error)
        throw new Error(error.message || 'Failed to delete hospital')
      }
    } else {
      // Supabase is required
      throw new Error('Supabase is not configured. Hospital deletion requires database connection.')
    }
  } catch (error) {
    console.error('Error deleting hospital:', error)
    throw error
  }
}

/**
 * Get all hospitals (for dropdowns)
 */
export async function getAllHospitals(): Promise<Hospital[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('status', 'active')
        .order('hospital_name', { ascending: true })

      if (error) {
        console.error('Error fetching hospitals from Supabase:', error)
        throw new Error(error.message)
      }
      return (data || []) as Hospital[]
    } else {
      // Supabase is required
      throw new Error('Supabase is not configured. Hospital operations require database connection.')
    }
  } catch (error) {
    console.error('Error fetching hospitals:', error)
    throw error
  }
}

