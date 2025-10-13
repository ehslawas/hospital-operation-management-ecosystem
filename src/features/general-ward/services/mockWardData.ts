import type { WardPatient, WardBed, WardStats, VitalSigns, NursingNote, MedicationOrder } from '../types/Ward';

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

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Mock patients
export const mockWardPatients: WardPatient[] = [
  // Critical patient - post-operative
  {
    id: 'GW001',
    registrationNumber: 'GW2025-0001',
    name: 'Ahmad Zaki bin Hassan',
    age: 58,
    gender: 'Male',
    icNumber: '660420-14-3456',
    contactNumber: '012-9876543',
    admissionDate: randomDaysAgo(2, 3),
    admissionType: 'emergency',
    admissionDiagnosis: 'Acute appendicitis',
    status: 'critical',
    bedNumber: 'A-03',
    wardRoom: 'Room A',
    primaryDiagnosis: 'Post-operative appendectomy with complications',
    secondaryDiagnoses: ['Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin'],
    codeStatus: 'Full Code',
    isolationPrecautions: 'none',
    attendingPhysician: 'Dr. Ahmad Razali',
    consultingSpecialists: ['Infectious Disease'],
    assignedNurse: 'Nurse Farah',
    vitals: [
      {
        id: 'V001',
        patientId: 'GW001',
        recordedAt: randomHoursAgo(1, 2),
        recordedBy: 'Nurse Farah',
        temperature: 38.5,
        bloodPressureSystolic: 145,
        bloodPressureDiastolic: 92,
        heartRate: 105,
        respiratoryRate: 22,
        oxygenSaturation: 94,
        painScore: 6,
        supplementalO2: '2L via nasal cannula',
        consciousnessLevel: 'Alert',
        notes: 'Febrile, tachycardic. Wound site tender.',
      },
      {
        id: 'V002',
        patientId: 'GW001',
        recordedAt: randomHoursAgo(5, 6),
        recordedBy: 'Nurse Halim',
        temperature: 38.2,
        bloodPressureSystolic: 138,
        bloodPressureDiastolic: 88,
        heartRate: 98,
        respiratoryRate: 20,
        oxygenSaturation: 95,
        painScore: 7,
        supplementalO2: '2L via nasal cannula',
        consciousnessLevel: 'Alert',
      },
    ],
    nursingNotes: [
      {
        id: 'NN001',
        patientId: 'GW001',
        createdAt: randomHoursAgo(2, 3),
        createdBy: 'Nurse Farah',
        shift: 'afternoon',
        category: 'progress',
        note: 'Patient complaining of increased abdominal pain. Surgical wound site showing signs of infection - redness, warmth, purulent discharge noted. Temperature elevated at 38.5°C. Dr. Ahmad notified.',
        subjective: 'Patient reports pain 7/10, worse with movement',
        objective: 'Temp 38.5°C, wound site erythema 3cm diameter, purulent discharge',
        assessment: 'Possible surgical site infection',
        plan: 'Continue monitoring, wound swab sent for culture, antibiotics review pending',
      },
    ],
    medications: [
      {
        id: 'MED001',
        patientId: 'GW001',
        medicationName: 'Ceftriaxone',
        dosage: '1g',
        route: 'IV',
        frequency: 'BD (every 12 hours)',
        startDate: randomDaysAgo(1, 2),
        indication: 'Post-operative infection prophylaxis',
        orderedBy: 'Dr. Ahmad Razali',
        administrations: [
          {
            id: 'ADM001',
            medicationOrderId: 'MED001',
            scheduledTime: randomHoursAgo(4, 5),
            administeredAt: randomHoursAgo(4, 5),
            administeredBy: 'Nurse Farah',
            dosageGiven: '1g',
            route: 'IV',
            status: 'given',
          },
        ],
        isPRN: false,
        isHighAlert: false,
        requiresDoubleCheck: false,
      },
      {
        id: 'MED002',
        patientId: 'GW001',
        medicationName: 'Morphine',
        dosage: '5mg',
        route: 'IV',
        frequency: 'Q4H PRN',
        startDate: randomDaysAgo(2, 3),
        indication: 'Pain management',
        orderedBy: 'Dr. Ahmad Razali',
        administrations: [
          {
            id: 'ADM002',
            medicationOrderId: 'MED002',
            scheduledTime: randomHoursAgo(3, 4),
            administeredAt: randomHoursAgo(3, 4),
            administeredBy: 'Nurse Farah',
            dosageGiven: '5mg',
            route: 'IV',
            status: 'given',
            patientResponse: 'Pain reduced to 4/10 after 30 minutes',
          },
        ],
        isPRN: true,
        isHighAlert: true,
        requiresDoubleCheck: true,
      },
    ],
    dietOrder: 'Clear fluids only',
    activityOrder: 'Bed rest',
    estimatedDischargeDate: addDays(new Date(), 3),
  },
  
  // Stable patient - chronic condition
  {
    id: 'GW002',
    registrationNumber: 'GW2025-0002',
    name: 'Siti Aishah binti Omar',
    age: 72,
    gender: 'Female',
    icNumber: '520315-10-2345',
    contactNumber: '019-3456789',
    admissionDate: randomDaysAgo(5, 6),
    admissionType: 'elective',
    admissionDiagnosis: 'Congestive heart failure exacerbation',
    status: 'stable',
    bedNumber: 'B-05',
    wardRoom: 'Room B',
    primaryDiagnosis: 'Congestive heart failure (CHF)',
    secondaryDiagnoses: ['Atrial fibrillation', 'Chronic kidney disease Stage 3'],
    allergies: [],
    codeStatus: 'DNR',
    isolationPrecautions: 'none',
    attendingPhysician: 'Dr. Lim Wei Ming',
    consultingSpecialists: ['Cardiology'],
    assignedNurse: 'Nurse Aini',
    vitals: [
      {
        id: 'V003',
        patientId: 'GW002',
        recordedAt: randomHoursAgo(2, 3),
        recordedBy: 'Nurse Aini',
        temperature: 36.8,
        bloodPressureSystolic: 128,
        bloodPressureDiastolic: 78,
        heartRate: 76,
        respiratoryRate: 18,
        oxygenSaturation: 96,
        painScore: 2,
        consciousnessLevel: 'Alert',
        notes: 'Patient comfortable, no respiratory distress',
      },
    ],
    nursingNotes: [
      {
        id: 'NN002',
        patientId: 'GW002',
        createdAt: randomHoursAgo(8, 10),
        createdBy: 'Nurse Halim',
        shift: 'morning',
        category: 'assessment',
        note: 'Patient slept well overnight. No complaints of chest pain or shortness of breath. Bilateral pedal edema improved. Urine output adequate.',
        subjective: 'Feeling much better, breathing easier',
        objective: 'Vital signs stable, lungs clear bilaterally, mild pedal edema',
        assessment: 'CHF improving with diuretic therapy',
        plan: 'Continue current medications, daily weights, I&O monitoring',
      },
    ],
    medications: [
      {
        id: 'MED003',
        patientId: 'GW002',
        medicationName: 'Furosemide',
        dosage: '40mg',
        route: 'PO',
        frequency: 'OD (morning)',
        startDate: randomDaysAgo(5, 6),
        indication: 'Fluid management',
        orderedBy: 'Dr. Lim Wei Ming',
        administrations: [
          {
            id: 'ADM003',
            medicationOrderId: 'MED003',
            scheduledTime: randomHoursAgo(6, 8),
            administeredAt: randomHoursAgo(6, 8),
            administeredBy: 'Nurse Halim',
            dosageGiven: '40mg',
            route: 'PO',
            status: 'given',
          },
        ],
        isPRN: false,
        isHighAlert: false,
        requiresDoubleCheck: false,
      },
    ],
    dietOrder: 'Low sodium diet',
    activityOrder: 'Up as tolerated',
    estimatedDischargeDate: addDays(new Date(), 2),
  },
  
  // Patient pending discharge
  {
    id: 'GW003',
    registrationNumber: 'GW2025-0003',
    name: 'Raj Kumar a/l Suresh',
    age: 45,
    gender: 'Male',
    icNumber: '790825-14-4567',
    contactNumber: '013-9876543',
    admissionDate: randomDaysAgo(4, 5),
    admissionType: 'emergency',
    admissionDiagnosis: 'Acute gastroenteritis',
    status: 'pending-discharge',
    bedNumber: 'A-07',
    wardRoom: 'Room A',
    primaryDiagnosis: 'Acute gastroenteritis, resolved',
    secondaryDiagnoses: [],
    allergies: ['Sulfa drugs'],
    codeStatus: 'Full Code',
    isolationPrecautions: 'contact',
    attendingPhysician: 'Dr. Kamala',
    consultingSpecialists: [],
    assignedNurse: 'Nurse Sarah',
    vitals: [
      {
        id: 'V004',
        patientId: 'GW003',
        recordedAt: randomHoursAgo(4, 5),
        recordedBy: 'Nurse Sarah',
        temperature: 36.6,
        bloodPressureSystolic: 118,
        bloodPressureDiastolic: 75,
        heartRate: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        painScore: 0,
        consciousnessLevel: 'Alert',
        notes: 'All vitals within normal limits',
      },
    ],
    nursingNotes: [
      {
        id: 'NN003',
        patientId: 'GW003',
        createdAt: randomHoursAgo(6, 8),
        createdBy: 'Nurse Sarah',
        shift: 'morning',
        category: 'progress',
        note: 'Patient tolerating regular diet well. No vomiting or diarrhea for past 24 hours. Discharge planned for today pending pharmacy consult.',
      },
    ],
    medications: [],
    dietOrder: 'Regular diet',
    activityOrder: 'Ambulatory',
    estimatedDischargeDate: new Date(),
    dischargeInstructions: 'Continue oral rehydration. Follow up with GP in 1 week if symptoms return.',
  },
  
  // Isolation patient
  {
    id: 'GW004',
    registrationNumber: 'GW2025-0004',
    name: 'Tan Mei Ling',
    age: 34,
    gender: 'Female',
    icNumber: '900512-08-5678',
    contactNumber: '016-2345678',
    admissionDate: randomDaysAgo(1, 2),
    admissionType: 'emergency',
    admissionDiagnosis: 'Pneumonia',
    status: 'stable',
    bedNumber: 'ISO-01',
    wardRoom: 'Isolation',
    primaryDiagnosis: 'Community-acquired pneumonia',
    secondaryDiagnoses: [],
    allergies: [],
    codeStatus: 'Full Code',
    isolationPrecautions: 'droplet',
    attendingPhysician: 'Dr. Wong',
    consultingSpecialists: [],
    assignedNurse: 'Nurse Zainab',
    vitals: [
      {
        id: 'V005',
        patientId: 'GW004',
        recordedAt: randomHoursAgo(3, 4),
        recordedBy: 'Nurse Zainab',
        temperature: 37.8,
        bloodPressureSystolic: 122,
        bloodPressureDiastolic: 80,
        heartRate: 88,
        respiratoryRate: 20,
        oxygenSaturation: 94,
        painScore: 3,
        supplementalO2: '3L via nasal cannula',
        consciousnessLevel: 'Alert',
        notes: 'Cough productive, breathing improved',
      },
    ],
    nursingNotes: [
      {
        id: 'NN004',
        patientId: 'GW004',
        createdAt: randomHoursAgo(5, 6),
        createdBy: 'Nurse Zainab',
        shift: 'afternoon',
        category: 'assessment',
        note: 'Patient in droplet isolation. Wearing surgical mask when staff in room. Breathing pattern improved, less dyspnea. Productive cough with yellowish sputum.',
        subjective: 'Breathing easier today, cough still present',
        objective: 'SpO2 94% on 3L O2, RR 20, temp 37.8°C',
        assessment: 'Pneumonia improving with antibiotic therapy',
        plan: 'Continue antibiotics, chest physiotherapy, maintain isolation precautions',
      },
    ],
    medications: [
      {
        id: 'MED004',
        patientId: 'GW004',
        medicationName: 'Augmentin',
        dosage: '1g',
        route: 'IV',
        frequency: 'TDS (every 8 hours)',
        startDate: randomDaysAgo(1, 2),
        indication: 'Pneumonia',
        orderedBy: 'Dr. Wong',
        administrations: [
          {
            id: 'ADM004',
            medicationOrderId: 'MED004',
            scheduledTime: randomHoursAgo(2, 3),
            administeredAt: randomHoursAgo(2, 3),
            administeredBy: 'Nurse Zainab',
            dosageGiven: '1g',
            route: 'IV',
            status: 'given',
          },
        ],
        isPRN: false,
        isHighAlert: false,
        requiresDoubleCheck: false,
      },
    ],
    dietOrder: 'Regular diet',
    activityOrder: 'Bed rest',
    estimatedDischargeDate: addDays(new Date(), 4),
  },
  
  // New admission
  {
    id: 'GW005',
    registrationNumber: 'GW2025-0005',
    name: 'Nurul Huda binti Yusof',
    age: 28,
    gender: 'Female',
    icNumber: '960820-10-6789',
    contactNumber: '011-5678901',
    admissionDate: randomHoursAgo(6, 8),
    admissionType: 'transfer',
    admissionDiagnosis: 'Dengue fever',
    status: 'observation',
    bedNumber: 'C-02',
    wardRoom: 'Room C',
    primaryDiagnosis: 'Dengue fever without warning signs',
    secondaryDiagnoses: [],
    allergies: [],
    codeStatus: 'Full Code',
    isolationPrecautions: 'none',
    attendingPhysician: 'Dr. Azizah',
    consultingSpecialists: [],
    assignedNurse: 'Nurse Ros',
    vitals: [
      {
        id: 'V006',
        patientId: 'GW005',
        recordedAt: randomHoursAgo(1, 2),
        recordedBy: 'Nurse Ros',
        temperature: 38.2,
        bloodPressureSystolic: 110,
        bloodPressureDiastolic: 70,
        heartRate: 92,
        respiratoryRate: 18,
        oxygenSaturation: 98,
        painScore: 4,
        consciousnessLevel: 'Alert',
        notes: 'Febrile, complaining of body aches and headache',
      },
    ],
    nursingNotes: [
      {
        id: 'NN005',
        patientId: 'GW005',
        createdAt: randomHoursAgo(2, 3),
        createdBy: 'Nurse Ros',
        shift: 'afternoon',
        category: 'assessment',
        note: 'Patient transferred from Emergency Department. Day 4 of fever. Dengue NS1 positive. Close monitoring for warning signs initiated. Patient educated on dengue warning signs.',
        subjective: 'Severe body aches, headache, no appetite',
        objective: 'Temp 38.2°C, BP 110/70, platelets 120k',
        assessment: 'Dengue fever day 4, critical phase approaching',
        plan: '4-hourly vitals, FBC monitoring BD, strict I&O, watch for warning signs',
      },
    ],
    medications: [
      {
        id: 'MED005',
        patientId: 'GW005',
        medicationName: 'Paracetamol',
        dosage: '1g',
        route: 'PO',
        frequency: 'QID (every 6 hours)',
        startDate: randomHoursAgo(6, 8),
        indication: 'Fever management',
        orderedBy: 'Dr. Azizah',
        administrations: [
          {
            id: 'ADM005',
            medicationOrderId: 'MED005',
            scheduledTime: randomHoursAgo(1, 2),
            administeredAt: randomHoursAgo(1, 2),
            administeredBy: 'Nurse Ros',
            dosageGiven: '1g',
            route: 'PO',
            status: 'given',
          },
        ],
        isPRN: false,
        isHighAlert: false,
        requiresDoubleCheck: false,
      },
    ],
    dietOrder: 'Regular diet, encourage fluids',
    activityOrder: 'Bed rest',
    estimatedDischargeDate: addDays(new Date(), 5),
  },
];

