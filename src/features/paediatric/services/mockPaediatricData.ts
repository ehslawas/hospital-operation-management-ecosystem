import type { PaediatricPatient, PaediatricBed, PaediatricStats, GrowthMeasurement, ImmunizationRecord, DevelopmentalAssessment } from '../types/Paediatric';

// Helper functions
const randomMinutesAgo = (min: number, max: number) => {
  const minutes = Math.floor(Math.random() * (max - min) + min);
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date;
};

const randomHoursAgo = (min: number, max: number) => {
  const hours = Math.floor(Math.random() * (max - min) + min);
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
};

const randomDaysAgo = (min: number, max: number) => {
  const days = Math.floor(Math.random() * (max - min) + min);
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const monthsAgo = (months: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getAgeGroup = (ageMonths: number): 'neonate' | 'infant' | 'toddler' | 'preschool' | 'school-age' | 'adolescent' => {
  if (ageMonths < 1) return 'neonate';
  if (ageMonths < 12) return 'infant';
  if (ageMonths < 36) return 'toddler';
  if (ageMonths < 72) return 'preschool';
  if (ageMonths < 144) return 'school-age';
  return 'adolescent';
};

// Mock patients
export const mockPaediatricPatients: PaediatricPatient[] = [
  // Infant with bronchiolitis
  {
    id: 'PW001',
    registrationNumber: 'PW2025-0001',
    name: 'Muhammad Aqil bin Hafiz',
    dateOfBirth: monthsAgo(6),
    ageMonths: 6,
    ageGroup: 'infant',
    gender: 'Male',
    motherName: 'Siti Aminah binti Rahman',
    fatherName: 'Hafiz bin Abdullah',
    contactNumber: '012-3456789',
    emergencyContact: '019-9876543',
    admissionDate: randomDaysAgo(2, 3),
    status: 'observation',
    bedNumber: 'PW-03',
    primaryDiagnosis: 'Acute bronchiolitis',
    secondaryDiagnoses: [],
    allergies: [],
    attendingPediatrician: 'Dr. Salmah',
    assignedNurse: 'Nurse Aida',
    growthMeasurements: [
      {
        id: 'GM001',
        patientId: 'PW001',
        date: randomDaysAgo(2, 3),
        ageMonths: 6,
        weight: 7.5,
        weightPercentile: 50,
        height: 67,
        heightPercentile: 55,
        headCircumference: 43,
        headCircumferencePercentile: 50,
        recordedBy: 'Nurse Aida',
      },
    ],
    immunizationStatus: 'up-to-date',
    immunizationRecords: [
      {
        id: 'IMM001',
        patientId: 'PW001',
        vaccineName: 'DTaP',
        doseNumber: 3,
        scheduledAge: '5 months',
        status: 'given',
        givenDate: monthsAgo(1),
        givenBy: 'Nurse Zainab',
        batchNumber: 'DTP2025-001',
        site: 'Left thigh',
      },
      {
        id: 'IMM002',
        patientId: 'PW001',
        vaccineName: 'IPV',
        doseNumber: 3,
        scheduledAge: '5 months',
        status: 'given',
        givenDate: monthsAgo(1),
        givenBy: 'Nurse Zainab',
        batchNumber: 'IPV2025-001',
        site: 'Right thigh',
      },
    ],
    developmentalAssessments: [
      {
        id: 'DEV001',
        patientId: 'PW001',
        assessmentDate: randomDaysAgo(2, 3),
        ageMonths: 6,
        assessedBy: 'Dr. Salmah',
        grossMotor: {
          status: 'achieved',
          milestones: ['Sits with support', 'Rolls over both ways'],
          ageAppropriate: true,
        },
        fineMotor: {
          status: 'achieved',
          milestones: ['Reaches for objects', 'Transfers objects hand to hand'],
          ageAppropriate: true,
        },
        language: {
          status: 'achieved',
          milestones: ['Babbles', 'Responds to name'],
          ageAppropriate: true,
        },
        socialEmotional: {
          status: 'achieved',
          milestones: ['Smiles at people', 'Recognizes familiar faces'],
          ageAppropriate: true,
        },
        cognitive: {
          status: 'achieved',
          milestones: ['Looks around at things nearby', 'Shows curiosity'],
          ageAppropriate: true,
        },
        overallStatus: 'on-track',
        concerns: [],
        recommendations: ['Continue age-appropriate stimulation'],
      },
    ],
    vitals: [
      {
        id: 'PV001',
        patientId: 'PW001',
        recordedAt: randomHoursAgo(2, 3),
        recordedBy: 'Nurse Aida',
        temperature: 37.8,
        heartRate: 135,
        respiratoryRate: 45,
        oxygenSaturation: 94,
        painScore: 2,
        painAssessmentTool: 'FLACC',
        consciousnessLevel: 'Alert',
        fontanelleStatus: 'flat',
        capillaryRefillTime: 2,
        hydrationStatus: 'well-hydrated',
        supplementalO2: '1L via nasal cannula',
        notes: 'Mild respiratory distress, improving',
      },
    ],
    feedingType: 'breastfeeding',
    feedingNotes: 'Breastfeeding well, adequate intake',
    specialNeeds: [],
    estimatedDischargeDate: addDays(new Date(), 2),
  },
  
  // Toddler with dengue fever
  {
    id: 'PW002',
    registrationNumber: 'PW2025-0002',
    name: 'Aisyah binti Yusof',
    dateOfBirth: monthsAgo(24),
    ageMonths: 24,
    ageGroup: 'toddler',
    gender: 'Female',
    motherName: 'Nurul Huda binti Ahmad',
    fatherName: 'Yusof bin Hassan',
    contactNumber: '013-7654321',
    emergencyContact: '012-8765432',
    admissionDate: randomDaysAgo(3, 4),
    status: 'stable',
    bedNumber: 'PW-05',
    primaryDiagnosis: 'Dengue fever',
    secondaryDiagnoses: [],
    allergies: [],
    attendingPediatrician: 'Dr. Lee',
    assignedNurse: 'Nurse Ros',
    growthMeasurements: [
      {
        id: 'GM002',
        patientId: 'PW002',
        date: randomDaysAgo(3, 4),
        ageMonths: 24,
        weight: 12.5,
        weightPercentile: 60,
        height: 86,
        heightPercentile: 55,
        headCircumference: 48,
        headCircumferencePercentile: 50,
        recordedBy: 'Nurse Ros',
      },
    ],
    immunizationStatus: 'up-to-date',
    immunizationRecords: [
      {
        id: 'IMM003',
        patientId: 'PW002',
        vaccineName: 'MMR',
        doseNumber: 2,
        scheduledAge: '12 months',
        status: 'given',
        givenDate: monthsAgo(12),
        givenBy: 'Nurse Halim',
        batchNumber: 'MMR2024-005',
        site: 'Left upper arm',
      },
      {
        id: 'IMM004',
        patientId: 'PW002',
        vaccineName: 'DTaP Booster',
        doseNumber: 1,
        scheduledAge: '18 months',
        status: 'given',
        givenDate: monthsAgo(6),
        givenBy: 'Nurse Halim',
        batchNumber: 'DTP2024-020',
        site: 'Right thigh',
      },
    ],
    developmentalAssessments: [
      {
        id: 'DEV002',
        patientId: 'PW002',
        assessmentDate: monthsAgo(6),
        ageMonths: 18,
        assessedBy: 'Dr. Lee',
        grossMotor: {
          status: 'achieved',
          milestones: ['Walks independently', 'Runs', 'Kicks ball'],
          ageAppropriate: true,
        },
        fineMotor: {
          status: 'achieved',
          milestones: ['Scribbles', 'Stacks blocks', 'Uses spoon'],
          ageAppropriate: true,
        },
        language: {
          status: 'achieved',
          milestones: ['Says 10-20 words', 'Points to objects', 'Follows simple commands'],
          ageAppropriate: true,
        },
        socialEmotional: {
          status: 'achieved',
          milestones: ['Shows affection', 'Plays alongside other children'],
          ageAppropriate: true,
        },
        cognitive: {
          status: 'achieved',
          milestones: ['Finds hidden objects', 'Sorts shapes', 'Imitates actions'],
          ageAppropriate: true,
        },
        overallStatus: 'on-track',
        concerns: [],
        recommendations: ['Continue play-based learning'],
      },
    ],
    vitals: [
      {
        id: 'PV002',
        patientId: 'PW002',
        recordedAt: randomHoursAgo(4, 5),
        recordedBy: 'Nurse Ros',
        temperature: 37.2,
        heartRate: 110,
        respiratoryRate: 28,
        bloodPressureSystolic: 95,
        bloodPressureDiastolic: 60,
        oxygenSaturation: 98,
        painScore: 1,
        painAssessmentTool: 'faces',
        consciousnessLevel: 'Alert',
        capillaryRefillTime: 2,
        hydrationStatus: 'well-hydrated',
        notes: 'Fever resolved, platelets improving',
      },
    ],
    feedingType: 'solid-foods',
    feedingNotes: 'Regular diet, good appetite',
    specialNeeds: [],
    estimatedDischargeDate: addDays(new Date(), 1),
  },
  
  // School-age child with asthma exacerbation
  {
    id: 'PW003',
    registrationNumber: 'PW2025-0003',
    name: 'Arif bin Azman',
    dateOfBirth: monthsAgo(96), // 8 years
    ageMonths: 96,
    ageGroup: 'school-age',
    gender: 'Male',
    motherName: 'Farah binti Ismail',
    fatherName: 'Azman bin Kamal',
    contactNumber: '019-2345678',
    emergencyContact: '012-3456789',
    admissionDate: randomDaysAgo(1, 2),
    status: 'stable',
    bedNumber: 'PW-08',
    primaryDiagnosis: 'Acute asthma exacerbation',
    secondaryDiagnoses: ['Allergic rhinitis'],
    allergies: ['Dust mites', 'Pollen'],
    attendingPediatrician: 'Dr. Salmah',
    assignedNurse: 'Nurse Sarah',
    growthMeasurements: [
      {
        id: 'GM003',
        patientId: 'PW003',
        date: randomDaysAgo(1, 2),
        ageMonths: 96,
        weight: 28,
        weightPercentile: 55,
        height: 128,
        heightPercentile: 50,
        bmi: 17.1,
        bmiPercentile: 60,
        recordedBy: 'Nurse Sarah',
      },
    ],
    immunizationStatus: 'up-to-date',
    immunizationRecords: [
      {
        id: 'IMM005',
        patientId: 'PW003',
        vaccineName: 'DT',
        doseNumber: 1,
        scheduledAge: '7 years',
        status: 'given',
        givenDate: monthsAgo(12),
        givenBy: 'School Health Team',
        batchNumber: 'DT2024-010',
        site: 'Left upper arm',
      },
    ],
    developmentalAssessments: [],
    vitals: [
      {
        id: 'PV003',
        patientId: 'PW003',
        recordedAt: randomHoursAgo(1, 2),
        recordedBy: 'Nurse Sarah',
        temperature: 36.8,
        heartRate: 95,
        respiratoryRate: 22,
        bloodPressureSystolic: 105,
        bloodPressureDiastolic: 65,
        oxygenSaturation: 96,
        painScore: 0,
        painAssessmentTool: 'numeric',
        consciousnessLevel: 'Alert',
        capillaryRefillTime: 2,
        hydrationStatus: 'well-hydrated',
        supplementalO2: 'Room air',
        notes: 'Breathing improved after treatment',
      },
    ],
    feedingType: 'solid-foods',
    specialNeeds: ['Asthma action plan', 'Environmental triggers management'],
    estimatedDischargeDate: new Date(),
  },
  
  // Neonate with jaundice
  {
    id: 'PW004',
    registrationNumber: 'PW2025-0004',
    name: 'Baby Lim',
    dateOfBirth: randomDaysAgo(5, 6),
    ageMonths: 0,
    ageGroup: 'neonate',
    gender: 'Male',
    motherName: 'Lim Mei Ling',
    fatherName: 'Lim Chee Keong',
    contactNumber: '016-8765432',
    emergencyContact: '013-7654321',
    admissionDate: randomDaysAgo(3, 4),
    status: 'observation',
    bedNumber: 'PW-01',
    primaryDiagnosis: 'Neonatal jaundice',
    secondaryDiagnoses: [],
    allergies: [],
    attendingPediatrician: 'Dr. Kumar',
    assignedNurse: 'Nurse Zainab',
    growthMeasurements: [
      {
        id: 'GM004',
        patientId: 'PW004',
        date: randomDaysAgo(3, 4),
        ageMonths: 0,
        weight: 3.2,
        weightPercentile: 45,
        height: 50,
        heightPercentile: 50,
        headCircumference: 35,
        headCircumferencePercentile: 50,
        recordedBy: 'Nurse Zainab',
      },
    ],
    immunizationStatus: 'not-started',
    immunizationRecords: [
      {
        id: 'IMM006',
        patientId: 'PW004',
        vaccineName: 'BCG',
        doseNumber: 1,
        scheduledAge: 'Birth',
        status: 'scheduled',
        scheduledDate: new Date(),
        nextDueDate: new Date(),
      },
      {
        id: 'IMM007',
        patientId: 'PW004',
        vaccineName: 'Hepatitis B',
        doseNumber: 1,
        scheduledAge: 'Birth',
        status: 'scheduled',
        scheduledDate: new Date(),
        nextDueDate: new Date(),
      },
    ],
    developmentalAssessments: [],
    vitals: [
      {
        id: 'PV004',
        patientId: 'PW004',
        recordedAt: randomHoursAgo(2, 3),
        recordedBy: 'Nurse Zainab',
        temperature: 36.9,
        heartRate: 145,
        respiratoryRate: 45,
        oxygenSaturation: 98,
        painScore: 0,
        painAssessmentTool: 'FLACC',
        consciousnessLevel: 'Alert',
        fontanelleStatus: 'flat',
        capillaryRefillTime: 2,
        hydrationStatus: 'well-hydrated',
        notes: 'Under phototherapy, bilirubin levels decreasing',
      },
    ],
    feedingType: 'breastfeeding',
    feedingNotes: 'Breastfeeding every 2-3 hours, good latch',
    specialNeeds: ['Phototherapy'],
    estimatedDischargeDate: addDays(new Date(), 2),
  },
  
  // Adolescent with appendicitis post-op
  {
    id: 'PW005',
    registrationNumber: 'PW2025-0005',
    name: 'Nur Insyirah binti Rashid',
    dateOfBirth: monthsAgo(168), // 14 years
    ageMonths: 168,
    ageGroup: 'adolescent',
    gender: 'Female',
    motherName: 'Siti Rahmah binti Omar',
    fatherName: 'Rashid bin Ali',
    contactNumber: '017-9876543',
    emergencyContact: '012-1234567',
    admissionDate: randomDaysAgo(2, 3),
    status: 'stable',
    bedNumber: 'PW-10',
    primaryDiagnosis: 'Post-operative appendectomy',
    secondaryDiagnoses: [],
    allergies: [],
    attendingPediatrician: 'Dr. Lee',
    assignedNurse: 'Nurse Aida',
    growthMeasurements: [
      {
        id: 'GM005',
        patientId: 'PW005',
        date: randomDaysAgo(2, 3),
        ageMonths: 168,
        weight: 52,
        weightPercentile: 55,
        height: 158,
        heightPercentile: 50,
        bmi: 20.8,
        bmiPercentile: 60,
        recordedBy: 'Nurse Aida',
      },
    ],
    immunizationStatus: 'up-to-date',
    immunizationRecords: [
      {
        id: 'IMM008',
        patientId: 'PW005',
        vaccineName: 'HPV',
        doseNumber: 2,
        scheduledAge: '13 years',
        status: 'given',
        givenDate: monthsAgo(12),
        givenBy: 'School Health Team',
        batchNumber: 'HPV2024-003',
        site: 'Left upper arm',
      },
    ],
    developmentalAssessments: [],
    vitals: [
      {
        id: 'PV005',
        patientId: 'PW005',
        recordedAt: randomHoursAgo(3, 4),
        recordedBy: 'Nurse Aida',
        temperature: 37.1,
        heartRate: 78,
        respiratoryRate: 18,
        bloodPressureSystolic: 115,
        bloodPressureDiastolic: 70,
        oxygenSaturation: 98,
        painScore: 4,
        painAssessmentTool: 'numeric',
        consciousnessLevel: 'Alert',
        capillaryRefillTime: 2,
        hydrationStatus: 'well-hydrated',
        notes: 'Post-op day 2, wound healing well',
      },
    ],
    feedingType: 'solid-foods',
    feedingNotes: 'Tolerating soft diet',
    specialNeeds: ['Post-operative care', 'Pain management'],
    estimatedDischargeDate: addDays(new Date(), 1),
  },
];

// Mock beds
export const mockPaediatricBeds: PaediatricBed[] = [
  // General ward
  { id: 'PW-01', bedNumber: 'PW-01', roomNumber: 'Room 1', zone: 'General', status: 'occupied', patientId: 'PW004', admittedAt: randomDaysAgo(3, 4), hasCrib: true, hasOxygen: true, hasMonitor: true, isIsolation: false },
  { id: 'PW-02', bedNumber: 'PW-02', roomNumber: 'Room 1', zone: 'General', status: 'available', hasCrib: true, hasOxygen: true, hasMonitor: true, isIsolation: false },
  { id: 'PW-03', bedNumber: 'PW-03', roomNumber: 'Room 2', zone: 'General', status: 'occupied', patientId: 'PW001', admittedAt: randomDaysAgo(2, 3), hasCrib: true, hasOxygen: true, hasMonitor: true, isIsolation: false },
  { id: 'PW-04', bedNumber: 'PW-04', roomNumber: 'Room 2', zone: 'General', status: 'available', hasCrib: true, hasOxygen: true, hasMonitor: false, isIsolation: false },
  { id: 'PW-05', bedNumber: 'PW-05', roomNumber: 'Room 3', zone: 'General', status: 'occupied', patientId: 'PW002', admittedAt: randomDaysAgo(3, 4), hasCrib: false, hasOxygen: false, hasMonitor: false, isIsolation: false },
  { id: 'PW-06', bedNumber: 'PW-06', roomNumber: 'Room 3', zone: 'General', status: 'available', hasCrib: false, hasOxygen: false, hasMonitor: false, isIsolation: false },
  { id: 'PW-07', bedNumber: 'PW-07', roomNumber: 'Room 4', zone: 'General', status: 'cleaning', hasCrib: false, hasOxygen: true, hasMonitor: false, isIsolation: false },
  { id: 'PW-08', bedNumber: 'PW-08', roomNumber: 'Room 4', zone: 'General', status: 'occupied', patientId: 'PW003', admittedAt: randomDaysAgo(1, 2), hasCrib: false, hasOxygen: true, hasMonitor: false, isIsolation: false },
  { id: 'PW-09', bedNumber: 'PW-09', roomNumber: 'Room 5', zone: 'General', status: 'available', hasCrib: false, hasOxygen: false, hasMonitor: false, isIsolation: false },
  { id: 'PW-10', bedNumber: 'PW-10', roomNumber: 'Room 5', zone: 'General', status: 'occupied', patientId: 'PW005', admittedAt: randomDaysAgo(2, 3), hasCrib: false, hasOxygen: false, hasMonitor: false, isIsolation: false },
  
  // High-dependency
  { id: 'HD-01', bedNumber: 'HD-01', roomNumber: 'HD', zone: 'High-Dependency', status: 'available', hasCrib: true, hasOxygen: true, hasMonitor: true, isIsolation: false },
  { id: 'HD-02', bedNumber: 'HD-02', roomNumber: 'HD', zone: 'High-Dependency', status: 'available', hasCrib: true, hasOxygen: true, hasMonitor: true, isIsolation: false },
  
  // Isolation
  { id: 'ISO-01', bedNumber: 'ISO-01', roomNumber: 'Isolation', zone: 'Isolation', status: 'available', hasCrib: true, hasOxygen: true, hasMonitor: true, isIsolation: true },
  { id: 'ISO-02', bedNumber: 'ISO-02', roomNumber: 'Isolation', zone: 'Isolation', status: 'available', hasCrib: false, hasOxygen: true, hasMonitor: true, isIsolation: true },
];

// Calculate statistics
export function calculatePaediatricStats(patients: PaediatricPatient[], beds: PaediatricBed[]): PaediatricStats {
  const activePatients = patients.filter(p => p.status !== 'discharged');
  
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const newAdmissions = patients.filter(p => p.admissionDate >= todayStart).length;
  
  const criticalCases = patients.filter(p => p.status === 'critical').length;
  
  const byAgeGroup = {
    neonate: patients.filter(p => p.ageGroup === 'neonate' && p.status !== 'discharged').length,
    infant: patients.filter(p => p.ageGroup === 'infant' && p.status !== 'discharged').length,
    toddler: patients.filter(p => p.ageGroup === 'toddler' && p.status !== 'discharged').length,
    preschool: patients.filter(p => p.ageGroup === 'preschool' && p.status !== 'discharged').length,
    schoolAge: patients.filter(p => p.ageGroup === 'school-age' && p.status !== 'discharged').length,
    adolescent: patients.filter(p => p.ageGroup === 'adolescent' && p.status !== 'discharged').length,
  };
  
  const immunizationUpToDate = patients.filter(p => p.immunizationStatus === 'up-to-date' && p.status !== 'discharged').length;
  const immunizationDelayed = patients.filter(p => p.immunizationStatus === 'delayed' && p.status !== 'discharged').length;
  
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);
  
  return {
    totalPatients: activePatients.length,
    newAdmissions,
    criticalCases,
    byAgeGroup,
    immunizationUpToDate,
    immunizationDelayed,
    occupancyRate,
    availableBeds,
    totalBeds,
  };
}










