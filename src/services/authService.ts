import { supabase, isSupabaseConfigured } from './supabase'
import {
  findUserByEmployeeId,
  getRoleById,
  getDepartmentById,
  getHospitalById,
  MOCK_PASSWORD,
} from './mockData'
import type { UserWithRelations } from '@/types'
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

// Store failed attempts in memory for mock (in production, this would be in Supabase)
const failedAttempts = new Map<string, { count: number; lockedUntil?: number }>()

/**
 * Authenticate user with employee ID and password
 */
export async function login(employeeId: string, password: string): Promise<LoginResult> {
  try {
    // Check if using Supabase or mock
    if (isSupabaseConfigured()) {
      // Supabase authentication
      return await loginWithSupabase(employeeId, password)
    } else {
      // Mock authentication for local development
      return await loginWithMock(employeeId, password)
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
 * Mock login for local development
 */
async function loginWithMock(employeeId: string, password: string): Promise<LoginResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Find user
  const user = findUserByEmployeeId(employeeId)

  if (!user) {
    return {
      success: false,
      error: 'Invalid employee ID or password',
    }
  }

  // Check account status
  if (user.status === 'pending') {
    return {
      success: false,
      error: 'Your account is pending approval. Please wait for admin approval.',
    }
  }

  if (user.status === 'suspended') {
    return {
      success: false,
      error: 'Your account has been suspended. Please contact administrator.',
    }
  }

  if (user.status === 'inactive') {
    return {
      success: false,
      error: 'Your account is inactive. Please contact administrator.',
    }
  }

  // Check if account is locked
  const attempts = failedAttempts.get(user.employee_id)
  if (attempts?.lockedUntil && Date.now() < attempts.lockedUntil) {
    const remainingMinutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000)
    return {
      success: false,
      error: `Account is locked. Please try again in ${remainingMinutes} minutes.`,
      isLocked: true,
      requiresPasswordReset: true,
    }
  }

  // Verify password (in mock, use the demo password)
  if (password !== MOCK_PASSWORD) {
    // Record failed attempt
    const currentAttempts = (attempts?.count || 0) + 1
    const attemptsRemaining = MAX_LOGIN_ATTEMPTS - currentAttempts

    if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
      // Lock account
      failedAttempts.set(user.employee_id, {
        count: currentAttempts,
        lockedUntil: Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
      })

      return {
        success: false,
        error: 'Too many failed attempts. Account is now locked.',
        attemptsRemaining: 0,
        isLocked: true,
        requiresPasswordReset: true,
      }
    }

    failedAttempts.set(user.employee_id, { count: currentAttempts })

    return {
      success: false,
      error: `Invalid employee ID or password. ${attemptsRemaining} attempts remaining.`,
      attemptsRemaining,
    }
  }

  // Clear failed attempts on successful login
  failedAttempts.delete(user.employee_id)

  // Get related data
  const role = getRoleById(user.role_id)
  const department = getDepartmentById(user.department_id)
  const hospital = getHospitalById(user.hospital_id)

  const userWithRelations: UserWithRelations = {
    ...user,
    role,
    department,
    hospital,
  }

  return {
    success: true,
    user: userWithRelations,
  }
}

/**
 * Supabase login (for production)
 */
