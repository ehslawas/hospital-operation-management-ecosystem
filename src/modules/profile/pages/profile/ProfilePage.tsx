// @ts-nocheck
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Lock,
  Mail,
  Hash,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Shield,
  Camera,
  Edit3,
  Sparkles,
} from 'lucide-react'
import { Avatar, Badge, Modal } from '@/components/ui'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm'
import { EditProfileModal } from '../../components/EditProfileModal'
import { ProfilePhotoModal } from '../../components/ProfilePhotoModal'
import { ProfileChangeLogCard } from '../../components/ProfileChangeLogCard'
import { formatDate } from '@/lib/utils'
import type { UserWithRelations } from '@/types'

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore()
  const toast = useToast()
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [refreshLogTrigger, setRefreshLogTrigger] = useState(0)

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-gray-500">User session not found. Please log in again.</p>
      </div>
    )
  }

  const handleProfileUpdated = (updatedUser: UserWithRelations) => {
    setUser(updatedUser)
    setRefreshLogTrigger((prev) => prev + 1)
  }

  const handlePasswordChanged = () => {
    setShowChangePasswordModal(false)
    setRefreshLogTrigger((prev) => prev + 1)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-600 mt-1">
            View and manage your personal details, profile picture, and security preferences
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar with Camera Overlay */}
          <div className="relative group cursor-pointer" onClick={() => setShowPhotoModal(true)}>
            <Avatar
              src={user.profile_photo_url}
              name={user.full_name}
              size="2xl"
              className="w-24 h-24 ring-4 ring-primary-100/80 transition-all duration-200 group-hover:ring-primary-300"
            />
            {/* Hover overlay badge */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
              <Camera className="w-6 h-6 mb-0.5" />
              <span className="text-[10px] font-semibold tracking-wide uppercase">Edit</span>
            </div>
            {/* Floating Camera Button */}
            <button
              type="button"
              title="Change Profile Photo"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-md flex items-center justify-center border-2 border-white transition-transform duration-150 hover:scale-105 active:scale-95"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900 truncate">{user.full_name}</h2>
              <Badge variant={user.status === 'active' ? 'success' : 'warning'}>
                {user.status}
              </Badge>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {user.jawatan || user.role?.role_name || 'Staff Member'}
            </p>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setShowPhotoModal(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 text-primary-600" />
                Change Photo
              </button>

              <button
                onClick={() => setShowEditProfileModal(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-primary-600" />
                Edit Information
              </button>

              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            Personal Information
          </h3>
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="px-3 py-1.5 text-xs font-medium text-primary-700 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1.5 border border-primary-200"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Info
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
              <p className="text-gray-900 font-medium">{user.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</p>
              <p className="text-gray-900 font-medium font-mono">{user.employee_id || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">IC Number</p>
              <p className="text-gray-900 font-medium font-mono">{user.ic_number || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</p>
              <p className="text-gray-900 font-medium">{user.phone_number || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</p>
              <p className="text-gray-900 font-medium">
                {user.date_of_birth ? formatDate(user.date_of_birth) : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</p>
              <p className="text-gray-900 font-medium capitalize">{user.gender || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 md:col-span-2">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address</p>
              <p className="text-gray-900 font-medium">{user.address || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Work Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="pb-2 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            Work Information
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</p>
              <p className="text-gray-900 font-medium">{user.hospital?.hospital_name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Department</p>
              <p className="text-gray-900 font-medium">{user.department?.department_name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</p>
              <p className="text-gray-900 font-medium">{user.role?.role_name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Jawatan</p>
              <p className="text-gray-900 font-medium">{user.jawatan || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Activity & Change History Log */}
      <ProfileChangeLogCard userId={user.id} refreshTrigger={refreshLogTrigger} />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        user={user}
        onSuccess={handleProfileUpdated}
      />

      {/* Profile Photo Upload Modal */}
      <ProfilePhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        user={user}
        onSuccess={handleProfileUpdated}
      />

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <ChangePasswordForm
          onSuccess={handlePasswordChanged}
          onCancel={() => setShowChangePasswordModal(false)}
        />
      </Modal>
    </div>
  )
}

export default ProfilePage
