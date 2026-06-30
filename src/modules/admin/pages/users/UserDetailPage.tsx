// @ts-nocheck
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
} from 'lucide-react'
import { Button, Badge, Avatar, LoadingOverlay, Modal } from '@/components/ui'
import { getUserById, deleteUser, updateUser } from '@/services/userService'
import { useToast } from '@/stores/toastStore'
import { ROUTES, USER_STATUS } from '@/lib/constants'
import { formatDate, cn } from '@/lib/utils'
import { UserForm } from '@/components/forms'
import type { UserWithRelations } from '@/types'

export const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [user, setUser] = useState<UserWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

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
      setUser(userData)
    } catch (error) {
      toast.error('Error', 'Failed to load user details')
      navigate(ROUTES.ADMIN_USERS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    try {
      await deleteUser(user.id)
      toast.success('Success', 'User deleted successfully')
      navigate(ROUTES.ADMIN_USERS)
    } catch (error) {
      toast.error('Error', 'Failed to delete user')
    } finally {
      setShowDeleteModal(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return

    try {
      const updatedUser = await updateUser(user.id, { status: newStatus as UserWithRelations['status'] })
      setUser(updatedUser)
      toast.success('Success', `User status updated to ${newStatus}`)
    } catch (error) {
      toast.error('Error', 'Failed to update user status')
    }
  }

  if (isLoading) {
    return <LoadingOverlay fullScreen message="Loading user details..." />
  }

  if (isEditMode || userId === 'new') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                if (userId === 'new') {
                  navigate(ROUTES.ADMIN_USERS)
                } else {
                  setIsEditMode(false)
                  fetchUser()
                }
              }}
              leftIcon={<ArrowLeft className="w-5 h-5" />}
            >
              Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">
              {userId === 'new' ? 'Create New User' : 'Edit User'}
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <UserForm
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
                fetchUser()
              }
            }}
          />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">User not found</p>
      </div>
    )
  }

  const statusColors = {
    active: 'success',
    inactive: 'gray',
    suspended: 'error',
    pending: 'warning',
  } as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.ADMIN_USERS)}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            Back to Users
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsEditMode(true)}
            leftIcon={<Edit className="w-5 h-5" />}
          >
            Edit User
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex items-start gap-6">
              <Avatar
                src={user.profile_photo_url}
                alt={user.full_name}
                fallback={user.full_name.charAt(0)}
                size="xl"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">{user.full_name}</h2>
                  <Badge variant={statusColors[user.status]}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-slate-600 mb-4">{user.email}</p>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Employee ID:</span>
                    <span className="font-mono font-semibold text-slate-900">{user.employee_id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Role:</span>
                    <span className="font-semibold text-slate-900">{user.role?.role_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Hospital:</span>
                    <span className="font-semibold text-slate-900">{user.hospital?.hospital_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Department:</span>
                    <span className="font-semibold text-slate-900">{user.department?.department_name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={Hash} label="IC Number" value={user.ic_number} />
              <InfoItem icon={Phone} label="Phone" value={user.phone_number || 'N/A'} />
              <InfoItem
                icon={Calendar}
                label="Date of Birth"
                value={user.date_of_birth ? formatDate(user.date_of_birth) : 'N/A'}
              />
              <InfoItem
                icon={User}
                label="Gender"
                value={user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'N/A'}
              />
              <InfoItem
                icon={MapPin}
                label="Address"
                value={user.address || 'N/A'}
                fullWidth
              />
              <InfoItem icon={Briefcase} label="Position" value={user.jawatan} />
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Status Management</h3>
            <div className="space-y-2">
              {Object.entries(USER_STATUS).map(([key, value]) => (
                <button
                  key={value}
                  onClick={() => handleStatusChange(value)}
                  className={cn(
                    'w-full text-left px-4 py-2 rounded-lg border transition-colors',
                    user.status === value
                      ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h3>
            <div className="space-y-3">
              <InfoItem
                icon={Clock}
                label="Created"
                value={formatDate(user.created_at)}
                small
              />
              <InfoItem
                icon={Clock}
                label="Last Updated"
                value={user.updated_at ? formatDate(user.updated_at) : 'Never'}
                small
              />
              <InfoItem
                icon={Clock}
                label="Last Login"
                value={user.last_login ? formatDate(user.last_login) : 'Never'}
                small
              />
              {user.failed_login_attempts > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {user.failed_login_attempts} failed login attempt(s)
                    </span>
                  </div>
                </div>
              )}
              {user.account_locked_until && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Account locked until {formatDate(user.account_locked_until)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Are you sure you want to delete <strong>{user.full_name}</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
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

export default UserDetailPage

