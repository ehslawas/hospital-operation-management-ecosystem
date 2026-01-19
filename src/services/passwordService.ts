/**
 * Password Service
 * Handles password changes for authenticated users
 */

import { supabase } from './supabase'

export interface ChangePasswordResult {
  success: boolean
  error?: string
}

/**
 * Change password for the currently authenticated user
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  try {
    // Validate password strength
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long' }
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'You must be logged in to change your password' }
    }

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })

    if (verifyError) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Update password using Supabase Auth API
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      return {
        success: false,
        error: updateError.message || 'Failed to update password. Please try again.',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error changing password:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Request password reset (forgot password)
 * This sends an email with a reset link
 */
export async function requestPasswordReset(email: string): Promise<ChangePasswordResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      console.error('Error requesting password reset:', error)
      return {
        success: false,
        error: error.message || 'Failed to send password reset email',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

