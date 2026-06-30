// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react'
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
  TrendingUp,
  Clock,
  Users,
  Building2,
  Settings,
} from 'lucide-react'
import { Button, Badge, LoadingOverlay, Select } from '@/components/ui'
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
        // System Admin - get system-wide data
        const [statsResult, healthResult] = await Promise.all([
          getSystemStatistics(),
          getLatestHealthStatus(),
        ])

        if (statsResult.data) setStatistics(statsResult.data)
        if (healthResult) setHealthLogs(healthResult)
      } else if (isHospitalAdmin && hospitalId) {
        // Hospital Admin - get hospital-specific data
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
      console.error('Error fetching monitoring data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isSystemAdmin, isHospitalAdmin, hospitalId, showError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (refreshInterval === 'off') return

    const interval = setInterval(() => {
      fetchData()
    }, REFRESH_INTERVALS[refreshInterval])

    return () => clearInterval(interval)
  }, [refreshInterval, fetchData])

  const getHealthStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'success'
      case 'warning':
        return 'warning'
      case 'critical':
        return 'error'
      default:
        return 'info'
    }
  }

  const getHealthStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return CheckCircle
      case 'warning':
        return AlertTriangle
      case 'critical':
        return XCircle
      default:
        return Activity
    }
  }

  const getCheckTypeIcon = (checkType: string) => {
    switch (checkType) {
      case 'database':
        return Database
      case 'api':
        return Zap
      case 'storage':
        return HardDrive
      case 'memory':
        return MemoryStick
      case 'cpu':
        return Cpu
      case 'network':
        return Wifi
      default:
        return Activity
    }
  }

  // Determine overall status based on role
  const overallStatus = isSystemAdmin 
    ? (statistics?.system_health.overall_status || 'healthy')
    : (hospitalHealth?.overall_status || 'healthy')
  const StatusIcon = getHealthStatusIcon(overallStatus)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              overallStatus === 'healthy' && 'bg-success-100',
              overallStatus === 'warning' && 'bg-warning-100',
              overallStatus === 'critical' && 'bg-error-100'
            )}
          >
            <Activity
              className={cn(
                'w-6 h-6',
                overallStatus === 'healthy' && 'text-success-600',
                overallStatus === 'warning' && 'text-warning-600',
                overallStatus === 'critical' && 'text-error-600'
              )}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isSystemAdmin ? 'System Monitoring' : 'Hospital System Health'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {isSystemAdmin 
                ? `Last updated: ${formatDate(lastRefresh, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : `Monitoring ${user?.hospital?.hospital_name || 'your hospital'} â€¢ Last updated: ${formatDate(lastRefresh, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value as RefreshInterval)}
            className="w-32"
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
            leftIcon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
          >
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Overall System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'rounded-2xl p-6 border-2',
          overallStatus === 'healthy' && 'bg-gradient-to-r from-success-50 to-emerald-50 border-success-200',
          overallStatus === 'warning' && 'bg-gradient-to-r from-warning-50 to-amber-50 border-warning-200',
          overallStatus === 'critical' && 'bg-gradient-to-r from-error-50 to-rose-50 border-error-200'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center',
                overallStatus === 'healthy' && 'bg-success-100',
                overallStatus === 'warning' && 'bg-warning-100',
                overallStatus === 'critical' && 'bg-error-100'
              )}
            >
              <StatusIcon
                className={cn(
                  'w-8 h-8',
                  overallStatus === 'healthy' && 'text-success-600',
                  overallStatus === 'warning' && 'text-warning-600',
                  overallStatus === 'critical' && 'text-error-600'
                )}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">System Status</h2>
              <p
                className={cn(
                  'text-2xl font-bold capitalize',
                  overallStatus === 'healthy' && 'text-success-600',
                  overallStatus === 'warning' && 'text-warning-600',
                  overallStatus === 'critical' && 'text-error-600'
                )}
              >
                {overallStatus}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">{isSystemAdmin ? 'System Health' : 'Service Health'}</p>
            <p className="text-3xl font-bold text-slate-900">
              {isSystemAdmin 
                ? `${healthLogs.filter((h) => h.status === 'healthy').length} / ${healthLogs.length}`
                : `${services.filter((s) => s.status === 'healthy').length} / ${services.length}`
              }
            </p>
            <p className="text-xs text-slate-500">Checks Healthy</p>
          </div>
        </div>
      </motion.div>

      {/* System Statistics Cards */}
      {isSystemAdmin ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            title="Total Hospitals"
            value={statistics?.total_hospitals || 0}
            icon={Building2}
            color="primary"
            subtitle={`${statistics?.active_hospitals || 0} active`}
          />
          <StatCard
            title="System Users"
            value={statistics?.total_users.toLocaleString() || '0'}
            icon={Users}
            color="info"
            subtitle={`${statistics?.active_users || 0} active`}
          />
          <StatCard
            title="Active Sessions"
            value="156"
            icon={Activity}
            color="success"
            subtitle="Across all hospitals"
          />
          <StatCard
            title="Active Alerts"
            value={(statistics?.recent_alerts.critical || 0) + (statistics?.recent_alerts.warning || 0)}
            icon={AlertTriangle}
            color={statistics?.recent_alerts.critical ? 'error' : 'warning'}
            subtitle={`${statistics?.recent_alerts.critical || 0} critical`}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            title="Active Sessions"
            value={hospitalHealth?.active_sessions || 0}
            icon={Activity}
            color="success"
            subtitle={`Max: ${hospitalHealth?.max_sessions || 0}`}
          />
          <StatCard
            title="Storage Used"
            value={`${hospitalHealth?.storage_used_gb?.toFixed(1) || 0} GB`}
            icon={HardDrive}
            color={hospitalHealth && hospitalHealth.storage_used_gb / hospitalHealth.storage_total_gb > 0.8 ? 'warning' : 'success'}
            subtitle={`of ${hospitalHealth?.storage_total_gb || 0} GB`}
          />
          <StatCard
            title="API Latency"
            value={`${hospitalHealth?.api_latency_ms || 0} ms`}
            icon={Zap}
            color={hospitalHealth && hospitalHealth.api_latency_ms > 300 ? 'warning' : 'success'}
            subtitle="Average response time"
          />
          <StatCard
            title="Uptime"
            value={`${hospitalHealth?.uptime_percent?.toFixed(2) || 0}%`}
            icon={CheckCircle}
            color="success"
            subtitle="Last 30 days"
          />
        </motion.div>
      )}

      {/* Health Checks Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {isSystemAdmin ? (
          healthLogs.map((health) => {
            const Icon = getCheckTypeIcon(health.check_type)
            const statusColor = getHealthStatusColor(health.status)
            const StatusIcon = getHealthStatusIcon(health.status)

            return (
              <div
                key={health.id}
                className={cn(
                  'bg-white rounded-xl border-2 p-6',
                  health.status === 'healthy' && 'border-success-200',
                  health.status === 'warning' && 'border-warning-200',
                  health.status === 'critical' && 'border-error-200'
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        health.status === 'healthy' && 'bg-success-100',
                        health.status === 'warning' && 'bg-warning-100',
                        health.status === 'critical' && 'bg-error-100'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          health.status === 'healthy' && 'text-success-600',
                          health.status === 'warning' && 'text-warning-600',
                          health.status === 'critical' && 'text-error-600'
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 capitalize">{health.check_type}</h3>
                      <p className="text-xs text-slate-500">{getRelativeTime(health.checked_at)}</p>
                    </div>
                  </div>
                  <StatusIcon
                    className={cn(
                      'w-5 h-5',
                      health.status === 'healthy' && 'text-success-600',
                      health.status === 'warning' && 'text-warning-600',
                      health.status === 'critical' && 'text-error-600'
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <Badge variant={statusColor as any} size="sm">
                      {health.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Value</span>
                    <span className="text-lg font-bold text-slate-900">
                      {health.value} {health.unit}
                    </span>
                  </div>
                  {health.message && (
                    <p className="text-xs text-slate-500 mt-2">{health.message}</p>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          (hospitalHealth?.metrics || []).map((metric) => {
            const Icon = getCheckTypeIcon(metric.check_type)
            const statusColor = getHealthStatusColor(metric.status)
            const StatusIcon = getHealthStatusIcon(metric.status)

            return (
              <div
                key={metric.id}
                className={cn(
                  'bg-white rounded-xl border-2 p-6',
                  metric.status === 'healthy' && 'border-success-200',
                  metric.status === 'warning' && 'border-warning-200',
                  metric.status === 'critical' && 'border-error-200'
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        metric.status === 'healthy' && 'bg-success-100',
                        metric.status === 'warning' && 'bg-warning-100',
                        metric.status === 'critical' && 'bg-error-100'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          metric.status === 'healthy' && 'text-success-600',
                          metric.status === 'warning' && 'text-warning-600',
                          metric.status === 'critical' && 'text-error-600'
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 capitalize">{metric.check_type.replace('_', ' ')}</h3>
                      <p className="text-xs text-slate-500">{getRelativeTime(metric.checked_at)}</p>
                    </div>
                  </div>
                  <StatusIcon
                    className={cn(
                      'w-5 h-5',
                      metric.status === 'healthy' && 'text-success-600',
                      metric.status === 'warning' && 'text-warning-600',
                      metric.status === 'critical' && 'text-error-600'
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <Badge variant={statusColor as any} size="sm">
                      {metric.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Value</span>
                    <span className="text-lg font-bold text-slate-900">
                      {metric.value} {metric.unit}
                    </span>
                  </div>
                  {metric.message && (
                    <p className="text-xs text-slate-500 mt-2">{metric.message}</p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </motion.div>

      {/* Usage Statistics */}
      {isSystemAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Module Usage */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-600" />
                Module Usage
              </h3>
            </div>
            <div className="space-y-3">
              {statistics?.module_usage &&
                Object.entries(statistics.module_usage).map(([code, usage]) => (
                  <div key={code} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 capitalize">{code}</span>
                      <span className="text-slate-600">
                        {usage.count} hospitals ({usage.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          usage.percentage >= 80 && 'bg-success-500',
                          usage.percentage >= 50 && usage.percentage < 80 && 'bg-primary-500',
                          usage.percentage < 50 && 'bg-warning-500'
                        )}
                        style={{ width: `${usage.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

        {/* User Statistics */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              User Statistics
            </h3>
          </div>
          <div className="space-y-4">
            <StatRow
              label="Total Users"
              value={statistics?.total_users || 0}
              color="primary"
            />
            <StatRow
              label="Active Users"
              value={statistics?.active_users || 0}
              color="success"
            />
            <StatRow
              label="Pending Users"
              value={statistics?.pending_users || 0}
              color="warning"
            />
            <StatRow
              label="Suspended Users"
              value={statistics?.suspended_users || 0}
              color="error"
            />
            <StatRow
              label="Inactive Users"
              value={statistics?.inactive_users || 0}
              color="gray"
            />
          </div>
        </div>
      </motion.div>
      )}

      {/* Service Status for Hospital Admin */}
      {!isSystemAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            Service Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((service) => (
              <div
                key={service.name}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  service.status === 'healthy' ? 'bg-green-50' :
                  service.status === 'warning' ? 'bg-amber-50' : 'bg-red-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    service.status === 'healthy' ? 'bg-green-500' :
                    service.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  )} />
                  <span className="text-sm font-medium text-gray-900">{service.name}</span>
                </div>
                <Badge 
                  variant={
                    service.status === 'healthy' ? 'success' :
                    service.status === 'warning' ? 'warning' : 'error'
                  }
                  size="sm"
                >
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Hospital Status Overview */}
      {isSystemAdmin && statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              Hospital Status Overview
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-success-50 rounded-lg border border-success-200">
              <p className="text-2xl font-bold text-success-600">{statistics.active_hospitals}</p>
              <p className="text-sm text-slate-600 mt-1">Active Hospitals</p>
            </div>
            <div className="text-center p-4 bg-warning-50 rounded-lg border border-warning-200">
              <p className="text-2xl font-bold text-warning-600">{statistics.pending_setup_hospitals}</p>
              <p className="text-sm text-slate-600 mt-1">Pending Setup</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-2xl font-bold text-slate-600">{statistics.inactive_hospitals}</p>
              <p className="text-sm text-slate-600 mt-1">Inactive</p>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-2xl font-bold text-primary-600">{statistics.total_hospitals}</p>
              <p className="text-sm text-slate-600 mt-1">Total Hospitals</p>
            </div>
          </div>
        </motion.div>
      )}

      {isLoading && <LoadingOverlay message="Loading system monitoring data..." />}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: 'primary' | 'success' | 'warning' | 'error' | 'info'
  subtitle?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      icon: 'bg-primary-100 text-primary-600',
    },
    success: {
      bg: 'bg-success-50',
      icon: 'bg-success-100 text-success-600',
    },
    warning: {
      bg: 'bg-warning-50',
      icon: 'bg-warning-100 text-warning-600',
    },
    error: {
      bg: 'bg-error-50',
      icon: 'bg-error-100 text-error-600',
    },
    info: {
      bg: 'bg-info-50',
      icon: 'bg-info-100 text-info-600',
    },
  }

  const colors = colorClasses[color]

  return (
    <div className={cn('card p-6', colors.bg)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.icon)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
      <p className="text-sm text-slate-600">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  )
}

interface StatRowProps {
  label: string
  value: number
  color: 'primary' | 'success' | 'warning' | 'error' | 'gray'
}

const StatRow: React.FC<StatRowProps> = ({ label, value, color }) => {
  const colorClasses = {
    primary: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
    gray: 'text-slate-600',
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={cn('text-lg font-bold', colorClasses[color])}>{value.toLocaleString()}</span>
    </div>
  )
}

export default SystemMonitoringPage
