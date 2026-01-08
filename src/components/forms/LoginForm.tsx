import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { LogIn, User, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { loginSchema, type LoginFormData } from '@/lib/validators'
import { login } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

interface LoginFormProps {
  onShowResetPassword: () => void
  onSuccess: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onShowResetPassword,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showResetPrompt, setShowResetPrompt] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login: storeLogin } = useAuthStore()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeId: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setShowResetPrompt(false)

    try {
      const result = await login(data.employeeId, data.password)

      if (result.success && result.user) {
        toast.success('Login Successful', `Welcome back, ${result.user.full_name}!`)
        storeLogin(result.user)
        onSuccess()
      } else {
        if (result.requiresPasswordReset) {
          setShowResetPrompt(true)
        }

        if (result.attemptsRemaining !== undefined && result.attemptsRemaining > 0) {
          setError('root', {
            message: result.error || 'Invalid credentials',
          })
          toast.error('Login Failed', result.error)
        } else if (result.isLocked) {
          toast.error('Account Locked', result.error || 'Too many failed attempts')
        } else {
          setError('root', {
            message: result.error || 'Invalid credentials',
          })
          toast.error('Login Failed', result.error || 'Invalid credentials')
        }
      }
    } catch {
      toast.error('Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* Error Alert */}
      {errors.root && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errors.root.message}</p>
        </motion.div>
      )}

      {/* Reset Password Prompt */}
      {showResetPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-amber-50 border border-amber-200"
        >
          <p className="text-sm text-amber-800 font-medium mb-2">
            Password Reset Required
          </p>
          <p className="text-sm text-amber-700 mb-3">
            Your account has been locked due to multiple failed login attempts.
            Please reset your password to continue.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onShowResetPassword}
          >
            Reset Password
          </Button>
        </motion.div>
      )}

      {/* Employee ID */}
      <div className="space-y-2.5">
        <label className="block text-sm font-bold text-slate-800 ml-1">
          Employee ID
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-teal-600 transition-colors">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <input
            {...register('employeeId')}
            type="text"
            placeholder="e.g. MOH-12345"
            autoComplete="username"
            className={cn(
              'w-full h-14 pl-12 pr-4 bg-slate-50/50 border border-slate-200 rounded-2xl',
              'text-slate-900 placeholder:text-slate-400 font-semibold text-base',
              'focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white',
              'transition-all duration-300',
              errors.employeeId && 'border-red-300 focus:ring-red-500/10 focus:border-red-500'
            )}
          />
        </div>
        {errors.employeeId && (
          <p className="text-xs font-bold text-red-500 ml-1 mt-1">{errors.employeeId.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between ml-1">
          <label className="block text-sm font-bold text-slate-800">
            Security Key
          </label>
          <button
            type="button"
            onClick={onShowResetPassword}
            className="text-xs text-teal-600 hover:text-teal-700 font-bold tracking-tight hover:underline transition-all"
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-teal-600 transition-colors">
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            autoComplete="current-password"
            className={cn(
              'w-full h-14 pl-12 pr-12 bg-slate-50/50 border border-slate-200 rounded-2xl',
              'text-slate-900 placeholder:text-slate-400 font-semibold text-base',
              'focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white',
              'transition-all duration-300',
              errors.password && 'border-red-300 focus:ring-red-500/10 focus:border-red-500'
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-teal-600 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs font-bold text-red-500 ml-1 mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <Button
          type="submit"
          className={cn(
            'w-full h-15 text-lg font-extrabold rounded-2xl transition-all duration-300',
            'bg-slate-900 hover:bg-slate-800 text-white',
            'shadow-xl shadow-slate-200 hover:shadow-slate-300 hover:-translate-y-0.5 active:translate-y-0',
            'border-none flex items-center justify-center gap-3'
          )}
          isLoading={isLoading}
        >
          {isLoading ? 'Verifying Identity...' : (
            <>
              Sign In to Ecosystem
              <LogIn className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </motion.form>
  )
}

export default LoginForm
