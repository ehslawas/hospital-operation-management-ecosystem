// @ts-nocheck
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { mockAccessRequests, getHospitalById, getDepartmentById, mockUsers, mockRoles } from '@/services/mockData'
import type { AccessRequest, AccessRequestWithRelations, PaginatedResponse, FilterConfig, SortConfig } from '@/types'
import { DEFAULT_PAGE_SIZE, SYSTEM_ROLES } from '@/lib/constants'
import { createUser } from './userService'
import type { User } from '@/types'
import { MOCK_PASSWORD } from '@/services/mockData'
import { createAuthUser } from '@/services/authUserService'
import { decryptPassword } from '@/lib/encryptionUtils'

export interface GetAccessRequestsParams {
  page?: number
  pageSize?: number
  search?: string
  filters?: FilterConfig[]
  sort?: SortConfig
  status?: string
  hospitalId?: string
}

/**
 * Helper: Get current user's role and hospital info
 */
async function getCurrentUserInfo(userId: string): Promise<{
  roleCode: string | null
  hospitalId: string | null
  isSystemAdmin: boolean
  isHospitalAdmin: boolean
} | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        role:roles!role_id(role_code),
        hospital_id
      `)
      .eq('id', userId)
      .maybeSingle()

    if (error || !user) {
      console.error('Error fetching current user info:', error)
      return null
    }

    const roleCode = (user.role as any)?.role_code || null
    const hospitalId = user.hospital_id || null

    return {
      roleCode,
      hospitalId,
      isSystemAdmin: roleCode === SYSTEM_ROLES.SYSTEM_ADMIN,
      isHospitalAdmin: roleCode === SYSTEM_ROLES.HOSPITAL_ADMIN,
    }
  } catch (error) {
    console.error('Error in getCurrentUserInfo:', error)
    return null
  }
}

/**
 * Helper: Validate that Hospital Admin can only access their own hospital's requests
 */
async function validateHospitalAccess(
  requestHospitalId: string | null,
  approverUserId: string
): Promise<{ valid: boolean; error?: string }> {
  const userInfo = await getCurrentUserInfo(approverUserId)
  
  if (!userInfo) {
    return { valid: false, error: 'Unable to verify user permissions' }
  }

  // System Admin can access all hospitals
  if (userInfo.isSystemAdmin) {
    return { valid: true }
  }

  // Hospital Admin can only access their own hospital
  if (userInfo.isHospitalAdmin) {
    if (!requestHospitalId || !userInfo.hospitalId) {
      return { valid: false, error: 'Hospital information is missing' }
    }
    
    if (requestHospitalId !== userInfo.hospitalId) {
      return {
        valid: false,
        error: 'You do not have permission to approve access requests for other hospitals. ' +
               'You can only approve requests for your own hospital.'
      }
    }
    
    return { valid: true }
  }

  // Only System Admin and Hospital Admin can approve requests
  return {
    valid: false,
    error: 'You do not have permission to approve access requests. ' +
           'Only System Administrators and Hospital Administrators can approve requests.'
  }
}

/**
 * Helper: Validate that admin roles cannot be assigned during approval
 */
async function validateRoleAssignment(roleId: string): Promise<{ valid: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { valid: true } // Skip validation in mock mode
  }

  try {
    // Get role info
    const { data: role, error } = await supabase
      .from('roles')
      .select('role_code')
      .eq('id', roleId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching role:', error)
      return { valid: false, error: 'Failed to validate role' }
    }

    if (!role) {
      return { valid: false, error: 'Role not found' }
    }

    // Prevent assigning admin roles through access request approval
    if (role.role_code === SYSTEM_ROLES.SYSTEM_ADMIN || role.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN) {
      return {
        valid: false,
        error: `Cannot assign ${role.role_code === SYSTEM_ROLES.SYSTEM_ADMIN ? 'System Admin' : 'Hospital Admin'} role through access request approval. ` +
               'Admin roles must be assigned manually by System Administrators.'
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('Error in validateRoleAssignment:', error)
    return { valid: false, error: 'Failed to validate role assignment' }
  }
}

/**
 * Get paginated list of access requests
 */
export async function getAccessRequests(params: GetAccessRequestsParams = {}): Promise<PaginatedResponse<AccessRequestWithRelations>> {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search = '',
    filters = [],
    sort,
    status,
    hospitalId,
  } = params

  try {
    if (isSupabaseConfigured()) {
      // Supabase implementation
      let query = supabase
        .from('access_requests')
        .select(`
          *,
          hospital:hospitals(*),
          department:departments(*),
          reviewed_by_user:users!access_requests_reviewed_by_fkey(*)
        `, { count: 'exact' })

      // Apply filters
      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId)
      }
      if (status) {
        query = query.eq('status', status)
      }

      // Apply search
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,ic_number.ilike.%${search}%`)
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
        data: (data || []) as AccessRequestWithRelations[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    } else {
      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 500))

      let filteredRequests = [...mockAccessRequests]

      // Apply filters
      if (hospitalId) {
        filteredRequests = filteredRequests.filter((r) => r.hospital_id === hospitalId)
      }
      if (status) {
        filteredRequests = filteredRequests.filter((r) => r.status === status)
      }

      // Apply search
      if (search) {
        const searchLower = search.toLowerCase()
        filteredRequests = filteredRequests.filter(
          (r) =>
            r.full_name.toLowerCase().includes(searchLower) ||
            r.email.toLowerCase().includes(searchLower) ||
            r.ic_number.includes(searchLower)
        )
      }

      // Apply sorting
      if (sort) {
        filteredRequests.sort((a, b) => {
          const aVal = a[sort.key as keyof AccessRequest]
          const bVal = b[sort.key as keyof AccessRequest]
          if (aVal === bVal) return 0
          const comparison = aVal > bVal ? 1 : -1
          return sort.direction === 'asc' ? comparison : -comparison
        })
      } else {
        filteredRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }

      // Apply pagination
      const total = filteredRequests.length
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const paginatedRequests = filteredRequests.slice(from, to)

      // Add relations
      const requestsWithRelations: AccessRequestWithRelations[] = paginatedRequests.map((request) => ({
        ...request,
        hospital: getHospitalById(request.hospital_id),
        department: getDepartmentById(request.department_id),
        reviewed_by_user: request.reviewed_by
          ? mockUsers.find((u) => u.id === request.reviewed_by)
          : undefined,
      }))

      return {
        data: requestsWithRelations,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    }
  } catch (error) {
    console.error('Error fetching access requests:', error)
    throw error
  }
}

