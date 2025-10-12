import type { TestOrder, Sample, QualityControl, LabStats, LabEquipment, TestResult } from '../types/Lab';

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

// Mock test orders from various departments
export const mockTestOrders: TestOrder[] = [
  {
    id: 'LAB001',
    orderNumber: 'L2025-0001',
    patientId: 'EP001',
    patientName: 'Ahmad bin Abdullah',
    patientAge: 45,
    patientGender: 'Male',
    patientIC: '790512-14-5678',
    testName: 'Troponin I',
    testCode: 'TROP',
    category: 'Clinical Chemistry',
    priority: 'stat',
    status: 'analyzing',
    orderingDepartment: 'Emergency & Trauma',
    orderingDoctor: 'Dr. Rahman',
    orderedAt: randomMinutesAgo(15, 25),
    clinicalNotes: 'Suspected ACS, chest pain',
    sampleType: 'Blood',
    sampleId: 'S2025-0001',
    collectedAt: randomMinutesAgo(10, 15),
    collectedBy: 'Nurse Siti',
    receivedAt: randomMinutesAgo(8, 12),
    receivedBy: 'Lab Tech Ahmad',
    analyzedAt: randomMinutesAgo(5, 8),
    analyzedBy: 'Lab Tech Ahmad',
    isCritical: true,
  },
  {
    id: 'LAB002',
    orderNumber: 'L2025-0002',
    patientId: 'EP001',
    patientName: 'Ahmad bin Abdullah',
    patientAge: 45,
    patientGender: 'Male',
    patientIC: '790512-14-5678',
    testName: 'Full Blood Count',
    testCode: 'FBC',
    category: 'Haematology',
    priority: 'urgent',
    status: 'completed',
    orderingDepartment: 'Emergency & Trauma',
    orderingDoctor: 'Dr. Rahman',
    orderedAt: randomMinutesAgo(20, 30),
    clinicalNotes: 'R/O anemia',
    sampleType: 'Blood',
    sampleId: 'S2025-0002',
    collectedAt: randomMinutesAgo(15, 20),
    collectedBy: 'Nurse Siti',
    receivedAt: randomMinutesAgo(12, 18),
    receivedBy: 'Lab Tech Mei Ling',
    analyzedAt: randomMinutesAgo(8, 12),
    analyzedBy: 'Lab Tech Mei Ling',
    validatedAt: randomMinutesAgo(5, 8),
    validatedBy: 'Dr. Tan (MLS)',
    reportedAt: randomMinutesAgo(3, 5),
    result: {
      testId: 'LAB002',
      parameters: [
        { name: 'Haemoglobin', value: 13.5, unit: 'g/dL', referenceRange: '13.0-17.0', flag: 'normal' },
        { name: 'WBC', value: 8.2, unit: '×10⁹/L', referenceRange: '4.0-11.0', flag: 'normal' },
        { name: 'Platelets', value: 250, unit: '×10⁹/L', referenceRange: '150-400', flag: 'normal' },
        { name: 'RBC', value: 4.8, unit: '×10¹²/L', referenceRange: '4.5-5.9', flag: 'normal' },
      ],
      status: 'final',
      enteredBy: 'Lab Tech Mei Ling',
      enteredAt: randomMinutesAgo(8, 12),
    },
  },
  {
    id: 'LAB003',
    orderNumber: 'L2025-0003',
    patientId: 'EP003',
    patientName: 'Tan Chee Keong',
    patientAge: 67,
    patientGender: 'Male',
    patientIC: '570315-08-3456',
    testName: 'Renal Function Test',
    testCode: 'RFT',
    category: 'Clinical Chemistry',
    priority: 'urgent',
    status: 'completed',
    orderingDepartment: 'Emergency & Trauma',
    orderingDoctor: 'Dr. Wong',
    orderedAt: randomHoursAgo(1, 2),
    clinicalNotes: 'COPD exacerbation, assess renal function',
    sampleType: 'Blood',
    sampleId: 'S2025-0003',
    collectedAt: randomMinutesAgo(50, 60),
    collectedBy: 'Nurse Farah',
    receivedAt: randomMinutesAgo(45, 55),
    receivedBy: 'Lab Tech Kumar',
    analyzedAt: randomMinutesAgo(35, 45),
    analyzedBy: 'Lab Tech Kumar',
    validatedAt: randomMinutesAgo(30, 35),
    validatedBy: 'Dr. Lim (MLS)',
    reportedAt: randomMinutesAgo(28, 32),
    result: {
      testId: 'LAB003',
      parameters: [
        { name: 'Urea', value: 8.5, unit: 'mmol/L', referenceRange: '2.5-7.8', flag: 'high' },
        { name: 'Creatinine', value: 125, unit: 'µmol/L', referenceRange: '60-110', flag: 'high' },
        { name: 'eGFR', value: 52, unit: 'mL/min/1.73m²', referenceRange: '>60', flag: 'low' },
        { name: 'Sodium', value: 138, unit: 'mmol/L', referenceRange: '135-145', flag: 'normal' },
        { name: 'Potassium', value: 4.2, unit: 'mmol/L', referenceRange: '3.5-5.0', flag: 'normal' },
      ],
      interpretation: 'Mild renal impairment. eGFR suggests CKD Stage 3a.',
      status: 'final',
      enteredBy: 'Lab Tech Kumar',
      enteredAt: randomMinutesAgo(35, 45),
    },
  },
  {
    id: 'LAB004',
    orderNumber: 'L2025-0004',
    patientId: 'GW001',
    patientName: 'Nurul Ain binti Ismail',
    patientAge: 55,
    patientGender: 'Female',
    patientIC: '690203-10-1234',
    testName: 'Blood Glucose',
    testCode: 'GLUC',
    category: 'Clinical Chemistry',
    priority: 'routine',
    status: 'processing',
    orderingDepartment: 'General Ward',
    orderingDoctor: 'Dr. Azizah',
    orderedAt: randomMinutesAgo(45, 60),
    clinicalNotes: 'Diabetes monitoring',
    sampleType: 'Blood',
    sampleId: 'S2025-0004',
    collectedAt: randomMinutesAgo(30, 40),
    collectedBy: 'Nurse Halim',
    receivedAt: randomMinutesAgo(25, 35),
    receivedBy: 'Lab Tech Sarah',
  },
  {
    id: 'LAB005',
    orderNumber: 'L2025-0005',
    patientId: 'GW002',
    patientName: 'Raj Kumar a/l Suresh',
    patientAge: 42,
    patientGender: 'Male',
    patientIC: '820715-14-5678',
    testName: 'Liver Function Test',
    testCode: 'LFT',
    category: 'Clinical Chemistry',
    priority: 'routine',
    status: 'collected',
    orderingDepartment: 'General Ward',
    orderingDoctor: 'Dr. Azizah',
    orderedAt: randomHoursAgo(2, 3),
    clinicalNotes: 'Hepatitis screening',
    sampleType: 'Blood',
    sampleId: 'S2025-0005',
    collectedAt: randomHoursAgo(1, 2),
    collectedBy: 'Nurse Halim',
  },
  {
    id: 'LAB006',
    orderNumber: 'L2025-0006',
    patientId: 'PW001',
    patientName: 'Muhammad Haris bin Yusof',
    patientAge: 5,
    patientGender: 'Male',
    patientIC: '190825-10-2345',
    testName: 'Blood Culture',
    testCode: 'BLDCX',
    category: 'Microbiology',
    priority: 'urgent',
    status: 'processing',
    orderingDepartment: 'Paediatric Ward',
    orderingDoctor: 'Dr. Salmah',
    orderedAt: randomHoursAgo(3, 4),
    clinicalNotes: 'Fever of unknown origin, R/O sepsis',
    sampleType: 'Blood',
    sampleId: 'S2025-0006',
    collectedAt: randomHoursAgo(2, 3),
    collectedBy: 'Nurse Aida',
    receivedAt: randomHoursAgo(2, 3),
    receivedBy: 'Lab Tech Muthu',
  },
  {
    id: 'LAB007',
    orderNumber: 'L2025-0007',
    patientId: 'MW001',
    patientName: 'Siti Maryam binti Hassan',
    patientAge: 28,
    patientGender: 'Female',
    patientIC: '960512-10-3456',
    testName: 'Blood Group & Rh',
    testCode: 'BGRH',
    category: 'Blood Bank',
    priority: 'stat',
    status: 'completed',
    orderingDepartment: 'Maternity Ward',
    orderingDoctor: 'Dr. Nora',
    orderedAt: randomMinutesAgo(120, 150),
    clinicalNotes: 'Pre-delivery preparation',
    sampleType: 'Blood',
    sampleId: 'S2025-0007',
    collectedAt: randomMinutesAgo(110, 120),
    collectedBy: 'Nurse Zahra',
    receivedAt: randomMinutesAgo(105, 115),
    receivedBy: 'Lab Tech Devi',
    analyzedAt: randomMinutesAgo(95, 105),
    analyzedBy: 'Lab Tech Devi',
    validatedAt: randomMinutesAgo(90, 95),
    validatedBy: 'Dr. Chan (MLS)',
    reportedAt: randomMinutesAgo(88, 92),
    result: {
      testId: 'LAB007',
      parameters: [
        { name: 'Blood Group', value: 'O', unit: '', referenceRange: 'A/B/AB/O', flag: 'normal' },
        { name: 'Rh Factor', value: 'Positive', unit: '', referenceRange: 'Positive/Negative', flag: 'normal' },
      ],
      status: 'final',
      enteredBy: 'Lab Tech Devi',
      enteredAt: randomMinutesAgo(95, 105),
    },
  },
  {
    id: 'LAB008',
    orderNumber: 'L2025-0008',
    patientId: 'GW003',
    patientName: 'Lee Chin Huat',
    patientAge: 70,
    patientGender: 'Male',
    patientIC: '540820-08-4567',
    testName: 'Urinalysis',
    testCode: 'URINE',
    category: 'Clinical Chemistry',
    priority: 'routine',
    status: 'pending',
    orderingDepartment: 'General Ward',
    orderingDoctor: 'Dr. Kamala',
    orderedAt: randomMinutesAgo(30, 45),
    clinicalNotes: 'UTI screening',
    sampleType: 'Urine',
  },
];