async function loginWithSupabase(employeeId: string, password: string): Promise<LoginResult> {
  // First, find user by employee ID to get email
  // We use RPC instead of direct table access to bypass RLS for unauthenticated users
  const { data: userData, error: userError } = await supabase
    .rpc('get_user_by_employee_id', { p_employee_id: employeeId })
    .maybeSingle()

  if (userError || !userData) {
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
    console.error('User data:', { email: userData.email, employee_id: userData.employee_id })
    
    // Check for specific error types
    if (authError?.message?.includes('Email not confirmed') || 
        authError?.message?.includes('email_not_confirmed')) {
      // Email exists but is not confirmed
      return {
        success: false,
        error: 'Please check your email and confirm your account before logging in. If you did not receive a confirmation email, please contact administrator.',
        requiresEmailConfirmation: true,
      }
    }
    
    if (authError?.message?.includes('Invalid login credentials') || 
        authError?.message?.includes('Invalid login') ||
        (authError?.status === 400 && !authError?.message?.includes('Email not confirmed'))) {
      // User exists in users table but credentials are wrong or user doesn't exist in Auth
      // This could mean:
      // 1. The password is incorrect
      // 2. The auth account doesn't exist (shouldn't happen if approval succeeded)
      // 3. The password was set incorrectly during account creation
      console.error('Auth login failed. User exists in database but auth credentials are invalid.')
      console.error('This may indicate the password was set incorrectly during account approval.')
      console.error('Solution: Contact your hospital admin to reset your password.')
      
      // Check if Auth account exists (for diagnostic purposes)
      const { checkAuthUserExists } = await import('./authUserService')
      const authCheck = await checkAuthUserExists(userData.email)
      if (authCheck.error) {
        console.warn('DIAGNOSTIC: Could not verify Auth account existence because service role key is not configured.')
      } else if (!authCheck.exists) {
        console.error('DIAGNOSTIC: Auth account does not exist for this user!')
        console.error('This means the Auth account creation failed during approval.')
        console.error('The hospital admin needs to fix this by resetting the password or re-approving the request.')
      } else {
        console.error('DIAGNOSTIC: Auth account exists but password is incorrect.')
      }
      
      return {
        success: false,
        error: 'Invalid employee ID or password. If you recently had your account approved, please contact your hospital admin to reset your password.',
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

  // CRITICAL INTEGRITY CHECK:
  // Our app expects `public.users.id` to match `auth.users.id` (auth uid).
  // If these diverge (often caused by creating Auth users in the dashboard without setting the UID),
  // RLS and profile lookups will break in unpredictable ways.
  if (authData.user.id !== userData.id) {
    console.error('AUTH ID MISMATCH:', {
      employee_id: userData.employee_id,
      email: userData.email,
      users_table_id: userData.id,
      auth_user_id: authData.user.id,
    })

    // Immediately sign out to avoid leaving a session that cannot access its profile via RLS
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (e) {
      console.warn('Failed to sign out after auth id mismatch (continuing):', e)
    }

    return {
      success: false,
      error:
        'Account configuration error: your login account is not linked to your profile record. ' +
        'Please contact a System Admin to repair the account (Auth UID mismatch).',
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
  // Note: We use the !column_name syntax to disambiguate relationships
  // since some tables (hospitals, departments) have multiple foreign keys to users
  const { data: fullUser, error: fullUserError } = await supabase
    .from('users')
    .select(`
      *,
      role:roles!role_id(*),
      department:departments!department_id(*),
      hospital:hospitals!hospital_id(*)
    `)
    .eq('id', userData.id)
    .maybeSingle()

  if (fullUserError) {
    console.error('Error fetching full user data:', fullUserError)
    
    // If we have an error fetching relations, but we have the basic user data,
    // we should still allow login but maybe with a warning or fallback
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
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<ResetPasswordResult> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      return { success: true }
    } else {
      // Mock - always succeed
      await new Promise((resolve) => setTimeout(resolve, 800))
      return { success: true }
    }
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
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      return { success: true }
    } else {
      // Mock - always succeed
      await new Promise((resolve) => setTimeout(resolve, 800))
      return { success: true }
    }
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
 * Uses 'local' scope to logout only the current session (not all sessions)
 * 'global' scope requires admin privileges and would revoke all sessions
 * Handles errors gracefully - even if logout fails, we clear local state
 */
export async function logout(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      // Try to sign out with local scope first
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      
      if (error) {
        console.warn('Error signing out with local scope, trying without scope:', error)
        
        // Fallback: try without scope parameter
        try {
          await supabase.auth.signOut()
        } catch (fallbackError) {
          console.warn('Error signing out (fallback):', fallbackError)
          // Continue anyway - we'll clear local state below
        }
      }
    } catch (error) {
      // If signOut completely fails, log but don't throw
      // The important thing is to clear local state
      console.warn('Logout error (continuing with local state cleanup):', error)
    }
  }
  
  // Always clear local storage/session storage regardless of Supabase logout result
  // This ensures the UI reflects logged out state even if API call fails
  try {
    if (typeof window !== 'undefined') {
      // Clear Supabase session from localStorage
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase')
      )
      supabaseKeys.forEach(key => localStorage.removeItem(key))
      
      // Clear session storage
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
  if (isSupabaseConfigured()) {
    const { data } = await supabase.auth.getSession()
    return data.session
  }
  return null
}

