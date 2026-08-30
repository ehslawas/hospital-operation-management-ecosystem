// @ts-nocheck
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User as UserIcon, Phone, Calendar, MapPin, Mail, Hash, AlertCircle, Check, Loader2 } from 'lucide-react'
import { Modal, Input, Select, Textarea } from '@/components/ui'
import { useToast } from '@/stores/toastStore'
import { updateUserProfile } from '../services/profileService'
import type { UserWithRelations, Gender } from '@/types'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithRelations
  onSuccess: (updatedUser: UserWithRelations) => void
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState(user.full_name || '')
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || '')
  const [dateOfBirth, setDateOfBirth] = useState(user.date_of_birth || '')
  const [gender, setGender] = useState<Gender | ''>(user.gender || '')
  const [address, setAddress] = useState(user.address || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form to current user values when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFullName(user.full_name || '')
      setPhoneNumber(user.phone_number || '')
      setDateOfBirth(user.date_of_birth || '')
      setGender(user.gender || '')
      setAddress(user.address || '')
      setErrors({})
    }
  }, [isOpen, user])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    if (phoneNumber && !/^[\d\s+\-()]{7,20}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const result = await updateUserProfile(
        user.id,
        {
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          date_of_birth: dateOfBirth || undefined,
          gender: (gender as Gender) || undefined,
          address: address.trim() || undefined,
        },
        user
      )

      if (result.success && result.user) {
        toast.success('Profile Updated', 'Your personal information has been successfully updated.')
        onSuccess(result.user)
        onClose()
      } else {
        toast.error('Update Failed', result.error || 'Could not update personal information')
      }
    } catch (err: any) {
      toast.error('Error', err?.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isLoading && onClose()}
      title="Edit Personal Information"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Read-Only System Identity Reference */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            Official Account Reference (Read-Only)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Email</span>
              <span className="font-medium text-slate-800 truncate block">{user.email}</span>
            </div>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Employee ID</span>
              <span className="font-medium text-slate-800 font-mono block">{user.employee_id || '—'}</span>
            </div>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">IC Number</span>
              <span className="font-medium text-slate-800 font-mono block">{user.ic_number || '—'}</span>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. AMRI AMIT"
              className={`w-full ${errors.fullName ? 'border-red-500 focus:ring-red-400' : ''}`}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.fullName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Phone Number
              </label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0111657713"
                className={`w-full ${errors.phoneNumber ? 'border-red-500 focus:ring-red-400' : ''}`}
                disabled={isLoading}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date of Birth
              </label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-colors"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Residential Address
            </label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 5528 RPR PHASE 2 LORONG 33 JALAN BANTING"
              rows={3}
              className="w-full"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EditProfileModal
