import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Save, User as UserIcon, Mail, Hash, Phone, Calendar, Building2, Briefcase } from 'lucide-react'
import { Button, Input, Select, Textarea, FileUpload, Avatar, LoadingOverlay, ConfirmationDialog } from '@/components/ui'
import { userSchema, type UserFormData } from '@/lib/validators'
import { createUser, updateUser } from '@/services/userService'
import { getAllRoles } from '@/services/roleService'
import { getAllHospitals } from '@/services/hospitalService'
import { getAllDepartments } from '@/services/departmentService'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { USER_STATUS, GENDER_OPTIONS, SYSTEM_ROLES } from '@/lib/constants'
import type { UserWithRelations, User, Role, Hospital, Department } from '@/types'

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

  // Confirmation Dialog State
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<UserFormData | null>(null)

  const currentUser = useAuthStore((state) => state.user)
  const isHospitalAdmin = useAuthStore((state) =>
    state.user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  )

  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  const isEditMode = !!user

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true)
      try {
        let rolesData = await getAllRoles()
        const hospitalsData = !isHospitalAdmin ? await getAllHospitals() : []

        // CRITICAL: Protect System Admin Identity
        // Hospital Admin cannot assign or see System Admin role
        if (isHospitalAdmin) {
          rolesData = rolesData.filter(r => r.role_code !== SYSTEM_ROLES.SYSTEM_ADMIN)
        }

        setRoles(rolesData)

        if (isHospitalAdmin && currentUser?.hospital_id) {
          setHospitals([{
            id: currentUser.hospital_id,
            hospital_name: currentUser.hospital?.hospital_name || 'My Hospital',
            hospital_code: currentUser.hospital?.hospital_code || 'HOSP'
          } as Hospital])
        } else {
          setHospitals(hospitalsData)
        }
      } catch (error) {
        console.error('Error fetching form data:', error)
        toast.error('Error', 'Failed to load form options')
      } finally {
        setIsDataLoading(false)
      }
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHospitalAdmin, currentUser?.hospital_id])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
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
        hospitalId: isHospitalAdmin ? currentUser?.hospital_id : undefined
      },
  })

  // Update form values when user prop changes (e.g. after async fetch)
  useEffect(() => {
    if (user) {
      reset({
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
      })
      setProfilePhotoPreview(user.profile_photo_url || null)
    }
  }, [user, reset])

  const selectedHospitalId = watch('hospitalId')

  // Fetch departments when hospital changes
  useEffect(() => {
    const fetchDepartments = async () => {
      // If no hospital selected, clear departments
      if (!selectedHospitalId) {
        setAvailableDepartments([])
        return
      }

      try {
        // Use getAllDepartments to ensure we get the complete list without pagination
        const allDepts = await getAllDepartments(selectedHospitalId)
        setAvailableDepartments(allDepts)

        // Validate current selection
        const currentDeptId = watch('departmentId')

        // Only reset if the currently selected department is NOT in the new list
        // and we actually have a selection
        if (currentDeptId) {
          const isValidSelection = allDepts.some(d => d.id === currentDeptId)
          if (!isValidSelection) {
            // It's possible the user belongs to a department that was disabled or changed hospitals
            // In a real scenario we might want to keep the ID but show a warning
            // For now, we'll keep it if it was the initial value (to avoid clearing it on load)
            if (currentDeptId !== user?.department_id) {
              setValue('departmentId', '')
            }
          }
        }
      } catch (error) {
        console.error('Error fetching departments:', error)
        toast.error('Error', 'Failed to load departments')
        setAvailableDepartments([])
      }
    }

    fetchDepartments()
  }, [selectedHospitalId, setValue, user?.department_id, watch])

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

  const handleFormSubmit = (data: UserFormData) => {
    // CRITICAL: Final check before creation/update
    const selectedRole = roles.find(r => r.id === data.roleId)
    if (isHospitalAdmin && selectedRole?.role_code === SYSTEM_ROLES.SYSTEM_ADMIN) {
      toast.error('Forbidden', 'You cannot create or update a System Admin user.')
      return
    }

    setPendingFormData(data)
    setShowConfirmDialog(true)
  }

  const processSubmit = async () => {
    if (!pendingFormData) return

    setIsLoading(true)
    setShowConfirmDialog(false)

    try {
      const data = pendingFormData
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
      setPendingFormData(null)
    }
  }

  return (
    <div className="relative">
      {isDataLoading && (
        <LoadingOverlay
          message="Loading selection data..."
        />
      )}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* Profile Photo Section */}
        <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex-shrink-0">
            <Avatar
              src={profilePhotoPreview || undefined}
              name={watch('fullName') || 'User'}
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
              error={!!errors.fullName}
              errorMessage={errors.fullName?.message}
              required
            />

            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="Enter email address"
              leftIcon={<Mail className="w-5 h-5" />}
              error={!!errors.email}
              errorMessage={errors.email?.message}
              required
            />

            <Input
              {...register('employeeId')}
              label="Employee ID"
              placeholder="Enter employee ID"
              leftIcon={<Hash className="w-5 h-5" />}
              error={!!errors.employeeId}
              errorMessage={errors.employeeId?.message}
              required
              disabled={isEditMode}
            />

            <Input
              {...register('icNumber')}
              label="IC Number"
              placeholder="Enter IC number (12 digits)"
              leftIcon={<Hash className="w-5 h-5" />}
              error={!!errors.icNumber}
              errorMessage={errors.icNumber?.message}
              required
              disabled={isEditMode}
            />

            <Input
              {...register('phoneNumber')}
              label="Phone Number"
              placeholder="Enter phone number"
              leftIcon={<Phone className="w-5 h-5" />}
              error={!!errors.phoneNumber}
              errorMessage={errors.phoneNumber?.message}
              required
            />

            <Input
              {...register('dateOfBirth')}
              type="date"
              label="Date of Birth"
              leftIcon={<Calendar className="w-5 h-5" />}
              error={!!errors.dateOfBirth}
              errorMessage={errors.dateOfBirth?.message}
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
              error={!!errors.address}
              errorMessage={errors.address?.message}
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
              disabled={isHospitalAdmin || isDataLoading}
              value={watch('hospitalId') || ''}
              options={hospitals.map((h) => ({
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
              disabled={!selectedHospitalId || isDataLoading}
              value={watch('departmentId') || ''}
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
              disabled={isDataLoading}
              value={watch('roleId') || ''}
              options={roles.map((r) => ({
                value: r.id,
                label: r.role_name,
              }))}
            />

            <Input
              {...register('jawatan')}
              label="Position (Jawatan)"
              placeholder="Enter position"
              leftIcon={<Briefcase className="w-5 h-5" />}
              error={!!errors.jawatan}
              errorMessage={errors.jawatan?.message}
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

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={processSubmit}
        title={isEditMode ? "Update User" : "Create User"}
        message={isEditMode
          ? "Are you sure you want to update this user's details?"
          : "Are you sure you want to create this new user?"}
        variant="info"
        confirmText={isEditMode ? "Update" : "Create"}
        isLoading={isLoading}
      />
    </div>
  )
}

export default UserForm
