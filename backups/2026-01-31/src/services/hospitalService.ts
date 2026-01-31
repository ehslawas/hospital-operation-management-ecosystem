import { supabase } from './supabase'
import type { Hospital, PaginatedResponse } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

interface GetHospitalsParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  sort?: { key: string; direction: 'asc' | 'desc' }
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
    const { data, error } = await supabase.from('hospitals').select('*').eq('id', id).single()

    if (error) {
      console.error('Error fetching hospital from Supabase:', error)
      throw new Error(error.message)
    }
    return data as Hospital
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
    const { data, error } = await supabase.from('hospitals').insert(hospital).select().single()
    if (error) {
      console.error('Error creating hospital in Supabase:', error)
      throw new Error(error.message || 'Failed to create hospital')
    }
    if (!data) {
      throw new Error('Hospital was created but no data was returned')
    }
    return data as Hospital
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
    const { data, error } = await supabase
      .from('hospitals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Hospital
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
    const { error } = await supabase.from('hospitals').delete().eq('id', id)
    if (error) {
      console.error('Error deleting hospital from Supabase:', error)
      throw new Error(error.message || 'Failed to delete hospital')
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
    const TIMEOUT_MS = 8000
    const query = supabase
      .from('hospitals')
      .select('*')
      .eq('status', 'active')
      .order('hospital_name', { ascending: true })
      .limit(100)

    const { data, error } = await Promise.race([
      query,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Hospitals query timed out')), TIMEOUT_MS)
      )
    ]) as any

    if (error) {
      console.error('Error fetching hospitals from Supabase:', error)
      throw new Error(error.message)
    }
    return (data || []) as Hospital[]
  } catch (error) {
    console.error('Error fetching hospitals:', error)
    // Return empty array instead of throwing to prevent cascade failures
    return []
  }
}

/**
 * Get full hospital details including users and departments
 */
export async function getHospitalDetails(id: string) {
  try {
    const [hospital, users, departments] = await Promise.all([
      getHospitalById(id),
      supabase
        .from('users')
        .select(`
          *,
          role:roles(role_name, role_code)
        `)
        .eq('hospital_id', id),
      supabase.from('departments').select('*').eq('hospital_id', id)
    ])

    if (!hospital) throw new Error('Hospital not found')

    return {
      hospital,
      users: users.data || [],
      departments: departments.data || []
    }
  } catch (error) {
    console.error('Error fetching hospital details:', error)
    throw error
  }
}
