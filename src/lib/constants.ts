// Application Constants

export const APP_NAME = 'HOME'
export const APP_FULL_NAME = 'Hospital Operation Management Ecosystem'
export const APP_VERSION = '1.0.0'

// Authentication
export const MAX_LOGIN_ATTEMPTS = 5
export const LOCKOUT_DURATION_MINUTES = 30
export const SESSION_TIMEOUT_MINUTES = 60
export const PASSWORD_MIN_LENGTH = 8

// Validation
export const MAX_FILE_SIZE_MB = 5
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Pagination
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// Status Options
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

// Roles
export const SYSTEM_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  HOSPITAL_ADMIN: 'hospital_admin',

  // KKM Standard Roles
  MEDICAL_OFFICER: 'medical_officer',
  ASSISTANT_MEDICAL_OFFICER: 'assistant_medical_officer',
  SENIOR_ASSISTANT_MEDICAL_OFFICER: 'senior_assistant_medical_officer',
  PHARMACIST: 'pharmacist',
  ASSISTANT_PHARMACIST: 'assistant_pharmacist',
  MATRON: 'matron',
  SISTER: 'sister',
  NURSE: 'nurse',
  HOSPITAL_ADMINISTRATOR: 'hospital_administrator',
  HOSPITAL_DRIVER: 'hospital_driver',
  GENERAL_SERVICE_ASSISTANT: 'general_service_assistant',
  RADIOGRAPHER: 'radiographer',
  MEDICAL_LAB_TECHNICIAN: 'medical_lab_technician',
  PATHOLOGIST: 'pathologist',
  PHYSIOTHERAPIST: 'physiotherapist',
  OCCUPATIONAL_THERAPIST: 'occupational_therapist',
  HOSPITAL_DIRECTOR: 'hospital_director',
} as const

// Role Display Names
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [SYSTEM_ROLES.SYSTEM_ADMIN]: 'System Administrator',
  [SYSTEM_ROLES.HOSPITAL_ADMIN]: 'Hospital Administrator',
  [SYSTEM_ROLES.MEDICAL_OFFICER]: 'Medical Officer',
  [SYSTEM_ROLES.ASSISTANT_MEDICAL_OFFICER]: 'Assistant Medical Officer',
  [SYSTEM_ROLES.SENIOR_ASSISTANT_MEDICAL_OFFICER]: 'Senior Assistant Medical Officer',
  [SYSTEM_ROLES.PHARMACIST]: 'Pharmacist',
  [SYSTEM_ROLES.ASSISTANT_PHARMACIST]: 'Assistant Pharmacist',
  [SYSTEM_ROLES.MATRON]: 'Matron',
  [SYSTEM_ROLES.SISTER]: 'Sister',
  [SYSTEM_ROLES.NURSE]: 'Nurse',
  [SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]: 'Hospital Administrator',
  [SYSTEM_ROLES.HOSPITAL_DRIVER]: 'Hospital Driver',
  [SYSTEM_ROLES.GENERAL_SERVICE_ASSISTANT]: 'General Service Assistant',
  [SYSTEM_ROLES.RADIOGRAPHER]: 'Radiographer',
  [SYSTEM_ROLES.MEDICAL_LAB_TECHNICIAN]: 'Medical Laboratory Technologist',
  [SYSTEM_ROLES.PATHOLOGIST]: 'Pathologist',
  [SYSTEM_ROLES.PHYSIOTHERAPIST]: 'Physiotherapist',
  [SYSTEM_ROLES.OCCUPATIONAL_THERAPIST]: 'Occupational Therapist',
  [SYSTEM_ROLES.HOSPITAL_DIRECTOR]: 'Hospital Director',
} as const

