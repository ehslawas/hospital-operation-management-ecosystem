export * from '../constants'

// Module-specific overrides if needed (these were previously in this file)
export const PHARMACY_PO_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  SENT: 'sent',
  PARTIAL_RECEIVED: 'partial_received',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const PHARMACY_GR_STATUS = {
  PENDING: 'pending',
  INSPECTING: 'inspecting',
  ACCEPTED: 'accepted',
  PARTIAL: 'partial',
  REJECTED: 'rejected',
} as const

export const PHARMACY_OXYGEN_STATUS = {
  FULL: 'full',
  EMPTY: 'empty',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  DISPOSED: 'disposed',
} as const

export const PHARMACY_APPL_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export const PHARMACY_BUDGET_TYPE = {
  APPL: 'appl',
  CC: 'cc',
  DP: 'dp',
} as const

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

export const PR_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ORDERED: 'ordered',
} as const

export const PO_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const HEALTH_CHECK_TYPES = {
  CPU: 'cpu',
  MEMORY: 'memory',
  DATABASE: 'database',
  API: 'api',
  STORAGE: 'storage',
  NETWORK: 'network',
} as const

export const ALERT_TYPES = {
  ERROR: 'error',
  WARNING: 'warning',
  CRITICAL: 'critical',
  INFO: 'info',
} as const

export const ALERT_CATEGORIES = {
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  BACKUP: 'backup',
  SYSTEM: 'system',
  MODULE: 'module',
} as const

export const BACKUP_TYPES = {
  SCHEDULED: 'scheduled',
  MANUAL: 'manual',
  PRE_UPDATE: 'pre_update',
} as const

export const BACKUP_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export const MEMO_TYPES = {
  ANNOUNCEMENT: 'announcement',
  POLICY: 'policy',
  EVENT: 'event',
  EMERGENCY: 'emergency',
  MAINTENANCE: 'maintenance',
} as const

export const MEMO_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export const MEMO_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

export const SENSITIVE_DATA_CATEGORY = {
  PHI: 'phi',
  FINANCIAL: 'financial',
  CONTACT: 'contact',
  ALL: 'all',
} as const

export const SENSITIVE_DATA_URGENCY = {
  ROUTINE: 'routine',
  URGENT: 'urgent',
  EMERGENCY: 'emergency',
} as const

export const SENSITIVE_DATA_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const

export const HOSPITAL_LOG_CATEGORY = {
  AUTHENTICATION: 'authentication',
  USER_ACTIVITY: 'user_activity',
  ADMINISTRATIVE: 'administrative',
  SECURITY: 'security',
  SYSTEM: 'system',
} as const

export const HOSPITAL_LOG_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const
