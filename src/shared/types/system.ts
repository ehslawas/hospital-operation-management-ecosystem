import { BaseEntity, HealthStatus } from './base'
import { Hospital } from './organization'
import { User } from './auth'

export type ModuleCode = 
  | 'pharmacy_logistics'
  | 'pharmacy_substore'
  | 'pharmacy_outpatient'
  | 'pharmacy_emergency'
  | 'pharmacy_inpatient'
  | 'pharmacy_galenical'
  | 'general_ward'
  | 'paediatric_ward'
  | 'maternity_ward'
  | 'emergency_trauma'
  | 'laboratory'
  | 'operation_theater'
  | 'cssu_cssd'
  | 'radiology'
  | 'klinik_pakar'
  | 'haemodialysis'
  | 'driver_room'
  | 'hospital_office'
  | 'front_desk'
  | 'pharmacy'
  | 'ward'
  | 'billing'
  | 'hr'
  | 'asset'
  | 'reports'

export interface HospitalModule extends BaseEntity {
  hospital_id: string
  module_code: ModuleCode
  is_enabled: boolean
  enabled_at?: string
  enabled_by?: string
  disabled_at?: string
  disabled_by?: string
}

export interface HospitalModuleWithRelations extends HospitalModule {
  hospital?: Hospital
  enabled_by_user?: User
  disabled_by_user?: User
}

export type HealthCheckType = 'cpu' | 'memory' | 'database' | 'api' | 'storage' | 'network'

export interface SystemHealthLog extends BaseEntity {
  check_type: HealthCheckType
  status: HealthStatus
  value: number
  unit: string
  message?: string
  checked_at: string
}

export type BackupType = 'scheduled' | 'manual' | 'pre_update'
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface SystemBackup extends BaseEntity {
  backup_type: BackupType
  status: BackupStatus
  file_path?: string
  file_size?: number
  started_at?: string
  completed_at?: string
  initiated_by?: string
  error_message?: string
}

export type AlertType = 'error' | 'warning' | 'critical' | 'info'
export type AlertCategory = 'security' | 'performance' | 'backup' | 'system' | 'module'

export interface SystemAlert extends BaseEntity {
  alert_type: AlertType
  category: AlertCategory
  title: string
  message: string
  is_read: boolean
  is_resolved: boolean
  resolved_at?: string
  resolved_by?: string
  metadata?: Record<string, unknown>
}

export interface HospitalWithAdmin extends Hospital {
  admin?: User
  modules?: HospitalModule[]
  user_count?: number
  active_user_count?: number
  enabled_modules_count?: number
}

export interface SystemStatistics {
  total_hospitals: number
  active_hospitals: number
  inactive_hospitals: number
  pending_setup_hospitals: number
  total_users: number
  active_users: number
  pending_users: number
  suspended_users: number
  inactive_users: number
  module_usage: Record<ModuleCode, { count: number; percentage: number }>
  system_health: {
    overall_status: HealthStatus
    checks: SystemHealthLog[]
  }
  recent_alerts: {
    critical: number
    warning: number
    info: number
  }
  last_backup?: SystemBackup
}

export interface UserSession extends BaseEntity {
  user_id: string
  hospital_id: string
  session_token: string
  ip_address: string
  user_agent: string
  device_type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  started_at: string
  last_activity: string
  expires_at: string
  is_active: boolean
}

export interface UserSessionWithRelations extends UserSession {
  user?: User
}
