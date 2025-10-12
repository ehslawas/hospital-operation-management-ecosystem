export type EmploymentStatus = 'permanent' | 'contract' | 'temporary' | 'probation';
export type LeaveType = 'annual' | 'sick' | 'emergency' | 'maternity' | 'study' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ClaimType = 'outpatient' | 'inpatient' | 'panel' | 'insurance' | 'government';
export type ClaimStatus = 'submitted' | 'processing' | 'approved' | 'paid' | 'rejected';
export type BedStatus = 'occupied' | 'available' | 'cleaning' | 'maintenance' | 'reserved';

export interface StaffMember {
  id: string;
  staffId: string;
  name: string;
  icNumber: string;
  
  // Employment
  department: string;
  position: string;
  grade: string;
  employmentStatus: EmploymentStatus;
  joinDate: Date;
  
  // Contact
  email: string;
  contactNumber: string;
  address: string;
  emergencyContact: string;
  emergencyContactNumber: string;
  
  // Credentials
  qualifications: string[];
  certifications: string[];
  licenseNumber?: string;
  
  // Leave entitlement
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  emergencyLeaveBalance: number;
  
  // Attendance
  lastAttendanceDate?: Date;
  totalAbsencesThisYear: number;
  
  // Performance
  lastAppraisalDate?: Date;
  nextAppraisalDate?: Date;
  performanceRating?: number;
  
  // Status
  isActive: boolean;
  
  notes?: string;
}

export interface LeaveApplication {
  id: string;
  applicationNumber: string;
  applicationDate: Date;
  
  // Staff
  staffId: string;
  staffName: string;
  department: string;
  position: string;
  
  // Leave details
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  
  reason: string;
  
  // Status
  status: LeaveStatus;
  
  // Approval workflow
  submittedBy: string;
  supervisorId?: string;
  reviewedBy?: string;
  reviewedDate?: Date;
  reviewComments?: string;
  
  // Relief officer
  reliefOfficer?: string;
  reliefOfficerAgreed?: boolean;
  
  // Supporting documents
  hasMedicalCertificate?: boolean;
  hasSupportingDocuments?: boolean;
  
  notes?: string;
}

export interface Attendance {
  id: string;
  date: Date;
  
  staffId: string;
  staffName: string;
  department: string;
  
  // Timing
  checkInTime?: Date;
  checkOutTime?: Date;
  
  // Shift
  scheduledShift: string;
  actualHours: number;
  
  // Status
  status: 'present' | 'absent' | 'late' | 'leave' | 'off-duty';
  
  // Overtime
  overtimeHours?: number;
  overtimeApproved?: boolean;
  
  remarks?: string;
}

export interface BillingRecord {
  id: string;
  billNumber: string;
  billDate: Date;
  
  // Patient
  patientName: string;
  patientIC: string;
  patientMRN: string;
  
  // Bill details
  claimType: ClaimType;
  
  // Items
  items: BillingItem[];
  
  // Amounts
  subtotal: number;
  discounts: number;
  gst: number;
  totalAmount: number;
  
  // Payment
  paidAmount: number;
  outstandingAmount: number;
  
  // Insurance
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceCoverage?: number;
  insuranceApprovalNumber?: string;
  
  // Panel
  panelName?: string;
  panelApprovalNumber?: string;
  
  // Status
  status: ClaimStatus;
  
  // Processing
  processedBy: string;
  processedDate?: Date;
  approvedBy?: string;
  approvedDate?: Date;
  paidDate?: Date;
  
  notes?: string;
}

export interface BillingItem {
  id: string;
  itemCode: string;
  itemName: string;
  itemType: 'medication' | 'procedure' | 'consultation' | 'lab-test' | 'imaging' | 'bed-charge' | 'other';
  
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  
  // Department
  chargingDepartment: string;
  
  // Subsidy
  isSubsidized: boolean;
  subsidyAmount?: number;
  
  // Insurance coverage
  coveredByInsurance: boolean;
  insuranceCoverage?: number;
  
  remarks?: string;
}

export interface HospitalBed {
  id: string;
  bedNumber: string;
  
