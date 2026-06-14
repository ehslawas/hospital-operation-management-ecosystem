import type { Mother, MaternityBed, MaternityStats, PrenatalVisit, PartographEntry, APGARScore } from '../types/Maternity';

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

// Mock mothers with various stages
export const mockMothers: Mother[] = [
  // Active labour case 1 - first time mother
  {
    id: 'MAT001',
    registrationNumber: 'MW2025-0001',
    name: 'Nur Aisyah binti Rahman',
    age: 26,
    icNumber: '980512-10-2345',
    contactNumber: '012-3456789',
    status: 'active-labour',
    gravida: 1,
    para: 0,
    abortions: 0,
    livingChildren: 0,
    lmp: new Date(2024, 3, 15),
    edd: new Date(2025, 0, 20),
    gestationalAge: '39w 2d',
    gestationalWeeks: 39,
    riskLevel: 'low',
    riskFactors: [],
    bloodType: 'O+',
    allergies: [],
    medicalConditions: [],
    previousComplications: [],
    prenatalVisits: [],
    admittedAt: randomHoursAgo(6, 8),
    bedNumber: 'LR-01',
    assignedMidwife: 'Midwife Zainab',
    assignedDoctor: 'Dr. Nora',
    labour: {
      startTime: randomHoursAgo(8, 10),
      stage: 'active',
      ruptureOfMembranes: randomHoursAgo(4, 6),
      membranesStatus: 'ruptured-spontaneous',
      liquorColor: 'clear',
      partograph: [
        {
          id: 'PE001',
          time: randomHoursAgo(8, 9),
          hoursInLabour: 0,
          cervicalDilation: 3,
          contractionsPerTenMin: 2,
          contractionDuration: 30,
          contractionStrength: 'mild',
          fetalHeartRate: 140,
          fetalHeartRatePattern: 'reassuring',
          maternalBP: '120/75',
          maternalPulse: 85,
          maternalTemp: 36.8,
          recordedBy: 'Midwife Zainab',
        },
        {
          id: 'PE002',
          time: randomHoursAgo(6, 7),
          hoursInLabour: 2,
          cervicalDilation: 5,
          contractionsPerTenMin: 3,
          contractionDuration: 45,
          contractionStrength: 'moderate',
          fetalHeartRate: 145,
          fetalHeartRatePattern: 'reassuring',
          maternalBP: '125/78',
          maternalPulse: 90,
          maternalTemp: 37.0,
          recordedBy: 'Midwife Zainab',
        },
        {
          id: 'PE003',
          time: randomHoursAgo(4, 5),
          hoursInLabour: 4,
          cervicalDilation: 7,
          contractionsPerTenMin: 4,
          contractionDuration: 60,
          contractionStrength: 'strong',
          fetalHeartRate: 142,
          fetalHeartRatePattern: 'reassuring',
          maternalBP: '130/80',
          maternalPulse: 95,
          maternalTemp: 37.1,
          drugsGiven: 'Entonox',
          recordedBy: 'Midwife Zainab',
        },
      ],
      currentDilation: 7,
      currentEffacement: 80,
      currentStation: 0,
      painRelief: ['Entonox'],
      epidural: false,
      complications: [],
    },
  },
  
  // Active labour case 2 - high risk, previous C-section
  {
    id: 'MAT002',
    registrationNumber: 'MW2025-0002',
    name: 'Siti Maryam binti Hassan',
    age: 33,
    icNumber: '910825-10-3456',
    contactNumber: '019-8765432',
    status: 'active-labour',
    gravida: 3,
    para: 2,
    abortions: 0,
    livingChildren: 2,
    lmp: new Date(2024, 3, 10),
    edd: new Date(2025, 0, 15),
    gestationalAge: '39w 5d',
    gestationalWeeks: 39,
    riskLevel: 'moderate',
    riskFactors: ['Previous C-section', 'VBAC attempt'],
    bloodType: 'A+',
    allergies: [],
    medicalConditions: ['Gestational Diabetes (controlled)'],
    previousComplications: ['Previous caesarean section (2020)'],
    prenatalVisits: [],
    admittedAt: randomHoursAgo(3, 4),
    bedNumber: 'LR-02',
    assignedMidwife: 'Midwife Ros',
    assignedDoctor: 'Dr. Kumar',
    labour: {
      startTime: randomHoursAgo(5, 6),
      stage: 'active',
      ruptureOfMembranes: randomHoursAgo(2, 3),
      membranesStatus: 'ruptured-artificial',
      liquorColor: 'clear',
      partograph: [
        {
          id: 'PE004',
          time: randomHoursAgo(5, 6),
          hoursInLabour: 0,
          cervicalDilation: 4,
          contractionsPerTenMin: 3,
          contractionDuration: 40,
          contractionStrength: 'moderate',
          fetalHeartRate: 138,
          fetalHeartRatePattern: 'reassuring',
          maternalBP: '135/85',
          maternalPulse: 88,
          maternalTemp: 36.9,
          recordedBy: 'Midwife Ros',
        },
        {
          id: 'PE005',
          time: randomHoursAgo(3, 4),
          hoursInLabour: 2,
          cervicalDilation: 6,
          contractionsPerTenMin: 4,
          contractionDuration: 50,
          contractionStrength: 'strong',
          fetalHeartRate: 140,
          fetalHeartRatePattern: 'reassuring',
          maternalBP: '138/87',
          maternalPulse: 92,
          maternalTemp: 37.0,
          drugsGiven: 'Pethidine 50mg IM',
          recordedBy: 'Midwife Ros',
        },
      ],
      currentDilation: 6,
      currentEffacement: 70,
      currentStation: -1,
      painRelief: ['Pethidine'],
      epidural: false,
      complications: [],
    },
  },
  
  // Postnatal case - delivered 6 hours ago
  {
    id: 'MAT003',
    registrationNumber: 'MW2025-0003',
    name: 'Letchumi a/p Ramasamy',
    age: 29,
    icNumber: '950315-05-4567',
    contactNumber: '013-2345678',
    status: 'postnatal',
    gravida: 2,
    para: 2,
    abortions: 0,
    livingChildren: 2,
    lmp: new Date(2024, 3, 20),
    edd: new Date(2025, 0, 25),
    gestationalAge: '38w 6d',
    gestationalWeeks: 38,
    riskLevel: 'low',
    riskFactors: [],
    bloodType: 'B+',
    allergies: [],
    medicalConditions: [],
    previousComplications: [],
    prenatalVisits: [],
    admittedAt: randomHoursAgo(12, 14),
    bedNumber: 'PN-03',
    assignedMidwife: 'Midwife Aini',
    assignedDoctor: 'Dr. Nora',
    delivery: {
      id: 'DEL001',
      deliveryTime: randomHoursAgo(6, 7),
      deliveryType: 'normal-vaginal',
      labourDuration: 420, // 7 hours
      presentation: 'Vertex',
      episiotomy: false,
      perinealTear: 'First degree tear',
      bloodLoss: 250,
      placentaDelivered: addDays(randomHoursAgo(6, 7), 0),
      placentaComplete: true,
      placentaWeight: 580,
      complications: [],
      deliveredBy: 'Dr. Nora',
      assistedBy: ['Midwife Aini'],
      newborn: {
        id: 'NB001',
        motherId: 'MAT003',
        name: 'Baby Letchumi',
        gender: 'Female',
        birthTime: randomHoursAgo(6, 7),
        birthWeight: 3200,
        birthLength: 50,
        headCircumference: 34,
        apgar1Min: {
          score: 9,
          appearance: 2,
          pulse: 2,
          grimace: 2,
          activity: 2,
          respiration: 1,
          time: randomHoursAgo(6, 7),
          assessedBy: 'Dr. Nora',
        },
        apgar5Min: {
          score: 10,
          appearance: 2,
          pulse: 2,
          grimace: 2,
          activity: 2,
          respiration: 2,
          time: addDays(randomHoursAgo(6, 7), 0),
          assessedBy: 'Dr. Nora',
        },
        appearance: 'Pink, active',
        cry: 'Strong',
        tone: 'Good',
        breathing: 'Regular',
        resuscitationNeeded: false,
        vitaminKGiven: true,
        eyeProphylaxis: true,
        hepatitisB: true,
        status: 'with-mother',
        complications: [],
        feedingType: 'breastfeeding',
        firstFeed: addDays(randomHoursAgo(6, 7), 0),
      },
    },
  },
  
  // Prenatal high-risk case
  {
    id: 'MAT004',
    registrationNumber: 'MW2025-0004',
    name: 'Farah Natasha binti Aziz',
    age: 38,
    icNumber: '861120-10-5678',
    contactNumber: '017-9876543',
    status: 'prenatal',
    gravida: 4,
    para: 2,
    abortions: 1,
    livingChildren: 2,
    lmp: new Date(2024, 4, 1),
    edd: new Date(2025, 1, 5),
    gestationalAge: '36w 3d',
    gestationalWeeks: 36,
    riskLevel: 'high',
    riskFactors: ['Advanced maternal age', 'Placenta previa', 'Previous miscarriage'],
    bloodType: 'AB-',
    allergies: ['Penicillin'],
    medicalConditions: ['Placenta previa', 'Hypothyroidism'],
    previousComplications: ['Miscarriage (2022)', 'PPH (2019)'],
    prenatalVisits: [
      {
        id: 'PV001',
        date: randomDaysAgo(7, 10),
        gestationalAge: '35w 5d',
        weight: 68,
        bloodPressure: '128/82',
        fundalHeight: 34,
        fetalHeartRate: 142,
        presentation: 'Cephalic',
        complaints: 'Mild spotting',
        notes: 'Placenta previa stable. Advised bed rest. Scheduled for elective C-section at 37 weeks.',
        attendedBy: 'Dr. Kumar',
        nextVisit: addDays(new Date(), 7),
      },
    ],
    nextAppointment: addDays(new Date(), 7),
    admittedAt: randomDaysAgo(2, 3),
    bedNumber: 'HR-01',
    assignedMidwife: 'Midwife Sarah',
    assignedDoctor: 'Dr. Kumar',
  },
  
  // Prenatal low-risk case
  {
    id: 'MAT005',
    registrationNumber: 'MW2025-0005',
    name: 'Nurul Hidayah binti Ahmad',
    age: 24,
    icNumber: '000810-14-6789',
    contactNumber: '011-3456789',
    status: 'prenatal',
    gravida: 1,
    para: 0,
    abortions: 0,
    livingChildren: 0,
    lmp: new Date(2024, 5, 10),
    edd: new Date(2025, 2, 17),
    gestationalAge: '30w 1d',
    gestationalWeeks: 30,
    riskLevel: 'low',
    riskFactors: [],
    bloodType: 'O+',
    allergies: [],
    medicalConditions: [],
    previousComplications: [],
    prenatalVisits: [
      {
        id: 'PV002',
        date: randomDaysAgo(14, 16),
        gestationalAge: '28w 3d',
        weight: 62,
        bloodPressure: '115/72',
        fundalHeight: 28,
        fetalHeartRate: 145,
        presentation: 'Cephalic',
        notes: 'Normal progress. All vitals stable.',
        attendedBy: 'Midwife Zainab',
        nextVisit: addDays(new Date(), 14),
      },
    ],
    nextAppointment: addDays(new Date(), 14),
  },
];

