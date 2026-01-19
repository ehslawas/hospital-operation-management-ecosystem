import { supabase } from './supabase'
import type { Department, DepartmentWithRelations, PaginatedResponse, SortConfig } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

interface GetDepartmentsParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  hospitalId?: string
  sort?: SortConfig
}

/**
 * Get paginated list of departments
 */
export async function getDepartments({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
  status,
  hospitalId,
  sort,
}: GetDepartmentsParams): Promise<PaginatedResponse<DepartmentWithRelations>> {
  try {
    // Use explicit foreign key name to avoid ambiguity
    let query = supabase
      .from('departments')
      .select('*, hospital:hospitals(*), head_of_department:users!departments_head_of_department_id_fkey(*)', {
        count: 'exact',
      })

    if (search) {
      query = query.or(
        `department_name.ilike.%${search}%,department_code.ilike.%${search}%,description.ilike.%${search}%`
      )
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }

    if (sort) {
      query = query.order(sort.key, { ascending: sort.direction === 'asc' })
    } else {
      query = query.order('department_name', { ascending: true })
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await Promise.race([
      query,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timed out')), 30000))
    ]) as any

    if (error) {
      // If foreign key relationship fails or is ambiguous, try without the explicit relationship
      if (
        error.code === 'PGRST200' ||
        error.code === 'PGRST201' ||
        error.message?.includes('Could not find a relationship') ||
        error.message?.includes('more than one relationship')
      ) {
        console.warn('Foreign key relationship issue, trying fallback query:', error.message)
        const simpleQuery = supabase
          .from('departments')
          .select('*, hospital:hospitals(*)', { count: 'exact' })

        if (search) {
          simpleQuery.or(
            `department_name.ilike.%${search}%,department_code.ilike.%${search}%,description.ilike.%${search}%`
          )
        }
        if (status) {
          simpleQuery.eq('status', status)
        }
        if (hospitalId) {
          simpleQuery.eq('hospital_id', hospitalId)
        }
        if (sort) {
          simpleQuery.order(sort.key, { ascending: sort.direction === 'asc' })
        } else {
          simpleQuery.order('department_name', { ascending: true })
        }

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        simpleQuery.range(from, to)

        const { data: simpleData, error: simpleError, count: simpleCount } = await simpleQuery

        if (simpleError) {
          console.error('Error fetching departments from Supabase:', simpleError)
          throw new Error(simpleError.message)
        }

        const departmentsWithRelations: DepartmentWithRelations[] = []
        if (simpleData && simpleData.length > 0) {
          const headIds = simpleData
            .map((d) => d.head_of_department_id)
            .filter((id): id is string => !!id)

          let usersMap = new Map()
          if (headIds.length > 0) {
            const { data: usersData } = await supabase
              .from('users')
              .select('*')
              .in('id', headIds)

            if (usersData) {
              usersMap = new Map(usersData.map((u) => [u.id, u]))
            }
          }

          for (const dept of simpleData) {
            departmentsWithRelations.push({
              ...dept,
              head_of_department: dept.head_of_department_id
                ? usersMap.get(dept.head_of_department_id)
                : undefined,
            } as DepartmentWithRelations)
          }
        }

        return {
          data: departmentsWithRelations,
          total: simpleCount || 0,
          page,
          pageSize,
          totalPages: Math.ceil((simpleCount || 0) / pageSize),
        }
      }
      console.error('Error fetching departments from Supabase:', error)
      throw new Error(error.message)
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 0

    return {
      data: (data || []) as DepartmentWithRelations[],
      total: count || 0,
      page,
      pageSize,
      totalPages,
    }
  } catch (error) {
    console.error('Error fetching departments:', error)
    throw error
  }
}

/**
 * Get department by ID
 */
export async function getDepartmentById(id: string): Promise<DepartmentWithRelations | null> {
  try {
    // Try with explicit foreign key first
    let query = supabase
      .from('departments')
      .select('*, hospital:hospitals(*), head_of_department:users!departments_head_of_department_id_fkey(*), staff:users!users_department_id_fkey(*, role:roles(*))')
      .eq('id', id)
      .single()

    let { data, error } = await query

    // If foreign key relationship fails, try without explicit relationship
    if (error && (error.code === 'PGRST200' || error.message?.includes('Could not find a relationship'))) {
      console.warn('Foreign key relationship not found, trying alternative query')

      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*, hospital:hospitals(*)')
        .eq('id', id)
        .single()

      if (deptError) {
        console.error('Error fetching department from Supabase:', deptError)
        throw new Error(deptError.message)
      }

      const result = {
        ...deptData,
        staff_count: 0 // Default since we couldn't fetch it
      } as DepartmentWithRelations

      if (deptData?.head_of_department_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', deptData.head_of_department_id)
          .single()

        result.head_of_department = userData || undefined
      }

      return result
    }

    if (error) {
      console.error('Error fetching department from Supabase:', error)
      throw new Error(error.message)
    }

    // Map staff and count
    const result: DepartmentWithRelations = {
      ...data,
      staff: (data as any).staff || [],
      staff_count: (data as any).staff?.length || 0
    }
    return result
  } catch (error) {
    console.error('Error fetching department:', error)
    throw error
  }
}

/**
 * Create new department
 */
export async function createDepartment(
  department: Omit<Department, 'id' | 'created_at' | 'updated_at'>
): Promise<Department> {
  try {
    const { data, error } = await supabase.from('departments').insert(department).select().single()
    if (error) throw new Error(error.message)
    return data as Department
  } catch (error) {
    console.error('Error creating department:', error)
    throw error
  }
}

/**
 * Update department
 */
export async function updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
  try {
    const { data, error } = await supabase
      .from('departments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Department
  } catch (error) {
    console.error('Error updating department:', error)
    throw error
  }
}

/**
 * Delete department
 */
export async function deleteDepartment(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (error) throw new Error(error.message)
  } catch (error) {
    console.error('Error deleting department:', error)
    throw error
  }
}

/**
 * Get departments by hospital ID (for dropdowns)
 */
export async function getDepartmentsByHospital(hospitalId: string): Promise<Department[]> {
  try {
    const TIMEOUT_MS = 30000
    const query = supabase
      .from('departments')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('status', 'active')
      .order('department_name', { ascending: true })
      .limit(200)

    const { data, error } = await Promise.race([
      query,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Departments query timed out')), TIMEOUT_MS)
      )
    ]) as any

    if (error) {
      console.error('Error fetching departments by hospital:', error)
      throw error
    }
    return (data || []) as Department[]
  } catch (error) {
    console.error('Error in getDepartmentsByHospital:', error)
    // Return empty array instead of throwing to prevent cascade failures
    return []
  }
}

/**
 * Get all departments (unpaginated)
 */
export async function getAllDepartments(hospitalId?: string): Promise<DepartmentWithRelations[]> {
  try {
    let query = supabase
      .from('departments')
      .select('*, hospital:hospitals(*), head_of_department:users!departments_head_of_department_id_fkey(*), users:users!users_department_id_fkey(count)')
      .order('department_name', { ascending: true })
      .limit(1000)

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Error fetching departments with relations, trying fallback:', error.message)
      // Fallback if relation fails
      let fallbackQuery = supabase
        .from('departments')
        .select('*, hospital:hospitals(*)')
        .order('department_name', { ascending: true })
        .limit(1000)

      if (hospitalId) {
        fallbackQuery = fallbackQuery.eq('hospital_id', hospitalId)
      }

      const { data: simpleData, error: simpleError } = await fallbackQuery

      if (simpleError) throw new Error(simpleError.message)
      return (simpleData || []) as DepartmentWithRelations[]
    }

    // Map the count from the relation to staff_count
    return (data || []).map((dept: any) => ({
      ...dept,
      staff_count: dept.users?.[0]?.count || 0
    })) as DepartmentWithRelations[]
  } catch (error) {
    console.error('Error fetching all departments:', error)
    throw error
  }
}
