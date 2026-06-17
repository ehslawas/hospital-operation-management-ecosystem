import { BaseEntity, HealthStatus } from './base'
import { Hospital, Department } from './organization'
import { User, Role } from './auth'
import { SystemBackup } from './system'

export type MemoType = 'announcement' | 'policy' | 'event' | 'emergency' | 'maintenance'
export type MemoStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published' | 'archived'
export type MemoPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Memo extends BaseEntity {
  hospital_id: string
  title: string
  content: string
  memo_type: MemoType
  priority: MemoPriority
  status: MemoStatus
  created_by: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  publish_date?: string
  expiry_date?: string
  target_departments?: string[]
  attachments?: string[]
}

export interface MemoWithRelations extends Memo {
  hospital?: Hospital
  created_by_user?: User
  approved_by_user?: User
  target_department_details?: Department[]
}

export type SensitiveDataCategory = 'phi' | 'financial' | 'contact' | 'all'
export type SensitiveDataUrgency = 'routine' | 'urgent' | 'emergency'
export type SensitiveDataRequestStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'revoked'

export interface SensitiveDataRequest extends BaseEntity {
  hospital_id: string
  requestor_id: string
  patient_id: string
  patient_name: string
  patient_ic: string
  data_category: SensitiveDataCategory
  justification: string
  urgency: SensitiveDataUrgency
  status: SensitiveDataRequestStatus
  access_duration_hours: number
  approved_by?: string
  approved_at?: string
  denial_reason?: string
  access_expires_at?: string
  access_logs?: SensitiveDataAccessLog[]
}

export interface SensitiveDataRequestWithRelations extends SensitiveDataRequest {
  hospital?: Hospital
  requestor?: User
  approved_by_user?: User
}

export interface SensitiveDataAccessLog extends BaseEntity {
  request_id: string
  user_id: string
  action: 'view' | 'download' | 'print'
  data_accessed: string
  ip_address?: string
  user_agent?: string
}

export type HospitalLogCategory = 'authentication' | 'user_activity' | 'administrative' | 'security' | 'system'
export type HospitalLogSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface HospitalLog extends BaseEntity {
  hospital_id: string
  user_id?: string
  category: HospitalLogCategory
  severity: HospitalLogSeverity
  action: string
  description: string
  module?: string
  entity_type?: string
  entity_id?: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, unknown>
}

export interface HospitalLogWithRelations extends HospitalLog {
  user?: User
}

export type HospitalHealthCheckType = 'active_sessions' | 'database' | 'storage' | 'api_latency' | 'error_rate'

export interface HospitalHealthMetric extends BaseEntity {
  hospital_id: string
  check_type: HospitalHealthCheckType
  status: HealthStatus
  value: number
  unit: string
  threshold_warning: number
  threshold_critical: number
  message?: string
  checked_at: string
}

export interface HospitalHealthSummary {
  hospital_id: string
  overall_status: HealthStatus
  active_sessions: number
  max_sessions: number
  storage_used_gb: number
  storage_total_gb: number
  api_latency_ms: number
  error_rate_percent: number
  uptime_percent: number
  last_checked: string
  metrics: HospitalHealthMetric[]
}

export interface PatientDatabaseStats {
  hospital_id: string
  total_patients: number
  active_patients: number
  new_patients_today: number
  new_patients_week: number
  new_patients_month: number
  incomplete_records: number
  duplicate_alerts: number
  last_verification: string
  storage_used_mb: number
}

export interface PatientAccessLog extends BaseEntity {
  hospital_id: string
  patient_id: string
  patient_name: string
  accessed_by: string
  access_type: 'view' | 'edit' | 'create' | 'delete' | 'export'
  data_section: string
  ip_address?: string
  user_agent?: string
}

export interface PatientAccessLogWithRelations extends PatientAccessLog {
  accessed_by_user?: User
}

export type ReportType = 'user' | 'access' | 'usage' | 'security' | 'audit'
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

export interface HospitalReport extends BaseEntity {
  hospital_id: string
  report_type: ReportType
  report_name: string
  period: ReportPeriod
  start_date: string
  end_date: string
  generated_by: string
  file_path?: string
  status: 'generating' | 'completed' | 'failed'
}

export interface UserReportData {
  total_users: number
  active_users: number
  inactive_users: number
  suspended_users: number
  new_users: number
  users_by_department: { department: string; count: number }[]
  users_by_role: { role: string; count: number }[]
  login_activity: { date: string; logins: number }[]
}

export interface AccessReportData {
  total_requests: number
  approved_requests: number
  rejected_requests: number
  pending_requests: number
  avg_processing_time_hours: number
  requests_by_department: { department: string; count: number }[]
  requests_timeline: { date: string; approved: number; rejected: number; pending: number }[]
}

export interface UsageReportData {
  total_page_views: number
  unique_users: number
  avg_session_duration_minutes: number
  peak_hours: { hour: number; users: number }[]
  module_usage: { module: string; views: number; users: number }[]
  feature_adoption: { feature: string; usage_percent: number }[]
}

export interface SecurityReportData {
  failed_logins: number
  account_lockouts: number
  password_resets: number
  suspicious_activities: number
  security_incidents: { date: string; type: string; severity: string; resolved: boolean }[]
  failed_logins_by_user: { user: string; attempts: number }[]
}

export interface HospitalBackupInfo {
  hospital_id: string
  last_backup: SystemBackup | null
  next_scheduled: string
  backup_history: SystemBackup[]
  storage_used_gb: number
  storage_quota_gb: number
  retention_days: number
}
