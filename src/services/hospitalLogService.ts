// Hospital Log Service - For Hospital Admin System Logs
import { supabase, isSupabaseConfigured } from './supabase'
import type {
  HospitalLog,
  HospitalLogWithRelations,
  HospitalLogCategory,
  HospitalLogSeverity,
  PaginatedResponse,
  SortConfig,
} from '@/types'
import { mockUsers } from './mockData'

// Mock Hospital Logs Data
export const mockHospitalLogs: HospitalLog[] = [
  // Authentication Logs
  {
    id: 'log-001',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    user_id: 'user-003-pharmgr',
    category: 'authentication',
    severity: 'info',
    action: 'login_success',
    description: 'User logged in successfully',
    module: 'auth',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    created_at: '2026-01-05T08:30:00Z',
  },
  {
    id: 'log-002',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    user_id: 'user-002-hospadmin',
    category: 'authentication',
    severity: 'info',
    action: 'login_success',
    description: 'User logged in successfully',
    module: 'auth',
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    created_at: '2026-01-05T08:00:00Z',
  },
  {
    id: 'log-003',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    category: 'authentication',
    severity: 'warning',
    action: 'login_failed',
    description: 'Failed login attempt for user: unknown@test.com',
    module: 'auth',
    ip_address: '192.168.1.200',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    metadata: { attempted_email: 'unknown@test.com', reason: 'invalid_credentials' },
    created_at: '2026-01-05T07:45:00Z',
  },
  // User Activity Logs
  {
    id: 'log-004',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    user_id: 'user-003-pharmgr',
    category: 'user_activity',
    severity: 'info',
    action: 'view_inventory',
    description: 'User viewed pharmacy inventory list',
    module: 'pharmacy',
    entity_type: 'inventory',
    ip_address: '192.168.1.102',
    created_at: '2026-01-05T09:15:00Z',
  },
  {
    id: 'log-005',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    user_id: 'user-003-pharmgr',
    category: 'user_activity',
    severity: 'info',
    action: 'create_requisition',
    description: 'User created purchase requisition PR-2026-001',
    module: 'pharmacy',
    entity_type: 'purchase_requisition',
    entity_id: 'pr-001',
    ip_address: '192.168.1.102',
    created_at: '2026-01-05T10:00:00Z',
  },
  // Administrative Logs
  {
    id: 'log-006',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    user_id: 'user-002-hospadmin',
    category: 'administrative',
    severity: 'info',
    action: 'approve_access_request',
    description: 'Hospital Admin approved access request for Nurul Aisyah',
    module: 'access_requests',
    entity_type: 'access_request',
    entity_id: 'ar-001',
    ip_address: '192.168.1.101',
    metadata: { applicant_name: 'Nurul Aisyah', department: 'Pharmacy' },
    created_at: '2026-01-05T10:30:00Z',
  },
  {
    id: 'log-007',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    user_id: 'user-002-hospadmin',
    category: 'administrative',
    severity: 'info',
    action: 'update_user_status',
    description: 'Updated user status to active',
    module: 'users',
    entity_type: 'user',
    entity_id: 'user-new-001',
    metadata: { old_status: 'pending', new_status: 'active' },
    ip_address: '192.168.1.101',
    created_at: '2026-01-05T10:35:00Z',
  },
  {
    id: 'log-008',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    user_id: 'user-002-hospadmin',
    category: 'administrative',
    severity: 'info',
    action: 'create_department',
    description: 'Created new department: Radiology',
    module: 'departments',
    entity_type: 'department',
    entity_id: 'dept-new-001',
    ip_address: '192.168.1.101',
    created_at: '2026-01-04T14:00:00Z',
  },
  // Security Logs
  {
    id: 'log-009',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    category: 'security',
    severity: 'warning',
    action: 'multiple_failed_logins',
    description: '5 failed login attempts detected from IP 192.168.1.200',
    module: 'auth',
    ip_address: '192.168.1.200',
    metadata: { attempts: 5, time_window: '15 minutes' },
    created_at: '2026-01-05T07:50:00Z',
  },
  {
    id: 'log-010',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    user_id: 'user-003-pharmgr',
    category: 'security',
    severity: 'info',
    action: 'password_change',
    description: 'User changed their password',
    module: 'auth',
    entity_type: 'user',
    entity_id: 'user-003-pharmgr',
    ip_address: '192.168.1.102',
    created_at: '2026-01-04T16:00:00Z',
  },
  {
    id: 'log-011',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    category: 'security',
    severity: 'error',
    action: 'account_lockout',
    description: 'Account locked due to too many failed login attempts',
    module: 'auth',
    entity_type: 'user',
    entity_id: 'user-unknown',
    ip_address: '192.168.1.200',
    metadata: { email: 'test@test.com', lockout_duration: '30 minutes' },
    created_at: '2026-01-05T07:55:00Z',
  },
  // System Logs
  {
    id: 'log-012',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    category: 'system',
    severity: 'info',
    action: 'backup_completed',
    description: 'Daily backup completed successfully',
    module: 'backup',
    metadata: { backup_size: '2.5 GB', duration: '15 minutes' },
    created_at: '2026-01-05T02:00:00Z',
  },
  {
    id: 'log-013',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    category: 'system',
    severity: 'warning',
    action: 'storage_warning',
    description: 'Storage usage has exceeded 80% threshold',
    module: 'storage',
    metadata: { used: '40 GB', total: '50 GB', percentage: 80 },
    created_at: '2026-01-05T06:00:00Z',
  },
  {
    id: 'log-014',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    category: 'system',
    severity: 'critical',
    action: 'api_error',
    description: 'External API integration failed: Pharmacy stock sync',
    module: 'integrations',
    metadata: { api: 'external_pharmacy', error: 'Connection timeout' },
    created_at: '2026-01-04T22:00:00Z',
  },
  // More user activity
  {
    id: 'log-015',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    user_id: 'user-002-hospadmin',
    category: 'user_activity',
    severity: 'info',
    action: 'view_reports',
    description: 'User viewed user activity report',
    module: 'reports',
    ip_address: '192.168.1.101',
    created_at: '2026-01-05T11:00:00Z',
  },
  {
    id: 'log-016',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    user_id: 'user-002-hospadmin',
    category: 'administrative',
    severity: 'info',
    action: 'approve_memo',
    description: 'Approved memo: Annual Staff Appreciation Day',
    module: 'memos',
    entity_type: 'memo',
    entity_id: 'memo-002',
    ip_address: '192.168.1.101',
    created_at: '2026-01-04T10:00:00Z',
  },
  {
    id: 'log-017',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    user_id: 'user-003-pharmgr',
    category: 'authentication',
    severity: 'info',
    action: 'logout',
    description: 'User logged out',
    module: 'auth',
    ip_address: '192.168.1.102',
    created_at: '2026-01-04T18:00:00Z',
  },
  {
    id: 'log-018',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    category: 'security',
    severity: 'warning',
    action: 'unauthorized_access_attempt',
    description: 'Unauthorized attempt to access admin module',
    module: 'admin',
    ip_address: '192.168.1.150',
    metadata: { attempted_route: '/admin/settings', user_role: 'pharmacy_staff' },
    created_at: '2026-01-04T15:30:00Z',
  },
]

