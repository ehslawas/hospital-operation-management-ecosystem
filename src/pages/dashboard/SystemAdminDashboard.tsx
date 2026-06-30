// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  Shield,
  Settings,
  FileText,
  AlertTriangle,
  TrendingUp,
  Activity,
  Globe,
  CheckCircle,
  Clock,
  XCircle,
  Database,
  HardDrive,
  Bell,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Badge, Button, Spinner, StatCard } from '@/components/ui'
import { cn, formatDate, formatCurrency, getRelativeTime } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { getSystemStatistics, getSystemAlerts, getLatestHealthStatus } from '@/services'
import type { SystemStatistics, SystemAlert, SystemHealthLog } from '@/types'

const systemActivities = [
  {
    id: 1,
    hospital: 'Hospital Kuala Lumpur',
    action: 'New user registered',
    user: 'Nurul Aisyah',
    time: '5 minutes ago',
    type: 'success',
  },
  {
    id: 2,
    hospital: 'Hospital Sultan Abdul Halim',
    action: 'System configuration updated',
    user: 'Ahmad Razak',
    time: '15 minutes ago',
    type: 'info',
  },
  {
    id: 3,
    hospital: 'Hospital Kuala Lumpur',
    action: 'Access request pending review',
    user: 'System',
    time: '30 minutes ago',
    type: 'warning',
  },
  {
    id: 4,
    hospital: 'Hospital Putrajaya',
    action: 'New hospital added',
    user: 'System Admin',
    time: '1 hour ago',
    type: 'success',
  },
  {
    id: 5,
    hospital: 'All Hospitals',
    action: 'Security audit completed',
    user: 'System',
    time: '2 hours ago',
    type: 'info',
  },
]

const pendingTasks = [
  {
    id: 1,
    title: 'Review system-wide access requests',
    count: 12,
    priority: 'high',
    link: ROUTES.ADMIN_ACCESS_REQUESTS,
  },
  {
    id: 2,
    title: 'Approve new hospital registrations',
    count: 3,
    priority: 'high',
    link: ROUTES.ADMIN_HOSPITALS,
  },
  {
    id: 3,
    title: 'Review system security logs',
    count: 45,
    priority: 'medium',
    link: ROUTES.ADMIN_AUDIT_LOGS,
  },
  {
    id: 4,
    title: 'Update system-wide permissions',
    count: 2,
    priority: 'low',
    link: ROUTES.ADMIN_ROLES,
  },
]

export const SystemAdminDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null)
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [healthStatus, setHealthStatus] = useState<SystemHealthLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsResult, alertsResult, healthResult] = await Promise.all([
        getSystemStatistics(),
        getSystemAlerts(1, 5, { is_resolved: false }),
        getLatestHealthStatus(),
      ])

      if (statsResult.data) setStatistics(statsResult.data)
      if (alertsResult.data) setAlerts(alertsResult.data)
      if (healthResult) setHealthStatus(healthResult)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatusColor = (status: string) => {
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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-error-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning-600" />
      case 'info':
        return <CheckCircle className="w-4 h-4 text-info-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6" />
              <h1 className="text-2xl font-bold">
                System Administration Dashboard
              </h1>
            </div>
            <p className="text-primary-100">
              Welcome back, {user?.full_name?.split(' ')[0]}! Manage the entire HOME system across all hospitals.
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm text-primary-200">Today</p>
            <p className="text-lg font-semibold">
              {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Hospitals"
          value={statistics?.total_hospitals || 0}
          icon={Building2}
          color="primary"
          link={ROUTES.ADMIN_HOSPITALS}
        />
        <StatCard
          title="System Users"
          value={statistics?.total_users.toLocaleString() || '0'}
          icon={Users}
          color="info"
          link={ROUTES.ADMIN_USERS}
        />
        <StatCard
          title="System Health"
          value={statistics?.system_health.overall_status === 'healthy' ? '● Healthy' : '⚠ Warning'}
          icon={Activity}
          color={getHealthStatusColor(statistics?.system_health.overall_status || 'healthy') as any}
        />
        <StatCard
          title="Active Alerts"
          value={statistics?.recent_alerts.critical || 0}
          icon={Bell}
          color={statistics?.recent_alerts.critical ? 'error' : 'success'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 card"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary-600" />
                System-Wide Activity
              </h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        alert.alert_type === 'critical' && 'bg-error-100',
                        alert.alert_type === 'warning' && 'bg-warning-100',
                        alert.alert_type === 'info' && 'bg-info-100',
                        alert.alert_type === 'error' && 'bg-error-100'
                      )}
                    >
                      {getAlertIcon(alert.alert_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(alert.created_at)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success-500" />
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Pending Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
              Pending Tasks
            </h2>
          </div>

          <div className="p-4 space-y-3">
            {pendingTasks.map((task, index) => (
              <Link key={task.id} to={task.link || '#'}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        task.priority === 'high' && 'bg-error-500',
                        task.priority === 'medium' && 'bg-warning-500',
                        task.priority === 'low' && 'bg-success-500'
                      )}
                    />
                    <span className="text-sm text-gray-700">{task.title}</span>
                  </div>
                  <Badge
                    variant={
                      task.priority === 'high'
                        ? 'error'
                        : task.priority === 'medium'
                        ? 'warning'
                        : 'success'
                    }
                    size="sm"
                  >
                    {task.count}
                  </Badge>
                </motion.div>
              </Link>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100">
            <Button variant="outline" className="w-full" as={Link} to={ROUTES.ADMIN_ALERTS}>
              View All Alerts
            </Button>
          </div>
        </motion.div>
      </div>

      {/* System Health Status */}
      {healthStatus.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {healthStatus.map((health) => (
              <div
                key={health.id}
                className={cn(
                  'p-4 rounded-xl border-2',
                  health.status === 'healthy' && 'border-success-200 bg-success-50',
                  health.status === 'warning' && 'border-warning-200 bg-warning-50',
                  health.status === 'critical' && 'border-error-200 bg-error-50'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {health.check_type}
                  </span>
                  <Badge
                    variant={getHealthStatusColor(health.status) as any}
                    size="sm"
                  >
                    {health.status}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {health.value} {health.unit}
                </div>
                {health.message && (
                  <p className="text-xs text-gray-600 mt-1">{health.message}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" as={Link} to={ROUTES.ADMIN_HOSPITALS}>
            <Building2 className="w-6 h-6" />
            <span>Manage Hospitals</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" as={Link} to={ROUTES.ADMIN_MODULES}>
            <Settings className="w-6 h-6" />
            <span>Module Access</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" as={Link} to={ROUTES.ADMIN_MONITORING}>
            <Activity className="w-6 h-6" />
            <span>System Monitoring</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" as={Link} to={ROUTES.ADMIN_BACKUPS}>
            <Database className="w-6 h-6" />
            <span>Backups</span>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default SystemAdminDashboard

