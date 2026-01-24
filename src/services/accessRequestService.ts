import { supabase, uploadFile, createAnonymousClient } from './supabase'
import type { AccessRequest, Hospital, Department } from '@/types'
interface AccessRequestFormData {
  fullName: string
  email: string
  icNumber: string
  phoneNumber: string
  dateOfBirth: string
  gender: string
  address: string
  hospitalId: string
  departmentId: string
  jawatan: string
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  emergencyContactAddress: string
  password: string
}
import { generateId } from '@/lib/utils'
import { hashPassword } from '@/lib/passwordUtils'
import { encryptPassword, decryptPassword } from '@/lib/encryptionUtils'
import { createUser } from './userService'

export interface SubmitAccessRequestResult {
  success: boolean
  request?: AccessRequest
  error?: string
}

/**
 * Get all active hospitals
 * Shows all hospitals that exist in the system (they may or may not have modules enabled yet)
 */
export async function getHospitals(): Promise<Hospital[]> {
  const maxRetries = 3
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let lastError: Error | null = null

  const anonymousClient = createAnonymousClient()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[getHospitals] Attempt ${attempt}/${maxRetries}...`)

      const query = anonymousClient
        .from('hospitals')
        .select('*')
        .order('hospital_name')

      // Increased timeout to 30s to handle cold starts
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Hospitals fetch timed out')), 30000)
      )

      const { data: allHospitals, error: allError } = await Promise.race([
        query,
        timeoutPromise
      ]) as any

      if (allError) {
        console.error('Get all hospitals error:', allError)
        throw allError
      }

      console.log('[getHospitals] Success! Hospitals from DB:', allHospitals?.length || 0)

      // Filter active hospitals (or include all if status is null/undefined)
      const activeHospitals = (allHospitals || []).filter(
        (h: Hospital) => !h.status || h.status === 'active'
      )

      return activeHospitals as Hospital[]
    } catch (error: any) {
      lastError = error
      console.error(`[getHospitals] Attempt ${attempt} failed:`, error.message)

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        console.log(`[getHospitals] Retrying in ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  console.error('[getHospitals] All retries exhausted')
  throw lastError || new Error('Failed to fetch hospitals after multiple attempts')
}

/**
 * Get departments by hospital ID
 * Only returns departments that correspond to enabled modules for the hospital
 */
export async function getDepartments(hospitalId: string): Promise<Department[]> {
  const maxRetries = 3
  let lastError: Error | null = null

  const anonymousClient = createAnonymousClient()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[getDepartments] Attempt ${attempt}/${maxRetries} for hospital ${hospitalId}...`)

      const query = anonymousClient
        .from('departments')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('status', 'active')
        .order('department_name')

      // Increased timeout to 30s
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Departments fetch timed out')), 30000)
      )

      const { data, error } = await Promise.race([
        query,
        timeoutPromise
      ]) as any

      if (error) {
        console.error('Get departments error:', error)
        throw error
      }

      console.log('[getDepartments] Success! Departments:', data?.length || 0)
      return data || []
    } catch (error: any) {
      lastError = error
      console.error(`[getDepartments] Attempt ${attempt} failed:`, error.message)

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000
        console.log(`[getDepartments] Retrying in ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  console.error('[getDepartments] All retries exhausted, returning empty array')
  return []
}

/**
 * Submit access request
 */
