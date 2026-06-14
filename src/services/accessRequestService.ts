import { supabase, isSupabaseConfigured, uploadFile, createAnonymousClient } from './supabase'
import { mockAccessRequests, mockHospitals, mockDepartments, getDepartmentsByHospitalId } from './mockData'
import type { AccessRequest, Hospital, Department, AccessRequestFormData } from '@/types'
import { generateId } from '@/lib/utils'
import { hashPassword } from '@/lib/passwordUtils'
import { encryptPassword } from '@/lib/encryptionUtils'

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
  if (isSupabaseConfigured()) {
    try {
      // First try to get all hospitals regardless of status to debug
      const { data: allHospitals, error: allError } = await supabase
        .from('hospitals')
        .select('*')
        .order('hospital_name')

      if (allError) {
        console.error('Get all hospitals error:', allError)
        throw allError
      }

      console.log('All hospitals from DB:', allHospitals) // Debug log

      // Filter active hospitals (or include all if status is null/undefined)
      const activeHospitals = (allHospitals || []).filter(
        (h: Hospital) => !h.status || h.status === 'active'
      )
      
      console.log('Active hospitals:', activeHospitals) // Debug log

      if (activeHospitals.length === 0 && (allHospitals || []).length > 0) {
        console.warn('No active hospitals found, but hospitals exist. Hospital statuses:', 
          (allHospitals || []).map((h: Hospital) => ({ id: h.id, name: h.hospital_name, status: h.status }))
        )
      }

      return activeHospitals as Hospital[]
    } catch (error) {
      console.error('Error in getHospitals:', error)
      throw error
    }
  } else {
    return mockHospitals.filter((h) => h.status === 'active')
  }
}

/**
 * Get departments by hospital ID
 * Only returns departments that correspond to enabled modules for the hospital
 */
export async function getDepartments(hospitalId: string): Promise<Department[]> {
  if (isSupabaseConfigured()) {
    // Get departments that correspond to enabled modules
    // Departments are synced from enabled modules, so we just need active departments
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('status', 'active')
      .order('department_name')

    if (error) {
      console.error('Get departments error:', error)
      return []
    }

    // Verify these departments correspond to enabled modules
    // Get enabled modules for this hospital
    const { data: enabledModules } = await supabase
      .from('hospital_modules')
      .select('module_code')
      .eq('hospital_id', hospitalId)
      .eq('is_enabled', true)

    if (enabledModules && enabledModules.length > 0) {
      const enabledModuleCodes = new Set(enabledModules.map((m) => m.module_code))
      // Filter departments to only those matching enabled module codes
      return (data || []).filter((dept) => enabledModuleCodes.has(dept.department_code))
    }

    return data || []
  } else {
    return getDepartmentsByHospitalId(hospitalId).filter((d) => d.status === 'active')
  }
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

    let profilePhotoUrl: string

    // Upload profile photo (required)
    try {
      const fileName = `access-requests/${generateId()}-${profilePhoto.name}`
      const uploadResult = await uploadFile('avatar', fileName, profilePhoto)
      
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
          error: `Storage bucket 'avatars' does not exist. Please create it in Supabase Dashboard:\n1. Go to Storage → New Bucket\n2. Name it 'avatars'\n3. Set it to Public\n4. Create the bucket and try again.`,
        }
      }
      return {
        success: false,
        error: `Failed to upload profile photo: ${errorMessage}`,
      }
    }

    if (isSupabaseConfigured()) {
      // Hash the password for verification/backup
      const passwordHash = await hashPassword(data.password)
      
      // Encrypt the plain password for Supabase Auth account creation
      // This will be decrypted during approval and then deleted
      const passwordEncrypted = await encryptPassword(data.password)

      // Use a dedicated anonymous client for public access request submission
      // This ensures we always use the anon role without any session interference
      const anonymousClient = createAnonymousClient()

      // We perform the insert without .select() to avoid RLS issues with the RETURNING clause
      const { error } = await anonymousClient
        .from('access_requests')
        .insert({
          full_name: data.fullName,
          email: data.email,
          ic_number: data.icNumber,
          phone_number: data.phoneNumber,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
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
        })

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
      // We can return a mock request object with the data we have, 
      // since the UI just needs to show success.
      const mockRequest: AccessRequest = {
        id: 'new-request',
        full_name: data.fullName,
        email: data.email,
        ic_number: data.icNumber,
        phone_number: data.phoneNumber,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
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
      }

      return { success: true, request: mockRequest }
    } else {
      // Mock - simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newRequest: AccessRequest = {
        id: generateId(),
        full_name: data.fullName,
        email: data.email,
        ic_number: data.icNumber,
        phone_number: data.phoneNumber,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
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
        updated_at: new Date().toISOString(),
      }

      mockAccessRequests.push(newRequest)

      return { success: true, request: newRequest }
    }
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
  if (isSupabaseConfigured()) {
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
  } else {
    return [...mockAccessRequests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }
}

/**
 * Approve access request
 */
export async function approveAccessRequest(
  requestId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('access_requests')
        .update({
          status: 'approved',
          reviewed_by: approvedBy,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) throw error

      // TODO: Create user account from approved request

      return { success: true }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const request = mockAccessRequests.find((r) => r.id === requestId)
      if (request) {
        request.status = 'approved'
        request.reviewed_by = approvedBy
        request.reviewed_at = new Date().toISOString()
      }
      return { success: true }
    }
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
    if (isSupabaseConfigured()) {
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
      await new Promise((resolve) => setTimeout(resolve, 800))
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
    console.error('Reject request error:', error)
    return { success: false, error: 'Failed to reject request' }
  }
}

