'use client';

import React, { useState } from 'react';
import type { EmergencyPatient, PatientHistory, PhysicalExamination } from '../types/Patient';

interface ClinicalDocumentationProps {
  patient: EmergencyPatient;
  onClose: () => void;
  onSave: (updates: Partial<EmergencyPatient>) => void;
}

export function ClinicalDocumentation({ patient, onClose, onSave }: ClinicalDocumentationProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'examination' | 'assessment'>('history');
  
  // History
  const [presentingComplaint, setPresentingComplaint] = useState(patient.history?.presentingComplaint || '');
  const [hopi, setHopi] = useState(patient.history?.historyOfPresentingComplaint || '');
  const [pmhx, setPmhx] = useState(patient.history?.pastMedicalHistory?.join(', ') || '');
  const [pshx, setPshx] = useState(patient.history?.pastSurgicalHistory?.join(', ') || '');
  const [medications, setMedications] = useState(patient.history?.medications?.join(', ') || '');
  const [allergies, setAllergies] = useState(patient.history?.allergies?.join(', ') || '');
  const [socialHistory, setSocialHistory] = useState(patient.history?.socialHistory || '');
  const [familyHistory, setFamilyHistory] = useState(patient.history?.familyHistory || '');
  
  // Examination
  const [general, setGeneral] = useState(patient.examination?.general || '');
  const [cvs, setCvs] = useState(patient.examination?.cardiovascular || '');
  const [respiratory, setRespiratory] = useState(patient.examination?.respiratory || '');
  const [abdominal, setAbdominal] = useState(patient.examination?.abdominal || '');
  const [neuro, setNeuro] = useState(patient.examination?.neurological || '');
  const [msk, setMsk] = useState(patient.examination?.musculoskeletal || '');
  const [skin, setSkin] = useState(patient.examination?.skin || '');
  const [other, setOther] = useState(patient.examination?.other || '');
  const [examiner, setExaminer] = useState(patient.examination?.examinedBy || '');
  
  // Assessment & Plan
  const [assessmentNotes, setAssessmentNotes] = useState(patient.assessmentNotes || '');
  const [differentialDx, setDifferentialDx] = useState(patient.differentialDiagnosis?.join('\n') || '');
  const [finalDx, setFinalDx] = useState(patient.finalDiagnosis || '');
  const [treatmentPlan, setTreatmentPlan] = useState(patient.treatmentPlan || '');
  
  const handleSave = () => {
    const history: PatientHistory = {
      presentingComplaint,
      historyOfPresentingComplaint: hopi,
      pastMedicalHistory: pmhx.split(',').map(s => s.trim()).filter(Boolean),
      pastSurgicalHistory: pshx.split(',').map(s => s.trim()).filter(Boolean),
      medications: medications.split(',').map(s => s.trim()).filter(Boolean),
      allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
      socialHistory,
      familyHistory,
    };
    
    const examination: PhysicalExamination = {
      general,
      cardiovascular: cvs,
      respiratory,
      abdominal,
      neurological: neuro,
      musculoskeletal: msk,
      skin,
      other,
      examinedBy: examiner,
      examinedAt: new Date(),
    };
    
    const updates: Partial<EmergencyPatient> = {
      history,
      examination,
      assessmentNotes,
      differentialDiagnosis: differentialDx.split('\n').map(s => s.trim()).filter(Boolean),
      finalDiagnosis: finalDx,
      treatmentPlan,
      status: patient.status === 'waiting' || patient.status === 'triaged' ? 'in-assessment' : patient.status,
    };
    
    onSave(updates);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Clinical Documentation</h2>
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
          <div className="flex gap-1 px-6">
            {[
              { id: 'history', label: 'History Taking', icon: '📋' },
              { id: 'examination', label: 'Physical Examination', icon: '🔍' },
              { id: 'assessment', label: 'Assessment & Plan', icon: '💊' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-semibold text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600'
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
          {activeTab === 'history' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Presenting Complaint</label>
                <input
                  type="text"
                  value={presentingComplaint}
                  onChange={(e) => setPresentingComplaint(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Chief complaint in patient's words"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  History of Presenting Complaint (HOPI)
                </label>
                <textarea
                  value={hopi}
                  onChange={(e) => setHopi(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Detailed history: Onset, Duration, Severity, Character, Radiation, Aggravating/Relieving factors, Associated symptoms..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Include: SOCRATES (Site, Onset, Character, Radiation, Associations, Time course, Exacerbating/relieving factors, Severity)
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Past Medical History</label>
                  <textarea
                    value={pmhx}
                    onChange={(e) => setPmhx(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Diabetes, Hypertension, Asthma, etc. (comma separated)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Past Surgical History</label>
                  <textarea
                    value={pshx}
                    onChange={(e) => setPshx(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Previous surgeries (comma separated)"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Current Medications
                  </label>
                  <textarea
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Regular medications (comma separated)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    🚨 Allergies
                  </label>
                  <textarea
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-red-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                    placeholder="Drug allergies and reactions (comma separated)"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Social History</label>
                <textarea
                  value={socialHistory}
                  onChange={(e) => setSocialHistory(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Smoking, alcohol, occupation, living situation..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Family History</label>
                <textarea
                  value={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Relevant family medical history..."
                />
              </div>
            </div>
          )}
          
          {activeTab === 'examination' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Documentation Tip:</strong> Be systematic and thorough. Document both positive and relevant negative findings.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  General Appearance & Vital Signs Summary
                </label>
                <textarea
                  value={general}
                  onChange={(e) => setGeneral(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Alert, comfortable/distressed, well/unwell appearing, hydration status, pallor, cyanosis..."
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Cardiovascular System
                  </label>
                  <textarea
                    value={cvs}
                    onChange={(e) => setCvs(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Heart sounds, murmurs, JVP, peripheral pulses, edema..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Respiratory System
                  </label>
                  <textarea
                    value={respiratory}
                    onChange={(e) => setRespiratory(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Inspection, palpation, percussion, auscultation findings..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Abdominal System
                  </label>
                  <textarea
                    value={abdominal}
                    onChange={(e) => setAbdominal(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Inspection, bowel sounds, palpation (tenderness, guarding, masses), organomegaly..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Neurological System
                  </label>
                  <textarea
                    value={neuro}
                    onChange={(e) => setNeuro(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="GCS, pupils, cranial nerves, motor/sensory exam, reflexes, coordination..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Musculoskeletal System
                  </label>
                  <textarea
                    value={msk}
                    onChange={(e) => setMsk(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Deformities, swelling, tenderness, range of movement, stability..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Skin & Others
                  </label>
                  <textarea
                    value={skin}
                    onChange={(e) => setSkin(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Rashes, wounds, bruising, color, temperature..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Additional Findings
                </label>
                <textarea
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Any other relevant examination findings..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Examined By
                </label>
                <input
                  type="text"
                  value={examiner}
                  onChange={(e) => setExaminer(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Doctor's name"
                />
              </div>
            </div>
          )}
          
          {activeTab === 'assessment' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Clinical Assessment Summary
                </label>
                <textarea
                  value={assessmentNotes}
                  onChange={(e) => setAssessmentNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Synthesis of history, examination, and investigations..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Differential Diagnosis (DD)
                </label>
                <textarea
                  value={differentialDx}
                  onChange={(e) => setDifferentialDx(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="List differential diagnoses, one per line, in order of likelihood..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter one diagnosis per line
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Final / Working Diagnosis
                </label>
                <input
                  type="text"
                  value={finalDx}
                  onChange={(e) => setFinalDx(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Most likely diagnosis based on current assessment"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Management / Treatment Plan
                </label>
                <textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Detailed treatment plan including investigations, medications, procedures, consultations, disposition..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Include: Investigations needed, medications, procedures, consultations, disposition (admit/discharge), follow-up
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Last updated: {new Date().toLocaleString('en-MY')}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Save Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