// Mock beds
export const mockMaternityBeds: MaternityBed[] = [
  // Labour rooms
  { id: 'LR-01', roomNumber: 'LR', bedNumber: '01', ward: 'Labour', status: 'occupied', motherId: 'MAT001', assignedAt: randomHoursAgo(6, 8) },
  { id: 'LR-02', roomNumber: 'LR', bedNumber: '02', ward: 'Labour', status: 'occupied', motherId: 'MAT002', assignedAt: randomHoursAgo(3, 4) },
  { id: 'LR-03', roomNumber: 'LR', bedNumber: '03', ward: 'Labour', status: 'available' },
  { id: 'LR-04', roomNumber: 'LR', bedNumber: '04', ward: 'Labour', status: 'cleaning' },
  
  // Postnatal
  { id: 'PN-01', roomNumber: 'PN', bedNumber: '01', ward: 'Postnatal', status: 'available' },
  { id: 'PN-02', roomNumber: 'PN', bedNumber: '02', ward: 'Postnatal', status: 'available' },
  { id: 'PN-03', roomNumber: 'PN', bedNumber: '03', ward: 'Postnatal', status: 'occupied', motherId: 'MAT003', assignedAt: randomHoursAgo(12, 14) },
  { id: 'PN-04', roomNumber: 'PN', bedNumber: '04', ward: 'Postnatal', status: 'available' },
  
  // High-risk
  { id: 'HR-01', roomNumber: 'HR', bedNumber: '01', ward: 'High-Risk', status: 'occupied', motherId: 'MAT004', assignedAt: randomDaysAgo(2, 3) },
  { id: 'HR-02', roomNumber: 'HR', bedNumber: '02', ward: 'High-Risk', status: 'available' },
  
  // Prenatal
  { id: 'PRE-01', roomNumber: 'PRE', bedNumber: '01', ward: 'Prenatal', status: 'available' },
  { id: 'PRE-02', roomNumber: 'PRE', bedNumber: '02', ward: 'Prenatal', status: 'available' },
];

