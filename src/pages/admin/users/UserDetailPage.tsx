import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  User,
  Mail,
  Hash,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  RotateCcw
} from 'lucide-react'
import { Button, Badge, Avatar, LoadingOverlay, ConfirmationDialog } from '@/components/ui'
import { AdminPageLayout } from '@/components/admin'
import { getUserById, deleteUser, updateUser } from '@/services/userService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES, USER_STATUS, SYSTEM_ROLES } from '@/lib/constants'
import { formatDate, cn } from '@/lib/utils'
import { UserForm } from '@/components/forms'
import type { UserWithRelations } from '@/types'

export const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { error: showError, success: showSuccess } = useToastStore()
  const { user: currentUser } = useAuthStore()

  const [user, setUser] = useState<UserWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Confirmation State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => Promise<void>
    variant: 'danger' | 'warning' | 'info' | 'success'
    confirmText?: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => { },
    variant: 'danger'
  })

  useEffect(() => {
    if (userId && userId !== 'new') {
      fetchUser()
    } else {
      setIsLoading(false)
      setIsEditMode(true)
    }
  }, [userId])

  const fetchUser = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const userData = await getUserById(userId)

      // CRITICAL: Protect System Admin Identity
      const isHospitalAdmin = currentUser?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
      if (userData?.role?.role_code === SYSTEM_ROLES.SYSTEM_ADMIN && isHospitalAdmin) {
        showError('Permission Denied', 'You do not have permission to view this user.')
        navigate(ROUTES.ADMIN_USERS)
        return
      }

      setUser(userData)
    } catch (error) {
      showError('Error', 'Failed to load user details')
      navigate(ROUTES.ADMIN_USERS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    setIsDeleting(true)
    try {
      await deleteUser(user.id)
      showSuccess('Success', 'User deleted successfully')
      navigate(ROUTES.ADMIN_USERS)
    } catch (error) {
      showError('Error', 'Failed to delete user')
    } finally {
      setIsDeleting(false)
      setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    }
  }

  const confirmDelete = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete ${user?.full_name}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete User',
      onConfirm: handleDelete
    })
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return
    try {
      const updatedUser = await updateUser(user.id, { status: newStatus as UserWithRelations['status'] })
      setUser(prev => prev ? { ...prev, status: updatedUser.status } : null) // Optimistic update or set from response
      showSuccess('Success', `User status updated to ${newStatus}`)
    } catch (error) {
      showError('Error', 'Failed to update user status')
    }
  }

  const statusColors = {
    active: 'success',
    inactive: 'gray',
    suspended: 'error',
    pending: 'warning',
  } as const

  if (isLoading) {
    return <LoadingOverlay fullScreen message="Loading user details..." />
  }

  if ((!user && userId !== 'new') || (!isEditMode && !user)) {
    return (
      <AdminPageLayout
        title="User Not Found"
        description="The requested user could not be found."
        icon={User}
        breadcrumbs={[{ label: 'Users', href: ROUTES.ADMIN_USERS }, { label: 'Not Found' }]}
      >
        <div className="flex flex-col items-center justify-center py-12">
          <User className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">User Not Found</h2>
          <p className="text-slate-500 mt-2 mb-6">The user you are looking for does not exist or has been deleted.</p>
          <Button onClick={() => navigate(ROUTES.ADMIN_USERS)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Users
          </Button>
        </div>
      </AdminPageLayout>
    )
  }

  // EDIT MODE
  if (isEditMode) {
    return (
      <AdminPageLayout
        title={userId === 'new' ? 'Create New User' : 'Edit User'}
        description={userId === 'new' ? 'Add a new user to the system' : `Editing profile for ${user?.full_name}`}
        icon={userId === 'new' ? User : Edit}
        breadcrumbs={[
          { label: 'Users', href: ROUTES.ADMIN_USERS },
          { label: userId === 'new' ? 'New User' : user?.full_name || 'Edit User' }
        ]}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
            <UserForm
              key={user?.updated_at ? new Date(user.updated_at).getTime() : 'new'}
              user={user || undefined}
              onSuccess={() => {
                if (userId === 'new') {
                  navigate(ROUTES.ADMIN_USERS)
                } else {
                  setIsEditMode(false)
                  fetchUser()
                }
              }}
              onCancel={() => {
                if (userId === 'new') {
                  navigate(ROUTES.ADMIN_USERS)
                } else {
                  setIsEditMode(false)
                }
              }}
            />
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  // VIEW MODE
  return (
    <AdminPageLayout
      title="User Details"
      description={`View details for ${user?.full_name}`}
      icon={User}
      breadcrumbs={[{ label: 'Users', href: ROUTES.ADMIN_USERS }, { label: user?.full_name || 'Details' }]}
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsEditMode(true)}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            Edit User
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete User
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden"
          >
            {/* Decorative Background */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10" />

            <div className="relative flex items-start gap-6 pt-4">
              <Avatar
                src={user?.profile_photo_url}
                name={user?.full_name}
                size="xl"
                className="ring-4 ring-white shadow-lg"
              />
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-slate-900 truncate">{user?.full_name}</h2>
                  <Badge variant={statusColors[user?.status || 'inactive']}>
                    {user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown'}
                  </Badge>
                </div>
                <p className="text-slate-500 font-medium mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {user?.email}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 mt-6 pt-6 border-t border-slate-100">
                  <InfoItem icon={Hash} label="Employee ID" value={user?.employee_id} mono />
                  <InfoItem icon={Shield} label="Role" value={user?.role?.role_name} />
                  <InfoItem icon={Building2} label="Hospital" value={user?.hospital?.hospital_name} />
                  <InfoItem icon={Briefcase} label="Department" value={user?.department?.department_name} highlight />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-indigo-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem icon={Hash} label="IC Number" value={user?.ic_number} mono />
              <InfoItem icon={Phone} label="Phone" value={user?.phone_number} />
              <InfoItem
                icon={Calendar}
                label="Date of Birth"
                value={user?.date_of_birth ? formatDate(user.date_of_birth) : undefined}
              />
              <InfoItem
                icon={User}
                label="Gender"
                value={user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : undefined}
              />
              <InfoItem
                icon={MapPin}
                label="Address"
                value={user?.address}
                fullWidth
              />
              <InfoItem icon={Briefcase} label="Position (Jawatan)" value={user?.jawatan} fullWidth />
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Status & Access</h3>
            <div className="space-y-2">
              {Object.entries(USER_STATUS).map(([, value]) => (
                <button
                  key={value}
                  onClick={() => handleStatusChange(value)}
                  disabled={user?.status === value}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between group',
                    user?.status === value
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  )}
                >
                  <span className="capitalize">{value}</span>
                  {user?.status === value && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Account Activity</h3>
            <div className="space-y-4">
              <InfoItem
                icon={Clock}
                label="Created At"
                value={user?.created_at ? formatDate(user.created_at) : undefined}
                small
              />
              <InfoItem
                icon={RotateCcw}
                label="Last Updated"
                value={user?.updated_at ? formatDate(user.updated_at) : undefined}
                small
              />
              <InfoItem
                icon={User}
                label="Last Login"
                value={user?.last_login ? formatDate(user.last_login) : 'Never'}
                small
              />

              {(user?.failed_login_attempts || 0) > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      {user?.failed_login_attempts} failed login attempt(s)
                    </span>
                  </div>
                </div>
              )}

              {user?.account_locked_until && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="flex items-center gap-2 text-rose-800">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      Locked until {formatDate(user.account_locked_until)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText}
        isLoading={isDeleting}
      />
    </AdminPageLayout>
  )
}

interface InfoItemProps {
  icon: React.ElementType
  label: string
  value?: string | null
  fullWidth?: boolean
  small?: boolean
  mono?: boolean
  highlight?: boolean
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, fullWidth, small, mono, highlight }) => (
  <div className={cn('flex items-start gap-3', fullWidth && 'md:col-span-2')}>
    <div className={cn(
      "flex-shrink-0 rounded-lg flex items-center justify-center",
      highlight ? "text-indigo-600 bg-indigo-50 p-1.5" : "text-slate-400 mt-0.5"
    )}>
      <Icon className={cn(small ? 'w-4 h-4' : 'w-5 h-5')} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn('text-slate-500 font-medium', small ? 'text-xs' : 'text-xs uppercase tracking-wide mb-0.5')}>{label}</p>
      <p className={cn(
        'text-slate-900 truncate',
        small ? 'text-sm' : 'text-base font-medium',
        mono && 'font-mono'
      )}>
        {value || 'N/A'}
      </p>
    </div>
  </div>
)

export default UserDetailPage
