// In-Patient Pharmacy Data Types

export type SupplyModel = 'UOD' | 'UOU' | 'Imprest' | 'STAT';
export type OrderStatus = 'pending' | 'screening' | 'verified' | 'issued' | 'completed';
export type ScreeningOutcome = 'approved' | 'clarify' | 'alternative';
export type UserRole = 
  | 'ward_clinical_pharmacist' 
  | 'dispensing_pharmacist' 
  | 'technician' 
  | 'qa_safety' 
  | 'oncall_pharmacist' 
  | 'admin';

// Patient & Clinical
export interface Patient {
  id: string;
  mrn: string;
  name: string;
  nric: string;
  dob: string;
  age: number;
  sex: 'M' | 'F';
  wardId: string;
  wardName: string;
  bed: string;
  weight: number;
  height: number;
  bmi: number;
  allergies: string[];
  pregnancyStatus?: string;
  renalFunction: {
    scr: number;
    crCl: number;
    egfr: number;
  };
  hepaticFlags: string[];
  admitDateTime: string;
  diagnosis: string[];
  attendingMO: string;
}

// Medication Reconciliation
export interface HomeMedication {
  id: string;
  drugId: string;
  drugName: string;
  strength: string;
  form: string;
  dose: string;
  frequency: string;
  route: string;
  indication?: string;
  lastDose?: string;
}