  // Location
  ward: string;
  room: string;
  bedType: 'general' | 'semi-private' | 'private' | 'icu' | 'hdu' | 'isolation';
  
  status: BedStatus;
  
  // Current occupancy
  currentPatient?: string;
  currentPatientMRN?: string;
  admissionDate?: Date;
  estimatedDischargeDate?: Date;
  
  // Charges
  dailyRate: number;
  
  // Maintenance
  lastCleaningDate?: Date;
  lastMaintenanceDate?: Date;
  
  // Features
  hasOxygen: boolean;
  hasSuction: boolean;
  hasMonitor: boolean;
  
  notes?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  
  // Personal
  fullName: string;
  staffId: string;
  department: string;
  position: string;
  
  // Account
  email: string;
  contactNumber: string;
  
  // Access
  roles: string[];
  permissions: string[];
  
  // Status
  isActive: boolean;
  accountCreated: Date;
  lastLogin?: Date;
  loginCount: number;
  
  // Password
  passwordLastChanged?: Date;
  passwordExpiryDate?: Date;
  mustChangePassword: boolean;
  
  // Security
  failedLoginAttempts: number;
  isLocked: boolean;
  lockedUntil?: Date;
  
  notes?: string;
}

export interface OfficeAdminStats {
  // Staff
  totalStaff: number;
  activeStaff: number;
  staffOnLeave: number;
  staffAbsent: number;
  
  // Leave
  pendingLeaveApplications: number;
  approvedLeavesToday: number;
  
  // Attendance
  attendanceRate: number; // percentage
  averageWorkingHours: number;
  overtimeHoursThisMonth: number;
  
  // Billing
  totalBillsToday: number;
  pendingClaims: number;
  totalRevenueToday: number;
  outstandingPayments: number;
  
  // Insurance claims
  insuranceClaimsProcessing: number;
  insuranceClaimValue: number;
  
  // Bed occupancy
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number; // percentage
  
  // ICU/HDU
  icuBeds: number;
  icuOccupancy: number;
  hduBeds: number;
  hduOccupancy: number;
  
  // Users
  totalUserAccounts: number;
  activeUsers: number;
  lockedAccounts: number;
  
  // Operations
  averageAdmissionTime: number; // minutes
  averageLengthOfStay: number; // days
  dischargesThisMonth: number;
  
  // Financial
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
}

export interface DepartmentPerformance {
  department: string;
  
  // Staffing
  totalStaff: number;
  staffOnDuty: number;
  staffUtilization: number; // percentage
  
  // Workload
  patientsServed: number;
  proceduresCompleted: number;
  averageWaitTime: number;
  
  // Financial
  revenueGenerated: number;
  expensesIncurred: number;
  
  // Quality
  patientSatisfaction?: number; // percentage
  complaintCount: number;
  
  // Efficiency
  resourceUtilization: number; // percentage
  turnaroundTime: number; // minutes
}

export interface FinancialReport {
  id: string;
  reportNumber: string;
  reportDate: Date;
  periodStart: Date;
  periodEnd: Date;
  
  // Revenue breakdown
  consultationRevenue: number;
  procedureRevenue: number;
  medicationRevenue: number;
  laboratoryRevenue: number;
  imagingRevenue: number;
  bedChargeRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  
  // Expense breakdown
  staffCosts: number;
  medicationCosts: number;
  suppliesCosts: number;
  utilitiesCosts: number;
  maintenanceCosts: number;
  otherCosts: number;
  totalExpenses: number;
  
  // Summary
  netProfit: number;
  profitMargin: number; // percentage
  
  // Comparisons
  previousPeriodRevenue?: number;
  revenueGrowth?: number; // percentage
  
  notes?: string;
}

export interface InventoryAlert {
  id: string;
  alertDate: Date;
  alertType: 'low-stock' | 'out-of-stock' | 'near-expiry' | 'expired';
  
  itemCode: string;
  itemName: string;
  department: string;
  
  currentStock?: number;
  reorderLevel?: number;
  expiryDate?: Date;
  
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  actionTaken?: string;
  resolvedBy?: string;
  resolvedDate?: Date;
  
  status: 'open' | 'acknowledged' | 'resolved';
}







