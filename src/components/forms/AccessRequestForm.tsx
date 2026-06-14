import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  Users,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Send,
  Lock,
} from 'lucide-react'
import { Button, Input, Select, Textarea, FileUpload } from '@/components/ui'
import { accessRequestSchema, type AccessRequestFormData } from '@/lib/validators'
import { getHospitals, getDepartments, submitAccessRequest } from '@/services/accessRequestService'
import { useToast } from '@/stores/toastStore'
import { GENDER_OPTIONS, RELATIONSHIP_OPTIONS } from '@/lib/constants'
import type { Hospital, Department } from '@/types'
import { cn } from '@/lib/utils'

interface AccessRequestFormProps {
  onBack: () => void
  onSuccess: () => void
}

type Step = 1 | 2 | 3

const steps = [
  { id: 1, title: 'Personal Details', icon: User },
  { id: 2, title: 'Department Details', icon: Building2 },
  { id: 3, title: 'Emergency Contact', icon: Users },
]

export const AccessRequestForm: React.FC<AccessRequestFormProps> = ({
  onBack,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true)
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    trigger,
    setValue,
  } = useForm<AccessRequestFormData>({
    resolver: zodResolver(accessRequestSchema),
    defaultValues: {
      fullName: '',
      email: '',
      icNumber: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: undefined,
      address: '',
      hospitalId: '',
      departmentId: '',
      jawatan: '',
      password: '',
      confirmPassword: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      emergencyContactAddress: '',
    },
    mode: 'onChange',
  })

  const selectedHospitalId = watch('hospitalId')

  // Load hospitals on mount
  useEffect(() => {
    const loadHospitals = async () => {
      setIsLoadingHospitals(true)
      try {
        const data = await getHospitals()
        console.log('Loaded hospitals:', data) // Debug log
        setHospitals(data)
        if (data.length === 0) {
          console.warn('No hospitals found in database')
        }
      } catch (error) {
        console.error('Error loading hospitals:', error)
        toast.error('Error', 'Failed to load hospitals. Please refresh the page and try again.')
      } finally {
        setIsLoadingHospitals(false)
      }
    }
    loadHospitals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load departments when hospital changes
  useEffect(() => {
    const loadDepartments = async () => {
      if (selectedHospitalId) {
        setIsLoadingDepartments(true)
        // Reset department selection when hospital changes
        setValue('departmentId', '')
        try {
          const data = await getDepartments(selectedHospitalId)
          setDepartments(data)
          if (data.length === 0) {
            toast.warning('No Departments', 'This hospital has no active departments available.')
          }
        } catch (error) {
          console.error('Error loading departments:', error)
          toast.error('Error', 'Failed to load departments. Please try again.')
        } finally {
          setIsLoadingDepartments(false)
        }
      } else {
        setDepartments([])
        setValue('departmentId', '')
      }
    }
    loadDepartments()
  }, [selectedHospitalId, setValue])

  const validateStep = async (step: Step): Promise<boolean> => {
    let fields: (keyof AccessRequestFormData)[] = []

    switch (step) {
      case 1:
        fields = ['fullName', 'email', 'icNumber', 'phoneNumber', 'dateOfBirth', 'gender', 'address', 'password', 'confirmPassword']
        // Validate profile photo is uploaded
        if (!profilePhoto) {
          toast.error('Profile Photo Required', 'Please upload a profile photo before proceeding.')
          return false
        }
        break
      case 2:
        fields = ['hospitalId', 'departmentId', 'jawatan']
        break
      case 3:
        fields = ['emergencyContactName', 'emergencyContactRelationship', 'emergencyContactPhone']
        break
    }

    return trigger(fields)
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
    }
  }

  const onSubmit = async (data: AccessRequestFormData) => {
    // Validate profile photo is uploaded
    if (!profilePhoto) {
      toast.error('Profile Photo Required', 'Please upload a profile photo before submitting.')
      return
    }

    setIsLoading(true)

    try {
      const result = await submitAccessRequest(data, profilePhoto)

      if (result.success) {
        toast.success(
          'Request Submitted',
          'Your access request has been submitted. You will be notified once approved.'
        )
        onSuccess()
      } else {
        toast.error('Error', result.error || 'Failed to submit request')
      }
    } catch {
      toast.error('Error', 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = currentStep === step.id
        const isCompleted = currentStep > step.id

        return (
          <React.Fragment key={step.id}>
            {index > 0 && (
              <div
                className={cn(
                  'w-16 h-0.5 mx-2',
                  isCompleted ? 'bg-primary-500' : 'bg-gray-200'
                )}
              />
            )}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : isCompleted
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium',
                  isActive ? 'text-primary-600' : 'text-gray-500'
                )}
              >
                {step.title}
              </span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Profile Photo */}
      <div className="flex justify-center mb-6">
        <FileUpload
          label="Profile Photo"
          value={profilePhoto}
          onChange={setProfilePhoto}
          helperText="Upload a professional photo (Required)"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('fullName')}
          label="Full Name (as per IC)"
          placeholder="Enter your full name"
          leftIcon={<User className="w-5 h-5" />}
          error={errors.fullName?.message}
          required
        />

        <Input
          {...register('email')}
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          required
        />

        <Input
          {...register('icNumber')}
          label="IC Number"
          placeholder="e.g., 880505145566"
          leftIcon={<User className="w-5 h-5" />}
          error={errors.icNumber?.message}
          helperText="12 digits without dashes"
          required
        />

        <Input
          {...register('phoneNumber')}
          label="Phone Number"
          placeholder="e.g., 0123456789"
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
          required
        />

        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Gender"
              placeholder="Select gender"
              options={GENDER_OPTIONS.map((g) => ({ value: g.value, label: g.label }))}
              error={errors.gender?.message}
              required
            />
          )}
        />
      </div>

      <Textarea
        {...register('address')}
        label="Home Address"
        placeholder="Enter your full address"
        error={errors.address?.message}
        required
      />

      {/* Password Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <Input
          {...register('password')}
          type="password"
          label="Password"
          placeholder="Create a strong password"
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.password?.message}
          helperText="Min 8 chars, with uppercase, lowercase, number, and special character"
          required
        />

        <Input
          {...register('confirmPassword')}
          type="password"
          label="Confirm Password"
          placeholder="Re-enter your password"
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.confirmPassword?.message}
          required
        />
      </div>
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <Controller
        name="hospitalId"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label="Hospital"
            placeholder={isLoadingHospitals ? 'Loading hospitals...' : hospitals.length === 0 ? 'No hospitals available' : 'Select hospital'}
            options={hospitals.map((h) => ({
              value: h.id,
              label: `${h.hospital_code} - ${h.hospital_name}`,
            }))}
            error={errors.hospitalId?.message}
            disabled={isLoadingHospitals || hospitals.length === 0}
            required
            helperText={hospitals.length === 0 ? 'No active hospitals found in the system' : 'Select the hospital you are requesting access for'}
          />
        )}
      />

      <Controller
        name="departmentId"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label="Department"
            placeholder={
              !selectedHospitalId
                ? 'Select a hospital first'
                : isLoadingDepartments
                ? 'Loading departments...'
                : departments.length === 0
                ? 'No departments available'
                : 'Select department'
            }
            options={departments.map((d) => ({
              value: d.id,
              label: `${d.department_code} - ${d.department_name}`,
            }))}
            error={errors.departmentId?.message}
            disabled={!selectedHospitalId || isLoadingDepartments || departments.length === 0}
            required
            helperText={
              !selectedHospitalId
                ? 'Please select a hospital first'
                : departments.length === 0
                ? 'This hospital has no active departments. Departments are created based on enabled modules.'
                : undefined
            }
          />
        )}
      />

      <Input
        {...register('jawatan')}
        label="Position (Jawatan)"
        placeholder="e.g., Jururawat U29, Pegawai Farmasi U41"
        leftIcon={<Briefcase className="w-5 h-5" />}
        error={errors.jawatan?.message}
        helperText="Include your grade if applicable"
        required
      />
    </motion.div>
  )

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('emergencyContactName')}
          label="Contact Name"
          placeholder="Enter contact name"
          leftIcon={<User className="w-5 h-5" />}
          error={errors.emergencyContactName?.message}
          required
        />

        <Controller
          name="emergencyContactRelationship"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Relationship"
              placeholder="Select relationship"
              options={RELATIONSHIP_OPTIONS.map((r) => ({
                value: r.value,
                label: r.label,
              }))}
              error={errors.emergencyContactRelationship?.message}
              required
            />
          )}
        />

        <Input
          {...register('emergencyContactPhone')}
          label="Phone Number"
          placeholder="e.g., 0123456789"
          leftIcon={<Phone className="w-5 h-5" />}
          error={errors.emergencyContactPhone?.message}
          required
        />
      </div>

      <Textarea
        {...register('emergencyContactAddress')}
        label="Address (Optional)"
        placeholder="Enter contact's address"
        error={errors.emergencyContactAddress?.message}
      />
    </motion.div>
  )

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Request Access</h2>
          <p className="text-sm text-gray-500">
            Fill in your details to request system access
          </p>
        </div>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit(onSubmit)}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="ghost"
            onClick={currentStep === 1 ? onBack : handlePrev}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={isLoading}
              leftIcon={!isLoading && <Send className="w-4 h-4" />}
            >
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

export default AccessRequestForm