export interface MedRecDiscrepancy {
  id: string;
  type: 'intentional' | 'unintentional';
  description: string;
  homeMed?: string;
  inpatientOrder?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

export interface MedRec {
  id: string;
  patientId: string;
  admissionId: string;
  sources: string[];
  homeMeds: HomeMedication[];
  discrepancies: MedRecDiscrepancy[];
  completedBy?: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// Orders
export interface Order {
  id: string;
  patientId: string;
  prescriberId: string;
  prescriberName: string;
  drugId: string;
  drugName: string;
  strength: string;
  form: string;
  dose: string;
  frequency: string;
  route: string;
  startDate: string;
  stopDate?: string;
  indication?: string;
  prnRules?: string;
  statFlag: boolean;
  notes?: string;
  status: OrderStatus;
  supplyModel?: SupplyModel;
  hamFlag: boolean;
  coldChain: boolean;
  cdFlag: boolean;
}

export interface ScreeningCheck {
  type: string;
  status: 'pass' | 'warning' | 'fail';
  note?: string;
}

export interface OrderScreening {
  id: string;
  orderId: string;
  pharmacistId: string;
  pharmacistName: string;
  checks: ScreeningCheck[];
  outcome: ScreeningOutcome;
  supplyModel: SupplyModel;
  alternativeDrug?: string;
  notes?: string;
  timestamp: string;
}

// UOD (Unit of Dose)
export interface UODSchedule {
  adminTime: string;
  doseLabel: string;
  status: 'pending' | 'picked' | 'checked' | 'administered';
  administeredBy?: string;
  administeredAt?: string;
}

export interface UODPack {
  id: string;
  orderId: string;
  patientId: string;
  schedule: UODSchedule[];
  labelData: {
    patientName: string;
    mrn: string;
    ward: string;
    bed: string;
    drugName: string;
    strength: string;
    dose: string;
    route: string;
  };
  pickerId?: string;
  checkerId?: string;
  createdAt: string;
}

// UOU (Unit of Use)
export interface UOUIssue {
  id: string;
  orderId: string;
  patientId: string;
  drugId: string;
  drugName: string;
  packId: string;
  lot: string;
  expiry: string;
  qtyIssued: number;
  labelData: {
    patientName: string;
    mrn: string;
    ward: string;
    instructions: string;
  };
  issuedBy: string;
  issuedAt: string;
}

// Imprest/Ward Stock
export interface ImprestItem {
  id: string;
  wardId: string;
  drugId: string;
  drugName: string;
  parLevel: number;
  currentQty: number;
  unit: string;
}

export interface ImprestTransaction {
  id: string;
  itemId: string;
  type: 'topup' | 'outflow' | 'wastage' | 'return';
  qty: number;
  reason: string;
  byUser: string;
  timestamp: string;
}

// STAT Issue
export interface STATIssue {
  id: string;
  patientId: string;
  drugId: string;
  drugName: string;
  qty: number;
  time: string;
  reason: string;
  byUser: string;
}

// TTO/Discharge
export interface DischargePlanItem {
  orderId?: string;
  drugId: string;
  drugName: string;
  strength: string;
  form: string;
  dose: string;
  frequency: string;
  route: string;
  qty: number;
  duration: string;
  instructions: string;
}

export interface DischargePlan {
  id: string;
  patientId: string;
  items: DischargePlanItem[];
  status: 'pending' | 'preparing' | 'ready' | 'counseled' | 'delivered';
  orderedAt: string;
  readyAt?: string;
  counseledAt?: string;
  deliveredAt?: string;
  preparedBy?: string;
  counseledBy?: string;
}

export interface CounselingRecord {
  id: string;
  dischargePlanId: string;
  patientId: string;
  topics: string[];
  teachBackScore: number;
  comprehensionNotes: string;
  leafletsGiven: string[];
  counselorId: string;
  counselorName: string;
  patientSignature?: string;
  counseledAt: string;
}

// TDM (Therapeutic Drug Monitoring)
export interface TDMLevel {
  samplingTime: string;
  level: number;
  unit: string;
  notes?: string;
}

export interface TDMCase {
  id: string;
  patientId: string;
  drug: string;
  drugId: string;
  targetRange: {
    min: number;
    max: number;
    unit: string;
  };
  renalFunction: {
    scr: number;
    crCl: number;
  };
  albumin?: number;
  samplingPlan: string[];
  levels: TDMLevel[];
  calcMethod: 'AUC' | 'Peak/Trough' | 'Sheiner-Tozer';
  recommendedDose?: string;
  nextLevelAt?: string;
  pharmacistId: string;
  pharmacistName: string;
  createdAt: string;
  updatedAt: string;
}

// AMS (Antimicrobial Stewardship)
export interface CultureResult {
  specimen: string;
  organism: string;
  sensitivity: Record<string, string>;
  collectedAt: string;
}

export interface AMSReview {
  id: string;
  patientId: string;
  antibiotics: {
    drugName: string;
    startDate: string;
    duration: number;
    route: string;
  }[];
  cultureResults: CultureResult[];
  ivToPoEligible: boolean;
  deEscalationSuggestion?: string;
  durationStopDate?: string;
  reviewerId: string;
  reviewerName: string;
  reviewedAt: string;
  decision?: string;
}

// Controlled Drugs
export interface CDRegisterEntry {
  id: string;
  txnType: 'receipt' | 'issue' | 'return' | 'wastage' | 'destruction';
  patientId?: string;
  patientName?: string;
  drugId: string;
  drugName: string;
  qty: number;
  lot: string;
  expiry: string;
  runningBalance: number;
  witnessId: string;
  witnessName: string;
  userId: string;
  userName: string;
  notes?: string;
  timestamp: string;
}

// Temperature Log
export interface TempLog {
  id: string;
  locationId: string;
  locationName: string;
  minTemp: number;
  maxTemp: number;
  timestamp: string;
  excursionFlag: boolean;
  actionTaken?: string;
}

// Incident
export interface Incident {
  id: string;
  type: 'ME' | 'ADR' | 'NM';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  patientId?: string;
  drugId?: string;
  description: string;
  actions: string;
  reportedBy: string;
  reportedAt: string;
  status: 'Open' | 'Under Investigation' | 'Resolved';
}

// Reference Data
export interface Drug {
  id: string;
  generic: string;
  brand?: string;
  form: string;
  strength: string;
  atc: string;
  lasaGroup?: string;
  hamFlag: boolean;
  coldChain: boolean;
  cdFlag: boolean;
  psychotropic: boolean;
  storage: 'ambient' | 'cold' | 'frozen';
  ivCompat: string[];
  defaultDoseRules?: {
    adult?: string;
    paeds?: string;
    renal?: string;
  };
  amsFlag: boolean;
  tdmFlag: boolean;
}

export interface Ward {
  id: string;
  name: string;
  unitType: 'ICU' | 'Medical' | 'Surgical' | 'Paediatric' | 'Maternity' | 'NICU';
  beds: number;
  imprestProfileId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  licenseNo?: string;
  contact: string;
  signatureImg?: string;
}

export interface AuditTrail {
  id: string;
  entity: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'void';
  before?: any;
  after?: any;
  userId: string;
  userName: string;
  role: UserRole;
  ip: string;
  device: string;
  timestamp: string;
}

