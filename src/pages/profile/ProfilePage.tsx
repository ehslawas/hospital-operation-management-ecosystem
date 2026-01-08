import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Mail, Hash, Phone, Calendar, MapPin, Building2, Shield } from 'lucide-react'
import { Avatar, Badge, Modal } from '@/components/ui'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm'
import { formatDate } from '@/lib/utils'

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore()
  const toast = useToast()
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">User not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">View and manage your account information</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          <Avatar
            src={user.profile_photo_url}
            name={user.full_name}
            size="xl"
            className="ring-4 ring-primary-100"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
              <Badge variant={user.status === 'active' ? 'success' : 'warning'}>
                {user.status}
              </Badge>
            </div>
            <p className="text-gray-600 mb-4">{user.role?.role_name || 'No role assigned'}</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Employee ID</p>
              <p className="text-gray-900 font-medium">{user.employee_id}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">IC Number</p>
              <p className="text-gray-900 font-medium">{user.ic_number}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="text-gray-900 font-medium">{user.phone_number}</p>
            </div>
          </div>
          {user.date_of_birth && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="text-gray-900 font-medium">{formatDate(user.date_of_birth)}</p>
              </div>
            </div>
          )}
          {user.gender && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="text-gray-900 font-medium capitalize">{user.gender}</p>
              </div>
            </div>
          )}
          {user.address && (
            <div className="flex items-start gap-3 md:col-span-2">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-900 font-medium">{user.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Work Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Work Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Hospital</p>
              <p className="text-gray-900 font-medium">{user.hospital?.hospital_name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="text-gray-900 font-medium">{user.department?.department_name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-gray-900 font-medium">{user.role?.role_name || 'N/A'}</p>
            </div>
          </div>
          {user.jawatan && (
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Jawatan</p>
                <p className="text-gray-900 font-medium">{user.jawatan}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <ChangePasswordForm
          onSuccess={() => {
            setShowChangePasswordModal(false)
            toast.success('Success', 'Password changed successfully')
          }}
          onCancel={() => setShowChangePasswordModal(false)}
        />
      </Modal>
    </div>
  )
}

export default ProfilePage

