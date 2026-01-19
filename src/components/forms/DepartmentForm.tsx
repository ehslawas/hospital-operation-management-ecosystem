import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Save, Building2, Hash, Phone, Mail, MapPin } from 'lucide-react'
import { Button, Input, Select, Textarea, ConfirmationDialog } from '@/components/ui'
import { departmentSchema, type DepartmentFormData } from '@/lib/validators'
import { createDepartment, updateDepartment } from '@/services/departmentService'
import { getAllHospitals } from '@/services/hospitalService'
import { getUsers } from '@/services/userService'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { DEPARTMENT_STATUS, SYSTEM_ROLES } from '@/lib/constants'
import type { Department, DepartmentWithRelations, Hospital, UserWithRelations } from '@/types'

interface DepartmentFormProps {
  department?: DepartmentWithRelations
  onSuccess: () => void
  onCancel: () => void
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ department, onSuccess, onCancel }) => {
  const toast = useToast()
  const { user } = useAuthStore()
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const userHospitalId = user?.hospital_id

  const isEditMode = !!department
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [users, setUsers] = useState<UserWithRelations[]>([])
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingData, setPendingData] = useState<DepartmentFormData | null>(null)
  const [isSaving, setIsSaving] = useState(false)


  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: department
      ? {
        department_code: department.department_code,
        department_name: department.department_name,
        description: department.description || '',
        hospital_id: department.hospital_id,
        head_of_department_id: department.head_of_department_id || '',
        phone: department.phone || '',
        email: department.email || '',
        status: department.status,
        kkm_unit_code: department.kkm_unit_code || '',
        location: department.location || '',
        unit_type: department.unit_type,
      }
      : {
        status: DEPARTMENT_STATUS.ACTIVE,
        // For Hospital Admin, pre-fill their hospital_id
        hospital_id: isHospitalAdmin && userHospitalId ? userHospitalId : undefined,
      },
  })

  const hospitalId = watch('hospital_id')

  useEffect(() => {
    if (!isHospitalAdmin) {
      fetchHospitals()
    } else if (userHospitalId) {
      // For Hospital Admin, only show their hospital
      fetchHospitals().then(() => {
        setValue('hospital_id', userHospitalId)
      })
    }
  }, [isHospitalAdmin, userHospitalId, setValue])

  useEffect(() => {
    if (hospitalId) {
      fetchUsersForHospital(hospitalId)
    } else {
      setUsers([])
      setValue('head_of_department_id', '')
    }
  }, [hospitalId, setValue])

  const fetchHospitals = async () => {
    try {
      const data = await getAllHospitals()
      // For Hospital Admin, filter to only their hospital
      if (isHospitalAdmin && userHospitalId) {
        setHospitals(data.filter(h => h.id === userHospitalId))
      } else {
        setHospitals(data)
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error)
    }
  }

  const fetchUsersForHospital = async (hospId: string) => {
    try {
      const result = await getUsers({
        hospitalId: hospId,
        pageSize: 1000, // Get all users for the hospital
      })
      setUsers(result.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const onSubmit = async (data: DepartmentFormData) => {
    if (isEditMode) {
      setPendingData(data)
      setIsConfirmOpen(true)
    } else {
      await performSave(data)
    }
  }

  const performSave = async (data: DepartmentFormData) => {
    setIsSaving(true)
    try {
      const departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'> = {
        department_code: data.department_code,
        department_name: data.department_name,
        description: data.description || undefined,
        hospital_id: data.hospital_id,
        head_of_department_id: data.head_of_department_id || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        status: data.status,
        approval_type: department?.approval_type || 'standard',
        kkm_unit_code: data.kkm_unit_code || undefined,
        location: data.location || undefined,
        unit_type: data.unit_type || undefined,
      }

      if (isEditMode && department) {
        await updateDepartment(department.id, departmentData)
        toast.success('Success', 'Department updated successfully')
      } else {
        await createDepartment(departmentData)
        toast.success('Success', 'Department created successfully')
      }

      setIsConfirmOpen(false)
      onSuccess()
    } catch (error) {
      toast.error('Error', isEditMode ? 'Failed to update department' : 'Failed to create department')
      console.error('Error saving department:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('department_code')}
            label="Department Code"
            placeholder="Enter department code (e.g., PHR)"
            leftIcon={<Hash className="w-5 h-5" />}
            error={!!errors.department_code}
            errorMessage={errors.department_code?.message}
            required
            disabled={isEditMode}
          />

          <Input
            {...register('department_name')}
            label="Department Name"
            placeholder="Enter department name"
            leftIcon={<Building2 className="w-5 h-5" />}
            error={!!errors.department_name}
            errorMessage={errors.department_name?.message}
            required
          />

          <Input
            {...register('kkm_unit_code')}
            label="KKM Unit Code"
            placeholder="e.g. CK-01"
            leftIcon={<Hash className="w-5 h-5" />}
            error={!!errors.kkm_unit_code}
            errorMessage={errors.kkm_unit_code?.message}
          />

          <Input
            {...register('location')}
            label="Location"
            placeholder="e.g. Level 3, Main Block"
            leftIcon={<MapPin className="w-5 h-5" />}
            error={!!errors.location}
            errorMessage={errors.location?.message}
          />

          <Select
            {...register('unit_type')}
            label="Unit Type"
            placeholder="Select unit type"
            error={errors.unit_type?.message}
            options={[
              { value: 'clinical', label: 'Clinical' },
              { value: 'clinical_support', label: 'Clinical Support' },
              { value: 'non_clinical', label: 'Non-Clinical' },
              { value: 'admin', label: 'Administrative' },
            ]}
          />

          <Input
            {...register('phone')}
            label="Phone Number"
            placeholder="Enter phone number"
            leftIcon={<Phone className="w-5 h-5" />}
            error={!!errors.phone}
            errorMessage={errors.phone?.message}
          />

          <Input
            {...register('email')}
            label="Email Address"
            placeholder="Enter email address"
            leftIcon={<Mail className="w-5 h-5" />}
            error={!!errors.email}
            errorMessage={errors.email?.message}
          />

          <Select
            {...register('hospital_id')}
            label="Hospital"
            placeholder="Select hospital"
            error={errors.hospital_id?.message}
            required
            disabled={isEditMode || isHospitalAdmin}
            options={hospitals.map((h) => ({
              value: h.id,
              label: h.hospital_name,
            }))}
          />

          <Select
            {...register('head_of_department_id')}
            label="Head of Department"
            placeholder="Select head of department (optional)"
            error={errors.head_of_department_id?.message}
            disabled={!hospitalId}
            options={[
              { value: '', label: 'None' },
              ...users.map((u) => ({
                value: u.id,
                label: u.full_name,
              })),
            ]}
          />

          <Select
            {...register('status')}
            label="Status"
            error={errors.status?.message}
            required
            options={[
              { value: DEPARTMENT_STATUS.ACTIVE, label: 'Active' },
              { value: DEPARTMENT_STATUS.INACTIVE, label: 'Inactive' },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <Textarea
            {...register('description')}
            placeholder="Enter department description"
            error={!!errors.description}
            errorMessage={errors.description?.message}
            rows={3}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<Save className="w-5 h-5" />} isLoading={isSaving}>
          {isEditMode ? 'Update Department' : 'Create Department'}
        </Button>
      </div>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          if (pendingData) performSave(pendingData)
        }}
        title="Confirm Update"
        message={`Are you sure you want to update ${department?.department_name || 'this department'}? This action will save all changes made to the configuration.`}
        variant="warning"
        confirmText="Update Now"
        isLoading={isSaving}
      />
    </motion.form>
  )
}

export default DepartmentForm

