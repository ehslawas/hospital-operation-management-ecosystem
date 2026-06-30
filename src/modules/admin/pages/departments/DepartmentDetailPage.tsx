// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Building2, Hash, User, FileText, Clock, Shield } from 'lucide-react'
import { Button, Badge, Avatar, LoadingOverlay } from '@/components/ui'
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

  if (isEditMode || departmentId === 'new') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
              leftIcon={<ArrowLeft className="w-5 h-5" />}
            >
              Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">
              {departmentId === 'new' ? 'Create New Department' : 'Edit Department'}
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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
      </div>
    )
  }

  if (!department) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Department not found</p>
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
            onClick={() => navigate(ROUTES.ADMIN_DEPARTMENTS)}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            Back to Departments
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Department Details</h1>
        </div>
        <div className="flex items-center gap-3">
          {!isHospitalAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsEditMode(true)}
              leftIcon={<Edit className="w-5 h-5" />}
            >
              Edit Department
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-teal-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">{department.department_name}</h2>
                  <Badge variant={department.status === 'active' ? 'success' : 'gray'}>
                    {department.status.charAt(0).toUpperCase() + department.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-slate-600 mb-4 font-mono font-semibold">{department.department_code}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <InfoItem
                    icon={Building2}
                    label="Hospital"
                    value={department.hospital?.hospital_name || 'N/A'}
                  />
                  <InfoItem
                    icon={User}
                    label="Head of Department"
                    value={department.head_of_department?.full_name || 'Not assigned'}
                  />
                  {department.description && (
                    <InfoItem
                      icon={FileText}
                      label="Description"
                      value={department.description}
                      fullWidth
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card - Only for System Admin */}
          {!isHospitalAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Status Management</h3>
              <div className="space-y-2">
                {Object.entries(DEPARTMENT_STATUS).map(([key, value]) => (
                  <button
                    key={value}
                    onClick={() => handleStatusChange(value)}
                    className={cn(
                      'w-full text-left px-4 py-2 rounded-lg border transition-colors',
                      department.status === value
                        ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Information</h3>
            <div className="space-y-3">
              <InfoItem icon={Clock} label="Created" value={formatDate(department.created_at)} small />
              <InfoItem
                icon={Clock}
                label="Last Updated"
                value={department.updated_at ? formatDate(department.updated_at) : 'Never'}
                small
              />
            </div>
          </motion.div>
        </div>
      </div>
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
      <p className={cn('font-semibold text-slate-900 mt-0.5', small ? 'text-sm' : 'text-base')}>
        {value}
      </p>
    </div>
  </div>
)

export default DepartmentDetailPage

