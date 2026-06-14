// Hospital Backup Service - Backup Monitoring for Hospital Admin
import { supabase, isSupabaseConfigured } from './supabase'
import type {
  HospitalBackupInfo,
  SystemBackup,
  PaginatedResponse,
} from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

// Mock backup data
const mockBackupHistory: SystemBackup[] = [
  {
    id: 'backup-001',
    backup_type: 'scheduled',
    status: 'completed',
    file_path: '/backups/2026/01/05/hospital_hkl_20260105_0200.sql.gz',
    file_size: 2684354560, // 2.5 GB
    started_at: '2026-01-05T02:00:00Z',
    completed_at: '2026-01-05T02:15:32Z',
    initiated_by: 'system',
    created_at: '2026-01-05T02:00:00Z',
  },
  {
    id: 'backup-002',
    backup_type: 'scheduled',
    status: 'completed',
    file_path: '/backups/2026/01/04/hospital_hkl_20260104_0200.sql.gz',
    file_size: 2680000000, // ~2.5 GB
    started_at: '2026-01-04T02:00:00Z',
    completed_at: '2026-01-04T02:14:45Z',
    initiated_by: 'system',
    created_at: '2026-01-04T02:00:00Z',
  },
  {
    id: 'backup-003',
    backup_type: 'manual',
    status: 'completed',
    file_path: '/backups/2026/01/03/hospital_hkl_manual_20260103_1430.sql.gz',
    file_size: 2678000000,
    started_at: '2026-01-03T14:30:00Z',
    completed_at: '2026-01-03T14:44:22Z',
    initiated_by: 'user-001-sysadmin',
    created_at: '2026-01-03T14:30:00Z',
  },
  {
    id: 'backup-004',
    backup_type: 'scheduled',
    status: 'completed',
    file_path: '/backups/2026/01/03/hospital_hkl_20260103_0200.sql.gz',
    file_size: 2675000000,
    started_at: '2026-01-03T02:00:00Z',
    completed_at: '2026-01-03T02:14:18Z',
    initiated_by: 'system',
    created_at: '2026-01-03T02:00:00Z',
  },
  {
    id: 'backup-005',
    backup_type: 'scheduled',
    status: 'failed',
    file_path: '/backups/2026/01/02/hospital_hkl_20260102_0200.sql.gz',
    started_at: '2026-01-02T02:00:00Z',
    completed_at: '2026-01-02T02:05:33Z',
    initiated_by: 'system',
    error_message: 'Database connection timeout - retry scheduled',
    created_at: '2026-01-02T02:00:00Z',
  },
  {
    id: 'backup-006',
    backup_type: 'scheduled',
    status: 'completed',
    file_path: '/backups/2026/01/02/hospital_hkl_20260102_0300.sql.gz',
    file_size: 2670000000,
    started_at: '2026-01-02T03:00:00Z',
    completed_at: '2026-01-02T03:14:55Z',
    initiated_by: 'system',
    created_at: '2026-01-02T03:00:00Z',
  },
  {
    id: 'backup-007',
    backup_type: 'scheduled',
    status: 'completed',
    file_path: '/backups/2026/01/01/hospital_hkl_20260101_0200.sql.gz',
    file_size: 2668000000,
    started_at: '2026-01-01T02:00:00Z',
    completed_at: '2026-01-01T02:13:42Z',
    initiated_by: 'system',
    created_at: '2026-01-01T02:00:00Z',
  },
  {
    id: 'backup-008',
    backup_type: 'pre_update',
    status: 'completed',
    file_path: '/backups/2025/12/31/hospital_hkl_preupdate_20251231_2300.sql.gz',
    file_size: 2665000000,
    started_at: '2025-12-31T23:00:00Z',
    completed_at: '2025-12-31T23:14:08Z',
    initiated_by: 'system',
    created_at: '2025-12-31T23:00:00Z',
  },
]

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
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300))

    const lastBackup = mockBackupHistory.find(b => b.status === 'completed') || null

    // Calculate next scheduled backup
    const nextScheduled = new Date()
    nextScheduled.setDate(nextScheduled.getDate() + 1)
    nextScheduled.setHours(2, 0, 0, 0)

    // Calculate total storage used
    const totalSize = mockBackupHistory
      .filter(b => b.status === 'completed' && b.file_size)
      .reduce((sum, b) => sum + (b.file_size || 0), 0)

    return {
      hospital_id: hospitalId,
      last_backup: lastBackup,
      next_scheduled: nextScheduled.toISOString(),
      backup_history: mockBackupHistory,
      storage_used_gb: Math.round((totalSize / (1024 * 1024 * 1024)) * 100) / 100,
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
    // Calculate statistics from backups
  }

  await new Promise(resolve => setTimeout(resolve, 200))

  const recentBackups = mockBackupHistory.filter(
    b => new Date(b.created_at) >= startDate
  )

  const successful = recentBackups.filter(b => b.status === 'completed')
  const failed = recentBackups.filter(b => b.status === 'failed')

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
    
    const dayBackup = recentBackups.find(b => 
      b.created_at.startsWith(dateStr) && b.backup_type === 'scheduled'
    )
    
    last7Days.push({
      date: dateStr,
      status: dayBackup?.status === 'failed' ? 'failed' : 'completed',
    })
  }

  return {
    total_backups: recentBackups.length,
    successful_backups: successful.length,
    failed_backups: failed.length,
    success_rate: Math.round((successful.length / recentBackups.length) * 100),
    avg_backup_size_gb: Math.round((avgSize / (1024 * 1024 * 1024)) * 100) / 100,
    avg_backup_duration_minutes: Math.round(avgDuration * 10) / 10,
    last_7_days: last7Days,
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

export async function getBackupAlerts(hospitalId: string): Promise<BackupAlert[]> {
  if (isSupabaseConfigured()) {
    // Would query backup alerts
  }

  await new Promise(resolve => setTimeout(resolve, 100))

  const alerts: BackupAlert[] = []

  // Check for recent failures
  const recentFailure = mockBackupHistory.find(b => b.status === 'failed')
  if (recentFailure) {
    alerts.push({
      type: 'warning',
      message: `Backup failed on ${new Date(recentFailure.created_at).toLocaleDateString()}: ${recentFailure.error_message}`,
      timestamp: recentFailure.created_at,
    })
  }

  // Check storage usage
  const totalSize = mockBackupHistory
    .filter(b => b.status === 'completed' && b.file_size)
    .reduce((sum, b) => sum + (b.file_size || 0), 0)
  const usedGb = totalSize / (1024 * 1024 * 1024)
  const quotaGb = 100

  if (usedGb / quotaGb > 0.8) {
    alerts.push({
      type: 'warning',
      message: `Backup storage usage at ${Math.round(usedGb / quotaGb * 100)}%. Consider cleaning old backups.`,
      timestamp: new Date().toISOString(),
    })
  }

  return alerts
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
    await new Promise(resolve => setTimeout(resolve, 300))

    const filtered = [...mockBackupHistory]
    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paginatedData = filtered.slice(start, start + pageSize)

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages,
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
    await new Promise(resolve => setTimeout(resolve, 200))
    const latest = mockBackupHistory.find(b => b.status === 'completed') || null
    return { data: latest }
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
    await new Promise(resolve => setTimeout(resolve, 500))
    const newBackup: SystemBackup = {
      id: `backup-${Date.now()}`,
      backup_type: 'manual',
      status: 'pending',
      initiated_by: initiatedBy,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
    }
    mockBackupHistory.unshift(newBackup)
    return newBackup
  }
}

/**
 * Get download URL for hospital backup
 */
export async function getHospitalBackupDownloadUrl(backupId: string, hospitalId: string): Promise<string> {
  if (isSupabaseConfigured()) {
    // Would generate signed URL from storage
    return `/api/backups/${backupId}/download`
  } else {
    await new Promise(resolve => setTimeout(resolve, 200))
    return `/api/backups/${backupId}/download`
  }
}

