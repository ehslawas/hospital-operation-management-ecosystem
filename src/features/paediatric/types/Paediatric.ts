export type AgeGroup = 'neonate' | 'infant' | 'toddler' | 'preschool' | 'school-age' | 'adolescent';
export type PatientStatus = 'admitted' | 'stable' | 'critical' | 'observation' | 'discharged';
export type ImmunizationStatus = 'up-to-date' | 'delayed' | 'incomplete' | 'not-started';

export interface PaediatricPatient {
  id: string;
  registrationNumber: string;
  name: string;
  dateOfBirth: Date;
  ageMonths: number;
  ageGroup: AgeGroup;
  gender: 'Male' | 'Female';
  
  // Family
  motherName: string;
  fatherName: string;
  guardianName?: string;
  guardianRelation?: string;
  contactNumber: string;
  emergencyContact: string;
  
  // Admission
  admissionDate: Date;
  status: PatientStatus;
  bedNumber: string;
  
  // Clinical
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  allergies: string[];
  
  // Care team
  attendingPediatrician: string;
  assignedNurse: string;
  
  // Growth tracking
  growthMeasurements: GrowthMeasurement[];
  
  // Immunizations
  immunizationStatus: ImmunizationStatus;
  immunizationRecords: ImmunizationRecord[];
  
  // Development
  developmentalAssessments: DevelopmentalAssessment[];
  
  // Vitals
  vitals: PaediatricVitals[];
  
  // Feeding (for infants/toddlers)
  feedingType?: 'breastfeeding' | 'formula' | 'mixed' | 'solid-foods';
  feedingNotes?: string;
  
  // Special needs
  specialNeeds: string[];
  
  // Discharge planning
  estimatedDischargeDate?: Date;
}

export interface GrowthMeasurement {
  id: string;
  patientId: string;
  date: Date;
  ageMonths: number;
  
  weight: number; // kg
  weightPercentile: number;
  
  height: number; // cm
  heightPercentile: number;
  
  headCircumference?: number; // cm (for <3 years)
  headCircumferencePercentile?: number;
  
  bmi?: number;
  bmiPercentile?: number;
  
  recordedBy: string;
  notes?: string;
}

export interface ImmunizationRecord {
  id: string;
  patientId: string;
  vaccineName: string;
  doseNumber: number;
  scheduledAge: string; // e.g., "2 months", "6 months"
  
  status: 'given' | 'scheduled' | 'overdue' | 'contraindicated';
  
  givenDate?: Date;
  givenBy?: string;
  batchNumber?: string;
  site?: string; // injection site
  
  scheduledDate?: Date;
  nextDueDate?: Date;
  
  adverseReactions?: string;
  notes?: string;
}

export interface DevelopmentalAssessment {
  id: string;
  patientId: string;
  assessmentDate: Date;
  ageMonths: number;
  assessedBy: string;
  
  // Domains
  grossMotor: DevelopmentalDomain;
  fineMotor: DevelopmentalDomain;
  language: DevelopmentalDomain;
  socialEmotional: DevelopmentalDomain;
  cognitive: DevelopmentalDomain;
  
  overallStatus: 'on-track' | 'at-risk' | 'delayed';
  concerns: string[];
  recommendations: string[];
  
  notes?: string;
}

export interface DevelopmentalDomain {
  status: 'achieved' | 'emerging' | 'not-yet';
  milestones: string[];
  ageAppropriate: boolean;
}

export interface PaediatricVitals {
  id: string;
  patientId: string;
  recordedAt: Date;
  recordedBy: string;
  
  temperature: number;
  heartRate: number;
  respiratoryRate: number;
  bloodPressureSystolic?: number; // Not always measured in young children
  bloodPressureDiastolic?: number;
  oxygenSaturation: number;
  
  painScore: number; // 0-10 or FLACC for non-verbal
  painAssessmentTool: 'numeric' | 'FLACC' | 'faces';
  
  consciousnessLevel: 'Alert' | 'Drowsy' | 'Irritable' | 'Lethargic';
  
  // Pediatric specific
  fontanelleStatus?: 'flat' | 'sunken' | 'bulging'; // for infants
  capillaryRefillTime?: number; // seconds
  hydrationStatus: 'well-hydrated' | 'mild-dehydration' | 'moderate-dehydration' | 'severe-dehydration';
  
  supplementalO2?: string;
  notes?: string;
}

export interface PaediatricBed {
  id: string;
  bedNumber: string;
  roomNumber: string;
  zone: 'General' | 'Isolation' | 'High-Dependency';
  status: 'available' | 'occupied' | 'cleaning' | 'reserved';
  patientId?: string;
  admittedAt?: Date;
  
  // Bed features
  hasCrib: boolean;
  hasOxygen: boolean;
  hasMonitor: boolean;
  isIsolation: boolean;
}

export interface PaediatricStats {
  totalPatients: number;
  newAdmissions: number;
  criticalCases: number;
  
  byAgeGroup: {
    neonate: number;
    infant: number;
    toddler: number;
    preschool: number;
    schoolAge: number;
    adolescent: number;
  };
  
  immunizationUpToDate: number;
  immunizationDelayed: number;
  
  occupancyRate: number;
  availableBeds: number;
  totalBeds: number;
}

// Malaysian Immunization Schedule
export const MALAYSIAN_IMMUNIZATION_SCHEDULE = [
  { vaccine: 'BCG', doses: 1, schedule: ['Birth'] },
  { vaccine: 'Hepatitis B', doses: 3, schedule: ['Birth', '1 month', '5 months'] },
  { vaccine: 'DTaP (Diphtheria, Tetanus, Pertussis)', doses: 3, schedule: ['2 months', '3 months', '5 months'] },
  { vaccine: 'IPV (Polio)', doses: 3, schedule: ['2 months', '3 months', '5 months'] },
  { vaccine: 'Hib (Haemophilus)', doses: 3, schedule: ['2 months', '3 months', '5 months'] },
  { vaccine: 'MMR (Measles, Mumps, Rubella)', doses: 2, schedule: ['9 months', '12 months'] },
  { vaccine: 'JE (Japanese Encephalitis)', doses: 1, schedule: ['9 months'] },
  { vaccine: 'DTaP Booster', doses: 1, schedule: ['18 months'] },
  { vaccine: 'IPV Booster', doses: 1, schedule: ['18 months'] },
  { vaccine: 'DT (Diphtheria, Tetanus)', doses: 1, schedule: ['7 years'] },
  { vaccine: 'HPV (Human Papillomavirus)', doses: 2, schedule: ['13 years - girls'] },
];







