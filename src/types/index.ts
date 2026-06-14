// Base types
export interface BaseEntity {
  id: string
  created_at: string
  updated_at?: string
}

// User types
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending'
export type Gender = 'male' | 'female'

export interface User extends BaseEntity {
  email: string
  employee_id: string
  full_name: string
  ic_number: string
  phone_number?: string
  profile_photo_url?: string
  date_of_birth?: string
  gender?: Gender
  address?: string
  role_id: string
  department_id: string
  hospital_id: string
  jawatan: string
  status: UserStatus
  failed_login_attempts: number
  last_failed_login?: string
  account_locked_until?: string
  last_login?: string
  created_by?: string
}

export interface UserWithRelations extends User {
  role?: Role
  department?: Department
  hospital?: Hospital
  emergency_contacts?: EmergencyContact[]
}

// Emergency Contact
export interface EmergencyContact extends BaseEntity {
  user_id: string
  contact_name: string
  relationship: string
  phone_primary: string
  phone_secondary?: string
  address?: string
}

// Hospital types
export type HospitalStatus = 'active' | 'inactive'

export interface Hospital extends BaseEntity {
  hospital_code: string
  hospital_name: string
  address?: string
  state?: string
  phone?: string
  email?: string
  logo_url?: string
  status: HospitalStatus
}

// Department types
export type DepartmentStatus = 'active' | 'inactive'

export interface Department extends BaseEntity {
  hospital_id: string
  department_code: string
  department_name: string
  description?: string
  head_of_department_id?: string
  status: DepartmentStatus
}

export interface DepartmentWithRelations extends Department {
  hospital?: Hospital
  head_of_department?: User
}

// Role types
export interface Role extends BaseEntity {
  role_name: string
  role_code: string
  description?: string
  is_system_role: boolean
  hospital_id?: string
}

// Permission types
export interface Permission extends BaseEntity {
  permission_code: string
  permission_name: string
  module: string
  feature?: string // Specific feature within module (e.g., 'inventory', 'purchase_order')
  description?: string
}

export interface RolePermission extends BaseEntity {
  role_id: string
  permission_id: string
  granted_by: string
  granted_at: string
}

// Access Request types
export type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

export interface AccessRequest extends BaseEntity {
  full_name: string
  email: string
  ic_number: string
  phone_number: string
  date_of_birth?: string
  gender?: Gender
  address?: string
  profile_photo_url?: string
  hospital_id: string
  department_id: string
  jawatan: string
  emergency_contact_name?: string
  emergency_contact_relationship?: string
  emergency_contact_phone?: string
  emergency_contact_address?: string
  password_hash?: string
  password_encrypted?: string
  status: AccessRequestStatus
  reviewed_by?: string
  reviewed_at?: string
  rejection_reason?: string
}

export interface AccessRequestWithRelations extends AccessRequest {
  hospital?: Hospital
  department?: Department
  reviewed_by_user?: User
}

