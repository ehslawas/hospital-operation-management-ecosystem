// @ts-nocheck
import { supabase, isSupabaseConfigured, uploadFile } from '@/services/supabase'
import { mockUsers, mockAuditLogs } from '@/services/mockData'
import type { User, UserWithRelations, AuditLogWithRelations, Gender } from '@/types'

export interface UpdateProfileInput {
  full_name?: string
  phone_number?: string
  date_of_birth?: string
  gender?: Gender
  address?: string
}

export interface ProfileAuditLogItem {
  id: string
  action: string
  module: string
  created_at: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  changes: Array<{
    field: string
    label: string
    oldValue: any
    newValue: any
  }>
}

const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full Name',
  phone_number: 'Phone Number',
  date_of_birth: 'Date of Birth',
  gender: 'Gender',
  address: 'Address',
  profile_photo_url: 'Profile Photo',
}

const LOCAL_STORAGE_LOGS_KEY = 'hom_profile_audit_logs'

/**
 * Helper to get locally stored profile logs for development / fallback
 */
function getLocalLogs(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Helper to store local profile logs
 */
function saveLocalLog(entry: any) {
  try {
    const logs = getLocalLogs()
    logs.unshift(entry)
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs.slice(0, 100)))
  } catch (err) {
    console.error('Failed to save local profile log:', err)
  }
}

/**
 * Helper to compute diff between old user state and new updates
 */
export function computeProfileDiff(
  oldUser: Partial<User>,
  updates: Record<string, any>
): {
  old_values: Record<string, any>
  new_values: Record<string, any>
  changes: Array<{ field: string; label: string; oldValue: any; newValue: any }>
} {
  const old_values: Record<string, any> = {}
  const new_values: Record<string, any> = {}
  const changes: Array<{ field: string; label: string; oldValue: any; newValue: any }> = []

  for (const [key, newVal] of Object.entries(updates)) {
    const oldVal = (oldUser as any)[key] ?? ''
    const normalizedNew = newVal ?? ''
    
    // Check if value actually changed
    if (String(oldVal).trim() !== String(normalizedNew).trim()) {
      old_values[key] = oldVal || null
      new_values[key] = normalizedNew || null
      changes.push({
        field: key,
        label: FIELD_LABELS[key] || key.replace(/_/g, ' '),
        oldValue: oldVal || '—',
        newValue: normalizedNew || '—',
      })
    }
  }

  return { old_values, new_values, changes }
}

/**
 * Update user personal information and record audit log
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
  currentUser: UserWithRelations
): Promise<{ success: boolean; user?: UserWithRelations; error?: string }> {
  try {
    const { old_values, new_values, changes } = computeProfileDiff(currentUser, input)

    if (changes.length === 0) {
      return { success: true, user: currentUser }
    }

    const updatedAt = new Date().toISOString()
    let updatedUser: UserWithRelations

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...input,
          updated_at: updatedAt,
        })
        .eq('id', userId)
        .select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*)
        `)
        .maybeSingle()

      if (error) throw error
      updatedUser = (data as UserWithRelations) || { ...currentUser, ...input, updated_at: updatedAt }

      // Insert into audit_logs table
      try {
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'UPDATE_PROFILE',
          module: 'profile',
          entity_type: 'users',
          entity_id: userId,
          old_values,
          new_values,
          created_at: updatedAt,
        })
      } catch (logErr) {
        console.warn('Could not insert audit log into database:', logErr)
      }
    } else {
      // Mock Data update
      const userIndex = mockUsers.findIndex((u) => u.id === userId)
      if (userIndex !== -1) {
        mockUsers[userIndex] = {
          ...mockUsers[userIndex],
          ...input,
          updated_at: updatedAt,
        }
      }

      updatedUser = {
        ...currentUser,
        ...input,
        updated_at: updatedAt,
      }
    }

    // Persist to local mock audit logs
    const logEntry = {
      id: `audit-${Date.now()}`,
      user_id: userId,
      action: 'UPDATE_PROFILE',
      module: 'profile',
      entity_type: 'users',
      entity_id: userId,
      old_values,
      new_values,
      created_at: updatedAt,
      updated_at: updatedAt,
      changes,
    }
    mockAuditLogs.unshift(logEntry)
    saveLocalLog(logEntry)

    return { success: true, user: updatedUser }
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return {
      success: false,
      error: error?.message || 'Failed to update personal information',
    }
  }
}

/**
 * Upload and update profile photo
 */