// Department Codes
export const DEPARTMENT_CODES = {
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  PHARMACY_LOGISTICS: 'PHARMACY_LOGISTICS',
  PHARMACY_SATELLITE: 'PHARMACY_SATELLITE',
  PHARMACY_SUBSTORE: 'PHARMACY_SUBSTORE',
  EMERGENCY_TRAUMA: 'EMERGENCY_TRAUMA',
  GENERAL_WARD: 'GENERAL_WARD',
  MATERNITY_WARD: 'MATERNITY_WARD',
  PAEDIATRIC_WARD: 'PAEDIATRIC_WARD',
  NURSING_UNIT: 'NURSING_UNIT',
} as const

// Pharmacy Logistics Status Constants
export const PHARMACY_STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  CRITICAL: 'critical',
  OUT_OF_STOCK: 'out_of_stock',
} as const

export const PHARMACY_BATCH_STATUS = {
  AVAILABLE: 'available',
  QUARANTINE: 'quarantine',
  EXPIRED: 'expired',
  DEPLETED: 'depleted',
} as const

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

export const PHARMACY_TRANSFER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PREPARING: 'preparing',
  IN_TRANSIT: 'in_transit',
  RECEIVED: 'received',
  COMPLETED: 'completed',
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

export const PHARMACY_TRANSACTION_TYPE = {
  RECEIPT: 'receipt',
  ISSUE: 'issue',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  ADJUST: 'adjust',
  RETURN: 'return',
  DISPOSE: 'dispose',
} as const

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male / Lelaki' },
  { value: 'female', label: 'Female / Perempuan' },
] as const

// Relationship Options for Emergency Contact
export const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse / Pasangan' },
  { value: 'parent', label: 'Parent / Ibu/Bapa' },
  { value: 'sibling', label: 'Sibling / Adik-beradik' },
  { value: 'child', label: 'Child / Anak' },
  { value: 'relative', label: 'Relative / Saudara' },
  { value: 'friend', label: 'Friend / Rakan' },
  { value: 'other', label: 'Other / Lain-lain' },
] as const

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

// Procurement Status
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

// Storage Location Types
export const STORAGE_LOCATION_TYPES = {
  WAREHOUSE: 'warehouse',
  PHARMACY: 'pharmacy',
  WARD: 'ward',
  COLD_ROOM: 'cold_room',
} as const

// Transaction Types
export const TRANSACTION_TYPES = {
  RECEIPT: 'receipt',
  ISSUE: 'issue',
  TRANSFER: 'transfer',
  ADJUST: 'adjust',
  RETURN: 'return',
  DISPOSE: 'dispose',
  STOCK_TAKE: 'stock_take',
} as const

// Toast Duration (milliseconds)
export const TOAST_DURATION = {
  MINIMAL: 1500, // New snappy duration for rapid feedback
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
} as const

// Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  RESET_PASSWORD: '/reset-password',
  PROFILE: '/profile',

  // Admin Routes (Shared by System Admin & Hospital Admin)
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_SESSIONS: '/admin/users/sessions',
  ADMIN_USER_ACTIVITY: '/admin/users/activity',
  ADMIN_ACCESS_REQUESTS: '/admin/access-requests',
  ADMIN_HOSPITALS: '/admin/hospitals',
  ADMIN_CLINICS: '/admin/clinics',
  ADMIN_DEPARTMENTS: '/admin/departments',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_PERMISSIONS: '/admin/permissions',
  ADMIN_MODULES: '/admin/modules',
  ADMIN_FEATURES: '/admin/features',
  ADMIN_WORKFLOWS: '/admin/workflows',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  APPROVAL_DASHBOARD: '/approvals',

  // System Admin Routes
  ADMIN_MONITORING: '/admin/monitoring',
  ADMIN_BACKUPS: '/admin/backups',
  ADMIN_ALERTS: '/admin/alerts',
  ADMIN_SYSTEM_LOGS: '/admin/system-logs',

  // NEW: System Admin Isolated Module
  SYSTEM_DASHBOARD: '/system/dashboard',
  SYSTEM_TENANTS: '/system/tenants',
  SYSTEM_ANALYTICS: '/system/analytics',
  SYSTEM_AUDIT_LOGS: '/system/audit-logs',
  SYSTEM_HEALTH: '/system/health',

  // Hospital Admin Routes
  ADMIN_MEMOS: '/admin/memos',
  ADMIN_MEMO_CREATE: '/admin/memos/create',
  ADMIN_RUNNING_NUMBERS: '/admin/running-numbers',
  ADMIN_SENSITIVE_DATA_REQUESTS: '/admin/sensitive-data-requests',
  ADMIN_PATIENT_DATABASE: '/admin/patient-database',
  ADMIN_PATIENT_ACCESS_LOGS: '/admin/patient-database/access-logs',
  ADMIN_HOSPITAL_MODULES: '/admin/hospital-modules',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_REPORTS_USERS: '/admin/reports/users',
  ADMIN_REPORTS_ACCESS: '/admin/reports/access',
  ADMIN_REPORTS_USAGE: '/admin/reports/usage',
  ADMIN_REPORTS_SECURITY: '/admin/reports/security',
  ADMIN_HOSPITAL_HEALTH: '/admin/hospital-health',
  ADMIN_HOSPITAL_LOGS: '/admin/hospital-logs',
  ADMIN_HOSPITAL_BACKUPS: '/admin/hospital-backups',

  // Admin Operations (Exclusive Module)
  ADMIN_OPERATIONS: '/admin/operations',
  ADMIN_OPERATIONS_DASHBOARD: '/admin/operations/dashboard',
  ADMIN_OPERATIONS_PROCUREMENT: '/admin/operations/procurement',
  ADMIN_OPERATIONS_PROCUREMENT_ORDERS: '/admin/operations/procurement/orders',
  ADMIN_OPERATIONS_PROCUREMENT_CREATE: '/admin/operations/procurement/orders/create',
  ADMIN_OPERATIONS_PROCUREMENT_LPO: '/admin/operations/procurement/lpo',
  ADMIN_OPERATIONS_PROCUREMENT_RECEIVING: '/admin/operations/procurement/receiving',
  ADMIN_OPERATIONS_PROCUREMENT_PAYMENT: '/admin/operations/procurement/payment',
  ADMIN_OPERATIONS_FINANCIAL: '/admin/operations/financial',
  ADMIN_OPERATIONS_WARRANT: '/admin/operations/financial/warrant',
  ADMIN_OPERATIONS_WARRANT_CREATE: '/admin/operations/financial/warrant/new',
  ADMIN_OPERATIONS_WARRANT_EDIT: '/admin/operations/financial/warrant/:id/edit',

  // Admin Operations - Pembangunan (P42)
  ADMIN_OPERATIONS_PEMBANGUNAN: '/admin/operations/financial/pembangunan',
  ADMIN_OPERATIONS_PEMBANGUNAN_CREATE: '/admin/operations/financial/pembangunan/new',
  ADMIN_OPERATIONS_PEMBANGUNAN_EDIT: '/admin/operations/financial/pembangunan/:id/edit',

  // Pharmacy Logistics Routes
  PHARMACY: '/pharmacy',
  PHARMACY_DASHBOARD: '/pharmacy/dashboard',
  PHARMACY_TEMPERATURE_MONITORING: '/pharmacy/temperature-monitoring',

  // Inventory Management
  PHARMACY_INVENTORY: '/pharmacy/inventory',
  PHARMACY_DRUGS: '/pharmacy/inventory/drugs',
  PHARMACY_NON_DRUGS: '/pharmacy/inventory/non-drugs',
  PHARMACY_BUFFER_LEVEL: '/pharmacy/inventory/buffer-level',
  PHARMACY_ITEM_MOVEMENT: '/pharmacy/inventory/movement',
  PHARMACY_SLOW_MOVING: '/pharmacy/inventory/slow-moving',
  PHARMACY_NEAR_EXPIRY: '/pharmacy/inventory/near-expiry',
  PHARMACY_BAD_STOCK: '/pharmacy/inventory/bad-stock',

  // Medical Oxygen
  PHARMACY_OXYGEN: '/pharmacy/oxygen',
  PHARMACY_OXYGEN_DASHBOARD: '/pharmacy/oxygen/dashboard',
  PHARMACY_OXYGEN_INVENTORY: '/pharmacy/oxygen/inventory',
  PHARMACY_OXYGEN_REQUEST: '/pharmacy/oxygen/request',
  PHARMACY_OXYGEN_CONSUMPTION: '/pharmacy/oxygen/consumption',
  PHARMACY_OXYGEN_QR_GEN: '/pharmacy/oxygen/tools/qr-gen',
  PHARMACY_OXYGEN_ISSUE: '/pharmacy/oxygen/issue',
  PHARMACY_OXYGEN_RETURN: '/pharmacy/oxygen/return',
  PHARMACY_OXYGEN_SUPPLIER_RETURN: '/pharmacy/oxygen/supplier',


  // Financial
  PHARMACY_FINANCIAL: '/pharmacy/financial',
  PHARMACY_BUDGET: '/pharmacy/financial/budget',
  PHARMACY_WARRANT: '/pharmacy/financial/warrant',
  PHARMACY_APPL_ALLOCATION: '/pharmacy/financial/appl-allocation',
  PHARMACY_CC_ALLOCATION: '/pharmacy/financial/cc-allocation',
  PHARMACY_LP_ALLOCATION: '/pharmacy/financial/lp-allocation',
  // Legacy routes (kept for backward compatibility)
  PHARMACY_FORECAST: '/pharmacy/financial/forecast',
  PHARMACY_APPL: '/pharmacy/financial/appl',
  PHARMACY_CCDP: '/pharmacy/financial/ccdp',

  // Procurement
  PHARMACY_PROCUREMENT: '/pharmacy/procurement',
  PHARMACY_PO: '/pharmacy/procurement/orders',
  PHARMACY_PO_CREATE: '/pharmacy/procurement/orders/create',
  PHARMACY_SQ_CREATE: '/pharmacy/procurement/sq/create',
  PHARMACY_MANUAL_CREATE: '/pharmacy/procurement/manual/create',
  PHARMACY_PO_DETAIL: '/pharmacy/procurement/orders/:id',
  PHARMACY_LPO: '/pharmacy/procurement/lpo',
  PHARMACY_LPO_CREATE: '/pharmacy/procurement/lpo/create',
  PHARMACY_DELIVERY: '/pharmacy/procurement/delivery',
  PHARMACY_RECEIVING: '/pharmacy/procurement/receiving',
  PHARMACY_PHYSICAL_RECEIVING: '/pharmacy/inventory/receiving',
  PHARMACY_PHYSICAL_ISSUING: '/pharmacy/inventory/issuing',
  PHARMACY_ITEM_REGISTRY: '/pharmacy/inventory/registry',
  PHARMACY_ITEM_REGISTRATION: '/pharmacy/inventory/registry/new',
  PHARMACY_ITEM_DETAILS: '/pharmacy/inventory/registry/:id',
  PHARMACY_ITEM_QR_GEN: '/pharmacy/item-tracking/qr-gen',
  PHARMACY_PAYMENT: '/pharmacy/procurement/payment',
  PHARMACY_ORDER_TRACKING: '/pharmacy/procurement/tracking',
  PHARMACY_PENALTY: '/pharmacy/procurement/penalty',
  PHARMACY_LOU: '/pharmacy/procurement/lou',

  // Distribution
  PHARMACY_DISTRIBUTION: '/pharmacy/distribution',
  PHARMACY_INTRA_FACILITY_LIST: '/pharmacy/distribution/intra-facility',
  PHARMACY_INTRA_FACILITY: '/pharmacy/distribution/intra-facility',
  PHARMACY_INTRA_FACILITY_ISSUE: '/pharmacy/distribution/intra-facility/issue',
  PHARMACY_INTRA_FACILITY_DETAIL: '/pharmacy/distribution/intra-facility/:id',
  // Inter-facility
  PHARMACY_INTER_FACILITY_LIST: '/pharmacy/distribution/inter-facility',
  PHARMACY_INTER_FACILITY_DETAIL: '/pharmacy/distribution/inter-facility/:id',
  PHARMACY_DISTRIBUTION_BORROW: '/pharmacy/distribution/inter-facility/borrow',
  PHARMACY_DISTRIBUTION_LEND: '/pharmacy/distribution/inter-facility/lend',
  PHARMACY_DISTRIBUTION_LOAN_LEDGER: '/pharmacy/distribution/inter-facility/ledger',
  PHARMACY_DISTRIBUTION_REQUESTS: '/pharmacy/distribution/requests',
  PHARMACY_TRANSFER_REQUEST: '/pharmacy/distribution/intra-facility',

  // Catalog
  PHARMACY_CATALOG: '/pharmacy/catalog',
  PHARMACY_DRUG_CATALOG: '/pharmacy/catalog/drugs',
  PHARMACY_NON_DRUG_CATALOG: '/pharmacy/catalog/non-drugs',
  PHARMACY_SUPPLIER_CATALOG: '/pharmacy/catalog/suppliers',
  PHARMACY_CONTRACT_DRUGS: '/pharmacy/catalog/contract-drugs',
  PHARMACY_CONTRACT_NON_DRUGS: '/pharmacy/catalog/contract-non-drugs',
  PHARMACY_HOSPITAL_FACILITY: '/pharmacy/catalog/hospitals',
  PHARMACY_CLINIC_FACILITY: '/pharmacy/catalog/clinics',

  // Maintenance
  PHARMACY_MAINTENANCE: '/pharmacy/maintenance',
  PHARMACY_UNIT_CATALOG: '/pharmacy/maintenance/units',
  PHARMACY_UNIT_CATALOG_ITEMS: '/pharmacy/maintenance/units/:id/items',
  PHARMACY_STOCK_LOCATION: '/pharmacy/maintenance/locations',
  PHARMACY_STOCK_LOCATION_ITEMS: '/pharmacy/maintenance/locations/:id/items',
  PHARMACY_STOCK_VERIFICATION: '/pharmacy/maintenance/verification',

  // Reports & Logs
  PHARMACY_REPORTS: '/pharmacy/reports',
  PHARMACY_REPORTS_INVENTORY: '/pharmacy/reports/inventory',
  PHARMACY_REPORTS_PROCUREMENT: '/pharmacy/reports/procurement',
  PHARMACY_REPORTS_FINANCIAL: '/pharmacy/reports/financial',
  PHARMACY_REPORTS_DISTRIBUTION: '/pharmacy/reports/distribution',
  PHARMACY_LOGS: '/pharmacy/logs',

  // Legacy routes (for backward compatibility)
  PHARMACY_PRODUCTS: '/pharmacy/products',
  PHARMACY_CATEGORIES: '/pharmacy/categories',
  PHARMACY_SUPPLIERS: '/pharmacy/suppliers',
  PHARMACY_PR: '/pharmacy/requisitions',
  PHARMACY_GR: '/pharmacy/receipts',

  // Legal Pages
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_SERVICE: '/terms-of-service',
} as const