// Calculate statistics
export function calculateMaternityStats(mothers: Mother[], beds: MaternityBed[]): MaternityStats {
  const totalPatients = mothers.filter(m => m.status !== 'discharged').length;
  const prenatal = mothers.filter(m => m.status === 'prenatal').length;
  const inLabour = mothers.filter(m => m.status === 'active-labour' || m.status === 'delivery').length;
  const postnatal = mothers.filter(m => m.status === 'postnatal').length;
  
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deliveriesToday = mothers.filter(m => 
    m.delivery && m.delivery.deliveryTime >= todayStart
  ).length;
  
  const totalDeliveries = mothers.filter(m => m.delivery).length;
  const caesareans = mothers.filter(m => 
    m.delivery && (m.delivery.deliveryType === 'caesarean-elective' || m.delivery.deliveryType === 'caesarean-emergency')
  ).length;
  const caesareanRate = totalDeliveries > 0 ? Math.round((caesareans / totalDeliveries) * 100) : 0;
  
  const labourDurations = mothers
    .filter(m => m.delivery)
    .map(m => m.delivery!.labourDuration);
  const averageLabourDuration = labourDurations.length > 0
    ? Math.round((labourDurations.reduce((a, b) => a + b, 0) / labourDurations.length) / 60) // convert to hours
    : 0;
  
  const highRiskCases = mothers.filter(m => m.riskLevel === 'high' && m.status !== 'discharged').length;
  
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const totalBeds = beds.length;
  
  return {
    totalPatients,
    prenatal,
    inLabour,
    postnatal,
    deliveriesToday,
    caesareanRate,
    averageLabourDuration,
    highRiskCases,
    availableBeds,
    totalBeds,
  };
}










