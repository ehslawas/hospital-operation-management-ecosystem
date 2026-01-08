import type { 
  EmergencyPatient, 
  EmergencyBed, 
  TriageStats, 
  VitalSigns, 
  IncomingPatient,
  TimelineEvent,
  DepartmentMetrics,
  WaitTimeMetrics,
  AmbulanceMetrics
} from '../types/Patient';

// Helper to generate random times
const randomMinutesAgo = (min: number, max: number) => {
  const minutes = Math.floor(Math.random() * (max - min) + min);
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date;
};

const randomMinutesFromNow = (min: number, max: number) => {
  const minutes = Math.floor(Math.random() * (max - min) + min);
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

// Mock vital signs
const generateVitals = (recordedBy: string): VitalSigns => ({
  bloodPressure: `${Math.floor(Math.random() * 40 + 110)}/${Math.floor(Math.random() * 30 + 70)}`,
  heartRate: Math.floor(Math.random() * 40 + 60),
  temperature: Math.round((Math.random() * 2 + 36.5) * 10) / 10,
  respiratoryRate: Math.floor(Math.random() * 8 + 14),
  oxygenSaturation: Math.floor(Math.random() * 5 + 95),
  painScore: Math.floor(Math.random() * 11),
  gcs: '15/15',
  recordedAt: new Date(),
  recordedBy,
});

const createTimeline = (events: Partial<TimelineEvent>[]): TimelineEvent[] => {
  return events.map((e, idx) => ({
    id: `TL${idx + 1}`,
    timestamp: e.timestamp || new Date(),
    type: e.type || 'note',
    description: e.description || '',
    actor: e.actor || 'System',
    details: e.details,
  }));
};

// Comprehensive mock patients with complete clinical journeys
export const mockEmergencyPatients: EmergencyPatient[] = [
  // P1 - STEMI Case
  {
    id: 'EP001',
    registrationNumber: 'ER2025-0001',
    name: 'Ahmad bin Abdullah',
    age: 45,
    gender: 'Male',
    icNumber: '790512-14-5678',
    contactNumber: '019-2345678',
    nextOfKin: 'Fatimah binti Hassan (Wife)',
    nextOfKinContact: '019-9876543',
    address: 'No 12, Jalan Merdeka, Kuala Lumpur',
    
    arrivalMode: 'ambulance',
    arrivalTime: randomMinutesAgo(35, 45),
    ambulanceInfo: {
      callTime: randomMinutesAgo(50, 60),
      dispatchTime: randomMinutesAgo(48, 58),
      arrivalTime: randomMinutesAgo(35, 45),
      ambulanceId: 'AMB-001',
      paramedic: 'Paramedic Razak',
      mechanism: 'Medical - Cardiac',
      preHospitalTreatment: 'Aspirin 300mg given, O2 via face mask 10L/min, IV line established',
      estimatedInjuries: 'Suspected acute coronary syndrome',
    },
    
    triageLevel: 'P1',
    chiefComplaint: 'Severe crushing chest pain radiating to left arm, shortness of breath',
    triageTime: randomMinutesAgo(33, 43),
    triageNurse: 'Siti Nurhaliza',
    triageNotes: 'Patient pale, diaphoretic. Chest pain 10/10. ECG shows ST elevation in leads V2-V4.',
    
    trauma: {
      activated: false,
      level: 'none',
      mechanism: 'N/A',
    },
    
    status: 'in-treatment',
    assignedBed: 'R1-01',
    assignedDoctor: 'Dr. Rahman Hassan',
    assignedNurse: 'Nurse Azizah',
    
    vitals: [
      {
        bloodPressure: '150/95',
        heartRate: 95,
        temperature: 37.2,
        respiratoryRate: 22,
        oxygenSaturation: 94,
        painScore: 10,
        gcs: '15/15',
        recordedAt: randomMinutesAgo(32, 42),
        recordedBy: 'Nurse Azizah',
      },
      {
        bloodPressure: '135/85',
        heartRate: 88,
        temperature: 37.1,
        respiratoryRate: 18,
        oxygenSaturation: 98,
        painScore: 6,
        gcs: '15/15',
        recordedAt: randomMinutesAgo(15, 20),
        recordedBy: 'Nurse Azizah',
      },
    ],
    
    history: {
      presentingComplaint: 'Severe crushing chest pain radiating to left arm',
      historyOfPresentingComplaint: 'Patient developed sudden onset severe chest pain while at work approximately 1 hour ago. Pain described as crushing, 10/10 severity, radiating to left arm and jaw. Associated with shortness of breath, nausea, and diaphoresis. No relief with rest.',
      pastMedicalHistory: ['Hypertension (5 years)', 'Diabetes Mellitus Type 2 (3 years)', 'Hyperlipidemia'],
      pastSurgicalHistory: ['Appendectomy (2010)'],
      medications: ['Amlodipine 10mg OD', 'Metformin 500mg BD', 'Atorvastatin 20mg ON'],
      allergies: ['Penicillin - Rash'],
      socialHistory: 'Smoker 20 cigarettes/day x 25 years. Occasional alcohol. Works as a clerk.',
      familyHistory: 'Father died of MI at age 55. Mother has hypertension.',
    },
    
    examination: {
      general: 'Alert, in pain, pale, diaphoretic',
      cardiovascular: 'Heart sounds dual, no murmur. No JVP elevation. Peripheral pulses palpable.',
      respiratory: 'Bilateral air entry equal. No crepitations or wheeze.',
      abdominal: 'Soft, non-tender, no organomegaly',
      neurological: 'GCS 15/15, no focal neurological deficit',
      examinedBy: 'Dr. Rahman Hassan',
      examinedAt: randomMinutesAgo(25, 30),
    },
    
    assessmentNotes: 'Acute ST-Elevation Myocardial Infarction (STEMI) - Anterior wall. High risk patient with multiple cardiovascular risk factors.',
    differentialDiagnosis: ['STEMI', 'Unstable angina', 'Aortic dissection', 'Pulmonary embolism'],
    finalDiagnosis: 'Acute STEMI - Anterior wall',
    treatmentPlan: 'Emergency PCI arranged. Cardiology consultation done. Dual antiplatelet therapy initiated. Heparin infusion started. Transfer to CCU post-procedure.',
    
    clinicalNotes: [
      {
        id: 'CN001',
        timestamp: randomMinutesAgo(30, 35),
        author: 'Dr. Rahman Hassan',
        type: 'assessment',
        content: 'Initial assessment: STEMI confirmed on ECG. Cardiology team activated. Patient consented for emergency PCI.',
      },
      {
        id: 'CN002',
        timestamp: randomMinutesAgo(20, 25),
        author: 'Dr. Lim (Cardiology)',
        type: 'consultation',
        content: 'Cardiology review: Patient suitable for primary PCI. Cath lab activated. ETA 15 minutes.',
      },
    ],
    
    labOrders: [
      {
        id: 'LAB001',
        patientId: 'EP001',
        testName: 'Troponin I',
        priority: 'stat',
        orderedBy: 'Dr. Rahman',
        orderedAt: randomMinutesAgo(28, 33),
        status: 'completed',
        results: 'Troponin I: 2.5 ng/mL (Highly elevated)',
        completedAt: randomMinutesAgo(15, 18),
      },
      {
        id: 'LAB002',
        patientId: 'EP001',
        testName: 'Full Blood Count',
        priority: 'urgent',
        orderedBy: 'Dr. Rahman',
        orderedAt: randomMinutesAgo(28, 33),
        status: 'completed',
        results: 'Hb 14.2, WBC 11.5, Plt 245',
        completedAt: randomMinutesAgo(15, 18),
      },
      {
        id: 'LAB003',
        patientId: 'EP001',
        testName: 'Renal Profile, Lipid Profile',
        priority: 'urgent',
        orderedBy: 'Dr. Rahman',
        orderedAt: randomMinutesAgo(28, 33),
        status: 'in-progress',
      },
    ],
    
    radiologyOrders: [
      {
        id: 'RAD001',
        patientId: 'EP001',
        examType: 'Chest X-Ray',
        bodyPart: 'Chest',
        priority: 'stat',
        clinicalIndication: 'STEMI, assess cardiac silhouette and pulmonary congestion',
        orderedBy: 'Dr. Rahman',
        orderedAt: randomMinutesAgo(25, 30),
        status: 'completed',
        findings: 'Normal cardiac size. No pulmonary edema. No pneumothorax.',
        completedAt: randomMinutesAgo(18, 22),
      },
    ],
    
    pharmacyOrders: [
      {
        id: 'PHARM001',
        patientId: 'EP001',
        medication: 'Aspirin',
        dosage: '300mg',
        route: 'PO',
        frequency: 'stat',
        orderedBy: 'Paramedic Razak',
        orderedAt: randomMinutesAgo(40, 50),
        status: 'administered',
        administeredAt: randomMinutesAgo(40, 50),
      },
      {
        id: 'PHARM002',
        patientId: 'EP001',
        medication: 'Clopidogrel',
        dosage: '600mg',
        route: 'PO',
        frequency: 'stat',
        orderedBy: 'Dr. Rahman',
        orderedAt: randomMinutesAgo(28, 33),
        status: 'administered',
        administeredAt: randomMinutesAgo(25, 28),
      },
      {
        id: 'PHARM003',
        patientId: 'EP001',
        medication: 'Morphine',
        dosage: '5mg',
        route: 'IV',
        frequency: 'PRN',
        orderedBy: 'Dr. Rahman',
        orderedAt: randomMinutesAgo(28, 33),
        status: 'administered',
        administeredAt: randomMinutesAgo(26, 30),
      },
      {
        id: 'PHARM004',
        patientId: 'EP001',
        medication: 'Heparin Infusion',
        dosage: '1000 units/hour',
        route: 'IV',
        frequency: 'continuous',
        orderedBy: 'Dr. Rahman',
        orderedAt: randomMinutesAgo(25, 28),
        status: 'administered',
        administeredAt: randomMinutesAgo(23, 26),
      },
    ],
    
    disposition: {
      type: 'admit-icu',
      decidedAt: randomMinutesAgo(18, 22),
      decidedBy: 'Dr. Rahman Hassan / Dr. Lim (Cardiology)',
      destination: 'CCU (Coronary Care Unit)',
      admittingDepartment: 'Cardiology',
      admittingDoctor: 'Dr. Lim Wei Ming',
      notes: 'For emergency PCI then CCU monitoring. High dependency care required.',
    },
    
    timeline: createTimeline([
      {
        type: 'arrival',
        timestamp: randomMinutesAgo(35, 45),
        description: 'Arrived via ambulance with chest pain',
        actor: 'Paramedic Razak',
      },
      {
        type: 'triage',
        timestamp: randomMinutesAgo(33, 43),
        description: 'Triaged as P1 - Critical',
        actor: 'Siti Nurhaliza',
      },
      {
        type: 'bed-assigned',
        timestamp: randomMinutesAgo(32, 42),
        description: 'Assigned to Resuscitation Bay R1-01',
        actor: 'Nurse Azizah',
      },
      {
        type: 'doctor-assigned',
        timestamp: randomMinutesAgo(31, 41),
        description: 'Dr. Rahman Hassan assigned',
        actor: 'System',
      },
      {
        type: 'vitals',
        timestamp: randomMinutesAgo(30, 40),
        description: 'Initial vitals recorded',
        actor: 'Nurse Azizah',
      },
      {
        type: 'order-placed',
        timestamp: randomMinutesAgo(28, 33),
        description: 'STEMI protocol initiated - Labs, medications ordered',
        actor: 'Dr. Rahman Hassan',
      },
      {
        type: 'consult',
        timestamp: randomMinutesAgo(25, 30),
        description: 'Cardiology consultation requested',
        actor: 'Dr. Rahman Hassan',
      },
      {
        type: 'disposition',
        timestamp: randomMinutesAgo(18, 22),
        description: 'Disposition: Admit to CCU for emergency PCI',
        actor: 'Dr. Rahman Hassan',
      },
    ]),
  },

  // P2 - Trauma Case (Motor Vehicle Accident)
  {
    id: 'EP002',
    registrationNumber: 'ER2025-0002',
    name: 'Nur Aisyah binti Hassan',
    age: 28,
    gender: 'Female',
    icNumber: '960823-10-2345',
    contactNumber: '012-8765432',
    nextOfKin: 'Hassan bin Ahmad (Father)',
    nextOfKinContact: '012-3456789',
    address: '45, Taman Setia, Petaling Jaya',
    
    arrivalMode: 'ambulance',
    arrivalTime: randomMinutesAgo(55, 65),
    ambulanceInfo: {
      callTime: randomMinutesAgo(75, 85),
      dispatchTime: randomMinutesAgo(73, 83),
      arrivalTime: randomMinutesAgo(55, 65),
      ambulanceId: 'AMB-002',
      paramedic: 'Paramedic Siti',
      mechanism: 'Motor vehicle accident - driver, side impact',
      preHospitalTreatment: 'C-collar applied, IV access obtained, O2 4L/min',
      estimatedInjuries: 'Head injury, possible C-spine injury, chest contusion',
    },
    
    triageLevel: 'P2',
    chiefComplaint: 'Motor vehicle accident - head injury, chest pain',
    triageTime: randomMinutesAgo(53, 63),
    triageNurse: 'Ahmad Faizal',
    triageNotes: 'GCS 14/15 (E4V4M6). Laceration on forehead 3cm. Complains of chest pain. C-collar in situ.',
    
    trauma: {
      activated: true,
      level: 'yellow',
      activatedAt: randomMinutesAgo(54, 64),
      activatedBy: 'Dr. Lee Mei Ling',
      mechanism: 'Motor vehicle accident - side impact, driver, restrained',
      primarySurveyCompleted: randomMinutesAgo(50, 60),
      secondarySurveyCompleted: randomMinutesAgo(40, 50),
      teamLeader: 'Dr. Lee Mei Ling',
      traumaSurgeon: 'Dr. Kumar (On standby)',
      notes: 'Yellow trauma alert activated. Primary survey: Airway patent, Breathing adequate, Circulation stable, Disability - GCS 14/15, Exposure - no obvious external injuries except forehead laceration.',
    },
    
    status: 'in-treatment',
    assignedBed: 'M1-03',
    assignedDoctor: 'Dr. Lee Mei Ling',
    assignedNurse: 'Nurse Halim',
    
    vitals: [
      {
        bloodPressure: '125/78',
        heartRate: 92,
        temperature: 36.8,
        respiratoryRate: 18,
        oxygenSaturation: 98,
        painScore: 6,
        gcs: '14/15',
        recordedAt: randomMinutesAgo(52, 62),
        recordedBy: 'Nurse Halim',
      },
      {
        bloodPressure: '122/75',
        heartRate: 88,
        temperature: 36.9,
        respiratoryRate: 16,
        oxygenSaturation: 99,
        painScore: 4,
        gcs: '15/15',
        recordedAt: randomMinutesAgo(30, 35),
        recordedBy: 'Nurse Halim',
      },
    ],
    
    history: {
      presentingComplaint: 'Involved in motor vehicle accident approximately 1.5 hours ago',
      historyOfPresentingComplaint: 'Patient was driver of vehicle hit on driver side by another car at intersection. Restrained with seatbelt. Airbag deployed. Brief loss of consciousness (~1 minute). Developed headache, neck pain, and chest wall pain. Denies abdominal pain or limb injuries.',
      pastMedicalHistory: [],
      pastSurgicalHistory: [],
      medications: ['Oral contraceptive pill'],
      allergies: ['No known drug allergies'],
      socialHistory: 'Non-smoker. Social drinker. Works as a teacher.',
    },
    
    examination: {
      general: 'Alert, GCS 15/15 now, in C-collar',
      cardiovascular: 'Heart sounds dual, regular. BP stable.',
      respiratory: 'Equal bilateral air entry. Tenderness over left chest wall. No crepitus.',
      abdominal: 'Soft, non-tender, no guarding. FAST scan negative.',
      neurological: 'GCS 15/15. PERRL. No focal neurological deficit. Moving all 4 limbs.',
      musculoskeletal: 'Tenderness over left chest wall. Full range of movement all limbs.',
      skin: '3cm laceration over right forehead, actively bleeding controlled with pressure.',
      examinedBy: 'Dr. Lee Mei Ling',
      examinedAt: randomMinutesAgo(45, 50),
    },
    
    assessmentNotes: 'Motor vehicle accident with brief LOC. Mild traumatic brain injury. Left chest wall contusion. Forehead laceration requiring suturing.',
    differentialDiagnosis: ['Mild TBI / Concussion', 'Intracranial hemorrhage (to be ruled out)', 'Rib fracture', 'C-spine injury (to be cleared)'],
    finalDiagnosis: 'Mild traumatic brain injury (Concussion), Left chest wall contusion, Forehead laceration',
    treatmentPlan: 'CT brain and C-spine ordered. Wound care and suturing of forehead laceration. Observation in ED for 6 hours. Neurological monitoring.',
    
    clinicalNotes: [
      {
        id: 'CN001',
        timestamp: randomMinutesAgo(50, 55),
        author: 'Dr. Lee Mei Ling',
        type: 'assessment',
        content: 'Trauma assessment completed. Yellow trauma protocol. Patient stable. CT brain and C-spine ordered to clear injuries.',
      },
      {
        id: 'CN002',
        timestamp: randomMinutesAgo(35, 40),
        author: 'Dr. Lee Mei Ling',
        type: 'procedure',
        content: 'Forehead laceration sutured under local anesthesia. 8 stitches applied. Wound clean and dressed.',
      },
    ],
    
    labOrders: [
      {
        id: 'LAB004',
        patientId: 'EP002',
        testName: 'Full Blood Count',
        priority: 'urgent',
        orderedBy: 'Dr. Lee',
        orderedAt: randomMinutesAgo(48, 53),
        status: 'completed',
        results: 'Hb 13.5, WBC 9.2, Plt 280 - Normal',
        completedAt: randomMinutesAgo(30, 35),
      },
    ],
    
    radiologyOrders: [
      {
        id: 'RAD002',
        patientId: 'EP002',
        examType: 'CT Brain',
        bodyPart: 'Head',
        priority: 'stat',
        clinicalIndication: 'Head trauma with brief LOC, assess for intracranial bleeding',
        orderedBy: 'Dr. Lee',
        orderedAt: randomMinutesAgo(48, 53),
        status: 'completed',
        findings: 'No acute intracranial hemorrhage. No skull fracture. No midline shift.',
        completedAt: randomMinutesAgo(25, 30),
      },
      {
        id: 'RAD003',
        patientId: 'EP002',
        examType: 'CT C-Spine',
        bodyPart: 'Cervical Spine',
        priority: 'stat',
        clinicalIndication: 'MVA, clear C-spine',
        orderedBy: 'Dr. Lee',
        orderedAt: randomMinutesAgo(48, 53),
        status: 'completed',
        findings: 'No fracture or dislocation. C-spine cleared.',
        completedAt: randomMinutesAgo(25, 30),
      },
      {
        id: 'RAD004',
        patientId: 'EP002',
        examType: 'Chest X-Ray',
        bodyPart: 'Chest',
        priority: 'urgent',
        clinicalIndication: 'Chest wall pain post-MVA, rule out rib fracture',
        orderedBy: 'Dr. Lee',
        orderedAt: randomMinutesAgo(48, 53),
        status: 'completed',
        findings: 'No rib fracture. No pneumothorax. Cardiac and lung fields normal.',
        completedAt: randomMinutesAgo(32, 37),
      },
    ],
    
    pharmacyOrders: [
      {
        id: 'PHARM005',
        patientId: 'EP002',
        medication: 'Tetanus Toxoid',
        dosage: '0.5mL',
        route: 'IM',
        frequency: 'stat',
        orderedBy: 'Dr. Lee',
        orderedAt: randomMinutesAgo(45, 50),
        status: 'administered',
        administeredAt: randomMinutesAgo(42, 47),
      },
      {
        id: 'PHARM006',
        patientId: 'EP002',
        medication: 'Paracetamol',
        dosage: '1g',
        route: 'IV',
        frequency: 'TDS',
        orderedBy: 'Dr. Lee',
        orderedAt: randomMinutesAgo(45, 50),
        status: 'administered',
        administeredAt: randomMinutesAgo(43, 48),
      },
    ],
    
    disposition: {
      type: 'discharge-home',
      decidedAt: randomMinutesAgo(10, 15),
      decidedBy: 'Dr. Lee Mei Ling',
      dischargeInstructions: 'Rest at home. Head injury advice given. Return if worsening headache, vomiting, seizures, or altered consciousness. Wound care instructions provided.',
      followUpInstructions: 'Follow up with GP in 3 days. Remove sutures in 7 days at clinic.',
      prescriptions: ['Paracetamol 1g TDS x 3 days', 'Celebrex 200mg BD x 5 days'],
      medicalCertificateDays: 3,
      notes: 'CT brain and C-spine normal. Patient observed for 6 hours, neurologically stable. Head injury card and wound care instructions given.',
    },
    
    timeline: createTimeline([
      {
        type: 'arrival',
        timestamp: randomMinutesAgo(55, 65),
        description: 'Arrived via ambulance - MVA with head injury',
        actor: 'Paramedic Siti',
      },
      {
        type: 'trauma-activation',
        timestamp: randomMinutesAgo(54, 64),
        description: 'Yellow trauma activation',
        actor: 'Dr. Lee Mei Ling',
      },
      {
        type: 'triage',
        timestamp: randomMinutesAgo(53, 63),
        description: 'Triaged as P2 - Urgent',
        actor: 'Ahmad Faizal',
      },
      {
        type: 'bed-assigned',
        timestamp: randomMinutesAgo(52, 62),
        description: 'Assigned to Major Area M1-03',
        actor: 'Nurse Halim',
      },
      {
        type: 'order-placed',
        timestamp: randomMinutesAgo(48, 53),
        description: 'Trauma imaging ordered (CT brain, C-spine, CXR)',
        actor: 'Dr. Lee Mei Ling',
      },
      {
        type: 'procedure',
        timestamp: randomMinutesAgo(35, 40),
        description: 'Forehead laceration sutured - 8 stitches',
        actor: 'Dr. Lee Mei Ling',
      },
      {
        type: 'disposition',
        timestamp: randomMinutesAgo(10, 15),
        description: 'Disposition: Discharge home with head injury advice',
        actor: 'Dr. Lee Mei Ling',
      },
    ]),
  },

  // P2 - Respiratory Distress
  {
    id: 'EP003',
    registrationNumber: 'ER2025-0003',
    name: 'Tan Chee Keong',
    age: 67,
    gender: 'Male',
    icNumber: '570315-08-3456',
    contactNumber: '016-7654321',
    nextOfKin: 'Tan Mei Ling (Daughter)',
    nextOfKinContact: '016-1234567',
    address: '23, Jalan Bunga Raya, Ipoh',
    
    arrivalMode: 'walk-in',
    arrivalTime: randomMinutesAgo(120, 140),
    
    triageLevel: 'P2',
    chiefComplaint: 'Difficulty breathing, productive cough with fever for 3 days',
    triageTime: randomMinutesAgo(118, 138),
    triageNurse: 'Siti Nurhaliza',
    triageNotes: 'Patient in respiratory distress, using accessory muscles. SpO2 88% on room air. Bilateral crepitations heard.',
    
    trauma: {
      activated: false,
      level: 'none',
      mechanism: 'N/A',
    },
    
    status: 'awaiting-admission',
    assignedBed: 'M1-05',
    assignedDoctor: 'Dr. Wong Siew Ming',
    assignedNurse: 'Nurse Latha',
    
    vitals: [
      {
        bloodPressure: '145/88',
        heartRate: 105,
        temperature: 38.5,
        respiratoryRate: 28,
        oxygenSaturation: 88,
        painScore: 2,
        gcs: '15/15',
        recordedAt: randomMinutesAgo(117, 137),
        recordedBy: 'Nurse Latha',
      },
      {
        bloodPressure: '138/82',
        heartRate: 95,
        temperature: 37.8,
        respiratoryRate: 22,
        oxygenSaturation: 95,
        painScore: 2,
        gcs: '15/15',
        recordedAt: randomMinutesAgo(60, 70),
        recordedBy: 'Nurse Latha',
      },
    ],
    
    history: {
      presentingComplaint: 'Difficulty breathing and productive cough for 3 days',
      historyOfPresentingComplaint: 'Patient developed fever (Tmax 39°C) and productive cough with yellowish sputum 3 days ago. Progressive shortness of breath, worse on exertion. No chest pain. No hemoptysis. Poor oral intake.',
      pastMedicalHistory: ['COPD (10 years)', 'Hypertension (15 years)', 'Type 2 Diabetes Mellitus (8 years)', 'Ex-smoker'],
      pastSurgicalHistory: ['Cholecystectomy (1995)'],
      medications: ['Salbutamol inhaler PRN', 'Ipratropium bromide inhaler BD', 'Amlodipine 5mg OD', 'Metformin 500mg BD', 'Gliclazide 80mg BD'],
      allergies: ['Sulfonamides - Stevens-Johnson Syndrome'],
      socialHistory: 'Ex-smoker (quit 5 years ago), 40 pack-years. Lives with daughter. Retired factory worker.',
      familyHistory: 'Mother had asthma. Father had diabetes.',
    },
    
    examination: {
      general: 'Alert, in respiratory distress, using accessory muscles, appears dehydrated',
      cardiovascular: 'Tachycardic, regular rhythm. No murmur. JVP not elevated.',
      respiratory: 'Bilateral coarse crepitations, more on right lower zone. Bronchial breathing right base. Dull percussion note right lower zone.',
      abdominal: 'Soft, non-tender, no organomegaly',
      neurological: 'GCS 15/15, no focal deficit',
      examinedBy: 'Dr. Wong Siew Ming',
      examinedAt: randomMinutesAgo(100, 110),
    },
    
    assessmentNotes: 'Acute exacerbation of COPD with community-acquired pneumonia (right lower lobe). Type 1 respiratory failure. Requires hospital admission for IV antibiotics and respiratory support.',
    differentialDiagnosis: ['Community-acquired pneumonia', 'COPD exacerbation', 'Heart failure', 'Pulmonary embolism'],
    finalDiagnosis: 'Community-acquired pneumonia (Right lower lobe) with acute COPD exacerbation',
    treatmentPlan: 'Admit to General Medical Ward. IV antibiotics (Ceftriaxone + Azithromycin). Bronchodilators. O2 therapy to target SpO2 88-92%. IV hydration. Monitor closely.',
    
    clinicalNotes: [
      {
        id: 'CN001',
        timestamp: randomMinutesAgo(100, 110),
        author: 'Dr. Wong Siew Ming',
        type: 'assessment',
        content: 'Patient with acute pneumonia on background of COPD. Started on O2 4L/min via nasal cannula. SpO2 improved to 92%. IV access obtained. Antibiotics and bronchodilators ordered.',
      },
      {
        id: 'CN002',
        timestamp: randomMinutesAgo(70, 80),
        author: 'Dr. Wong Siew Ming',
        type: 'progress',
        content: 'Patient improving. Less dyspneic. SpO2 95% on O2 4L/min. Tolerating oral fluids. Awaiting ward bed for admission.',
      },
    ],
    
    labOrders: [
      {
        id: 'LAB005',
        patientId: 'EP003',
        testName: 'Full Blood Count',
        priority: 'urgent',
        orderedBy: 'Dr. Wong',
        orderedAt: randomMinutesAgo(105, 115),
        status: 'completed',
        results: 'WBC 18.5 (elevated), Neutrophils 85%, Hb 14.0, Plt 320',
        completedAt: randomMinutesAgo(75, 85),
      },
      {
        id: 'LAB006',
        patientId: 'EP003',
        testName: 'Renal Profile',
        priority: 'urgent',
        orderedBy: 'Dr. Wong',
        orderedAt: randomMinutesAgo(105, 115),
        status: 'completed',
        results: 'Urea 8.5, Creatinine 95 (mildly elevated), Na 138, K 4.2',
        completedAt: randomMinutesAgo(75, 85),
      },
      {
        id: 'LAB007',
        patientId: 'EP003',
        testName: 'CRP',
        priority: 'urgent',
        orderedBy: 'Dr. Wong',
        orderedAt: randomMinutesAgo(105, 115),
        status: 'completed',
        results: 'CRP 150 mg/L (markedly elevated)',
        completedAt: randomMinutesAgo(75, 85),
      },
      {
        id: 'LAB008',
        patientId: 'EP003',
        testName: 'Blood Culture',
        priority: 'urgent',
        orderedBy: 'Dr. Wong',
        orderedAt: randomMinutesAgo(105, 115),
        status: 'in-progress',
      },
    ],
    
    radiologyOrders: [
      {
        id: 'RAD005',
        patientId: 'EP003',
        examType: 'Chest X-Ray',
        bodyPart: 'Chest',
        priority: 'urgent',
        clinicalIndication: 'Pneumonia, shortness of breath',
        orderedBy: 'Dr. Wong',
        orderedAt: randomMinutesAgo(105, 115),
        status: 'completed',
        findings: 'Right lower lobe consolidation consistent with pneumonia. No pleural effusion. Hyperinflated lung fields suggesting COPD.',
        completedAt: randomMinutesAgo(85, 95),
      },
    ],
    
    pharmacyOrders: [
      {
        id: 'PHARM007',
        patientId: 'EP003',
        medication: 'Ceftriaxone',
        dosage: '2g',
        route: 'IV',
        frequency: 'OD',
        orderedBy: 'Dr. Wong',
        orderedAt: randomMinutesAgo(100, 110),
        status: 'administered',
        administeredAt: randomMinutesAgo(95, 105),
      },
      {
        id: 'PHARM008',
        patientId: 'EP003',
        medication: 'Azithromycin',
        dosage: '500mg',
        route: 'IV',
        frequency: 'OD',
        orderedBy: 'Dr. Wong',
        orderedAt: randomMinutesAgo(100, 110),
        status: 'administered',
        administeredAt: randomMinutesAgo(95, 105),
      },
      {
        id: 'PHARM009',
        patientId: 'EP003',
        medication: 'Salbutamol Nebulizer',
        dosage: '5mg',
        route: 'Inhalation',
        frequency: 'Q4H',
        orderedBy: 'Dr. Wong',
        orderedAt: randomMinutesAgo(100, 110),
        status: 'administered',
        administeredAt: randomMinutesAgo(97, 107),
      },
      {
        id: 'PHARM010',
        patientId: 'EP003',
        medication: 'Ipratropium Nebulizer',
        dosage: '500mcg',
        route: 'Inhalation',
        frequency: 'Q6H',
        orderedBy: 'Dr. Wong',
        orderedAt: randomMinutesAgo(100, 110),
        status: 'administered',
        administeredAt: randomMinutesAgo(97, 107),
      },
    ],
    
    disposition: {
      type: 'admit-general',
      decidedAt: randomMinutesAgo(80, 90),
      decidedBy: 'Dr. Wong Siew Ming',
      destination: 'General Medical Ward 4B',
      admittingDepartment: 'Internal Medicine',
      admittingDoctor: 'Dr. Suresh (Medical Team)',
      notes: 'Admitted for IV antibiotics and respiratory support. Patient stable, improving on treatment. Ward bed arranged.',
    },
    
    timeline: createTimeline([
      {
        type: 'arrival',
        timestamp: randomMinutesAgo(120, 140),
        description: 'Arrived via walk-in with difficulty breathing',
        actor: 'Registration',
      },
      {
        type: 'triage',
        timestamp: randomMinutesAgo(118, 138),
        description: 'Triaged as P2 - Urgent (Respiratory distress)',
        actor: 'Siti Nurhaliza',
      },
      {
        type: 'bed-assigned',
        timestamp: randomMinutesAgo(115, 135),
        description: 'Assigned to Major Area M1-05',
        actor: 'Nurse Latha',
      },
      {
        type: 'vitals',
        timestamp: randomMinutesAgo(117, 137),
        description: 'Initial vitals - SpO2 88% on room air',
        actor: 'Nurse Latha',
      },
      {
        type: 'order-placed',
        timestamp: randomMinutesAgo(105, 115),
        description: 'Labs and CXR ordered, IV antibiotics initiated',
        actor: 'Dr. Wong Siew Ming',
      },
      {
        type: 'disposition',
        timestamp: randomMinutesAgo(80, 90),
        description: 'Disposition: Admit to General Medical Ward',
        actor: 'Dr. Wong Siew Ming',
      },
    ]),
  },

  // P3 - Abdominal Pain
  {
    id: 'EP004',
    registrationNumber: 'ER2025-0004',
    name: 'Letchumi a/p Ramasamy',
    age: 52,
    gender: 'Female',
    icNumber: '720908-05-4567',
    contactNumber: '013-2345678',
    nextOfKin: 'Ramasamy a/l Muthu (Husband)',
    nextOfKinContact: '013-8765432',
    
    arrivalMode: 'walk-in',
    arrivalTime: randomMinutesAgo(95, 105),
    
    triageLevel: 'P3',
    chiefComplaint: 'Right upper abdominal pain, vomiting',
    triageTime: randomMinutesAgo(90, 100),
    triageNurse: 'Ahmad Faizal',
    triageNotes: 'Patient with RUQ pain, 7/10 severity. Multiple episodes of vomiting. Afebrile. Vitals stable.',
    
    trauma: {
      activated: false,
      level: 'none',
      mechanism: 'N/A',
    },
    
    status: 'in-assessment',
    assignedBed: 'MIN-02',
    assignedDoctor: 'Dr. Priya Sharma',
    assignedNurse: 'Nurse Kamala',
    
    vitals: [generateVitals('Nurse Kamala')],
    
    history: {
      presentingComplaint: 'Right upper abdominal pain for 1 day',
      historyOfPresentingComplaint: 'Sudden onset right upper quadrant pain starting yesterday evening after fatty meal. Pain constant, 7/10, radiating to right shoulder. Associated with nausea and multiple episodes of vomiting. No diarrhea. No urinary symptoms.',
      pastMedicalHistory: ['Type 2 Diabetes Mellitus (8 years)', 'Hyperlipidemia (5 years)'],
      pastSurgicalHistory: [],
      medications: ['Metformin 500mg BD', 'Simvastatin 20mg ON'],
      allergies: ['NKDA'],
      socialHistory: 'Non-smoker, non-drinker. Homemaker.',
    },
    
    assessmentNotes: 'Likely acute cholecystitis. Patient stable. Ultrasound abdomen ordered to confirm diagnosis.',
    differentialDiagnosis: ['Acute cholecystitis', 'Biliary colic', 'Peptic ulcer disease', 'Hepatitis'],
    
    labOrders: [
      {
        id: 'LAB009',
        patientId: 'EP004',
        testName: 'Full Blood Count',
        priority: 'routine',
        orderedBy: 'Dr. Priya',
        orderedAt: randomMinutesAgo(60, 70),
        status: 'in-progress',
      },
      {
        id: 'LAB010',
        patientId: 'EP004',
        testName: 'Liver Function Test',
        priority: 'routine',
        orderedBy: 'Dr. Priya',
        orderedAt: randomMinutesAgo(60, 70),
        status: 'in-progress',
      },
    ],
    
    radiologyOrders: [
      {
        id: 'RAD006',
        patientId: 'EP004',
        examType: 'Ultrasound Abdomen',
        bodyPart: 'Abdomen',
        priority: 'routine',
        clinicalIndication: 'RUQ pain, ?cholecystitis',
        orderedBy: 'Dr. Priya',
        orderedAt: randomMinutesAgo(60, 70),
        status: 'pending',
      },
    ],
    
    pharmacyOrders: [
      {
        id: 'PHARM011',
        patientId: 'EP004',
        medication: 'Ondansetron',
        dosage: '4mg',
        route: 'IV',
        frequency: 'TDS PRN',
        orderedBy: 'Dr. Priya',
        orderedAt: randomMinutesAgo(65, 75),
        status: 'administered',
        administeredAt: randomMinutesAgo(60, 70),
      },
      {
        id: 'PHARM012',
        patientId: 'EP004',
        medication: 'Tramadol',
        dosage: '50mg',
        route: 'IV',
        frequency: 'QID PRN',
        orderedBy: 'Dr. Priya',
        orderedAt: randomMinutesAgo(65, 75),
        status: 'administered',
        administeredAt: randomMinutesAgo(60, 70),
      },
    ],
    
    timeline: createTimeline([
      {
        type: 'arrival',
        timestamp: randomMinutesAgo(95, 105),
        description: 'Arrived via walk-in with abdominal pain',
        actor: 'Registration',
      },
      {
        type: 'triage',
        timestamp: randomMinutesAgo(90, 100),
        description: 'Triaged as P3 - Semi-urgent',
        actor: 'Ahmad Faizal',
      },
      {
        type: 'bed-assigned',
        timestamp: randomMinutesAgo(75, 85),
        description: 'Assigned to Minor Area MIN-02',
        actor: 'Nurse Kamala',
      },
      {
        type: 'order-placed',
        timestamp: randomMinutesAgo(60, 70),
        description: 'Labs and imaging ordered, pain medication given',
        actor: 'Dr. Priya Sharma',
      },
    ]),
  },

  // P4 - Minor Injury
  {
    id: 'EP005',
    registrationNumber: 'ER2025-0005',
    name: 'Muhammad Hafiz bin Yusof',
    age: 19,
    gender: 'Male',
    icNumber: '051205-14-5678',
    contactNumber: '011-9876543',
    
    arrivalMode: 'walk-in',
    arrivalTime: randomMinutesAgo(180, 200),
    
    triageLevel: 'P4',
    chiefComplaint: 'Left ankle sprain from football injury',
    triageTime: randomMinutesAgo(175, 195),
    triageNurse: 'Siti Nurhaliza',
    triageNotes: 'Sports injury. Ankle swollen and tender. Able to weight bear with difficulty.',
    
    trauma: {
      activated: false,
      level: 'none',
      mechanism: 'Sports injury',
    },
    
    status: 'waiting',
    vitals: [generateVitals('Nurse Salmah')],
    
    history: {
      presentingComplaint: 'Left ankle injury',
      historyOfPresentingComplaint: 'Twisted left ankle while playing football 2 hours ago. Immediate pain and swelling. Applied ice at home. No other injuries.',
      pastMedicalHistory: [],
      pastSurgicalHistory: [],
      medications: [],
      allergies: ['NKDA'],
    },
    
    labOrders: [],
    radiologyOrders: [
      {
        id: 'RAD007',
        patientId: 'EP005',
        examType: 'X-Ray',
        bodyPart: 'Left Ankle',
        priority: 'routine',
        clinicalIndication: 'Ankle sprain, rule out fracture',
        orderedBy: 'Dr. Kumar',
        orderedAt: randomMinutesAgo(50, 60),
        status: 'pending',
      },
    ],
    pharmacyOrders: [],
    
    timeline: createTimeline([
      {
        type: 'arrival',
        timestamp: randomMinutesAgo(180, 200),
        description: 'Arrived with ankle injury',
        actor: 'Registration',
      },
      {
        type: 'triage',
        timestamp: randomMinutesAgo(175, 195),
        description: 'Triaged as P4 - Non-urgent',
        actor: 'Siti Nurhaliza',
      },
    ]),
  },

  // P3 - Pediatric Case
  {
    id: 'EP006',
    registrationNumber: 'ER2025-0006',
    name: 'Siti Hajar binti Omar',
    age: 8,
    gender: 'Female',
    icNumber: '161120-10-2345',
    contactNumber: '017-3456789',
    nextOfKin: 'Fatimah binti Ahmad (Mother)',
    nextOfKinContact: '017-3456789',
    
    arrivalMode: 'walk-in',
    arrivalTime: randomMinutesAgo(150, 160),
    
    triageLevel: 'P3',
    chiefComplaint: 'Fever and rash for 2 days',
    triageTime: randomMinutesAgo(145, 155),
    triageNurse: 'Ahmad Faizal',
    triageNotes: 'Febrile child. Maculopapular rash over trunk and limbs. Alert and playful.',
    
    trauma: {
      activated: false,
      level: 'none',
      mechanism: 'N/A',
    },
    
    status: 'waiting',
    vitals: [
      {
        bloodPressure: '95/60',
        heartRate: 110,
        temperature: 38.2,
        respiratoryRate: 24,
        oxygenSaturation: 99,
        painScore: 0,
        gcs: '15/15',
        recordedAt: randomMinutesAgo(144, 154),
        recordedBy: 'Nurse Zainab',
      },
    ],
    
    history: {
      presentingComplaint: 'Fever and rash',
      historyOfPresentingComplaint: 'Child developed fever (Tmax 38.5°C) 2 days ago. Rash appeared yesterday starting from face then spreading to trunk and limbs. No respiratory symptoms. No diarrhea or vomiting. Still active and playful. Eating and drinking well.',
      pastMedicalHistory: [],
      pastSurgicalHistory: [],
      medications: [],
      allergies: ['NKDA'],
      familyHistory: 'Elder sibling had similar rash 1 week ago (diagnosed with viral exanthem)',
    },
    
    labOrders: [],
    radiologyOrders: [],
    pharmacyOrders: [],
    
    timeline: createTimeline([
      {
        type: 'arrival',
        timestamp: randomMinutesAgo(150, 160),
        description: 'Arrived with fever and rash',
        actor: 'Registration',
      },
      {
        type: 'triage',
        timestamp: randomMinutesAgo(145, 155),
        description: 'Triaged as P3 - Semi-urgent',
        actor: 'Ahmad Faizal',
      },
    ]),
  },
];

// Mock bed data
export const mockEmergencyBeds: EmergencyBed[] = [
  // Resuscitation (4 beds)
  { id: 'R1-01', roomNumber: 'R1', bedNumber: '01', zone: 'Resuscitation', status: 'occupied', patientId: 'EP001', assignedAt: randomMinutesAgo(30, 40) },
  { id: 'R1-02', roomNumber: 'R1', bedNumber: '02', zone: 'Resuscitation', status: 'available' },
  { id: 'R1-03', roomNumber: 'R1', bedNumber: '03', zone: 'Resuscitation', status: 'available' },
  { id: 'R1-04', roomNumber: 'R1', bedNumber: '04', zone: 'Resuscitation', status: 'cleaning' },
  
  // Major (8 beds)
  { id: 'M1-01', roomNumber: 'M1', bedNumber: '01', zone: 'Major', status: 'available' },
  { id: 'M1-02', roomNumber: 'M1', bedNumber: '02', zone: 'Major', status: 'available' },
  { id: 'M1-03', roomNumber: 'M1', bedNumber: '03', zone: 'Major', status: 'occupied', patientId: 'EP002', assignedAt: randomMinutesAgo(50, 60) },
  { id: 'M1-04', roomNumber: 'M1', bedNumber: '04', zone: 'Major', status: 'available' },
  { id: 'M1-05', roomNumber: 'M1', bedNumber: '05', zone: 'Major', status: 'occupied', patientId: 'EP003', assignedAt: randomMinutesAgo(110, 120) },
  { id: 'M1-06', roomNumber: 'M1', bedNumber: '06', zone: 'Major', status: 'available' },
  { id: 'M1-07', roomNumber: 'M1', bedNumber: '07', zone: 'Major', status: 'available' },
  { id: 'M1-08', roomNumber: 'M1', bedNumber: '08', zone: 'Major', status: 'maintenance' },
  
  // Minor (6 beds)
  { id: 'MIN-01', roomNumber: 'MIN', bedNumber: '01', zone: 'Minor', status: 'available' },
  { id: 'MIN-02', roomNumber: 'MIN', bedNumber: '02', zone: 'Minor', status: 'occupied', patientId: 'EP004', assignedAt: randomMinutesAgo(70, 80) },
  { id: 'MIN-03', roomNumber: 'MIN', bedNumber: '03', zone: 'Minor', status: 'available' },
  { id: 'MIN-04', roomNumber: 'MIN', bedNumber: '04', zone: 'Minor', status: 'available' },
  { id: 'MIN-05', roomNumber: 'MIN', bedNumber: '05', zone: 'Minor', status: 'available' },
  { id: 'MIN-06', roomNumber: 'MIN', bedNumber: '06', zone: 'Minor', status: 'available' },
  
  // Observation (6 beds)
  { id: 'OBS-01', roomNumber: 'OBS', bedNumber: '01', zone: 'Observation', status: 'available' },
  { id: 'OBS-02', roomNumber: 'OBS', bedNumber: '02', zone: 'Observation', status: 'available' },
  { id: 'OBS-03', roomNumber: 'OBS', bedNumber: '03', zone: 'Observation', status: 'available' },
  { id: 'OBS-04', roomNumber: 'OBS', bedNumber: '04', zone: 'Observation', status: 'available' },
  { id: 'OBS-05', roomNumber: 'OBS', bedNumber: '05', zone: 'Observation', status: 'available' },
  { id: 'OBS-06', roomNumber: 'OBS', bedNumber: '06', zone: 'Observation', status: 'cleaning' },
];

// Incoming ambulances / patients
export const mockIncomingPatients: IncomingPatient[] = [
  {
    id: 'INC001',
    eta: randomMinutesFromNow(8, 12),
    ambulanceId: 'AMB-005',
    chiefComplaint: 'Motorcycle accident - multiple injuries',
    triageLevel: 'P1',
    age: 32,
    gender: 'Male',
    mechanism: 'MVA - Motorcycle vs Car',
    vitals: {
      bloodPressure: '95/60',
      heartRate: 115,
      oxygenSaturation: 92,
      gcs: '13/15',
    },
    specialInstructions: 'Red trauma activation recommended. Suspected chest and pelvic injuries. C-collar applied.',
  },
  {
    id: 'INC002',
    eta: randomMinutesFromNow(15, 20),
    ambulanceId: 'AMB-003',
    chiefComplaint: 'Stroke symptoms - facial droop, weakness',
    triageLevel: 'P2',
    age: 71,
    gender: 'Female',
    mechanism: 'Medical - Neurological',
    vitals: {
      bloodPressure: '180/105',
      heartRate: 88,
      oxygenSaturation: 97,
    },
    specialInstructions: 'Stroke code activation. Symptom onset 45 minutes ago. Fast positive.',
  },
  {
    id: 'INC003',
    eta: randomMinutesFromNow(25, 30),
    ambulanceId: 'AMB-007',
    chiefComplaint: 'Seizure - post-ictal',
    triageLevel: 'P3',
    age: 24,
    gender: 'Male',
    mechanism: 'Medical - Seizure',
    vitals: {
      heartRate: 92,
      oxygenSaturation: 96,
    },
  },
];

// Calculate triage stats
export function calculateTriageStats(patients: EmergencyPatient[]): TriageStats {
  const activePatients = patients.filter(p => 
    p.status !== 'discharged' && 
    p.status !== 'transferred' && 
    p.status !== 'admitted' &&
    p.status !== 'left-without-being-seen' &&
    p.status !== 'deceased'
  );
  
  const now = new Date();
  const waitTimes = activePatients
    .filter(p => p.status === 'waiting' || p.status === 'triaged')
    .map(p => (now.getTime() - p.arrivalTime.getTime()) / (1000 * 60));
  
  return {
    total: activePatients.length,
    p1: activePatients.filter(p => p.triageLevel === 'P1').length,
    p2: activePatients.filter(p => p.triageLevel === 'P2').length,
    p3: activePatients.filter(p => p.triageLevel === 'P3').length,
    p4: activePatients.filter(p => p.triageLevel === 'P4').length,
    p5: activePatients.filter(p => p.triageLevel === 'P5').length,
    averageWaitTime: waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0,
    longestWaitTime: waitTimes.length > 0 ? Math.round(Math.max(...waitTimes)) : 0,
  };
}

// Department metrics for reporting
export function calculateDepartmentMetrics(patients: EmergencyPatient[]): DepartmentMetrics {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayPatients = patients.filter(p => p.arrivalTime >= today);
  
  const currentInDepartment = patients.filter(p => 
    p.status !== 'discharged' && 
    p.status !== 'transferred' && 
    p.status !== 'admitted' &&
    p.status !== 'left-without-being-seen' &&
    p.status !== 'deceased'
  ).length;
  
  const admitted = todayPatients.filter(p => p.status === 'admitted' || p.status === 'awaiting-admission').length;
  const discharged = todayPatients.filter(p => p.status === 'discharged').length;
  const transferred = todayPatients.filter(p => p.status === 'transferred').length;
  const lwbs = todayPatients.filter(p => p.status === 'left-without-being-seen').length;
  const deceased = todayPatients.filter(p => p.status === 'deceased').length;
  
  // Calculate average wait time (triage to doctor)
  const waitTimes = todayPatients
    .filter(p => p.triageTime && p.assignedDoctor)
    .map(p => {
      const triageTime = p.triageTime!.getTime();
      const seenTime = p.timeline.find(t => t.type === 'doctor-assigned')?.timestamp.getTime() || new Date().getTime();
      return (seenTime - triageTime) / (1000 * 60);
    });
  
  const avgWait = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;
  
  // Calculate average length of stay
  const completedPatients = todayPatients.filter(p => 
    p.disposition?.completedAt || p.status === 'discharged' || p.status === 'admitted'
  );
  
  const losValues = completedPatients.map(p => {
    const endTime = p.disposition?.completedAt?.getTime() || new Date().getTime();
    return (endTime - p.arrivalTime.getTime()) / (1000 * 60);
  });
  
  const avgLOS = losValues.length > 0 ? Math.round(losValues.reduce((a, b) => a + b, 0) / losValues.length) : 0;
  
  const traumaActivations = todayPatients.filter(p => p.trauma.activated).length;
  
  const totalBeds = mockEmergencyBeds.length;
  const occupiedBeds = mockEmergencyBeds.filter(b => b.status === 'occupied').length;
  const bedOccupancy = Math.round((occupiedBeds / totalBeds) * 100);
  
  return {
    totalPatients: todayPatients.length,
    currentInDepartment,
    admitted,
    discharged,
    transferred,
    lwbs,
    deceased,
    averageWaitTime: avgWait,
    averageLengthOfStay: avgLOS,
    bedOccupancy,
    traumaActivations,
  };
}
