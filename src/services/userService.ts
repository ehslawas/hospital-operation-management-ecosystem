import { supabase } from './supabase'
import { withService } from './baseService'
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
  roleId?: string
  status?: string
  excludeSystemAdmins?: boolean
}

/**
 * Get paginated list of users
 */
export async function getUsers(params: GetUsersParams = {}): Promise<PaginatedResponse<UserWithRelations>> {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search = '',
    sort,
    hospitalId,
    departmentId,
    roleId,
    status,
    excludeSystemAdmins,
  } = params

  return withService(
    async () => {
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
      if (roleId) {
        query = query.eq('role_id', roleId)
      }
      if (status) {
        query = query.eq('status', status)
      }

      // Handle system admin exclusion with timeout protection
      if (excludeSystemAdmins) {
        // Query the role ID for system_admin with timeout
        try {
          const roleQuery = supabase
            .from('roles')
            .select('id')
            .eq('role_code', 'system_admin')
            .single()

          const { data: adminRole } = await Promise.race([
            roleQuery,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Admin role query timed out')), 10000)
            )
          ]) as any

          if (adminRole) {
            query = query.neq('role_id', adminRole.id)
          }
        } catch (roleErr) {
          console.warn('[UserService] Failed to get system_admin role ID, skipping exclusion:', roleErr)
          // Continue without exclusion rather than blocking the entire request
        }
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

      const { data, error, count } = await Promise.race([
        query,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timed out')), 30000))
      ]) as any

      if (error) throw error

      return {
        data: (data || []) as UserWithRelations[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    }
  ).catch(err => {
    console.warn('[UserService] getUsers failed or timed out:', err)
    // Circuit Breaker: Return empty list to keep UI responsive
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    }
  })
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserWithRelations | null> {
  try {
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
      .single()

    if (error) throw error
    return data as UserWithRelations
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
      .single()

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
          .single()

        if (updateError) {
          console.error('Failed to update user ID:', updateError)
        } else if (updatedData) {
          // Send welcome email
          await sendWelcomeEmail(data.email, data.employee_id, data.full_name, tempPassword)
          return updatedData as UserWithRelations
        }
      } else {
        // Send welcome email
        await sendWelcomeEmail(data.email, data.employee_id, data.full_name, tempPassword)
      }
    }

    return data as UserWithRelations
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
      .single()

    if (error) throw error
    return data as UserWithRelations
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
    const { error } = await supabase.from('users').delete().eq('id', userId)
    if (error) throw error
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
    const { error } = await supabase
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', userIds)

    if (error) throw error
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
    const { error } = await supabase.from('users').delete().in('id', userIds)
    if (error) throw error
  } catch (error) {
    console.error('Error bulk deleting users:', error)
    throw error
  }
}


