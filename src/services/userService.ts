import { supabase, isSupabaseConfigured } from './supabase'
import { withService, paginateMockData } from './baseService'
import { mockUsers, getRoleById, getDepartmentById, getHospitalById } from './mockData'
import type { User, UserWithRelations, PaginatedResponse, FilterConfig, SortConfig } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import { createAuthUser } from './authUserService'
import { sendWelcomeEmail } from './emailService'

export interface GetUsersParams {
  page?: number
  pageSize?: number
  search?: string
  filters?: FilterConfig[]
  sort?: SortConfig
  hospitalId?: string
  departmentId?: string
  status?: string
}

/**
 * Get paginated list of users
 */
export async function getUsers(params: GetUsersParams = {}): Promise<PaginatedResponse<UserWithRelations>> {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search = '',
    filters = [],
    sort,
    hospitalId,
    departmentId,
    status,
  } = params

  return withService(
    async () => {
      // Supabase implementation
      let query = supabase
        .from('users')
        .select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*)
        `, { count: 'exact' })

      // Apply filters
      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId)
      }
      if (departmentId) {
        query = query.eq('department_id', departmentId)
      }
      if (status) {
        query = query.eq('status', status)
      }

      // Apply search
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,employee_id.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.key, { ascending: sort.direction === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: (data || []) as UserWithRelations[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
    async () => {
      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 500))

      let filteredUsers = [...mockUsers]

      // Apply filters
      if (hospitalId) {
        filteredUsers = filteredUsers.filter((u) => u.hospital_id === hospitalId)
      }
      if (departmentId) {
        filteredUsers = filteredUsers.filter((u) => u.department_id === departmentId)
      }
      if (status) {
        filteredUsers = filteredUsers.filter((u) => u.status === status)
      }

      const paginatedResponse = paginateMockData<User>(
        filteredUsers,
        params,
        ['full_name', 'employee_id', 'email']
      )

      // Add relations
      const usersWithRelations: UserWithRelations[] = paginatedResponse.data.map((user) => ({
        ...user,
        role: getRoleById(user.role_id),
        department: getDepartmentById(user.department_id),
        hospital: getHospitalById(user.hospital_id),
      }))

      return {
        ...paginatedResponse,
        data: usersWithRelations,
      }
    }
  )
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserWithRelations | null> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*),
          emergency_contacts:emergency_contacts(*)
        `)
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      return data as UserWithRelations
    } else {
      await new Promise((resolve) => setTimeout(resolve, 300))
      const user = mockUsers.find((u) => u.id === userId)
      if (!user) return null

      return {
        ...user,
        role: getRoleById(user.role_id),
        department: getDepartmentById(user.department_id),
        hospital: getHospitalById(user.hospital_id),
      }
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

/**
 * Generate a temporary password for new users
 */
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + special

  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Create new user
 */
export async function createUser(userData: Partial<User>): Promise<UserWithRelations> {
  try {
    if (isSupabaseConfigured()) {
      // Create user in database first
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*)
        `)
        .maybeSingle()

      if (error) throw error

      // Create Supabase Auth user if email is provided
      if (data.email) {
        const tempPassword = generateTemporaryPassword()
        const { success: authSuccess, error: authError, authUserId } = await createAuthUser(
          data.email,
          tempPassword,
          data.id // Use the same UUID as the users table
        )

        if (!authSuccess) {
          console.error('Failed to create Auth user:', authError)
          // Rollback: delete the user record if Auth user creation failed
          await supabase.from('users').delete().eq('id', data.id)
          throw new Error(`Failed to create authentication account: ${authError || 'Unknown error'}`)
        }

        // Update user record with auth user ID if different (shouldn't be, but just in case)
        if (authUserId && authUserId !== data.id) {
          const { data: updatedData, error: updateError } = await supabase
            .from('users')
            .update({ id: authUserId })
            .eq('id', data.id)
            .select(`
              *,
              role:roles!role_id(*),
              department:departments!department_id(*),
              hospital:hospitals!hospital_id(*)
            `)
            .maybeSingle()

          if (updateError) {
            console.error('Failed to update user ID:', updateError)
          } else if (updatedData) {
            // Send welcome email with password setup link
            const emailResult = await sendWelcomeEmail(
              data.email,
              data.employee_id,
              data.full_name
            )

            if (!emailResult.success) {
              console.error('Failed to send welcome email:', emailResult.error)
              // Continue - user account is created successfully
            }

            return updatedData as UserWithRelations
          }
        } else {
          // Send welcome email with password setup link
          const emailResult = await sendWelcomeEmail(
            data.email,
            data.employee_id,
            data.full_name
          )

          if (!emailResult.success) {
            console.error('Failed to send welcome email:', emailResult.error)
            // Continue - user account is created successfully
          }
        }
      }

      return data as UserWithRelations
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const newUser: User = {
        id: `user-${Date.now()}`,
        ...userData,
        failed_login_attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User

      mockUsers.push(newUser)

      return {
        ...newUser,
        role: getRoleById(newUser.role_id),
        department: getDepartmentById(newUser.department_id),
        hospital: getHospitalById(newUser.hospital_id),
      }
    }
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

/**
 * Update user
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<UserWithRelations> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*)
        `)
        .maybeSingle()

      if (error) throw error
      return data as UserWithRelations
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const userIndex = mockUsers.findIndex((u) => u.id === userId)
      if (userIndex === -1) throw new Error('User not found')

      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...updates,
        updated_at: new Date().toISOString(),
      }

      const updatedUser = mockUsers[userIndex]
      return {
        ...updatedUser,
        role: getRoleById(updatedUser.role_id),
        department: getDepartmentById(updatedUser.department_id),
        hospital: getHospitalById(updatedUser.hospital_id),
      }
    }
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('users').delete().eq('id', userId)
      if (error) throw error
    } else {
      await new Promise((resolve) => setTimeout(resolve, 300))
      const userIndex = mockUsers.findIndex((u) => u.id === userId)
      if (userIndex !== -1) {
        mockUsers.splice(userIndex, 1)
      }
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

/**
 * Bulk update user status
 */
export async function bulkUpdateUserStatus(userIds: string[], status: string): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('users')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', userIds)

      if (error) throw error
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500))
      userIds.forEach((userId) => {
        const user = mockUsers.find((u) => u.id === userId)
        if (user) {
          user.status = status as User['status']
          user.updated_at = new Date().toISOString()
        }
      })
    }
  } catch (error) {
    console.error('Error bulk updating users:', error)
    throw error
  }
}

/**
 * Bulk delete users
 */
export async function bulkDeleteUsers(userIds: string[]): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('users').delete().in('id', userIds)
      if (error) throw error
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500))
      userIds.forEach((userId) => {
        const index = mockUsers.findIndex((u) => u.id === userId)
        if (index !== -1) {
          mockUsers.splice(index, 1)
        }
      })
    }
  } catch (error) {
    console.error('Error bulk deleting users:', error)
    throw error
  }
}


