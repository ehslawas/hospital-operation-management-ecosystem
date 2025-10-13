export type ImagingModality = 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound' | 'Mammography' | 'Fluoroscopy';
export type OrderStatus = 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'reported';
export type OrderPriority = 'routine' | 'urgent' | 'stat' | 'emergency';
export type StudyStatus = 'scheduled' | 'arrived' | 'in-progress' | 'completed' | 'preliminary' | 'final';
export type ReportStatus = 'draft' | 'preliminary' | 'final' | 'amended' | 'signed';
export type EquipmentStatus = 'operational' | 'maintenance' | 'offline' | 'calibration';

export interface ImagingOrder {
  id: string;
  orderNumber: string;
  orderDate: Date;
  
  // Patient information
  patientName: string;
  patientIC: string;
  patientMRN: string; // Medical Record Number
  dateOfBirth: Date;
  age: number;
  gender: 'Male' | 'Female';
  
  // Order details
  modality: ImagingModality;
  studyType: string;
  bodyPart: string;
  laterality?: 'Left' | 'Right' | 'Bilateral';
  
  // Clinical info
  clinicalHistory: string;
  clinicalIndication: string;
  priorStudies?: string[];
  
  // Ordering info
  orderingDepartment: string;
  orderingPhysician: string;
  
  // Scheduling
  priority: OrderPriority;
  requestedDate?: Date;
  scheduledDate?: Date;
  scheduledTime?: string;
  
  // Status
  status: OrderStatus;
  
  // Technologist
  performedBy?: string;
  performedAt?: Date;
  
  // Special requirements
  contrast: boolean;
  contrastType?: string;
  sedation: boolean;
  isolation: boolean;
  portable: boolean;
  
  // Pregnancy check (for females of childbearing age)
  pregnancyScreening?: boolean;
  pregnancyStatus?: 'negative' | 'positive' | 'unknown';
  
  notes?: string;
}

export interface DICOMStudy {
  id: string;
  studyInstanceUID: string; // DICOM unique identifier
  accessionNumber: string;
  
  orderId: string;
  patientName: string;
  patientMRN: string;
  
  modality: ImagingModality;
  studyDescription: string;
  bodyPart: string;
  
  studyDate: Date;
  studyTime: string;
  
  // Series information
  numberOfSeries: number;
  numberOfImages: number;
  
  // Technical details
  performingTechnologist: string;
  equipment: string;
  
  // Image quality
  imageQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'repeat-required';
  technicalNotes?: string;
  
  // Status
  status: StudyStatus;
  
  // File info
  storageLocation: string;
  fileSize: number; // in MB
  
  // QA
  qaApproved: boolean;
  qaBy?: string;
  qaDate?: Date;
}

export interface RadiologyReport {
  id: string;
  reportNumber: string;
  
  studyId: string;
  orderId: string;
  accessionNumber: string;
  
  patientName: string;
  patientMRN: string;
  
  modality: ImagingModality;
  studyDescription: string;
  
  // Report content
  indication: string;
  technique: string;
  comparison?: string;
  findings: string;
  impression: string;
  recommendations?: string;
  
  // Critical findings
  criticalFinding: boolean;
  criticalNotes?: string;
  criticalNotifiedTo?: string;
  criticalNotifiedAt?: Date;
  
  // Reporting radiologist
  reportedBy: string;
  reportDate: Date;
  
  // Review and approval
  reviewedBy?: string;
  reviewDate?: Date;
  
  status: ReportStatus;
  
  // Addendum
  hasAddendum: boolean;
  addendumText?: string;
  addendumDate?: Date;
  
  // Communication
  notifiedToReferrer: boolean;
  notifiedAt?: Date;
  
  // Templates and structured reporting
  templateUsed?: string;
  structuredFindings?: Record<string, any>;
}

export interface RadiologyEquipment {
  id: string;
  equipmentName: string;
  modality: ImagingModality;
  manufacturer: string;
  model: string;
  serialNumber: string;
  
  location: string;
  room: string;
  
  status: EquipmentStatus;
  
  // Usage tracking
  totalStudiesToday: number;
  totalStudiesThisWeek: number;
  totalStudiesThisMonth: number;
  
  // Maintenance
  lastMaintenanceDate: Date;
  nextMaintenanceDate: Date;
  maintenanceInterval: number; // days
  
  lastCalibrationDate: Date;
  nextCalibrationDate: Date;
  
  // Current status
  currentlyInUse: boolean;
  currentStudy?: string;
  estimatedCompletionTime?: Date;
  
  // Issues
  hasIssues: boolean;
  issues?: string[];
  reportedBy?: string;
  reportedAt?: Date;
  
  notes?: string;
}

export interface RadiologyStats {
  // Today's workload
  totalOrdersToday: number;
  pendingOrders: number;
  completedStudies: number;
  pendingReports: number;
  
  // By priority
  statOrders: number;
  urgentOrders: number;
  routineOrders: number;
  
  // By modality
  xrayStudies: number;
  ctStudies: number;
  mriStudies: number;
  ultrasoundStudies: number;
  
  // Performance metrics
  averageReportingTime: number; // minutes
  averageStudyDuration: number; // minutes
  
  // Critical findings
  criticalFindingsToday: number;
  
  // Equipment
  equipmentOperational: number;
  equipmentOffline: number;
  
  // Quality
  repeatRate: number; // percentage
  
  // Capacity
  capacityUtilization: number; // percentage
  estimatedWaitTime: number; // minutes
}

export interface Radiologist {
  id: string;
  name: string;
  designation: string;
  specialization: string[];
  
  onDuty: boolean;
  availableForReporting: boolean;
  
  // Today's workload
  studiesReportedToday: number;
  pendingReports: number;
  
  contactNumber: string;
}

export interface ImagingProtocol {
  id: string;
  name: string;
  modality: ImagingModality;
  bodyPart: string;
  
  description: string;
  indications: string[];
  contraindications: string[];
  
  preparation: string[];
  contrastRequired: boolean;
  sedationRequired: boolean;
  
  estimatedDuration: number; // minutes
  radiationDose?: string;
  
  specialInstructions?: string;
}








