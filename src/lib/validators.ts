import { z } from 'zod'

// Common error messages
const required = 'This field is required'

// Base schemas
export const emailSchema = z
  .string({ required_error: required })
  .min(1, required)
  .email('Please enter a valid email address')

export const nameSchema = z
  .string({ required_error: required })
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

export const icNumberSchema = z
  .string({ required_error: required })
  .regex(/^\d{6}-\d{2}-\d{4}$|^\d{12}$/, 'Invalid IC number format (e.g., 123456-12-1234 or 123456121234)')

export const phoneSchema = z
  .string({ required_error: required })
  .regex(/^(01)[0-9]{8,9}$|^(6?0)[0-9]{9,10}$/, 'Invalid phone number format')

export const employeeIdSchema = z
  .string({ required_error: required })
  .min(3, 'Employee ID must be at least 3 characters')
  .max(20, 'Employee ID is too long')

export const passwordSchema = z
  .string({ required_error: required })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')
  .refine((password) => {
    // Check for common weak patterns
    const commonPatterns = [
      /(.)\1{2,}/, // Same character repeated 3+ times
      /12345|abcde|qwerty|password/i, // Common sequences
    ]
    return !commonPatterns.some(pattern => pattern.test(password))
  }, {
    message: 'Password is too weak. Avoid common patterns and repeated characters.',
  })

// Department schema
export const departmentSchema = z.object({
  department_code: z
    .string({ required_error: required })
    .min(2, 'Department code must be at least 2 characters')
    .max(20, 'Department code is too long')
    .regex(/^[A-Z0-9_-]+$/, 'Department code can only contain uppercase letters, numbers, hyphens, and underscores'),
  department_name: z
    .string({ required_error: required })
    .min(2, 'Department name must be at least 2 characters')
    .max(100, 'Department name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  head_of_department_id: z.string().optional(),
})

export type DepartmentFormData = z.infer<typeof departmentSchema>

// Hospital Admin form schema
export const hospitalAdminSchema = z.object({
  email: emailSchema,
  employeeId: employeeIdSchema,
  fullName: nameSchema,
  icNumber: icNumberSchema,
  phoneNumber: phoneSchema,
  jawatan: z
    .string({ required_error: required })
    .min(2, 'Position must be at least 2 characters')
    .max(100, 'Position is too long'),
  password: passwordSchema,
  confirmPassword: z.string({ required_error: required }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type HospitalAdminFormData = z.infer<typeof hospitalAdminSchema>

// Login schema
export const loginSchema = z.object({
  employeeId: employeeIdSchema,
  password: z.string({ required_error: required }).min(1, required),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Reset Password Request schema
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
})

export type ResetPasswordRequestData = z.infer<typeof resetPasswordRequestSchema>

// Hospital schema
export const hospitalSchema = z.object({
  hospitalCode: z
    .string({ required_error: required })
    .min(2, 'Hospital code must be at least 2 characters')
    .max(20, 'Hospital code is too long')
    .regex(/^[A-Z0-9_-]+$/, 'Hospital code can only contain uppercase letters, numbers, hyphens, and underscores'),
  hospitalName: z
    .string({ required_error: required })
    .min(2, 'Hospital name must be at least 2 characters')
    .max(200, 'Hospital name is too long'),
  address: z.string().max(500, 'Address is too long').optional(),
  state: z.string().max(50, 'State is too long').optional(),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
})

export type HospitalFormData = z.infer<typeof hospitalSchema>

// User schema
export const userSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  employeeId: employeeIdSchema,
  icNumber: icNumberSchema,
  phoneNumber: phoneSchema.optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  address: z.string().max(500, 'Address is too long').optional().or(z.literal('')),
  hospitalId: z.string({ required_error: required }).min(1, required),
  departmentId: z.string({ required_error: required }).min(1, required),
  roleId: z.string({ required_error: required }).min(1, required),
  jawatan: z
    .string({ required_error: required })
    .min(2, 'Position must be at least 2 characters')
    .max(100, 'Position is too long'),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']),
})

export type UserFormData = z.infer<typeof userSchema>

// Access Request schema
export const accessRequestSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  icNumber: icNumberSchema,
  phoneNumber: phoneSchema,
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  address: z.string().max(500, 'Address is too long').optional().or(z.literal('')),
  hospitalId: z.string({ required_error: required }).min(1, required),
  departmentId: z.string({ required_error: required }).min(1, required),
  jawatan: z
    .string({ required_error: required })
    .min(2, 'Position must be at least 2 characters')
    .max(100, 'Position is too long'),
  password: passwordSchema,
  confirmPassword: z.string({ required_error: required }),
  emergencyContactName: z.string().max(100, 'Name is too long').optional().or(z.literal('')),
  emergencyContactRelationship: z.string().max(50, 'Relationship is too long').optional().or(z.literal('')),
  emergencyContactPhone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
  emergencyContactAddress: z.string().max(500, 'Address is too long').optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type AccessRequestFormData = z.infer<typeof accessRequestSchema>

// Inquiry schema
export const inquirySchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z
    .string({ required_error: required })
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject is too long'),
  message: z
    .string({ required_error: required })
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message is too long'),
  inquiryType: z.enum(['general', 'technical', 'access', 'complaint']).optional(),
})

export type InquiryFormData = z.infer<typeof inquirySchema>

/**
 * Validate file upload
 */
export interface ValidateFileOptions {
  maxSize?: number
  allowedTypes?: string[]
}

export interface ValidateFileResult {
  valid: boolean
  error?: string
}

export function validateFile(
  file: File,
  options: ValidateFileOptions = {}
): ValidateFileResult {
  const { maxSize, allowedTypes } = options

  // Check file size
  if (maxSize && file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    }
  }

  // Check file type
  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}