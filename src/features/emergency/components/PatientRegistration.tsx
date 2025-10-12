'use client';

import React, { useState } from 'react';
import type { EmergencyPatient, ArrivalMode, TriageLevel, Gender } from '../types/Patient';

interface PatientRegistrationProps {
  onClose: () => void;
  onRegister: (patient: Partial<EmergencyPatient>) => void;
}

export function PatientRegistration({ onClose, onRegister }: PatientRegistrationProps) {
  const [step, setStep] = useState<'demographics' | 'arrival' | 'triage'>('demographics');
  const [arrivalMode, setArrivalMode] = useState<ArrivalMode>('walk-in');
  
  // Demographics
  const [name, setName] = useState('');
  const [icNumber, setIcNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [nextOfKin, setNextOfKin] = useState('');
  const [nextOfKinContact, setNextOfKinContact] = useState('');
  
  // Ambulance info
  const [ambulanceId, setAmbulanceId] = useState('');
  const [paramedic, setParamedic] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [preHospitalTreatment, setPreHospitalTreatment] = useState('');
  const [estimatedInjuries, setEstimatedInjuries] = useState('');
  
  // Triage
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [triageLevel, setTriageLevel] = useState<TriageLevel>('P3');
  const [triageNotes, setTriageNotes] = useState('');
  const [triageNurse, setTriageNurse] = useState('');
  
  // Vitals
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');
  const [rr, setRr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [painScore, setPainScore] = useState('0');
  const [gcs, setGcs] = useState('15/15');
  
  // Trauma
  const [traumaActivated, setTraumaActivated] = useState(false);
  const [traumaLevel, setTraumaLevel] = useState<'none' | 'yellow' | 'red' | 'black-tag'>('none');
  const [traumaMechanism, setTraumaMechanism] = useState('');
  
  const handleSubmit = () => {
    const registrationNumber = `ER${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const now = new Date();
    
    const patient: Partial<EmergencyPatient> = {
      id: `EP${Date.now()}`,
      registrationNumber,
      name,
      icNumber,
      age: parseInt(age),
      gender,
      contactNumber,
      address,
      nextOfKin,
      nextOfKinContact,
      arrivalMode,
      arrivalTime: now,
      chiefComplaint,
      triageLevel,
      triageTime: now,
      triageNurse,
      triageNotes,
      status: 'triaged',
      vitals: bp && hr ? [{
        bloodPressure: bp,
        heartRate: parseInt(hr),
        temperature: parseFloat(temp) || 36.5,
        respiratoryRate: parseInt(rr) || 16,
        oxygenSaturation: parseInt(spo2) || 98,
        painScore: parseInt(painScore),
        gcs,
        recordedAt: now,
        recordedBy: triageNurse,
      }] : [],
      trauma: {
        activated: traumaActivated,
        level: traumaActivated ? traumaLevel : 'none',
        mechanism: traumaActivated ? traumaMechanism : 'N/A',
        activatedAt: traumaActivated ? now : undefined,
        activatedBy: traumaActivated ? triageNurse : undefined,
      },
      labOrders: [],
      radiologyOrders: [],
      pharmacyOrders: [],
      timeline: [
        {
          id: 'TL1',
          timestamp: now,
          type: 'arrival',
          description: `Arrived via ${arrivalMode}`,
          actor: triageNurse || 'Registration',
        },
        {
          id: 'TL2',
          timestamp: now,
          type: 'triage',
          description: `Triaged as ${triageLevel}`,
          actor: triageNurse || 'Triage Nurse',
        },
      ],
    };
    
    if (arrivalMode === 'ambulance' && ambulanceId) {
      patient.ambulanceInfo = {
        callTime: now,
        arrivalTime: now,
        ambulanceId,
        paramedic,
        mechanism,
        preHospitalTreatment,
        estimatedInjuries,
      };
    }
    
    onRegister(patient);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Patient Registration</h2>
              <p className="text-blue-100 mt-1">Register new patient to Emergency Department</p>
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
        
        {/* Step Indicator */}
        <div className="bg-slate-50 px-6 py-4 border-b">
          <div className="flex items-center justify-center gap-4">
            {[
              { id: 'demographics', label: 'Demographics', icon: '👤' },
              { id: 'arrival', label: 'Arrival Info', icon: '🚑' },
              { id: 'triage', label: 'Triage', icon: '🏥' },
            ].map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    step === s.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {s.icon}
                  </div>
                  <span className={`font-semibold ${step === s.id ? 'text-blue-600' : 'text-slate-600'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && <div className="flex-1 h-1 bg-slate-200 max-w-[60px]" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'demographics' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Patient Demographics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter patient full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">IC Number *</label>
                  <input
                    type="text"
                    value={icNumber}
                    onChange={(e) => setIcNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="XXXXXX-XX-XXXX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Age *</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Age"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number *</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="01X-XXXXXXX"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Patient address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Next of Kin</label>
                  <input
                    type="text"
                    value={nextOfKin}
                    onChange={(e) => setNextOfKin(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name & relationship"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Next of Kin Contact</label>
                  <input
                    type="text"
                    value={nextOfKinContact}
                    onChange={(e) => setNextOfKinContact(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contact number"
                  />
                </div>
              </div>
            </div>
          )}
          
          {step === 'arrival' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Arrival Information</h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Arrival Mode *</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(['walk-in', 'ambulance', 'police', 'referral', 'helicopter'] as ArrivalMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setArrivalMode(mode)}
                      className={`px-4 py-3 rounded-lg font-semibold text-sm border-2 transition-all ${
                        arrivalMode === mode
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {mode === 'walk-in' && '🚶'} {mode === 'ambulance' && '🚑'} {mode === 'police' && '🚓'}
                      {mode === 'referral' && '📄'} {mode === 'helicopter' && '🚁'}
                      <br />
                      <span className="text-xs">{mode.replace('-', ' ').toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {arrivalMode === 'ambulance' && (
                <div className="bg-blue-50 rounded-xl p-4 space-y-4 border border-blue-200">
                  <h4 className="font-bold text-blue-900">Ambulance Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Ambulance ID</label>
                      <input
                        type="text"
                        value={ambulanceId}
                        onChange={(e) => setAmbulanceId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="AMB-XXX"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Paramedic Name</label>
                      <input
                        type="text"
                        value={paramedic}
                        onChange={(e) => setParamedic(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Paramedic name"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Mechanism of Injury</label>
                      <input
                        type="text"
                        value={mechanism}
                        onChange={(e) => setMechanism(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., MVA, Fall from height, Assault"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Pre-Hospital Treatment</label>
                      <textarea
                        value={preHospitalTreatment}
                        onChange={(e) => setPreHospitalTreatment(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Treatment given by paramedics"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated Injuries</label>
                      <textarea
                        value={estimatedInjuries}
                        onChange={(e) => setEstimatedInjuries(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Suspected injuries"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {step === 'triage' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Triage Assessment</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Chief Complaint *</label>
                  <textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Main reason for visit"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Triage Level *</label>
                  <select
                    value={triageLevel}
                    onChange={(e) => setTriageLevel(e.target.value as TriageLevel)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="P1">P1 - Immediate (Red)</option>
                    <option value="P2">P2 - Urgent (Orange)</option>
                    <option value="P3">P3 - Semi-Urgent (Yellow)</option>
                    <option value="P4">P4 - Non-Urgent (Green)</option>
                    <option value="P5">P5 - Non-Emergency (Blue)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Triage Nurse *</label>
                  <input
                    type="text"
                    value={triageNurse}
                    onChange={(e) => setTriageNurse(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nurse name"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Triage Notes</label>
                  <textarea
                    value={triageNotes}
                    onChange={(e) => setTriageNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional triage observations"
                  />
                </div>
              </div>
              
              {/* Vital Signs */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-3">Vital Signs</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">BP (mmHg)</label>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="120/80"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">HR (bpm)</label>
                    <input
                      type="number"
                      value={hr}
                      onChange={(e) => setHr(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="72"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="36.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">RR (breaths/min)</label>
                    <input
                      type="number"
                      value={rr}
                      onChange={(e) => setRr(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="16"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="98"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Pain (0-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={painScore}
                      onChange={(e) => setPainScore(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">GCS</label>
                    <input
                      type="text"
                      value={gcs}
                      onChange={(e) => setGcs(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="15/15"
                    />
                  </div>
                </div>
              </div>
              
              {/* Trauma Activation */}
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={traumaActivated}
                    onChange={(e) => setTraumaActivated(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <h4 className="font-bold text-red-900">Trauma Activation</h4>
                </div>
                
                {traumaActivated && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Trauma Level</label>
                      <select
                        value={traumaLevel}
                        onChange={(e) => setTraumaLevel(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="yellow">Yellow - Moderate Trauma</option>
                        <option value="red">Red - Major Trauma</option>
                        <option value="black-tag">Black Tag - Mass Casualty</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Trauma Mechanism</label>
                      <input
                        type="text"
                        value={traumaMechanism}
                        onChange={(e) => setTraumaMechanism(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="e.g., High-speed MVA, Fall from 3rd floor"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
          <div>
            {step !== 'demographics' && (
              <button
                onClick={() => {
                  if (step === 'arrival') setStep('demographics');
                  if (step === 'triage') setStep('arrival');
                }}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
              >
                Back
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            
            {step !== 'triage' ? (
              <button
                onClick={() => {
                  if (step === 'demographics') setStep('arrival');
                  if (step === 'arrival') setStep('triage');
                }}
                disabled={!name || !icNumber || !age || !contactNumber}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!chiefComplaint || !triageNurse}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Register Patient
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