export async function updateProfilePhoto(
  file: File,
  userId: string,
  currentUser: UserWithRelations
): Promise<{ success: boolean; photoUrl?: string; user?: UserWithRelations; error?: string }> {
  try {
    let finalPhotoUrl = ''

    if (isSupabaseConfigured()) {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`

      // Attempt upload to 'avatar' or 'avatars' bucket
      const uploadRes = await uploadFile('avatar', filePath, file)
      
      if (uploadRes.url) {
        finalPhotoUrl = uploadRes.url
      } else {
        // Try fallback to 'avatars' bucket if 'avatar' had bucket issue
        const secondAttempt = await uploadFile('avatars', filePath, file)
        if (secondAttempt.url) {
          finalPhotoUrl = secondAttempt.url
        } else {
          // If storage bucket isn't setup, read as Base64 Data URL so user is never blocked
          finalPhotoUrl = await readFileAsDataUrl(file)
        }
      }
    } else {
      // Local development: read as Data URL
      finalPhotoUrl = await readFileAsDataUrl(file)
    }

    const oldPhotoUrl = currentUser.profile_photo_url || ''
    const updatedAt = new Date().toISOString()

    const old_values = { profile_photo_url: oldPhotoUrl || null }
    const new_values = { profile_photo_url: finalPhotoUrl }

    let updatedUser: UserWithRelations

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .update({
          profile_photo_url: finalPhotoUrl,
          updated_at: updatedAt,
        })
        .eq('id', userId)
        .select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*)
        `)
        .maybeSingle()

      if (error) {
        console.warn('Failed to update photo in database, updating local state:', error)
      }
      updatedUser = (data as UserWithRelations) || {
        ...currentUser,
        profile_photo_url: finalPhotoUrl,
        updated_at: updatedAt,
      }

      try {
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'UPDATE_PROFILE_PHOTO',
          module: 'profile',
          entity_type: 'users',
          entity_id: userId,
          old_values,
          new_values,
          created_at: updatedAt,
        })
      } catch (logErr) {
        console.warn('Could not insert audit log into database:', logErr)
      }
    } else {
      const userIndex = mockUsers.findIndex((u) => u.id === userId)
      if (userIndex !== -1) {
        mockUsers[userIndex] = {
          ...mockUsers[userIndex],
          profile_photo_url: finalPhotoUrl,
          updated_at: updatedAt,
        }
      }
      updatedUser = {
        ...currentUser,
        profile_photo_url: finalPhotoUrl,
        updated_at: updatedAt,
      }
    }

    const logEntry = {
      id: `audit-${Date.now()}`,
      user_id: userId,
      action: 'UPDATE_PROFILE_PHOTO',
      module: 'profile',
      entity_type: 'users',
      entity_id: userId,
      old_values,
      new_values,
      created_at: updatedAt,
      updated_at: updatedAt,
      changes: [
        {
          field: 'profile_photo_url',
          label: 'Profile Photo',
          oldValue: oldPhotoUrl ? 'Existing Photo' : 'None',
          newValue: 'Updated Photo',
        },
      ],
    }
    mockAuditLogs.unshift(logEntry)
    saveLocalLog(logEntry)

    return {
      success: true,
      photoUrl: finalPhotoUrl,
      user: updatedUser,
    }
  } catch (error: any) {
    console.error('Error uploading profile photo:', error)
    return {
      success: false,
      error: error?.message || 'Failed to upload profile photo',
    }
  }
}

/**
 * Remove user profile photo
 */
