/**
 * User Account Fix Service
 * 
 * This service provides utilities to diagnose and fix issues where:
 * - User exists in users table but Auth account is missing
 * - Auth account exists but password is incorrect
 * - Account was created but Auth account creation failed
 */

import { supabase, isSupabaseConfigured } from './supabase'
import { checkAuthUserExists, fixMissingAuthAccount, updateAuthUserPassword } from './authUserService'
import { getAccessRequestById } from './accessRequestManagementService'
import { decryptPassword } from '@/lib/encryptionUtils'

export interface UserAccountDiagnostic {
  userId: string
  email: string
  employeeId: string
  authAccountExists: boolean
  authUserId?: string
  hasAccessRequest: boolean
  accessRequestId?: string
  hasEncryptedPassword: boolean
  canFix: boolean
  fixMethod?: 'create' | 'update' | 'reset'
  error?: string
}

/**
 * Diagnose user account issues
 */
export async function diagnoseUserAccount(
  userIdOrEmail: string
): Promise<{ success: boolean; diagnostic?: UserAccountDiagnostic; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' }
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`id.eq.${userIdOrEmail},email.eq.${userIdOrEmail},employee_id.eq.${userIdOrEmail}`)
      .maybeSingle()

    if (userError || !user) {
      return { success: false, error: 'User not found in database' }
    }

    // Check if Auth account exists
    const authCheck = await checkAuthUserExists(user.email)

    // Check for access request with encrypted password
    const { data: accessRequests } = await supabase
      .from('access_requests')
      .select('id, password_encrypted, status')
      .eq('email', user.email)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)

    const hasAccessRequest = accessRequests && accessRequests.length > 0
    const hasEncryptedPassword = hasAccessRequest && !!accessRequests[0]?.password_encrypted

    // Determine if we can fix it
    let canFix = false
    let fixMethod: 'create' | 'update' | 'reset' | undefined

    if (!authCheck.exists) {
      // Auth account doesn't exist
      if (hasEncryptedPassword) {
        canFix = true
        fixMethod = 'create'
      } else {
        canFix = false // Can't fix without password
      }
    } else {
      // Auth account exists but password might be wrong
      canFix = true
      fixMethod = hasEncryptedPassword ? 'update' : 'reset'
    }

    return {
      success: true,
      diagnostic: {
        userId: user.id,
        email: user.email,
        employeeId: user.employee_id,
        authAccountExists: authCheck.exists,
        authUserId: authCheck.userId,
        hasAccessRequest: !!hasAccessRequest,
        accessRequestId: hasAccessRequest ? accessRequests[0].id : undefined,
        hasEncryptedPassword,
        canFix,
        fixMethod,
      },
    }
  } catch (error) {
    console.error('Error diagnosing user account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fix user account by creating/updating Auth account
 */
export async function fixUserAccount(
  userId: string,
  newPassword?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' }
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    // Get diagnostic
    const diagnostic = await diagnoseUserAccount(userId)
    if (!diagnostic.success || !diagnostic.diagnostic) {
      return { success: false, error: diagnostic.error || 'Failed to diagnose account' }
    }

    const diag = diagnostic.diagnostic

    if (!diag.canFix) {
      return {
        success: false,
        error: 'Cannot fix this account automatically. The encrypted password is no longer available. ' +
               'Please reset the password manually using the password reset function.',
      }
    }

    let passwordToUse: string

    if (newPassword) {
      // Use provided password
      passwordToUse = newPassword
    } else if (diag.hasEncryptedPassword && diag.accessRequestId) {
      // Try to get password from access request
      const request = await getAccessRequestById(diag.accessRequestId)
      if (request && request.password_encrypted) {
        try {
          passwordToUse = await decryptPassword(request.password_encrypted)
        } catch (error) {
          return {
            success: false,
            error: 'Failed to decrypt password from access request. Please provide a new password.',
          }
        }
      } else {
        return {
          success: false,
          error: 'Encrypted password not found in access request. Please provide a new password.',
        }
      }
    } else {
      return {
        success: false,
        error: 'No password available. Please provide a new password.',
      }
    }

    // Fix the account
    if (diag.fixMethod === 'create') {
      // Create missing Auth account
      const result = await fixMissingAuthAccount(userId, user.email, passwordToUse)
      return result
    } else if (diag.fixMethod === 'update' || diag.fixMethod === 'reset') {
      // Update existing Auth account password
      const authUserId = diag.authUserId || userId
      const result = await updateAuthUserPassword(authUserId, passwordToUse)
      return result
    }

    return { success: false, error: 'Unknown fix method' }
  } catch (error) {
    console.error('Error fixing user account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

