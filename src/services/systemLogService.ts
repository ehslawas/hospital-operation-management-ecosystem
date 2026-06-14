// System Log Service - For System Admin to view logs from all hospitals
import { supabase, isSupabaseConfigured } from './supabase'
import type {
  HospitalLog,
  HospitalLogWithRelations,
  HospitalLogCategory,
  HospitalLogSeverity,
  PaginatedResponse,
  SortConfig,
  Hospital,
  User,
} from '@/types'
// System Log Service - For System Admin to view logs from all hospitals

// Extended type for system logs that includes hospital info
export interface SystemLogWithRelations extends HospitalLogWithRelations {
  hospital?: Hospital
}

export interface GetSystemLogsParams {
  page?: number
  pageSize?: number
  hospitalId?: string
  category?: HospitalLogCategory | 'all'
  severity?: HospitalLogSeverity | 'all'
  userId?: string
  module?: string
  action?: string
  search?: string
  startDate?: string
  endDate?: string
  sort?: SortConfig
}

// Helper to enrich log with relations including hospital (only used when Supabase returns relations)

/**
 * Get system-wide logs from all hospitals (System Admin only)
 */
export async function getSystemLogs(
  params: GetSystemLogsParams = {}
): Promise<PaginatedResponse<SystemLogWithRelations>> {
  const {
    page = 1,
    pageSize = 20,
    hospitalId,
    category,
    severity,
    userId,
    module,
    action,
    search,
    startDate,
    endDate,
    sort,
  } = params

  if (isSupabaseConfigured()) {
    let query = supabase
      .from('hospital_logs')
      .select('*, user:users(*), hospital:hospitals(*)', { count: 'exact' })

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
    if (module) {
      query = query.eq('module', module)
    }
    if (action) {
      query = query.eq('action', action)
    }
    if (search) {
      query = query.or(`action.ilike.%${search}%,description.ilike.%${search}%,module.ilike.%${search}%`)
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
      data: (data || []) as SystemLogWithRelations[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  } else {
    // Supabase is required for System Logs
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
 * Get system log statistics
 */
export async function getSystemLogStatistics(days: number = 7): Promise<{
  total: number
  byCategory: Record<HospitalLogCategory, number>
  bySeverity: Record<HospitalLogSeverity, number>
  byHospital: { hospital_id: string; hospital_name: string; count: number }[]
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString()

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('hospital_logs')
      .select('category, severity, hospital_id, hospital:hospitals(hospital_name)')
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
    const byHospitalMap: Record<string, { hospital_id: string; hospital_name: string; count: number }> = {}

    data?.forEach((log: any) => {
      byCategory[log.category] = (byCategory[log.category] || 0) + 1
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1

      const hospitalId = log.hospital_id
      if (!byHospitalMap[hospitalId]) {
        byHospitalMap[hospitalId] = {
          hospital_id: hospitalId,
          hospital_name: log.hospital?.hospital_name || 'Unknown',
          count: 0,
        }
      }
      byHospitalMap[hospitalId].count++
    })

    return {
      total: data?.length || 0,
      byCategory: byCategory as Record<HospitalLogCategory, number>,
      bySeverity: bySeverity as Record<HospitalLogSeverity, number>,
      byHospital: Object.values(byHospitalMap),
    }
  } else {
    // Supabase is required
    return {
      total: 0,
      byCategory: {
        authentication: 0,
        user_activity: 0,
        administrative: 0,
        security: 0,
        system: 0,
      } as Record<HospitalLogCategory, number>,
      bySeverity: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      } as Record<HospitalLogSeverity, number>,
      byHospital: [],
    }
  }
}

/**
 * Get available modules from logs
 */
export async function getSystemLogModules(): Promise<string[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('hospital_logs').select('module').not('module', 'is', null)

      if (error) throw error

      const uniqueModules = Array.from(new Set((data || []).map((log) => log.module).filter(Boolean)))
      return uniqueModules.sort()
    } else {
      // Supabase is required
      return []
    }
  } catch (error) {
    console.error('Error fetching modules:', error)
    throw error
  }
}

/**
 * Get available actions from logs
 */
export async function getSystemLogActions(): Promise<string[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('hospital_logs').select('action')

      if (error) throw error

      const uniqueActions = Array.from(new Set((data || []).map((log) => log.action)))
      return uniqueActions.sort()
    } else {
      // Supabase is required
      return []
    }
  } catch (error) {
    console.error('Error fetching actions:', error)
    throw error
  }
}

/**
 * Export system logs to CSV
 */
export function exportSystemLogsToCSV(logs: SystemLogWithRelations[]): string {
  const headers = [
    'Timestamp',
    'Hospital',
    'Category',
    'Severity',
    'User',
    'Action',
    'Description',
    'Module',
    'IP Address',
  ]
  const rows = logs.map((log) => [
    new Date(log.created_at).toLocaleString(),
    log.hospital?.hospital_name || 'Unknown',
    log.category,
    log.severity,
    log.user?.full_name || 'System',
    log.action,
    log.description,
    log.module || '-',
    log.ip_address || '-',
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

  return csvContent
}

/**
 * Export system logs to JSON
 */
export function exportSystemLogsToJSON(logs: SystemLogWithRelations[]): string {
  const exportData = logs.map((log) => ({
    timestamp: log.created_at,
    hospital: log.hospital?.hospital_name || 'Unknown',
    hospital_id: log.hospital_id,
    category: log.category,
    severity: log.severity,
    user: log.user?.full_name || 'System',
    user_id: log.user_id,
    action: log.action,
    description: log.description,
    module: log.module,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    ip_address: log.ip_address,
    user_agent: log.user_agent,
    metadata: log.metadata,
  }))

  return JSON.stringify(exportData, null, 2)
}

