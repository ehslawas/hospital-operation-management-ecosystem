import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Building2, Hash, User, FileText, Clock, Shield, Phone, Mail, CheckCircle, AlertCircle, RefreshCw, MapPin, Zap, Users } from 'lucide-react'
import { Button, Badge, LoadingOverlay } from '@/components/ui'
import { AdminPageLayout } from '@/components/admin'
import { getDepartmentById, updateDepartment } from '@/services/departmentService'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES, DEPARTMENT_STATUS, SYSTEM_ROLES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { DepartmentForm } from '@/components/forms/DepartmentForm'
import { cn } from '@/lib/utils'
import type { DepartmentWithRelations } from '@/types'

export const DepartmentDetailPage: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const isSystemAdmin = user?.role?.role_code === SYSTEM_ROLES.SYSTEM_ADMIN
  const canModify = isSystemAdmin || isHospitalAdmin
  const userHospitalId = user?.hospital_id

  const [department, setDepartment] = useState<DepartmentWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    if (departmentId === 'new' && isHospitalAdmin) {
      toast.error('Access Denied', 'Hospital Administrators cannot create departments directly.')
      navigate(ROUTES.ADMIN_DEPARTMENTS)
      return
    }

    if (departmentId && departmentId !== 'new') {
      fetchDepartment()
    } else {
      setIsLoading(false)
      setIsEditMode(true)
    }
  }, [departmentId, isHospitalAdmin])

  const fetchDepartment = async () => {
    if (!departmentId) return

    setIsLoading(true)
    try {
      const departmentData = await getDepartmentById(departmentId)

      // For Hospital Admin, check if department belongs to their hospital
      if (isHospitalAdmin && departmentData && departmentData.hospital_id !== userHospitalId) {
        toast.error('Error', 'You do not have permission to view this department')
        navigate(ROUTES.ADMIN_DEPARTMENTS)
        return
      }

      setDepartment(departmentData)
    } catch (error) {
      toast.error('Error', 'Failed to load department details')
      navigate(ROUTES.ADMIN_DEPARTMENTS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!department) return

    try {
      const updatedDepartment = await updateDepartment(department.id, {
        status: newStatus as DepartmentWithRelations['status'],
      })
      setDepartment(updatedDepartment as DepartmentWithRelations)
      toast.success('Success', `Department status updated to ${newStatus}`)
    } catch (error) {
      toast.error('Error', 'Failed to update department status')
    }
  }

  if (isLoading) {
    return <LoadingOverlay fullScreen message="Loading department details..." />
  }

  const headerActions = (
    <div className="flex items-center gap-3">
      {department && !isEditMode && canModify && (
        <Button
          variant="primary"
          onClick={() => setIsEditMode(true)}
          leftIcon={<Edit className="w-5 h-5" />}
          className="bg-royal-blue hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl px-5"
        >
          Edit Department
        </Button>
      )}
      {isEditMode && (
        <Button
          variant="ghost"
          onClick={() => {
            if (departmentId === 'new') {
              navigate(ROUTES.ADMIN_DEPARTMENTS)
            } else {
              setIsEditMode(false)
              fetchDepartment()
            }
          }}
          className="text-slate-500 hover:text-royal-blue hover:bg-royal-blue/5 rounded-xl"
        >
          Cancel
        </Button>
      )}
    </div>
  )

  if (isEditMode || departmentId === 'new') {
    return (
      <AdminPageLayout
        title={departmentId === 'new' ? 'Create New Department' : 'Edit Department'}
        description={departmentId === 'new' ? 'Configure a new organizational unit' : `Update configurations for ${department?.department_name}`}
        icon={departmentId === 'new' ? Building2 : Edit}
        breadcrumbs={[
          { label: 'Departments', href: ROUTES.ADMIN_DEPARTMENTS },
          { label: departmentId === 'new' ? 'New' : 'Edit' }
        ]}
        actions={headerActions}
      >
        <div className="glass-card rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-xl shadow-blue-900/5 p-8">
          <DepartmentForm
            department={department || undefined}
            onSuccess={() => {
              if (departmentId === 'new') {
                navigate(ROUTES.ADMIN_DEPARTMENTS)
              } else {
                setIsEditMode(false)
                fetchDepartment()
              }
            }}
            onCancel={() => {
              if (departmentId === 'new') {
                navigate(ROUTES.ADMIN_DEPARTMENTS)
              } else {
                setIsEditMode(false)
                fetchDepartment()
              }
            }}
          />
        </div>
      </AdminPageLayout>
    )
  }

  if (!department) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="p-4 bg-slate-100 rounded-full mb-4">
          <AlertCircle className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Department Not Found</h3>
        <p className="text-slate-500 mt-2 max-w-xs mx-auto">
          The department you are looking for might have been removed or you don't have access to it.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate(ROUTES.ADMIN_DEPARTMENTS)}
          className="mt-6 rounded-xl"
          leftIcon={<ArrowLeft className="w-5 h-5" />}
        >
          Back to List
        </Button>
      </div>
    )
  }

  return (
    <AdminPageLayout
      title="Department Details"
      description="Detailed overview and configuration of the organizational unit."
      icon={Building2}
      breadcrumbs={[
        { label: 'Departments', href: ROUTES.ADMIN_DEPARTMENTS },
        { label: department.department_name }
      ]}
      actions={headerActions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-xl shadow-blue-900/5 p-8"
          >
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="w-24 h-24 bg-gradient-to-br from-royal-blue to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
                <Building2 className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{department.department_name}</h2>
                  <Badge
                    variant={department.status === 'active' ? 'success' : 'gray'}
                    className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm"
                  >
                    {department.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <div className="flex items-center gap-2 text-royal-blue font-mono font-bold bg-royal-blue/5 px-3 py-1.5 rounded-lg border border-royal-blue/10 text-sm">
                    <Hash className="w-4 h-4" />
                    <span>{department.department_code}</span>
                  </div>
                  {department.kkm_unit_code && (
                    <div className="flex items-center gap-2 text-indigo-600 font-mono font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 text-sm">
                      <span className="text-xs uppercase tracking-wider text-indigo-400">KKM</span>
                      <span>{department.kkm_unit_code}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6">
                  <InfoItem
                    icon={Building2}
                    label="Parent Hospital"
                    value={department.hospital?.hospital_name || 'N/A'}
                  />
                  <InfoItem
                    icon={User}
                    label="Head of Department"
                    value={department.head_of_department?.full_name || 'Not assigned'}
                  />
                  <InfoItem
                    icon={Users}
                    label="Total Staff"
                    value={department.staff_count ? `${department.staff_count} Staff Members` : 'No staff assigned'}
                  />
                  <InfoItem
                    icon={Zap}
                    label="Unit Type"
                    value={department.unit_type ? department.unit_type.replace('_', ' ') : 'Standard'}
                    valueClassName="capitalize"
                  />
                  <InfoItem
                    icon={MapPin}
                    label="Location"
                    value={department.location || 'Not specified'}
                  />
                  <InfoItem
                    icon={Phone}
                    label="Contact Phone"
                    value={department.phone || 'N/A'}
                  />
                  <InfoItem
                    icon={Mail}
                    label="Contact Email"
                    value={department.email || 'N/A'}
                  />
                  {department.description && (
                    <InfoItem
                      icon={FileText}
                      label="Department Description"
                      value={department.description}
                      fullWidth
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Department Staff Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-xl shadow-blue-900/5 p-8"
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-royal-blue/10 rounded-xl text-royal-blue shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Department Staff</h3>
                  <p className="text-sm text-slate-500 font-medium">Healthcare professionals & administrative personnel</p>
                </div>
              </div>
              <Badge variant="info" className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                {department.staff_count || 0} Members
              </Badge>
            </div>

            {department.staff && department.staff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {department.staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-5 p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-royal-blue/30 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-royal-blue/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:bg-royal-blue/10 transition-colors" />

                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-md flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 ring-2 ring-royal-blue/5">
                        {member.profile_photo_url ? (
                          <img src={member.profile_photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                            <User className="w-7 h-7 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" title="Active Account" />
                    </div>

                    <div className="flex-1 min-w-0 relative">
                      <h4 className="font-bold text-slate-900 truncate group-hover:text-royal-blue transition-colors text-base">
                        {member.full_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-royal-blue tracking-wide bg-royal-blue/5 px-2 py-0.5 rounded-md border border-royal-blue/10 uppercase">
                          {member.role?.role_name || member.jawatan || 'Staff Member'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                        {member.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[150px]">{member.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium font-mono">
                          <Hash className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.employee_id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200/50">
                <div className="p-4 bg-white rounded-full w-fit mx-auto mb-4 shadow-md">
                  <User className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">No Staff Members</h4>
                <p className="text-slate-500 font-medium mt-1">Assignments will appear here once users are linked to this department.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Status Management - Premium Look */}
          {canModify && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-xl shadow-blue-900/5 p-6"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-royal-blue" />
                Operational Status
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(DEPARTMENT_STATUS).map(([_, value]) => (
                  <button
                    key={value}
                    onClick={() => handleStatusChange(value)}
                    className={cn(
                      'flex items-center justify-between w-full px-5 py-4 rounded-xl border transition-all duration-300 group',
                      department.status === value
                        ? 'bg-royal-blue border-royal-blue text-white shadow-lg shadow-blue-200'
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-royal-blue/30 hover:shadow-md'
                    )}
                  >
                    <span className="font-bold tracking-wide">
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                    {department.status === value && (
                      <CheckCircle className="w-5 h-5 text-white animate-in zoom-in duration-300" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Audit Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl border border-slate-200/60 bg-white shadow-lg p-6"
          >
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Record Audit</h3>
            <div className="space-y-5">
              <InfoItem icon={Clock} label="Department Created" value={formatDate(department.created_at)} small />
              <InfoItem
                icon={RefreshCw}
                label="Last Configuration Update"
                value={department.updated_at ? formatDate(department.updated_at) : 'Never'}
                small
              />
            </div>
          </motion.div>
        </div>
      </div>
    </AdminPageLayout>
  )
}

interface InfoItemProps {
  icon: React.ElementType
  label: string
  value: string
  fullWidth?: boolean
  small?: boolean
  valueClassName?: string
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, fullWidth, small, valueClassName }) => (
  <div className={cn('flex items-start gap-4', fullWidth && 'md:col-span-2')}>
    <div className={cn(
      'bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0',
      small ? 'w-8 h-8' : 'w-10 h-10'
    )}>
      <Icon className={cn('text-slate-400', small ? 'w-4 h-4' : 'w-5 h-5')} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn('text-slate-500 font-medium', small ? 'text-[10px] uppercase tracking-wider' : 'text-xs uppercase tracking-widest')}>{label}</p>
      <p className={cn('font-bold text-slate-800 mt-1 break-words', small ? 'text-sm' : 'text-lg leading-tight', valueClassName)}>
        {value}
      </p>
    </div>
  </div>
)

export default DepartmentDetailPage