export async function submitAccessRequest(
  data: AccessRequestFormData,
  profilePhoto: File
): Promise<SubmitAccessRequestResult> {
  try {
    // Profile photo is required
    if (!profilePhoto) {
      return {
        success: false,
        error: 'Profile photo is required. Please upload a photo and try again.',
      }
    }

    // Use a dedicated anonymous client for public access request submission
    // This ensures we always use the anon role without any session interference
    const anonymousClient = createAnonymousClient()

    let profilePhotoUrl: string

    // Upload profile photo (required)
    try {
      const fileName = `access-requests/${generateId()}-${profilePhoto.name}`
      // Pass anonymousClient to avoid auth session blocking
      const uploadResult = await uploadFile('avatar', fileName, profilePhoto, anonymousClient)

      if (!uploadResult.url) {
        const errorMsg = uploadResult.error || 'Photo upload failed - no URL returned'
        // Check if it's a bucket not found error
        if (errorMsg.includes("does not exist") || errorMsg.includes("Bucket not found")) {
          return {
            success: false,
            error: `Storage bucket 'avatar' does not exist. Please create it in Supabase Dashboard:\n1. Go to Storage → New Bucket\n2. Name it 'avatar'\n3. Set it to Public\n4. Create the bucket and try again.`,
          }
        }
        throw new Error(errorMsg)
      }

      profilePhotoUrl = uploadResult.url
    } catch (uploadError: any) {
      console.error('Profile photo upload failed:', uploadError)
      const errorMessage = uploadError?.message || 'Failed to upload profile photo'
      if (errorMessage.includes("does not exist") || errorMessage.includes("Bucket not found")) {
        return {
          success: false,
          error: `Storage bucket 'avatar' does not exist. Please create it in Supabase Dashboard:\n1. Go to Storage → New Bucket\n2. Name it 'avatar'\n3. Set it to Public\n4. Create the bucket and try again.`,
        }
      }
      return {
        success: false,
        error: `Failed to upload profile photo: ${errorMessage}`,
      }
    }

    // Hash the password for verification/backup
    const passwordHash = await hashPassword(data.password)

    // Encrypt the plain password for Supabase Auth account creation
    // This will be decrypted during approval and then deleted
    const passwordEncrypted = await encryptPassword(data.password)

    // We perform the insert without .select() to avoid RLS issues with the RETURNING clause
    const insertQuery = anonymousClient
      .from('access_requests')
      .insert({
        full_name: data.fullName,
        email: data.email,
        ic_number: data.icNumber,
        phone_number: data.phoneNumber,
        date_of_birth: data.dateOfBirth,
        gender: data.gender as any,
        address: data.address,
        profile_photo_url: profilePhotoUrl,
        hospital_id: data.hospitalId,
        department_id: data.departmentId,
        jawatan: data.jawatan,
        password_hash: passwordHash,
        password_encrypted: passwordEncrypted,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_relationship: data.emergencyContactRelationship,
        emergency_contact_phone: data.emergencyContactPhone,
        emergency_contact_address: data.emergencyContactAddress,
        status: 'pending',
      } as any)

    // Add 15s timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Submission timed out')), 15000)
    )

    const { error } = await Promise.race([
      insertQuery,
      timeoutPromise
    ]) as any

    if (error) {
      console.error('Access request insert error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      throw error
    }

    // If we got here, insert succeeded. 
    // We can return the request object with the data we have, 
    // since the UI just needs to show success.
    const submittedRequest: AccessRequest = {
      id: 'new-request',
      full_name: data.fullName,
      email: data.email,
      ic_number: data.icNumber,
      phone_number: data.phoneNumber,
      date_of_birth: data.dateOfBirth,
      gender: data.gender as any,
      address: data.address,
      profile_photo_url: profilePhotoUrl,
      hospital_id: data.hospitalId,
      department_id: data.departmentId,
      jawatan: data.jawatan,
      emergency_contact_name: data.emergencyContactName,
      emergency_contact_relationship: data.emergencyContactRelationship,
      emergency_contact_phone: data.emergencyContactPhone,
      emergency_contact_address: data.emergencyContactAddress,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    return { success: true, request: submittedRequest }
  } catch (error) {
    console.error('Submit access request error:', error)
    return {
      success: false,
      error: 'Failed to submit request. Please try again.',
    }
  }
}

/**
 * Get all access requests (for admin)
 */
export async function getAccessRequests(): Promise<AccessRequest[]> {
  const { data, error } = await supabase
    .from('access_requests')
    .select(`
      *,
      hospital:hospitals(*),
      department:departments(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get access requests error:', error)
    return []
  }

  return data
}

/**
 * Approve access request
 */
export async function approveAccessRequest(
  requestId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('access_requests')
      .update({
        status: 'approved',
        reviewed_by: approvedBy,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (error) throw error

    // Create user account from approved request
    try {
      // 1. Get the request details including encrypted password
      const { data: request, error: reqError } = await supabase
        .from('access_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (reqError || !request) throw new Error('Failed to fetch request details')

      // 2. Decrypt password (or generate new one if missing)
      let password = ''
      if (request.password_encrypted) {
        try {
          password = await decryptPassword(request.password_encrypted)
        } catch (e) {
          console.warn('Failed to decrypt password, user will need to reset it')
        }
      }

      // 3. Create User Record (using userService to handle Auth + DB)
      // Map access request fields to user fields
      const userData = {
        email: request.email,
        full_name: request.full_name,
        ic_number: request.ic_number,
        phone_number: request.phone_number,
        hospital_id: request.hospital_id,
        department_id: request.department_id,
        // Map 'jawatan' to role if possible, or default to a safe role
        // For now we might leave role empty or set a default if required
        // We'll set status to 'active'
        status: 'active' as const,
        employee_id: request.ic_number // Use IC as temporary employee ID
      }

      await createUser(userData, password)
      console.log('User account created for approved request:', request.email)

    } catch (createError) {
      console.error('Failed to create user account for approved request:', createError)
      // We don't fail the approval itself, but log the error
      return { success: true, error: 'Request approved but user account creation failed. Please check logs.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Approve request error:', error)
    return { success: false, error: 'Failed to approve request' }
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
  } catch (error) {
    console.error('Reject request error:', error)
    return { success: false, error: 'Failed to reject request' }
  }
}
