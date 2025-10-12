export type TestCategory = 'Haematology' | 'Clinical Chemistry' | 'Microbiology' | 'Immunology' | 'Blood Bank' | 'Histopathology';
export type TestPriority = 'routine' | 'urgent' | 'stat';
export type TestStatus = 'pending' | 'collected' | 'processing' | 'analyzing' | 'validating' | 'completed' | 'rejected';
export type SampleType = 'Blood' | 'Urine' | 'Serum' | 'Plasma' | 'CSF' | 'Stool' | 'Sputum' | 'Swab' | 'Tissue';
export type ResultStatus = 'pending' | 'preliminary' | 'final' | 'amended' | 'critical';

export interface TestOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female';
  patientIC: string;
  
  // Order details
  testName: string;
  testCode: string;
  category: TestCategory;
  priority: TestPriority;
  status: TestStatus;
  
  // Ordering info
  orderingDepartment: string;
  orderingDoctor: string;
  orderedAt: Date;
  clinicalNotes?: string;
  
  // Sample info
  sampleType: SampleType;
  sampleId?: string;
  collectedAt?: Date;
  collectedBy?: string;
  
  // Processing
  receivedAt?: Date;
  receivedBy?: string;
  analyzedAt?: Date;
  analyzedBy?: string;
  
  // Results
  result?: TestResult;
  validatedAt?: Date;
  validatedBy?: string;
  reportedAt?: Date;
  
  // Flags
  isCritical?: boolean;
  isRepeated?: boolean;
  rejectionReason?: string;
}

export interface TestResult {
  testId: string;
  parameters: ResultParameter[];
  interpretation?: string;
  comments?: string;
  status: ResultStatus;
  enteredBy: string;
  enteredAt: Date;
}

export interface ResultParameter {
  name: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  flag?: 'low' | 'high' | 'critical' | 'normal';
}

export interface Sample {
  id: string;
  barcode: string;
  patientId: string;
  patientName: string;
  type: SampleType;
  collectedAt: Date;
  collectedBy: string;
  receivedAt?: Date;
  status: 'collected' | 'received' | 'processing' | 'stored' | 'discarded';
  linkedTests: string[]; // Test order IDs
  volume?: string;
  containerType?: string;
  storageLocation?: string;
  expiryDate?: Date;
}

export interface QualityControl {
  id: string;
  testName: string;
  category: TestCategory;
  controlLevel: 'Level 1' | 'Level 2' | 'Level 3';
  date: Date;
  performedBy: string;
  
  measurements: QCMeasurement[];
  mean: number;
  sd: number;
  cv: number;
  
  isAcceptable: boolean;
  comments?: string;
}

export interface QCMeasurement {
  parameter: string;
  value: number;
  expectedValue: number;
  acceptableRange: string;
  isInRange: boolean;
}

export interface LabStats {
  totalOrders: number;
  pending: number;
  inProgress: number;
  completed: number;
  critical: number;
  avgTurnaroundTime: number; // in minutes
  longestWaitingOrder: number; // in minutes
  todayCompleted: number;
  todayPending: number;
}

export interface LabEquipment {
  id: string;
  name: string;
  model: string;
  category: TestCategory;
  status: 'operational' | 'maintenance' | 'down' | 'calibration';
  location: string;
  lastMaintenance: Date;
  nextMaintenance: Date;
  currentLoad: number;
  maxCapacity: number;
}







