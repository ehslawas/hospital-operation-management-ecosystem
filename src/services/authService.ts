import { supabase } from './supabase'
import type { UserWithRelations, User } from '@/types'
import { MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MINUTES } from '@/lib/constants'

export interface LoginResult {
  success: boolean
  user?: UserWithRelations
  error?: string
  attemptsRemaining?: number
  isLocked?: boolean
  requiresPasswordReset?: boolean
  requiresEmailConfirmation?: boolean
}

export interface ResetPasswordResult {
  success: boolean
  error?: string
}

/**
 * Authenticate user with employee ID and password
 */
export async function login(employeeId: string, password: string): Promise<LoginResult> {
  try {
    // First, find user by employee ID using secure RPC (bypasses RLS)
    const { data, error: userError } = await supabase
      .rpc('get_user_by_employee_id', { p_employee_id: employeeId })
      .returns<User>()
      .single()

    const userData = data as User | null

    if (userError || !userData) {
      console.warn('Login lookup failed:', userError)
      return {
        success: false,
        error: 'Invalid employee ID or password',
      }
    }

    // Check account status
    if (userData.status === 'pending') {
      return {
        success: false,
        error: 'Your account is pending approval. Please wait for admin approval.',
      }
    }

    if (userData.status === 'suspended') {
      return {
        success: false,
        error: 'Your account has been suspended. Please contact administrator.',
      }
    }

    if (userData.status === 'inactive') {
      return {
        success: false,
        error: 'Your account is inactive. Please contact administrator.',
      }
    }

    // Check if account is locked
    if (userData.account_locked_until) {
      const lockExpiry = new Date(userData.account_locked_until).getTime()
      if (Date.now() < lockExpiry) {
        const remainingMinutes = Math.ceil((lockExpiry - Date.now()) / 60000)
        return {
          success: false,
          error: `Account is locked. Please try again in ${remainingMinutes} minutes.`,
          isLocked: true,
          requiresPasswordReset: true,
        }
      }
    }

    // Validate email exists
    if (!userData.email) {
      console.error('User found but email is missing:', userData)
      return {
        success: false,
        error: 'Account configuration error. Please contact administrator.',
      }
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password,
    })

    if (authError || !authData.user) {
      // Log the actual error for debugging
      console.error('Supabase Auth error:', authError)

      // Check for specific error types
      if (authError?.message?.includes('Email not confirmed') ||
        authError?.message?.includes('email_not_confirmed')) {
        return {
          success: false,
          error: 'Please check your email and confirm your account before logging in.',
          requiresEmailConfirmation: true,
        }
      }

      if (authError?.message?.includes('Invalid login credentials') ||
        authError?.message?.includes('Invalid login') ||
        (authError?.status === 400 && !authError?.message?.includes('Email not confirmed'))) {

        // Diagnostic check: verify if auth account exists
        const { checkAuthUserExists } = await import('./authUserService')
        const authCheck = await checkAuthUserExists(userData.email)
        if (!authCheck.exists) {
          console.error('DIAGNOSTIC: Auth account does not exist for this user!')
        }

        return {
          success: false,
          error: 'Invalid employee ID or password.',
        }
      }

      // Record failed attempt
      const newAttempts = (userData.failed_login_attempts || 0) + 1
      const attemptsRemaining = MAX_LOGIN_ATTEMPTS - newAttempts

      // Update failed attempts in database
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        await supabase
          .from('users')
          .update({
            failed_login_attempts: newAttempts,
            account_locked_until: new Date(
              Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
            ).toISOString(),
            last_failed_login: new Date().toISOString(),
          })
          .eq('id', userData.id)

        return {
          success: false,
          error: 'Too many failed attempts. Account is now locked.',
          attemptsRemaining: 0,
          isLocked: true,
          requiresPasswordReset: true,
        }
      }

      await supabase
        .from('users')
        .update({
          failed_login_attempts: newAttempts,
          last_failed_login: new Date().toISOString(),
        })
        .eq('id', userData.id)

      return {
        success: false,
        error: `Invalid employee ID or password. ${attemptsRemaining} attempts remaining.`,
        attemptsRemaining,
      }
    }

    // Verify Auth ID matches User ID
    if (authData.user.id !== userData.id) {
      console.error('AUTH ID MISMATCH:', {
        users_table_id: userData.id,
        auth_user_id: authData.user.id,
      })

      await supabase.auth.signOut({ scope: 'local' })

      return {
        success: false,
        error: 'Account configuration error: Auth UID mismatch. Please contact administrator.',
      }
    }

    // Successful login - reset failed attempts and update last login
    await supabase
      .from('users')
      .update({
        failed_login_attempts: 0,
        account_locked_until: null,
        last_login: new Date().toISOString(),
      })
      .eq('id', userData.id)

    // Fetch full user data with relations
    const { data: fullUser, error: fullUserError } = await supabase
      .from('users')
      .select(`
        *,
        role:roles!role_id(*),
        department:departments!department_id(*),
        hospital:hospitals!hospital_id(*)
      `)
      .eq('id', userData.id)
      .single()

    if (fullUserError) {
      console.error('Error fetching full user data:', fullUserError)
      if (userData) {
        return {
          success: true,
          user: userData as UserWithRelations,
        }
      }
      return {
        success: false,
        error: `Profile error: ${fullUserError.message}`,
      }
    }

    return {
      success: true,
      user: fullUser as UserWithRelations,
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<ResetPasswordResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: 'Failed to send reset email. Please try again.',
    }
  }
}

/**
 * Reset password with new password
 */
export async function resetPassword(newPassword: string): Promise<ResetPasswordResult> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Password update error:', error)
    return {
      success: false,
      error: 'Failed to update password. Please try again.',
    }
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch (error) {
    console.warn('Logout error (continuing with local state cleanup):', error)
  }

  // Clear local storage/session storage
  try {
    if (typeof window !== 'undefined') {
      const supabaseKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('sb-') || key.includes('supabase')
      )
      supabaseKeys.forEach(key => localStorage.removeItem(key))
      sessionStorage.clear()
    }
  } catch (storageError) {
    console.warn('Error clearing storage:', storageError)
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

