// Hospital Log Service - For Hospital Admin System Logs
import { supabase } from './supabase'
import type {
  HospitalLogWithRelations,
  HospitalLogCategory,
  HospitalLogSeverity,
  PaginatedResponse,
  SortConfig,
} from '@/types'

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

