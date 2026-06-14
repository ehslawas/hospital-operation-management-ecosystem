import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Save, Building2, Hash, MapPin, Phone, Mail } from 'lucide-react'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { hospitalSchema, type HospitalFormData } from '@/lib/validators'
import { createHospital, updateHospital } from '@/services/hospitalService'
import { useToast } from '@/stores/toastStore'
import { HOSPITAL_STATUS } from '@/lib/constants'
import type { Hospital } from '@/types'

interface HospitalFormProps {
  hospital?: Hospital
  onSuccess: () => void
  onCancel: () => void
}

export const HospitalForm: React.FC<HospitalFormProps> = ({ hospital, onSuccess, onCancel }) => {
  const toast = useToast()
  const isEditMode = !!hospital

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: hospital
      ? {
        hospitalCode: hospital.hospital_code,
        hospitalName: hospital.hospital_name,
        address: hospital.address || '',
        state: hospital.state || '',
        phone: hospital.phone || '',
        email: hospital.email || '',
        status: hospital.status,
      }
      : {
        status: HOSPITAL_STATUS.ACTIVE,
      },
  })

  const onSubmit = async (data: HospitalFormData) => {
    try {
      const hospitalData: Omit<Hospital, 'id' | 'created_at' | 'updated_at'> = {
        hospital_code: data.hospitalCode,
        hospital_name: data.hospitalName,
        address: data.address || undefined,
        state: data.state || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        status: data.status,
      }

      if (isEditMode && hospital) {
        await updateHospital(hospital.id, hospitalData)
        toast.success('Success', 'Hospital updated successfully')
      } else {
        await createHospital(hospitalData)
        toast.success('Success', 'Hospital created successfully')
      }

      onSuccess()
    } catch (error) {
      toast.error('Error', isEditMode ? 'Failed to update hospital' : 'Failed to create hospital')
      console.error('Error saving hospital:', error)
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
            {...register('hospitalCode')}
            label="Hospital Code"
            placeholder="Enter hospital code (e.g., HKL)"
            leftIcon={<Hash className="w-5 h-5" />}
            error={!!errors.hospitalCode}
            errorMessage={errors.hospitalCode?.message}
            required
            disabled={isEditMode}
          />

          <Input
            {...register('hospitalName')}
            label="Hospital Name"
            placeholder="Enter hospital name"
            leftIcon={<Building2 className="w-5 h-5" />}
            error={!!errors.hospitalName}
            errorMessage={errors.hospitalName?.message}
            required
          />

          <Input
            {...register('state')}
            label="State"
            placeholder="Enter state (e.g., Sarawak, Selangor)"
            leftIcon={<MapPin className="w-5 h-5" />}
            error={!!errors.state}
            errorMessage={errors.state?.message}
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
            type="email"
            label="Email"
            placeholder="Enter email address"
            leftIcon={<Mail className="w-5 h-5" />}
            error={!!errors.email}
            errorMessage={errors.email?.message}
          />

          <Select
            {...register('status')}
            label="Status"
            error={errors.status?.message}
            required
            options={[
              { value: HOSPITAL_STATUS.ACTIVE, label: 'Active' },
              { value: HOSPITAL_STATUS.INACTIVE, label: 'Inactive' },
            ]}
          />
        </div>

        <Textarea
          {...register('address')}
          label="Address"
          placeholder="Enter hospital address"
          error={!!errors.address}
          errorMessage={errors.address?.message}
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<Save className="w-5 h-5" />}>
          {isEditMode ? 'Update Hospital' : 'Create Hospital'}
        </Button>
      </div>

    </motion.form>
  )
}

export default HospitalForm