// Mock beds
export const mockWardBeds: WardBed[] = [
  // Zone A
  { id: 'A-01', bedNumber: 'A-01', roomNumber: 'Room A', zone: 'A', status: 'available', hasOxygen: true, hasSuction: true, hasMonitor: false, isIsolation: false },
  { id: 'A-02', bedNumber: 'A-02', roomNumber: 'Room A', zone: 'A', status: 'available', hasOxygen: true, hasSuction: true, hasMonitor: false, isIsolation: false },
  { id: 'A-03', bedNumber: 'A-03', roomNumber: 'Room A', zone: 'A', status: 'occupied', patientId: 'GW001', admittedAt: randomDaysAgo(2, 3), hasOxygen: true, hasSuction: true, hasMonitor: true, isIsolation: false },
  { id: 'A-04', bedNumber: 'A-04', roomNumber: 'Room A', zone: 'A', status: 'available', hasOxygen: true, hasSuction: true, hasMonitor: false, isIsolation: false },
  { id: 'A-05', bedNumber: 'A-05', roomNumber: 'Room A', zone: 'A', status: 'cleaning', hasOxygen: true, hasSuction: true, hasMonitor: false, isIsolation: false },
  { id: 'A-06', bedNumber: 'A-06', roomNumber: 'Room A', zone: 'A', status: 'available', hasOxygen: true, hasSuction: true, hasMonitor: false, isIsolation: false },
  { id: 'A-07', bedNumber: 'A-07', roomNumber: 'Room A', zone: 'A', status: 'occupied', patientId: 'GW003', admittedAt: randomDaysAgo(4, 5), hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  { id: 'A-08', bedNumber: 'A-08', roomNumber: 'Room A', zone: 'A', status: 'available', hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  
  // Zone B
  { id: 'B-01', bedNumber: 'B-01', roomNumber: 'Room B', zone: 'B', status: 'available', hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  { id: 'B-02', bedNumber: 'B-02', roomNumber: 'Room B', zone: 'B', status: 'available', hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  { id: 'B-03', bedNumber: 'B-03', roomNumber: 'Room B', zone: 'B', status: 'available', hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  { id: 'B-04', bedNumber: 'B-04', roomNumber: 'Room B', zone: 'B', status: 'available', hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  { id: 'B-05', bedNumber: 'B-05', roomNumber: 'Room B', zone: 'B', status: 'occupied', patientId: 'GW002', admittedAt: randomDaysAgo(5, 6), hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  { id: 'B-06', bedNumber: 'B-06', roomNumber: 'Room B', zone: 'B', status: 'available', hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  
  // Zone C
  { id: 'C-01', bedNumber: 'C-01', roomNumber: 'Room C', zone: 'C', status: 'available', hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  { id: 'C-02', bedNumber: 'C-02', roomNumber: 'Room C', zone: 'C', status: 'occupied', patientId: 'GW005', admittedAt: randomHoursAgo(6, 8), hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  { id: 'C-03', bedNumber: 'C-03', roomNumber: 'Room C', zone: 'C', status: 'available', hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  { id: 'C-04', bedNumber: 'C-04', roomNumber: 'Room C', zone: 'C', status: 'available', hasOxygen: true, hasSuction: false, hasMonitor: false, isIsolation: false },
  
  // Isolation
  { id: 'ISO-01', bedNumber: 'ISO-01', roomNumber: 'Isolation', zone: 'Isolation', status: 'occupied', patientId: 'GW004', admittedAt: randomDaysAgo(1, 2), hasOxygen: true, hasSuction: true, hasMonitor: true, isIsolation: true },
  { id: 'ISO-02', bedNumber: 'ISO-02', roomNumber: 'Isolation', zone: 'Isolation', status: 'available', hasOxygen: true, hasSuction: true, hasMonitor: true, isIsolation: true },
];

// Calculate statistics
export function calculateWardStats(patients: WardPatient[], beds: WardBed[]): WardStats {
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);
  
  const activePatients = patients.filter(p => p.status !== 'discharged');
  const totalPatients = activePatients.length;
  
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const newAdmissions = patients.filter(p => p.admissionDate >= todayStart).length;
  
  const pendingDischarges = patients.filter(p => p.status === 'pending-discharge').length;
  const criticalPatients = patients.filter(p => p.status === 'critical').length;
  
  const isolationBeds = beds.filter(b => b.isIsolation && b.status === 'occupied').length;
  
  // Calculate average length of stay
  const losData = activePatients.map(p => {
    const diff = today.getTime() - p.admissionDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  });
  const averageLengthOfStay = losData.length > 0
    ? Math.round(losData.reduce((a, b) => a + b, 0) / losData.length)
    : 0;
  
  return {
    totalBeds,
    occupiedBeds,
    availableBeds,
    occupancyRate,
    totalPatients,
    newAdmissions,
    pendingDischarges,
    criticalPatients,
    isolationBeds,
    averageLengthOfStay,
  };
}