// Mock samples
export const mockSamples: Sample[] = [
  {
    id: 'S2025-0001',
    barcode: 'BC20250001',
    patientId: 'EP001',
    patientName: 'Ahmad bin Abdullah',
    type: 'Blood',
    collectedAt: randomMinutesAgo(10, 15),
    collectedBy: 'Nurse Siti',
    receivedAt: randomMinutesAgo(8, 12),
    status: 'processing',
    linkedTests: ['LAB001'],
    volume: '5mL',
    containerType: 'EDTA tube',
    storageLocation: 'Fridge A2',
  },
  {
    id: 'S2025-0002',
    barcode: 'BC20250002',
    patientId: 'EP001',
    patientName: 'Ahmad bin Abdullah',
    type: 'Blood',
    collectedAt: randomMinutesAgo(15, 20),
    collectedBy: 'Nurse Siti',
    receivedAt: randomMinutesAgo(12, 18),
    status: 'stored',
    linkedTests: ['LAB002'],
    volume: '3mL',
    containerType: 'EDTA tube',
    storageLocation: 'Fridge A3',
  },
  {
    id: 'S2025-0003',
    barcode: 'BC20250003',
    patientId: 'EP003',
    patientName: 'Tan Chee Keong',
    type: 'Blood',
    collectedAt: randomMinutesAgo(50, 60),
    collectedBy: 'Nurse Farah',
    receivedAt: randomMinutesAgo(45, 55),
    status: 'stored',
    linkedTests: ['LAB003'],
    volume: '5mL',
    containerType: 'SST tube',
    storageLocation: 'Fridge B1',
  },
];