// Malaysian States
export const MALAYSIAN_STATES = [
  { value: 'JHR', label: 'Johor' },
  { value: 'KDH', label: 'Kedah' },
  { value: 'KTN', label: 'Kelantan' },
  { value: 'MLK', label: 'Melaka' },
  { value: 'NSN', label: 'Negeri Sembilan' },
  { value: 'PHG', label: 'Pahang' },
  { value: 'PNG', label: 'Pulau Pinang' },
  { value: 'PRK', label: 'Perak' },
  { value: 'PLS', label: 'Perlis' },
  { value: 'SBH', label: 'Sabah' },
  { value: 'SWK', label: 'Sarawak' },
  { value: 'SGR', label: 'Selangor' },
  { value: 'TRG', label: 'Terengganu' },
  { value: 'KUL', label: 'Kuala Lumpur' },
  { value: 'LBN', label: 'Labuan' },
  { value: 'PJY', label: 'Putrajaya' },
] as const

// Copyright
export const COPYRIGHT_YEAR = new Date().getFullYear()
export const COPYRIGHT_TEXT = `© ${COPYRIGHT_YEAR} ${APP_NAME}. All rights reserved.`

// System Modules - All available modules that can be enabled per hospital
export const SYSTEM_MODULES = {
  // Pharmacy Modules
  PHARMACY_LOGISTICS: 'pharmacy_logistics',
  PHARMACY_SUBSTORE: 'pharmacy_substore',
  PHARMACY_OUTPATIENT: 'pharmacy_outpatient',
  PHARMACY_EMERGENCY: 'pharmacy_emergency',
  PHARMACY_INPATIENT: 'pharmacy_inpatient',
  PHARMACY_GALENICAL: 'pharmacy_galenical',

  // Ward Modules
  GENERAL_WARD: 'general_ward',
  PAEDIATRIC_WARD: 'paediatric_ward',
  MATERNITY_WARD: 'maternity_ward',

  // Clinical Modules
  EMERGENCY_TRAUMA: 'emergency_trauma',
  LABORATORY: 'laboratory',
  OPERATION_THEATER: 'operation_theater',
  CSSU_CSSD: 'cssu_cssd',
  RADIOLOGY: 'radiology',
  KLINIK_PAKAR: 'klinik_pakar',
  HAEMODIALYSIS: 'haemodialysis',

  // Support Modules
  DRIVER_ROOM: 'driver_room',
  HOSPITAL_OFFICE: 'hospital_office',
  FRONT_DESK: 'front_desk',

  // Legacy (to be deprecated)
  PHARMACY: 'pharmacy',
  WARD: 'ward',
  BILLING: 'billing',
  HR: 'hr',
  ASSET: 'asset',
  REPORTS: 'reports',
} as const

