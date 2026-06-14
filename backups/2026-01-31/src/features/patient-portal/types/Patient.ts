// Patient Portal Types

export interface PatientAuth {
  id: string;
  mrn: string;
  nric: string;
  name: string;
  dob: Date;
  gender: string;
  phone: string | null;
  email: string | null;
  allergies: string[];
  isPortalActive: boolean;
  portalLanguage: 'en' | 'ms';
}

export interface PatientLoginCredentials {
  nric: string;
  pin?: string;
  password?: string;
  dob?: string;
}

export interface PatientSession {
  patient: PatientAuth;
  token: string;
  expiresAt: Date;
}

export interface PatientMedication {
  id: string;
  medicationName: string;
  genericName: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  indication: string;
  prescribedBy: string;
  specialInstructions?: string;
  lastRefillDate?: Date;
  nextRefillDate?: Date;
}

export interface PatientVitalSigns {
  id: string;
  recordedAt: Date;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  oxygenSaturation?: number;
  recordedBy: string;
}

export interface PatientLabResult {
  id: string;
  testName: string;
  testDate: Date;
  result: string;
  unit?: string;
  referenceRange?: string;
  status: 'normal' | 'abnormal' | 'critical';
  orderedBy: string;
  notes?: string;
}

export interface PatientVisit {
  id: string;
  visitDate: Date;
  department: string;
  doctorName: string;
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan?: string;
  followUpDate?: Date;
  status: 'completed' | 'ongoing' | 'scheduled';
}

export interface PatientHealthSummary {
  patient: PatientAuth;
  chronicConditions: string[];
  currentMedications: PatientMedication[];
  recentVitals: PatientVitalSigns | null;
  recentLabResults: PatientLabResult[];
  recentVisits: PatientVisit[];
  lastVisit: PatientVisit | null;
}

export interface PatientPortalAccess {
  id: string;
  patientId: string;
  accessType: string;
  accessedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
}

export interface PatientSharedRecord {
  id: string;
  patientId: string;
  shareToken: string;
  sharedAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessedAt?: Date;
  isActive: boolean;
  includedData: string[];
}

