import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { User, Mail, Send, CheckCircle } from 'lucide-react'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { inquirySchema, type InquiryFormData } from '@/lib/validators'
import { submitInquiry } from '@/services/inquiryService'
import { useToast } from '@/stores/toastStore'
import { INQUIRY_TYPES } from '@/lib/constants'

interface InquiryFormProps {
  onSuccess?: () => void
}

const inquiryTypeOptions = [
  { value: INQUIRY_TYPES.GENERAL, label: 'General Inquiry' },
  { value: INQUIRY_TYPES.TECHNICAL, label: 'Technical Support' },
  { value: INQUIRY_TYPES.ACCESS, label: 'Access Request Help' },
  { value: INQUIRY_TYPES.COMPLAINT, label: 'Complaint / Feedback' },
]

export const InquiryForm: React.FC<InquiryFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      inquiryType: undefined,
    },
  })

  const onSubmit = async (data: InquiryFormData) => {
    setIsLoading(true)

    try {
      // Cast data to ensure inquiryType is treated as defined after validation
      const result = await submitInquiry(data as any)

      if (result.success) {
        setIsSuccess(true)
        toast.success('Inquiry Sent', 'We will get back to you soon!')
        reset()
        onSuccess?.()
      } else {
        toast.error('Error', result.error || 'Failed to send inquiry')
      }
    } catch {
      toast.error('Error', 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success-600" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Inquiry Sent Successfully!
        </h3>

        <p className="text-sm text-gray-600 mb-6">
          Thank you for contacting us. Our team will review your inquiry and get back to you soon.
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsSuccess(false)}
        >
          Send Another Inquiry
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('name')}
          label="Your Name"
          placeholder="Enter your name"
          leftIcon={<User className="w-5 h-5" />}
          error={!!errors.name}
          errorMessage={errors.name?.message}
          required
        />

        <Input
          {...register('email')}
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          leftIcon={<Mail className="w-5 h-5" />}
          error={!!errors.email}
          errorMessage={errors.email?.message}
          required
        />
      </div>

      <Controller
        name="inquiryType"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label="Inquiry Type"
            placeholder="Select inquiry type"
            options={inquiryTypeOptions}
            error={errors.inquiryType?.message}
            required
          />
        )}
      />

      <Input
        {...register('subject')}
        label="Subject"
        placeholder="Brief description of your inquiry"
        error={!!errors.subject}
        errorMessage={errors.subject?.message}
        required
      />

      <Textarea
        {...register('message')}
        label="Message"
        placeholder="Please describe your inquiry in detail..."
        error={!!errors.message}
        errorMessage={errors.message?.message}
        rows={5}
        required
      />

      <Button
        type="submit"
        className="w-full"
        isLoading={isLoading}
        leftIcon={!isLoading && <Send className="w-4 h-4" />}
      >
        {isLoading ? 'Sending...' : 'Send Inquiry'}
      </Button>
    </motion.form>
  )
}

export default InquiryForm