/**
 * Get access request by ID
 * Optionally validate that the requester has permission to view this request
 */
export async function getAccessRequestById(
  requestId: string,
  requesterUserId?: string
): Promise<AccessRequestWithRelations | null> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('access_requests')
        .select(`
          *,
          hospital:hospitals(*),
          department:departments(*),
          reviewed_by_user:users!access_requests_reviewed_by_fkey(*)
        `)
        .eq('id', requestId)
        .maybeSingle()

      if (error) throw error
      
      // If requesterUserId is provided, validate access
      if (requesterUserId && data) {
        const accessValidation = await validateHospitalAccess(data.hospital_id, requesterUserId)
        if (!accessValidation.valid) {
          throw new Error(accessValidation.error || 'Access denied')
        }
      }
      
      return data as AccessRequestWithRelations
    } else {
      await new Promise((resolve) => setTimeout(resolve, 300))
      const request = mockAccessRequests.find((r) => r.id === requestId)
      if (!request) return null

      return {
        ...request,
        hospital: getHospitalById(request.hospital_id),
        department: getDepartmentById(request.department_id),
        reviewed_by_user: request.reviewed_by
          ? mockUsers.find((u) => u.id === request.reviewed_by)
          : undefined,
      }
    }
  } catch (error) {
    console.error('Error fetching access request:', error)
    throw error
  }
}

/**
 * Approve access request and create user account
 */