// Helper to enrich log with relations
const enrichLogWithRelations = (log: HospitalLog): HospitalLogWithRelations => {
  const user = log.user_id ? mockUsers.find(u => u.id === log.user_id) : undefined
  return {
    ...log,
    user,
  }
}

export interface GetHospitalLogsParams {
  page?: number
  pageSize?: number
  hospitalId?: string
  category?: HospitalLogCategory | 'all'
  severity?: HospitalLogSeverity | 'all'
  userId?: string
  search?: string
  startDate?: string
  endDate?: string
  sort?: SortConfig
}

/**
 * Get hospital logs with filtering and pagination
 */
export async function getHospitalLogs(params: GetHospitalLogsParams = {}): Promise<PaginatedResponse<HospitalLogWithRelations>> {
  const {
    page = 1,
    pageSize = 20,
    hospitalId,
    category,
    severity,
    userId,
    search,
    startDate,
    endDate,
    sort,
  } = params

  if (isSupabaseConfigured()) {
    let query = supabase
      .from('hospital_logs')
      .select('*, user:users(*)', { count: 'exact' })

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (severity && severity !== 'all') {
      query = query.eq('severity', severity)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (search) {
      query = query.or(`action.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    if (sort) {
      query = query.order(sort.key, { ascending: sort.direction === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data as HospitalLogWithRelations[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  } else {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300))

    let filtered = [...mockHospitalLogs]

    if (hospitalId) {
      filtered = filtered.filter(l => l.hospital_id === hospitalId)
    }
    if (category && category !== 'all') {
      filtered = filtered.filter(l => l.category === category)
    }
    if (severity && severity !== 'all') {
      filtered = filtered.filter(l => l.severity === severity)
    }
    if (userId) {
      filtered = filtered.filter(l => l.user_id === userId)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(l =>
        l.action.toLowerCase().includes(searchLower) ||
        l.description.toLowerCase().includes(searchLower)
      )
    }
    if (startDate) {
      filtered = filtered.filter(l => new Date(l.created_at) >= new Date(startDate))
    }
    if (endDate) {
      filtered = filtered.filter(l => new Date(l.created_at) <= new Date(endDate))
    }

    // Sort
    if (sort) {
      filtered.sort((a, b) => {
        const aVal = a[sort.key as keyof HospitalLog]
        const bVal = b[sort.key as keyof HospitalLog]
        if (aVal === undefined || bVal === undefined) return 0
        if (sort.direction === 'asc') {
          return aVal > bVal ? 1 : -1
        }
        return aVal < bVal ? 1 : -1
      })
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paginatedData = filtered.slice(start, start + pageSize)

    return {
      data: paginatedData.map(enrichLogWithRelations),
      total,
      page,
      pageSize,
      totalPages,
    }
  }
}

/**
 * Get log statistics for a hospital
 */
export async function getLogStatistics(hospitalId: string, days: number = 7): Promise<{
  total: number
  byCategory: Record<HospitalLogCategory, number>
  bySeverity: Record<HospitalLogSeverity, number>
  timeline: { date: string; count: number }[]
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString()

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('hospital_logs')
      .select('category, severity, created_at')
      .eq('hospital_id', hospitalId)
      .gte('created_at', startDateStr)

    if (error) throw error

    const byCategory: Record<string, number> = {
      authentication: 0,
      user_activity: 0,
      administrative: 0,
      security: 0,
      system: 0,
    }
    const bySeverity: Record<string, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    }
    const timelineMap: Record<string, number> = {}

    data?.forEach(log => {
      byCategory[log.category] = (byCategory[log.category] || 0) + 1
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1
      
      const date = new Date(log.created_at).toISOString().split('T')[0]
      timelineMap[date] = (timelineMap[date] || 0) + 1
    })

    const timeline = Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      total: data?.length || 0,
      byCategory: byCategory as Record<HospitalLogCategory, number>,
      bySeverity: bySeverity as Record<HospitalLogSeverity, number>,
      timeline,
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 200))

    const logs = mockHospitalLogs.filter(
      l => l.hospital_id === hospitalId && new Date(l.created_at) >= startDate
    )

    const byCategory: Record<string, number> = {
      authentication: 0,
      user_activity: 0,
      administrative: 0,
      security: 0,
      system: 0,
    }
    const bySeverity: Record<string, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    }
    const timelineMap: Record<string, number> = {}

    logs.forEach(log => {
      byCategory[log.category] = (byCategory[log.category] || 0) + 1
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1
      
      const date = new Date(log.created_at).toISOString().split('T')[0]
      timelineMap[date] = (timelineMap[date] || 0) + 1
    })

    const timeline = Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      total: logs.length,
      byCategory: byCategory as Record<HospitalLogCategory, number>,
      bySeverity: bySeverity as Record<HospitalLogSeverity, number>,
      timeline,
    }
  }
}

/**
 * Export logs to CSV format
 */
export function exportLogsToCSV(logs: HospitalLogWithRelations[]): string {
  const headers = ['Timestamp', 'Category', 'Severity', 'User', 'Action', 'Description', 'Module', 'IP Address']
  const rows = logs.map(log => [
    new Date(log.created_at).toLocaleString(),
    log.category,
    log.severity,
    log.user?.full_name || 'System',
    log.action,
    log.description,
    log.module || '-',
    log.ip_address || '-',
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return csvContent
}