// Mock quality control data
export const mockQualityControls: QualityControl[] = [
  {
    id: 'QC001',
    testName: 'Haemoglobin',
    category: 'Haematology',
    controlLevel: 'Level 1',
    date: new Date(),
    performedBy: 'Lab Tech Mei Ling',
    measurements: [
      { parameter: 'HGB', value: 12.5, expectedValue: 12.3, acceptableRange: '11.5-13.1', isInRange: true },
    ],
    mean: 12.5,
    sd: 0.3,
    cv: 2.4,
    isAcceptable: true,
  },
  {
    id: 'QC002',
    testName: 'Glucose',
    category: 'Clinical Chemistry',
    controlLevel: 'Level 2',
    date: new Date(),
    performedBy: 'Lab Tech Kumar',
    measurements: [
      { parameter: 'GLUC', value: 5.8, expectedValue: 5.5, acceptableRange: '5.0-6.0', isInRange: true },
    ],
    mean: 5.8,
    sd: 0.25,
    cv: 4.3,
    isAcceptable: true,
  },
];

// Mock equipment
export const mockLabEquipment: LabEquipment[] = [
  {
    id: 'EQ001',
    name: 'Haematology Analyzer',
    model: 'Sysmex XN-1000',
    category: 'Haematology',
    status: 'operational',
    location: 'Lab Room 1',
    lastMaintenance: new Date(2024, 11, 15),
    nextMaintenance: new Date(2025, 2, 15),
    currentLoad: 45,
    maxCapacity: 100,
  },
  {
    id: 'EQ002',
    name: 'Chemistry Analyzer',
    model: 'Roche Cobas c311',
    category: 'Clinical Chemistry',
    status: 'operational',
    location: 'Lab Room 2',
    lastMaintenance: new Date(2024, 11, 20),
    nextMaintenance: new Date(2025, 2, 20),
    currentLoad: 62,
    maxCapacity: 120,
  },
  {
    id: 'EQ003',
    name: 'Blood Culture System',
    model: 'BD BACTEC FX',
    category: 'Microbiology',
    status: 'operational',
    location: 'Lab Room 3',
    lastMaintenance: new Date(2024, 10, 10),
    nextMaintenance: new Date(2025, 1, 10),
    currentLoad: 15,
    maxCapacity: 50,
  },
  {
    id: 'EQ004',
    name: 'Immunoassay Analyzer',
    model: 'Abbott Architect i2000SR',
    category: 'Immunology',
    status: 'calibration',
    location: 'Lab Room 2',
    lastMaintenance: new Date(2025, 0, 5),
    nextMaintenance: new Date(2025, 3, 5),
    currentLoad: 0,
    maxCapacity: 200,
  },
];

