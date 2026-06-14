import { supabase, isSupabaseConfigured } from './supabase'
import { createAuthUser } from './authUserService'
import type { User, ApiResponse } from '@/types'

export interface CreateHospitalAdminParams {
  hospital_id: string
  email: string
  employee_id: string
  full_name: string
  ic_number: string
  phone_number: string
  password: string
  jawatan: string
}

export interface CreateHospitalAdminResult {
  success: boolean
  user?: User
  error?: string
}

/**
 * Create a Hospital Admin account
 * Enforces: 1 admin per hospital only
 */
export async function createHospitalAdmin(
  params: CreateHospitalAdminParams
): Promise<CreateHospitalAdminResult> {
  try {
    if (isSupabaseConfigured()) {
      // Get hospital admin role ID first (before any queries)
      const hospitalAdminRoleId = await getSystemRoleId('hospital_admin')
      if (!hospitalAdminRoleId) {
        return {
          success: false,
          error: 'Hospital Admin role not found in system. Please ensure the role exists in the database.',
        }
      }

      // Check if hospital already has an admin
      const { data: existingAdmin, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('hospital_id', params.hospital_id)
        .eq('role_id', hospitalAdminRoleId)
        .eq('status', 'active')
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing admin:', checkError)
        throw checkError
      }

      if (existingAdmin) {
        return {
          success: false,
          error: 'This hospital already has an active admin. Please disable the existing admin first.',
        }
      }

      // Check if email or employee_id already exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, email, employee_id')
        .or(`email.eq.${params.email},employee_id.eq.${params.employee_id}`)
        .maybeSingle()

      if (userCheckError) {
        console.error('Error checking existing user:', userCheckError)
        throw userCheckError
      }

      if (existingUser) {
        const field = existingUser.email === params.email ? 'email' : 'employee ID'
        return {
          success: false,
          error: `A user with this ${field} already exists.`,
        }
      }

      // Generate a new UUID FIRST to ensure it doesn't conflict with existing users
      // This prevents the issue where Supabase generates a UUID that already exists
      let newUserId: string
      let attempts = 0
      const maxAttempts = 5
      
      do {
        newUserId = crypto.randomUUID()
        
        // Check if this UUID already exists in users table
        const { data: uuidCheck, error: uuidCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('id', newUserId)
          .maybeSingle()
        
        if (uuidCheckError) {
          console.error('Error checking UUID availability:', uuidCheckError)
          throw uuidCheckError
        }
        
        // If UUID doesn't exist, we can use it
        if (!uuidCheck) {
          break
        }
        
        attempts++
        if (attempts >= maxAttempts) {
          return {
            success: false,
            error: 'Failed to generate unique user ID. Please try again.',
          }
        }
      } while (attempts < maxAttempts)

      // Create user in Supabase Auth using the pre-generated UUID
      // This ensures the UUID matches between auth.users and users table
      const authResult = await createAuthUser(
        params.email,
        params.password,
        newUserId // Use the pre-generated UUID
      )

      if (!authResult.success || !authResult.authUserId) {
        console.error('Error creating auth user for hospital admin:', authResult.error)
        return {
          success: false,
          error: authResult.error || 'Failed to create authentication account. Please check Supabase configuration.',
        }
      }

      // Use the actual Auth user ID (may differ from requested if Supabase generated its own)
      const actualAuthUserId = authResult.authUserId
      
      // If IDs don't match, log a warning but continue with the Auth user's ID
      if (actualAuthUserId !== newUserId) {
        console.warn(`Auth user ID mismatch: expected ${newUserId}, got ${actualAuthUserId}. Using Auth user ID.`)
        if (authResult.warning) {
          console.warn(authResult.warning)
        }
      }

      // Create new user record in users table using the actual Auth user ID
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: actualAuthUserId,
          email: params.email,
          employee_id: params.employee_id,
          full_name: params.full_name,
          ic_number: params.ic_number,
          phone_number: params.phone_number,
          role_id: hospitalAdminRoleId,
          hospital_id: params.hospital_id,
          department_id: null, // Hospital admin may not belong to a department
          jawatan: params.jawatan,
          status: 'active',
          failed_login_attempts: 0,
        })
        .select()
        .maybeSingle()

      if (userError) {
        // If the profile insert fails, try to clean up the auth user
        console.error('Error inserting hospital admin user record:', userError)
        
        // Attempt to delete the auth user (best effort, may fail if service role key not available)
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
          if (serviceRoleKey && serviceRoleKey !== 'placeholder-service-key') {
            await fetch(`${supabaseUrl}/auth/v1/admin/users/${newUserId}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
                apikey: serviceRoleKey,
              },
            })
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user after profile insert failure:', cleanupError)
        }
        
        throw userError
      }

      const userData = newUser

      // Update hospital to link admin
      const { error: hospitalUpdateError } = await supabase
        .from('hospitals')
        .update({ admin_id: userData.id })
        .eq('id', params.hospital_id)

      if (hospitalUpdateError) {
        // Best-effort rollback of users row; auth user will remain
        await supabase.from('users').delete().eq('id', userData.id)
        console.error('Error linking hospital admin to hospital:', hospitalUpdateError)
        throw hospitalUpdateError
      }

      // Log audit event (non-blocking - don't fail if audit log fails)
      logAuditEvent({
        user_id: userData.id,
        action: 'create',
        module: 'system_admin',
        entity_type: 'user',
        entity_id: userData.id,
        new_values: {
          role: 'hospital_admin',
          hospital_id: params.hospital_id,
        },
      }).catch((err) => {
        // Log error but don't throw - audit logging failure shouldn't break user creation
        console.warn('Failed to log audit event:', err)
      })

      return {
        success: true,
        user: userData as User,
      }
    } else {
      // Supabase is required for Hospital Admin creation
      return {
        success: false,
        error: 'Supabase is not configured. Hospital Admin creation requires database connection.',
      }
    }
  } catch (error) {
    console.error('Error creating hospital admin:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create hospital admin',
    }
  }
}

/**
 * Reset Hospital Admin password
 */
export async function resetHospitalAdminPassword(
  userId: string,
  newPassword: string
): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured()) {
      // Get user email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle()

      if (userError || !user) {
        return {
          data: null,
          error: 'User not found',
        }
      }

      // Update password via Supabase Auth Admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      })

      if (updateError) throw updateError

      // Log audit event
      await logAuditEvent({
        user_id: userId,
        action: 'password_reset',
        module: 'system_admin',
        entity_type: 'user',
        entity_id: userId,
      })

      return {
        data: true,
        error: null,
      }
    } else {
      // Supabase is required
      return {
        data: null,
        error: 'Supabase is not configured. Password reset requires database connection.',
      }
    }
  } catch (error) {
    console.error('Error resetting password:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to reset password',
    }
  }
}

/**
 * Disable Hospital Admin account
 */
export async function disableHospitalAdmin(userId: string): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', userId)

      if (error) throw error

      // Remove admin link from hospital
      await supabase
        .from('hospitals')
        .update({ admin_id: null })
        .eq('admin_id', userId)

      // Log audit event
      await logAuditEvent({
        user_id: userId,
        action: 'disable',
        module: 'system_admin',
        entity_type: 'user',
        entity_id: userId,
        new_values: { status: 'inactive' },
      })

      return {
        data: true,
        error: null,
      }
    } else {
      // Supabase is required
      return {
        data: null,
        error: 'Supabase is not configured. Disabling admin requires database connection.',
      }
    }
  } catch (error) {
    console.error('Error disabling hospital admin:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to disable hospital admin',
    }
  }
}

/**
 * Helper: Get system role ID by code
 */
async function getSystemRoleId(roleCode: string): Promise<string | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id')
        .eq('role_code', roleCode)
        .maybeSingle()

      if (error) {
        console.error(`Error fetching role ${roleCode}:`, error)
        // If it's a 406, it might be an RLS issue - log it
        if (error.code === 'PGRST301' || error.message?.includes('406')) {
          console.error('Possible RLS issue: Role table may not have proper policies for system_admin role')
        }
        return null
      }

      if (!data || !data.id) {
        console.warn(`Role ${roleCode} not found in database`)
        return null
      }

      return data.id
    } catch (err) {
      console.error(`Unexpected error fetching role ${roleCode}:`, err)
      return null
    }
  } else {
    // Supabase is required
    return null
  }
}

/**
 * Helper: Log audit event
 * Non-blocking - failures are logged but don't throw errors
 */
async function logAuditEvent(event: {
  user_id: string
  action: string
  module: string
  entity_type?: string
  entity_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    return // Silently fail if Supabase not configured
  }

  try {
    const { error } = await supabase.from('audit_logs').insert({
      ...event,
      ip_address: null, // Will be set by trigger or application
      user_agent: null,
    })

    if (error) {
      // Log error but don't throw - audit logging is non-critical
      console.warn('Audit log insert failed:', error)
    }
  } catch (err) {
    // Catch any unexpected errors
    console.warn('Unexpected error in audit logging:', err)
  }
}

