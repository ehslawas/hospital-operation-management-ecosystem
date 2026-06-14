export type TriageLevel = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
export type PatientStatus = 'incoming' | 'arrived' | 'triaged' | 'waiting' | 'in-assessment' | 'in-treatment' | 'awaiting-admission' | 'admitted' | 'discharged' | 'transferred' | 'left-without-being-seen' | 'deceased';
export type Gender = 'Male' | 'Female';
export type ArrivalMode = 'walk-in' | 'ambulance' | 'police' | 'referral' | 'helicopter';
export type TraumaLevel = 'none' | 'yellow' | 'red' | 'black-tag';
export type DispositionType = 'admit-general' | 'admit-icu' | 'admit-hdu' | 'admit-surgical' | 'discharge-home' | 'discharge-ama' | 'transfer-hospital' | 'deceased' | 'lwbs';

export interface VitalSigns {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  painScore: number;
  gcs?: string; // Glasgow Coma Scale
  recordedAt: Date;
  recordedBy: string;
}

export interface PatientHistory {
  presentingComplaint: string;
  historyOfPresentingComplaint: string;
  pastMedicalHistory: string[];
  pastSurgicalHistory: string[];
  medications: string[];
  allergies: string[];
  socialHistory?: string;
  familyHistory?: string;
}

export interface PhysicalExamination {
  general: string;
  cardiovascular?: string;
  respiratory?: string;
  abdominal?: string;
  neurological?: string;
  musculoskeletal?: string;
  skin?: string;
  other?: string;
  examinedBy: string;
  examinedAt: Date;
}

export interface TraumaActivation {
  activated: boolean;
  level: TraumaLevel;
  activatedAt?: Date;
  activatedBy?: string;
  mechanism: string;
  primarySurveyCompleted?: Date;
  secondarySurveyCompleted?: Date;
  teamLeader?: string;
  traumaSurgeon?: string;
  notes?: string;
}

export interface AmbulanceInfo {
  callTime: Date;
  dispatchTime?: Date;
  arrivalTime?: Date;
  eta?: Date;
  ambulanceId: string;
  paramedic: string;
  mechanism?: string;
  preHospitalVitals?: Partial<VitalSigns>;
  preHospitalTreatment?: string;
  estimatedInjuries?: string;
}

export interface EmergencyPatient {
  id: string;
  registrationNumber: string;
  name: string;
  age: number;
  gender: Gender;
  icNumber: string;
  contactNumber: string;
  nextOfKin?: string;
  nextOfKinContact?: string;
  address?: string;
  
  // Arrival
  arrivalMode: ArrivalMode;
  arrivalTime: Date;
  ambulanceInfo?: AmbulanceInfo;
  
  // Triage
  triageLevel: TriageLevel;
  chiefComplaint: string;
  triageTime?: Date;
  triageNurse?: string;
  triageNotes?: string;
  
  // Trauma
  trauma: TraumaActivation;
  
  // Status
  status: PatientStatus;
  assignedBed?: string;
  assignedDoctor?: string;
  assignedNurse?: string;
  
  // Clinical Documentation
  vitals: VitalSigns[];
  history?: PatientHistory;
  examination?: PhysicalExamination;
  
  // Assessment & Plan
  assessmentNotes?: string;
  differentialDiagnosis?: string[];
  finalDiagnosis?: string;
  treatmentPlan?: string;
  clinicalNotes?: ClinicalNote[];
  
  // Orders
  labOrders: LabOrder[];
  radiologyOrders: RadiologyOrder[];
  pharmacyOrders: PharmacyOrder[];
  
  // Disposition
  disposition?: DispositionInfo;
  
  // Audit Trail
  timeline: TimelineEvent[];
}

export interface ClinicalNote {
  id: string;
  timestamp: Date;
  author: string;
  type: 'assessment' | 'progress' | 'procedure' | 'consultation' | 'other';
  content: string;
}

export interface DispositionInfo {
  type: DispositionType;
  decidedAt: Date;
  decidedBy: string;
  destination?: string; // Ward name or hospital name
  admittingDepartment?: string;
  admittingDoctor?: string;
  dischargeInstructions?: string;
  followUpInstructions?: string;
  prescriptions?: string[];
  medicalCertificateDays?: number;
  completedAt?: Date;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'arrival' | 'triage' | 'bed-assigned' | 'doctor-assigned' | 'vitals' | 'order-placed' | 'order-completed' | 'medication-given' | 'procedure' | 'consult' | 'disposition' | 'transfer' | 'discharge' | 'trauma-activation' | 'note';
  description: string;
  actor: string;
  details?: any;
}

export interface LabOrder {
  id: string;
  patientId: string;
  testName: string;
  priority: 'routine' | 'urgent' | 'stat';
  orderedBy: string;
  orderedAt: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  results?: string;
  completedAt?: Date;
}

export interface RadiologyOrder {
  id: string;
  patientId: string;
  examType: string;
  bodyPart: string;
  priority: 'routine' | 'urgent' | 'stat';
  clinicalIndication: string;
  orderedBy: string;
  orderedAt: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  findings?: string;
  completedAt?: Date;
}

export interface PharmacyOrder {
  id: string;
  patientId: string;
  medication: string;
  dosage: string;
  route: string;
  frequency: string;
  orderedBy: string;
  orderedAt: Date;
  status: 'pending' | 'dispensed' | 'administered' | 'cancelled';
  administeredAt?: Date;
}

export interface EmergencyBed {
  id: string;
  roomNumber: string;
  bedNumber: string;
  zone: 'Resuscitation' | 'Major' | 'Minor' | 'Observation';
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  patientId?: string;
  assignedAt?: Date;
}

export interface TriageStats {
  total: number;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5: number;
  averageWaitTime: number;
  longestWaitTime: number;
}

// Reporting Interfaces
export interface DepartmentMetrics {
  totalPatients: number;
  currentInDepartment: number;
  admitted: number;
  discharged: number;
  transferred: number;
  lwbs: number;
  deceased: number;
  averageWaitTime: number;
  averageLengthOfStay: number;
  bedOccupancy: number;
  traumaActivations: number;
}

export interface WaitTimeMetrics {
  triageWaitTime: { avg: number; median: number; p95: number };
  doctorWaitTime: { avg: number; median: number; p95: number };
  dispositionWaitTime: { avg: number; median: number; p95: number };
  totalLOS: { avg: number; median: number; p95: number };
}

export interface AmbulanceMetrics {
  totalCalls: number;
  averageResponseTime: number;
  averageOnSceneTime: number;
  averageTransportTime: number;
  activeCases: number;
}

export interface IncomingPatient {
  id: string;
  eta: Date;
  ambulanceId: string;
  chiefComplaint: string;
  triageLevel: TriageLevel;
  age: number;
  gender: Gender;
  mechanism?: string;
  vitals?: Partial<VitalSigns>;
  specialInstructions?: string;
}





