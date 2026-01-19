import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Live functionality will be disabled.')
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co',
  supabaseAnonKey || 'missing-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
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
  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
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
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Delete error:', error)
    return { success: false, error: 'Failed to delete file' }
  }
}

// Create a dedicated anonymous client for public operations
let anonymousClientInstance: ReturnType<typeof createClient> | null = null

export const createAnonymousClient = () => {
  if (anonymousClientInstance) {
    return anonymousClientInstance
  }

  anonymousClientInstance = createClient(
    supabaseUrl || 'https://missing-url.supabase.co',
    supabaseAnonKey || 'missing-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        storageKey: 'supabase.anonymous.auth.token',
      },
    }
  )

  return anonymousClientInstance
}

export default supabase

