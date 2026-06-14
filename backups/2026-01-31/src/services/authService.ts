import { supabase, createAnonymousClient } from './supabase'
import { queryClient } from '@/lib/queryClient'
import { useMenuStore } from '@/stores/menuStore'
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
// Helper to add timeout to promises
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000, errorMsg: string = 'Operation timed out'): Promise<T> {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
  )
  return Promise.race([promise, timeoutPromise]) as Promise<T>
}

/**
 * Authenticate user with employee ID and password
 */
export async function login(employeeId: string, password: string): Promise<LoginResult> {
  try {
    // First, find user by employee ID using secure RPC (bypasses RLS)
    // Add 10s timeout
    // Use anonymous client to bypass RLS policies that might block unauthenticated users
    // This is critical for the initial lookup
    const anonClient = createAnonymousClient()
    const { data: userData, error: userError } = await withTimeout(
      anonClient
        .rpc('get_user_by_employee_id', { p_employee_id: employeeId } as any)
        .returns<User>()
        .single()
        .then(res => ({ data: res.data as User | null, error: res.error })) as Promise<{ data: User | null, error: any }>,
      20000,
      'User lookup timed out'
    )

    if (userError || !userData) {
      console.warn('Login lookup failed:', userError)
      const isTimeout = userError?.message === 'User lookup timed out'
      return {
        success: false,
        error: isTimeout ? 'System is slow to respond. Please try again.' : 'Invalid employee ID or password',
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
    // Add 15s timeout for auth (can be slower)
    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      }),
      30000,
      'Authentication timed out'
    )

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

      const isTimeout = authError?.message === 'Authentication timed out'
      if (isTimeout) {
        return {
          success: false,
          error: 'Connection timed out. Please check your internet and try again.',
        }
      }

      if (authError?.message?.includes('Invalid login credentials') ||
        authError?.message?.includes('Invalid login') ||
        (authError?.status === 400 && !authError?.message?.includes('Email not confirmed'))) {

        // Diagnostic check: verify if auth account exists
        // We run this async without awaiting to not block the UI
        import('./authUserService').then(async ({ checkAuthUserExists }) => {
          try {
            const authCheck = await checkAuthUserExists(userData.email)
            if (!authCheck.exists) {
              console.error('DIAGNOSTIC: Auth account does not exist for this user!')
            }
          } catch (e) { console.error('Diagnostic check failed', e) }
        })

        return {
          success: false,
          error: 'Invalid employee ID or password.',
        }
      }

      // Record failed attempt
      const newAttempts = (userData.failed_login_attempts || 0) + 1
      const attemptsRemaining = MAX_LOGIN_ATTEMPTS - newAttempts

      // Update failed attempts in database
      // Add 5s timeout - this is less critical, if it fails we just log it
      try {
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          await withTimeout(
            supabase
              .from('users')
              .update({
                failed_login_attempts: newAttempts,
                account_locked_until: new Date(
                  Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
                ).toISOString(),
                last_failed_login: new Date().toISOString(),
              })
              .eq('id', userData.id) as unknown as Promise<any>,
            10000
          )

          return {
            success: false,
            error: 'Too many failed attempts. Account is now locked.',
            attemptsRemaining: 0,
            isLocked: true,
            requiresPasswordReset: true,
          }
        }

        await withTimeout(
          supabase
            .from('users')
            .update({
              failed_login_attempts: newAttempts,
              last_failed_login: new Date().toISOString(),
            })
            .eq('id', userData.id) as unknown as Promise<any>,
          10000
        )
      } catch (updateError) {
        console.error('Failed to update login attempts:', updateError)
        // Continue usually, but warn
      }

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
    // Fire and forget - Do NOT await this, as it blocks the user login experience
    // We catch errors in the background to prevent unhandled promise rejections
    withTimeout(
      supabase
        .from('users')
        .update({
          failed_login_attempts: 0,
          account_locked_until: null,
          last_login: new Date().toISOString(),
        })
        .eq('id', userData.id) as unknown as Promise<any>,
      20000
    ).catch(e => console.warn('Background update of last login stats failed (non-critical):', e))

    // Fetch full user data with relations
    // Reduced timeout to 15s - if DB is that slow, better to return basic userData (which we have)
    // and let the app try to function than to make the user wait 45s
    const { data: fullUser, error: fullUserError } = await withTimeout(
      supabase
        .from('users')
        .select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*)
        `)
        .eq('id', userData.id)
        .single()
        .then(res => ({ data: res.data, error: res.error })) as Promise<{ data: any, error: any }>,
      15000,
      'Profile fetch timed out'
    )

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
  } catch (error: any) {
    console.error('Login error:', error)
    if (error.message?.includes('timed out')) {
      return {
        success: false,
        error: 'System is not responding. Please check your internet connection and try again.'
      }
    }
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

      // CRITICAL: Clear React Query cache to prevent stale data on re-login
      queryClient.removeQueries()
      queryClient.clear()

      // CRITICAL: Clear Menu Store to force re-fetch on next login
      // This fixes the "No menus available" bug where isInitialized remains true
      useMenuStore.getState().clearMenus()
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

