import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Database,
  HardDrive,
  Zap,
  Cpu,
  MemoryStick,
  Wifi,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  Building2,
  Settings,
} from 'lucide-react'
import { Button, Badge, LoadingOverlay, Select } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, StatItem } from '@/components/admin'
import { getSystemStatistics } from '@/services/systemAdminService'
import { getLatestHealthStatus } from '@/services/monitoringService'
import { getHospitalHealthSummary, getServiceStatuses, type ServiceStatus } from '@/services/hospitalHealthService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { SYSTEM_ROLES } from '@/lib/constants'
import { cn, formatDate, getRelativeTime } from '@/lib/utils'
import type { SystemStatistics, SystemHealthLog, HealthStatus, HospitalHealthSummary } from '@/types'

const REFRESH_INTERVALS = {
  '30s': 30000,
  '1m': 60000,
  '5m': 300000,
  'off': 0,
} as const

type RefreshInterval = keyof typeof REFRESH_INTERVALS

const SystemMonitoringPage: React.FC = () => {
  const { user } = useAuthStore()
  const { error: showError } = useToastStore()
  const isSystemAdmin = user?.role?.role_code === SYSTEM_ROLES.SYSTEM_ADMIN
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const hospitalId = user?.hospital_id

  const [statistics, setStatistics] = useState<SystemStatistics | null>(null)
  const [healthLogs, setHealthLogs] = useState<SystemHealthLog[]>([])
  const [hospitalHealth, setHospitalHealth] = useState<HospitalHealthSummary | null>(null)
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>('30s')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      if (isSystemAdmin) {
        const [statsResult, healthResult] = await Promise.all([
          getSystemStatistics(),
          getLatestHealthStatus(),
        ])
        if (statsResult.data) setStatistics(statsResult.data)
        if (healthResult) setHealthLogs(healthResult)
      } else if (isHospitalAdmin && hospitalId) {
        const [healthSummary, serviceStatuses] = await Promise.all([
          getHospitalHealthSummary(hospitalId),
          getServiceStatuses(hospitalId),
        ])
        setHospitalHealth(healthSummary)
        setServices(serviceStatuses)
      }
      setLastRefresh(new Date())
    } catch (error) {
      showError('Error', 'Failed to load system monitoring data')
    } finally {
      setIsLoading(false)
    }
  }, [isSystemAdmin, isHospitalAdmin, hospitalId, showError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (refreshInterval === 'off') return
    const interval = setInterval(() => fetchData(), REFRESH_INTERVALS[refreshInterval])
    return () => clearInterval(interval)
  }, [refreshInterval, fetchData])

  const overallStatus = isSystemAdmin
    ? (statistics?.system_health.overall_status || 'healthy')
    : (hospitalHealth?.overall_status || 'healthy')

  const stats: StatItem[] = useMemo(() => {
    if (isSystemAdmin) {
      const critical = (statistics?.recent_alerts.critical || 0)
      const warning = (statistics?.recent_alerts.warning || 0)
      return [
        {
          label: 'Total Hospitals',
          value: statistics?.total_hospitals || 0,
          icon: Building2,
          color: 'blue',
          description: `${statistics?.active_hospitals || 0} active`
        },
        {
          label: 'System Users',
          value: statistics?.total_users || 0,
          icon: Users,
          color: 'indigo',
          description: `${statistics?.active_users || 0} active`
        },
        {
          label: 'Active Sessions',
          value: 156, // Mock or real if available
          icon: Activity,
          color: 'emerald',
          description: 'Across all hospitals'
        },
        {
          label: 'Active Alerts',
          value: critical + warning,
          icon: AlertTriangle,
          color: critical > 0 ? 'rose' : (warning > 0 ? 'amber' : 'slate'),
          description: `${critical} critical, ${warning} warning`
        }
      ]
    } else {
      return [
        {
          label: 'Active Sessions',
          value: hospitalHealth?.active_sessions || 0,
          icon: Activity,
          color: 'emerald',
          description: `Pk: ${hospitalHealth?.max_sessions || 0}`
        },
        {
          label: 'Storage Used',
          value: `${hospitalHealth?.storage_used_gb?.toFixed(1) || 0}GB`,
          icon: HardDrive,
          color: (hospitalHealth?.storage_used_gb || 0) / (hospitalHealth?.storage_total_gb || 1) > 0.8 ? 'amber' : 'blue',
          description: `of ${hospitalHealth?.storage_total_gb || 0} GB`
        },
        {
          label: 'API Latency',
          value: `${hospitalHealth?.api_latency_ms || 0}ms`,
          icon: Zap,
          color: (hospitalHealth?.api_latency_ms || 0) > 300 ? 'amber' : 'emerald',
        },
        {
          label: 'Uptime (30d)',
          value: `${hospitalHealth?.uptime_percent?.toFixed(2) || 0}%`,
          icon: CheckCircle,
          color: 'emerald'
        }
      ]
    }
  }, [isSystemAdmin, statistics, hospitalHealth])

  const getCheckTypeIcon = (checkType: string) => {
    switch (checkType) {
      case 'database': return Database
      case 'api': return Zap
      case 'storage': return HardDrive
      case 'memory': return MemoryStick
      case 'cpu': return Cpu
      case 'network': return Wifi
      default: return Activity
    }
  }

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy': return 'success'
      case 'warning': return 'warning'
      case 'critical': return 'error'
      default: return 'secondary'
    }
  }

  const actions = (
    <div className="flex items-center gap-3">
      <Select
        value={refreshInterval}
        onChange={(e) => setRefreshInterval(e.target.value as RefreshInterval)}
        className="w-32 h-9 text-sm"
      >
        <option value="30s">Every 30s</option>
        <option value="1m">Every 1m</option>
        <option value="5m">Every 5m</option>
        <option value="off">Manual</option>
      </Select>
      <Button
        variant="outline"
        onClick={fetchData}
        disabled={isLoading}
        leftIcon={<RefreshCw className={cn(isLoading && 'animate-spin')} />}
      >
        Refresh
      </Button>
    </div>
  )

  const StatusIcon = overallStatus === 'healthy' ? CheckCircle : overallStatus === 'warning' ? AlertTriangle : XCircle
  const statusColor = overallStatus === 'healthy' ? 'text-emerald-600' : overallStatus === 'warning' ? 'text-amber-600' : 'text-rose-600'
  const statusBg = overallStatus === 'healthy' ? 'bg-emerald-50 border-emerald-200' : overallStatus === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'

  return (
    <AdminPageLayout
      title={isSystemAdmin ? 'System Monitoring' : 'Hospital System Health'}
      description={`Last updated: ${formatDate(lastRefresh, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
      icon={Activity}
      breadcrumbs={[{ label: 'Monitoring' }]}
      actions={actions}
    >
      <div className="space-y-6">
        {/* Overall Status Banner */}
        <div className={cn("rounded-xl border p-6 flex items-center justify-between", statusBg)}>
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-lg bg-white bg-opacity-60", statusColor)}>
              <StatusIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className={cn("text-2xl font-bold capitalize", statusColor)}>
                {overallStatus} System Status
              </h2>
              <p className="text-slate-600">
                All systems operational and running within expected parameters.
              </p>
            </div>
          </div>
        </div>

        <AdminStatsGrid stats={stats} isLoading={isLoading} />

        {/* Health Checks */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 px-1">Health Checks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(isSystemAdmin ? healthLogs : (hospitalHealth?.metrics || [])).map((metric: any) => {
              const Icon = getCheckTypeIcon(metric.check_type)
              const metricStatus = metric.status as HealthStatus
              return (
                <div key={metric.id || metric.check_type} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 capitalize">{metric.check_type.replace('_', ' ')}</h4>
                        <span className="text-xs text-slate-500">{getRelativeTime(metric.checked_at)}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(metricStatus)}>{metricStatus}</Badge>
                  </div>
                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-50">
                    <span className="text-sm text-slate-500">Current Value</span>
                    <span className="font-mono font-medium text-slate-900">{metric.value} {metric.unit}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Service Status (Hospital Admin) */}
        {!isSystemAdmin && services.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Service Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {services.map(service => (
                <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", service.status === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500')} />
                    <span className="font-medium text-slate-700">{service.name}</span>
                  </div>
                  <span className={cn("text-xs font-bold uppercase", service.status === 'healthy' ? 'text-emerald-600' : 'text-rose-600')}>
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}

export default SystemMonitoringPage
