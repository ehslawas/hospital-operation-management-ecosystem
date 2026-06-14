import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Create a Supabase Auth user account
 * This function creates a user in Supabase Auth (auth.users) which is required for login
 * 
 * @param email - User's email address
 * @param password - User's password (should be temporary, user should change on first login)
 * @param userId - Optional: UUID to use as the auth user ID (should match users.id)
 * @returns Success status and any error
 */
export async function createAuthUser(
  email: string,
  password: string,
  userId?: string
): Promise<{ success: boolean; error?: string; authUserId?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      // In mock mode, just return success
      return { success: true }
    }

    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required',
      }
    }

    // Use Supabase Admin API to create user
    // Note: This requires the service role key, which should be stored securely
    // For production, consider using a Supabase Edge Function instead
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey || serviceRoleKey === 'placeholder-service-key') {
      console.warn(
        'Service role key not configured. Auth user creation will fail. ' +
        'Please set VITE_SUPABASE_SERVICE_ROLE_KEY in your .env file, ' +
        'or use a Supabase Edge Function for secure user creation.'
      )
      
      // Try using signUp as fallback (requires email confirmation)
      // This is less ideal but works without service role key
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_id: userId,
          },
          emailRedirectTo: undefined, // Disable email confirmation for admin-created users
        },
      })

      if (error) {
        // If user already exists, that's okay - they can log in
        if (error.message.includes('already registered')) {
          return { success: true, authUserId: data.user?.id }
        }
        return { success: false, error: error.message }
      }

      return { success: true, authUserId: data.user?.id }
    }

    // Check if auth user already exists by email FIRST (before creating)
    // This prevents creating duplicate Auth accounts
    const checkByEmailResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    )
    
    if (checkByEmailResponse.ok) {
      const usersData = await checkByEmailResponse.json()
      if (usersData.users && usersData.users.length > 0) {
        const existingAuthUser = usersData.users[0]
        
        // CRITICAL: Verify the email matches exactly - don't reuse if email is different
        // This prevents reusing an Auth account that belongs to a different user
        if (existingAuthUser.email && existingAuthUser.email.toLowerCase() !== email.toLowerCase()) {
          return {
            success: false,
            error: `An Auth account with a different email (${existingAuthUser.email}) was found when searching for ${email}. ` +
                   `This indicates a data inconsistency. Cannot reuse this Auth account. Please contact system administrator.`,
            authUserId: existingAuthUser.id,
          }
        }
        
        // If userId was provided and it doesn't match existing user, log a warning but REUSE the existing Auth user
        // This situation can happen if an auth account was created earlier (e.g. via dashboard or failed attempt)
        if (userId && existingAuthUser.id !== userId) {
          console.warn(
            `Auth user email conflict for ${email}: existing auth ID ${existingAuthUser.id} ` +
            `differs from requested ID ${userId}. Reusing existing Auth user.`
          )
        }
        
        // Update password for existing user (or just ensure it is valid)
        const updateResponse = await fetch(
          `${supabaseUrl}/auth/v1/admin/users/${existingAuthUser.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${serviceRoleKey}`,
              apikey: serviceRoleKey,
            },
            body: JSON.stringify({
              password,
              email_confirm: true,
            }),
          }
        )
        
        if (updateResponse.ok) {
          // Always return the existing Auth user ID - caller can update public.users.id if needed
          return { success: true, authUserId: existingAuthUser.id }
        } else {
          const errorData = await updateResponse.json().catch(() => ({}))
          return {
            success: false,
            error: `Failed to update existing Auth user: ${errorData.msg || updateResponse.statusText}`,
            authUserId: existingAuthUser.id,
          }
        }
      }
    }
    
    // If userId provided, check if that UUID already exists in auth.users
    // NOTE: 404 is expected and means the UUID is available - we can proceed with creation
    if (userId) {
      try {
        const checkByIdResponse = await fetch(
          `${supabaseUrl}/auth/v1/admin/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              apikey: serviceRoleKey,
            },
          }
        )
        
        if (checkByIdResponse.ok) {
          // User already exists with this UUID - check if it's the same email
          const existingUser = await checkByIdResponse.json()
          if (existingUser.email !== email) {
            return {
              success: false,
              error: `An Auth account with ID ${userId} already exists with email ${existingUser.email}. Cannot use this ID for ${email}.`,
              authUserId: userId,
            }
          }
          
          // Same email, update password
          const updateResponse = await fetch(
            `${supabaseUrl}/auth/v1/admin/users/${userId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${serviceRoleKey}`,
                apikey: serviceRoleKey,
              },
              body: JSON.stringify({
                password,
                email_confirm: true,
              }),
            }
          )
          
          if (updateResponse.ok) {
            return { success: true, authUserId: userId }
          }
        } else if (checkByIdResponse.status === 404) {
          // 404 is expected - UUID doesn't exist, we can proceed with creation
          // This is not an error, just continue to create the user
        } else {
          // Some other error occurred, log it but continue
          console.warn(`Unexpected status ${checkByIdResponse.status} when checking user by ID:`, await checkByIdResponse.text().catch(() => ''))
        }
      } catch (error) {
        // Network error or other issue - log but continue
        console.warn('Error checking user by ID, continuing with creation:', error)
      }
    }

    // User doesn't exist, create new one
    // NOTE: Supabase Admin API may not support setting custom 'id' when creating users
    // If userId is provided, we'll try, but if it fails, we'll create without ID and return the generated ID
    const createBody: any = {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        user_id: userId || undefined,
      },
    }
    
    // Only try to set custom ID if provided - Supabase may reject this
    if (userId) {
      createBody.id = userId
    }
    
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify(createBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // If creating with custom ID failed, try creating without ID
      if (userId && (response.status === 400 || response.status === 422 || response.status === 500)) {
        console.warn(`Failed to create Auth user with custom ID ${userId}: ${errorData.msg || response.statusText}. Retrying without custom ID...`)
        
        const retryResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
          body: JSON.stringify({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              user_id: userId,
            },
            // Don't include 'id' - let Supabase generate it
          }),
        })
        
        if (retryResponse.ok) {
          const createdUser = await retryResponse.json()
          return {
            success: true,
            authUserId: createdUser.id,
            warning: `Auth user created with auto-generated ID ${createdUser.id} instead of requested ${userId}. The users table will need to use this ID.`,
          }
        } else {
          const retryError = await retryResponse.json().catch(() => ({}))
          return {
            success: false,
            error: `Failed to create Auth user: ${retryError.msg || retryResponse.statusText}`,
          }
        }
      }
      
      // If user already exists by email, that's okay
      if (response.status === 422 || errorData.msg?.includes('already')) {
        // Try to get the existing user
        const getUserResponse = await fetch(
          `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
          {
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              apikey: serviceRoleKey,
            },
          }
        )
        
        if (getUserResponse.ok) {
          const users = await getUserResponse.json()
          if (users.users && users.users.length > 0) {
            return { success: true, authUserId: users.users[0].id }
          }
        }
      }

      return {
        success: false,
        error: errorData.msg || errorData.message || `Failed to create auth user: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return { success: true, authUserId: data.id || data.user?.id }
  } catch (error) {
    console.error('Error creating auth user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating auth user',
    }
  }
}

/**
 * Confirm email for an existing Auth user
 * This is useful for users who were created but their email wasn't confirmed
 */
export async function confirmAuthUserEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey || serviceRoleKey === 'placeholder-service-key') {
      return {
        success: false,
        error: 'Service role key not configured',
      }
    }

    // First, get the user by email
    const getUserResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    )

    if (!getUserResponse.ok) {
      return {
        success: false,
        error: 'Failed to find user',
      }
    }

    const usersData = await getUserResponse.json()
    if (!usersData.users || usersData.users.length === 0) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    const authUserId = usersData.users[0].id

    // Update user to confirm email
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${authUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        email_confirm: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.msg || errorData.message || 'Failed to confirm email',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error confirming email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if Auth user exists by email
 */
export async function checkAuthUserExists(email: string): Promise<{ exists: boolean; userId?: string; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { exists: false }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey || serviceRoleKey === 'placeholder-service-key') {
      // Fallback: try to check via signIn (less reliable but works without service key)
      return { exists: false, error: 'Service role key not configured' }
    }

    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    )

    if (!response.ok) {
      return { exists: false }
    }

    const data = await response.json()
    if (data.users && data.users.length > 0) {
      return { exists: true, userId: data.users[0].id }
    }

    return { exists: false }
  } catch (error) {
    console.error('Error checking auth user existence:', error)
    return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Fix missing Auth account by creating it with the password from access request
 * This is a recovery function for cases where Auth account creation failed during approval
 */
export async function fixMissingAuthAccount(
  userId: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' }
    }

    // Check if Auth account already exists
    const checkResult = await checkAuthUserExists(email)
    if (checkResult.exists) {
      // Account exists, just update password
      return await updateAuthUserPassword(checkResult.userId || userId, password)
    }

    // Account doesn't exist, create it
    return await createAuthUser(email, password, userId)
  } catch (error) {
    console.error('Error fixing missing auth account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update Auth user password
 */
export async function updateAuthUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey || serviceRoleKey === 'placeholder-service-key') {
      return {
        success: false,
        error: 'Service role key not configured',
      }
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        password: newPassword,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.msg || errorData.message || 'Failed to update password',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating auth user password:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