export const MODULE_DEFINITIONS = [
  // Pharmacy Modules
  {
    code: SYSTEM_MODULES.PHARMACY_LOGISTICS,
    name: 'Pharmacy Logistics',
    description: 'Central pharmacy logistics, inventory, procurement, and distribution',
    icon: 'Package',
    category: 'pharmacy',
  },
  {
    code: SYSTEM_MODULES.PHARMACY_SUBSTORE,
    name: 'Pharmacy Substore',
    description: 'Substore inventory and stock management',
    icon: 'Warehouse',
    category: 'pharmacy',
  },
  {
    code: SYSTEM_MODULES.PHARMACY_OUTPATIENT,
    name: 'Pharmacy Outpatient',
    description: 'Outpatient dispensing and prescription management',
    icon: 'Pill',
    category: 'pharmacy',
  },
  {
    code: SYSTEM_MODULES.PHARMACY_EMERGENCY,
    name: 'Pharmacy Emergency',
    description: 'Emergency pharmacy operations',
    icon: 'AlertCircle',
    category: 'pharmacy',
  },
  {
    code: SYSTEM_MODULES.PHARMACY_INPATIENT,
    name: 'Pharmacy In Patient',
    description: 'Inpatient medication management',
    icon: 'Bed',
    category: 'pharmacy',
  },
  {
    code: SYSTEM_MODULES.PHARMACY_GALENICAL,
    name: 'Pharmacy Galenical & Prepacking',
    description: 'Extemporaneous preparation and prepacking',
    icon: 'Beaker',
    category: 'pharmacy',
  },

  // Ward Modules
  {
    code: SYSTEM_MODULES.GENERAL_WARD,
    name: 'General Ward',
    description: 'General ward patient management',
    icon: 'BedDouble',
    category: 'ward',
  },
  {
    code: SYSTEM_MODULES.PAEDIATRIC_WARD,
    name: 'Paediatric Ward',
    description: 'Paediatric patient care and management',
    icon: 'Baby',
    category: 'ward',
  },
  {
    code: SYSTEM_MODULES.MATERNITY_WARD,
    name: 'Maternity Ward',
    description: 'Maternity and obstetrics care',
    icon: 'Heart',
    category: 'ward',
  },

  // Clinical Modules
  {
    code: SYSTEM_MODULES.EMERGENCY_TRAUMA,
    name: 'Emergency & Trauma',
    description: 'Emergency and trauma department management',
    icon: 'Ambulance',
    category: 'clinical',
  },
  {
    code: 'laboratory',
    name: 'Pathology & Laboratory',
    description: 'Laboratory tests and results management',
    icon: 'FlaskConical',
    category: 'clinical',
  },
  {
    code: SYSTEM_MODULES.OPERATION_THEATER,
    name: 'Operation Theater',
    description: 'Operation theater scheduling and management',
    icon: 'Scissors',
    category: 'clinical',
  },
  {
    code: SYSTEM_MODULES.CSSU_CSSD,
    name: 'CSSU/CSSD',
    description: 'Central Sterile Supply Unit management',
    icon: 'ShieldCheck',
    category: 'clinical',
  },
  {
    code: SYSTEM_MODULES.RADIOLOGY,
    name: 'Radiology & Radiography',
    description: 'Imaging and radiology services',
    icon: 'Scan',
    category: 'clinical',
  },
  {
    code: SYSTEM_MODULES.KLINIK_PAKAR,
    name: 'Klinik Pakar',
    description: 'Specialist clinic management',
    icon: 'Stethoscope',
    category: 'clinical',
  },
  {
    code: SYSTEM_MODULES.HAEMODIALYSIS,
    name: 'Haemodialysis',
    description: 'Haemodialysis unit management',
    icon: 'Activity',
    category: 'clinical',
  },

  // Support Modules
  {
    code: SYSTEM_MODULES.DRIVER_ROOM,
    name: 'Driver Room',
    description: 'Driver and transport management',
    icon: 'Car',
    category: 'support',
  },
  {
    code: SYSTEM_MODULES.HOSPITAL_OFFICE,
    name: 'Hospital Office',
    description: 'Hospital administration office',
    icon: 'Building',
    category: 'support',
  },
  {
    code: SYSTEM_MODULES.FRONT_DESK,
    name: 'Front Desk',
    description: 'Reception and registration',
    icon: 'UserCheck',
    category: 'support',
  },

  // Legacy Modules
  {
    code: SYSTEM_MODULES.BILLING,
    name: 'Financial & Billing',
    description: 'Manage billing and financial operations',
    icon: 'DollarSign',
    category: 'support',
  },
  {
    code: SYSTEM_MODULES.HR,
    name: 'Human Resources',
    description: 'Manage HR operations and employee data',
    icon: 'Users',
    category: 'support',
  },
  {
    code: SYSTEM_MODULES.ASSET,
    name: 'Asset Management',
    description: 'Manage hospital assets and equipment',
    icon: 'Package',
    category: 'support',
  },
  {
    code: SYSTEM_MODULES.REPORTS,
    name: 'Advanced Reports',
    description: 'Access advanced reporting and analytics',
    icon: 'FileText',
    category: 'support',
  },
] as const

// Module Categories for grouping in UI
export const MODULE_CATEGORIES = {
  PHARMACY: { code: 'pharmacy', name: 'Pharmacy', icon: 'Pill' },
  WARD: { code: 'ward', name: 'Ward Management', icon: 'Bed' },
  CLINICAL: { code: 'clinical', name: 'Clinical Services', icon: 'Stethoscope' },
  SUPPORT: { code: 'support', name: 'Support Services', icon: 'Settings' },
} as const

// Health Check Types
export const HEALTH_CHECK_TYPES = {
  CPU: 'cpu',
  MEMORY: 'memory',
  DATABASE: 'database',
  API: 'api',
  STORAGE: 'storage',
  NETWORK: 'network',
} as const

// Alert Types
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

// Backup Types
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

// Memo Types & Status
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

// Sensitive Data Request
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

// Hospital Log Categories
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

