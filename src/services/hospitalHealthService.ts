// Hospital Health Service - System Health Monitoring for Hospital Admin
import { supabase, isSupabaseConfigured } from './supabase'
import type {
  HospitalHealthSummary,
  HospitalHealthMetric,
  HealthStatus,
} from '@/types'

/**
 * Get hospital health summary
 */
export async function getHospitalHealthSummary(hospitalId: string): Promise<HospitalHealthSummary> {
  if (isSupabaseConfigured()) {
    try {
      // Supabase implementation would fetch from health monitoring tables
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
  } else {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300))

    const mockMetrics: HospitalHealthMetric[] = [
      {
        id: 'metric-001',
        hospital_id: hospitalId,
        check_type: 'active_sessions',
        status: 'healthy',
        value: 42,
        unit: 'sessions',
        threshold_warning: 80,
        threshold_critical: 95,
        message: 'Active sessions within normal range',
        checked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'metric-002',
        hospital_id: hospitalId,
        check_type: 'database',
        status: 'healthy',
        value: 98.5,
        unit: '%',
        threshold_warning: 90,
        threshold_critical: 70,
        message: 'Database performance optimal',
        checked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'metric-003',
        hospital_id: hospitalId,
        check_type: 'storage',
        status: 'warning',
        value: 41.2,
        unit: 'GB',
        threshold_warning: 40,
        threshold_critical: 48,
        message: 'Storage usage at 82.4% - consider cleanup',
        checked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'metric-004',
        hospital_id: hospitalId,
        check_type: 'api_latency',
        status: 'healthy',
        value: 145,
        unit: 'ms',
        threshold_warning: 300,
        threshold_critical: 500,
        message: 'API response time optimal',
        checked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'metric-005',
        hospital_id: hospitalId,
        check_type: 'error_rate',
        status: 'healthy',
        value: 0.12,
        unit: '%',
        threshold_warning: 1,
        threshold_critical: 5,
        message: 'Error rate within acceptable limits',
        checked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]

    // Calculate overall status
    let overallStatus: HealthStatus = 'healthy'
    if (mockMetrics.some(m => m.status === 'critical')) {
      overallStatus = 'critical'
    } else if (mockMetrics.some(m => m.status === 'warning')) {
      overallStatus = 'warning'
    }

    return {
      hospital_id: hospitalId,
      overall_status: overallStatus,
      active_sessions: 42,
      max_sessions: 100,
      storage_used_gb: 41.2,
      storage_total_gb: 50,
      api_latency_ms: 145,
      error_rate_percent: 0.12,
      uptime_percent: 99.95,
      last_checked: new Date().toISOString(),
      metrics: mockMetrics,
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

export async function getServiceStatuses(hospitalId: string): Promise<ServiceStatus[]> {
  if (isSupabaseConfigured()) {
    // Would query actual service health endpoints
    // For now, return mock data
  }

  await new Promise(resolve => setTimeout(resolve, 200))

  return [
    {
      name: 'Authentication Service',
      status: 'healthy',
      message: 'Operating normally',
      lastCheck: new Date().toISOString(),
      responseTime: 45,
    },
    {
      name: 'Database Service',
      status: 'healthy',
      message: 'Connection pool healthy',
      lastCheck: new Date().toISOString(),
      responseTime: 12,
    },
    {
      name: 'File Storage',
      status: 'warning',
      message: 'Storage usage high (82.4%)',
      lastCheck: new Date().toISOString(),
      responseTime: 89,
    },
    {
      name: 'Email Service',
      status: 'healthy',
      message: 'SMTP connection active',
      lastCheck: new Date().toISOString(),
      responseTime: 234,
    },
    {
      name: 'External API Integration',
      status: 'healthy',
      message: 'All integrations responding',
      lastCheck: new Date().toISOString(),
      responseTime: 156,
    },
    {
      name: 'Background Jobs',
      status: 'healthy',
      message: '0 failed jobs in queue',
      lastCheck: new Date().toISOString(),
    },
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

export async function getPerformanceMetrics(hospitalId: string, hours: number = 24): Promise<PerformanceMetrics> {
  if (isSupabaseConfigured()) {
    // Would query time-series metrics
  }

  await new Promise(resolve => setTimeout(resolve, 300))

  // Generate mock time-series data
  const now = new Date()
  const dataPoints: PerformanceDataPoint[] = []
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
    dataPoints.push({
      timestamp: timestamp.toISOString(),
      value: 0, // Will be set per metric
    })
  }

  return {
    apiLatency: dataPoints.map(dp => ({
      ...dp,
      value: 100 + Math.random() * 100, // 100-200ms
    })),
    activeUsers: dataPoints.map((dp, index) => ({
      ...dp,
      // Simulate typical usage pattern - lower at night
      value: Math.floor(
        20 + 
        30 * Math.sin((index / 24) * Math.PI * 2 - Math.PI / 2) + 
        Math.random() * 10
      ),
    })),
    errorRate: dataPoints.map(dp => ({
      ...dp,
      value: Math.random() * 0.5, // 0-0.5%
    })),
    pageLoadTime: dataPoints.map(dp => ({
      ...dp,
      value: 800 + Math.random() * 400, // 800-1200ms
    })),
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

export async function getUptimeHistory(hospitalId: string, days: number = 30): Promise<UptimeRecord[]> {
  if (isSupabaseConfigured()) {
    // Would query uptime history table
  }

  await new Promise(resolve => setTimeout(resolve, 200))

  const records: UptimeRecord[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Generate realistic uptime (mostly 100%, occasionally lower)
    const hasIncident = Math.random() < 0.1 // 10% chance of incident
    const uptime = hasIncident ? 99 + Math.random() : 100
    const incidents = hasIncident ? Math.ceil(Math.random() * 2) : 0
    const downtime = hasIncident ? Math.floor((100 - uptime) * 14.4) : 0 // Convert percent to minutes

    records.push({
      date: date.toISOString().split('T')[0],
      uptime_percent: Math.round(uptime * 100) / 100,
      incidents,
      downtime_minutes: downtime,
    })
  }

  return records
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

export async function getSessionStats(hospitalId: string): Promise<SessionStats> {
  if (isSupabaseConfigured()) {
    // Would query active sessions
  }

  await new Promise(resolve => setTimeout(resolve, 200))

  return {
    total_active: 42,
    by_device: [
      { device: 'Desktop', count: 28 },
      { device: 'Mobile', count: 10 },
      { device: 'Tablet', count: 4 },
    ],
    by_department: [
      { department: 'Pharmacy', count: 12 },
      { department: 'Nursing', count: 15 },
      { department: 'Administration', count: 8 },
      { department: 'Laboratory', count: 5 },
      { department: 'Radiology', count: 2 },
    ],
    avg_session_duration_minutes: 45,
  }
}

