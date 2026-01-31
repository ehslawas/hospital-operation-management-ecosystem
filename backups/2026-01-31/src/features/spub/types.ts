// SPUB (Integrated Dispensing System) Types

export type RequestStatus = 'pending' | 'sent' | 'acknowledged' | 'processing' | 'ready' | 'completed' | 'cancelled';
export type ReceiveStatus = 'pending' | 'partial' | 'completed' | 'discrepancy';
export type DispenseStatus = 'scheduled' | 'ready' | 'dispensed' | 'missed' | 'cancelled';

export interface Patient {
  id: string;
  nric: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  contactNumber: string;
  email?: string;
  address: string;
  homeClinic: string;
  homeFacilityCode: string;
  chronicConditions: string[];
  allergies: string[];
}

export interface Medication {
  id: string;
  drugCode: string;
  drugName: string;
  strength: string;
  form: string;
  quantity: number;
  unit: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: number; // in days
  instructions: string;
}

export interface SPUBRequest {
  id: string;
  requestNumber: string;
  patientId: string;
  patient: Patient;
  medications: Medication[];
  requestDate: string;
  requestedBy: string;
  targetFacility: string;
  targetFacilityCode: string;
  status: RequestStatus;
  expectedStartDate: string;
  totalItems: number;
  priority: 'routine' | 'urgent' | 'emergency';
  notes?: string;
  emailSentDate?: string;
  acknowledgementDate?: string;
}

export interface ReceivedMedication {
  medicationId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  batchNumber: string;
  expiryDate: string;
  receivedDate?: string;
  receivedBy?: string;
  status: ReceiveStatus;
  discrepancyReason?: string;
}

export interface SPUBReceive {
  id: string;
  requestId: string;
  receiveNumber: string;
  requestNumber: string;
  patient: Patient;
  medications: ReceivedMedication[];
  receivedDate?: string;
  receivedBy?: string;
  status: ReceiveStatus;
  sourceFacility: string;
  totalItemsExpected: number;
  totalItemsReceived: number;
  notes?: string;
  discrepancies: boolean;
}

export interface DispenseRecord {
  id: string;
  requestId: string;
  patientId: string;
  patient: Patient;
  medications: Medication[];
  scheduledDate: string;
  dispensedDate?: string;
  dispensedBy?: string;
  status: DispenseStatus;
  counselingCompleted: boolean;
  patientSignature?: string;
  notes?: string;
  nextVisitDate?: string;
}

export interface MedicationBalance {
  id: string;
  patientId: string;
  patientName: string;
  medicationId: string;
  drugName: string;
  strength: string;
  totalReceived: number;
  totalDispensed: number;
  balance: number;
  unit: string;
  lastDispensedDate?: string;
  nextScheduledDate?: string;
  status: 'adequate' | 'low' | 'critical' | 'expired';
  expiryDate: string;
}

export interface SPUBStatistics {
  totalActivePatients: number;
  pendingRequests: number;
  awaitingReceipt: number;
  readyToDispense: number;
  lowStockAlerts: number;
  dispensedThisMonth: number;
  requestsThisMonth: number;
  averageProcessingTime: number; // in days
}