// Audit Log types
export interface AuditLog extends BaseEntity {
  user_id: string
  action: string
  module: string
  entity_type?: string
  entity_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

export interface AuditLogWithRelations extends AuditLog {
  user?: User
}

// Inquiry types
export type InquiryType = 'general' | 'technical' | 'access' | 'complaint'
export type InquiryStatus = 'new' | 'in_progress' | 'resolved' | 'closed'

export interface Inquiry extends BaseEntity {
  name: string
  email: string
  subject: string
  message: string
  inquiry_type: InquiryType
  status: InquiryStatus
  assigned_to?: string
  resolved_at?: string
}

// Login History types
export type LoginStatus = 'success' | 'failed' | 'locked'

export interface LoginHistory extends BaseEntity {
  user_id: string
  login_time: string
  logout_time?: string
  ip_address?: string
  user_agent?: string
  status: LoginStatus
  failure_reason?: string
}

// System Settings
export interface SystemSetting extends BaseEntity {
  setting_key: string
  setting_value: Record<string, unknown>
  hospital_id?: string
  updated_by?: string
}

export interface SystemSettings extends BaseEntity {
  app_name: string
  app_version: string
  maintenance_mode: boolean
  maintenance_message?: string
  session_timeout_minutes: number
  max_login_attempts: number
  lockout_duration_minutes: number
  password_min_length: number
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_special: boolean
  password_expiry_days: number
  require_email_verification: boolean
  allow_registration: boolean
  default_user_role?: string
  backup_enabled: boolean
  backup_frequency_hours: number
  backup_retention_days: number
  log_retention_days: number
  email_enabled: boolean
  email_from_address: string
  smtp_host?: string
  smtp_port?: number
  smtp_username?: string
  smtp_password?: string
  smtp_encryption?: 'tls' | 'ssl' | 'none'
}

// Pharmacy/Inventory Types
export type SupplierStatus = 'active' | 'inactive' | 'blacklisted'

export interface Supplier extends BaseEntity {
  supplier_code: string
  company_name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  registration_number?: string
  status: SupplierStatus
  hospital_id: string
}

export type ProductStatus = 'active' | 'discontinued' | 'pending'

export interface ProductCategory extends BaseEntity {
  category_code: string
  category_name: string
  parent_category_id?: string
  description?: string
  hospital_id: string
}

export interface Product extends BaseEntity {
  product_code: string
  product_name: string
  generic_name?: string
  category_id: string
  unit_of_measure: string
  unit_price?: number
  reorder_level?: number
  max_stock_level?: number
  is_controlled: boolean
  requires_prescription: boolean
  storage_requirements?: string
  hospital_id: string
  status: ProductStatus
}

export interface ProductWithRelations extends Product {
  category?: ProductCategory
}

export type StorageLocationType = 'warehouse' | 'pharmacy' | 'ward' | 'cold_room'

export interface StorageLocation extends BaseEntity {
  location_code: string
  location_name: string
  location_type: StorageLocationType
  department_id?: string
  hospital_id: string
  parent_location_id?: string
  is_active: boolean
}

export interface Inventory extends BaseEntity {
  product_id: string
  hospital_id: string
  location_id: string
  batch_number?: string
  expiry_date?: string
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  last_stock_take?: string
}

export interface InventoryWithRelations extends Inventory {
  product?: Product
  location?: StorageLocation
}

// Procurement types
export type PRStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'ordered'
export type POStatus = 'draft' | 'sent' | 'partial' | 'completed' | 'cancelled'
export type GRStatus = 'pending_inspection' | 'accepted' | 'partial' | 'rejected'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface PurchaseRequisition extends BaseEntity {
  pr_number: string
  hospital_id: string
  department_id: string
  requested_by: string
  request_date: string
  required_date?: string
  priority: Priority
  status: PRStatus
  approved_by?: string
  approved_at?: string
  notes?: string
  total_estimated_cost?: number
}

export interface PurchaseRequisitionItem extends BaseEntity {
  pr_id: string
  product_id: string
  quantity_requested: number
  quantity_approved?: number
  estimated_unit_price?: number
  notes?: string
}

export interface PurchaseOrder extends BaseEntity {
  po_number: string
  pr_id?: string
  supplier_id: string
  hospital_id: string
  order_date: string
  expected_delivery_date?: string
  status: POStatus
  total_amount?: number
  payment_terms?: string
  delivery_address?: string
  notes?: string
  created_by: string
  approved_by?: string
}

export interface PurchaseOrderItem extends BaseEntity {
  po_id: string
  product_id: string
  quantity_ordered: number
  quantity_received: number
  unit_price: number
  total_price: number
}

export interface GoodsReceipt extends BaseEntity {
  gr_number: string
  po_id: string
  hospital_id: string
  receipt_date: string
  received_by: string
  delivery_note_number?: string
  invoice_number?: string
  status: GRStatus
  notes?: string
}

export interface GoodsReceiptItem extends BaseEntity {
  gr_id: string
  po_item_id: string
  product_id: string
  quantity_received: number
  quantity_accepted?: number
  quantity_rejected: number
  batch_number?: string
  expiry_date?: string
  storage_location_id?: string
  rejection_reason?: string
}

export type TransactionType = 'receipt' | 'issue' | 'transfer' | 'adjust' | 'return' | 'dispose' | 'stock_take'

export interface InventoryTransaction extends BaseEntity {
  product_id: string
  hospital_id: string
  transaction_type: TransactionType
  reference_type?: string
  reference_id?: string
  from_location_id?: string
  to_location_id?: string
  quantity: number
  batch_number?: string
  unit_cost?: number
  reason?: string
  performed_by: string
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

// Modal types
export interface ModalState {
  isOpen: boolean
  title?: string
  content?: React.ReactNode
}

// Form state
export interface FormState<T> {
  data: T | null
  isLoading: boolean
  isSubmitting: boolean
  errors: Record<string, string>
}

// Table types
export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
  className?: string
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

export interface FilterConfig {
  key: string
  value: string | string[] | boolean | null
  operator?: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte'
}

// System Admin Types - Module Codes for all available modules
export type ModuleCode = 
  // Pharmacy Modules
  | 'pharmacy_logistics'
  | 'pharmacy_substore'
  | 'pharmacy_outpatient'
  | 'pharmacy_emergency'
  | 'pharmacy_inpatient'
  | 'pharmacy_galenical'
  // Ward Modules
  | 'general_ward'
  | 'paediatric_ward'
  | 'maternity_ward'
  // Clinical Modules
  | 'emergency_trauma'
  | 'laboratory'
  | 'operation_theater'
  | 'cssu_cssd'
  | 'radiology'
  | 'klinik_pakar'
  | 'haemodialysis'
  // Support Modules
  | 'driver_room'
  | 'hospital_office'
  | 'front_desk'
  // Legacy (to be deprecated)
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
export type HealthStatus = 'healthy' | 'warning' | 'critical'

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

// =====================================================
// Hospital Admin Module Types
// =====================================================

// Memo System Types
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

// Sensitive Data Request Types
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

// Hospital Log Types
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

// Hospital Health Metrics Types
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

// Patient Database Monitoring Types
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

// Hospital Report Types
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

// Hospital Backup Monitoring Types (Read-only for Hospital Admin)
export interface HospitalBackupInfo {
  hospital_id: string
  last_backup: SystemBackup | null
  next_scheduled: string
  backup_history: SystemBackup[]
  storage_used_gb: number
  storage_quota_gb: number
  retention_days: number
}

// User Session Types
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

// Pharmacy Types - Re-export from pharmacy module
export * from './pharmacy'

