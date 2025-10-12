'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import {
  ArrowLeft,
  User,
  Stethoscope,
  Activity,
  Droplet,
  Pill,
  FileText,
  Clock,
  Heart,
  Thermometer,
  Wind,
  Zap,
  Syringe,
  ClipboardList,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Download,
  Plus,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function PatientChartPage() {
  const params = useParams();
  const patientId = params.id as string;
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [moTab, setMoTab] = useState('soap');
  const [nursingTab, setNursingTab] = useState('care-plan'); // Default to care plan tab
  const [selectedAssessment, setSelectedAssessment] = useState(''); // For dynamic filtering
  const [expandedMedication, setExpandedMedication] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('2025-10-11'); // For shift observations
  const [expandedChart, setExpandedChart] = useState<string | null>(null); // For chart modal
  const [showLabResultModal, setShowLabResultModal] = useState(false);
  const [showImagingResultModal, setShowImagingResultModal] = useState(false);
  const [showPrintRequestModal, setShowPrintRequestModal] = useState(false);
  const [selectedLabResult, setSelectedLabResult] = useState<any>(null);
  const [selectedImagingResult, setSelectedImagingResult] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  // Medication signatures state - key format: "medIdx-time-role"
  const [medSignatures, setMedSignatures] = useState<Record<string, string>>({});
  
  // Mock current user (in production, this would come from auth context)
  const currentUser = {
    id: 'N12345',
    name: 'Nurse Sarah Ahmad',
    role: 'Registered Nurse'
  };

  // Mock Lab Results
  const mockLabResults = {
    'FBC': {
      testName: 'Full Blood Count (FBC)',
      sampleType: 'Whole Blood (EDTA)',
      collectedDate: '2025-10-10 08:00',
      receivedDate: '2025-10-10 08:30',
      reportedDate: '2025-10-10 14:00',
      reportedBy: 'Dr. Siti Nurhaliza (Pathologist)',
      results: [
        { parameter: 'Haemoglobin', value: '13.5', unit: 'g/dL', referenceRange: '13.0-17.0', flag: '' },
        { parameter: 'White Blood Cell (WBC)', value: '8.2', unit: 'x10⁹/L', referenceRange: '4.0-11.0', flag: '' },
        { parameter: 'Red Blood Cell (RBC)', value: '4.8', unit: 'x10¹²/L', referenceRange: '4.5-5.5', flag: '' },
        { parameter: 'Platelet Count', value: '250', unit: 'x10⁹/L', referenceRange: '150-400', flag: '' },
        { parameter: 'Haematocrit', value: '42', unit: '%', referenceRange: '40-50', flag: '' },
        { parameter: 'MCV', value: '88', unit: 'fL', referenceRange: '80-100', flag: '' },
        { parameter: 'MCH', value: '28', unit: 'pg', referenceRange: '27-32', flag: '' },
        { parameter: 'MCHC', value: '33', unit: 'g/dL', referenceRange: '32-36', flag: '' },
        { parameter: 'Neutrophils', value: '65', unit: '%', referenceRange: '40-75', flag: '' },
        { parameter: 'Lymphocytes', value: '28', unit: '%', referenceRange: '20-40', flag: '' },
        { parameter: 'Monocytes', value: '5', unit: '%', referenceRange: '2-10', flag: '' },
        { parameter: 'Eosinophils', value: '2', unit: '%', referenceRange: '1-6', flag: '' },
      ],
      interpretation: 'All parameters within normal limits. No abnormality detected.'
    },
    'LFT': {
      testName: 'Liver Function Test (LFT)',
      sampleType: 'Serum',
      collectedDate: '2025-10-09 07:00',
      receivedDate: '2025-10-09 07:30',
      reportedDate: '2025-10-09 16:00',
      reportedBy: 'Dr. Ahmad Zaki (Pathologist)',
      results: [
        { parameter: 'Total Protein', value: '72', unit: 'g/L', referenceRange: '60-80', flag: '' },
        { parameter: 'Albumin', value: '42', unit: 'g/L', referenceRange: '35-50', flag: '' },
        { parameter: 'Globulin', value: '30', unit: 'g/L', referenceRange: '20-35', flag: '' },
        { parameter: 'Total Bilirubin', value: '15', unit: 'μmol/L', referenceRange: '5-21', flag: '' },
        { parameter: 'Direct Bilirubin', value: '4', unit: 'μmol/L', referenceRange: '0-5', flag: '' },
        { parameter: 'ALT (SGPT)', value: '28', unit: 'U/L', referenceRange: '7-56', flag: '' },
        { parameter: 'AST (SGOT)', value: '32', unit: 'U/L', referenceRange: '10-40', flag: '' },
        { parameter: 'ALP', value: '85', unit: 'U/L', referenceRange: '40-150', flag: '' },
        { parameter: 'GGT', value: '35', unit: 'U/L', referenceRange: '8-61', flag: '' },
      ],
      interpretation: 'Liver function tests are within normal limits. No hepatic dysfunction detected.'
    }
  };

  // Mock Imaging Results
  const mockImagingResults = {
    'Chest X-Ray': {
      examType: 'Chest X-Ray (PA & Lateral)',
      bodyPart: 'Chest',
      indication: 'Cough and fever for 3 days',
      performedDate: '2025-10-10 09:00',
      reportedDate: '2025-10-10 11:00',
      technique: 'PA and lateral views of the chest were obtained',
      radiologist: 'Dr. Farah Liyana (Radiologist)',
      findings: [
        'The lungs are clear bilaterally with no focal consolidation, mass, or pleural effusion.',
        'The cardiac silhouette is normal in size and configuration.',
        'The mediastinal contours are within normal limits.',
        'No pneumothorax is identified.',
        'Bony thorax shows no acute abnormality.',
        'Soft tissues are unremarkable.'
      ],
      impression: 'Normal chest radiograph. No acute cardiopulmonary abnormality detected.',
      recommendation: 'Clinical correlation advised.'
    },
    'CT Scan Brain': {
      examType: 'CT Brain (Non-contrast)',
      bodyPart: 'Brain',
      indication: 'Sudden onset headache with altered consciousness',
      performedDate: '2025-10-08 11:00',
      reportedDate: '2025-10-08 13:00',
      technique: 'Non-contrast axial CT images of the brain were obtained from skull base to vertex',
      radiologist: 'Dr. Khairul Anuar (Neuroradiologist)',
      findings: [
        'No intracranial hemorrhage, mass effect, or midline shift.',
        'The ventricles and sulci are normal in size and configuration for age.',
        'No abnormal extra-axial collection.',
        'The gray-white matter differentiation is preserved.',
        'No acute infarct identified.',
        'The visualized paranasal sinuses and mastoid air cells are clear.',
        'Bony calvarium shows no fracture or lytic lesion.'
      ],
      impression: 'No acute intracranial abnormality. Normal CT brain.',
      recommendation: 'Further evaluation with contrast-enhanced MRI may be considered if clinically indicated.'
    }
  };

  // Helper function to check if medication time is fully administered
  const isMedicationTimeComplete = (medIdx: number, time: string) => {
    const checked = medSignatures[`${medIdx}-${time}-checked`];
    const administered = medSignatures[`${medIdx}-${time}-administered`];
    const witnessed = medSignatures[`${medIdx}-${time}-witnessed`];
    return !!(checked && administered && witnessed);
  };

  // Mock patient data
  const patient = {
    id: patientId,
    name: 'Ahmad bin Hassan',
    ic: '650315-01-5678',
    age: 60,
    sex: 'M',
    ward: 'Male Medical',
    bed: 'MM-101',
    diagnosis: 'Pneumonia',
    admissionDate: '2025-10-05',
    doctor: 'Dr. Rashid bin Ahmad',
    allergies: ['Penicillin', 'Sulfa drugs'],
    status: 'Stable',
    medicalHistory: [
      {
        date: '2025-09-15',
        location: 'ETU',
        complaint: 'Chest pain',
        diagnosis: 'Angina pectoris',
        outcome: 'Discharged home',
      },
      {
        date: '2025-06-20',
        location: 'General Ward',
        complaint: 'High fever, cough',
        diagnosis: 'Upper respiratory tract infection',
        outcome: 'Discharged home',
      },
      {
        date: '2024-11-10',
        location: 'ETU',
        complaint: 'Shortness of breath',
        diagnosis: 'COPD exacerbation',
        outcome: 'Admitted to ward, then discharged',
      },
    ],
    caretaker: {
      name: 'Fatimah binti Ahmad',
      relationship: 'Spouse',
      ic: '680420-12-3456',
      phone: '013-2345678',
      address: 'No 12, Jalan Bahagia, Taman Sentosa, 50100 Kuala Lumpur',
      emergencyContact: '013-2345678',
      alternateContact: '019-8765432',
      orientationCompleted: true,
      orientationDate: '2025-10-05 09:30',
      orientationBy: 'Sr. Aminah',
    },
  };

  // Mock vital signs data
  const vitalSigns = [
    { time: '06:00', temp: 37.2, hr: 78, bp: '130/85', rr: 18, spo2: 97, gcs: '15/15' },
    { time: '10:00', temp: 37.5, hr: 82, bp: '135/88', rr: 20, spo2: 96, gcs: '15/15' },
    { time: '14:00', temp: 37.8, hr: 85, bp: '138/90', rr: 22, spo2: 95, gcs: '15/15' },
    { time: '18:00', temp: 37.4, hr: 80, bp: '132/86', rr: 19, spo2: 96, gcs: '15/15' },
    { time: '22:00', temp: 37.1, hr: 76, bp: '128/82', rr: 18, spo2: 98, gcs: '15/15' },
  ];

  // Mock glucose readings
  const glucoseReadings = [
    { date: '2025-10-08', time: '07:00', type: 'Fasting', value: 7.2, unit: 'mmol/L' },
    { date: '2025-10-08', time: '12:00', type: 'Post-meal', value: 9.1, unit: 'mmol/L' },
    { date: '2025-10-08', time: '18:00', type: 'Pre-meal', value: 6.9, unit: 'mmol/L' },
    { date: '2025-10-08', time: '22:00', type: 'Before sleep', value: 7.5, unit: 'mmol/L' },
    { date: '2025-10-09', time: '07:00', type: 'Fasting', value: 6.8, unit: 'mmol/L' },
    { date: '2025-10-09', time: '12:00', type: 'Post-meal', value: 8.5, unit: 'mmol/L' },
    { date: '2025-10-09', time: '18:00', type: 'Pre-meal', value: 7.3, unit: 'mmol/L' },
    { date: '2025-10-09', time: '22:00', type: 'Before sleep', value: 6.9, unit: 'mmol/L' },
    { date: '2025-10-10', time: '07:00', type: 'Fasting', value: 6.5, unit: 'mmol/L' },
    { date: '2025-10-10', time: '12:00', type: 'Post-meal', value: 8.2, unit: 'mmol/L' },
    { date: '2025-10-10', time: '18:00', type: 'Pre-meal', value: 7.1, unit: 'mmol/L' },
    { date: '2025-10-10', time: '22:00', type: 'Before sleep', value: 6.8, unit: 'mmol/L' },
  ];

  // Mock medications
  const medications = [
    { name: 'Ceftriaxone 1g IV', dose: '1g', route: 'IV', frequency: 'BD', time: '08:00, 20:00', status: 'Active' },
    { name: 'Paracetamol 1g', dose: '1g', route: 'PO', frequency: 'TDS', time: '08:00, 14:00, 20:00', status: 'Active' },
    { name: 'Salbutamol Nebulizer', dose: '2.5mg', route: 'Neb', frequency: 'QID', time: '06:00, 12:00, 18:00, 24:00', status: 'Active' },
  ];

  // Mock IV fluids/drips
  const ivFluids = [
    { fluid: 'Normal Saline 0.9%', volume: '1000ml', rate: '125ml/hr', started: '2025-10-09 08:00', status: 'Running' },
    { fluid: 'Dextrose 5%', volume: '500ml', rate: '100ml/hr', started: '2025-10-09 14:00', status: 'Running' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Professional Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <Link href="/general-ward">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-slate-100">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Ward
                </Button>
              </Link>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{patient.name}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="font-medium">IC: {patient.ic}</span>
                  <span className="text-slate-300">|</span>
                  <span>{patient.age} years, {patient.sex}</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-semibold text-blue-600">{patient.bed}</span>
                  <span className="text-slate-300">|</span>
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold border border-red-200">
                    ⚠️ Allergies: {patient.allergies.join(', ')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 h-10 px-5 border-slate-300 hover:bg-slate-50">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button 
                onClick={() => setShowDischargeModal(true)}
                className="gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <FileText className="h-4 w-4" />
                Discharge Notes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-slate-50 min-h-screen">
        <div className="max-w-[1800px] mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-lg bg-white p-1.5 shadow-md border border-slate-200">
            <TabsTrigger value="overview" className="px-6 py-2 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-medium">
              Overview
            </TabsTrigger>
            <TabsTrigger value="caretaker" className="px-6 py-2 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-medium">
              Caretaker
            </TabsTrigger>
            <TabsTrigger value="orientation" className="px-6 py-2 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-medium">
              Orientation
            </TabsTrigger>
            <TabsTrigger value="mo-assessment" className="px-6 py-2 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-medium">
              MO Assessment
            </TabsTrigger>
            <TabsTrigger value="nursing" className="px-6 py-2 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-medium">
              Nursing Assessment
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Patient Information */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Full Name</div>
                    <div className="font-semibold text-slate-900">{patient.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">IC Number</div>
                    <div className="font-semibold text-slate-900">{patient.ic}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Age</div>
                    <div className="font-semibold text-slate-900">{patient.age} years</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Gender</div>
                    <div className="font-semibold text-slate-900">{patient.sex === 'M' ? 'Male' : 'Female'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Ward</div>
                    <div className="font-semibold text-slate-900">{patient.ward}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Bed</div>
                    <div className="font-semibold text-slate-900">{patient.bed}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Diagnosis</div>
                    <div className="font-semibold text-slate-900">{patient.diagnosis}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Admission Date</div>
                    <div className="font-semibold text-slate-900">{patient.admissionDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Current Status</div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      {patient.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Caretaker</div>
                    <div className="font-semibold text-slate-900">{patient.caretaker.name}</div>
                    <div className="text-xs text-slate-600 mt-1">{patient.caretaker.relationship}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Contact</div>
                    <div className="text-xs text-blue-600">{patient.caretaker.phone}</div>
                    {patient.caretaker.orientationCompleted && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Oriented</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Latest Vital Signs */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Latest Vital Signs
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: Thermometer, label: 'Temperature', value: vitalSigns[vitalSigns.length - 1].temp + '°C', color: 'text-red-600' },
                      { icon: Heart, label: 'Heart Rate', value: vitalSigns[vitalSigns.length - 1].hr + ' bpm', color: 'text-pink-600' },
                      { icon: Activity, label: 'Blood Pressure', value: vitalSigns[vitalSigns.length - 1].bp + ' mmHg', color: 'text-blue-600' },
                      { icon: Wind, label: 'Resp Rate', value: vitalSigns[vitalSigns.length - 1].rr + ' /min', color: 'text-cyan-600' },
                      { icon: Zap, label: 'SpO2', value: vitalSigns[vitalSigns.length - 1].spo2 + '%', color: 'text-purple-600' },
                      { icon: Stethoscope, label: 'GCS', value: vitalSigns[vitalSigns.length - 1].gcs, color: 'text-emerald-600' },
                      { icon: AlertCircle, label: 'Pain Score', value: '3/10', color: 'text-orange-600' },
                      { icon: Droplet, label: 'Glucose', value: glucoseReadings[glucoseReadings.length - 1].value + ' mmol/L', color: 'text-indigo-600' },
                    ].map((vital, idx) => {
                      const Icon = vital.icon;
                      return (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Icon className={`h-5 w-5 ${vital.color}`} />
                          <div className="flex-1">
                            <div className="text-xs text-slate-500">{vital.label}</div>
                            <div className="text-lg font-bold text-slate-900">{vital.value}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Latest Plan */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-emerald-600" />
                    Latest Plan
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="text-xs text-emerald-700 font-semibold mb-1">Assessment</div>
                      <div className="text-sm text-slate-900">Community-acquired pneumonia, stable condition</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xs text-blue-700 font-semibold mb-1">Treatment Plan</div>
                      <ul className="text-sm text-slate-900 space-y-1">
                        <li>• Continue IV antibiotics</li>
                        <li>• Chest physiotherapy BD</li>
                        <li>• Monitor vitals QID</li>
                        <li>• Incentive spirometry</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-xs text-amber-700 font-semibold mb-1">Follow-up</div>
                      <div className="text-sm text-slate-900">Review CXR tomorrow, consider step-down antibiotics if improving</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Latest Medication */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Pill className="h-5 w-5 text-green-600" />
                    Latest Medication
                  </h3>
                  <div className="space-y-3">
                    {medications.map((med, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="font-semibold text-slate-900 text-sm mb-1">{med.name}</div>
                        <div className="text-xs text-slate-600 space-y-0.5">
                          <div>Dose: {med.dose} - {med.route}</div>
                          <div>Frequency: {med.frequency}</div>
                          <div>Timing: {med.time}</div>
                        </div>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            med.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {med.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Medical History */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Medical History
                </h3>
                <div className="space-y-3">
                  {patient.medicalHistory.map((visit, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-900">{visit.date}</span>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          visit.location === 'ETU' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {visit.location}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700 font-medium mb-1">{visit.complaint}</div>
                      <div className="text-sm text-slate-600">
                        <span className="font-semibold">Dx:</span> {visit.diagnosis}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        <span className="font-semibold">Outcome:</span> {visit.outcome}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Caretaker Information Tab */}
          <TabsContent value="caretaker" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Caretaker Information</h3>
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4" />
                    Edit Caretaker
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-700 mb-1">Full Name</div>
                      <div className="font-bold text-blue-900 text-lg">{patient.caretaker.name}</div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">IC Number</div>
                      <div className="font-semibold text-slate-900">{patient.caretaker.ic}</div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Relationship to Patient</div>
                      <div className="font-semibold text-slate-900">{patient.caretaker.relationship}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Primary Contact</div>
                      <div className="font-semibold text-slate-900">{patient.caretaker.phone}</div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Emergency Contact</div>
                      <div className="font-semibold text-slate-900">{patient.caretaker.emergencyContact}</div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Alternate Contact</div>
                      <div className="font-semibold text-slate-900">{patient.caretaker.alternateContact}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-600 mb-1">Address</div>
                  <div className="font-semibold text-slate-900">{patient.caretaker.address}</div>
                </div>

                {patient.caretaker.orientationCompleted && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="font-bold text-green-900">Orientation Completed</div>
                    </div>
                    <div className="text-sm text-green-700">
                      Completed on {patient.caretaker.orientationDate} by {patient.caretaker.orientationBy}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orientation Tab */}
          <TabsContent value="orientation" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Ward Orientation for Caretaker</h3>
                  {patient.caretaker.orientationCompleted ? (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Completed
                    </span>
                  ) : (
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                      Mark as Completed
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Orientation Checklist */}
                  <div className="p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Orientation Checklist
                    </h4>
                    <div className="space-y-3">
                      {[
                        'Ward visiting hours (2:00 PM - 4:00 PM, 7:00 PM - 9:00 PM)',
                        'Maximum 2 visitors per patient at a time',
                        'Location of toilets and prayer room',
                        'Nurse station and call bell system',
                        'Meal times and dietary requirements',
                        'Patient belongings and valuables policy',
                        'Infection control and hand hygiene',
                        'Quiet hours (10:00 PM - 7:00 AM)',
                        'Mobile phone usage restrictions',
                        'Parking facilities and cafeteria location',
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                          <input 
                            type="checkbox" 
                            defaultChecked={patient.caretaker.orientationCompleted}
                            className="mt-1 h-5 w-5 text-blue-600 rounded"
                          />
                          <span className="text-sm text-slate-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ward Rules & Regulations */}
                  <div className="p-5 bg-amber-50 rounded-xl border-2 border-amber-200">
                    <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Important Ward Rules
                    </h4>
                    <ul className="space-y-2 text-sm text-amber-900">
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>Children under 12 years old are not allowed in the ward</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>No outside food or beverages without doctor's permission</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>Smoking is strictly prohibited in hospital premises</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>Please maintain cleanliness and report any spills immediately</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>Inform nursing staff before leaving the ward</span>
                      </li>
                    </ul>
                  </div>

                  {/* Contact Information */}
                  <div className="p-5 bg-slate-50 rounded-xl border-2 border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4">Important Contact Numbers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-xs text-slate-600">Nurse Station ({patient.ward})</div>
                        <div className="font-bold text-slate-900 text-lg">03-2222 3344</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-xs text-slate-600">Emergency</div>
                        <div className="font-bold text-red-600 text-lg">999</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-xs text-slate-600">Doctor on Call</div>
                        <div className="font-bold text-slate-900 text-lg">03-2222 3355</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-xs text-slate-600">Patient Relations</div>
                        <div className="font-bold text-slate-900 text-lg">03-2222 3366</div>
                      </div>
                    </div>
                  </div>

                  {/* Acknowledgement */}
                  <div className="p-5 bg-green-50 rounded-xl border-2 border-green-200">
                    <h4 className="font-bold text-green-900 mb-4">Caretaker Acknowledgement</h4>
                    <div className="space-y-4">
                      <div className="p-3 bg-white rounded-lg">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Caretaker Signature</label>
                        <div className="h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                          {patient.caretaker.orientationCompleted ? (
                            <span className="text-green-600 font-semibold">Signed on {patient.caretaker.orientationDate}</span>
                          ) : (
                            'Click to sign'
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 italic">
                        By signing above, I acknowledge that I have received and understood the ward orientation, 
                        rules, and regulations. I agree to comply with all hospital policies during my stay.
                      </div>
                    </div>
                  </div>

                  {!patient.caretaker.orientationCompleted && (
                    <div className="flex justify-end gap-3">
                      <Button variant="outline">Save as Draft</Button>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        Complete Orientation
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MO Assessment Tab */}
          <TabsContent value="mo-assessment" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Medical Officer Daily Assessment & Plan</h3>

                <Tabs value={moTab} onValueChange={setMoTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-6 bg-white p-1 rounded-xl shadow-md border border-slate-200">
                    <TabsTrigger value="soap" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">SOAP Notes</TabsTrigger>
                    <TabsTrigger value="medications" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Medications</TabsTrigger>
                    <TabsTrigger value="iv-drips" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">IV Drips</TabsTrigger>
                    <TabsTrigger value="oxygen" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">Oxygen</TabsTrigger>
                    <TabsTrigger value="lab-orders" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Lab Orders</TabsTrigger>
                    <TabsTrigger value="imaging-orders" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Imaging Orders</TabsTrigger>
                  </TabsList>

                  {/* SOAP Notes Tab */}
                  <TabsContent value="soap" className="space-y-6">
                  {/* Today's Assessment Form */}
                  <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <h4 className="font-bold text-blue-900">Today - {new Date().toLocaleDateString()}</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Subjective (S)</label>
                        <Textarea 
                          placeholder="Patient's complaints and symptoms..."
                          className="min-h-24 bg-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Objective (O)</label>
                        <Textarea 
                          placeholder="Physical examination findings, vital signs, lab results..."
                          className="min-h-24 bg-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Assessment (A)</label>
                        <Textarea 
                          placeholder="Clinical impression and diagnosis..."
                          className="min-h-24 bg-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Plan (P)</label>
                        <Textarea 
                          placeholder="Treatment plan, investigations, follow-up..."
                          className="min-h-32 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline">Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Assessment</Button>
                  </div>

                  {/* Previous Assessments */}
                  <div className="mt-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900">Previous Assessments</h4>
                      
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-semibold text-slate-900">2025-10-09 08:30</div>
                            <div className="text-sm text-slate-600">Dr. Rashid bin Ahmad</div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold text-slate-700">S:</span>
                            <span className="text-slate-600 ml-2">Patient complains of productive cough, fever for 3 days</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700">O:</span>
                            <span className="text-slate-600 ml-2">T: 38.2°C, HR: 95, BP: 140/90, SpO2: 94% RA. Chest: bilateral crepitations</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700">A:</span>
                            <span className="text-slate-600 ml-2">Community-acquired pneumonia, stable</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700">P:</span>
                            <span className="text-slate-600 ml-2">Continue IV Ceftriaxone, chest physiotherapy, monitor vitals QID</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </TabsContent>

                  {/* Medications Tab */}
                  <TabsContent value="medications">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                          <Pill className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">Current Medications</h4>
                          <p className="text-xs text-slate-600">Manage patient medication orders</p>
                        </div>
                      </div>
                      <Button className="gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/30">
                        <Plus className="h-4 w-4" />
                        Add Medication
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {medications.map((med, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white border-b border-slate-200">
                            <div className="font-bold text-slate-900 text-lg">{med.name}</div>
                            <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Stop Drug
                            </Button>
                          </div>
                          <div className="p-4 bg-slate-50/50">
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Dose</label>
                                <Input 
                                  value={med.dose} 
                                  className="h-9 text-sm font-medium bg-slate-100 cursor-not-allowed" 
                                  readOnly 
                                  disabled
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Frequency</label>
                                <Input 
                                  value={med.frequency} 
                                  className="h-9 text-sm font-medium bg-slate-100 cursor-not-allowed" 
                                  readOnly 
                                  disabled
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Route</label>
                                <Input 
                                  value={med.route} 
                                  className="h-9 text-sm font-medium bg-slate-100 cursor-not-allowed" 
                                  readOnly 
                                  disabled
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Duration</label>
                                <Input 
                                  value="7 days" 
                                  className="h-9 text-sm font-medium bg-slate-100 cursor-not-allowed" 
                                  readOnly 
                                  disabled
                                />
                              </div>
                            </div>
                            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs text-amber-800 flex items-center gap-2">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="font-semibold">Prescribed orders cannot be modified.</span> To change dose/frequency/route, stop this medication and add a new order.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  </TabsContent>

                  {/* IV Drips Tab */}
                  <TabsContent value="iv-drips">
                  <div className="p-6 bg-cyan-50 rounded-xl border-2 border-cyan-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-cyan-900 flex items-center gap-2">
                        <Droplet className="h-5 w-5" />
                        Current IV Drips
                      </h4>
                      <Button size="sm" className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                        <Plus className="h-4 w-4" />
                        Add IV Line
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {ivFluids.map((fluid, idx) => (
                        <div key={idx} className="p-4 bg-white rounded-lg border border-cyan-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900">{fluid.fluid}</div>
                              <div className="grid grid-cols-3 gap-4 mt-2">
                                <div>
                                  <label className="block text-xs text-slate-600 mb-1">Volume</label>
                                  <Input defaultValue={fluid.volume} className="h-8 text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-600 mb-1">Rate</label>
                                  <Input defaultValue={fluid.rate} className="h-8 text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-600 mb-1">Status</label>
                                  <select className="w-full h-8 px-2 text-sm border border-slate-300 rounded">
                                    <option>{fluid.status}</option>
                                    <option>Running</option>
                                    <option>Stopped</option>
                                    <option>Completed</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50">
                              Stop
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  </TabsContent>

                  {/* Oxygen Tab */}
                  <TabsContent value="oxygen">
                  <div className="p-6 bg-teal-50 rounded-xl border-2 border-teal-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-teal-900 flex items-center gap-2">
                        <Wind className="h-5 w-5" />
                        Oxygen Therapy
                      </h4>
                      <Button size="sm" className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                        <Plus className="h-4 w-4" />
                        Update Oxygen
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="p-6 bg-white rounded-xl border-2 border-teal-200">
                        <div className="flex items-center gap-3 mb-4">
                          <Wind className="h-8 w-8 text-teal-600" />
                          <div>
                            <div className="text-sm text-teal-700">Oxygen Delivery Method</div>
                            <div className="font-bold text-teal-900 text-xl">Nasal Prongs</div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Delivery Method</label>
                            <select className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg">
                              <option>Nasal Prongs</option>
                              <option>Face Mask</option>
                              <option>Non-Rebreather Mask</option>
                              <option>Venturi Mask</option>
                              <option>High Flow Nasal Cannula</option>
                              <option>Room Air</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Flow Rate (L/min)</label>
                            <Input type="number" defaultValue="3" className="text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">FiO2 (%)</label>
                            <Input type="number" defaultValue="32" className="text-sm" />
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-white rounded-xl border-2 border-teal-200">
                        <div className="flex items-center gap-3 mb-4">
                          <Zap className="h-8 w-8 text-purple-600" />
                          <div>
                            <div className="text-sm text-purple-700">Current SpO2</div>
                            <div className="font-bold text-purple-900 text-xl">96%</div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Target SpO2 (%)</label>
                            <Input type="number" defaultValue="94" className="text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Status</label>
                            <select className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg">
                              <option>Adequate</option>
                              <option>Inadequate</option>
                              <option>Wean Trial</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Notes</label>
                            <Textarea placeholder="Oxygen therapy notes..." className="min-h-20 text-sm" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-teal-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date/Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Device</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Flow Rate</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">FiO2</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">SpO2</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          <tr className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">2025-10-10 08:00</td>
                            <td className="px-4 py-3 text-sm text-slate-600">Nasal Prongs</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900">3 L/min</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900">32%</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-green-600">96%</td>
                            <td className="px-4 py-3 text-sm text-slate-600">Patient comfortable, no SOB</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">2025-10-09 14:00</td>
                            <td className="px-4 py-3 text-sm text-slate-600">Face Mask</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900">6 L/min</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900">40%</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-orange-600">94%</td>
                            <td className="px-4 py-3 text-sm text-slate-600">Weaned to nasal prongs as SpO2 improved</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  </TabsContent>

                  {/* Lab Orders Tab */}
                  <TabsContent value="lab-orders">
                  <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-purple-900 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Laboratory Orders
                      </h4>
                      <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                        <Plus className="h-4 w-4" />
                        Add Lab Test
                      </Button>
                    </div>
                    <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Test Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Urgency</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ordered Date</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          <tr>
                            <td className="px-4 py-3 text-sm text-slate-900">Full Blood Count (FBC)</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">Urgent</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">2025-10-09 08:30</td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Sent</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <Button size="sm" variant="outline" className="text-xs">View Result</Button>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-slate-900">Chest X-Ray</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">Routine</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">2025-10-09 08:30</td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Completed</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <Button size="sm" variant="outline" className="text-xs">View Result</Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  </TabsContent>

                  {/* Imaging Orders Tab */}
                  <TabsContent value="imaging-orders">
                  <div className="p-6 bg-indigo-50 rounded-xl border-2 border-indigo-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Imaging Orders
                      </h4>
                      <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="h-4 w-4" />
                        Add Imaging
                      </Button>
                    </div>
                    <div className="bg-white rounded-lg border border-indigo-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Imaging Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Body Part</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Urgency</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ordered Date</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          <tr>
                            <td className="px-4 py-3 text-sm text-slate-900">Chest X-Ray</td>
                            <td className="px-4 py-3 text-sm text-slate-600">Chest (PA view)</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">Urgent</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">2025-10-09 08:30</td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Completed</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <Button size="sm" variant="outline" className="text-xs">View Image</Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nursing Assessment Tab with Nested Tabs */}
          <TabsContent value="nursing" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <Tabs value={nursingTab} onValueChange={setNursingTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-10 bg-slate-100 p-1.5 rounded-xl shadow-md border border-slate-300 mb-6">
                    <TabsTrigger value="care-plan" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">Care Plan</TabsTrigger>
                    <TabsTrigger value="notes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">Nursing Notes</TabsTrigger>
                    <TabsTrigger value="vitals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">Vital Signs</TabsTrigger>
                    <TabsTrigger value="glucose" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">Glucose</TabsTrigger>
                    <TabsTrigger value="medications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">Medications</TabsTrigger>
                    <TabsTrigger value="fluids" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">IV Fluids</TabsTrigger>
                    <TabsTrigger value="intake-output" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">Intake & Output</TabsTrigger>
                    <TabsTrigger value="oxygen" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">Oxygen</TabsTrigger>
                    <TabsTrigger value="lab-orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">Lab Orders</TabsTrigger>
                    <TabsTrigger value="imaging-orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">Imaging Orders</TabsTrigger>
                  </TabsList>

                  {/* Nursing Care Plan Tab - NEW */}
                  <TabsContent value="care-plan">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                            <FileText className="h-5 w-5 text-white" />
                          </span>
                          New Nursing Care Plan Entry
                        </h3>

                        <div className="space-y-6">
                          {/* Auto Date Display */}
                          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                            <div className="text-sm font-semibold text-blue-900 mb-1">Date & Time</div>
                            <div className="text-xl font-bold text-blue-700">
                              {new Date().toLocaleString('en-MY', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>

                          {/* Nursing Assessment Dropdown */}
                          <div>
                            <label className="block text-sm font-bold text-slate-900 mb-3">
                              <span className="text-red-600">*</span> Nursing Assessment (Patient Complaint)
                            </label>
                            <select 
                              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={selectedAssessment}
                              onChange={(e) => setSelectedAssessment(e.target.value)}
                            >
                              <option value="">-- Select Assessment --</option>
                              <option value="acute_pain">Acute Pain</option>
                              <option value="ineffective_breathing">Ineffective Breathing Pattern</option>
                              <option value="risk_infection">Risk for Infection</option>
                              <option value="impaired_mobility">Impaired Physical Mobility</option>
                              <option value="fluid_volume_deficit">Fluid Volume Deficit</option>
                              <option value="anxiety">Anxiety</option>
                              <option value="sleep_disturbance">Disturbed Sleep Pattern</option>
                              <option value="constipation">Constipation</option>
                              <option value="risk_falls">Risk for Falls</option>
                              <option value="impaired_skin">Impaired Skin Integrity</option>
                              <option value="knowledge_deficit">Knowledge Deficit</option>
                              <option value="nausea">Nausea</option>
                              <option value="fever">Fever / Hyperthermia</option>
                              <option value="decreased_cardiac">Decreased Cardiac Output</option>
                              <option value="others">Others (Please Specify)</option>
                            </select>
                          </div>

                          {/* Conditional rendering: show warning if no assessment selected */}
                          {!selectedAssessment && (
                            <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-lg text-center">
                              <p className="text-amber-800 font-semibold text-lg">⚠️ Please select a Nursing Assessment first</p>
                              <p className="text-amber-700 text-sm mt-2">Goals, Interventions, and Evaluations will be filtered based on your assessment choice</p>
                            </div>
                          )}

                          {/* Show form fields only if assessment is selected */}
                          {selectedAssessment && (
                            <>
                              {/* Nursing Goal */}
                              <div>
                                <label className="block text-sm font-bold text-slate-900 mb-3">
                                  <span className="text-red-600">*</span> Nursing Goal (Select Multiple)
                                </label>
                                {selectedAssessment === 'others' ? (
                                  <div className="space-y-3">
                                    <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                                      <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-bold text-amber-800">Others (Please Specify)</span>
                                      </label>
                                    </div>
                                    <Textarea 
                                      placeholder="Please specify your nursing goals..."
                                      className="w-full text-base"
                                      rows={3}
                                    />
                                  </div>
                                ) : (
                                  <div className="border-2 border-slate-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-white space-y-2">
                                    {/* Goals will be filtered based on assessment */}
                                    {selectedAssessment === 'acute_pain' && (
                                      <>
                                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                          <span className="text-sm">Patient will report pain level ≤ 3/10 within 1 hour</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                          <span className="text-sm">Patient will demonstrate relaxation techniques before discharge</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                          <span className="text-sm">Patient will participate in activities of daily living with minimal discomfort</span>
                                        </label>
                                      </>
                                    )}
                                    {selectedAssessment === 'ineffective_breathing' && (
                                      <>
                                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                          <span className="text-sm">Patient will maintain oxygen saturation &gt;95% on room air within 72 hours</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                          <span className="text-sm">Patient will demonstrate effective breathing techniques within 24 hours</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                          <span className="text-sm">Patient will report decreased dyspnea within 48 hours</span>
                                        </label>
                                      </>
                                    )}
                                    {selectedAssessment === 'risk_infection' && (
                                      <>
                                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                          <span className="text-sm">Patient will remain free from signs of infection during hospitalization</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                          <span className="text-sm">Patient will maintain temperature within normal limits (36.5-37.5°C)</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                          <span className="text-sm">Wound site will remain clean, dry, and intact without redness or discharge</span>
                                        </label>
                                      </>
                                    )}
                                    {/* Add similar blocks for other assessments */}
                                    <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded cursor-pointer border-t-2 border-amber-200 mt-3">
                                      <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                      <span className="text-sm font-bold text-amber-700">Others (Please Specify)</span>
                                    </label>
                                  </div>
                                )}
                              </div>

                              {/* Nursing Intervention */}
                              <div>
                                <label className="block text-sm font-bold text-slate-900 mb-3">
                                  <span className="text-red-600">*</span> Nursing Intervention (Select Multiple)
                                </label>
                                {selectedAssessment === 'others' ? (
                                  <div className="space-y-3">
                                    <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                                      <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-bold text-amber-800">Others (Please Specify)</span>
                                      </label>
                                    </div>
                                    <Textarea 
                                      placeholder="Please specify your nursing interventions..."
                                      className="w-full text-base"
                                      rows={3}
                                    />
                                  </div>
                                ) : (
                                  <div className="border-2 border-slate-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-white space-y-2">
                                    {selectedAssessment === 'acute_pain' && (
                                      <>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Assessed pain using pain scale (0-10), documented location, quality, and intensity</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Administered prescribed analgesics as ordered, monitored effectiveness after 30-60 minutes</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Applied non-pharmacological pain relief: positioning, cold/heat therapy, relaxation techniques</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Educated patient on pain management strategies and when to report worsening pain</span>
                                        </label>
                                      </>
                                    )}
                                    {selectedAssessment === 'ineffective_breathing' && (
                                      <>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Positioned patient in semi-Fowler's or high-Fowler's position to optimize lung expansion</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Administered oxygen therapy as prescribed, monitored SpO2 continuously</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Encouraged deep breathing exercises and incentive spirometry every 2 hours while awake</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Monitored respiratory rate, rhythm, effort; auscultated lung sounds every 4 hours</span>
                                        </label>
                                      </>
                                    )}
                                    {selectedAssessment === 'risk_infection' && (
                                      <>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Performed hand hygiene before and after all patient contact and procedures</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Maintained aseptic technique during wound care and dressing changes</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Monitored vital signs with focus on temperature, WBC count, and signs of inflammation</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Educated patient and family on infection prevention measures</span>
                                        </label>
                                      </>
                                    )}
                                    <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border-t-2 border-amber-200 mt-3">
                                      <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                      <span className="text-sm font-bold text-amber-700">Others (Please Specify)</span>
                                    </label>
                                  </div>
                                )}
                              </div>

                              {/* Nursing Evaluation */}
                              <div>
                                <label className="block text-sm font-bold text-slate-900 mb-3">
                                  <span className="text-red-600">*</span> Nursing Evaluation / Patient Response (Select Multiple)
                                </label>
                                {selectedAssessment === 'others' ? (
                                  <div className="space-y-3">
                                    <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                                      <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" className="mt-1 h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-bold text-amber-800">Others (Please Specify)</span>
                                      </label>
                                    </div>
                                    <Textarea 
                                      placeholder="Please specify evaluation outcomes..."
                                      className="w-full text-base"
                                      rows={3}
                                    />
                                  </div>
                                ) : (
                                  <div className="border-2 border-slate-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-white space-y-2">
                                    {selectedAssessment === 'acute_pain' && (
                                      <>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Goal met: Patient reports pain reduced to 2/10, appears comfortable and relaxed</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Goal partially met: Pain decreased from 8/10 to 5/10, continue current interventions</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Goal not met: Pain remains at 7/10, patient requesting stronger pain medication - notify doctor</span>
                                        </label>
                                      </>
                                    )}
                                    {selectedAssessment === 'ineffective_breathing' && (
                                      <>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Goal met: Patient's SpO2 maintained at 97%, respiratory rate 18/min, no dyspnea reported</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Goal partially met: SpO2 at 94% on 2L O2, continue monitoring and interventions</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Goal not met: Patient remains dyspneic, SpO2 92% despite oxygen - escalate to medical team</span>
                                        </label>
                                      </>
                                    )}
                                    {selectedAssessment === 'risk_infection' && (
                                      <>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Goal met: No signs of infection, temperature 36.8°C, wound clean and healing well</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Goal partially met: Temperature slightly elevated at 37.8°C, continue monitoring</span>
                                        </label>
                                        <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border border-slate-200">
                                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Goal not met: Signs of infection present (redness, warmth, purulent discharge) - notify doctor immediately</span>
                                        </label>
                                      </>
                                    )}
                                    <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border-t-2 border-amber-200 mt-3">
                                      <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600" />
                                      <span className="text-sm font-bold text-amber-700">Others (Please Specify)</span>
                                    </label>
                                  </div>
                                )}
                              </div>

                              {/* Nurse Signature */}
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-slate-200">
                                <div>
                                  <label className="block text-sm font-bold text-slate-900 mb-2">Nurse Name</label>
                                  <Input 
                                    type="text" 
                                    placeholder="Enter your full name"
                                    className="text-base"
                                    defaultValue={currentUser.name}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-slate-900 mb-2">Nurse ID</label>
                                  <Input 
                                    type="text" 
                                    placeholder="Enter your staff ID"
                                    className="text-base"
                                    defaultValue={currentUser.id}
                                  />
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" className="px-6">Clear Form</Button>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                                  Save Care Plan Entry
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Historical Care Plan Entries */}
                    <Card className="border-0 shadow-lg mt-6">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Previous Care Plan Entries
                        </h3>
                        
                        {/* Day 1 Example Entries */}
                        <div className="mb-8">
                          <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-slate-300">
                            <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-lg">
                              Day 1
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {new Date(Date.now() - 86400000).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <span className="text-xs text-slate-500">(3 entries today)</span>
                          </div>

                          {/* Entry 1 - Morning */}
                          <div className="mb-4 p-5 bg-slate-50 rounded-xl border-2 border-slate-200">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                                    08:30
                                  </span>
                                  <span className="text-xs font-semibold text-green-700">Morning Shift Assessment</span>
                                </div>
                                <div className="text-xs text-slate-600 mt-1">
                                  Documented by: <span className="font-semibold">{currentUser.name} ({currentUser.id})</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <div className="text-sm font-bold text-blue-900 mb-1">Assessment:</div>
                                <div className="text-sm text-slate-700 bg-white p-3 rounded-lg">Acute Pain (Post-operative incision site)</div>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-blue-900 mb-1">Goal:</div>
                                <div className="text-sm text-slate-700 bg-white p-3 rounded-lg">Patient will report pain level ≤ 3/10 within 1 hour</div>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-blue-900 mb-1">Intervention:</div>
                                <div className="text-sm text-slate-700 bg-white p-3 rounded-lg">Administered prescribed analgesics, applied positioning techniques, educated on pain management</div>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-blue-900 mb-1">Evaluation:</div>
                                <div className="text-sm text-slate-700 bg-white p-3 rounded-lg">Goal met: Patient reports pain reduced to 2/10, appears comfortable and relaxed</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Nursing Notes Tab */}
                  <TabsContent value="notes">
                    <div className="space-y-6">
                      {/* Nursing Assessment */}
                      <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Nursing Assessment</h3>
                            <div className="flex items-center gap-3">
                              <select 
                                className="px-4 py-2 border-2 border-slate-300 rounded-lg font-semibold text-sm"
                                defaultValue="am"
                              >
                                <option value="am">AM Shift (07:00-14:00)</option>
                                <option value="pm">PM Shift (14:00-21:00)</option>
                                <option value="night">Night Shift (21:00-07:00)</option>
                              </select>
                              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="h-4 w-4" />
                                New Assessment
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">General Condition</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                  <option>Alert and oriented</option>
                                  <option>Drowsy but rousable</option>
                                  <option>Confused</option>
                                  <option>Unresponsive</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Skin Condition</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                  <option>Normal</option>
                                  <option>Pale</option>
                                  <option>Cyanosed</option>
                                  <option>Jaundiced</option>
                                  <option>Rash present</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Mobility</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                  <option>Fully mobile</option>
                                  <option>Mobile with assistance</option>
                                  <option>Bed bound</option>
                                  <option>Wheelchair bound</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Pain Score (0-10)</label>
                                <Input type="number" min="0" max="10" placeholder="0-10" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nutritional Status</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                  <option>Taking full diet</option>
                                  <option>Taking half diet</option>
                                  <option>Poor appetite</option>
                                  <option>NPO</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Elimination</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                  <option>Normal bowel/bladder</option>
                                  <option>Constipated</option>
                                  <option>Diarrhea</option>
                                  <option>Catheterized</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nursing Notes</label>
                            <Textarea placeholder="Additional nursing observations and notes..." className="min-h-24" />
                          </div>

                          {/* Takeover Notes Section */}
                          <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                            <label className="block text-sm font-bold text-blue-900 mb-2">🔵 Takeover Notes (Acknowledge Handover)</label>
                            <div className="text-xs text-slate-600 mb-2">Review handover from previous shift and document your acknowledgement and plan</div>
                            <Textarea 
                              placeholder="Acknowledge handover and document your plan for this shift..."
                              className="min-h-24 bg-white"
                            />
                          </div>

                          <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline">Cancel</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Assessment</Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Shift Observations with Date Navigation */}
                      <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Shift Observations (Historical View)</h3>
                            
                            {/* Date Navigator */}
                            <div className="flex items-center gap-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const currentDate = new Date(selectedDate);
                                  currentDate.setDate(currentDate.getDate() - 1);
                                  setSelectedDate(currentDate.toISOString().split('T')[0]);
                                }}
                              >
                                ← Previous Day
                              </Button>
                              <div className="px-4 py-2 bg-blue-100 rounded-lg border-2 border-blue-300">
                                <span className="font-bold text-blue-900">{selectedDate}</span>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const currentDate = new Date(selectedDate);
                                  currentDate.setDate(currentDate.getDate() + 1);
                                  setSelectedDate(currentDate.toISOString().split('T')[0]);
                                }}
                              >
                                Next Day →
                              </Button>
                            </div>
                          </div>

                          {/* Info Banner */}
                          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-bold text-blue-900 mb-1">📖 Read-Only View</p>
                              <p className="text-blue-800">This section displays historical shift observations. To make new entries, use the <span className="font-bold">Nursing Assessment form above</span>, select your shift, and document your observations and takeover notes.</p>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            {/* AM Shift */}
                            <div className="rounded-xl border-2 border-yellow-300 overflow-hidden">
                              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-white" />
                                  <h4 className="font-bold text-white">AM Shift (07:00 - 14:00)</h4>
                                </div>
                                <span className="text-sm font-semibold text-white bg-white/20 px-3 py-1 rounded-full">{selectedDate}</span>
                              </div>
                              
                              <div className="bg-yellow-50 p-4 space-y-4">
                                {/* Shift Observations - READ ONLY */}
                                <div>
                                  <label className="block text-sm font-bold text-slate-900 mb-2">Shift Observations</label>
                                  <div className="p-4 bg-white border-2 border-yellow-200 rounded-lg text-sm text-slate-700 min-h-24">
                                    Patient alert and responsive. Vital signs stable. Breakfast taken well. Chest physiotherapy done at 09:00. No complaints of pain. Ambulated to bathroom with assistance.
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">By: Sr. Fatimah (AM Shift)</div>
                                </div>

                                {/* Handover Section - READ ONLY */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-bold text-green-700 mb-2">🔴 Handover From (Night Shift)</label>
                                    <div className="text-xs text-slate-600 mb-1">By: Sr. Nurul (Night Shift)</div>
                                    <div className="p-3 bg-white border-2 border-green-200 rounded-lg text-sm text-slate-700 min-h-20">
                                      Patient had a restful night. No fever. IV fluids running well at 60ml/hr. Last vital signs at 06:00 - all stable. Morning medications due at 08:00.
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold text-blue-700 mb-2">🔵 Takeover By (AM Shift)</label>
                                    <div className="text-xs text-slate-600 mb-1">By: Sr. Fatimah (AM Shift)</div>
                                    <div className="p-3 bg-white border-2 border-blue-200 rounded-lg text-sm text-slate-700 min-h-20">
                                      Acknowledged. Will monitor vital signs 4-hourly. Physiotherapy scheduled at 09:00. Family expected to visit at 10:00.
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* PM Shift */}
                            <div className="rounded-xl border-2 border-blue-300 overflow-hidden">
                              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-white" />
                                  <h4 className="font-bold text-white">PM Shift (14:00 - 21:00)</h4>
                                </div>
                                <span className="text-sm font-semibold text-white bg-white/20 px-3 py-1 rounded-full">{selectedDate}</span>
                              </div>
                              
                              <div className="bg-blue-50 p-4 space-y-4">
                                {/* Shift Observations - READ ONLY */}
                                <div>
                                  <label className="block text-sm font-bold text-slate-900 mb-2">Shift Observations</label>
                                  <div className="p-4 bg-white border-2 border-blue-200 rounded-lg text-sm text-slate-700 min-h-24">
                                    Patient continues to be stable. Lunch intake adequate. IV antibiotics given at 14:00. Respiratory rate slightly elevated at 22/min. Nebulizer given. Family visited.
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">By: Sr. Aishah (PM Shift)</div>
                                </div>

                                {/* Handover Section - READ ONLY */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-bold text-green-700 mb-2">🔴 Handover From (AM Shift)</label>
                                    <div className="text-xs text-slate-600 mb-1">By: Sr. Fatimah (AM Shift)</div>
                                    <div className="p-3 bg-white border-2 border-green-200 rounded-lg text-sm text-slate-700 min-h-20">
                                      Patient stable throughout morning. Physiotherapy completed. Medications given on time. Family visited and updated. Continue monitoring respiratory rate.
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold text-blue-700 mb-2">🔵 Takeover By (PM Shift)</label>
                                    <div className="text-xs text-slate-600 mb-1">By: Sr. Aishah (PM Shift)</div>
                                    <div className="p-3 bg-white border-2 border-blue-200 rounded-lg text-sm text-slate-700 min-h-20">
                                      Acknowledged. Will give IV antibiotics at 14:00. Monitor RR closely. Nebulizer PRN if needed. Dinner at 18:00.
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Night Shift */}
                            <div className="rounded-xl border-2 border-indigo-300 overflow-hidden">
                              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-white" />
                                  <h4 className="font-bold text-white">Night Shift (21:00 - 07:00)</h4>
                                </div>
                                <span className="text-sm font-semibold text-white bg-white/20 px-3 py-1 rounded-full">{selectedDate}</span>
                              </div>
                              
                              <div className="bg-indigo-50 p-4 space-y-4">
                                {/* Shift Observations - READ ONLY */}
                                <div>
                                  <label className="block text-sm font-bold text-slate-900 mb-2">Shift Observations</label>
                                  <div className="p-4 bg-white border-2 border-indigo-200 rounded-lg text-sm text-slate-700 min-h-24">
                                    Patient sleeping well. Woke up once at 02:00 for bathroom. Vital signs checked at 22:00 and 02:00 - all stable. No complaints. IV fluids running well.
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">By: Sr. Nurul (Night Shift)</div>
                                </div>

                                {/* Handover Section - READ ONLY */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-bold text-green-700 mb-2">🔴 Handover From (PM Shift)</label>
                                    <div className="text-xs text-slate-600 mb-1">By: Sr. Aishah (PM Shift)</div>
                                    <div className="p-3 bg-white border-2 border-green-200 rounded-lg text-sm text-slate-700 min-h-20">
                                      Patient had dinner. All evening medications given. Respiratory rate improved to 18/min. Family left at 20:00. Patient ready for sleep.
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold text-blue-700 mb-2">🔵 Takeover By (Night Shift)</label>
                                    <div className="text-xs text-slate-600 mb-1">By: Sr. Nurul (Night Shift)</div>
                                    <div className="p-3 bg-white border-2 border-blue-200 rounded-lg text-sm text-slate-700 min-h-20">
                                      Acknowledged. Will do vital signs at 22:00 and 02:00. Let patient rest. Morning medications prepared for 06:00 handover.
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Vital Signs Tab */}
                  <TabsContent value="vitals">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-slate-900">Vital Signs Chart</h3>
                          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="h-4 w-4" />
                            Add Vitals
                          </Button>
                        </div>

                        {/* Vital Signs Trend Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                          {/* Temperature Chart */}
                          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
                            <CardContent className="p-4">
                              <div className="mb-3">
                                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-red-600" />
                                  Temperature Trend
                                </h4>
                                <p className="text-xs text-slate-600 mt-0.5">Body temperature over time</p>
                              </div>

                              <div 
                                className="bg-white p-3 rounded-xl border border-red-200 cursor-pointer hover:shadow-lg transition-shadow" 
                                onClick={() => setExpandedChart('temperature')}
                                title="Click to enlarge"
                              >
                                <svg viewBox="0 0 300 250" className="w-full h-64">
                                  {/* Background zones */}
                                  <rect x="40" y="20" width="240" height="40" fill="#fee2e2" opacity="0.3" /> {/* High fever */}
                                  <rect x="40" y="60" width="240" height="80" fill="#d1fae5" opacity="0.3" /> {/* Normal */}

                                  {/* Grid lines */}
                                  <line x1="40" y1="20" x2="280" y2="20" stroke="#e2e8f0" strokeWidth="1" />
                                  <line x1="40" y1="60" x2="280" y2="60" stroke="#e2e8f0" strokeWidth="1" />
                                  <line x1="40" y1="100" x2="280" y2="100" stroke="#e2e8f0" strokeWidth="1" />
                                  <line x1="40" y1="140" x2="280" y2="140" stroke="#e2e8f0" strokeWidth="1" />

                                  {/* Y-axis labels */}
                                  <text x="35" y="25" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">38.5°C</text>
                                  <text x="35" y="65" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">37.5°C</text>
                                  <text x="35" y="105" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">37.0°C</text>
                                  <text x="35" y="145" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">36.5°C</text>

                                  {/* Normal range line */}
                                  <line x1="40" y1="100" x2="280" y2="100" stroke="#10b981" strokeWidth="2" strokeDasharray="5,3" />

                                  {/* Temperature trend line */}
                                  <polyline
                                    points="40,105 88,100 136,55 184,107 232,113"
                                    fill="none"
                                    stroke="#dc2626"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />

                                  {/* Data points */}
                                  <circle cx="40" cy="105" r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                                  <circle cx="88" cy="100" r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                                  <circle cx="136" cy="55" r="4" fill="#dc2626" stroke="white" strokeWidth="2" />
                                  <circle cx="184" cy="107" r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                                  <circle cx="232" cy="113" r="4" fill="#10b981" stroke="white" strokeWidth="2" />

                                  {/* Value labels */}
                                  <text x="40" y="120" textAnchor="middle" fontSize="11" fill="#10b981" fontWeight="bold">37.2</text>
                                  <text x="88" y="115" textAnchor="middle" fontSize="11" fill="#10b981" fontWeight="bold">37.5</text>
                                  <text x="136" y="70" textAnchor="middle" fontSize="11" fill="#dc2626" fontWeight="bold">37.8</text>
                                  <text x="184" y="122" textAnchor="middle" fontSize="11" fill="#10b981" fontWeight="bold">37.4</text>
                                  <text x="232" y="128" textAnchor="middle" fontSize="11" fill="#10b981" fontWeight="bold">37.1</text>

                                  {/* X-axis time labels */}
                                  <text x="40" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">06:00</text>
                                  <text x="88" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">10:00</text>
                                  <text x="136" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">14:00</text>
                                  <text x="184" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">18:00</text>
                                  <text x="232" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">22:00</text>

                                  {/* Zone label */}
                                  <text x="45" y="50" fontSize="10" fill="#991b1b" fontWeight="bold">High (&gt;37.5°C)</text>
                                  <text x="45" y="100" fontSize="10" fill="#047857" fontWeight="bold">Normal Range</text>
                                </svg>
                              </div>

                              <div className="flex items-center justify-center gap-4 mt-3">
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                  <span className="text-xs font-medium text-slate-700">High</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                                  <span className="text-xs font-medium text-slate-700">Normal</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Heart Rate Chart */}
                          <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-red-50">
                            <CardContent className="p-4">
                              <div className="mb-3">
                                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-pink-600" />
                                  Heart Rate Trend
                                </h4>
                                <p className="text-xs text-slate-600 mt-0.5">Heart rate (BPM) over time</p>
                              </div>

                              <div 
                                className="bg-white p-3 rounded-xl border border-pink-200 cursor-pointer hover:shadow-lg transition-shadow" 
                                onClick={() => setExpandedChart('heartrate')}
                                title="Click to enlarge"
                              >
                                <svg viewBox="0 0 300 250" className="w-full h-64">
                                  {/* Background zones */}
                                  <rect x="40" y="20" width="240" height="35" fill="#fee2e2" opacity="0.3" /> {/* High */}
                                  <rect x="40" y="55" width="240" height="90" fill="#d1fae5" opacity="0.3" /> {/* Normal */}

                                  {/* Grid lines */}
                                  <line x1="40" y1="20" x2="280" y2="20" stroke="#e2e8f0" strokeWidth="1" />
                                  <line x1="40" y1="55" x2="280" y2="55" stroke="#e2e8f0" strokeWidth="1" />
                                  <line x1="40" y1="90" x2="280" y2="90" stroke="#e2e8f0" strokeWidth="1" />
                                  <line x1="40" y1="125" x2="280" y2="125" stroke="#e2e8f0" strokeWidth="1" />

                                  {/* Y-axis labels */}
                                  <text x="35" y="25" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">100</text>
                                  <text x="35" y="60" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">90</text>
                                  <text x="35" y="95" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">80</text>
                                  <text x="35" y="130" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">70</text>

                                  {/* Normal range line */}
                                  <line x1="40" y1="55" x2="280" y2="55" stroke="#10b981" strokeWidth="2" strokeDasharray="5,3" />

                                  {/* HR trend line */}
                                  <polyline
                                    points="40,83 88,69 136,48 184,76 232,90"
                                    fill="none"
                                    stroke="#ec4899"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />

                                  {/* Data points */}
                                  <circle cx="40" cy="83" r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                                  <circle cx="88" cy="69" r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                                  <circle cx="136" cy="48" r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                                  <circle cx="184" cy="76" r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                                  <circle cx="232" cy="90" r="4" fill="#10b981" stroke="white" strokeWidth="2" />

                                  {/* Value labels */}
                                  <text x="40" y="98" textAnchor="middle" fontSize="11" fill="#10b981" fontWeight="bold">78</text>
                                  <text x="88" y="84" textAnchor="middle" fontSize="11" fill="#10b981" fontWeight="bold">82</text>
                                  <text x="136" y="63" textAnchor="middle" fontSize="11" fill="#10b981" fontWeight="bold">85</text>
                                  <text x="184" y="91" textAnchor="middle" fontSize="11" fill="#10b981" fontWeight="bold">80</text>
                                  <text x="232" y="105" textAnchor="middle" fontSize="11" fill="#10b981" fontWeight="bold">76</text>

                                  {/* X-axis time labels */}
                                  <text x="40" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">06:00</text>
                                  <text x="88" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">10:00</text>
                                  <text x="136" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">14:00</text>
                                  <text x="184" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">18:00</text>
                                  <text x="232" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">22:00</text>

                                  {/* Zone label */}
                                  <text x="45" y="45" fontSize="10" fill="#991b1b" fontWeight="bold">High (&gt;100 bpm)</text>
                                  <text x="45" y="85" fontSize="10" fill="#047857" fontWeight="bold">Normal (60-100)</text>
                                </svg>
                              </div>

                              <div className="flex items-center justify-center gap-4 mt-3">
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                  <span className="text-xs font-medium text-slate-700">Tachycardia</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                                  <span className="text-xs font-medium text-slate-700">Normal</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Blood Pressure Chart */}
                          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                            <CardContent className="p-4">
                              <div className="mb-3">
                                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-blue-600" />
                                  Blood Pressure Trend
                                </h4>
                                <p className="text-xs text-slate-600 mt-0.5">Systolic/Diastolic (mmHg)</p>
                              </div>

                              <div 
                                className="bg-white p-3 rounded-xl border border-blue-200 cursor-pointer hover:shadow-lg transition-shadow" 
                                onClick={() => setExpandedChart('bloodpressure')}
                                title="Click to enlarge"
                              >
                                <svg viewBox="0 0 300 250" className="w-full h-64">
                                  {/* Background zones */}
                                  <rect x="40" y="20" width="240" height="35" fill="#fee2e2" opacity="0.3" /> {/* High */}
                                  <rect x="40" y="55" width="240" height="75" fill="#d1fae5" opacity="0.3" /> {/* Normal */}

                                  {/* Grid lines */}
                                  <line x1="40" y1="20" x2="280" y2="20" stroke="#e2e8f0" strokeWidth="1" />
                                  <line x1="40" y1="55" x2="280" y2="55" stroke="#e2e8f0" strokeWidth="1" />
                                  <line x1="40" y1="90" x2="280" y2="90" stroke="#e2e8f0" strokeWidth="1" />
                                  <line x1="40" y1="130" x2="280" y2="130" stroke="#e2e8f0" strokeWidth="1" />

                                  {/* Y-axis labels */}
                                  <text x="35" y="25" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">140</text>
                                  <text x="35" y="60" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">130</text>
                                  <text x="35" y="95" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">120</text>
                                  <text x="35" y="135" textAnchor="end" fontSize="12" fill="#64748b" fontWeight="bold">110</text>

                                  {/* Normal range line */}
                                  <line x1="40" y1="55" x2="280" y2="55" stroke="#10b981" strokeWidth="2" strokeDasharray="5,3" />

                                  {/* Systolic BP trend line */}
                                  <polyline
                                    points="40,71 88,62 136,53 184,65 232,77"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />

                                  {/* Diastolic BP trend line */}
                                  <polyline
                                    points="40,113 88,106 136,99 184,107 232,113"
                                    fill="none"
                                    stroke="#06b6d4"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeDasharray="3,2"
                                  />

                                  {/* Data points - Systolic */}
                                  <circle cx="40" cy="71" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                  <circle cx="88" cy="62" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                  <circle cx="136" cy="53" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                  <circle cx="184" cy="65" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                  <circle cx="232" cy="77" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />

                                  {/* Data points - Diastolic */}
                                  <circle cx="40" cy="113" r="3" fill="#06b6d4" stroke="white" strokeWidth="2" />
                                  <circle cx="88" cy="106" r="3" fill="#06b6d4" stroke="white" strokeWidth="2" />
                                  <circle cx="136" cy="99" r="3" fill="#06b6d4" stroke="white" strokeWidth="2" />
                                  <circle cx="184" cy="107" r="3" fill="#06b6d4" stroke="white" strokeWidth="2" />
                                  <circle cx="232" cy="113" r="3" fill="#06b6d4" stroke="white" strokeWidth="2" />

                                  {/* BP Value labels */}
                                  <text x="40" y="85" textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="bold">130</text>
                                  <text x="40" y="127" textAnchor="middle" fontSize="9" fill="#06b6d4" fontWeight="bold">85</text>
                                  
                                  <text x="88" y="76" textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="bold">135</text>
                                  <text x="88" y="120" textAnchor="middle" fontSize="9" fill="#06b6d4" fontWeight="bold">88</text>
                                  
                                  <text x="136" y="67" textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="bold">138</text>
                                  <text x="136" y="113" textAnchor="middle" fontSize="9" fill="#06b6d4" fontWeight="bold">90</text>
                                  
                                  <text x="184" y="79" textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="bold">132</text>
                                  <text x="184" y="121" textAnchor="middle" fontSize="9" fill="#06b6d4" fontWeight="bold">86</text>
                                  
                                  <text x="232" y="91" textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="bold">128</text>
                                  <text x="232" y="127" textAnchor="middle" fontSize="9" fill="#06b6d4" fontWeight="bold">82</text>

                                  {/* X-axis time labels */}
                                  <text x="40" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">06:00</text>
                                  <text x="88" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">10:00</text>
                                  <text x="136" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">14:00</text>
                                  <text x="184" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">18:00</text>
                                  <text x="232" y="165" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">22:00</text>

                                  {/* Zone label */}
                                  <text x="45" y="45" fontSize="10" fill="#991b1b" fontWeight="bold">High (≥140/90)</text>
                                  <text x="45" y="85" fontSize="10" fill="#047857" fontWeight="bold">Normal (&lt;140/90)</text>
                                </svg>
                              </div>

                              <div className="flex items-center justify-center gap-4 mt-3">
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-0.5 bg-blue-600"></div>
                                  <span className="text-xs font-medium text-slate-700">Systolic</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-0.5 bg-cyan-500" style={{borderTop: '2px dashed'}}></div>
                                  <span className="text-xs font-medium text-slate-700">Diastolic</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Vital Signs Table */}
                        <h4 className="text-lg font-bold text-slate-900 mb-4">Detailed Vital Signs Log</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Temp (°C)</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">HR (bpm)</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">BP (mmHg)</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">RR (/min)</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">SpO2 (%)</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">GCS</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Nurse</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                              {vitalSigns.map((vital, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{vital.time}</td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <span className={`font-semibold ${vital.temp > 37.5 ? 'text-red-600' : 'text-slate-900'}`}>
                                      {vital.temp}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <span className={`font-semibold ${vital.hr > 100 ? 'text-red-600' : 'text-slate-900'}`}>
                                      {vital.hr}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900">{vital.bp}</td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <span className={`font-semibold ${vital.rr > 20 ? 'text-red-600' : 'text-slate-900'}`}>
                                      {vital.rr}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <span className={`font-semibold ${vital.spo2 < 95 ? 'text-red-600' : 'text-green-600'}`}>
                                      {vital.spo2}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900">{vital.gcs}</td>
                                  <td className="px-4 py-3 text-sm text-center text-slate-600">Sr. Fatimah</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Glucose Monitoring Tab */}
                  <TabsContent value="glucose">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-slate-900">Blood Glucose Monitoring</h3>
                          <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                            <Plus className="h-4 w-4" />
                            Add Reading
                          </Button>
                        </div>

                        {/* Blood Glucose Trend Chart */}
                        <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setExpandedChart('glucose')} title="Click to enlarge">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-slate-900">Glucose Trend (Multi-day)</h4>
                            <span className="text-xs text-slate-600 bg-white px-3 py-1 rounded-full font-medium">
                              {glucoseReadings.length} readings from {new Date(glucoseReadings[0].date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} to {new Date(glucoseReadings[glucoseReadings.length - 1].date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <div className="relative" style={{ height: '300px' }}>
                            <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
                              {/* Reference lines and zones */}
                              {/* High zone (>11) - Red */}
                              <rect x="80" y="20" width="700" height="40" fill="#fee2e2" opacity="0.5" />
                              <text x="10" y="45" className="text-xs fill-red-600" fontSize="12">High</text>
                              <text x="790" y="45" className="text-xs fill-red-600" fontSize="12" textAnchor="end">{'> 11'}</text>
                              
                              {/* Normal zone (4-11) - Green */}
                              <rect x="80" y="60" width="700" height="160" fill="#d1fae5" opacity="0.5" />
                              <text x="10" y="145" className="text-xs fill-green-600" fontSize="12">Normal</text>
                              <text x="790" y="100" className="text-xs fill-green-600" fontSize="12" textAnchor="end">11</text>
                              <text x="790" y="220" className="text-xs fill-green-600" fontSize="12" textAnchor="end">4</text>
                              
                              {/* Low zone (<4) - Orange */}
                              <rect x="80" y="220" width="700" height="60" fill="#fed7aa" opacity="0.5" />
                              <text x="10" y="255" className="text-xs fill-orange-600" fontSize="12">Low</text>
                              <text x="790" y="260" className="text-xs fill-orange-600" fontSize="12" textAnchor="end">{'< 4'}</text>

                              {/* Grid lines */}
                              {[60, 140, 220].map((y) => (
                                <line key={y} x1="80" y1={y} x2="780" y2={y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,5" />
                              ))}

                              {/* Data line and points */}
                              {(() => {
                                const points = glucoseReadings.map((reading, idx) => {
                                  const x = 80 + (idx * 700 / (glucoseReadings.length - 1));
                                  // Map value to y-axis: 0-15 mmol/L range
                                  const y = 280 - ((reading.value / 15) * 260);
                                  const dateLabel = new Date(reading.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                                  return { x, y, value: reading.value, time: reading.time, date: dateLabel, fullDate: reading.date };
                                });
                                
                                const pathData = points.map((p, i) => 
                                  `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                                ).join(' ');

                                return (
                                  <>
                                    {/* Line */}
                                    <path 
                                      d={pathData} 
                                      fill="none" 
                                      stroke="#7c3aed" 
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    
                                    {/* Points and labels */}
                                    {points.map((point, idx) => {
                                      // Show date label only when date changes
                                      const showDate = idx === 0 || point.fullDate !== points[idx - 1].fullDate;
                                      
                                      return (
                                        <g key={idx}>
                                          <circle 
                                            cx={point.x} 
                                            cy={point.y} 
                                            r="6" 
                                            fill={point.value > 11 ? '#dc2626' : point.value < 4 ? '#ea580c' : '#059669'}
                                            stroke="white"
                                            strokeWidth="2"
                                          />
                                          <text 
                                            x={point.x} 
                                            y={point.y - 15} 
                                            textAnchor="middle" 
                                            className="fill-purple-900 font-bold" 
                                            fontSize="14"
                                          >
                                            {point.value}
                                          </text>
                                          {showDate && (
                                            <text 
                                              x={point.x} 
                                              y="287" 
                                              textAnchor="middle" 
                                              className="fill-blue-700 font-bold" 
                                              fontSize="11"
                                            >
                                              {point.date}
                                            </text>
                                          )}
                                          <text 
                                            x={point.x} 
                                            y="300" 
                                            textAnchor="middle" 
                                            className="fill-slate-600 font-medium" 
                                            fontSize="11"
                                          >
                                            {point.time}
                                          </text>
                                        </g>
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </svg>
                          </div>
                          
                          {/* Legend */}
                          <div className="flex items-center justify-center gap-8 mt-4 pt-4 border-t border-purple-200">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-red-500"></div>
                              <span className="text-sm text-slate-700">High (&gt; 11 mmol/L)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-green-500"></div>
                              <span className="text-sm text-slate-700">Normal (4-11 mmol/L)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                              <span className="text-sm text-slate-700">Low (&lt; 4 mmol/L)</span>
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Value (mmol/L)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action Taken</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nurse</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                              {glucoseReadings.slice().reverse().map((reading, idx) => {
                                const dateObj = new Date(reading.date);
                                const formattedDate = dateObj.toLocaleDateString('en-GB', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                });
                                
                                return (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm font-semibold text-blue-900">{formattedDate}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{reading.time}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{reading.type}</td>
                                    <td className="px-6 py-4 text-sm text-center">
                                      <span className={`font-bold ${
                                        reading.value > 11 ? 'text-red-600' : 
                                        reading.value < 4 ? 'text-orange-600' : 
                                        'text-green-600'
                                      }`}>
                                        {reading.value}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center">
                                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        reading.value > 11 ? 'bg-red-100 text-red-800' : 
                                        reading.value < 4 ? 'bg-orange-100 text-orange-800' : 
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {reading.value > 11 ? 'High' : reading.value < 4 ? 'Low' : 'Normal'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                      {reading.value > 11 ? 'Insulin 6 units given' : 'No action required'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">Sr. Aishah</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Medications Tab */}
                  <TabsContent value="medications">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-slate-900">Medication Administration Record (MAR)</h3>
                          <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                            <Plus className="h-4 w-4" />
                            Add Medication
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {medications.map((med, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                              {/* Medication Header */}
                              <div 
                                className="p-4 bg-gradient-to-r from-green-50 to-white border-b border-slate-200 cursor-pointer hover:from-green-100 transition-colors"
                                onClick={() => setExpandedMedication(expandedMedication === idx ? null : idx)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-xl bg-green-600 flex items-center justify-center">
                                        <Pill className="h-5 w-5 text-white" />
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900 text-base">{med.name}</div>
                                        <div className="text-sm text-slate-600 mt-0.5">
                                          <span className="font-semibold">{med.dose}</span> • {med.route} • {med.frequency} • {med.time}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      med.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                                    }`}>
                                      {med.status}
                                    </span>
                                    {expandedMedication === idx ? (
                                      <ChevronUp className="h-5 w-5 text-slate-400" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5 text-slate-400" />
                                    )}
                                  </div>
                                </div>

                                {/* Quick View Time Slots */}
                                <div className="mt-4 grid grid-cols-8 gap-1">
                                  {['08:00', '12:00', '14:00', '18:00', '20:00', '22:00', '02:00', '06:00'].map((time) => {
                                    const isScheduled = med.time.includes(time.split(':')[0]);
                                    const isComplete = isMedicationTimeComplete(idx, time);
                                    
                                    return (
                                      <div key={time} className="text-center">
                                        <div className={`h-8 rounded flex items-center justify-center text-xs font-semibold gap-1 ${
                                          !isScheduled 
                                            ? 'bg-slate-100 text-slate-400'
                                            : isComplete
                                            ? 'bg-green-600 text-white'
                                            : 'bg-amber-500 text-white'
                                        }`}>
                                          {isComplete && <CheckCircle className="h-3 w-3" />}
                                          {time.split(':')[0]}h
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Expanded Details */}
                              {expandedMedication === idx && (
                                <div className="p-6 bg-slate-50">
                                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-green-600" />
                                    Administration Schedule & Documentation
                                  </h4>

                                  {['08:00', '12:00', '14:00', '18:00', '20:00', '22:00', '02:00', '06:00']
                                    .filter(time => med.time.includes(time.split(':')[0]))
                                    .map((time, timeIdx) => {
                                      const isComplete = isMedicationTimeComplete(idx, time);
                                      
                                      return (
                                        <div key={timeIdx} className="mb-6 last:mb-0">
                                          <div className={`bg-white rounded-xl overflow-hidden ${
                                            isComplete 
                                              ? 'border-2 border-green-500 shadow-lg shadow-green-500/20' 
                                              : 'border border-slate-200'
                                          }`}>
                                            {/* Time Header */}
                                            <div className={`px-4 py-2 flex items-center justify-between ${
                                              isComplete
                                                ? 'bg-gradient-to-r from-green-600 to-green-700'
                                                : 'bg-gradient-to-r from-amber-500 to-amber-600'
                                            }`}>
                                              <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-white" />
                                                <span className="text-white font-bold">{time}</span>
                                                {isComplete && (
                                                  <div className="flex items-center gap-1 ml-2 bg-white/20 px-2 py-0.5 rounded-full">
                                                    <CheckCircle className="h-3.5 w-3.5 text-white" />
                                                    <span className="text-xs font-semibold text-white">Completed</span>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Button size="sm" className="bg-white text-green-700 hover:bg-green-50 h-7 text-xs">
                                                  Given
                                                </Button>
                                                <Button size="sm" variant="outline" className="bg-transparent border-white text-white hover:bg-white/20 h-7 text-xs">
                                                  Not Given
                                                </Button>
                                              </div>
                                            </div>

                                          <div className="p-4">
                                            {/* Signature Boxes */}
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                              {/* Checked By */}
                                              <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-2">Checked By</label>
                                                {medSignatures[`${idx}-${time}-checked`] ? (
                                                  <div className="border-2 border-green-500 rounded-lg p-3 min-h-[60px] bg-green-50">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                                      <span className="text-xs font-bold text-green-900">Signed</span>
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                      {medSignatures[`${idx}-${time}-checked`]}
                                                    </div>
                                                    <div className="text-xs text-slate-600 mt-1">
                                                      {new Date().toLocaleString()}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full h-[60px] border-2 border-dashed border-slate-300 hover:border-green-500 hover:bg-green-50 text-slate-600"
                                                    onClick={() => setMedSignatures(prev => ({
                                                      ...prev,
                                                      [`${idx}-${time}-checked`]: currentUser.id
                                                    }))}
                                                  >
                                                    <div className="flex flex-col items-center gap-1">
                                                      <CheckCircle className="h-4 w-4" />
                                                      <span className="text-xs font-semibold">Check</span>
                                                    </div>
                                                  </Button>
                                                )}
                                              </div>

                                              {/* Administered By */}
                                              <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-2">Administered By</label>
                                                {medSignatures[`${idx}-${time}-administered`] ? (
                                                  <div className="border-2 border-blue-500 rounded-lg p-3 min-h-[60px] bg-blue-50">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <CheckCircle className="h-4 w-4 text-blue-600" />
                                                      <span className="text-xs font-bold text-blue-900">Signed</span>
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                      {medSignatures[`${idx}-${time}-administered`]}
                                                    </div>
                                                    <div className="text-xs text-slate-600 mt-1">
                                                      {new Date().toLocaleString()}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full h-[60px] border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-600"
                                                    onClick={() => setMedSignatures(prev => ({
                                                      ...prev,
                                                      [`${idx}-${time}-administered`]: currentUser.id
                                                    }))}
                                                  >
                                                    <div className="flex flex-col items-center gap-1">
                                                      <Syringe className="h-4 w-4" />
                                                      <span className="text-xs font-semibold">Administer</span>
                                                    </div>
                                                  </Button>
                                                )}
                                              </div>

                                              {/* Witnessed By */}
                                              <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-2">Witnessed By</label>
                                                {medSignatures[`${idx}-${time}-witnessed`] ? (
                                                  <div className="border-2 border-purple-500 rounded-lg p-3 min-h-[60px] bg-purple-50">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <CheckCircle className="h-4 w-4 text-purple-600" />
                                                      <span className="text-xs font-bold text-purple-900">Signed</span>
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                      {medSignatures[`${idx}-${time}-witnessed`]}
                                                    </div>
                                                    <div className="text-xs text-slate-600 mt-1">
                                                      {new Date().toLocaleString()}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full h-[60px] border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50 text-slate-600"
                                                    onClick={() => setMedSignatures(prev => ({
                                                      ...prev,
                                                      [`${idx}-${time}-witnessed`]: currentUser.id
                                                    }))}
                                                  >
                                                    <div className="flex flex-col items-center gap-1">
                                                      <User className="h-4 w-4" />
                                                      <span className="text-xs font-semibold">Witness</span>
                                                    </div>
                                                  </Button>
                                                )}
                                              </div>
                                            </div>

                                            {/* Comment Box */}
                                            <div>
                                              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                                Comments / Reason (if not given or late)
                                              </label>
                                              <Textarea 
                                                placeholder="Enter reason if medication was not given, given late, or any other relevant notes..."
                                                className="min-h-[80px] text-sm resize-none"
                                              />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
                                              <Button size="sm" variant="outline" className="text-xs">
                                                Clear
                                              </Button>
                                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs">
                                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                Save Documentation
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h5 className="text-sm font-bold text-blue-900 mb-2">MAR Guidelines & Color Coding</h5>
                          <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Click on any medication to expand and document administration</li>
                            <li>• All three signatures (Checked, Administered, Witnessed) are required for proper documentation</li>
                            <li>• Always document reason if medication is not given or given late</li>
                            <li className="font-semibold mt-2">Time Slot Color Coding:</li>
                            <li className="ml-4">• <span className="inline-block w-3 h-3 rounded bg-amber-500 mr-1"></span> Amber: Pending administration (signatures incomplete)</li>
                            <li className="ml-4">• <span className="inline-block w-3 h-3 rounded bg-green-600 mr-1"></span> Green with ✓: Completed (all signatures recorded)</li>
                            <li className="ml-4">• <span className="inline-block w-3 h-3 rounded bg-slate-200 mr-1"></span> Grey: Not scheduled for this time</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* IV Fluids Tab */}
                  <TabsContent value="fluids">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-slate-900">IV Fluid Management</h3>
                          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                            <Plus className="h-4 w-4" />
                            Add IV Line
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {ivFluids.map((fluid, idx) => (
                            <div key={idx} className="p-6 bg-cyan-50 rounded-xl border-2 border-cyan-200">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="font-bold text-cyan-900 text-lg">{fluid.fluid}</div>
                                  <div className="text-sm text-cyan-700 mt-1">
                                    Volume: {fluid.volume} | Rate: {fluid.rate}
                                  </div>
                                  <div className="text-xs text-cyan-600 mt-1">
                                    Started: {fluid.started}
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  fluid.status === 'Running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {fluid.status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                  <label className="block text-xs font-medium text-cyan-700 mb-1">Volume Infused (ml)</label>
                                  <Input type="number" placeholder="0" className="bg-white" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-cyan-700 mb-1">Volume Remaining (ml)</label>
                                  <Input type="number" placeholder="1000" className="bg-white" value="625" readOnly />
                                </div>
                              </div>
                              
                              <div className="flex gap-3 mt-4">
                                <Button size="sm" variant="outline" className="flex-1">Pause</Button>
                                <Button size="sm" variant="outline" className="flex-1">Adjust Rate</Button>
                                <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:text-red-700">Stop</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Intake & Output Tab */}
                  <TabsContent value="intake-output">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-slate-900">Fluid Intake & Output Balance</h3>
                          
                          {/* Date Navigator */}
                          <div className="flex items-center gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const currentDate = new Date(selectedDate);
                                currentDate.setDate(currentDate.getDate() - 1);
                                setSelectedDate(currentDate.toISOString().split('T')[0]);
                              }}
                            >
                              ← Previous Day
                            </Button>
                            <div className="px-4 py-2 bg-teal-100 rounded-lg border-2 border-teal-300">
                              <span className="font-bold text-teal-900">{selectedDate}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const currentDate = new Date(selectedDate);
                                currentDate.setDate(currentDate.getDate() + 1);
                                setSelectedDate(currentDate.toISOString().split('T')[0]);
                              }}
                            >
                              Next Day →
                            </Button>
                            <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white ml-4">
                              <Plus className="h-4 w-4" />
                              Add Entry
                            </Button>
                          </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                            <div className="flex items-center gap-3 mb-4">
                              <Droplet className="h-8 w-8 text-blue-600" />
                              <div>
                                <div className="text-sm text-blue-700">Total Intake (24h)</div>
                                <div className="font-bold text-blue-900 text-2xl">2,450 ml</div>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 bg-amber-50 rounded-xl border-2 border-amber-200">
                            <div className="flex items-center gap-3 mb-4">
                              <Droplet className="h-8 w-8 text-amber-600" />
                              <div>
                                <div className="text-sm text-amber-700">Total Output (24h)</div>
                                <div className="font-bold text-amber-900 text-2xl">2,100 ml</div>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                            <div className="flex items-center gap-3 mb-4">
                              <TrendingUp className="h-8 w-8 text-green-600" />
                              <div>
                                <div className="text-sm text-green-700">Balance</div>
                                <div className="font-bold text-green-900 text-2xl">+350 ml</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fluid Balance Chart */}
                        <Card className="border-0 shadow-lg mb-8 bg-gradient-to-br from-slate-50 to-blue-50">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                  <TrendingUp className="h-5 w-5 text-blue-600" />
                                  Fluid Balance Trend - {selectedDate}
                                </h4>
                                <p className="text-sm text-slate-600 mt-1">Cumulative intake & output over 24 hours</p>
                              </div>
                              <div className="px-4 py-2 bg-blue-100 rounded-lg border border-blue-200">
                                <div className="text-xs text-blue-700 font-medium">24h Summary</div>
                                <div className="text-lg font-bold text-blue-900">Day {Math.floor((new Date(selectedDate).getTime() - new Date('2025-10-08').getTime()) / (1000 * 60 * 60 * 24)) + 1} of admission</div>
                              </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border-2 border-slate-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setExpandedChart('intakeoutput')} title="Click to enlarge">
                              <svg viewBox="0 0 800 300" className="w-full h-64">
                                {/* Grid lines */}
                                <line x1="60" y1="40" x2="760" y2="40" stroke="#e2e8f0" strokeWidth="1" />
                                <line x1="60" y1="90" x2="760" y2="90" stroke="#e2e8f0" strokeWidth="1" />
                                <line x1="60" y1="140" x2="760" y2="140" stroke="#e2e8f0" strokeWidth="1" />
                                <line x1="60" y1="190" x2="760" y2="190" stroke="#e2e8f0" strokeWidth="1" />
                                <line x1="60" y1="240" x2="760" y2="240" stroke="#e2e8f0" strokeWidth="1" />

                                {/* Y-axis labels */}
                                <text x="45" y="45" textAnchor="end" fontSize="12" fill="#64748b">2500</text>
                                <text x="45" y="95" textAnchor="end" fontSize="12" fill="#64748b">2000</text>
                                <text x="45" y="145" textAnchor="end" fontSize="12" fill="#64748b">1500</text>
                                <text x="45" y="195" textAnchor="end" fontSize="12" fill="#64748b">1000</text>
                                <text x="45" y="245" textAnchor="end" fontSize="12" fill="#64748b">500</text>
                                <text x="45" y="280" textAnchor="end" fontSize="12" fill="#64748b">0</text>

                                {/* Y-axis label */}
                                <text x="20" y="160" textAnchor="middle" fontSize="12" fill="#475569" transform="rotate(-90, 20, 160)" fontWeight="bold">Volume (ml)</text>

                                {/* Intake line (Blue) */}
                                <polyline
                                  points="60,240 160,215 260,185 360,165 460,145 560,125 660,105 760,85"
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />

                                {/* Output line (Amber) */}
                                <polyline
                                  points="60,240 160,220 260,195 360,175 460,160 560,145 660,125 760,105"
                                  fill="none"
                                  stroke="#f59e0b"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />

                                {/* Balance line (Green) */}
                                <polyline
                                  points="60,240 160,238 260,235 360,232 460,230 560,227 660,223 760,218"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeDasharray="5,5"
                                />

                                {/* Data points - Intake */}
                                <circle cx="60" cy="240" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <circle cx="160" cy="215" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <circle cx="260" cy="185" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <circle cx="360" cy="165" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <circle cx="460" cy="145" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <circle cx="560" cy="125" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <circle cx="660" cy="105" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <circle cx="760" cy="85" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />

                                {/* Data points - Output */}
                                <circle cx="60" cy="240" r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
                                <circle cx="160" cy="220" r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
                                <circle cx="260" cy="195" r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
                                <circle cx="360" cy="175" r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
                                <circle cx="460" cy="160" r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
                                <circle cx="560" cy="145" r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
                                <circle cx="660" cy="125" r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
                                <circle cx="760" cy="105" r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />

                                {/* Data points - Balance */}
                                <circle cx="760" cy="218" r="6" fill="#10b981" stroke="white" strokeWidth="2" />

                                {/* X-axis time labels */}
                                <text x="60" y="270" textAnchor="middle" fontSize="11" fill="#64748b">00:00</text>
                                <text x="160" y="270" textAnchor="middle" fontSize="11" fill="#64748b">04:00</text>
                                <text x="260" y="270" textAnchor="middle" fontSize="11" fill="#64748b">08:00</text>
                                <text x="360" y="270" textAnchor="middle" fontSize="11" fill="#64748b">12:00</text>
                                <text x="460" y="270" textAnchor="middle" fontSize="11" fill="#64748b">14:00</text>
                                <text x="560" y="270" textAnchor="middle" fontSize="11" fill="#64748b">16:00</text>
                                <text x="660" y="270" textAnchor="middle" fontSize="11" fill="#64748b">18:00</text>
                                <text x="760" y="270" textAnchor="middle" fontSize="11" fill="#64748b">22:00</text>

                                {/* Current values labels */}
                                <text x="765" y="90" fontSize="12" fill="#3b82f6" fontWeight="bold">2450ml</text>
                                <text x="765" y="110" fontSize="12" fill="#f59e0b" fontWeight="bold">2100ml</text>
                                <text x="765" y="223" fontSize="12" fill="#10b981" fontWeight="bold">+350ml</text>
                              </svg>

                              {/* Legend */}
                              <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-1 bg-blue-500 rounded"></div>
                                  <span className="text-sm font-medium text-slate-700">Intake (Cumulative)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-1 bg-amber-500 rounded"></div>
                                  <span className="text-sm font-medium text-slate-700">Output (Cumulative)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-1 bg-green-500 rounded" style={{borderTop: '2px dashed'}}></div>
                                  <span className="text-sm font-medium text-slate-700">Balance (I-O)</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Intake Section */}
                        <div className="mb-8">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              <Droplet className="h-5 w-5 text-blue-600" />
                              Intake - {selectedDate}
                            </h4>
                            <span className="text-sm text-slate-500 italic">Showing entries for selected date</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                              <thead className="bg-blue-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date/Time</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Route</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount (ml)</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Recorded By</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">2025-10-11 08:00</td>
                                  <td className="px-4 py-3 text-sm text-slate-900">Oral - Water</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">PO</td>
                                  <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">200</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">With breakfast</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Sr. Fatimah</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">2025-10-11 06:00-14:00</td>
                                  <td className="px-4 py-3 text-sm text-slate-900">IV - NS 0.9%</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">IV</td>
                                  <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">500</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">8-hour infusion @ 60ml/hr</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Sr. Fatimah</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">2025-10-11 12:00</td>
                                  <td className="px-4 py-3 text-sm text-slate-900">Oral - Soup</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">PO</td>
                                  <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">250</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">With lunch</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Sr. Fatimah</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">2025-10-11 14:00</td>
                                  <td className="px-4 py-3 text-sm text-slate-900">Oral - Juice</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">PO</td>
                                  <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">150</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Post lunch</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Sr. Aishah</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Output Section */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              <Droplet className="h-5 w-5 text-amber-600" />
                              Output - {selectedDate}
                            </h4>
                            <span className="text-sm text-slate-500 italic">Showing entries for selected date</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                              <thead className="bg-amber-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date/Time</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Characteristics</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount (ml)</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Recorded By</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">2025-10-11 08:30</td>
                                  <td className="px-4 py-3 text-sm text-slate-900">Urine</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Clear, yellow</td>
                                  <td className="px-4 py-3 text-sm text-right font-bold text-amber-600">300</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Spontaneous void</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Sr. Fatimah</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">2025-10-11 12:30</td>
                                  <td className="px-4 py-3 text-sm text-slate-900">Urine</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Clear, yellow</td>
                                  <td className="px-4 py-3 text-sm text-right font-bold text-amber-600">350</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Spontaneous void</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Sr. Fatimah</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">2025-10-11 13:00</td>
                                  <td className="px-4 py-3 text-sm text-slate-900">Drain Output</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Serous, clear</td>
                                  <td className="px-4 py-3 text-sm text-right font-bold text-amber-600">50</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Surgical drain</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">Sr. Aishah</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Oxygen Therapy Tab */}
                  <TabsContent value="oxygen">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-slate-900">Oxygen Therapy</h3>
                          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="h-4 w-4" />
                            Update Oxygen
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2">
                              <Wind className="h-6 w-6 text-blue-600" />
                              <div>
                                <div className="text-xs text-blue-700">Oxygen Delivery</div>
                                <div className="font-bold text-blue-900 text-lg">Nasal Prongs</div>
                              </div>
                            </div>
                            <div className="space-y-1 mt-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-blue-700">Flow Rate:</span>
                                <span className="font-bold text-blue-900">3 L/min</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-blue-700">FiO2:</span>
                                <span className="font-bold text-blue-900">~32%</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-2">
                              <Zap className="h-6 w-6 text-purple-600" />
                              <div>
                                <div className="text-xs text-purple-700">Current SpO2</div>
                                <div className="font-bold text-purple-900 text-lg">96%</div>
                              </div>
                            </div>
                            <div className="space-y-1 mt-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-purple-700">Target:</span>
                                <span className="font-bold text-purple-900">≥ 94%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-purple-700">Status:</span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Adequate</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SpO2 Trend Chart */}
                        <Card className="border-0 shadow-lg mb-8 bg-gradient-to-br from-slate-50 to-purple-50">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                  <TrendingUp className="h-5 w-5 text-purple-600" />
                                  SpO2 Trend (Oxygen Saturation)
                                </h4>
                                <p className="text-sm text-slate-600 mt-1">Tracking oxygen saturation levels over time</p>
                              </div>
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Target: ≥94%</span>
                            </div>

                            <div className="bg-white p-6 rounded-xl border-2 border-slate-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setExpandedChart('oxygen')} title="Click to enlarge">
                              <svg viewBox="0 0 800 400" className="w-full h-96">
                                {/* Background zones */}
                                <rect x="60" y="40" width="700" height="80" fill="#fee2e2" opacity="0.3" /> {/* Low zone */}
                                <rect x="60" y="120" width="700" height="220" fill="#d1fae5" opacity="0.3" /> {/* Normal zone */}

                                {/* Grid lines */}
                                <line x1="60" y1="40" x2="760" y2="40" stroke="#e2e8f0" strokeWidth="1" />
                                <line x1="60" y1="120" x2="760" y2="120" stroke="#e2e8f0" strokeWidth="1" />
                                <line x1="60" y1="200" x2="760" y2="200" stroke="#e2e8f0" strokeWidth="1" />
                                <line x1="60" y1="280" x2="760" y2="280" stroke="#e2e8f0" strokeWidth="1" />
                                <line x1="60" y1="340" x2="760" y2="340" stroke="#e2e8f0" strokeWidth="1" />

                                {/* Y-axis labels */}
                                <text x="45" y="45" textAnchor="end" fontSize="14" fill="#64748b">100%</text>
                                <text x="45" y="125" textAnchor="end" fontSize="14" fill="#64748b">98%</text>
                                <text x="45" y="205" textAnchor="end" fontSize="14" fill="#64748b">96%</text>
                                <text x="45" y="285" textAnchor="end" fontSize="14" fill="#64748b">94%</text>
                                <text x="45" y="345" textAnchor="end" fontSize="14" fill="#64748b">92%</text>

                                {/* Y-axis label */}
                                <text x="20" y="200" textAnchor="middle" fontSize="14" fill="#475569" transform="rotate(-90, 20, 200)" fontWeight="bold">SpO2 (%)</text>

                                {/* Target line */}
                                <line x1="60" y1="280" x2="760" y2="280" stroke="#10b981" strokeWidth="3" strokeDasharray="8,5" />
                                <text x="765" y="285" fontSize="13" fill="#10b981" fontWeight="bold">Target: 94%</text>

                                {/* SpO2 trend line */}
                                <polyline
                                  points="60,285 160,235 260,215 360,195 460,175 560,155 660,135 760,115"
                                  fill="none"
                                  stroke="#9333ea"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />

                                {/* Data points */}
                                <circle cx="60" cy="285" r="6" fill="#dc2626" stroke="white" strokeWidth="2" />
                                <circle cx="160" cy="235" r="6" fill="#f59e0b" stroke="white" strokeWidth="2" />
                                <circle cx="260" cy="215" r="6" fill="#f59e0b" stroke="white" strokeWidth="2" />
                                <circle cx="360" cy="195" r="6" fill="#10b981" stroke="white" strokeWidth="2" />
                                <circle cx="460" cy="175" r="6" fill="#10b981" stroke="white" strokeWidth="2" />
                                <circle cx="560" cy="155" r="6" fill="#10b981" stroke="white" strokeWidth="2" />
                                <circle cx="660" cy="135" r="6" fill="#10b981" stroke="white" strokeWidth="2" />
                                <circle cx="760" cy="115" r="6" fill="#10b981" stroke="white" strokeWidth="2" />

                                {/* Value labels */}
                                <text x="60" y="305" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="bold">93%</text>
                                <text x="160" y="255" textAnchor="middle" fontSize="12" fill="#f59e0b" fontWeight="bold">94%</text>
                                <text x="260" y="235" textAnchor="middle" fontSize="12" fill="#f59e0b" fontWeight="bold">95%</text>
                                <text x="360" y="215" textAnchor="middle" fontSize="12" fill="#10b981" fontWeight="bold">96%</text>
                                <text x="460" y="195" textAnchor="middle" fontSize="12" fill="#10b981" fontWeight="bold">97%</text>
                                <text x="560" y="175" textAnchor="middle" fontSize="12" fill="#10b981" fontWeight="bold">97%</text>
                                <text x="660" y="155" textAnchor="middle" fontSize="12" fill="#10b981" fontWeight="bold">98%</text>
                                <text x="760" y="135" textAnchor="middle" fontSize="12" fill="#10b981" fontWeight="bold">98%</text>

                                {/* X-axis time labels */}
                                <text x="60" y="375" textAnchor="middle" fontSize="13" fill="#64748b">06:00</text>
                                <text x="160" y="375" textAnchor="middle" fontSize="13" fill="#64748b">09:00</text>
                                <text x="260" y="375" textAnchor="middle" fontSize="13" fill="#64748b">12:00</text>
                                <text x="360" y="375" textAnchor="middle" fontSize="13" fill="#64748b">14:00</text>
                                <text x="460" y="375" textAnchor="middle" fontSize="13" fill="#64748b">16:00</text>
                                <text x="560" y="375" textAnchor="middle" fontSize="13" fill="#64748b">18:00</text>
                                <text x="660" y="375" textAnchor="middle" fontSize="13" fill="#64748b">20:00</text>
                                <text x="760" y="375" textAnchor="middle" fontSize="13" fill="#64748b">22:00</text>

                                {/* Zone labels */}
                                <text x="70" y="80" fontSize="13" fill="#991b1b" fontWeight="bold">Low SpO2 Zone (&lt;94%)</text>
                                <text x="70" y="230" fontSize="13" fill="#047857" fontWeight="bold">Normal SpO2 Zone (≥94%)</text>
                              </svg>

                              {/* Legend */}
                              <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-red-600"></div>
                                  <span className="text-sm font-medium text-slate-700">Low (&lt;94%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                                  <span className="text-sm font-medium text-slate-700">Borderline (94-95%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-green-600"></div>
                                  <span className="text-sm font-medium text-slate-700">Normal (≥96%)</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Oxygen Therapy History */}
                        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Wind className="h-5 w-5 text-blue-600" />
                          Oxygen Therapy History
                        </h4>

                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Device</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Flow Rate</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">SpO2</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nurse</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                              <tr className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">22:00</td>
                                <td className="px-4 py-3 text-sm text-slate-600">Nasal Prongs</td>
                                <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900">3 L/min</td>
                                <td className="px-4 py-3 text-sm text-center font-semibold text-green-600">98%</td>
                                <td className="px-4 py-3 text-sm text-slate-600">Patient comfortable, no SOB</td>
                                <td className="px-4 py-3 text-sm text-slate-600">Sr. Nurul</td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">18:00</td>
                                <td className="px-4 py-3 text-sm text-slate-600">Nasal Prongs</td>
                                <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900">3 L/min</td>
                                <td className="px-4 py-3 text-sm text-center font-semibold text-green-600">96%</td>
                                <td className="px-4 py-3 text-sm text-slate-600">Saturation maintained</td>
                                <td className="px-4 py-3 text-sm text-slate-600">Sr. Aishah</td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">14:00</td>
                                <td className="px-4 py-3 text-sm text-slate-600">Face Mask</td>
                                <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900">6 L/min</td>
                                <td className="px-4 py-3 text-sm text-center font-semibold text-orange-600">94%</td>
                                <td className="px-4 py-3 text-sm text-slate-600">Changed to nasal prongs as SpO2 improved</td>
                                <td className="px-4 py-3 text-sm text-slate-600">Sr. Aishah</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Laboratory Orders Tab */}
                  <TabsContent value="lab-orders">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Laboratory Orders</h3>
                            <p className="text-sm text-slate-600 mt-1">View and print orders placed by Medical Officers</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date/Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Test Name</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Priority</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ordered By</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                              <tr className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-sm font-semibold text-slate-900">2025-10-10 08:00</td>
                                <td className="px-6 py-4 text-sm text-slate-900">Full Blood Count (FBC)</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                    Routine
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                    Completed
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">Dr. Rashid</td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center gap-2 justify-center">
                                    <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                                      setSelectedLabResult(mockLabResults['FBC']);
                                      setShowLabResultModal(true);
                                    }}>
                                      View Result
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => window.print()}>
                                      <FileText className="h-3 w-3" />
                                      Print
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-sm font-semibold text-slate-900">2025-10-10 14:00</td>
                                <td className="px-6 py-4 text-sm text-slate-900">Renal Function Test (RFT)</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                                    Urgent
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                    In Progress
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">Dr. Rashid</td>
                                <td className="px-6 py-4 text-center">
                                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => {
                                    setSelectedRequest({ type: 'lab', name: 'Renal Function Test (RFT)', orderedBy: 'Dr. Rashid', date: '2025-10-10 14:00', urgency: 'Urgent' });
                                    setShowPrintRequestModal(true);
                                  }}>
                                    <FileText className="h-3 w-3" />
                                    Print Request
                                  </Button>
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-sm font-semibold text-slate-900">2025-10-09 07:00</td>
                                <td className="px-6 py-4 text-sm text-slate-900">Liver Function Test (LFT)</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                    Routine
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                    Completed
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">Dr. Rashid</td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center gap-2 justify-center">
                                    <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                                      setSelectedLabResult(mockLabResults['LFT']);
                                      setShowLabResultModal(true);
                                    }}>
                                      View Result
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => window.print()}>
                                      <FileText className="h-3 w-3" />
                                      Print
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Imaging Orders Tab */}
                  <TabsContent value="imaging-orders">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Imaging Orders</h3>
                            <p className="text-sm text-slate-600 mt-1">View and print orders placed by Medical Officers</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date/Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Imaging Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Body Part</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Priority</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ordered By</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                              <tr className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-sm font-semibold text-slate-900">2025-10-10 09:00</td>
                                <td className="px-6 py-4 text-sm text-slate-900">Chest X-Ray</td>
                                <td className="px-6 py-4 text-sm text-slate-600">Chest (PA/Lateral)</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                    Routine
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                    Completed
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">Dr. Rashid</td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center gap-2 justify-center">
                                    <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                                      setSelectedImagingResult(mockImagingResults['Chest X-Ray']);
                                      setShowImagingResultModal(true);
                                    }}>
                                      View Image
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => window.print()}>
                                      <FileText className="h-3 w-3" />
                                      Print
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-sm font-semibold text-slate-900">2025-10-10 15:00</td>
                                <td className="px-6 py-4 text-sm text-slate-900">Ultrasound Abdomen</td>
                                <td className="px-6 py-4 text-sm text-slate-600">Abdomen & Pelvis</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                                    Urgent
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                    Scheduled
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">Dr. Rashid</td>
                                <td className="px-6 py-4 text-center">
                                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => {
                                    setSelectedRequest({ type: 'imaging', name: 'Ultrasound Abdomen & Pelvis', orderedBy: 'Dr. Rashid', date: '2025-10-10 15:00', urgency: 'Urgent' });
                                    setShowPrintRequestModal(true);
                                  }}>
                                    <FileText className="h-3 w-3" />
                                    Print Request
                                  </Button>
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-sm font-semibold text-slate-900">2025-10-08 11:00</td>
                                <td className="px-6 py-4 text-sm text-slate-900">CT Scan Brain</td>
                                <td className="px-6 py-4 text-sm text-slate-600">Brain (Non-contrast)</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                    STAT
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                    Completed
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">Dr. Rashid</td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center gap-2 justify-center">
                                    <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                                      setSelectedImagingResult(mockImagingResults['CT Scan Brain']);
                                      setShowImagingResultModal(true);
                                    }}>
                                      View Image
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => window.print()}>
                                      <FileText className="h-3 w-3" />
                                      Print
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>

      {/* Discharge Notes Modal */}
      {showDischargeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Discharge Summary</h3>
              <button
                onClick={() => setShowDischargeModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Info Summary */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-blue-700">Patient Name</div>
                    <div className="font-bold text-blue-900">{patient.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-700">IC Number</div>
                    <div className="font-bold text-blue-900">{patient.ic}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-700">Admission Date</div>
                    <div className="font-bold text-blue-900">{patient.admissionDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-700">Ward/Bed</div>
                    <div className="font-bold text-blue-900">{patient.ward} - {patient.bed}</div>
                  </div>
                </div>
              </div>

              {/* Discharge Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Discharge Date & Time</label>
                  <Input type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Discharge Type</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option>Home</option>
                    <option>Transfer to Another Facility</option>
                    <option>Against Medical Advice (AMA)</option>
                    <option>Death</option>
                  </select>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Primary Diagnosis</label>
                <Input placeholder="Enter primary diagnosis" defaultValue={patient.diagnosis} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Diagnosis</label>
                <Textarea placeholder="Enter secondary diagnosis if any..." className="min-h-20" />
              </div>

              {/* Hospital Course */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hospital Course Summary</label>
                <Textarea 
                  placeholder="Brief summary of hospital stay, treatments, and progress..."
                  className="min-h-32"
                  defaultValue="Patient admitted with community-acquired pneumonia. Treated with IV Ceftriaxone for 5 days with good response. Vital signs stabilized. Patient able to ambulate independently. Chest clear on auscultation."
                />
              </div>

              {/* Condition on Discharge */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Condition on Discharge</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option>Improved</option>
                  <option>Stable</option>
                  <option>Unchanged</option>
                  <option>Deteriorated</option>
                </select>
              </div>

              {/* Discharge Medications */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Discharge Medications</label>
                <Textarea 
                  placeholder="List all medications to continue at home..."
                  className="min-h-24"
                  defaultValue="1. Tab Amoxicillin 500mg TDS x 7 days&#10;2. Tab Paracetamol 1g PRN fever/pain&#10;3. Salbutamol inhaler 2 puffs PRN SOB"
                />
              </div>

              {/* Follow-up Instructions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Follow-up Instructions</label>
                <Textarea 
                  placeholder="Follow-up appointments, precautions, warning signs..."
                  className="min-h-24"
                  defaultValue="- Follow up at Medical OPD in 1 week&#10;- Return immediately if fever > 38°C, worsening SOB, or chest pain&#10;- Continue breathing exercises&#10;- Adequate rest and hydration"
                />
              </div>

              {/* Activity & Diet */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Activity Level</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option>No restriction</option>
                    <option>Light activity only</option>
                    <option>Bed rest</option>
                    <option>As tolerated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Diet</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option>Normal diet</option>
                    <option>Diabetic diet</option>
                    <option>Low salt diet</option>
                    <option>Soft diet</option>
                  </select>
                </div>
              </div>

              {/* Discharging Doctor */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Discharging Doctor</label>
                <Input placeholder="Doctor name" defaultValue={patient.doctor} />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200 rounded-b-2xl sticky bottom-0">
              <Button
                variant="outline"
                onClick={() => setShowDischargeModal(false)}
              >
                Cancel
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800">
                Complete Discharge
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chart Expansion Modal */}
      <Dialog open={expandedChart !== null} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogClose onClick={() => setExpandedChart(null)} />
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {expandedChart === 'temperature' && '🌡️ Temperature Trend Chart'}
              {expandedChart === 'heartrate' && '❤️ Heart Rate Trend Chart'}
              {expandedChart === 'bloodpressure' && '🩺 Blood Pressure Trend Chart'}
              {expandedChart === 'glucose' && '🍬 Blood Glucose Trend Chart'}
              {expandedChart === 'oxygen' && '💨 SpO2 Oxygen Saturation Chart'}
              {expandedChart === 'intakeoutput' && '💧 Fluid Balance Trend Chart'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6">
            {/* Temperature Chart - Expanded */}
            {expandedChart === 'temperature' && (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-xl">
                <div className="bg-white p-4 rounded-xl">
                  <svg viewBox="0 0 1000 600" className="w-full" style={{ height: '70vh', minHeight: '500px' }}>
                    {/* Background zones */}
                    <rect x="100" y="50" width="850" height="120" fill="#fee2e2" opacity="0.3" />
                    <rect x="100" y="170" width="850" height="280" fill="#d1fae5" opacity="0.3" />
                    
                    {/* Grid lines */}
                    <line x1="100" y1="50" x2="950" y2="50" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="170" x2="950" y2="170" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="290" x2="950" y2="290" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="410" x2="950" y2="410" stroke="#e2e8f0" strokeWidth="2" />
                    
                    {/* Y-axis labels */}
                    <text x="80" y="60" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">39.0°C</text>
                    <text x="80" y="180" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">37.5°C</text>
                    <text x="80" y="300" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">37.0°C</text>
                    <text x="80" y="420" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">36.5°C</text>
                    
                    {/* Y-axis title */}
                    <text x="20" y="300" textAnchor="middle" fontSize="18" fill="#475569" fontWeight="bold" transform="rotate(-90, 20, 300)">Temperature (°C)</text>
                    
                    {/* Normal range line */}
                    <line x1="100" y1="290" x2="950" y2="290" stroke="#10b981" strokeWidth="4" strokeDasharray="10,5" />
                    
                    {/* Temperature trend line */}
                    <polyline
                      points="100,315 270,290 440,135 610,320 780,335 950,345"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Data points */}
                    <circle cx="100" cy="315" r="10" fill="#10b981" stroke="white" strokeWidth="3" />
                    <circle cx="270" cy="290" r="10" fill="#10b981" stroke="white" strokeWidth="3" />
                    <circle cx="440" cy="135" r="10" fill="#dc2626" stroke="white" strokeWidth="3" />
                    <circle cx="610" cy="320" r="10" fill="#10b981" stroke="white" strokeWidth="3" />
                    <circle cx="780" cy="335" r="10" fill="#10b981" stroke="white" strokeWidth="3" />
                    <circle cx="950" cy="345" r="10" fill="#10b981" stroke="white" strokeWidth="3" />
                    
                    {/* Value labels */}
                    <text x="100" y="345" textAnchor="middle" fontSize="18" fill="#10b981" fontWeight="bold">37.2</text>
                    <text x="270" y="320" textAnchor="middle" fontSize="18" fill="#10b981" fontWeight="bold">37.5</text>
                    <text x="440" y="165" textAnchor="middle" fontSize="18" fill="#dc2626" fontWeight="bold">38.3</text>
                    <text x="610" y="350" textAnchor="middle" fontSize="18" fill="#10b981" fontWeight="bold">37.1</text>
                    <text x="780" y="365" textAnchor="middle" fontSize="18" fill="#10b981" fontWeight="bold">37.0</text>
                    <text x="950" y="375" textAnchor="middle" fontSize="18" fill="#10b981" fontWeight="bold">36.9</text>
                    
                    {/* X-axis time labels */}
                    <text x="100" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">06:00</text>
                    <text x="270" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">10:00</text>
                    <text x="440" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">14:00</text>
                    <text x="610" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">18:00</text>
                    <text x="780" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">22:00</text>
                    <text x="950" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">02:00</text>
                    
                    {/* X-axis title */}
                    <text x="525" y="540" textAnchor="middle" fontSize="20" fill="#475569" fontWeight="bold">Time</text>
                    
                    {/* Zone labels */}
                    <text x="525" y="120" textAnchor="middle" fontSize="17" fill="#991b1b" fontWeight="bold">⚠️ Fever (&gt;37.5°C)</text>
                    <text x="525" y="260" textAnchor="middle" fontSize="17" fill="#047857" fontWeight="bold">✓ Normal Range (36.5-37.5°C)</text>
                  </svg>
                </div>
                <div className="flex items-center justify-center gap-8 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500"></div>
                    <span className="text-base font-medium text-slate-700">Fever</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500"></div>
                    <span className="text-base font-medium text-slate-700">Normal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-red-500"></div>
                    <span className="text-base font-medium text-slate-700">Trend Line</span>
                  </div>
                </div>
              </div>
            )}

            {/* Heart Rate Chart - Expanded */}
            {expandedChart === 'heartrate' && (
              <div className="bg-gradient-to-br from-pink-50 to-red-50 p-4 rounded-xl">
                <div className="bg-white p-4 rounded-xl">
                  <svg viewBox="0 0 1000 600" className="w-full" style={{ height: '70vh', minHeight: '500px' }}>
                    {/* Background zones */}
                    <rect x="100" y="50" width="850" height="100" fill="#fee2e2" opacity="0.3" />
                    <rect x="100" y="150" width="850" height="300" fill="#d1fae5" opacity="0.3" />
                    
                    {/* Grid lines */}
                    <line x1="100" y1="50" x2="950" y2="50" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="150" x2="950" y2="150" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="250" x2="950" y2="250" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="350" x2="950" y2="350" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="450" x2="950" y2="450" stroke="#e2e8f0" strokeWidth="2" />
                    
                    {/* Y-axis labels */}
                    <text x="80" y="60" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">110</text>
                    <text x="80" y="160" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">100</text>
                    <text x="80" y="260" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">90</text>
                    <text x="80" y="360" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">80</text>
                    <text x="80" y="460" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">70</text>
                    
                    {/* Y-axis title */}
                    <text x="20" y="300" textAnchor="middle" fontSize="18" fill="#475569" fontWeight="bold" transform="rotate(-90, 20, 300)">Heart Rate (BPM)</text>
                    
                    {/* Normal range line */}
                    <line x1="100" y1="150" x2="950" y2="150" stroke="#10b981" strokeWidth="4" strokeDasharray="10,5" />
                    
                    {/* HR trend line */}
                    <polyline
                      points="100,280 270,230 440,160 610,250 780,300 950,320"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Data points */}
                    <circle cx="100" cy="280" r="10" fill="#10b981" stroke="white" strokeWidth="3" />
                    <circle cx="270" cy="230" r="10" fill="#10b981" stroke="white" strokeWidth="3" />
                    <circle cx="440" cy="160" r="10" fill="#10b981" stroke="white" strokeWidth="3" />
                    <circle cx="610" cy="250" r="10" fill="#10b981" stroke="white" strokeWidth="3" />
                    <circle cx="780" cy="300" r="10" fill="#10b981" stroke="white" strokeWidth="3" />
                    <circle cx="950" cy="320" r="10" fill="#10b981" stroke="white" strokeWidth="3" />
                    
                    {/* Value labels */}
                    <text x="100" y="310" textAnchor="middle" fontSize="18" fill="#10b981" fontWeight="bold">78</text>
                    <text x="270" y="260" textAnchor="middle" fontSize="18" fill="#10b981" fontWeight="bold">82</text>
                    <text x="440" y="190" textAnchor="middle" fontSize="18" fill="#10b981" fontWeight="bold">91</text>
                    <text x="610" y="280" textAnchor="middle" fontSize="18" fill="#10b981" fontWeight="bold">85</text>
                    <text x="780" y="330" textAnchor="middle" fontSize="18" fill="#10b981" fontWeight="bold">80</text>
                    <text x="950" y="350" textAnchor="middle" fontSize="18" fill="#10b981" fontWeight="bold">76</text>
                    
                    {/* X-axis time labels */}
                    <text x="100" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">06:00</text>
                    <text x="270" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">10:00</text>
                    <text x="440" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">14:00</text>
                    <text x="610" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">18:00</text>
                    <text x="780" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">22:00</text>
                    <text x="950" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">02:00</text>
                    
                    {/* X-axis title */}
                    <text x="525" y="540" textAnchor="middle" fontSize="20" fill="#475569" fontWeight="bold">Time</text>
                    
                    {/* Zone labels */}
                    <text x="525" y="105" textAnchor="middle" fontSize="17" fill="#991b1b" fontWeight="bold">⚠️ Tachycardia (&gt;100 bpm)</text>
                    <text x="525" y="240" textAnchor="middle" fontSize="17" fill="#047857" fontWeight="bold">✓ Normal Range (60-100 bpm)</text>
                  </svg>
                </div>
                <div className="flex items-center justify-center gap-8 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500"></div>
                    <span className="text-base font-medium text-slate-700">Tachycardia</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500"></div>
                    <span className="text-base font-medium text-slate-700">Normal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-pink-500"></div>
                    <span className="text-base font-medium text-slate-700">Trend Line</span>
                  </div>
                </div>
              </div>
            )}

            {/* Blood Pressure Chart - Expanded */}
            {expandedChart === 'bloodpressure' && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
                <div className="bg-white p-4 rounded-xl">
                  <svg viewBox="0 0 1000 600" className="w-full" style={{ height: '70vh', minHeight: '500px' }}>
                    {/* Background zones */}
                    <rect x="100" y="50" width="850" height="100" fill="#fee2e2" opacity="0.3" />
                    <rect x="100" y="150" width="850" height="300" fill="#d1fae5" opacity="0.3" />
                    
                    {/* Grid lines */}
                    <line x1="100" y1="50" x2="950" y2="50" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="150" x2="950" y2="150" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="250" x2="950" y2="250" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="350" x2="950" y2="350" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="450" x2="950" y2="450" stroke="#e2e8f0" strokeWidth="2" />
                    
                    {/* Y-axis labels */}
                    <text x="80" y="60" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">150</text>
                    <text x="80" y="160" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">140</text>
                    <text x="80" y="260" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">120</text>
                    <text x="80" y="360" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">100</text>
                    <text x="80" y="460" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">80</text>
                    
                    {/* Y-axis title */}
                    <text x="20" y="300" textAnchor="middle" fontSize="18" fill="#475569" fontWeight="bold" transform="rotate(-90, 20, 300)">Blood Pressure (mmHg)</text>
                    
                    {/* Normal range line */}
                    <line x1="100" y1="150" x2="950" y2="150" stroke="#10b981" strokeWidth="4" strokeDasharray="10,5" />
                    
                    {/* Systolic BP trend line */}
                    <polyline
                      points="100,230 270,200 440,175 610,210 780,240 950,250"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Diastolic BP trend line */}
                    <polyline
                      points="100,380 270,360 440,345 610,365 780,385 950,395"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="8,4"
                    />
                    
                    {/* Data points - Systolic */}
                    <circle cx="100" cy="230" r="10" fill="#3b82f6" stroke="white" strokeWidth="3" />
                    <circle cx="270" cy="200" r="10" fill="#3b82f6" stroke="white" strokeWidth="3" />
                    <circle cx="440" cy="175" r="10" fill="#3b82f6" stroke="white" strokeWidth="3" />
                    <circle cx="610" cy="210" r="10" fill="#3b82f6" stroke="white" strokeWidth="3" />
                    <circle cx="780" cy="240" r="10" fill="#3b82f6" stroke="white" strokeWidth="3" />
                    <circle cx="950" cy="250" r="10" fill="#3b82f6" stroke="white" strokeWidth="3" />
                    
                    {/* Data points - Diastolic */}
                    <circle cx="100" cy="380" r="8" fill="#06b6d4" stroke="white" strokeWidth="3" />
                    <circle cx="270" cy="360" r="8" fill="#06b6d4" stroke="white" strokeWidth="3" />
                    <circle cx="440" cy="345" r="8" fill="#06b6d4" stroke="white" strokeWidth="3" />
                    <circle cx="610" cy="365" r="8" fill="#06b6d4" stroke="white" strokeWidth="3" />
                    <circle cx="780" cy="385" r="8" fill="#06b6d4" stroke="white" strokeWidth="3" />
                    <circle cx="950" cy="395" r="8" fill="#06b6d4" stroke="white" strokeWidth="3" />
                    
                    {/* BP Value labels */}
                    <text x="100" y="220" textAnchor="middle" fontSize="17" fill="#3b82f6" fontWeight="bold">130</text>
                    <text x="100" y="405" textAnchor="middle" fontSize="15" fill="#06b6d4" fontWeight="bold">85</text>
                    
                    <text x="270" y="190" textAnchor="middle" fontSize="17" fill="#3b82f6" fontWeight="bold">135</text>
                    <text x="270" y="385" textAnchor="middle" fontSize="15" fill="#06b6d4" fontWeight="bold">88</text>
                    
                    <text x="440" y="165" textAnchor="middle" fontSize="17" fill="#3b82f6" fontWeight="bold">138</text>
                    <text x="440" y="370" textAnchor="middle" fontSize="15" fill="#06b6d4" fontWeight="bold">90</text>
                    
                    <text x="610" y="200" textAnchor="middle" fontSize="17" fill="#3b82f6" fontWeight="bold">132</text>
                    <text x="610" y="390" textAnchor="middle" fontSize="15" fill="#06b6d4" fontWeight="bold">86</text>
                    
                    <text x="780" y="230" textAnchor="middle" fontSize="17" fill="#3b82f6" fontWeight="bold">128</text>
                    <text x="780" y="410" textAnchor="middle" fontSize="15" fill="#06b6d4" fontWeight="bold">82</text>
                    
                    <text x="950" y="240" textAnchor="middle" fontSize="17" fill="#3b82f6" fontWeight="bold">125</text>
                    <text x="950" y="420" textAnchor="middle" fontSize="15" fill="#06b6d4" fontWeight="bold">80</text>
                    
                    {/* X-axis time labels */}
                    <text x="100" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">06:00</text>
                    <text x="270" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">10:00</text>
                    <text x="440" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">14:00</text>
                    <text x="610" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">18:00</text>
                    <text x="780" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">22:00</text>
                    <text x="950" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">02:00</text>
                    
                    {/* X-axis title */}
                    <text x="525" y="540" textAnchor="middle" fontSize="20" fill="#475569" fontWeight="bold">Time</text>
                    
                    {/* Zone labels */}
                    <text x="525" y="105" textAnchor="middle" fontSize="17" fill="#991b1b" fontWeight="bold">⚠️ Hypertension (≥140/90)</text>
                    <text x="525" y="240" textAnchor="middle" fontSize="17" fill="#047857" fontWeight="bold">✓ Normal (&lt;140/90 mmHg)</text>
                  </svg>
                </div>
                <div className="flex items-center justify-center gap-8 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-blue-500"></div>
                    <span className="text-base font-medium text-slate-700">Systolic</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-cyan-500 border-t-2 border-dashed border-cyan-600"></div>
                    <span className="text-base font-medium text-slate-700">Diastolic</span>
                  </div>
                </div>
              </div>
            )}

            {/* Glucose Chart - Expanded */}
            {expandedChart === 'glucose' && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                <div className="bg-white p-4 rounded-xl">
                  <svg viewBox="0 0 1000 600" className="w-full" style={{ height: '70vh', minHeight: '500px' }}>
                    {/* Background zones */}
                    <rect x="100" y="50" width="850" height="80" fill="#fee2e2" opacity="0.4" />
                    <rect x="100" y="130" width="850" height="190" fill="#d1fae5" opacity="0.4" />
                    <rect x="100" y="320" width="850" height="130" fill="#fef3c7" opacity="0.4" />
                    
                    {/* Grid lines */}
                    <line x1="100" y1="50" x2="950" y2="50" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="130" x2="950" y2="130" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="210" x2="950" y2="210" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="290" x2="950" y2="290" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="370" x2="950" y2="370" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="450" x2="950" y2="450" stroke="#e2e8f0" strokeWidth="2" />
                    
                    {/* Y-axis labels */}
                    <text x="80" y="60" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">16</text>
                    <text x="80" y="140" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">11</text>
                    <text x="80" y="220" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">7</text>
                    <text x="80" y="300" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">4</text>
                    <text x="80" y="380" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">2</text>
                    <text x="80" y="460" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">0</text>
                    
                    {/* Y-axis title */}
                    <text x="20" y="280" textAnchor="middle" fontSize="18" fill="#475569" fontWeight="bold" transform="rotate(-90, 20, 280)">Blood Glucose (mmol/L)</text>
                    
                    {/* Glucose trend line */}
                    <polyline
                      points="100,263 200,195 300,231 400,178 500,211 600,247 700,219 800,195 900,231"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Data points */}
                    <circle cx="100" cy="263" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="200" cy="195" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="300" cy="231" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="400" cy="178" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="500" cy="211" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="600" cy="247" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="700" cy="219" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="800" cy="195" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="900" cy="231" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    
                    {/* Value labels */}
                    <text x="100" y="250" textAnchor="middle" fontSize="17" fill="#22c55e" fontWeight="bold">6.5</text>
                    <text x="200" y="182" textAnchor="middle" fontSize="17" fill="#22c55e" fontWeight="bold">8.2</text>
                    <text x="300" y="218" textAnchor="middle" fontSize="17" fill="#22c55e" fontWeight="bold">7.1</text>
                    <text x="400" y="165" textAnchor="middle" fontSize="17" fill="#22c55e" fontWeight="bold">9.0</text>
                    <text x="500" y="198" textAnchor="middle" fontSize="17" fill="#22c55e" fontWeight="bold">7.8</text>
                    <text x="600" y="234" textAnchor="middle" fontSize="17" fill="#22c55e" fontWeight="bold">6.8</text>
                    <text x="700" y="206" textAnchor="middle" fontSize="17" fill="#22c55e" fontWeight="bold">7.5</text>
                    <text x="800" y="182" textAnchor="middle" fontSize="17" fill="#22c55e" fontWeight="bold">8.0</text>
                    <text x="900" y="218" textAnchor="middle" fontSize="17" fill="#22c55e" fontWeight="bold">7.2</text>
                    
                    {/* X-axis date/time labels */}
                    <text x="100" y="490" textAnchor="middle" fontSize="18" fill="#1e293b" fontWeight="bold">08 Oct</text>
                    <text x="100" y="510" textAnchor="middle" fontSize="14" fill="#64748b">06:00</text>
                    
                    <text x="200" y="490" textAnchor="middle" fontSize="18" fill="#1e293b" fontWeight="bold">08 Oct</text>
                    <text x="200" y="510" textAnchor="middle" fontSize="14" fill="#64748b">14:00</text>
                    
                    <text x="300" y="490" textAnchor="middle" fontSize="18" fill="#1e293b" fontWeight="bold">08 Oct</text>
                    <text x="300" y="510" textAnchor="middle" fontSize="14" fill="#64748b">22:00</text>
                    
                    <text x="400" y="490" textAnchor="middle" fontSize="18" fill="#1e293b" fontWeight="bold">09 Oct</text>
                    <text x="400" y="510" textAnchor="middle" fontSize="14" fill="#64748b">06:00</text>
                    
                    <text x="500" y="490" textAnchor="middle" fontSize="18" fill="#1e293b" fontWeight="bold">09 Oct</text>
                    <text x="500" y="510" textAnchor="middle" fontSize="14" fill="#64748b">14:00</text>
                    
                    <text x="600" y="490" textAnchor="middle" fontSize="18" fill="#1e293b" fontWeight="bold">09 Oct</text>
                    <text x="600" y="510" textAnchor="middle" fontSize="14" fill="#64748b">22:00</text>
                    
                    <text x="700" y="490" textAnchor="middle" fontSize="18" fill="#1e293b" fontWeight="bold">10 Oct</text>
                    <text x="700" y="510" textAnchor="middle" fontSize="14" fill="#64748b">06:00</text>
                    
                    <text x="800" y="490" textAnchor="middle" fontSize="18" fill="#1e293b" fontWeight="bold">10 Oct</text>
                    <text x="800" y="510" textAnchor="middle" fontSize="14" fill="#64748b">14:00</text>
                    
                    <text x="900" y="490" textAnchor="middle" fontSize="18" fill="#1e293b" fontWeight="bold">10 Oct</text>
                    <text x="900" y="510" textAnchor="middle" fontSize="14" fill="#64748b">22:00</text>
                    
                    {/* X-axis title */}
                    <text x="525" y="560" textAnchor="middle" fontSize="20" fill="#475569" fontWeight="bold">Date & Time</text>
                    
                    {/* Zone labels with icons */}
                    <text x="550" y="95" textAnchor="middle" fontSize="17" fill="#991b1b" fontWeight="bold">⚠️ Hyperglycemia (&gt;11 mmol/L)</text>
                    <text x="550" y="225" textAnchor="middle" fontSize="17" fill="#047857" fontWeight="bold">✓ Target Range (4-11 mmol/L)</text>
                    <text x="550" y="400" textAnchor="middle" fontSize="17" fill="#d97706" fontWeight="bold">⚡ Hypoglycemia (&lt;4 mmol/L)</text>
                  </svg>
                </div>
                <div className="flex items-center justify-center gap-8 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500"></div>
                    <span className="text-base font-medium text-slate-700">High (&gt;11)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500"></div>
                    <span className="text-base font-medium text-slate-700">Normal (4-11)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500"></div>
                    <span className="text-base font-medium text-slate-700">Low (&lt;4)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-purple-500"></div>
                    <span className="text-base font-medium text-slate-700">Trend Line</span>
                  </div>
                </div>
              </div>
            )}

            {/* Oxygen Chart - Expanded */}
            {expandedChart === 'oxygen' && (
              <div className="bg-gradient-to-br from-slate-50 to-purple-50 p-4 rounded-xl">
                <div className="bg-white p-4 rounded-xl">
                  <svg viewBox="0 0 1000 600" className="w-full" style={{ height: '70vh', minHeight: '500px' }}>
                    {/* Background zones */}
                    <rect x="100" y="50" width="850" height="150" fill="#fee2e2" opacity="0.3" />
                    <rect x="100" y="200" width="850" height="250" fill="#d1fae5" opacity="0.3" />
                    
                    {/* Grid lines */}
                    <line x1="100" y1="50" x2="950" y2="50" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="150" x2="950" y2="150" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="250" x2="950" y2="250" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="350" x2="950" y2="350" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="450" x2="950" y2="450" stroke="#e2e8f0" strokeWidth="2" />
                    
                    {/* Y-axis labels */}
                    <text x="80" y="60" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">100%</text>
                    <text x="80" y="160" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">98%</text>
                    <text x="80" y="260" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">96%</text>
                    <text x="80" y="360" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">94%</text>
                    <text x="80" y="460" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">92%</text>
                    
                    {/* Y-axis title */}
                    <text x="20" y="280" textAnchor="middle" fontSize="18" fill="#475569" fontWeight="bold" transform="rotate(-90, 20, 280)">SpO2 (%)</text>
                    
                    {/* Target line */}
                    <line x1="100" y1="350" x2="950" y2="350" stroke="#10b981" strokeWidth="4" strokeDasharray="10,5" />
                    
                    {/* SpO2 trend line */}
                    <polyline
                      points="100,150 230,180 360,205 490,190 620,165 750,160 880,175"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Data points */}
                    <circle cx="100" cy="150" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="230" cy="180" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="360" cy="205" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="490" cy="190" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="620" cy="165" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="750" cy="160" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    <circle cx="880" cy="175" r="10" fill="#22c55e" stroke="white" strokeWidth="3" />
                    
                    {/* Value labels */}
                    <text x="100" y="137" textAnchor="middle" fontSize="18" fill="#22c55e" fontWeight="bold">98%</text>
                    <text x="230" y="167" textAnchor="middle" fontSize="18" fill="#22c55e" fontWeight="bold">97%</text>
                    <text x="360" y="192" textAnchor="middle" fontSize="18" fill="#22c55e" fontWeight="bold">96%</text>
                    <text x="490" y="177" textAnchor="middle" fontSize="18" fill="#22c55e" fontWeight="bold">97%</text>
                    <text x="620" y="152" textAnchor="middle" fontSize="18" fill="#22c55e" fontWeight="bold">98%</text>
                    <text x="750" y="147" textAnchor="middle" fontSize="18" fill="#22c55e" fontWeight="bold">98%</text>
                    <text x="880" y="162" textAnchor="middle" fontSize="18" fill="#22c55e" fontWeight="bold">97%</text>
                    
                    {/* X-axis time labels */}
                    <text x="100" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">06:00</text>
                    <text x="230" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">09:00</text>
                    <text x="360" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">12:00</text>
                    <text x="490" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">15:00</text>
                    <text x="620" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">18:00</text>
                    <text x="750" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">21:00</text>
                    <text x="880" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">00:00</text>
                    
                    {/* X-axis title */}
                    <text x="525" y="540" textAnchor="middle" fontSize="20" fill="#475569" fontWeight="bold">Time</text>
                    
                    {/* Zone labels */}
                    <text x="525" y="125" textAnchor="middle" fontSize="17" fill="#991b1b" fontWeight="bold">⚠️ Low Oxygen (&lt;94%)</text>
                    <text x="525" y="300" textAnchor="middle" fontSize="17" fill="#047857" fontWeight="bold">✓ Normal (≥94%)</text>
                    <text x="800" y="365" fontSize="16" fill="#10b981" fontWeight="bold">Target: 94%</text>
                  </svg>
                </div>
                <div className="flex items-center justify-center gap-8 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500"></div>
                    <span className="text-base font-medium text-slate-700">Low (&lt;94%)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500"></div>
                    <span className="text-base font-medium text-slate-700">Normal (≥94%)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-purple-500"></div>
                    <span className="text-base font-medium text-slate-700">Trend Line</span>
                  </div>
                </div>
              </div>
            )}

            {/* Intake/Output Chart - Expanded */}
            {expandedChart === 'intakeoutput' && (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-xl">
                <div className="bg-white p-4 rounded-xl">
                  <svg viewBox="0 0 1000 600" className="w-full" style={{ height: '70vh', minHeight: '500px' }}>
                    {/* Grid lines */}
                    <line x1="100" y1="50" x2="950" y2="50" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="150" x2="950" y2="150" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="250" x2="950" y2="250" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="350" x2="950" y2="350" stroke="#e2e8f0" strokeWidth="2" />
                    <line x1="100" y1="450" x2="950" y2="450" stroke="#e2e8f0" strokeWidth="2" />
                    
                    {/* Y-axis labels */}
                    <text x="80" y="60" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">3000</text>
                    <text x="80" y="160" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">2400</text>
                    <text x="80" y="260" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">1800</text>
                    <text x="80" y="360" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">1200</text>
                    <text x="80" y="460" textAnchor="end" fontSize="22" fill="#1e293b" fontWeight="bold">600</text>
                    
                    {/* Y-axis title */}
                    <text x="20" y="280" textAnchor="middle" fontSize="18" fill="#475569" fontWeight="bold" transform="rotate(-90, 20, 280)">Volume (ml)</text>
                    
                    {/* Intake line (Blue) - cumulative */}
                    <polyline
                      points="100,450 200,380 300,310 400,260 500,210 600,165 700,125 800,85 900,55"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Output line (Red) - cumulative */}
                    <polyline
                      points="100,450 200,395 300,335 400,285 500,240 600,200 700,165 800,135 900,100"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Balance line (Green) - dashed */}
                    <polyline
                      points="100,450 200,425 300,395 400,370 500,350 600,335 700,320 800,305 900,285"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="10,5"
                    />
                    
                    {/* Data points - Intake */}
                    <circle cx="100" cy="450" r="8" fill="#3b82f6" stroke="white" strokeWidth="3" />
                    <circle cx="300" cy="310" r="8" fill="#3b82f6" stroke="white" strokeWidth="3" />
                    <circle cx="500" cy="210" r="8" fill="#3b82f6" stroke="white" strokeWidth="3" />
                    <circle cx="700" cy="125" r="8" fill="#3b82f6" stroke="white" strokeWidth="3" />
                    <circle cx="900" cy="55" r="8" fill="#3b82f6" stroke="white" strokeWidth="3" />
                    
                    {/* Data points - Output */}
                    <circle cx="100" cy="450" r="6" fill="#ef4444" stroke="white" strokeWidth="3" />
                    <circle cx="300" cy="335" r="6" fill="#ef4444" stroke="white" strokeWidth="3" />
                    <circle cx="500" cy="240" r="6" fill="#ef4444" stroke="white" strokeWidth="3" />
                    <circle cx="700" cy="165" r="6" fill="#ef4444" stroke="white" strokeWidth="3" />
                    <circle cx="900" cy="100" r="6" fill="#ef4444" stroke="white" strokeWidth="3" />
                    
                    {/* X-axis time labels */}
                    <text x="100" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">00:00</text>
                    <text x="200" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">03:00</text>
                    <text x="300" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">06:00</text>
                    <text x="400" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">09:00</text>
                    <text x="500" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">12:00</text>
                    <text x="600" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">15:00</text>
                    <text x="700" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">18:00</text>
                    <text x="800" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">21:00</text>
                    <text x="900" y="490" textAnchor="middle" fontSize="20" fill="#1e293b" fontWeight="bold">24:00</text>
                    
                    {/* X-axis title */}
                    <text x="525" y="540" textAnchor="middle" fontSize="20" fill="#475569" fontWeight="bold">Time (24h)</text>
                    
                    {/* Legend labels */}
                    <text x="200" y="25" fontSize="16" fill="#3b82f6" fontWeight="bold">💧 Intake</text>
                    <text x="475" y="25" fontSize="16" fill="#ef4444" fontWeight="bold">💧 Output</text>
                    <text x="750" y="25" fontSize="16" fill="#10b981" fontWeight="bold">⚖️ Balance</text>
                  </svg>
                </div>
                <div className="flex items-center justify-center gap-8 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-blue-500"></div>
                    <span className="text-base font-medium text-slate-700">Intake</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-red-500"></div>
                    <span className="text-base font-medium text-slate-700">Output</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-green-500 border-t-2 border-dashed border-green-600"></div>
                    <span className="text-base font-medium text-slate-700">Balance</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lab Result Modal */}
      <Dialog open={showLabResultModal} onOpenChange={setShowLabResultModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-900">Laboratory Report</DialogTitle>
          </DialogHeader>
          {selectedLabResult && (
            <div className="space-y-6 print:p-8">
              {/* Hospital Header */}
              <div className="border-b-4 border-blue-600 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-blue-900">Hospital KKM</h1>
                    <p className="text-sm text-slate-600">Department of Pathology</p>
                    <p className="text-sm text-slate-600">Jalan Hospital, 50586 Kuala Lumpur</p>
                    <p className="text-sm text-slate-600">Tel: +603-2615-5555 | Fax: +603-2698-3000</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-100 px-6 py-3 rounded-lg">
                      <p className="text-xs font-semibold text-blue-900">LABORATORY REPORT</p>
                      <p className="text-2xl font-bold text-blue-600">LAB-{Math.floor(Math.random() * 90000) + 10000}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="bg-slate-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Patient Name</p>
                    <p className="text-base font-bold text-slate-900">{patient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">IC/Passport No</p>
                    <p className="text-base font-semibold text-slate-900">{patient.ic}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">MRN</p>
                    <p className="text-base font-semibold text-slate-900">{patient.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Age/Gender</p>
                    <p className="text-base font-semibold text-slate-900">{patient.age} / {patient.sex}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Ward</p>
                    <p className="text-base font-semibold text-slate-900">{patient.ward}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Bed No</p>
                    <p className="text-base font-semibold text-slate-900">{patient.bed}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Requesting Doctor</p>
                    <p className="text-base font-semibold text-slate-900">Dr. Rashid Ahmad</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Clinical Info</p>
                    <p className="text-base font-semibold text-slate-900">{patient.diagnosis}</p>
                  </div>
                </div>
              </div>

              {/* Test Details */}
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-4">{selectedLabResult.testName}</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Sample Type</p>
                    <p className="text-base font-semibold text-slate-900">{selectedLabResult.sampleType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Collected</p>
                    <p className="text-base font-semibold text-slate-900">{selectedLabResult.collectedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Received</p>
                    <p className="text-base font-semibold text-slate-900">{selectedLabResult.receivedDate}</p>
                  </div>
                </div>

                {/* Results Table */}
                {selectedLabResult.results && selectedLabResult.results.length > 0 && (
                  <div className="overflow-x-auto border-2 border-slate-200 rounded-lg mb-6">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-blue-600">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase">Parameter</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase">Result</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase">Unit</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase">Reference Range</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {selectedLabResult.results.map((result: any, idx: number) => (
                          <tr key={idx} className={result.flag ? 'bg-red-50' : ''}>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">{result.parameter}</td>
                            <td className="px-6 py-4 text-center text-base font-bold text-slate-900">{result.value}</td>
                            <td className="px-6 py-4 text-center text-sm text-slate-600">{result.unit}</td>
                            <td className="px-6 py-4 text-center text-sm text-slate-600">{result.referenceRange}</td>
                            <td className="px-6 py-4 text-center">
                              {result.flag && (
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                                  {result.flag}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Interpretation */}
                {selectedLabResult.interpretation && (
                  <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                    <p className="text-xs font-bold text-green-900 uppercase mb-2">Clinical Interpretation</p>
                    <p className="text-sm text-slate-900">{selectedLabResult.interpretation}</p>
                  </div>
                )}
              </div>

              {/* Report Footer */}
              <div className="border-t-2 border-slate-200 pt-4">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Reported Date</p>
                    <p className="text-base font-bold text-slate-900">{selectedLabResult.reportedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Reported By</p>
                    <p className="text-base font-bold text-slate-900">{selectedLabResult.reportedBy}</p>
                    <div className="mt-4 pt-2 border-t border-slate-300">
                      <p className="text-xs text-slate-500 italic">Digital Signature</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center text-xs text-slate-500">
                  <p>This is a computer-generated report. No signature is required.</p>
                  <p>For queries, please contact the Department of Pathology at ext. 2345</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Imaging Result Modal */}
      <Dialog open={showImagingResultModal} onOpenChange={setShowImagingResultModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-indigo-900">Radiology Report</DialogTitle>
          </DialogHeader>
          {selectedImagingResult && (
            <div className="space-y-6 print:p-8">
              {/* Hospital Header */}
              <div className="border-b-4 border-indigo-600 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-indigo-900">Hospital KKM</h1>
                    <p className="text-sm text-slate-600">Department of Radiology</p>
                    <p className="text-sm text-slate-600">Jalan Hospital, 50586 Kuala Lumpur</p>
                    <p className="text-sm text-slate-600">Tel: +603-2615-5555 | Fax: +603-2698-3000</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-indigo-100 px-6 py-3 rounded-lg">
                      <p className="text-xs font-semibold text-indigo-900">RADIOLOGY REPORT</p>
                      <p className="text-2xl font-bold text-indigo-600">RAD-{Math.floor(Math.random() * 90000) + 10000}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="bg-slate-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Patient Name</p>
                    <p className="text-base font-bold text-slate-900">{patient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">IC/Passport No</p>
                    <p className="text-base font-semibold text-slate-900">{patient.ic}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">MRN</p>
                    <p className="text-base font-semibold text-slate-900">{patient.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Age/Gender</p>
                    <p className="text-base font-semibold text-slate-900">{patient.age} / {patient.sex}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Ward</p>
                    <p className="text-base font-semibold text-slate-900">{patient.ward}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Bed No</p>
                    <p className="text-base font-semibold text-slate-900">{patient.bed}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Referring Doctor</p>
                    <p className="text-base font-semibold text-slate-900">Dr. Rashid Ahmad</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Clinical Indication</p>
                    <p className="text-base font-semibold text-slate-900">{selectedImagingResult.indication}</p>
                  </div>
                </div>
              </div>

              {/* Examination Details */}
              <div>
                <h3 className="text-xl font-bold text-indigo-900 mb-4">{selectedImagingResult.examType}</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Performed Date</p>
                    <p className="text-base font-semibold text-slate-900">{selectedImagingResult.performedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Reported Date</p>
                    <p className="text-base font-semibold text-slate-900">{selectedImagingResult.reportedDate}</p>
                  </div>
                </div>

                {/* Technique */}
                {selectedImagingResult.technique && (
                  <div className="mb-6">
                    <p className="text-sm font-bold text-slate-700 uppercase mb-2">Technique:</p>
                    <p className="text-base text-slate-900 leading-relaxed">{selectedImagingResult.technique}</p>
                  </div>
                )}

                {/* Findings */}
                {selectedImagingResult.findings && selectedImagingResult.findings.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-bold text-slate-700 uppercase mb-3">Findings:</p>
                    <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
                      <ul className="space-y-2">
                        {selectedImagingResult.findings.map((finding: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="text-indigo-600 font-bold mt-1">•</span>
                            <span className="text-base text-slate-900">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Impression */}
                {selectedImagingResult.impression && (
                  <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg mb-6">
                    <p className="text-sm font-bold text-blue-900 uppercase mb-2">Impression:</p>
                    <p className="text-base font-bold text-slate-900">{selectedImagingResult.impression}</p>
                  </div>
                )}

                {/* Recommendation */}
                {selectedImagingResult.recommendation && (
                  <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-lg">
                    <p className="text-sm font-bold text-amber-900 uppercase mb-2">Recommendation:</p>
                    <p className="text-base text-slate-900">{selectedImagingResult.recommendation}</p>
                  </div>
                )}
              </div>

              {/* Report Footer */}
              <div className="border-t-2 border-slate-200 pt-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Reported By</p>
                  <p className="text-base font-bold text-slate-900">{selectedImagingResult.radiologist}</p>
                  <div className="mt-4 pt-2 border-t border-slate-300">
                    <p className="text-xs text-slate-500 italic">Digital Signature</p>
                  </div>
                </div>
                <div className="mt-6 text-center text-xs text-slate-500">
                  <p>This is a computer-generated report. No signature is required.</p>
                  <p>For queries, please contact the Department of Radiology at ext. 3456</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Request Form Modal */}
      <Dialog open={showPrintRequestModal} onOpenChange={setShowPrintRequestModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-900">Request Form</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 print:p-8">
              {/* Hospital Header */}
              <div className="border-b-4 border-purple-600 pb-4">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-purple-900">Hospital KKM</h1>
                  <p className="text-sm text-slate-600">
                    {selectedRequest.type === 'lab' ? 'Laboratory Investigation Request Form' : 'Radiology/Imaging Request Form'}
                  </p>
                  <p className="text-sm text-slate-600">Jalan Hospital, 50586 Kuala Lumpur</p>
                </div>
              </div>

              {/* Request Details */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Request No</p>
                    <p className="text-lg font-bold text-purple-900">REQ-{Math.floor(Math.random() * 90000) + 10000}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Date & Time</p>
                    <p className="text-base font-bold text-slate-900">{selectedRequest.date}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Priority</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mt-2 ${
                    selectedRequest.urgency === 'Urgent' ? 'bg-orange-100 text-orange-800' : 
                    selectedRequest.urgency === 'STAT' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedRequest.urgency}
                  </span>
                </div>
              </div>

              {/* Patient Information */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Patient Information
                </h3>
                <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Name</p>
                      <p className="text-base font-bold text-slate-900">{patient.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">IC/Passport No</p>
                      <p className="text-base font-semibold text-slate-900">{patient.ic}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">MRN</p>
                      <p className="text-base font-semibold text-slate-900">{patient.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Age/Gender</p>
                      <p className="text-base font-semibold text-slate-900">{patient.age} / {patient.sex}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Ward</p>
                      <p className="text-base font-semibold text-slate-900">{patient.ward}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Bed No</p>
                      <p className="text-base font-semibold text-slate-900">{patient.bed}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Investigation/Examination Requested */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  {selectedRequest.type === 'lab' ? 'Investigation Requested' : 'Examination Requested'}
                </h3>
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <p className="text-xl font-bold text-slate-900">{selectedRequest.name}</p>
                </div>
              </div>

              {/* Clinical Information */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Clinical Information</h3>
                <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
                  <p className="text-base text-slate-900">{patient.diagnosis}</p>
                </div>
              </div>

              {/* Requesting Doctor */}
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Requested By</p>
                <p className="text-lg font-bold text-slate-900">{selectedRequest.orderedBy}</p>
                <p className="text-sm text-slate-600">Medical Officer, General Ward</p>
                <div className="mt-4 pt-4 border-t-2 border-slate-300">
                  <p className="text-xs text-slate-500 italic">Doctor's Signature & Stamp</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-slate-500">
                <p>Please ensure this form is completed and signed before sending the sample/patient</p>
              </div>

              {/* Print Button */}
              <div className="flex justify-center pt-4">
                <Button onClick={() => window.print()} className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <FileText className="h-4 w-4" />
                  Print Request Form
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