export async function approveAccessRequest(
  requestId: string,
  approvedBy: string,
  roleId: string
): Promise<{ 
  success: boolean
  error?: string
  userId?: string
  employeeId?: string
  email?: string
}> {
  let statusUpdated = false
  let createdUserId: string | null = null
  let isNewUser = false
  
  try {
    if (isSupabaseConfigured()) {
      // Get the request first (without validation to check if it exists)
      const request = await getAccessRequestById(requestId)
      if (!request) {
        return { success: false, error: 'Access request not found or you do not have permission to view it' }
      }

      // SECURITY: Validate hospital access for this specific request
      const hospitalValidation = await validateHospitalAccess(request.hospital_id, approvedBy)
      if (!hospitalValidation.valid) {
        return { success: false, error: hospitalValidation.error || 'Access denied' }
      }

      // SECURITY: Validate that admin roles cannot be assigned
      const roleValidation = await validateRoleAssignment(roleId)
      if (!roleValidation.valid) {
        return { success: false, error: roleValidation.error || 'Invalid role assignment' }
      }

      // Validate and create user FIRST, then update status only if everything succeeds
      // This prevents marking as "approved" if there are any errors
      
      // Resolve role_id - check if roleId is a UUID or a role code
      let actualRoleId = roleId
      
      // Check if roleId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(roleId)) {
        // It's a role code, not a UUID - look up the actual role UUID
        let roleQuery = supabase
          .from('roles')
          .select('id')
          .eq('role_code', roleId)
        
        if (request.hospital_id) {
          roleQuery = roleQuery.or(`hospital_id.is.null,hospital_id.eq.${request.hospital_id}`)
        } else {
          roleQuery = roleQuery.is('hospital_id', null)
        }
        
        const { data: roleData, error: roleError } = await roleQuery.maybeSingle()
        
        if (roleError) {
          console.error('Error looking up role:', roleError)
          throw new Error(`Failed to look up role: ${roleError.message}`)
        }
        
        if (!roleData || !roleData.id) {
          throw new Error(`Role not found: ${roleId}. Please select a valid role.`)
        }
        
        actualRoleId = roleData.id
        
        // SECURITY: Double-check the resolved role is not an admin role
        const resolvedRoleValidation = await validateRoleAssignment(actualRoleId)
        if (!resolvedRoleValidation.valid) {
          return { success: false, error: resolvedRoleValidation.error || 'Invalid role assignment' }
        }
      } else {
        // SECURITY: If roleId is a UUID, validate it's not an admin role
        const uuidRoleValidation = await validateRoleAssignment(roleId)
        if (!uuidRoleValidation.valid) {
          return { success: false, error: uuidRoleValidation.error || 'Invalid role assignment' }
        }
      }

      // Check if user already exists in public.users table
      // Check by IC number (which is now used as employee_id) AND hospital_id
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, employee_id, hospital_id')
        .eq('ic_number', request.ic_number)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking for existing user:', checkError)
      }

      // Check if existing user is in a different hospital
      if (existingUser && existingUser.hospital_id !== request.hospital_id) {
        // Don't update status - return error immediately
        return {
          success: false,
          error: `A user with IC number ${request.ic_number} already exists in a different hospital. ` +
                 'Please contact a System Admin if you need to transfer this user between hospitals.'
        }
      }

      // Generate UUID and use IC number as employee_id
      const newUserId = existingUser?.id || crypto.randomUUID()
      isNewUser = !existingUser
      
      // Use IC number as employee_id (remove dashes if present)
      const employeeId = request.ic_number.replace(/-/g, '')
      
      // Verify password fields exist in the request
      if (!request.password_hash || !request.password_encrypted) {
        return {
          success: false,
          error: 'Password information not found in access request. Please ensure the request was submitted with a password.'
        }
      }
      
      // Decrypt the password for Supabase Auth account creation
      let plainPassword: string
      try {
        plainPassword = await decryptPassword(request.password_encrypted)
      } catch (error) {
        console.error('Error decrypting password:', error)
        return {
          success: false,
          error: 'Failed to decrypt password. The access request may be corrupted.'
        }
      }

      // Create or update user account
      const userData = {
        email: request.email,
        employee_id: employeeId,
        full_name: request.full_name,
        ic_number: request.ic_number,
        phone_number: request.phone_number,
        date_of_birth: request.date_of_birth,
        gender: request.gender,
        address: request.address,
        profile_photo_url: request.profile_photo_url,
        hospital_id: request.hospital_id,
        department_id: request.department_id,
        role_id: actualRoleId,
        jawatan: request.jawatan,
        status: 'active' as const,
        failed_login_attempts: 0,
        updated_at: new Date().toISOString(),
      }

      let newUser
      let userError

      if (existingUser && existingUser.hospital_id === request.hospital_id) {
        // Update existing user in the same hospital
        // This handles cases where an access request was previously approved but needs to be updated
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(userData)
          .eq('id', existingUser.id)
          .select()
          .maybeSingle()
        
        if (updateError) {
          console.error('Error updating existing user:', updateError)
          throw updateError
        }
        
        if (!updatedUser) {
          console.error('Update returned no data. This may be due to Row Level Security (RLS) restrictions.')
          throw new Error(
            'You do not have permission to update this user account. ' +
            'Please ensure you are a Hospital Admin for this hospital.'
          )
        }
        newUser = updatedUser
        userError = updateError
      } else {
        // Insert new user (either doesn't exist, or we've already handled the different hospital case above)
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert({
            ...userData,
            id: newUserId,
            created_by: approvedBy,
          })
          .select()
          .single()
        newUser = insertedUser
        userError = insertError
      }

      if (userError) throw userError
      createdUserId = newUser.id

      // Create Supabase Auth user account using the decrypted password from the access request
      const { success: authSuccess, error: authError, authUserId } = await createAuthUser(
        request.email,
        plainPassword, // Use the decrypted password from the access request
        newUserId // Use the same UUID we generated or found for the users table
      )

      if (!authSuccess) {
        console.error('Failed to create Auth user:', authError)
        console.error('User ID:', newUserId)
        console.error('Email:', request.email)
        console.error('This is a critical error - the user account was created but Auth account was not.')
        console.error('The user will not be able to log in until this is fixed.')
        console.error('Solution: Use the fixMissingAuthAccount function or reset the password.')
        
        // Rollback: only delete if we actually inserted it in this session
        if (isNewUser) {
          await supabase.from('users').delete().eq('id', newUser.id)
        }
        // No need to rollback status since we haven't updated it yet
        return {
          success: false,
          error: `Failed to create authentication account: ${authError || 'Unknown error'}. ` +
                 'The user account was not created. Please try again or contact system administrator.',
        }
      }

      // Verify Auth account was created successfully
      if (!authUserId) {
        console.error('WARNING: Auth account creation reported success but no authUserId returned!')
        console.error('This may indicate the Auth account was not actually created.')
      }

      // Update user record with auth user ID if different (shouldn't be, but just in case)
      if (authUserId && authUserId !== newUser.id) {
        await supabase
          .from('users')
          .update({ id: authUserId })
          .eq('id', newUser.id)
        newUser.id = authUserId
      }

      // Create emergency contact if provided
      if (request.emergency_contact_name && request.emergency_contact_phone) {
        await supabase.from('emergency_contacts').insert({
          user_id: newUser.id,
          contact_name: request.emergency_contact_name,
          relationship: request.emergency_contact_relationship || 'other',
          phone_primary: request.emergency_contact_phone,
          phone_secondary: undefined,
          address: request.emergency_contact_address,
        })
      }

      // Delete the encrypted password from access_requests for security
      // The password_hash remains for verification purposes
      await supabase
        .from('access_requests')
        .update({ password_encrypted: null })
        .eq('id', requestId)

      // No email sending - user already set their password during access request submission
      // The password_hash is stored in access_requests and can be used for verification

      // NOW update the access request status to "approved" - only after everything succeeded
      const { data: updatedRequest, error: statusUpdateError } = await supabase
        .from('access_requests')
        .update({
          status: 'approved',
          reviewed_by: approvedBy,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select('id, status, reviewed_by, reviewed_at')
        .maybeSingle()

      if (statusUpdateError) {
        console.error('Error updating access request status:', statusUpdateError)
        throw new Error(`Failed to update access request status: ${statusUpdateError.message}`)
      }
      
      if (!updatedRequest) {
        console.error('Status update returned no data. This may be due to RLS restrictions.')
        throw new Error(
          'Status update failed: No data returned. This may be due to Row Level Security (RLS) restrictions. ' +
          'Please ensure you are a Hospital Admin for this hospital.'
        )
      }
      
      if (updatedRequest.status !== 'approved') {
        console.error('Status update did not set status to approved. Updated request:', updatedRequest)
        throw new Error(`Status update failed: Expected 'approved' but got '${updatedRequest.status}'`)
      }
      
      console.log('Status updated successfully:', updatedRequest)
      statusUpdated = true

      // Return success - no credentials needed since user set their own password
      return { 
        success: true, 
        userId: newUser.id,
        employeeId: newUser.employee_id,
        email: request.email
      }
    } else {
      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 800))
      const request = mockAccessRequests.find((r) => r.id === requestId)
      if (!request) {
        return { success: false, error: 'Access request not found' }
      }

      // Update request
      request.status = 'approved'
      request.reviewed_by = approvedBy
      request.reviewed_at = new Date().toISOString()

      // Create user account
      const employeeId = generateEmployeeId(request.hospital_id, request.department_id)
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: request.email,
        employee_id: employeeId,
        full_name: request.full_name,
        ic_number: request.ic_number,
        phone_number: request.phone_number,
        date_of_birth: request.date_of_birth,
        gender: request.gender,
        address: request.address,
        profile_photo_url: request.profile_photo_url,
        hospital_id: request.hospital_id,
        department_id: request.department_id,
        role_id: roleId,
        jawatan: request.jawatan,
        status: 'active',
        failed_login_attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      mockUsers.push(newUser)

      return { success: true, userId: newUser.id }
    }
  } catch (error) {
    console.error('Error approving access request:', error)
    
    // Rollback: If status was updated but user creation failed, revert status to pending
    if (statusUpdated && isSupabaseConfigured()) {
      try {
        await supabase
          .from('access_requests')
          .update({
            status: 'pending',
            reviewed_by: null,
            reviewed_at: null,
          })
          .eq('id', requestId)
      } catch (rollbackError) {
        console.error('Error rolling back access request status:', rollbackError)
      }
    }
    
    // Rollback: If user was created but something else failed, delete the user
    if (createdUserId && isNewUser && isSupabaseConfigured()) {
      try {
        await supabase.from('users').delete().eq('id', createdUserId)
      } catch (rollbackError) {
        console.error('Error rolling back user creation:', rollbackError)
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to approve access request' 
    }
  }
}