export async function removeProfilePhoto(
  userId: string,
  currentUser: UserWithRelations
): Promise<{ success: boolean; user?: UserWithRelations; error?: string }> {
  try {
    const oldPhotoUrl = currentUser.profile_photo_url || ''
    const updatedAt = new Date().toISOString()

    const old_values = { profile_photo_url: oldPhotoUrl }
    const new_values = { profile_photo_url: null }

    let updatedUser: UserWithRelations

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .update({
          profile_photo_url: null,
          updated_at: updatedAt,
        })
        .eq('id', userId)
        .select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*)
        `)
        .maybeSingle()

      if (error) throw error
      updatedUser = (data as UserWithRelations) || {
        ...currentUser,
        profile_photo_url: undefined,
        updated_at: updatedAt,
      }

      try {
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'REMOVE_PROFILE_PHOTO',
          module: 'profile',
          entity_type: 'users',
          entity_id: userId,
          old_values,
          new_values,
          created_at: updatedAt,
        })
      } catch (logErr) {
        console.warn('Could not insert audit log into database:', logErr)
      }
    } else {
      const userIndex = mockUsers.findIndex((u) => u.id === userId)
      if (userIndex !== -1) {
        mockUsers[userIndex] = {
          ...mockUsers[userIndex],
          profile_photo_url: undefined,
          updated_at: updatedAt,
        }
      }
      updatedUser = {
        ...currentUser,
        profile_photo_url: undefined,
        updated_at: updatedAt,
      }
    }

    const logEntry = {
      id: `audit-${Date.now()}`,
      user_id: userId,
      action: 'REMOVE_PROFILE_PHOTO',
      module: 'profile',
      entity_type: 'users',
      entity_id: userId,
      old_values,
      new_values,
      created_at: updatedAt,
      updated_at: updatedAt,
      changes: [
        {
          field: 'profile_photo_url',
          label: 'Profile Photo',
          oldValue: 'Existing Photo',
          newValue: 'Removed (Default Initials)',
        },
      ],
    }
    mockAuditLogs.unshift(logEntry)
    saveLocalLog(logEntry)

    return {
      success: true,
      user: updatedUser,
    }
  } catch (error: any) {
    console.error('Error removing profile photo:', error)
    return {
      success: false,
      error: error?.message || 'Failed to remove profile photo',
    }
  }
}

/**
 * Get profile audit logs for a specific user
 */
export async function getUserProfileAuditLogs(userId: string): Promise<ProfileAuditLogItem[]> {
  const localLogs = getLocalLogs().filter((l) => l.user_id === userId || l.entity_id === userId)

  try {
    let dbLogs: any[] = []

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or(`user_id.eq.${userId},entity_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        dbLogs = data
      }
    } else {
      dbLogs = mockAuditLogs.filter((l) => l.user_id === userId || l.entity_id === userId)
    }

    // Merge logs avoiding duplicates by ID or timestamp+action
    const combined = [...localLogs, ...dbLogs]
    const seenIds = new Set<string>()
    const uniqueLogs: any[] = []

    for (const log of combined) {
      const key = log.id || `${log.action}-${log.created_at}`
      if (!seenIds.has(key)) {
        seenIds.add(key)
        uniqueLogs.push(log)
      }
    }

    // Sort descending by date
    uniqueLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Map each log into ProfileAuditLogItem with formatted changes
    return uniqueLogs.map((log) => {
      const changes: Array<{ field: string; label: string; oldValue: any; newValue: any }> = []

      if (log.changes && Array.isArray(log.changes) && log.changes.length > 0) {
        changes.push(...log.changes)
      } else if (log.old_values || log.new_values) {
        const oldVals = log.old_values || {}
        const newVals = log.new_values || {}
        const allKeys = Array.from(new Set([...Object.keys(oldVals), ...Object.keys(newVals)]))

        for (const key of allKeys) {
          const oldV = oldVals[key]
          const newV = newVals[key]
          if (oldV !== newV) {
            changes.push({
              field: key,
              label: FIELD_LABELS[key] || key.replace(/_/g, ' '),
              oldValue: oldV ?? '—',
              newValue: newV ?? '—',
            })
          }
        }
      }

      return {
        id: log.id || `log-${Math.random().toString(36).substring(2, 9)}`,
        action: log.action,
        module: log.module || 'profile',
        created_at: log.created_at || new Date().toISOString(),
        old_values: log.old_values,
        new_values: log.new_values,
        changes,
      }
    })
  } catch (error) {
    console.error('Error fetching profile audit logs:', error)
    return localLogs.map((log) => ({
      id: log.id,
      action: log.action,
      module: log.module,
      created_at: log.created_at,
      old_values: log.old_values,
      new_values: log.new_values,
      changes: log.changes || [],
    }))
  }
}

/**
 * Convert file to base64 DataURL
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}
