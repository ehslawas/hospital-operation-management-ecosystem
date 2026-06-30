// @ts-nocheck
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { SystemHealthLog, HealthCheckType, HealthStatus, PaginatedResponse } from '@/types'

/**
 * Get system health logs
 */
export async function getSystemHealthLogs(
  page: number = 1,
  pageSize: number = 50,
  checkType?: HealthCheckType
): Promise<PaginatedResponse<SystemHealthLog>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('system_health_logs')
        .select('*', { count: 'exact' })
        .order('checked_at', { ascending: false })

      if (checkType) {
        query = query.eq('check_type', checkType)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      return {
        data: (data || []) as SystemHealthLog[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    } else {
      // Supabase is required for System Monitoring
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      }
    }
  } catch (error) {
    console.error('Error fetching health logs:', error)
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
 * Get latest health status for each check type
 */
export async function getLatestHealthStatus(): Promise<SystemHealthLog[]> {
  try {
    if (isSupabaseConfigured()) {
      const checkTypes: HealthCheckType[] = ['database', 'api', 'storage', 'memory', 'cpu', 'network']

      const latestChecks = await Promise.all(
        checkTypes.map(async (type) => {
          const { data, error } = await supabase
            .from('system_health_logs')
            .select('*')
            .eq('check_type', type)
            .order('checked_at', { ascending: false })
            .limit(1)

          if (error) {
            console.error(`Error fetching ${type} health:`, error)
            return null
          }

          const latest = data && data[0] ? data[0] : null
          return latest
        })
      )

      return latestChecks.filter((check) => check !== null) as SystemHealthLog[]
    } else {
      // Supabase is required for System Monitoring
      return []
    }
  } catch (error) {
    console.error('Error fetching latest health status:', error)
    return []
  }
}

/**
 * Record a health check (typically called by scheduled job)
 */
export async function recordHealthCheck(
  checkType: HealthCheckType,
  status: HealthStatus,
  value: number,
  unit: string,
  message?: string
): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      await supabase.from('system_health_logs').insert({
        check_type: checkType,
        status,
        value,
        unit,
        message,
        checked_at: new Date().toISOString(),
      })
    }
    // Supabase is required - silently fail if not configured
  } catch (error) {
    console.error('Error recording health check:', error)
  }
}

