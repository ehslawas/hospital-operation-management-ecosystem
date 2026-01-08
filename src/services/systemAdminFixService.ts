/**
 * System Admin Account Fix Service
 * 
 * CRITICAL: System Admin is the only account that can manage the entire system.
 * This service provides utilities to diagnose and fix System Admin account issues.
 * 
 * IMPORTANT: Only use this if System Admin cannot log in!
 */

import { supabase, isSupabaseConfigured } from './supabase'
import { checkAuthUserExists, fixMissingAuthAccount, updateAuthUserPassword, createAuthUser } from './authUserService'
import { SYSTEM_ROLES } from '@/lib/constants'

export interface SystemAdminDiagnostic {
  userId: string
  email: string
  employeeId: string
  authAccountExists: boolean
  authUserId?: string
  canFix: boolean
  fixMethod?: 'create' | 'update' | 'reset'
  error?: string
}

/**
 * Get System Admin account information
 */
export async function getSystemAdmin(): Promise<{
  success: boolean
  user?: any
  error?: string
}> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' }
    }

    // Get system_admin role ID
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('role_code', SYSTEM_ROLES.SYSTEM_ADMIN)
      .maybeSingle()

    if (roleError || !role) {
      return { success: false, error: 'System Admin role not found' }
    }

    // Get System Admin user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('role_id', role.id)
      .eq('status', 'active')
      .maybeSingle()

    if (userError) {
      return { success: false, error: `Error fetching System Admin: ${userError.message}` }
    }

    if (!user) {
      return { success: false, error: 'No active System Admin found in database' }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Error getting System Admin:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Diagnose System Admin account issues
 */
export async function diagnoseSystemAdmin(): Promise<{
  success: boolean
  diagnostic?: SystemAdminDiagnostic
  error?: string
}> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' }
    }

    // Get System Admin
    const adminResult = await getSystemAdmin()
    if (!adminResult.success || !adminResult.user) {
      return { success: false, error: adminResult.error || 'System Admin not found' }
    }

    const user = adminResult.user

    // Check if Auth account exists
    const authCheck = await checkAuthUserExists(user.email)

    // Determine if we can fix it
    let canFix = false
    let fixMethod: 'create' | 'update' | 'reset' | undefined

    // CRITICAL: If an Auth account exists but its ID doesn't match the System Admin `users.id`,
    // the account is mis-linked. For System Admin we should NOT "reuse" the mismatched Auth user
    // because System Admin is referenced widely across the schema. Fix requires recreating Auth user
    // with the correct UID or performing a controlled migration.
    if (authCheck.exists && authCheck.userId && authCheck.userId !== user.id) {
      return {
        success: true,
        diagnostic: {
          userId: user.id,
          email: user.email,
          employeeId: user.employee_id,
          authAccountExists: true,
          authUserId: authCheck.userId,
          canFix: false,
          error:
            'System Admin auth account exists but is linked to a different Auth UID than the System Admin profile. ' +
            'This must be repaired by recreating the Auth user with the correct UID (matching public.users.id).',
        },
      }
    }

    if (!authCheck.exists) {
      // Auth account doesn't exist - can create if we have a password
      canFix = true
      fixMethod = 'create'
    } else {
      // Auth account exists but password might be wrong
      canFix = true
      fixMethod = 'update' // Will need new password
    }

    return {
      success: true,
      diagnostic: {
        userId: user.id,
        email: user.email,
        employeeId: user.employee_id,
        authAccountExists: authCheck.exists,
        authUserId: authCheck.userId,
        canFix,
        fixMethod,
      },
    }
  } catch (error) {
    console.error('Error diagnosing System Admin:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fix System Admin account
 * CRITICAL: This should only be used when System Admin cannot log in!
 */
export async function fixSystemAdminAccount(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' }
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long' }
    }

    // Get System Admin
    const adminResult = await getSystemAdmin()
    if (!adminResult.success || !adminResult.user) {
      return { success: false, error: adminResult.error || 'System Admin not found' }
    }

    const user = adminResult.user

    // Get diagnostic
    const diagnostic = await diagnoseSystemAdmin()
    if (!diagnostic.success || !diagnostic.diagnostic) {
      return { success: false, error: diagnostic.error || 'Failed to diagnose account' }
    }

    const diag = diagnostic.diagnostic

    if (!diag.canFix) {
      return {
        success: false,
        error:
          diag.error ||
          'System Admin account cannot be auto-fixed due to an Auth UID mismatch. Please repair the Auth user linkage.',
      }
    }

    // Fix the account
    if (diag.fixMethod === 'create') {
      // Create missing Auth account
      console.log('Creating missing Auth account for System Admin...')
      const result = await createAuthUser(user.email, newPassword, user.id)
      if (!result.success) {
        return {
          success: false,
          error: `Failed to create Auth account: ${result.error || 'Unknown error'}`,
        }
      }
      console.log('System Admin Auth account created successfully')
      return { success: true }
    } else if (diag.fixMethod === 'update' || diag.fixMethod === 'reset') {
      // Update existing Auth account password
      const authUserId = diag.authUserId || user.id
      console.log('Updating System Admin Auth account password...')
      const result = await updateAuthUserPassword(authUserId, newPassword)
      if (!result.success) {
        return {
          success: false,
          error: `Failed to update password: ${result.error || 'Unknown error'}`,
        }
      }
      console.log('System Admin password updated successfully')
      return { success: true }
    }

    return { success: false, error: 'Unknown fix method' }
  } catch (error) {
    console.error('Error fixing System Admin account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Verify System Admin can log in
 */
export async function verifySystemAdminLogin(
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminResult = await getSystemAdmin()
    if (!adminResult.success || !adminResult.user) {
      return { success: false, error: 'System Admin not found' }
    }

    const user = adminResult.user

    // Try to authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    })

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || 'Authentication failed',
      }
    }

    // Sign out immediately (we just wanted to verify)
    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    console.error('Error verifying System Admin login:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

