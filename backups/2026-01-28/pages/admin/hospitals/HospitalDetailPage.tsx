import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Shield,
  User,
  UserPlus,
  Key,
  XCircle,
  Settings,
  Users,
  Activity,
  BarChart3,
  Package,
  ScrollText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Database,
  Zap,
  HardDrive,
} from 'lucide-react'
import { Button, Badge, LoadingOverlay, Modal, ConfirmationDialog, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { getHospitalById, updateHospital } from '@/services/hospitalService'
import { getHospitalsWithAdmin } from '@/services/systemAdminService'
import { resetHospitalAdminPassword, disableHospitalAdmin } from '@/services/hospitalAdminService'
import { getHospitalModules } from '@/services/moduleService'
import { getFacilityStatistics, getFacilityLogs } from '@/services/facilityService'
import { getHospitalLogs } from '@/services/hospitalLogService'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES, HOSPITAL_STATUS } from '@/lib/constants'
import { formatDate, formatDateTime } from '@/lib/utils'
import { HospitalForm } from '@/components/forms/HospitalForm'
import { HospitalAdminForm } from '@/components/forms/HospitalAdminForm'
import { cn } from '@/lib/utils'
import type { Hospital, HospitalWithAdmin, HospitalModuleWithRelations, FacilityStatistics } from '@/types'

