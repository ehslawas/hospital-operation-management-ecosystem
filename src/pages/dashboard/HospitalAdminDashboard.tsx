// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  FileText,
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  Shield,
  Megaphone,
  Lock,
  ScrollText,
  Database,
  RefreshCw,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Badge, Button, StatCard } from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { getMemoCountsByStatus } from '@/services/memoService'
import { getPendingRequestsCount as getSensitiveDataPendingCount } from '@/services/sensitiveDataRequestService'
import { getHospitalHealthSummary, ServiceStatus, getServiceStatuses } from '@/services/hospitalHealthService'
import { getUsers } from '@/services/userService'
import { getDepartments } from '@/services/departmentService'
import { getAccessRequests } from '@/services/accessRequestManagementService'
import type { HospitalHealthSummary, HealthStatus, MemoStatus, SensitiveDataRequestStatus } from '@/types'

const statusColors: Record<HealthStatus, { color: string; bgColor: string }> = {
  healthy: { color: 'text-green-600', bgColor: 'bg-green-100' },
  warning: { color: 'text-amber-600', bgColor: 'bg-amber-100' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100' },
}

export const HospitalAdminDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalName = user?.hospital?.hospital_name || 'Your Hospital'
  const hospitalId = user?.hospital_id || ''

  const [memoCounts, setMemoCounts] = useState<Record<MemoStatus, number>>({
    draft: 0, pending_approval: 0, approved: 0, rejected: 0, published: 0, archived: 0
  })
  const [sensitiveDataCounts, setSensitiveDataCounts] = useState({
    total: 0, routine: 0, urgent: 0, emergency: 0
  })
  const [healthSummary, setHealthSummary] = useState<HospitalHealthSummary | null>(null)
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // KPI Data
  const [totalUsers, setTotalUsers] = useState(0)
  const [activeUsers, setActiveUsers] = useState(0)
  const [totalDepartments, setTotalDepartments] = useState(0)
  const [activeDepartments, setActiveDepartments] = useState(0)
  const [pendingAccessRequests, setPendingAccessRequests] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      if (!hospitalId) return
      
      setIsLoading(true)
      try {
        const [memos, sensitive, health, serviceStatus, usersResult, deptsResult, accessRequestsResult] = await Promise.all([
          getMemoCountsByStatus(hospitalId),
          getSensitiveDataPendingCount(hospitalId),
          getHospitalHealthSummary(hospitalId),
          getServiceStatuses(hospitalId),
          getUsers({ hospitalId, pageSize: 1 }), // Just get count
          getDepartments({ hospitalId, pageSize: 1 }), // Just get count
          getAccessRequests({ hospitalId, status: 'pending', pageSize: 1 }), // Just get count
        ])
        
        setMemoCounts(memos)
        setSensitiveDataCounts(sensitive)
        setHealthSummary(health)
        setServices(serviceStatus)
        
        // Set KPI data
        setTotalUsers(usersResult.total)
        setTotalDepartments(deptsResult.total)
        setPendingAccessRequests(accessRequestsResult.total)
        
        // Get active users and departments count properly
        const [activeUsersResult, activeDeptsResult] = await Promise.all([
          getUsers({ hospitalId, status: 'active', pageSize: 1 }),
          getDepartments({ hospitalId, status: 'active', pageSize: 1 }),
        ])
        setActiveUsers(activeUsersResult.total)
        setActiveDepartments(activeDeptsResult.total)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [hospitalId])

  const pendingMemos = memoCounts.pending_approval
  const pendingSensitiveRequests = sensitiveDataCounts.total
  const totalPendingApprovals = pendingMemos + pendingSensitiveRequests

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
              <Building2 className="w-6 h-6" />
              <h1 className="text-2xl font-bold">
                Hospital Administration Dashboard
              </h1>
            </div>
            <p className="text-primary-100">
              Welcome back, {user?.full_name?.split(' ')[0]}! Managing <span className="font-semibold">{hospitalName}</span>
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

      {/* Pending Approvals Alert */}
      {totalPendingApprovals > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">
                  {totalPendingApprovals} Item{totalPendingApprovals > 1 ? 's' : ''} Pending Approval
                </h3>
                <p className="text-sm text-amber-700">
                  {pendingMemos > 0 && `${pendingMemos} memo${pendingMemos > 1 ? 's' : ''}`}
                  {pendingMemos > 0 && pendingSensitiveRequests > 0 && ' • '}
                  {pendingSensitiveRequests > 0 && `${pendingSensitiveRequests} sensitive data request${pendingSensitiveRequests > 1 ? 's' : ''}`}
                  {sensitiveDataCounts.emergency > 0 && (
                    <span className="text-red-600 font-semibold"> ({sensitiveDataCounts.emergency} emergency!)</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingMemos > 0 && (
                <Button variant="outline" size="sm" as={Link} to={ROUTES.ADMIN_MEMOS}>
                  Review Memos
                </Button>
              )}
              {pendingSensitiveRequests > 0 && (
                <Button 
                  variant={sensitiveDataCounts.emergency > 0 ? 'danger' : 'primary'} 
                  size="sm" 
                  as={Link} 
                  to={ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS}
                >
                  Review Data Requests
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* System Health Summary */}
      {healthSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn(
            'rounded-xl p-5 border',
            healthSummary.overall_status === 'healthy' ? 'bg-green-50 border-green-200' :
            healthSummary.overall_status === 'warning' ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                statusColors[healthSummary.overall_status].bgColor
              )}>
                {healthSummary.overall_status === 'healthy' ? (
                  <CheckCircle className={cn('w-6 h-6', statusColors[healthSummary.overall_status].color)} />
                ) : (
                  <AlertTriangle className={cn('w-6 h-6', statusColors[healthSummary.overall_status].color)} />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Status: {healthSummary.overall_status.toUpperCase()}</h3>
                <p className="text-sm text-gray-600">
                  {healthSummary.active_sessions} active sessions • {healthSummary.uptime_percent}% uptime
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" as={Link} to={ROUTES.ADMIN_HOSPITAL_HEALTH}>
              View Details
            </Button>
          </div>
        </motion.div>
      )}

      {/* KPI Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={totalUsers}
            icon={Users}
            color="primary"
            link={ROUTES.ADMIN_USERS}
            subtitle={`${activeUsers} active`}
          />
          <StatCard
            title="Total Departments"
            value={totalDepartments}
            icon={Building2}
            color="info"
            link={ROUTES.ADMIN_DEPARTMENTS}
            subtitle={`${activeDepartments} active`}
          />
          <StatCard
            title="Pending Access Requests"
            value={pendingAccessRequests}
            icon={FileText}
            color={pendingAccessRequests > 0 ? 'warning' : 'success'}
            link={ROUTES.ADMIN_ACCESS_REQUESTS}
          />
          <StatCard
            title="System Uptime"
            value={`${healthSummary?.uptime_percent?.toFixed(2) || 0}%`}
            icon={Activity}
            color={healthSummary && healthSummary.uptime_percent < 99 ? 'warning' : 'success'}
            subtitle="Last 30 days"
          />
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Memos"
          value={pendingMemos}
          icon={Megaphone}
          color={pendingMemos > 0 ? 'warning' : 'success'}
          link={ROUTES.ADMIN_MEMOS}
        />
        <StatCard
          title="Data Access Requests"
          value={pendingSensitiveRequests}
          icon={Lock}
          color={sensitiveDataCounts.emergency > 0 ? 'error' : pendingSensitiveRequests > 0 ? 'warning' : 'success'}
          link={ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS}
        />
        <StatCard
          title="Active Sessions"
          value={healthSummary?.active_sessions || 0}
          icon={Activity}
          color="success"
          subtitle={`Max: ${healthSummary?.max_sessions || 0}`}
        />
        <StatCard
          title="Storage Used"
          value={`${healthSummary?.storage_used_gb?.toFixed(1) || 0} GB`}
          icon={Database}
          color={healthSummary && healthSummary.storage_used_gb / healthSummary.storage_total_gb > 0.8 ? 'warning' : 'success'}
          subtitle={`of ${healthSummary?.storage_total_gb || 0} GB`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 card"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                Service Status
              </h2>
              <Button variant="ghost" size="sm" as={Link} to={ROUTES.ADMIN_HOSPITAL_HEALTH}>
                View All
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.slice(0, 6).map((service) => (
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
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>

          <div className="p-4 space-y-3">
            <Link to={ROUTES.ADMIN_ACCESS_REQUESTS}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Review Access Requests</p>
                  <p className="text-xs text-gray-500">Approve or deny user registrations</p>
                </div>
              </motion.div>
            </Link>

            <Link to={ROUTES.ADMIN_MEMOS}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Approve Memos</p>
                  <p className="text-xs text-gray-500">Review memo submissions</p>
                </div>
                {pendingMemos > 0 && (
                  <Badge variant="warning">{pendingMemos}</Badge>
                )}
              </motion.div>
            </Link>

            <Link to={ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Sensitive Data Requests</p>
                  <p className="text-xs text-gray-500">Manage patient data access</p>
                </div>
                {pendingSensitiveRequests > 0 && (
                  <Badge variant={sensitiveDataCounts.emergency > 0 ? 'error' : 'warning'}>
                    {pendingSensitiveRequests}
                  </Badge>
                )}
              </motion.div>
            </Link>

            <Link to={ROUTES.ADMIN_HOSPITAL_LOGS}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <ScrollText className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">View System Logs</p>
                  <p className="text-xs text-gray-500">Monitor system activities</p>
                </div>
              </motion.div>
            </Link>

            <Link to={ROUTES.ADMIN_HOSPITAL_BACKUPS}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Check Backup Status</p>
                  <p className="text-xs text-gray-500">View backup history</p>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Additional Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" as={Link} to={ROUTES.ADMIN_USERS}>
            <Users className="w-6 h-6" />
            <span>Manage Users</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" as={Link} to={ROUTES.ADMIN_DEPARTMENTS}>
            <Building2 className="w-6 h-6" />
            <span>Departments</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" as={Link} to={ROUTES.ADMIN_ROLES}>
            <Shield className="w-6 h-6" />
            <span>Permissions</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" as={Link} to={ROUTES.ADMIN_SETTINGS}>
            <Settings className="w-6 h-6" />
            <span>Hospital Settings</span>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default HospitalAdminDashboard
