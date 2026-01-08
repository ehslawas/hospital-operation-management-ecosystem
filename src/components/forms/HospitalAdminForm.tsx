import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Save, X, User, Mail, Hash, Phone, Briefcase, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { Button, Input, Modal } from '@/components/ui'
import { hospitalAdminSchema, type HospitalAdminFormData } from '@/lib/validators'
import { createHospitalAdmin } from '@/services/hospitalAdminService'
import { useToastStore } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

interface HospitalAdminFormProps {
  hospitalId: string
  hospitalName: string
  existingAdmin?: {
    id: string
    full_name: string
    email: string
    employee_id: string
  } | null
  onSuccess: () => void
  onCancel: () => void
}

export const HospitalAdminForm: React.FC<HospitalAdminFormProps> = ({
  hospitalId,
  hospitalName,
  existingAdmin,
  onSuccess,
  onCancel,
}) => {
  const { error: showError, success: showSuccess } = useToastStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<HospitalAdminFormData>({
    resolver: zodResolver(hospitalAdminSchema),
    defaultValues: {
      email: existingAdmin?.email || '',
      employeeId: existingAdmin?.employee_id || '',
      fullName: existingAdmin?.full_name || '',
      icNumber: '',
      phoneNumber: '',
      jawatan: '',
      password: '',
      confirmPassword: '',
    },
  })

  const generatePassword = () => {
    // Generate a strong password: 12 characters with mix of upper, lower, numbers, special
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const special = '!@#$%^&*'
    const all = uppercase + lowercase + numbers + special

    let password = ''
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += special[Math.floor(Math.random() * special.length)]

    // Fill the rest randomly
    for (let i = password.length; i < 12; i++) {
      password += all[Math.floor(Math.random() * all.length)]
    }

    // Shuffle the password
    password = password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('')

    setGeneratedPassword(password)
    setValue('password', password)
    setValue('confirmPassword', password)
  }

  const onSubmit = async (data: HospitalAdminFormData) => {
    if (existingAdmin) {
      showError('Error', 'This hospital already has an admin. Please disable the existing admin first.')
      return
    }

    setIsLoading(true)
    try {
      const result = await createHospitalAdmin({
        hospital_id: hospitalId,
        email: data.email,
        employee_id: data.employeeId,
        full_name: data.fullName,
        ic_number: data.icNumber,
        phone_number: data.phoneNumber,
        password: data.password,
        jawatan: data.jawatan,
      })

      if (result.success && result.user) {
        showSuccess('Success', `Hospital Admin created successfully for ${hospitalName}`)
        onSuccess()
      } else {
        showError('Error', result.error || 'Failed to create Hospital Admin')
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred. Please try again.')
      console.error('Error creating hospital admin:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Creating Hospital Admin for:</strong> {hospitalName}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Only one Hospital Admin is allowed per hospital. This admin will have full access to manage their hospital.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Full Name *
          </label>
          <Input
            {...register('fullName')}
            placeholder="Enter full name"
            error={errors.fullName?.message}
            disabled={isLoading}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address *
          </label>
          <Input
            type="email"
            {...register('email')}
            placeholder="admin@hospital.gov.my"
            error={errors.email?.message}
            disabled={isLoading}
          />
        </div>

        {/* Employee ID */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Hash className="w-4 h-4 inline mr-2" />
            Employee ID *
          </label>
          <Input
            {...register('employeeId')}
            placeholder="HKL001"
            error={errors.employeeId?.message}
            disabled={isLoading}
          />
        </div>

        {/* IC Number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Hash className="w-4 h-4 inline mr-2" />
            IC Number *
          </label>
          <Input
            {...register('icNumber')}
            placeholder="000000000000"
            error={errors.icNumber?.message}
            disabled={isLoading}
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Phone Number *
          </label>
          <Input
            type="tel"
            {...register('phoneNumber')}
            placeholder="0123456789"
            error={errors.phoneNumber?.message}
            disabled={isLoading}
          />
        </div>

        {/* Jawatan */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Briefcase className="w-4 h-4 inline mr-2" />
            Jawatan *
          </label>
          <Input
            {...register('jawatan')}
            placeholder="Pegawai Tadbir N41"
            error={errors.jawatan?.message}
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Lock className="w-4 h-4 inline mr-2" />
            Password *
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="Enter password"
              error={errors.password?.message}
              disabled={isLoading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {generatedPassword && (
            <p className="text-xs text-success-600 mt-1">
              Generated password: <code className="bg-success-50 px-2 py-1 rounded">{generatedPassword}</code>
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Lock className="w-4 h-4 inline mr-2" />
            Confirm Password *
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              placeholder="Confirm password"
              error={errors.confirmPassword?.message}
              disabled={isLoading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Password Generator */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Generate Secure Password</p>
            <p className="text-xs text-slate-500 mt-1">
              Click to generate a strong 12-character password automatically
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={generatePassword}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            disabled={isLoading}
          >
            Generate
          </Button>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading} leftIcon={<Save className="w-4 h-4" />}>
          {isLoading ? 'Creating...' : 'Create Hospital Admin'}
        </Button>
      </div>
    </form>
  )
}

export default HospitalAdminForm

