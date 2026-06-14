'use client';

import React, { useState } from 'react';
import type { EmergencyPatient, VitalSigns, PatientHistory } from '../types/Patient';

interface PatientAssessmentModalProps {
  patient: EmergencyPatient;
  onClose: () => void;
  onSave: (updates: Partial<EmergencyPatient>) => void;
}

export function PatientAssessmentModal({ patient, onClose, onSave }: PatientAssessmentModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'vitals' | 'examination' | 'medications' | 'lab' | 'imaging'>('overview');
  
  // Vitals state
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');
  const [rr, setRr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [painScore, setPainScore] = useState('0');
  const [gcs, setGcs] = useState('15/15');
  const [recordedBy, setRecordedBy] = useState('');
  
  // History state
  const [presentingComplaint, setPresentingComplaint] = useState(patient.history?.presentingComplaint || patient.chiefComplaint || '');
  const [hopi, setHopi] = useState(patient.history?.historyOfPresentingComplaint || '');
  
  // Past Medical History - Individual conditions
  const [hasDM, setHasDM] = useState(false);
  const [hasHTN, setHasHTN] = useState(false);
  const [hasIHD, setHasIHD] = useState(false);
  const [hasAsthma, setHasAsthma] = useState(false);
  const [hasCOPD, setHasCOPD] = useState(false);
  const [hasCKD, setHasCKD] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [hasCancer, setHasCancer] = useState(false);
  const [otherPMHx, setOtherPMHx] = useState('');
  
  // Past Surgical History
  const [pshx, setPshx] = useState('');
  
  // Current Medications
  const [currentMeds, setCurrentMeds] = useState('');
  
  // Allergies
  const [hasAllergies, setHasAllergies] = useState(false);
  const [allergyList, setAllergyList] = useState('');
  const [allergyReaction, setAllergyReaction] = useState('');
  
  // Social History
  const [smokingStatus, setSmokingStatus] = useState<'non-smoker' | 'ex-smoker' | 'current-smoker'>('non-smoker');
  const [cigarettesPerDay, setCigarettesPerDay] = useState('');
  const [smokingYears, setSmokingYears] = useState('');
  const [alcoholStatus, setAlcoholStatus] = useState<'non-drinker' | 'social' | 'regular'>('non-drinker');
  const [occupation, setOccupation] = useState('');
  const [livingArrangement, setLivingArrangement] = useState('');
  
  // Family History
  const [familyHistory, setFamilyHistory] = useState('');
  
  // Physical Examination
  const [generalAppearance, setGeneralAppearance] = useState('');
  const [cardiovascular, setCardiovascular] = useState('');
  const [respiratory, setRespiratory] = useState('');
  const [abdominal, setAbdominal] = useState('');
  const [neurological, setNeurological] = useState('');
  const [musculoskeletal, setMusculoskeletal] = useState('');
  const [skin, setSkin] = useState('');
  const [examinedBy, setExaminedBy] = useState('');
  
  // Medication Prescription
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [route, setRoute] = useState('PO');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [indication, setIndication] = useState('');
  const [prescribedBy, setPrescribedBy] = useState(patient.assignedDoctor || '');
  
  // Lab Investigation
  const [labTestName, setLabTestName] = useState('');
  const [labPriority, setLabPriority] = useState<'routine' | 'urgent' | 'stat'>('urgent');
  const [labIndication, setLabIndication] = useState('');
  const [labOrderedBy, setLabOrderedBy] = useState(patient.assignedDoctor || '');
  
  // Imaging/Radiology
  const [imagingType, setImagingType] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [imagingPriority, setImagingPriority] = useState<'routine' | 'urgent' | 'stat'>('urgent');
  const [imagingIndication, setImagingIndication] = useState('');
  const [imagingOrderedBy, setImagingOrderedBy] = useState(patient.assignedDoctor || '');
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-MY', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleSaveVitals = () => {
    if (!bp || !hr || !recordedBy) {
      alert('Please fill in at least BP, HR, and Recorded By');
      return;
    }
    
    const newVital: VitalSigns = {
      bloodPressure: bp,
      heartRate: parseInt(hr),
      temperature: parseFloat(temp) || 36.5,
      respiratoryRate: parseInt(rr) || 16,
      oxygenSaturation: parseInt(spo2) || 98,
      painScore: parseInt(painScore),
      gcs,
      recordedAt: new Date(),
      recordedBy,
    };
    
    const updatedVitals = [...(patient.vitals || []), newVital];
    
    onSave({
      vitals: updatedVitals,
      timeline: [
        ...(patient.timeline || []),
        {
          id: `TL${Date.now()}`,
          timestamp: new Date(),
          type: 'vitals',
          description: `Vitals recorded: BP ${bp}, HR ${hr}, SpO2 ${spo2}%`,
          actor: recordedBy,
        },
      ],
    });
    
    // Clear form
    setBp('');
    setHr('');
    setTemp('');
    setRr('');
    setSpo2('');
    setPainScore('0');
    setGcs('15/15');
    setRecordedBy('');
  };
  
  const handleSaveHistory = () => {
    const pmhxList: string[] = [];
    if (hasDM) pmhxList.push('Diabetes Mellitus');
    if (hasHTN) pmhxList.push('Hypertension');
    if (hasIHD) pmhxList.push('Ischemic Heart Disease');
    if (hasAsthma) pmhxList.push('Asthma');
    if (hasCOPD) pmhxList.push('COPD');
    if (hasCKD) pmhxList.push('Chronic Kidney Disease');
    if (hasStroke) pmhxList.push('Previous Stroke/TIA');
    if (hasCancer) pmhxList.push('Cancer');
    if (otherPMHx) pmhxList.push(...otherPMHx.split(',').map(s => s.trim()).filter(Boolean));
    
    const pshxList = pshx.split(',').map(s => s.trim()).filter(Boolean);
    const medsList = currentMeds.split(',').map(s => s.trim()).filter(Boolean);
    const allergyListArray = hasAllergies 
      ? allergyList.split(',').map(s => s.trim()).filter(Boolean)
      : ['No known drug allergies'];
    
    let socialHistoryText = '';
    if (smokingStatus === 'current-smoker') {
      socialHistoryText += `Smoker: ${cigarettesPerDay} cigarettes/day for ${smokingYears} years. `;
    } else if (smokingStatus === 'ex-smoker') {
      socialHistoryText += `Ex-smoker (quit ${smokingYears} years ago). `;
    } else {
      socialHistoryText += 'Non-smoker. ';
    }
    
    if (alcoholStatus === 'regular') {
      socialHistoryText += 'Regular alcohol consumption. ';
    } else if (alcoholStatus === 'social') {
      socialHistoryText += 'Social drinker. ';
    } else {
      socialHistoryText += 'Non-drinker. ';
    }
    
    if (occupation) socialHistoryText += `Occupation: ${occupation}. `;
    if (livingArrangement) socialHistoryText += `Living: ${livingArrangement}.`;
    
    const history: PatientHistory = {
      presentingComplaint,
      historyOfPresentingComplaint: hopi,
      pastMedicalHistory: pmhxList,
      pastSurgicalHistory: pshxList,
      medications: medsList,
      allergies: allergyListArray,
      socialHistory: socialHistoryText.trim(),
      familyHistory: familyHistory || 'None significant',
    };
    
    onSave({
      history,
      timeline: [
        ...(patient.timeline || []),
        {
          id: `TL${Date.now()}`,
          timestamp: new Date(),
          type: 'note',
          description: 'Medical history documented',
          actor: patient.assignedDoctor || 'Doctor',
        },
      ],
    });
    
    alert('Medical history saved successfully!');
  };
  
  const handleSaveExamination = () => {
    if (!generalAppearance || !examinedBy) {
      alert('Please fill in at least General Appearance and Examined By');
      return;
    }
    
    onSave({
      examination: {
        general: generalAppearance,
        cardiovascular,
        respiratory,
        abdominal,
        neurological,
        musculoskeletal,
        skin,
        examinedBy,
        examinedAt: new Date(),
      },
      timeline: [
        ...(patient.timeline || []),
        {
          id: `TL${Date.now()}`,
          timestamp: new Date(),
          type: 'note',
          description: 'Physical examination documented',
          actor: examinedBy,
        },
      ],
    });
    
    alert('Physical examination saved successfully!');
  };
  
  const handlePrescribeMedication = () => {
    if (!medicationName || !dosage || !frequency || !prescribedBy) {
      alert('Please fill in Medication Name, Dosage, Frequency, and Prescribed By');
      return;
    }
    
    const newMedication = {
      id: `PHARM${Date.now()}`,
      patientId: patient.id,
      medication: medicationName,
      dosage,
      route,
      frequency: `${frequency}${duration ? ` for ${duration} days` : ''}`,
      orderedBy: prescribedBy,
      orderedAt: new Date(),
      status: 'pending' as const,
    };
    
    onSave({
      pharmacyOrders: [...(patient.pharmacyOrders || []), newMedication],
      timeline: [
        ...(patient.timeline || []),
        {
          id: `TL${Date.now()}`,
          timestamp: new Date(),
          type: 'order-placed',
          description: `Medication prescribed: ${medicationName} ${dosage} ${route} ${frequency}`,
          actor: prescribedBy,
        },
      ],
    });
    
    // Clear form
    setMedicationName('');
    setDosage('');
    setFrequency('');
    setDuration('');
    setIndication('');
    
    alert('Medication prescribed successfully!');
  };
  
  const handleOrderLab = () => {
    if (!labTestName || !labOrderedBy) {
      alert('Please fill in Test Name and Ordered By');
      return;
    }
    
    const newLabOrder = {
      id: `LAB${Date.now()}`,
      patientId: patient.id,
      testName: labTestName,
      priority: labPriority,
      orderedBy: labOrderedBy,
      orderedAt: new Date(),
      status: 'pending' as const,
    };
    
    onSave({
      labOrders: [...(patient.labOrders || []), newLabOrder],
      timeline: [
        ...(patient.timeline || []),
        {
          id: `TL${Date.now()}`,
          timestamp: new Date(),
          type: 'order-placed',
          description: `Lab test ordered: ${labTestName} (${labPriority})`,
          actor: labOrderedBy,
        },
      ],
    });
    
    // Clear form
    setLabTestName('');
    setLabIndication('');
    
    alert('Lab investigation ordered successfully!');
  };
  
  const handleOrderImaging = () => {
    if (!imagingType || !bodyPart || !imagingOrderedBy) {
      alert('Please fill in Imaging Type, Body Part, and Ordered By');
      return;
    }
    
    const newImagingOrder = {
      id: `RAD${Date.now()}`,
      patientId: patient.id,
      examType: imagingType,
      bodyPart,
      priority: imagingPriority,
      clinicalIndication: imagingIndication,
      orderedBy: imagingOrderedBy,
      orderedAt: new Date(),
      status: 'pending' as const,
    };
    
    onSave({
      radiologyOrders: [...(patient.radiologyOrders || []), newImagingOrder],
      timeline: [
        ...(patient.timeline || []),
        {
          id: `TL${Date.now()}`,
          timestamp: new Date(),
          type: 'order-placed',
          description: `Imaging ordered: ${imagingType} - ${bodyPart} (${imagingPriority})`,
          actor: imagingOrderedBy,
        },
      ],
    });
    
    // Clear form
    setImagingType('');
    setBodyPart('');
    setImagingIndication('');
    
    alert('Imaging investigation ordered successfully!');
  };
  
  const latestVitals = patient.vitals && patient.vitals.length > 0 
    ? patient.vitals[patient.vitals.length - 1] 
    : null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Patient Assessment</h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span>{patient.name}</span>
                <span>•</span>
                <span>{patient.age}y {patient.gender}</span>
                <span>•</span>
                <span>{patient.registrationNumber}</span>
              </div>
              <div className="mt-2">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  {patient.triageLevel} - {patient.chiefComplaint}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="flex gap-1 px-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'history', label: 'Medical History', icon: '📋' },
              { id: 'vitals', label: 'Vital Signs', icon: '💓' },
              { id: 'examination', label: 'Physical Exam', icon: '🔍' },
              { id: 'medications', label: 'Prescribe Medication', icon: '💊' },
              { id: 'lab', label: 'Lab Orders', icon: '🧪' },
              { id: 'imaging', label: 'Imaging Orders', icon: '📸' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-semibold text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Latest Vital Signs */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Latest Vital Signs</h3>
                {latestVitals ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-xs text-slate-600 font-semibold">Blood Pressure</div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">{latestVitals.bloodPressure}</div>
                      <div className="text-xs text-slate-500">mmHg</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-xs text-slate-600 font-semibold">Heart Rate</div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">{latestVitals.heartRate}</div>
                      <div className="text-xs text-slate-500">bpm</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-xs text-slate-600 font-semibold">Temperature</div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">{latestVitals.temperature}</div>
                      <div className="text-xs text-slate-500">°C</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-xs text-slate-600 font-semibold">SpO2</div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">{latestVitals.oxygenSaturation}%</div>
                      <div className="text-xs text-slate-500">oxygen</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500">No vital signs recorded yet. Go to Vital Signs tab to record.</p>
                )}
              </div>
              
              {/* Current Status */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Current Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <span className="font-semibold text-slate-900 capitalize">{patient.status.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Assigned Bed:</span>
                      <span className="font-semibold text-slate-900">{patient.assignedBed || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Assigned Doctor:</span>
                      <span className="font-semibold text-slate-900">{patient.assignedDoctor || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Arrival Time:</span>
                      <span className="font-semibold text-slate-900">{formatDateTime(patient.arrivalTime)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Quick Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-600">Chief Complaint:</span>
                      <p className="font-semibold text-slate-900 mt-1">{patient.chiefComplaint}</p>
                    </div>
                    {patient.history && (
                      <div>
                        <span className="text-slate-600">Known Allergies:</span>
                        <p className="font-semibold text-red-700 mt-1">
                          {patient.history.allergies?.join(', ') || 'Not documented'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <strong>Important:</strong> Complete and accurate medical history is essential for patient safety and optimal care.
                </p>
              </div>
              
              {/* Presenting Complaint */}
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Presenting Complaint</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Chief Complaint *
                    </label>
                    <input
                      type="text"
                      value={presentingComplaint}
                      onChange={(e) => setPresentingComplaint(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Chest pain for 2 hours"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      History of Presenting Illness (HOPI) *
                    </label>
                    <textarea
                      value={hopi}
                      onChange={(e) => setHopi(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Use SOCRATES format:&#10;Site: Where is the problem?&#10;Onset: When did it start? Sudden or gradual?&#10;Character: What does it feel like?&#10;Radiation: Does it spread anywhere?&#10;Associations: Any other symptoms?&#10;Time course: Getting better/worse? Constant/intermittent?&#10;Exacerbating/Relieving factors: What makes it better/worse?&#10;Severity: How bad is it? (1-10)"
                    />
                  </div>
                </div>
              </div>
              
              {/* Past Medical History */}
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Past Medical History</h3>
                <p className="text-sm text-slate-600 mb-4">Select all that apply:</p>
                
                <div className="grid md:grid-cols-3 gap-3 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDM}
                      onChange={(e) => setHasDM(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">Diabetes Mellitus</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHTN}
                      onChange={(e) => setHasHTN(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">Hypertension</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasIHD}
                      onChange={(e) => setHasIHD(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">Ischemic Heart Disease</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAsthma}
                      onChange={(e) => setHasAsthma(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">Asthma</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasCOPD}
                      onChange={(e) => setHasCOPD(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">COPD</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasCKD}
                      onChange={(e) => setHasCKD(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">Chronic Kidney Disease</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasStroke}
                      onChange={(e) => setHasStroke(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">Previous Stroke/TIA</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasCancer}
                      onChange={(e) => setHasCancer(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">Cancer</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Other Medical Conditions
                  </label>
                  <textarea
                    value={otherPMHx}
                    onChange={(e) => setOtherPMHx(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="List any other conditions, separated by commas"
                  />
                </div>
              </div>
              
              {/* Past Surgical History */}
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Past Surgical History</h3>
                <textarea
                  value={pshx}
                  onChange={(e) => setPshx(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List previous surgeries with year, separated by commas (e.g., Appendectomy 2015, Cholecystectomy 2020)"
                />
              </div>
              
              {/* Current Medications */}
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Current Medications</h3>
                <textarea
                  value={currentMeds}
                  onChange={(e) => setCurrentMeds(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List all current medications with dosage, separated by commas&#10;(e.g., Metformin 500mg BD, Amlodipine 10mg OD, Aspirin 100mg OD)"
                />
              </div>
              
              {/* Drug Allergies */}
              <div className="bg-red-50 rounded-lg p-6 border-2 border-red-300">
                <h3 className="text-lg font-bold text-red-900 mb-4">🚨 Drug Allergies (CRITICAL)</h3>
                
                <label className="flex items-center gap-3 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAllergies}
                    onChange={(e) => setHasAllergies(e.target.checked)}
                    className="w-5 h-5 text-red-600 rounded"
                  />
                  <span className="text-sm font-bold text-red-900">Patient has known drug allergies</span>
                </label>
                
                {hasAllergies && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-red-900 mb-2">
                        Allergy to which drugs? *
                      </label>
                      <input
                        type="text"
                        value={allergyList}
                        onChange={(e) => setAllergyList(e.target.value)}
                        className="w-full rounded-lg border-2 border-red-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        placeholder="e.g., Penicillin, NSAIDs, Codeine (separate by commas)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-red-900 mb-2">
                        Type of Reaction *
                      </label>
                      <input
                        type="text"
                        value={allergyReaction}
                        onChange={(e) => setAllergyReaction(e.target.value)}
                        className="w-full rounded-lg border-2 border-red-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        placeholder="e.g., Rash, Anaphylaxis, Stevens-Johnson Syndrome"
                      />
                    </div>
                  </div>
                )}
                
                {!hasAllergies && (
                  <p className="text-sm text-red-700 font-medium">No known drug allergies (NKDA)</p>
                )}
              </div>
              
              {/* Social History */}
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Social History</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Smoking Status</label>
                    <select
                      value={smokingStatus}
                      onChange={(e) => setSmokingStatus(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="non-smoker">Non-smoker</option>
                      <option value="ex-smoker">Ex-smoker</option>
                      <option value="current-smoker">Current smoker</option>
                    </select>
                  </div>
                  
                  {smokingStatus === 'current-smoker' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Cigarettes per day</label>
                        <input
                          type="number"
                          value={cigarettesPerDay}
                          onChange={(e) => setCigarettesPerDay(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Years of smoking</label>
                        <input
                          type="number"
                          value={smokingYears}
                          onChange={(e) => setSmokingYears(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                  
                  {smokingStatus === 'ex-smoker' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Quit how many years ago?</label>
                      <input
                        type="number"
                        value={smokingYears}
                        onChange={(e) => setSmokingYears(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Alcohol Consumption</label>
                    <select
                      value={alcoholStatus}
                      onChange={(e) => setAlcoholStatus(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="non-drinker">Non-drinker</option>
                      <option value="social">Social drinker</option>
                      <option value="regular">Regular drinker</option>
                    </select>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Occupation</label>
                      <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Teacher, Retired, Unemployed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Living Arrangement</label>
                      <input
                        type="text"
                        value={livingArrangement}
                        onChange={(e) => setLivingArrangement(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Lives alone, With family, Nursing home"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Family History */}
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Family History</h3>
                <textarea
                  value={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Relevant family medical history (e.g., Father had MI at age 55, Mother has diabetes)"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSaveHistory}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  💾 Save Medical History
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'vitals' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Vital Signs History */}
              {patient.vitals && patient.vitals.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Vital Signs Trend</h3>
                  <div className="space-y-3">
                    {patient.vitals.slice().reverse().map((vital, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatDateTime(vital.recordedAt)}
                          </span>
                          <span className="text-xs text-slate-600">by {vital.recordedBy}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-slate-600">BP:</span>
                            <span className="ml-2 font-semibold">{vital.bloodPressure}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">HR:</span>
                            <span className="ml-2 font-semibold">{vital.heartRate} bpm</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Temp:</span>
                            <span className="ml-2 font-semibold">{vital.temperature}°C</span>
                          </div>
                          <div>
                            <span className="text-slate-600">SpO2:</span>
                            <span className="ml-2 font-semibold">{vital.oxygenSaturation}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Record New Vitals */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-300">
                <h3 className="text-lg font-bold text-blue-900 mb-4">📊 Record New Vital Signs</h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Blood Pressure * (mmHg)
                    </label>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="120/80"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Heart Rate * (bpm)
                    </label>
                    <input
                      type="number"
                      value={hr}
                      onChange={(e) => setHr(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="72"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="36.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Respiratory Rate (breaths/min)
                    </label>
                    <input
                      type="number"
                      value={rr}
                      onChange={(e) => setRr(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="16"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="98"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Pain Score (0-10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={painScore}
                      onChange={(e) => setPainScore(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      GCS
                    </label>
                    <input
                      type="text"
                      value={gcs}
                      onChange={(e) => setGcs(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="15/15"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Recorded By * (Your Name)
                    </label>
                    <input
                      type="text"
                      value={recordedBy}
                      onChange={(e) => setRecordedBy(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nurse/Doctor name"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleSaveVitals}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  💾 Save Vital Signs
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'examination' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Physical Examination:</strong> Document positive and relevant negative findings systematically.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">General Appearance</h3>
                <textarea
                  value={generalAppearance}
                  onChange={(e) => setGeneralAppearance(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Alert, comfortable/in distress, well/unwell appearing, hydration status, pallor, cyanosis, jaundice"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Cardiovascular System</h3>
                  <textarea
                    value={cardiovascular}
                    onChange={(e) => setCardiovascular(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Heart sounds (S1, S2), murmurs, added sounds, JVP, peripheral pulses, peripheral edema"
                  />
                </div>
                
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Respiratory System</h3>
                  <textarea
                    value={respiratory}
                    onChange={(e) => setRespiratory(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Inspection, chest expansion, percussion, breath sounds, added sounds (wheeze, crepitations)"
                  />
                </div>
                
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Abdominal System</h3>
                  <textarea
                    value={abdominal}
                    onChange={(e) => setAbdominal(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Inspection, bowel sounds, palpation (tenderness, guarding, rebound, masses), organomegaly, hernias"
                  />
                </div>
                
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Neurological System</h3>
                  <textarea
                    value={neurological}
                    onChange={(e) => setNeurological(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="GCS, pupils (size, reaction, symmetry), cranial nerves, motor/sensory exam, reflexes, coordination, gait"
                  />
                </div>
                
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Musculoskeletal System</h3>
                  <textarea
                    value={musculoskeletal}
                    onChange={(e) => setMusculoskeletal(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Deformities, swelling, tenderness, range of movement, joint stability, muscle strength"
                  />
                </div>
                
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Skin & Others</h3>
                  <textarea
                    value={skin}
                    onChange={(e) => setSkin(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Rashes, wounds, bruising, lacerations, color, temperature, turgor"
                  />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Examined By * (Doctor's Name)
                </label>
                <input
                  type="text"
                  value={examinedBy}
                  onChange={(e) => setExaminedBy(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dr. [Name]"
                />
              </div>
              
              <button
                onClick={handleSaveExamination}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                💾 Save Physical Examination
              </button>
            </div>
          )}
          
          {activeTab === 'medications' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  <strong>💊 Medication Prescription:</strong> Carefully prescribe medications with proper dosage, route, and frequency. Always check for drug allergies!
                </p>
              </div>
              
              {/* Current Medications List */}
              {patient.pharmacyOrders && patient.pharmacyOrders.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Current Medications ({patient.pharmacyOrders.length})</h3>
                  <div className="space-y-2">
                    {patient.pharmacyOrders.map((med) => (
                      <div key={med.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">{med.medication}</div>
                            <div className="text-sm text-slate-600 mt-1">
                              {med.dosage} {med.route} {med.frequency}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Prescribed by: {med.orderedBy} on {formatDateTime(med.orderedAt)}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            med.status === 'administered' ? 'bg-green-100 text-green-700' :
                            med.status === 'dispensed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {med.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Prescribe New Medication Form */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-300">
                <h3 className="text-lg font-bold text-green-900 mb-4">✍️ Prescribe New Medication</h3>
                
                {/* Allergy Warning */}
                {patient.history?.allergies && patient.history.allergies.length > 0 && !patient.history.allergies.includes('No known drug allergies') && (
                  <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="font-bold text-red-900">⚠️ DRUG ALLERGIES ALERT:</div>
                        <div className="text-sm text-red-800 mt-1">
                          {patient.history.allergies.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Medication Name * (Generic/Brand)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={medicationName}
                        onChange={(e) => setMedicationName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Search medication..."
                        list="medication-options"
                      />
                      <datalist id="medication-options">
                        <option value="Paracetamol (Acetaminophen)" />
                        <option value="Amoxicillin" />
                        <option value="Metformin" />
                        <option value="Ibuprofen" />
                        <option value="Tramadol" />
                        <option value="Morphine" />
                        <option value="Ondansetron" />
                        <option value="Omeprazole" />
                        <option value="Ceftriaxone" />
                        <option value="Normal Saline" />
                        <option value="Dextrose 5%" />
                        <option value="Ringer's Lactate" />
                        <option value="Furosemide" />
                        <option value="Dexamethasone" />
                        <option value="Prednisolone" />
                        <option value="Insulin Regular" />
                        <option value="Insulin NPH" />
                        <option value="Warfarin" />
                        <option value="Aspirin" />
                        <option value="Clopidogrel" />
                        <option value="Atorvastatin" />
                        <option value="Lisinopril" />
                        <option value="Amlodipine" />
                        <option value="Metoprolol" />
                        <option value="Digoxin" />
                        <option value="Nitroglycerin" />
                        <option value="Albuterol" />
                        <option value="Prednisone" />
                        <option value="Lorazepam" />
                        <option value="Diazepam" />
                      </datalist>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Dosage/Strength *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Search dosage..."
                        list="dosage-options"
                      />
                      <datalist id="dosage-options">
                        <option value="250mg" />
                        <option value="500mg" />
                        <option value="1g (1000mg)" />
                        <option value="5mg" />
                        <option value="10mg" />
                        <option value="20mg" />
                        <option value="40mg" />
                        <option value="80mg" />
                        <option value="100mg" />
                        <option value="1 tablet" />
                        <option value="2 tablets" />
                        <option value="1/2 tablet" />
                        <option value="5ml" />
                        <option value="10ml" />
                        <option value="15ml" />
                        <option value="20ml" />
                        <option value="1 ampoule" />
                        <option value="2 ampoules" />
                        <option value="10mg/5ml" />
                        <option value="20mg/5ml" />
                        <option value="50mg/5ml" />
                        <option value="100mg/5ml" />
                        <option value="1 unit" />
                        <option value="2 units" />
                        <option value="5 units" />
                        <option value="10 units" />
                        <option value="1 patch" />
                        <option value="1 vial" />
                        <option value="2 vials" />
                        <option value="1 bottle" />
                      </datalist>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Route of Administration *
                    </label>
                    <select
                      value={route}
                      onChange={(e) => setRoute(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Select Route --</option>
                      <option value="PO">PO (Oral / By Mouth)</option>
                      <option value="IV">IV (Intravenous)</option>
                      <option value="IM">IM (Intramuscular)</option>
                      <option value="SC">SC (Subcutaneous)</option>
                      <option value="SL">SL (Sublingual)</option>
                      <option value="PR">PR (Per Rectum)</option>
                      <option value="Topical">Topical (Applied to skin)</option>
                      <option value="Inhalation">Inhalation (Nebulizer/Inhaler)</option>
                      <option value="Eye drops">Eye Drops</option>
                      <option value="Ear drops">Ear Drops</option>
                      <option value="Nasal">Nasal Drops/Spray</option>
                      <option value="Vaginal">Vaginal</option>
                      <option value="Subcutaneous">Subcutaneous Injection</option>
                      <option value="Intradermal">Intradermal</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Frequency *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Search frequency..."
                        list="frequency-options"
                      />
                      <datalist id="frequency-options">
                        <option value="STAT (Immediately, one time)" />
                        <option value="OD (Once daily)" />
                        <option value="BD (Twice daily)" />
                        <option value="TDS (Three times daily)" />
                        <option value="QID (Four times daily)" />
                        <option value="Q4H (Every 4 hours)" />
                        <option value="Q6H (Every 6 hours)" />
                        <option value="Q8H (Every 8 hours)" />
                        <option value="Q12H (Every 12 hours)" />
                        <option value="ON (At night)" />
                        <option value="OM (In the morning)" />
                        <option value="PRN (As needed)" />
                        <option value="AC (Before meals)" />
                        <option value="PC (After meals)" />
                        <option value="HS (At bedtime)" />
                        <option value="BID (Twice daily)" />
                        <option value="TID (Three times daily)" />
                        <option value="QHS (Every night at bedtime)" />
                        <option value="QAM (Every morning)" />
                        <option value="QPM (Every evening)" />
                        <option value="QOD (Every other day)" />
                        <option value="Weekly" />
                        <option value="Monthly" />
                        <option value="As directed" />
                        <option value="When needed for pain" />
                        <option value="When needed for nausea" />
                        <option value="When needed for anxiety" />
                        <option value="When needed for sleep" />
                        <option value="When needed for fever" />
                        <option value="When needed for cough" />
                        <option value="When needed for constipation" />
                      </datalist>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 7, 14, 30"
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave blank for ongoing medications</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Indication / Reason for Prescribing
                    </label>
                    <input
                      type="text"
                      value={indication}
                      onChange={(e) => setIndication(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Pain relief, Fever, Hypertension, Infection"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Prescribed By * (Your Name)
                    </label>
                    <input
                      type="text"
                      value={prescribedBy}
                      onChange={(e) => setPrescribedBy(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Dr. [Your Name]"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handlePrescribeMedication}
                  className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  💊 Prescribe Medication
                </button>
              </div>
              
              {/* Common Medications Quick Buttons */}
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">🔥 Common Medications (Quick Add)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Paracetamol', dose: '1g', route: 'PO', freq: 'TDS' },
                    { name: 'Ibuprofen', dose: '400mg', route: 'PO', freq: 'TDS' },
                    { name: 'Tramadol', dose: '50mg', route: 'IV', freq: 'QID PRN' },
                    { name: 'Morphine', dose: '5mg', route: 'IV', freq: 'PRN' },
                    { name: 'Ondansetron', dose: '4mg', route: 'IV', freq: 'TDS PRN' },
                    { name: 'Omeprazole', dose: '40mg', route: 'IV', freq: 'OD' },
                    { name: 'Ceftriaxone', dose: '2g', route: 'IV', freq: 'OD' },
                    { name: 'Normal Saline', dose: '500ml', route: 'IV', freq: 'STAT' },
                  ].map((med) => (
                    <button
                      key={med.name}
                      onClick={() => {
                        setMedicationName(med.name);
                        setDosage(med.dose);
                        setRoute(med.route);
                        setFrequency(med.freq);
                      }}
                      className="p-3 bg-slate-100 hover:bg-green-100 rounded-lg border border-slate-300 hover:border-green-400 transition-all text-left"
                    >
                      <div className="font-semibold text-sm">{med.name}</div>
                      <div className="text-xs text-slate-600 mt-1">{med.dose} {med.route} {med.freq}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'lab' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>🧪 Laboratory Investigations:</strong> Order appropriate lab tests with proper clinical indication and urgency.
                </p>
              </div>
              
              {/* Current Lab Orders */}
              {patient.labOrders && patient.labOrders.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Current Lab Orders ({patient.labOrders.length})</h3>
                  <div className="space-y-2">
                    {patient.labOrders.map((lab) => (
                      <div key={lab.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">{lab.testName}</div>
                            <div className="text-sm text-slate-600 mt-1">
                              Priority: <span className="font-semibold">{lab.priority.toUpperCase()}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Ordered by: {lab.orderedBy} on {formatDateTime(lab.orderedAt)}
                            </div>
                            {lab.results && (
                              <div className="text-sm text-green-700 font-semibold mt-2">
                                ✅ Results: {lab.results}
                              </div>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            lab.status === 'completed' ? 'bg-green-100 text-green-700' :
                            lab.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {lab.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Order New Lab Test Form */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-300">
                <h3 className="text-lg font-bold text-blue-900 mb-4">✍️ Order Laboratory Investigation</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Test Name * (Select or Type)
                    </label>
                    <input
                      type="text"
                      value={labTestName}
                      onChange={(e) => setLabTestName(e.target.value)}
                      list="common-labs"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Start typing test name..."
                    />
                    <datalist id="common-labs">
                      <option value="Full Blood Count (FBC)" />
                      <option value="Renal Profile (RFT)" />
                      <option value="Liver Function Test (LFT)" />
                      <option value="Lipid Profile" />
                      <option value="Blood Glucose" />
                      <option value="HbA1c" />
                      <option value="Troponin I" />
                      <option value="CK-MB" />
                      <option value="D-Dimer" />
                      <option value="C-Reactive Protein (CRP)" />
                      <option value="Procalcitonin" />
                      <option value="Blood Culture" />
                      <option value="Urine Culture" />
                      <option value="Urine FEME" />
                      <option value="Coagulation Profile (PT/PTT/INR)" />
                      <option value="Thyroid Function Test" />
                      <option value="Electrolytes" />
                      <option value="Arterial Blood Gas (ABG)" />
                      <option value="Venous Blood Gas (VBG)" />
                      <option value="Lactate" />
                      <option value="Group & Crossmatch (GXM)" />
                    </datalist>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Urgency/Priority *
                    </label>
                    <select
                      value={labPriority}
                      onChange={(e) => setLabPriority(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="stat">STAT (Immediate - within 1 hour)</option>
                      <option value="urgent">URGENT (Within 2-4 hours)</option>
                      <option value="routine">ROUTINE (Within 24 hours)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Clinical Indication / Reason for Test
                    </label>
                    <textarea
                      value={labIndication}
                      onChange={(e) => setLabIndication(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Rule out MI, Assess renal function, Monitor infection markers"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Ordered By * (Your Name)
                    </label>
                    <input
                      type="text"
                      value={labOrderedBy}
                      onChange={(e) => setLabOrderedBy(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Dr. [Your Name]"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleOrderLab}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  🧪 Order Lab Test
                </button>
              </div>
              
              {/* Common Lab Panels */}
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">🔬 Common Lab Panels (Quick Order)</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    { panel: 'Cardiac Panel', tests: ['Troponin I', 'CK-MB', 'FBC', 'RFT', 'Lipid Profile'] },
                    { panel: 'Sepsis Workup', tests: ['FBC', 'CRP', 'Procalcitonin', 'Blood Culture', 'Urine Culture', 'Lactate'] },
                    { panel: 'Trauma Panel', tests: ['FBC', 'Coagulation Profile', 'GXM 2 units', 'RFT'] },
                    { panel: 'DKA Workup', tests: ['Blood Glucose', 'VBG', 'RFT', 'Ketones', 'Urine FEME'] },
                    { panel: 'Stroke Workup', tests: ['FBC', 'Coagulation Profile', 'RFT', 'Lipid Profile', 'HbA1c'] },
                    { panel: 'Basic Workup', tests: ['FBC', 'RFT', 'LFT'] },
                  ].map((panel) => (
                    <button
                      key={panel.panel}
                      onClick={() => {
                        // This would add multiple tests - for simplicity, just set the name
                        setLabTestName(panel.tests.join(', '));
                      }}
                      className="p-4 bg-slate-100 hover:bg-blue-100 rounded-lg border border-slate-300 hover:border-blue-400 transition-all text-left"
                    >
                      <div className="font-semibold text-sm mb-2">{panel.panel}</div>
                      <div className="text-xs text-slate-600">
                        {panel.tests.map((test, idx) => (
                          <div key={idx}>• {test}</div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'imaging' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-900">
                  <strong>📸 Imaging / Radiology:</strong> Order appropriate imaging investigations with clinical indication.
                </p>
              </div>
              
              {/* Current Imaging Orders */}
              {patient.radiologyOrders && patient.radiologyOrders.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Current Imaging Orders ({patient.radiologyOrders.length})</h3>
                  <div className="space-y-2">
                    {patient.radiologyOrders.map((img) => (
                      <div key={img.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">{img.examType} - {img.bodyPart}</div>
                            <div className="text-sm text-slate-600 mt-1">
                              {img.clinicalIndication}
                            </div>
                            <div className="text-sm text-slate-600">
                              Priority: <span className="font-semibold">{img.priority.toUpperCase()}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Ordered by: {img.orderedBy} on {formatDateTime(img.orderedAt)}
                            </div>
                            {img.findings && (
                              <div className="text-sm text-green-700 font-semibold mt-2">
                                ✅ Findings: {img.findings}
                              </div>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            img.status === 'completed' ? 'bg-green-100 text-green-700' :
                            img.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {img.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Order New Imaging Form */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-300">
                <h3 className="text-lg font-bold text-purple-900 mb-4">✍️ Order Imaging Investigation</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Imaging Modality/Type *
                    </label>
                    <select
                      value={imagingType}
                      onChange={(e) => setImagingType(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Select Imaging Type --</option>
                      <option value="X-Ray">X-Ray (Plain Radiograph)</option>
                      <option value="CT Scan">CT Scan (Computed Tomography)</option>
                      <option value="MRI">MRI (Magnetic Resonance Imaging)</option>
                      <option value="Ultrasound">Ultrasound (Sonography)</option>
                      <option value="Fluoroscopy">Fluoroscopy</option>
                      <option value="Angiography">Angiography</option>
                      <option value="Echocardiography">Echocardiography (Echo)</option>
                      <option value="Mammography">Mammography</option>
                      <option value="DEXA Scan">DEXA Scan (Bone Density)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Body Part / Region *
                    </label>
                    <select
                      value={bodyPart}
                      onChange={(e) => setBodyPart(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Select Body Part --</option>
                      <optgroup label="Head & Neck">
                        <option value="Head/Brain">Head / Brain</option>
                        <option value="Cervical Spine">Cervical Spine (C-Spine)</option>
                        <option value="Neck">Neck</option>
                        <option value="Face/Sinuses">Face / Sinuses</option>
                      </optgroup>
                      <optgroup label="Chest">
                        <option value="Chest">Chest (CXR)</option>
                        <option value="Thoracic Spine">Thoracic Spine (T-Spine)</option>
                        <option value="Ribs">Ribs</option>
                      </optgroup>
                      <optgroup label="Abdomen & Pelvis">
                        <option value="Abdomen">Abdomen</option>
                        <option value="Pelvis">Pelvis</option>
                        <option value="Abdomen & Pelvis">Abdomen & Pelvis</option>
                        <option value="Lumbar Spine">Lumbar Spine (L-Spine)</option>
                      </optgroup>
                      <optgroup label="Extremities">
                        <option value="Shoulder">Shoulder</option>
                        <option value="Humerus">Humerus</option>
                        <option value="Elbow">Elbow</option>
                        <option value="Forearm">Forearm</option>
                        <option value="Wrist">Wrist</option>
                        <option value="Hand">Hand</option>
                        <option value="Hip">Hip</option>
                        <option value="Femur">Femur</option>
                        <option value="Knee">Knee</option>
                        <option value="Tibia/Fibula">Tibia / Fibula</option>
                        <option value="Ankle">Ankle</option>
                        <option value="Foot">Foot</option>
                      </optgroup>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Urgency/Priority *
                    </label>
                    <select
                      value={imagingPriority}
                      onChange={(e) => setImagingPriority(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="stat">STAT (Immediate - Emergency)</option>
                      <option value="urgent">URGENT (Within 2-4 hours)</option>
                      <option value="routine">ROUTINE (Within 24-48 hours)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Clinical Indication *
                    </label>
                    <textarea
                      value={imagingIndication}
                      onChange={(e) => setImagingIndication(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Rule out fracture, Assess for pneumonia, Evaluate for intracranial hemorrhage"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Ordered By * (Your Name)
                    </label>
                    <input
                      type="text"
                      value={imagingOrderedBy}
                      onChange={(e) => setImagingOrderedBy(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Dr. [Your Name]"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleOrderImaging}
                  className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  📸 Order Imaging
                </button>
              </div>
              
              {/* Common Imaging Protocols */}
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">🎯 Common Imaging Protocols (Quick Order)</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { protocol: 'Trauma Series', images: ['CT Brain', 'CT C-Spine', 'Chest X-Ray', 'Pelvic X-Ray'] },
                    { protocol: 'Chest Pain Workup', images: ['Chest X-Ray', 'ECG'] },
                    { protocol: 'Acute Abdomen', images: ['Abdominal X-Ray (KUB)', 'Ultrasound Abdomen', 'CT Abdomen & Pelvis'] },
                    { protocol: 'Stroke Protocol', images: ['CT Brain (Non-contrast)', 'CT Angiography Brain'] },
                  ].map((protocol) => (
                    <button
                      key={protocol.protocol}
                      onClick={() => {
                        setImagingType(protocol.images[0].split(' ')[0]);
                        setBodyPart(protocol.images[0].split(' ').slice(1).join(' '));
                      }}
                      className="p-4 bg-slate-100 hover:bg-purple-100 rounded-lg border border-slate-300 hover:border-purple-400 transition-all text-left"
                    >
                      <div className="font-semibold text-sm mb-2">{protocol.protocol}</div>
                      <div className="text-xs text-slate-600">
                        {protocol.images.map((img, idx) => (
                          <div key={idx}>• {img}</div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Last updated: {new Date().toLocaleString('en-MY')}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
