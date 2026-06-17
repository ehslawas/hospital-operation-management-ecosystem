export const APP_NAME = 'HOME'
export const APP_FULL_NAME = 'Hospital Operation Management Ecosystem'
export const APP_VERSION = '1.0.0'

export const MAX_LOGIN_ATTEMPTS = 5
export const LOCKOUT_DURATION_MINUTES = 30
export const SESSION_TIMEOUT_MINUTES = 60
export const PASSWORD_MIN_LENGTH = 8

export const MAX_FILE_SIZE_MB = 5
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const

export const ACCESS_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export const HOSPITAL_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

export const DEPARTMENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

export const INQUIRY_STATUS = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const

export const INQUIRY_TYPES = {
  GENERAL: 'general',
  TECHNICAL: 'technical',
  ACCESS: 'access',
  COMPLAINT: 'complaint',
} as const

export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
} as const

export const COPYRIGHT_YEAR = new Date().getFullYear()
export const COPYRIGHT_TEXT = `© ${COPYRIGHT_YEAR} ${APP_NAME}. All rights reserved.`
