export type PatientStatus = 'admitted' | 'stable' | 'critical' | 'observation' | 'pending-discharge' | 'discharged';
export type AdmissionType = 'emergency' | 'elective' | 'transfer';
export type IsolationType = 'none' | 'contact' | 'droplet' | 'airborne' | 'contact-droplet';

export interface WardPatient {
  id: string;
  registrationNumber: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  icNumber: string;
  contactNumber: string;
  
  // Admission
  admissionDate: Date;
  admissionType: AdmissionType;
  admissionDiagnosis: string;
  status: PatientStatus;
  
  // Location
  bedNumber: string;
  wardRoom: string;
  
  // Clinical
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  allergies: string[];
  codeStatus: 'Full Code' | 'DNR' | 'DNI';
  isolationPrecautions: IsolationType;
  
  // Care team
  attendingPhysician: string;
  consultingSpecialists: string[];
  assignedNurse: string;
  
  // Vitals
  vitals: VitalSigns[];
  
  // Notes
  nursingNotes: NursingNote[];
  
  // Orders
  medications: MedicationOrder[];
  dietOrder: string;
  activityOrder: string;
  
  // Discharge planning
  estimatedDischargeDate?: Date;
  dischargeInstructions?: string;
  dischargedAt?: Date;
}

export interface VitalSigns {
  id: string;
  patientId: string;
  recordedAt: Date;
  recordedBy: string;
  
  temperature: number; // Celsius
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  painScore: number; // 0-10
  
  supplementalO2?: string;
  consciousnessLevel: 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive';
  
  notes?: string;
}

export interface NursingNote {
  id: string;
  patientId: string;
  createdAt: Date;
  createdBy: string;
  shift: 'morning' | 'afternoon' | 'night';
  
  category: 'assessment' | 'intervention' | 'progress' | 'incident' | 'handover';
  note: string;
  
  // Assessment components
  subjective?: string; // What patient reports
  objective?: string; // Observable findings
  assessment?: string; // Clinical judgment
  plan?: string; // Nursing plan
}

export interface MedicationOrder {
  id: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  route: 'PO' | 'IV' | 'IM' | 'SC' | 'Topical' | 'Inhalation';
  frequency: string;
  
  startDate: Date;
  endDate?: Date;
  
  indication: string;
  orderedBy: string;
  
  // Administration record
  administrations: MedicationAdministration[];
  
  // Flags
  isPRN: boolean;
  isHighAlert: boolean;
  requiresDoubleCheck: boolean;
}

export interface MedicationAdministration {
  id: string;
  medicationOrderId: string;
  scheduledTime: Date;
  administeredAt?: Date;
  administeredBy?: string;
  dosageGiven: string;
  route: string;
  
  status: 'scheduled' | 'given' | 'held' | 'refused' | 'missed';
  reasonHeld?: string;
  patientResponse?: string;
  
  vitalsSigns?: {
    bp?: string;
    hr?: number;
  };
}

export interface WardBed {
  id: string;
  bedNumber: string;
  roomNumber: string;
  zone: 'A' | 'B' | 'C' | 'Isolation';
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
  patientId?: string;
  admittedAt?: Date;
  
  // Bed features
  hasOxygen: boolean;
  hasSuction: boolean;
  hasMonitor: boolean;
  isIsolation: boolean;
}

export interface WardRound {
  id: string;
  date: Date;
  conductor: string;
  participants: string[];
  
  patientReviews: PatientReview[];
  
  startTime: Date;
  endTime?: Date;
}

export interface PatientReview {
  patientId: string;
  patientName: string;
  reviewTime: Date;
  
  chiefConcerns: string[];
  physicalExam: string;
  planOfCare: string;
  ordersGiven: string[];
  
  consultationRequested?: string;
  reviewedBy: string;
}

export interface WardStats {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  
  totalPatients: number;
  newAdmissions: number;
  pendingDischarges: number;
  criticalPatients: number;
  
  isolationBeds: number;
  averageLengthOfStay: number; // days
}

export interface HandoverReport {
  id: string;
  date: Date;
  shift: 'morning' | 'afternoon' | 'night';
  outgoingNurse: string;
  incomingNurse: string;
  
  patientSummaries: PatientHandover[];
  
  generalNotes?: string;
  tasksHandedOver: string[];
}

export interface PatientHandover {
  patientId: string;
  patientName: string;
  bedNumber: string;
  
  diagnosis: string;
  keyIssues: string[];
  pendingTasks: string[];
  alerts: string[];
  
  lastVitals: {
    time: Date;
    bp: string;
    hr: number;
    temp: number;
  };
}