/**
 * Reject access request
 */
export async function rejectAccessRequest(
  requestId: string,
  rejectedBy: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isSupabaseConfigured()) {
      // SECURITY: Get the request first to validate hospital access
      const request = await getAccessRequestById(requestId, rejectedBy)
      if (!request) {
        return { success: false, error: 'Access request not found or you do not have permission to view it' }
      }

      // SECURITY: Validate hospital access for this specific request
      const hospitalValidation = await validateHospitalAccess(request.hospital_id, rejectedBy)
      if (!hospitalValidation.valid) {
        return { success: false, error: hospitalValidation.error || 'Access denied' }
      }

      const { error } = await supabase
        .from('access_requests')
        .update({
          status: 'rejected',
          reviewed_by: rejectedBy,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', requestId)

      if (error) throw error
      return { success: true }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const request = mockAccessRequests.find((r) => r.id === requestId)
      if (request) {
        request.status = 'rejected'
        request.reviewed_by = rejectedBy
        request.reviewed_at = new Date().toISOString()
        request.rejection_reason = reason
      }
      return { success: true }
    }
  } catch (error) {
    console.error('Error rejecting access request:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reject access request' 
    }
  }
}

/**
 * Generate employee ID based on hospital and department
 */
function generateEmployeeId(hospitalId: string, departmentId: string, sequenceOverride?: number): string {
  const hospital = getHospitalById(hospitalId)
  const department = getDepartmentById(departmentId)
  
  if (!hospital || !department) {
    return `EMP${Date.now().toString().slice(-6)}`
  }

  const hospitalCode = hospital.hospital_code
  const deptCode = department.department_code
  
  // Use provided sequence number or fall back to mock count
  const sequenceNum = sequenceOverride !== undefined 
    ? sequenceOverride 
    : (mockUsers.filter(u => u.hospital_id === hospitalId && u.department_id === departmentId).length + 1)
    
  const sequence = sequenceNum.toString().padStart(3, '0')

  return `${hospitalCode}-${deptCode}-${sequence}`
}

/**
 * Generate a temporary password for new users
 * In production, this should be more secure and sent via email
 */
function generateTemporaryPassword(): string {
  // Generate a secure random password
  // Format: 12 characters with uppercase, lowercase, numbers, and special characters
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + special

  let password = ''
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest randomly
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

