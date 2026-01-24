import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { resetPasswordRequestSchema, type ResetPasswordRequestData } from '@/lib/validators'
import { requestPasswordReset } from '@/services/authService'
import { useToast } from '@/stores/toastStore'

interface ResetPasswordFormProps {
  onBack: () => void
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetPasswordRequestData>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ResetPasswordRequestData) => {
    setIsLoading(true)

    try {
      const result = await requestPasswordReset(data.email)

      if (result.success) {
        setIsSuccess(true)
        toast.success('Email Sent', 'Check your email for reset instructions')
      } else {
        toast.error('Error', result.error || 'Failed to send reset email')
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
        className="text-center py-6"
      >
        <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success-600" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Check Your Email
        </h3>

        <p className="text-sm text-gray-600 mb-6">
          We've sent password reset instructions to{' '}
          <span className="font-medium text-gray-900">{getValues('email')}</span>
        </p>

        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or try again.
          </p>

          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Login
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Reset Password
        </h3>
        <p className="text-sm text-gray-600">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <Input
        {...register('email')}
        type="email"
        label="Email Address"
        placeholder="Enter your email"
        leftIcon={<Mail className="w-5 h-5" />}
        error={!!errors.email}
        errorMessage={errors.email?.message}
        autoComplete="email"
        required
      />

      <Button
        type="submit"
        className="w-full h-12 text-base"
        isLoading={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onBack}
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Login
      </Button>
    </motion.form>
  )
}

export default ResetPasswordForm

