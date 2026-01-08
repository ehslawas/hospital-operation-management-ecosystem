export type DialysisSchedule = 'Monday-Wednesday-Friday' | 'Tuesday-Thursday-Saturday' | 'Daily';
export type SessionStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'missed';
export type MachineStatus = 'available' | 'in-use' | 'maintenance' | 'offline' | 'disinfecting';
export type AccessType = 'AVF' | 'AVG' | 'catheter' | 'permcath';
export type DialysisAdequacy = 'adequate' | 'inadequate' | 'borderline';

export interface DialysisPatient {
  id: string;
  patientMRN: string;
  patientName: string;
  patientIC: string;
  dateOfBirth: Date;
  age: number;
  gender: 'Male' | 'Female';
  contactNumber: string;
  
  // Medical information
  diagnosis: string;
  comorbidities: string[];
  allergies: string[];
  bloodType: string;
  
  // Dialysis details
  dialysisStartDate: Date;
  dialysisDuration: number; // years
  schedule: DialysisSchedule;
  sessionDuration: number; // hours
  
  // Vascular access
  accessType: AccessType;
  accessSite: string;
  accessCreationDate: Date;
  
  // Prescription
  dryWeight: number; // kg
  dialysateFlow: number; // mL/min
  bloodFlow: number; // mL/min
  dialyzer: string;
  heparinDose: number; // units
  
  // Clinical parameters
  lastKtV?: number; // dialysis adequacy
  lastURR?: number; // urea reduction ratio
  adequacy: DialysisAdequacy;
  
  // Last session
  lastSessionDate?: Date;
  lastPreWeight?: number;
  lastPostWeight?: number;
  lastUltrafiltration?: number;
  
  // Emergency contact
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactNumber: string;
  
  // Status
  isActive: boolean;
  
  notes?: string;
}

export interface DialysisSession {
  id: string;
  sessionNumber: string;
  sessionDate: Date;
  
  // Patient
  patientMRN: string;
  patientName: string;
  
  // Scheduling
  scheduledStartTime: string;
  scheduledEndTime: string;
  shift: 'Morning' | 'Afternoon' | 'Evening';
  
  status: SessionStatus;
  
  // Machine
  machineNumber: string;
  
  // Pre-dialysis assessment
  preDialysisTime?: Date;
  preWeight?: number; // kg
  preBloodPressure?: string;
  prePulse?: number;
  preTemperature?: number;
  preAssessmentNotes?: string;
  
  // Dialysis parameters
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number; // minutes
  
  bloodFlow?: number; // mL/min
  dialysateFlow?: number; // mL/min
  heparinBolus?: number; // units
  heparinInfusion?: number; // units/hour
  
  // Intradialytic monitoring
  intradialyticRecords: IntradialyticRecord[];
  
  // Post-dialysis assessment
  postDialysisTime?: Date;
  postWeight?: number; // kg
  postBloodPressure?: string;
  postPulse?: number;
  postTemperature?: number;
  postAssessmentNotes?: string;
  
  // Results
  ultrafiltrationVolume?: number; // liters
  actualUltrafiltration?: number; // liters
  
  // Complications
  hadComplications: boolean;
  complications?: DialysisComplication[];
  
  // Staff
  performedBy: string;
  supervisedBy?: string;
  
  notes?: string;
}

export interface IntradialyticRecord {
  time: Date;
  bloodPressure: string;
  pulse: number;
  ultrafiltrationRate: number; // mL/hour
  transmembranePressure: number; // mmHg
  venousPressure: number; // mmHg
  arterialPressure: number; // mmHg
  symptoms?: string;
  interventions?: string;
}

export interface DialysisComplication {
  id: string;
  complicationType: string;
  severity: 'mild' | 'moderate' | 'severe';
  onsetTime: Date;
  description: string;
  management: string;
  resolved: boolean;
  resolutionTime?: Date;
}

export interface DialysisMachine {
  id: string;
  machineNumber: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  
  status: MachineStatus;
  
