export type PrescriptionStatus = 'pending' | 'verified' | 'in-progress' | 'ready' | 'dispensed' | 'cancelled';
export type PrescriptionType = 'new' | 'refill' | 'stat' | 'discharge';
export type PaymentMethod = 'cash' | 'insurance' | 'panel' | 'government' | 'free';
export type InteractionSeverity = 'minor' | 'moderate' | 'major' | 'contraindicated';
export type CounselingStatus = 'required' | 'in-progress' | 'completed' | 'waived';

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  prescriptionDate: Date;
  
  // Patient information
  patientName: string;
  patientIC: string;
  patientMRN: string;
  dateOfBirth: Date;
  age: number;
  gender: 'Male' | 'Female';
  contactNumber: string;
  
  // Prescriber information
  prescribedBy: string;
  prescriberLicenseNo: string;
  department: string;
  
  // Prescription details
  type: PrescriptionType;
  priority: 'routine' | 'urgent' | 'stat';
  status: PrescriptionStatus;
  
  // Medications
  medications: PrescribedMedication[];
  
  // Clinical info
  diagnosis: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  
  // Verification
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  
  // Dispensing
  dispensedBy?: string;
  dispensedAt?: Date;
  dispensingNotes?: string;
  
  // Counseling
  counselingStatus: CounselingStatus;
  counseledBy?: string;
  counseledAt?: Date;
  counselingNotes?: string;
  
  // Payment
  paymentMethod: PaymentMethod;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  totalAmount: number;
  copayAmount?: number;
  paidAmount?: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'waived';
  
  // Queue
  queueNumber?: string;
  receivedAt: Date;
  estimatedWaitTime?: number; // minutes
  
  // Interactions and alerts
  hasInteractions: boolean;
  interactions?: DrugInteraction[];
  hasAllergies: boolean;
  allergyAlerts?: string[];
  hasDuplicateTherapy: boolean;
  duplicateAlerts?: string[];
  
  // Follow-up
  requiresFollowUp: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
  
  notes?: string;
}

export interface PrescribedMedication {
  id: string;
  drugName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  
  // Prescription instructions
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  quantity: number;
  
  // Dispensing
  substitutable: boolean;
  substitute?: string;
  batchNumber?: string;
  expiryDate?: Date;
  
  // Special instructions
  beforeMeals: boolean;
  afterMeals: boolean;
  withFood: boolean;
  specialInstructions?: string;
  
  // Flags
  isControlled: boolean;
  isHighAlert: boolean;
  requiresCounseling: boolean;
  
  // Stock
  inStock: boolean;
  availableQuantity?: number;
  
  // Pricing
  unitPrice: number;
  totalPrice: number;
  subsidized: boolean;
}

export interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: InteractionSeverity;
  description: string;
  clinicalEffect: string;
  recommendation: string;
  override: boolean;
  overrideReason?: string;
  overrideBy?: string;
}

export interface DispensingRecord {
  id: string;
  prescriptionId: string;
  prescriptionNumber: string;
  
  patientName: string;
  patientMRN: string;
  
  dispensedBy: string;
  dispensedAt: Date;
  
  medications: DispensingItem[];
  
  totalAmount: number;
  paymentMethod: PaymentMethod;
  
  counselingProvided: boolean;
  patientSignature: boolean;
  
  notes?: string;
}

export interface DispensingItem {
  drugName: string;
  strength: string;
  quantity: number;
  batchNumber: string;
  expiryDate: Date;
  instructions: string;
}

export interface PharmacyCounterStats {
  // Today's workload
  totalPrescriptionsToday: number;
  pendingPrescriptions: number;
  dispensedPrescriptions: number;
  
  // By priority
  statPrescriptions: number;
  urgentPrescriptions: number;
  routinePrescriptions: number;
  
  // Queue
  currentQueueSize: number;
  averageWaitTime: number;
  longestWaitTime: number;
  
  // Clinical interventions
  interactionsCaught: number;
  allergiesPrevented: number;
  duplicateTherapyDetected: number;
  
  // Counseling
  counselingSessionsToday: number;
  averageCounselingTime: number;
  
  // Financial
  totalRevenueToday: number;
  insuranceClaimsToday: number;
  
  // Efficiency
  averageDispensingTime: number;
  prescriptionsPerHour: number;
  
  // Stock issues
  outOfStockItems: number;
  nearExpiryAlerts: number;
}

export interface Pharmacist {
  id: string;
  name: string;
  registrationNumber: string;
  specialization?: string[];
  
  onDuty: boolean;
  availableForDispensing: boolean;
  
  // Today's workload
  prescriptionsDispensedToday: number;
  counselingSessionsToday: number;
  pendingPrescriptions: number;
  
  // Counter assignment
  counterNumber?: string;
  
  contactNumber: string;
}

export interface MedicationLabel {
  patientName: string;
  patientIC: string;
  
  drugName: string;
  strength: string;
  quantity: number;
  
  instructions: string;
  warnings: string[];
  
  prescribedBy: string;
  dispensedBy: string;
  dispensedDate: Date;
  
  batchNumber: string;
  expiryDate: Date;
  
  prescriptionNumber: string;
}

export interface PatientMedicationRecord {
  patientMRN: string;
  patientName: string;
  
  // Medication history
  prescriptions: Prescription[];
  lastDispensedDate?: Date;
  
  // Clinical profile
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  
  // Adherence
  adherenceRate: number; // percentage
  missedRefills: number;
  
  // Interactions history
  pastInteractions: DrugInteraction[];
  
  // Counseling history
  totalCounselingSessions: number;
  lastCounselingDate?: Date;
}







