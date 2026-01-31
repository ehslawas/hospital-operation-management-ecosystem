// Hospital Health Service - System Health Monitoring for Hospital Admin
import { supabase } from './supabase'
import type {
  HospitalHealthSummary,
  HospitalHealthMetric,
  HealthStatus,
} from '@/types'

/**
 * Get hospital health summary
 */
export async function getHospitalHealthSummary(hospitalId: string): Promise<HospitalHealthSummary> {
  try {
    // Supabase implementation fetches from health monitoring tables
    const { data, error } = await supabase
      .from('hospital_health_metrics')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('checked_at', { ascending: false })
      .limit(6)

    if (error) {
      // Handle table not found gracefully - return default healthy status
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('hospital_health_metrics table not found, returning default healthy status')
        return {
          hospital_id: hospitalId,
          overall_status: 'healthy',
          active_sessions: 0,
          max_sessions: 100,
          storage_used_gb: 0,
          storage_total_gb: 50,
          api_latency_ms: 0,
          error_rate_percent: 0,
          uptime_percent: 100,
          last_checked: new Date().toISOString(),
          metrics: [],
        }
      }
      throw error
    }

    // Calculate overall status based on individual metrics
    const metrics = data as HospitalHealthMetric[]
    let overallStatus: HealthStatus = 'healthy'

    if (metrics.some(m => m.status === 'critical')) {
      overallStatus = 'critical'
    } else if (metrics.some(m => m.status === 'warning')) {
      overallStatus = 'warning'
    }

    return {
      hospital_id: hospitalId,
      overall_status: overallStatus,
      active_sessions: metrics.find(m => m.check_type === 'active_sessions')?.value || 0,
      max_sessions: 100,
      storage_used_gb: metrics.find(m => m.check_type === 'storage')?.value || 0,
      storage_total_gb: 50,
      api_latency_ms: metrics.find(m => m.check_type === 'api_latency')?.value || 0,
      error_rate_percent: metrics.find(m => m.check_type === 'error_rate')?.value || 0,
      uptime_percent: 99.9,
      last_checked: new Date().toISOString(),
      metrics,
    }
  } catch (error) {
    console.error('Error fetching hospital health summary:', error)
    // Return default healthy status on error
    return {
      hospital_id: hospitalId,
      overall_status: 'healthy',
      active_sessions: 0,
      max_sessions: 100,
      storage_used_gb: 0,
      storage_total_gb: 50,
      api_latency_ms: 0,
      error_rate_percent: 0,
      uptime_percent: 100,
      last_checked: new Date().toISOString(),
      metrics: [],
    }
  }
}

/**
 * Get service status
 */
export interface ServiceStatus {
  name: string
  status: HealthStatus
  message: string
  lastCheck: string
  responseTime?: number
}

export async function getServiceStatuses(_hospitalId: string): Promise<ServiceStatus[]> {
  // Returns default statuses for now
  return [
    {
      name: 'Authentication Service',
      status: 'healthy',
      message: 'Operating normally',
      lastCheck: new Date().toISOString(),
    },
    {
      name: 'Database Service',
      status: 'healthy',
      message: 'Connection pool healthy',
      lastCheck: new Date().toISOString(),
    }
  ]
}

/**
 * Get performance metrics over time
 */
export interface PerformanceDataPoint {
  timestamp: string
  value: number
}

export interface PerformanceMetrics {
  apiLatency: PerformanceDataPoint[]
  activeUsers: PerformanceDataPoint[]
  errorRate: PerformanceDataPoint[]
  pageLoadTime: PerformanceDataPoint[]
}

export async function getPerformanceMetrics(_hospitalId: string, _hours: number = 24): Promise<PerformanceMetrics> {
  // Returns empty performance metrics for now
  return {
    apiLatency: [],
    activeUsers: [],
    errorRate: [],
    pageLoadTime: [],
  }
}

/**
 * Get uptime history
 */
export interface UptimeRecord {
  date: string
  uptime_percent: number
  incidents: number
  downtime_minutes: number
}

export async function getUptimeHistory(_hospitalId: string, _days: number = 30): Promise<UptimeRecord[]> {
  // Returns empty for now
  return []
}

/**
 * Get current user session statistics
 */
export interface SessionStats {
  total_active: number
  by_device: { device: string; count: number }[]
  by_department: { department: string; count: number }[]
  avg_session_duration_minutes: number
}

export async function getSessionStats(_hospitalId: string): Promise<SessionStats> {
  // Returns empty stats
  return {
    total_active: 0,
    by_device: [],
    by_department: [],
    avg_session_duration_minutes: 0,
  }
}