  // Current session
  currentPatient?: string;
  currentSessionId?: string;
  sessionStartTime?: Date;
  estimatedEndTime?: Date;
  
  // Location
  station: string;
  shift: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  
  // Maintenance
  lastMaintenanceDate: Date;
  nextMaintenanceDate: Date;
  lastDisinfectionDate: Date;
  nextDisinfectionDate: Date;
  
  // Usage statistics
  totalSessionsToday: number;
  totalSessionsThisMonth: number;
  totalHoursThisMonth: number;
  
  // Issues
  hasIssues: boolean;
  issues?: string[];
  reportedBy?: string;
  
  notes?: string;
}

export interface LabResult {
  id: string;
  patientMRN: string;
  resultDate: Date;
  
  // Renal function
  urea: number; // mmol/L
  creatinine: number; // µmol/L
  eGFR?: number; // mL/min/1.73m²
  
  // Electrolytes
  sodium: number; // mmol/L
  potassium: number; // mmol/L
  chloride: number; // mmol/L
  bicarbonate: number; // mmol/L
  calcium: number; // mmol/L
  phosphate: number; // mmol/L
  
  // Hematology
  hemoglobin: number; // g/dL
  hematocrit: number; // %
  whiteBloodCells?: number; // ×10⁹/L
  platelets?: number; // ×10⁹/L
  
  // Iron studies
  serumIron?: number; // µg/dL
  transferrinSaturation?: number; // %
  ferritin?: number; // ng/mL
  
  // Bone metabolism
  parathyroidHormone?: number; // pg/mL
  vitaminD?: number; // ng/mL
  
  // Hepatitis screening
  hepBSurfaceAg?: 'Positive' | 'Negative';
  hepCAntibody?: 'Positive' | 'Negative';
  
  // Dialysis adequacy
  ktV?: number;
  urr?: number; // %
  
  notes?: string;
}

export interface WaterQualityTest {
  id: string;
  testNumber: string;
  testDate: Date;
  testTime: string;
  
  // Sampling
  samplePoint: string;
  testedBy: string;
  
  // Chemical parameters
  chlorine: number; // ppm
  chloramine: number; // ppm
  pH: number;
  conductivity: number; // µS/cm
  hardness?: number; // mg/L as CaCO3
  
  // Microbiological
  bacteriaCount?: number; // CFU/mL
  endotoxinLevel?: number; // EU/mL
  
  // Results
  overallResult: 'Pass' | 'Fail' | 'Borderline';
  
  // Actions
  actionTaken?: string;
  verifiedBy?: string;
  
  notes?: string;
}

export interface HaemodialysisStats {
  // Patients
  totalActivePatients: number;
  scheduledToday: number;
  completedToday: number;
  ongoingSessions: number;
  
  // Sessions by shift
  morningSessionsToday: number;
  afternoonSessionsToday: number;
  eveningSessionsToday: number;
  
  // Clinical outcomes
  averageKtV: number;
  adequateDialysisRate: number; // percentage
  complicationRate: number; // percentage
  
  // Machines
  totalMachines: number;
  availableMachines: number;
  machinesInUse: number;
  machinesOffline: number;
  
  // Efficiency
  averageSessionDuration: number; // hours
  machineUtilizationRate: number; // percentage
  patientWaitTime: number; // minutes
  
  // Safety
  missedSessionsThisMonth: number;
  adverseEventsThisMonth: number;
  waterQualityTests: number;
  waterQualityPassRate: number; // percentage
  
  // Vascular access
  avfRate: number; // percentage
  catheterRate: number; // percentage
  
  // Staffing
  nursesOnDuty: number;
  doctorsOnDuty: number;
}

export interface DialysisStaff {
  id: string;
  name: string;
  designation: string;
  role: 'Nephrologist' | 'Dialysis Nurse' | 'Technician' | 'Supervisor';
  
  onDuty: boolean;
  shift: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  
  // Workload
  patientsAssignedToday: number;
  sessionsCompletedToday: number;
  
  specialization?: string[];
  contactNumber: string;
}










