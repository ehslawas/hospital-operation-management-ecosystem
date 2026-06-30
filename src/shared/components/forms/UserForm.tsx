import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Save, User as UserIcon, Mail, Hash, Phone, Calendar, MapPin, Building2, Briefcase } from 'lucide-react'
import { Button, Input, Select, Textarea, FileUpload, Avatar } from '@/components/ui'
import { userSchema, type UserFormData } from '@/lib/validators'
import { createUser, updateUser } from '@/services/userService'
import { mockHospitals, mockDepartments, mockRoles } from '@/services/mockData'
import { useToast } from '@/stores/toastStore'
import { USER_STATUS, GENDER_OPTIONS } from '@/lib/constants'
import type { UserWithRelations, User } from '@/types'

interface UserFormProps {
  user?: UserWithRelations
  onSuccess: () => void
  onCancel: () => void
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSuccess, onCancel }) => {
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    user?.profile_photo_url || null
  )

  const isEditMode = !!user

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: user
      ? {
          fullName: user.full_name,
          email: user.email,
          employeeId: user.employee_id,
          icNumber: user.ic_number,
          phoneNumber: user.phone_number || '',
          dateOfBirth: user.date_of_birth || '',
          gender: user.gender || undefined,
          address: user.address || '',
          hospitalId: user.hospital_id,
          departmentId: user.department_id,
          roleId: user.role_id,
          jawatan: user.jawatan,
          status: user.status,
        }
      : {
          status: USER_STATUS.ACTIVE,
        },
  })

  const selectedHospitalId = watch('hospitalId')
  const [availableDepartments, setAvailableDepartments] = useState(
    mockDepartments.filter((d) => !selectedHospitalId || d.hospital_id === selectedHospitalId)
  )

  useEffect(() => {
    if (selectedHospitalId) {
      const filtered = mockDepartments.filter((d) => d.hospital_id === selectedHospitalId)
      setAvailableDepartments(filtered)
      // Reset department if it doesn't belong to selected hospital
      const currentDept = watch('departmentId')
      if (currentDept && !filtered.find((d) => d.id === currentDept)) {
        setValue('departmentId', '')
      }
    } else {
      setAvailableDepartments([])
      setValue('departmentId', '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHospitalId])

  const handlePhotoChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setProfilePhotoPreview(user?.profile_photo_url || null)
    }
  }

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true)
    try {
      const userData: Partial<User> = {
        full_name: data.fullName,
        email: data.email,
        employee_id: data.employeeId,
        ic_number: data.icNumber,
        phone_number: data.phoneNumber,
        date_of_birth: data.dateOfBirth || undefined,
        gender: data.gender,
        address: data.address || undefined,
        hospital_id: data.hospitalId,
        department_id: data.departmentId,
        role_id: data.roleId,
        jawatan: data.jawatan,
        status: data.status,
        profile_photo_url: profilePhotoPreview || undefined,
      }

      if (isEditMode && user) {
        await updateUser(user.id, userData)
        toast.success('Success', 'User updated successfully')
      } else {
        await createUser(userData)
        toast.success('Success', 'User created successfully')
      }

      onSuccess()
    } catch (error) {
      toast.error('Error', isEditMode ? 'Failed to update user' : 'Failed to create user')
      console.error('Error saving user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Profile Photo Section */}
      <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex-shrink-0">
          <Avatar
            src={profilePhotoPreview || undefined}
            alt={watch('fullName') || 'User'}
            fallback={watch('fullName')?.charAt(0) || 'U'}
            size="lg"
          />
        </div>
        <div className="flex-1">
          <FileUpload
            label="Profile Photo"
            accept="image/*"
            onChange={handlePhotoChange}
            helperText="Upload a profile photo (max 5MB, JPG/PNG)"
          />
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <UserIcon className="w-5 h-5" />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('fullName')}
            label="Full Name"
            placeholder="Enter full name"
            leftIcon={<UserIcon className="w-5 h-5" />}
            error={errors.fullName?.message}
            required
          />

          <Input
            {...register('email')}
            type="email"
            label="Email"
            placeholder="Enter email address"
            leftIcon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            required
          />

          <Input
            {...register('employeeId')}
            label="Employee ID"
            placeholder="Enter employee ID"
            leftIcon={<Hash className="w-5 h-5" />}
            error={errors.employeeId?.message}
            required
            disabled={isEditMode}
          />

          <Input
            {...register('icNumber')}
            label="IC Number"
            placeholder="Enter IC number (12 digits)"
            leftIcon={<Hash className="w-5 h-5" />}
            error={errors.icNumber?.message}
            required
            disabled={isEditMode}
          />

          <Input
            {...register('phoneNumber')}
            label="Phone Number"
            placeholder="Enter phone number"
            leftIcon={<Phone className="w-5 h-5" />}
            error={errors.phoneNumber?.message}
            required
          />

          <Input
            {...register('dateOfBirth')}
            type="date"
            label="Date of Birth"
            leftIcon={<Calendar className="w-5 h-5" />}
            error={errors.dateOfBirth?.message}
          />

          <Select
            {...register('gender')}
            label="Gender"
            placeholder="Select gender"
            error={errors.gender?.message}
            options={GENDER_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Address
          </label>
          <Textarea
            {...register('address')}
            placeholder="Enter address"
            error={errors.address?.message}
            rows={3}
          />
        </div>
      </div>

      {/* Department & Role Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Department & Role
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            {...register('hospitalId')}
            label="Hospital"
            placeholder="Select hospital"
            error={errors.hospitalId?.message}
            required
            options={mockHospitals.map((h) => ({
              value: h.id,
              label: h.hospital_name,
            }))}
          />

          <Select
            {...register('departmentId')}
            label="Department"
            placeholder="Select department"
            error={errors.departmentId?.message}
            required
            disabled={!selectedHospitalId}
            options={availableDepartments.map((d) => ({
              value: d.id,
              label: d.department_name,
            }))}
          />

          <Select
            {...register('roleId')}
            label="Role"
            placeholder="Select role"
            error={errors.roleId?.message}
            required
            options={mockRoles.map((r) => ({
              value: r.id,
              label: r.role_name,
            }))}
          />

          <Input
            {...register('jawatan')}
            label="Position (Jawatan)"
            placeholder="Enter position"
            leftIcon={<Briefcase className="w-5 h-5" />}
            error={errors.jawatan?.message}
            required
          />

          <Select
            {...register('status')}
            label="Status"
            error={errors.status?.message}
            required
            options={[
              { value: USER_STATUS.ACTIVE, label: 'Active' },
              { value: USER_STATUS.INACTIVE, label: 'Inactive' },
              { value: USER_STATUS.SUSPENDED, label: 'Suspended' },
              { value: USER_STATUS.PENDING, label: 'Pending' },
            ]}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          leftIcon={<Save className="w-5 h-5" />}
        >
          {isEditMode ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </motion.form>
  )
}

export default UserForm

