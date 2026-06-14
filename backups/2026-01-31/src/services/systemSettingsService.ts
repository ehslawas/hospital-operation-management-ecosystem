import { supabase } from './supabase'
import type { SystemSettings } from '@/types'

// Default system settings
const defaultSettings: SystemSettings = {
  id: 'system-settings',
  app_name: 'HOME',
  app_version: '1.0.0',
  maintenance_mode: false,
  maintenance_message: '',
  session_timeout_minutes: 60,
  max_login_attempts: 5,
  lockout_duration_minutes: 30,
  password_min_length: 8,
  password_require_uppercase: true,
  password_require_lowercase: true,
  password_require_numbers: true,
  password_require_special: false,
  password_expiry_days: 90,
  require_email_verification: false,
  allow_registration: false,
  default_user_role: '',
  backup_enabled: true,
  backup_frequency_hours: 24,
  backup_retention_days: 30,
  log_retention_days: 90,
  email_enabled: true,
  email_from_address: 'noreply@home.gov.my',
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_encryption: 'tls',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

/**
 * Get system settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'system-settings')
      .maybeSingle()

    if (error) {
      // If table doesn't exist or settings don't exist, return defaults
      // Error code PGRST116 = no rows found, but table exists
      // Other errors might mean table doesn't exist yet
      console.warn('Error fetching system settings, using defaults:', error.message)
      return defaultSettings
    }

    return (data || defaultSettings) as SystemSettings
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return defaultSettings
  }
}

/**
 * Update system settings
 */
export async function updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert(
        {
          id: 'system-settings',
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as SystemSettings
  } catch (error) {
    console.error('Error updating system settings:', error)
    throw error
  }
}

/**
 * Reset system settings to defaults
 */
export async function resetSystemSettings(): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert(
        {
          ...defaultSettings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as SystemSettings
  } catch (error) {
    console.error('Error resetting system settings:', error)
    throw error
  }
}

