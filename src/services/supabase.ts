import { createClient } from '@supabase/supabase-js'

// For local development without Supabase, we'll use mock data
// When ready to connect, add your Supabase URL and Anon Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return (
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-key'
  )
}

// Helper to get storage bucket URL
export const getStorageUrl = (bucket: string, path: string): string => {
  if (!isSupabaseConfigured()) return ''
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

// Helper to upload file to storage
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string | null; error: string | null }> => {
  if (!isSupabaseConfigured()) {
    // For local development, return a placeholder URL
    return { url: URL.createObjectURL(file), error: null }
  }

  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      // Check if it's a bucket not found error
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        throw new Error(`Storage bucket '${bucket}' does not exist. Please create it in Supabase Dashboard → Storage → New Bucket.`)
      }
      throw uploadError
    }

    const url = getStorageUrl(bucket, path)
    return { url, error: null }
  } catch (error: any) {
    console.error('Upload error:', error)
    const errorMessage = error?.message || 'Failed to upload file'
    return { url: null, error: errorMessage }
  }
}

// Helper to delete file from storage
export const deleteFile = async (
  bucket: string,
  path: string
): Promise<{ success: boolean; error: string | null }> => {
  if (!isSupabaseConfigured()) {
    return { success: true, error: null }
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Delete error:', error)
    return { success: false, error: 'Failed to delete file' }
  }
}

// Create a dedicated anonymous client for public operations (no session persistence)
// This ensures we always use the anon role for public form submissions
// Using a singleton pattern to avoid multiple GoTrueClient instances
let anonymousClientInstance: ReturnType<typeof createClient> | null = null

export const createAnonymousClient = () => {
  if (!isSupabaseConfigured()) {
    return supabase // Fallback to main client if not configured
  }
  
  // Return singleton instance if already created
  if (anonymousClientInstance) {
    return anonymousClientInstance
  }
  
  // Create new instance with unique storage key to avoid conflicts
  anonymousClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: 'supabase.anonymous.auth.token', // Unique storage key to avoid conflicts
    },
  })
  
  return anonymousClientInstance
}

export default supabase