export const HospitalDetailPage: React.FC = () => {
  const { hospitalId, clinicId } = useParams<{ hospitalId?: string; clinicId?: string }>()
  const facilityId = hospitalId || clinicId
  const isClinic = !!clinicId
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  const isSystemAdmin = user?.role?.role_code === 'system_admin'
  const [hospital, setHospital] = useState<HospitalWithAdmin | null>(null)
  const [modules, setModules] = useState<HospitalModuleWithRelations[]>([])
  const [statistics, setStatistics] = useState<FacilityStatistics | null>(null)
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (facilityId && facilityId !== 'new') {
      fetchHospital()
    } else {
      setIsLoading(false)
      setIsEditMode(true)
    }
  }, [facilityId])

  const fetchHospital = async () => {
    if (!facilityId) return

    setIsLoading(true)
    try {
      // First get the basic hospital data
      const hospitalData = await getHospitalById(facilityId)
      if (!hospitalData) {
        setHospital(null)
        setIsLoading(false)
        return
      }

      // For System Admin, get enhanced data with admin info
      if (isSystemAdmin) {
        // Get hospitals with admin info and find the matching one
        const result = await getHospitalsWithAdmin(1, 1000) // Get all to find by ID
        const hospitalWithAdmin = result.data.find((h) => h.id === facilityId)
        
        if (hospitalWithAdmin) {
          setHospital(hospitalWithAdmin)

          // Fetch all related data
          const [modulesResult, statsResult, logsResult] = await Promise.all([
            getHospitalModules(facilityId),
            getFacilityStatistics(facilityId),
            getFacilityLogs(facilityId, 10),
          ])

          if (modulesResult.data) {
            setModules(modulesResult.data)
          }
          if (statsResult) {
            setStatistics(statsResult)
          }
          if (logsResult) {
            setRecentLogs(logsResult)
          }
        } else {
          // Fallback: use basic hospital data
          setHospital(hospitalData as HospitalWithAdmin)
        }
      } else {
        setHospital(hospitalData as HospitalWithAdmin)
      }
    } catch (error) {
      console.error('Error fetching hospital:', error)
      toast.error('Error', `Failed to load ${isClinic ? 'clinic' : 'hospital'} details`)
      navigate(isClinic ? ROUTES.ADMIN_CLINICS : ROUTES.ADMIN_HOSPITALS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!hospital) return

    try {
      const updatedHospital = await updateHospital(hospital.id, {
        status: newStatus as Hospital['status'],
      })
      setHospital(updatedHospital as HospitalWithAdmin)
      toast.success('Success', `Hospital status updated to ${newStatus}`)
    } catch (error) {
      toast.error('Error', 'Failed to update hospital status')
    }
  }

  const handleResetPassword = async () => {
    if (!hospital?.admin) return

    setIsResettingPassword(true)
    try {
      const newPassword = Math.random().toString(36).slice(-12) + 'A1!'
      const result = await resetHospitalAdminPassword(hospital.admin.id, newPassword)

      if (result.data) {
        toast.success('Success', `Password reset successfully. New password: ${newPassword}`)
        setShowResetPasswordModal(false)
      } else {
        toast.error('Error', result.error || 'Failed to reset password')
      }
    } catch (error) {
      toast.error('Error', 'Failed to reset password')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleDisableAdmin = async () => {
    if (!hospital?.admin) return

    try {
      const result = await disableHospitalAdmin(hospital.admin.id)

      if (result.data) {
        toast.success('Success', 'Hospital Admin disabled successfully')
        setShowDisableModal(false)
        fetchHospital()
      } else {
        toast.error('Error', result.error || 'Failed to disable admin')
      }
    } catch (error) {
      toast.error('Error', 'Failed to disable admin')
    }
  }

  const handleAdminCreated = () => {
    setShowAdminForm(false)
    fetchHospital()
  }

  if (isLoading) {
    return <LoadingOverlay fullScreen message="Loading hospital details..." />
  }

  if (isEditMode || hospitalId === 'new') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                if (facilityId === 'new') {
                  navigate(isClinic ? ROUTES.ADMIN_CLINICS : ROUTES.ADMIN_HOSPITALS)
                } else {
                  setIsEditMode(false)
                  fetchHospital()
                }
              }}
              leftIcon={<ArrowLeft className="w-5 h-5" />}
            >
              Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">
              {facilityId === 'new' ? `Create New ${isClinic ? 'Clinic' : 'Hospital'}` : `Edit ${isClinic ? 'Clinic' : 'Hospital'}`}
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <HospitalForm
            hospital={hospital || undefined}
            onSuccess={async () => {
              if (facilityId === 'new') {
                // After creating, navigate back to list
                navigate(isClinic ? ROUTES.ADMIN_CLINICS : ROUTES.ADMIN_HOSPITALS)
              } else {
                // After updating, refresh the data
                setIsEditMode(false)
                await fetchHospital()
              }
            }}
            onCancel={() => {
              if (facilityId === 'new') {
                navigate(isClinic ? ROUTES.ADMIN_CLINICS : ROUTES.ADMIN_HOSPITALS)
              } else {
                setIsEditMode(false)
                fetchHospital()
              }
            }}
          />
        </div>
      </div>
    )
  }

  if (!hospital) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Hospital not found</p>
      </div>
    )
  }

  // If no admin, show admin creation view
  if (isSystemAdmin && !hospital.admin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(ROUTES.ADMIN_HOSPITALS)}
              leftIcon={<ArrowLeft className="w-5 h-5" />}
            >
              Back to Hospitals
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">{isClinic ? 'Clinic' : 'Hospital'} Details</h1>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">{hospital.hospital_name}</h2>
            <p className="text-slate-600 mb-6">No {isClinic ? 'Clinic' : 'Hospital'} Admin assigned. Create one to enable {isClinic ? 'clinic' : 'hospital'} management.</p>
            <Button variant="primary" onClick={() => setShowAdminForm(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
              Create {isClinic ? 'Clinic' : 'Hospital'} Admin
            </Button>
          </div>
        </div>

        {showAdminForm && hospital && (
          <Modal isOpen={showAdminForm} onClose={() => setShowAdminForm(false)} title={`Create ${isClinic ? 'Clinic' : 'Hospital'} Admin`} size="lg">
            <HospitalAdminForm
              hospitalId={hospital.id}
              hospitalName={hospital.hospital_name}
              existingAdmin={null}
              onSuccess={handleAdminCreated}
              onCancel={() => setShowAdminForm(false)}
            />
          </Modal>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(isClinic ? ROUTES.ADMIN_CLINICS : ROUTES.ADMIN_HOSPITALS)}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            Back to {isClinic ? 'Clinics' : 'Hospitals'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{hospital.hospital_name}</h1>
            <p className="text-sm text-slate-600 font-mono">{hospital.hospital_code}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsEditMode(true)} leftIcon={<Edit className="w-5 h-5" />}>
              Edit {isClinic ? 'Clinic' : 'Hospital'}
            </Button>
          </div>
        </div>
      </div>

      {/* Facility Admin Section */}
      {isSystemAdmin && hospital.admin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Hospital Admin</h3>
                <p className="text-sm text-slate-600">{hospital.admin.full_name} • {hospital.admin.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetPasswordModal(true)}
                leftIcon={<Key className="w-4 h-4" />}
              >
                Reset Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDisableModal(true)}
                leftIcon={<XCircle className="w-4 h-4" />}
                className="text-error-600 hover:text-error-700"
              >
                Disable
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs for Comprehensive View */}
      {isSystemAdmin && hospital.admin && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b border-slate-200 rounded-t-xl rounded-b-none p-0">
              <TabsTrigger value="overview" className="rounded-t-xl rounded-b-none">
                Overview
              </TabsTrigger>
              <TabsTrigger value="kpi">KPI & Metrics</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Facility Information</h3>
                  <div className="space-y-3">
                    <InfoItem icon={MapPin} label="Address" value={hospital.address || 'N/A'} />
                    <InfoItem icon={MapPin} label="State" value={hospital.state || 'N/A'} />
                    <InfoItem icon={Phone} label="Phone" value={hospital.phone || 'N/A'} />
                    <InfoItem icon={Mail} label="Email" value={hospital.email || 'N/A'} />
                    <InfoItem icon={Clock} label="Created" value={formatDate(hospital.created_at)} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      title="Total Users"
                      value={statistics?.totalUsers || hospital.user_count || 0}
                      icon={Users}
                      color="primary"
                    />
                    <StatCard
                      title="Active Users"
                      value={statistics?.activeUsers || hospital.active_user_count || 0}
                      icon={User}
                      color="success"
                    />
                    <StatCard
                      title="Enabled Modules"
                      value={`${statistics?.enabledModules || 0}/${statistics?.totalModules || 0}`}
                      icon={Package}
                      color="info"
                    />
                    <StatCard
                      title="Total Roles"
                      value={statistics?.totalRoles || 0}
                      icon={Shield}
                      color="warning"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* KPI & Metrics Tab */}
            <TabsContent value="kpi" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Users"
                  value={statistics?.totalUsers || 0}
                  subtitle={`${statistics?.activeUsers || 0} active`}
                  icon={Users}
                  trend="up"
                />
                <KPICard
                  title="Module Coverage"
                  value={`${statistics?.enabledModules || 0}/${statistics?.totalModules || 0}`}
                  subtitle="Modules enabled"
                  icon={Package}
                  trend="neutral"
                />
                <KPICard
                  title="System Health"
                  value={statistics?.performanceMetrics?.databaseHealth === 'healthy' ? 'Healthy' : 'Warning'}
                  subtitle="Database status"
                  icon={Activity}
                  trend={statistics?.performanceMetrics?.databaseHealth === 'healthy' ? 'up' : 'down'}
                />
                <KPICard
                  title="Recent Activity"
                  value={statistics?.recentLogsCount || 0}
                  subtitle="Logs (24h)"
                  icon={ScrollText}
                  trend="neutral"
                />
              </div>
            </TabsContent>

            {/* Modules Tab */}
            <TabsContent value="modules" className="p-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Module Access</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`${ROUTES.ADMIN_MODULES}?hospital=${hospital.id}`)}
                  leftIcon={<Settings className="w-4 h-4" />}
                >
                  Manage Modules
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statistics?.moduleBreakdown.map((module) => (
                  <div
                    key={module.code}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all',
                      module.enabled
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-slate-200 bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 capitalize">{module.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{module.code}</p>
                      </div>
                      <Badge variant={module.enabled ? 'success' : 'gray'}>
                        {module.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles" className="p-6 space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Role Distribution</h3>
              <div className="space-y-3">
                {statistics?.roleBreakdown.map((role) => (
                  <div key={role.roleName} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-slate-400" />
                      <span className="font-medium text-slate-900">{role.roleName}</span>
                    </div>
                    <Badge variant="primary">{role.userCount} users</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Users" value={statistics?.totalUsers || 0} icon={Users} color="primary" />
                <StatCard title="Active Users" value={statistics?.activeUsers || 0} icon={User} color="success" />
                <StatCard
                  title="Inactive Users"
                  value={(statistics?.totalUsers || 0) - (statistics?.activeUsers || 0)}
                  icon={User}
                  color="gray"
                />
              </div>
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => navigate(`${ROUTES.ADMIN_USERS}?hospital=${hospital.id}`)}
                  leftIcon={<Users className="w-4 h-4" />}
                >
                  View All Users
                </Button>
              </div>
            </TabsContent>

            {/* System Logs Tab */}
            <TabsContent value="logs" className="p-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Recent System Logs</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`${ROUTES.ADMIN_SYSTEM_LOGS}?hospital=${hospital.id}`)}
                  leftIcon={<ScrollText className="w-4 h-4" />}
                >
                  View All Logs
                </Button>
              </div>
              <div className="space-y-2">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                log.severity === 'critical' || log.severity === 'error'
                                  ? 'error'
                                  : log.severity === 'warning'
                                    ? 'warning'
                                    : 'gray'
                              }
                              size="sm"
                            >
                              {log.severity}
                            </Badge>
                            <span className="text-sm font-medium text-slate-900">{log.action}</span>
                          </div>
                          <p className="text-sm text-slate-600">{log.description}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatDateTime(log.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-8">No recent logs</p>
                )}
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="p-6 space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">System Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PerformanceCard
                  title="Database Health"
                  value={statistics?.performanceMetrics?.databaseHealth || 'healthy'}
                  icon={Database}
                  status={statistics?.performanceMetrics?.databaseHealth || 'healthy'}
                />
                <PerformanceCard
                  title="API Response Time"
                  value={`${statistics?.performanceMetrics?.apiResponseTime || 0} ms`}
                  icon={Zap}
                  status={statistics?.performanceMetrics?.apiResponseTime < 200 ? 'healthy' : 'warning'}
                />
                <PerformanceCard
                  title="Storage Usage"
                  value={`${statistics?.performanceMetrics?.storageUsage || 0}%`}
                  icon={HardDrive}
                  status={
                    (statistics?.performanceMetrics?.storageUsage || 0) > 80
                      ? 'critical'
                      : (statistics?.performanceMetrics?.storageUsage || 0) > 60
                        ? 'warning'
                        : 'healthy'
                  }
                />
                <PerformanceCard
                  title="Error Rate"
                  value={`${(statistics?.performanceMetrics?.errorRate || 0).toFixed(2)}%`}
                  icon={AlertCircle}
                  status={(statistics?.performanceMetrics?.errorRate || 0) > 1 ? 'warning' : 'healthy'}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Create Admin Modal */}
      {showAdminForm && hospital && (
        <Modal isOpen={showAdminForm} onClose={() => setShowAdminForm(false)} title="Create Hospital Admin" size="lg">
          <HospitalAdminForm
            hospitalId={hospital.id}
            hospitalName={hospital.hospital_name}
            existingAdmin={hospital.admin || null}
            onSuccess={handleAdminCreated}
            onCancel={() => setShowAdminForm(false)}
          />
        </Modal>
      )}

      {/* Reset Password Confirmation */}
      <ConfirmationDialog
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        onConfirm={handleResetPassword}
        title={`Reset ${isClinic ? 'Clinic' : 'Hospital'} Admin Password`}
        message={`Are you sure you want to reset the password for ${hospital?.admin?.full_name}? A new password will be generated and displayed.`}
        variant="warning"
        confirmText="Reset Password"
        cancelText="Cancel"
        isLoading={isResettingPassword}
      />

      {/* Disable Admin Confirmation */}
      <ConfirmationDialog
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={handleDisableAdmin}
        title={`Disable ${isClinic ? 'Clinic' : 'Hospital'} Admin`}
        message={`Are you sure you want to disable ${hospital?.admin?.full_name}? They will no longer be able to access the system. You can create a new admin later.`}
        variant="danger"
        confirmText="Disable Admin"
        cancelText="Cancel"
        requiresConfirmation={true}
        confirmationText="DISABLE"
      />
    </div>
  )
}

interface InfoItemProps {
  icon: React.ElementType
  label: string
  value: string
  fullWidth?: boolean
  small?: boolean
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, fullWidth, small }) => (
  <div className={cn('flex items-start gap-3', fullWidth && 'md:col-span-2')}>
    <Icon className={cn('text-slate-400 flex-shrink-0 mt-0.5', small ? 'w-4 h-4' : 'w-5 h-5')} />
    <div className="flex-1 min-w-0">
      <p className={cn('text-slate-500', small ? 'text-xs' : 'text-sm')}>{label}</p>
      <p className={cn('font-semibold text-slate-900 mt-0.5', small ? 'text-sm' : 'text-base')}>{value}</p>
    </div>
  </div>
)

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray'
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
    info: 'bg-info-50 text-info-600',
    gray: 'bg-slate-50 text-slate-600',
  }

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{title}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colorClasses[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  trend: 'up' | 'down' | 'neutral'
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon: Icon, trend }) => {
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{title}</span>
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  )
}

interface PerformanceCardProps {
  title: string
  value: string
  icon: React.ElementType
  status: 'healthy' | 'warning' | 'critical'
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({ title, value, icon: Icon, status }) => {
  const statusConfig = {
    healthy: { color: 'text-success-600', bg: 'bg-success-50', badge: 'success' as const },
    warning: { color: 'text-warning-600', bg: 'bg-warning-50', badge: 'warning' as const },
    critical: { color: 'text-error-600', bg: 'bg-error-50', badge: 'error' as const },
  }

  const config = statusConfig[status]

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">{title}</span>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-2">{value}</p>
      <Badge variant={config.badge} size="sm">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    </div>
  )
}

export default HospitalDetailPage
