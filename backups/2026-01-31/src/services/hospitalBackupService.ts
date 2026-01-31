// Hospital Backup Service - Backup Monitoring for Hospital Admin
import { supabase, isSupabaseConfigured } from './supabase'
import type {
  HospitalBackupInfo,
  SystemBackup,
  PaginatedResponse,
} from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

/**
 * Get hospital backup information
 */
export async function getHospitalBackupInfo(hospitalId: string): Promise<HospitalBackupInfo> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('system_backups')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    const backups = data as SystemBackup[]
    const lastBackup = backups.find(b => b.status === 'completed') || null

    // Calculate next scheduled backup (2:00 AM next day)
    const nextScheduled = new Date()
    nextScheduled.setDate(nextScheduled.getDate() + 1)
    nextScheduled.setHours(2, 0, 0, 0)

    // Calculate total storage used
    const totalSize = backups
      .filter(b => b.status === 'completed' && b.file_size)
      .reduce((sum, b) => sum + (b.file_size || 0), 0)

    return {
      hospital_id: hospitalId,
      last_backup: lastBackup,
      next_scheduled: nextScheduled.toISOString(),
      backup_history: backups,
      storage_used_gb: totalSize / (1024 * 1024 * 1024),
      storage_quota_gb: 100,
      retention_days: 30,
    }
  } else {
    // Return empty state if Supabase not configured
    return {
      hospital_id: hospitalId,
      last_backup: null,
      next_scheduled: new Date().toISOString(),
      backup_history: [],
      storage_used_gb: 0,
      storage_quota_gb: 100,
      retention_days: 30,
    }
  }
}

/**
 * Get backup statistics
 */
export interface BackupStatistics {
  total_backups: number
  successful_backups: number
  failed_backups: number
  success_rate: number
  avg_backup_size_gb: number
  avg_backup_duration_minutes: number
  last_7_days: { date: string; status: 'completed' | 'failed' }[]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getBackupStatistics(hospitalId: string, days: number = 30): Promise<BackupStatistics> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('system_backups')
      .select('*')
      .eq('hospital_id', hospitalId)
      .gte('created_at', startDate.toISOString())

    if (error) throw error

    const backups = data as SystemBackup[]

    // Calculate statistics from real data
    const successful = backups.filter(b => b.status === 'completed')
    const failed = backups.filter(b => b.status === 'failed')

    // Calculate average size
    const avgSize = successful.reduce((sum, b) => sum + (b.file_size || 0), 0) / (successful.length || 1)

    // Calculate average duration
    const durations = successful
      .filter(b => b.started_at && b.completed_at)
      .map(b => {
        const start = new Date(b.started_at!).getTime()
        const end = new Date(b.completed_at!).getTime()
        return (end - start) / (1000 * 60) // minutes
      })
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / (durations.length || 1)

    // Last 7 days
    const last7Days: { date: string; status: 'completed' | 'failed' }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayBackup = backups.find(b =>
        b.created_at && b.created_at.startsWith(dateStr) && b.backup_type === 'scheduled'
      )

      last7Days.push({
        date: dateStr,
        status: dayBackup?.status === 'failed' ? 'failed' : 'completed',
      })
    }

    return {
      total_backups: backups.length,
      successful_backups: successful.length,
      failed_backups: failed.length,
      success_rate: backups.length > 0 ? Math.round((successful.length / backups.length) * 100) : 0,
      avg_backup_size_gb: Math.round((avgSize / (1024 * 1024 * 1024)) * 100) / 100,
      avg_backup_duration_minutes: Math.round(avgDuration * 10) / 10,
      last_7_days: last7Days,
    }
  }

  return {
    total_backups: 0,
    successful_backups: 0,
    failed_backups: 0,
    success_rate: 0,
    avg_backup_size_gb: 0,
    avg_backup_duration_minutes: 0,
    last_7_days: [],
  }
}

/**
 * Format backup size for display
 */
export function formatBackupSize(bytes: number | undefined): string {
  if (!bytes) return 'N/A'

  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`
  }

  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

/**
 * Format backup duration for display
 */
export function formatBackupDuration(startedAt: string | undefined, completedAt: string | undefined): string {
  if (!startedAt || !completedAt) return 'N/A'

  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()
  const durationMs = end - start

  const minutes = Math.floor(durationMs / (1000 * 60))
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

/**
 * Get backup alerts
 */
export interface BackupAlert {
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getBackupAlerts(hospitalId: string): Promise<BackupAlert[]> {
  if (isSupabaseConfigured()) {
    // In a real implementation, we would query a system_alerts table or analyze backups
    return []
  }

  return []
}

/**
 * Get paginated hospital backups
 */
export async function getHospitalBackups(
  hospitalId: string,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<SystemBackup>> {
  if (isSupabaseConfigured()) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('system_backups')
      .select('*', { count: 'exact' })
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      data: (data || []) as SystemBackup[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  } else {
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }
}

/**
 * Get latest hospital backup
 */
export async function getLatestHospitalBackup(hospitalId: string): Promise<{ data: SystemBackup | null }> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('system_backups')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)

    if (error) throw error

    const latest = (data && data[0]) || null
    return { data: latest as SystemBackup | null }
  } else {
    return { data: null }
  }
}

/**
 * Create manual backup for hospital
 */
export async function createManualHospitalBackup(hospitalId: string, initiatedBy: string): Promise<SystemBackup> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('system_backups')
      .insert({
        hospital_id: hospitalId,
        backup_type: 'manual',
        status: 'pending',
        initiated_by: initiatedBy,
      })
      .select()
      .single()

    if (error) throw error
    return data as SystemBackup
  } else {
    throw new Error("Supabase not configured")
  }
}

/**
 * Get download URL for hospital backup
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getHospitalBackupDownloadUrl(backupId: string, hospitalId: string): Promise<string> {
  if (isSupabaseConfigured()) {
    // Would generate signed URL from storage
    return `/api/backups/${backupId}/download`
  } else {
    return ''
  }
}

