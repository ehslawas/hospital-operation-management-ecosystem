export type PregnancyStatus = 'prenatal' | 'active-labour' | 'delivery' | 'postnatal' | 'discharged';
export type LabourStage = 'latent' | 'active' | 'transition' | 'pushing' | 'delivery' | 'placental';
export type DeliveryType = 'normal-vaginal' | 'assisted-vaginal' | 'caesarean-elective' | 'caesarean-emergency';
export type RiskLevel = 'low' | 'moderate' | 'high';

export interface Mother {
  id: string;
  registrationNumber: string;
  name: string;
  age: number;
  icNumber: string;
  contactNumber: string;
  
  // Pregnancy details
  status: PregnancyStatus;
  gravida: number; // Total pregnancies
  para: number; // Viable births
  abortions: number;
  livingChildren: number;
  
  // Current pregnancy
  lmp: Date; // Last menstrual period
  edd: Date; // Expected delivery date
  gestationalAge: string; // e.g., "38w 4d"
  gestationalWeeks: number;
  
  // Risk assessment
  riskLevel: RiskLevel;
  riskFactors: string[];
  
  // Medical history
  bloodType: string;
  allergies: string[];
  medicalConditions: string[];
  previousComplications: string[];
  
  // Prenatal care
  prenatalVisits: PrenatalVisit[];
  nextAppointment?: Date;
  
  // Labour tracking
  labour?: LabourTracking;
  
  // Delivery
  delivery?: DeliveryRecord;
  
  // Admission
  admittedAt?: Date;
  bedNumber?: string;
  assignedMidwife?: string;
  assignedDoctor?: string;
}

export interface PrenatalVisit {
  id: string;
  date: Date;
  gestationalAge: string;
  weight: number;
  bloodPressure: string;
  fundalHeight: number; // cm
  fetalHeartRate: number;
  presentation: string;
  complaints?: string;
  notes?: string;
  attendedBy: string;
  nextVisit?: Date;
}

export interface LabourTracking {
  startTime: Date;
  stage: LabourStage;
  ruptureOfMembranes?: Date;
  membranesStatus: 'intact' | 'ruptured-spontaneous' | 'ruptured-artificial';
  liquorColor: 'clear' | 'meconium-stained' | 'blood-stained';
  
  // Partograph data
  partograph: PartographEntry[];
  
  // Current status
  currentDilation: number; // cm, 0-10
  currentEffacement: number; // %, 0-100
  currentStation: number; // -5 to +5
  
  // Pain management
  painRelief: string[];
  epidural?: boolean;
  
  // Complications
  complications: string[];
}

export interface PartographEntry {
  id: string;
  time: Date;
  hoursInLabour: number;
  
  // Cervical dilation
  cervicalDilation: number; // cm
  
  // Contractions
  contractionsPerTenMin: number;
  contractionDuration: number; // seconds
  contractionStrength: 'mild' | 'moderate' | 'strong';
  
  // Fetal monitoring
  fetalHeartRate: number;
  fetalHeartRatePattern: 'reassuring' | 'non-reassuring' | 'abnormal';
  
  // Maternal vitals
  maternalBP: string;
  maternalPulse: number;
  maternalTemp: number;
  
  // Other
  urineOutput?: number; // ml
  drugsGiven?: string;
  notes?: string;
  recordedBy: string;
}

export interface DeliveryRecord {
  id: string;
  deliveryTime: Date;
  deliveryType: DeliveryType;
  labourDuration: number; // minutes
  
  // Delivery details
  presentation: string;
  episiotomy: boolean;
  perinealTear?: string;
  bloodLoss: number; // ml
  
  // Placenta
  placentaDelivered: Date;
  placentaComplete: boolean;
  placentaWeight?: number; // grams
  
  // Newborn
  newborn: Newborn;
  
  // Complications
  complications: string[];
  
  // Staff
  deliveredBy: string;
  assistedBy: string[];
  
  notes?: string;
}

export interface Newborn {
  id: string;
  motherId: string;
  name?: string;
  gender: 'Male' | 'Female';
  birthTime: Date;
  
  // Birth metrics
  birthWeight: number; // grams
  birthLength: number; // cm
  headCircumference: number; // cm
  
  // APGAR scores
  apgar1Min: APGARScore;
  apgar5Min: APGARScore;
  apgar10Min?: APGARScore;
  
  // Initial assessment
  appearance: string;
  cry: string;
  tone: string;
  breathing: string;
  
  // Interventions
  resuscitationNeeded: boolean;
  resuscitationDetails?: string;
  
  // Screening
  vitaminKGiven: boolean;
  eyeProphylaxis: boolean;
  hepatitisB: boolean;
  
  // Status
  status: 'with-mother' | 'nursery' | 'nicu' | 'transferred';
  complications: string[];
  
  // Feeding
  feedingType: 'breastfeeding' | 'formula' | 'mixed';
  firstFeed?: Date;
}

export interface APGARScore {
  score: number; // 0-10
  appearance: number; // 0-2
  pulse: number; // 0-2
  grimace: number; // 0-2
  activity: number; // 0-2
  respiration: number; // 0-2
  time: Date;
  assessedBy: string;
}

export interface MaternityBed {
  id: string;
  roomNumber: string;
  bedNumber: string;
  ward: 'Prenatal' | 'Labour' | 'Postnatal' | 'High-Risk';
  status: 'available' | 'occupied' | 'cleaning' | 'reserved';
  motherId?: string;
  assignedAt?: Date;
}

export interface MaternityStats {
  totalPatients: number;
  prenatal: number;
  inLabour: number;
  postnatal: number;
  deliveriesToday: number;
  caesareanRate: number;
  averageLabourDuration: number; // hours
  highRiskCases: number;
  availableBeds: number;
  totalBeds: number;
}








