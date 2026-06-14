import { supabase, isSupabaseConfigured } from './supabase'
import { mockDepartments, mockHospitals, mockUsers } from './mockData'
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
    if (isSupabaseConfigured()) {
      // Supabase implementation
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

      const { data, error, count } = await query

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

          // Fetch head_of_department separately if needed
          const departmentsWithRelations: DepartmentWithRelations[] = []
          if (simpleData && simpleData.length > 0) {
            // Collect all unique head_of_department_ids
            const headIds = simpleData
              .map((d) => d.head_of_department_id)
              .filter((id): id is string => !!id)
            
            // Fetch all users at once
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

            // Map departments with their head_of_department
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
    } else {
      // Mock data implementation
      await new Promise((resolve) => setTimeout(resolve, 500))

      let filteredDepartments = mockDepartments.filter((department) => {
        const matchesSearch = search
          ? department.department_name.toLowerCase().includes(search.toLowerCase()) ||
            department.department_code.toLowerCase().includes(search.toLowerCase()) ||
            (department.description &&
              department.description.toLowerCase().includes(search.toLowerCase()))
          : true
        const matchesStatus = status ? department.status === status : true
        const matchesHospital = hospitalId ? department.hospital_id === hospitalId : true
        return matchesSearch && matchesStatus && matchesHospital
      })

      if (sort) {
        filteredDepartments.sort((a, b) => {
          const aValue = a[sort.key as keyof Department]
          const bValue = b[sort.key as keyof Department]

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sort.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
          }
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sort.direction === 'asc' ? aValue - bValue : bValue - aValue
          }
          return 0
        })
      } else {
        filteredDepartments.sort((a, b) => a.department_name.localeCompare(b.department_name))
      }

      const total = filteredDepartments.length
      const totalPages = Math.ceil(total / pageSize)
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex)

      // Add relations
      const departmentsWithRelations: DepartmentWithRelations[] = paginatedDepartments.map((dept) => ({
        ...dept,
        hospital: mockHospitals.find((h) => h.id === dept.hospital_id),
        head_of_department: dept.head_of_department_id
          ? mockUsers.find((u) => u.id === dept.head_of_department_id)
          : undefined,
      }))

      return {
        data: departmentsWithRelations,
        total,
        page,
        pageSize,
        totalPages,
      }
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
    if (isSupabaseConfigured()) {
      // Try with explicit foreign key first
      let query = supabase
        .from('departments')
        .select('*, hospital:hospitals(*), head_of_department:users!departments_head_of_department_id_fkey(*)')
        .eq('id', id)
        .single()

      let { data, error } = await query

      // If foreign key relationship fails, try without explicit relationship
      if (error && (error.code === 'PGRST200' || error.message?.includes('Could not find a relationship'))) {
        console.warn('Foreign key relationship not found, trying alternative query')
        
        // Fetch department and hospital
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('*, hospital:hospitals(*)')
          .eq('id', id)
          .single()

        if (deptError) {
          console.error('Error fetching department from Supabase:', deptError)
          throw new Error(deptError.message)
        }

        // If head_of_department_id exists, fetch user separately
        if (deptData?.head_of_department_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', deptData.head_of_department_id)
            .single()

          return {
            ...deptData,
            head_of_department: userData || undefined,
          } as DepartmentWithRelations
        }

        return deptData as DepartmentWithRelations
      }

      if (error) {
        console.error('Error fetching department from Supabase:', error)
        throw new Error(error.message)
      }
      return data as DepartmentWithRelations
    } else {
      await new Promise((resolve) => setTimeout(resolve, 300))
      const department = mockDepartments.find((d) => d.id === id)
      if (!department) return null

      return {
        ...department,
        hospital: mockHospitals.find((h) => h.id === department.hospital_id),
        head_of_department: department.head_of_department_id
          ? mockUsers.find((u) => u.id === department.head_of_department_id)
          : undefined,
      }
    }
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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('departments').insert(department).select().single()
      if (error) throw new Error(error.message)
      return data as Department
    } else {
      await new Promise((resolve) => setTimeout(resolve, 300))
      const newDepartment: Department = {
        ...department,
        id: `dept-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockDepartments.push(newDepartment)
      return newDepartment
    }
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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('departments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Department
    } else {
      await new Promise((resolve) => setTimeout(resolve, 300))
      const index = mockDepartments.findIndex((d) => d.id === id)
      if (index !== -1) {
        mockDepartments[index] = {
          ...mockDepartments[index],
          ...updates,
          updated_at: new Date().toISOString(),
        }
        return mockDepartments[index]
      }
      throw new Error('Department not found')
    }
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
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('departments').delete().eq('id', id)
      if (error) throw new Error(error.message)
    } else {
      await new Promise((resolve) => setTimeout(resolve, 300))
      const index = mockDepartments.findIndex((d) => d.id === id)
      if (index !== -1) {
        mockDepartments.splice(index, 1)
      }
    }
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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('status', 'active')
        .order('department_name', { ascending: true })

      if (error) {
        console.error('Error fetching departments from Supabase:', error)
        throw new Error(error.message)
      }
      return (data || []) as Department[]
    } else {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return mockDepartments
        .filter((d) => d.hospital_id === hospitalId && d.status === 'active')
        .sort((a, b) => a.department_name.localeCompare(b.department_name))
    }
  } catch (error) {
    console.error('Error fetching departments:', error)
    throw error
  }
}