// Calculate lab statistics
export function calculateLabStats(orders: TestOrder[]): LabStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const pending = orders.filter(o => o.status === 'pending' || o.status === 'collected').length;
  const inProgress = orders.filter(o => o.status === 'processing' || o.status === 'analyzing' || o.status === 'validating').length;
  const completed = orders.filter(o => o.status === 'completed').length;
  const critical = orders.filter(o => o.isCritical).length;
  
  const todayOrders = orders.filter(o => o.orderedAt >= todayStart);
  const todayCompleted = todayOrders.filter(o => o.status === 'completed').length;
  const todayPending = todayOrders.filter(o => o.status !== 'completed' && o.status !== 'rejected').length;
  
  // Calculate turnaround times
  const completedOrders = orders.filter(o => o.status === 'completed' && o.reportedAt);
  const turnaroundTimes = completedOrders.map(o => {
    if (o.reportedAt) {
      return (o.reportedAt.getTime() - o.orderedAt.getTime()) / (1000 * 60);
    }
    return 0;
  });
  
  const avgTurnaroundTime = turnaroundTimes.length > 0
    ? Math.round(turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length)
    : 0;
  
  // Longest waiting order
  const waitingOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'rejected');
  const waitTimes = waitingOrders.map(o => (now.getTime() - o.orderedAt.getTime()) / (1000 * 60));
  const longestWaitingOrder = waitTimes.length > 0 ? Math.round(Math.max(...waitTimes)) : 0;
  
  return {
    totalOrders: orders.length,
    pending,
    inProgress,
    completed,
    critical,
    avgTurnaroundTime,
    longestWaitingOrder,
    todayCompleted,
    todayPending,
  };
}







