// Core entity types for Malaysian Hospital Pharmacy Counter System

export interface Patient {
  id: string;
  mrn: string;
  nric: string; // Malaysian IC or passport
  name: string;
  dateOfBirth: string;
  age: number;
  gender: 'Male' | 'Female';
  phone: string;
  address: string;
  state: string;
  allergies: string[];
  renalStatus: 'normal' | 'mild' | 'moderate' | 'severe' | 'dialysis';
  hepaticStatus: 'normal' | 'mild' | 'moderate' | 'severe';
  chronicConditions: string[];
}

export interface Medication {
  id: string;
  code: string;
  nameFull: string; // e.g., "Tab. Paracetamol 500 mg"
  genericName: string;
  form: string; // Tablet, Capsule, Syrup, Injection, etc.
  strength: string;
  ddFlag: boolean; // Dangerous Drugs
  psychotropicFlag: boolean;
  coldChainFlag: boolean;
  lasaFlag: boolean; // Look-Alike Sound-Alike
  highAlertFlag: boolean;
  defaultDoseRules: {
    adult?: string;
    pediatric?: string;
    renalAdjustment?: string;
    hepaticAdjustment?: string;
  };
  interactionCodes: string[]; // References to other medication codes
  category: string;
}

export interface PrescriptionItem {
  drugCode: string;
  dose: string;
  frequency: string;
  route: string;
  duration: string;
  quantity: number;
  remarks?: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  prescriberName: string;
  prescriberMmc: string; // Malaysian Medical Council ID
  department: string;
  date: string;
  items: PrescriptionItem[];
  source: 'OPD' | 'Ward' | 'Emergency' | 'Specialist Clinic';
  status: 'new' | 'screening' | 'verified' | 'dispensing' | 'ready' | 'dispensed' | 'collected';
  priority: 'routine' | 'urgent' | 'stat';
  diagnosis?: string;
  screenedBy?: string;
  screenedAt?: string;
  dispensedBy?: string;
  dispensedAt?: string;
  collectedAt?: string;
  totalAmount?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  type: 'Temujanji Farmasi' | 'MTAC' | 'VAS Pickup' | 'Counseling';
  dateTime: string;
  channel: 'counter' | 'drive-thru' | 'locker' | 'post';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface VasOrder {
  id: string;
  patientId: string;
  scheme: 'SPUB' | 'Drive-Through' | 'UMP' | 'Locker4U' | 'Pharmacy Appointment';
  prescriptionId?: string;
  originFacility: string;
  collectFacility: string;
  parcelTracking?: string; // For UMP
  pickupWindow?: string;
  status: 'pending' | 'preparing' | 'ready' | 'collected' | 'delivered';
  lockerNumber?: string; // For Locker4U
  lockerCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpubTransfer {
  id: string;
  patientId: string;
  medicationCode: string;
  originFacility: string;
  destFacility: string;
  prescribedQty: number;
  balance: number;
  nextSupplyDate: string;
  verificationLogs: {
    date: string;
    verifiedBy: string;
    facility: string;
    qtyDispensed: number;
    balance: number;
  }[];
  status: 'active' | 'completed' | 'cancelled';
}

export interface MtacSession {
  id: string;
  clinic: 'DMTAC' | 'WMTAC' | 'Respiratory' | 'Nephrology' | 'Cardiology' | 'Psychiatry';
  patientId: string;
  date: string;
  metrics: {
    HbA1c?: number;
    INR?: number;
    ACT?: number;
    PFT?: string;
    bloodPressure?: string;
    weight?: number;
  };
  adherenceScore: number; // 0-100
  interventions: string[];
  medicationSupplied: {
    drugCode: string;
    quantity: number;
  }[];
  followUpDate?: string;
  notes?: string;
  conductedBy: string;
}

export interface CounselingRecord {
  id: string;
  patientId: string;
  prescriptionId?: string;
  date: string;
  context: 'new-start' | 'high-risk' | 'discharge' | 'device-training' | 'adherence-support';
  topicsCovered: string[];
  teachBackPassed: boolean;
  leafletGiven: boolean;
  followUpDate?: string;
  notes?: string;
  counseledBy: string;
  duration: number; // minutes
}

export interface InventoryItem {
  id: string;
  medicationCode: string;
  facilityId: string;
  onHand: number;
  min: number;
  max: number;
  coldChainLocation?: string;
  expiryBatches: {
    batchNumber: string;
    expiryDate: string;
    quantity: number;
  }[];
  lastUpdated: string;
}

export interface DdRegister {
  id: string;
  date: string;
  medicationCode: string;
  movement: 'receipt' | 'issue' | 'return' | 'disposal' | 'adjustment';
  quantity: number;
  runningBalance: number;
  prescriptionNumber?: string;
  patientMrn?: string;
  witness: string;
  remarks?: string;
  enteredBy: string;
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  type: 'Hospital' | 'Klinik Kesihatan' | 'Klinik Desa';
  state: string;
  address: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'counter-pharmacist' | 'clinical-pharmacist' | 'supervisor' | 'clerk';
  credentialId: string;
  facilityId: string;
  phone: string;
  email: string;
}

export interface DrugInteraction {
  id: string;
  drug1Code: string;
  drug2Code: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  message: {
    en: string;
    bm: string;
  };
  recommendation: {
    en: string;
    bm: string;
  };
}

export interface AdrIncident {
  id: string;
  patientId: string;
  medicationCode: string;
  description: string;
  seriousness: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  reportedTo: string[]; // ['QA', 'research.pharmacy.gov.my']
  date: string;
  status: 'reported' | 'investigating' | 'closed';
  reportedBy: string;
  notes?: string;
}

// Helper types for UI
export interface PrescriptionWithDetails extends Prescription {
  patient: Patient;
  medications: Medication[];
}

export interface AppointmentWithDetails extends Appointment {
  patient: Patient;
}

export interface MtacSessionWithDetails extends MtacSession {
  patient: Patient;
  medications: Medication[];
}

