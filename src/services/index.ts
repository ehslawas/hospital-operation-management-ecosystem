export * from './supabase'
export * from './baseService'
export * from './authShim'
export * from './adminShim'
export * from './inquiryService'
export * from './hospitalAdminService'
export * from './facilityService'
export * from './aiService'
export * from './webSearchService'
export * from './mockData'

// Hospital Admin Services
export * from './memoService'
export * from './hospitalLogService'
export * from './sensitiveDataRequestService'
export * from './hospitalHealthService'
export * from './hospitalBackupService'
export * from './patientDatabaseMonitorService'

// Pharmacy Logistics Services
export * from './pharmacy'

// Resolve wildcard export conflicts
export { getDepartmentById, getHospitalById, getRoleById } from './mockData'
export { markAlertAsRead } from './adminShim'
