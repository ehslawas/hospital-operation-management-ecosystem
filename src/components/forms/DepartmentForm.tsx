import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Save, Building2, Hash, User, FileText, Shield } from 'lucide-react'
import { Button, Input, Select, Textarea } from '@/components/ui'
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
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('')

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
          departmentCode: department.department_code,
          departmentName: department.department_name,
          description: department.description || '',
          hospitalId: department.hospital_id,
          headOfDepartmentId: department.head_of_department_id || '',
          status: department.status,
        }
      : {
          status: DEPARTMENT_STATUS.ACTIVE,
          // For Hospital Admin, pre-fill their hospital_id
          hospitalId: isHospitalAdmin && userHospitalId ? userHospitalId : undefined,
        },
  })

  const hospitalId = watch('hospitalId')

  useEffect(() => {
    if (!isHospitalAdmin) {
      fetchHospitals()
    } else if (userHospitalId) {
      // For Hospital Admin, only show their hospital
      fetchHospitals().then(() => {
        setValue('hospitalId', userHospitalId)
      })
    }
  }, [isHospitalAdmin, userHospitalId, setValue])

  useEffect(() => {
    if (hospitalId) {
      setSelectedHospitalId(hospitalId)
      fetchUsersForHospital(hospitalId)
    } else {
      setUsers([])
      setValue('headOfDepartmentId', '')
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
    try {
      const departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'> = {
        department_code: data.departmentCode,
        department_name: data.departmentName,
        description: data.description || undefined,
        hospital_id: data.hospitalId,
        head_of_department_id: data.headOfDepartmentId || undefined,
        status: data.status,
      }

      if (isEditMode && department) {
        await updateDepartment(department.id, departmentData)
        toast.success('Success', 'Department updated successfully')
      } else {
        await createDepartment(departmentData)
        toast.success('Success', 'Department created successfully')
      }

      onSuccess()
    } catch (error) {
      toast.error('Error', isEditMode ? 'Failed to update department' : 'Failed to create department')
      console.error('Error saving department:', error)
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
            {...register('departmentCode')}
            label="Department Code"
            placeholder="Enter department code (e.g., PHR)"
            leftIcon={<Hash className="w-5 h-5" />}
            error={errors.departmentCode?.message}
            required
            disabled={isEditMode}
          />

          <Input
            {...register('departmentName')}
            label="Department Name"
            placeholder="Enter department name"
            leftIcon={<Building2 className="w-5 h-5" />}
            error={errors.departmentName?.message}
            required
          />

          <Select
            {...register('hospitalId')}
            label="Hospital"
            placeholder="Select hospital"
            error={errors.hospitalId?.message}
            required
            disabled={isEditMode || isHospitalAdmin}
            options={hospitals.map((h) => ({
              value: h.id,
              label: h.hospital_name,
            }))}
          />

          <Select
            {...register('headOfDepartmentId')}
            label="Head of Department"
            placeholder="Select head of department (optional)"
            error={errors.headOfDepartmentId?.message}
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
            error={errors.description?.message}
            rows={3}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<Save className="w-5 h-5" />}>
          {isEditMode ? 'Update Department' : 'Create Department'}
        </Button>
      </div>
    </motion.form>
  )
}

export default DepartmentForm

