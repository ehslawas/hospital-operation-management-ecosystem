'use client';

import React, { useState } from 'react';
import type { EmergencyPatient, DispositionType, DispositionInfo } from '../types/Patient';

interface DispositionWorkflowProps {
  patient: EmergencyPatient;
  onClose: () => void;
  onSave: (updates: Partial<EmergencyPatient>) => void;
}

export function DispositionWorkflow({ patient, onClose, onSave }: DispositionWorkflowProps) {
  const [dispositionType, setDispositionType] = useState<DispositionType | ''>('');
  const [decidedBy, setDecidedBy] = useState(patient.assignedDoctor || '');
  
  // Admission fields
  const [admittingDept, setAdmittingDept] = useState('');
  const [admittingDoctor, setAdmittingDoctor] = useState('');
  const [destination, setDestination] = useState('');
  
  // Discharge fields
  const [dischargeInstructions, setDischargeInstructions] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [mcDays, setMcDays] = useState('');
  
  // Transfer fields
  const [transferHospital, setTransferHospital] = useState('');
  
  // General
  const [notes, setNotes] = useState('');
  
  const admissionWards = [
    'General Medical Ward 4A',
    'General Medical Ward 4B',
    'General Surgical Ward 5A',
    'General Surgical Ward 5B',
    'Coronary Care Unit (CCU)',
    'Intensive Care Unit (ICU)',
    'High Dependency Unit (HDU)',
    'Orthopaedic Ward',
    'Paediatric Ward',
    'Obs & Gynae Ward',
  ];
  
  const departments = [
    'Internal Medicine',
    'General Surgery',
    'Orthopaedics',
    'Cardiology',
    'Neurology',
    'Paediatrics',
    'Obstetrics & Gynaecology',
    'Psychiatry',
  ];
  
  const handleSave = () => {
    if (!dispositionType || !decidedBy) return;
    
    const disposition: DispositionInfo = {
      type: dispositionType as DispositionType,
      decidedAt: new Date(),
      decidedBy,
      notes,
    };
    
    // Populate fields based on disposition type
    if (dispositionType.startsWith('admit-')) {
      disposition.destination = destination;
      disposition.admittingDepartment = admittingDept;
      disposition.admittingDoctor = admittingDoctor;
    }
    
    if (dispositionType.startsWith('discharge-')) {
      disposition.dischargeInstructions = dischargeInstructions;
      disposition.followUpInstructions = followUpInstructions;
      disposition.prescriptions = prescriptions.split('\n').filter(Boolean);
      disposition.medicalCertificateDays = mcDays ? parseInt(mcDays) : undefined;
    }
    
    if (dispositionType === 'transfer-hospital') {
      disposition.destination = transferHospital;
    }
    
    let newStatus: EmergencyPatient['status'] = patient.status;
    
    if (dispositionType.startsWith('admit-')) {
      newStatus = 'awaiting-admission';
    } else if (dispositionType.startsWith('discharge-')) {
      newStatus = 'discharged';
      disposition.completedAt = new Date();
    } else if (dispositionType === 'transfer-hospital') {
      newStatus = 'transferred';
      disposition.completedAt = new Date();
    } else if (dispositionType === 'lwbs') {
      newStatus = 'left-without-being-seen';
    } else if (dispositionType === 'deceased') {
      newStatus = 'deceased';
    }
    
    onSave({
      disposition,
      status: newStatus,
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Patient Disposition</h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span>{patient.name}</span>
                <span>•</span>
                <span>{patient.registrationNumber}</span>
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
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Disposition Type Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Disposition Decision *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDispositionType('admit-general')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    dispositionType === 'admit-general'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  <div className="font-semibold">🏥 Admit to General Ward</div>
                  <div className="text-xs mt-1 opacity-80">Regular ward admission</div>
                </button>
                
                <button
                  onClick={() => setDispositionType('admit-icu')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    dispositionType === 'admit-icu'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-red-400'
                  }`}
                >
                  <div className="font-semibold">🚨 Admit to ICU</div>
                  <div className="text-xs mt-1 opacity-80">Critical care admission</div>
                </button>
                
                <button
                  onClick={() => setDispositionType('admit-hdu')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    dispositionType === 'admit-hdu'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-orange-400'
                  }`}
                >
                  <div className="font-semibold">⚡ Admit to HDU</div>
                  <div className="text-xs mt-1 opacity-80">High dependency care</div>
                </button>
                
                <button
                  onClick={() => setDispositionType('admit-surgical')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    dispositionType === 'admit-surgical'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-purple-400'
                  }`}
                >
                  <div className="font-semibold">🔪 Admit for Surgery</div>
                  <div className="text-xs mt-1 opacity-80">Surgical ward admission</div>
                </button>
                
                <button
                  onClick={() => setDispositionType('discharge-home')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    dispositionType === 'discharge-home'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-green-400'
                  }`}
                >
                  <div className="font-semibold">🏠 Discharge Home</div>
                  <div className="text-xs mt-1 opacity-80">Well for discharge</div>
                </button>
                
                <button
                  onClick={() => setDispositionType('discharge-ama')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    dispositionType === 'discharge-ama'
                      ? 'bg-yellow-600 text-white border-yellow-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-yellow-400'
                  }`}
                >
                  <div className="font-semibold">⚠️ Discharge AMA</div>
                  <div className="text-xs mt-1 opacity-80">Against medical advice</div>
                </button>
                
                <button
                  onClick={() => setDispositionType('transfer-hospital')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    dispositionType === 'transfer-hospital'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  <div className="font-semibold">🚑 Transfer to Other Hospital</div>
                  <div className="text-xs mt-1 opacity-80">Inter-hospital transfer</div>
                </button>
                
                <button
                  onClick={() => setDispositionType('lwbs')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    dispositionType === 'lwbs'
                      ? 'bg-gray-600 text-white border-gray-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">🚶 Left Without Being Seen</div>
                  <div className="text-xs mt-1 opacity-80">LWBS</div>
                </button>
              </div>
            </div>
            
            {/* Common Fields */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Decided By (Doctor) *
              </label>
              <input
                type="text"
                value={decidedBy}
                onChange={(e) => setDecidedBy(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Doctor's name"
              />
            </div>
            
            {/* Admission-specific fields */}
            {dispositionType && dispositionType.startsWith('admit-') && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-4 border border-blue-200">
                <h3 className="font-bold text-blue-900">Admission Details</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ward / Unit *
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select ward...</option>
                    {admissionWards.map(ward => (
                      <option key={ward} value={ward}>{ward}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Admitting Department *
                  </label>
                  <select
                    value={admittingDept}
                    onChange={(e) => setAdmittingDept(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select department...</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Admitting Doctor / Consultant
                  </label>
                  <input
                    type="text"
                    value={admittingDoctor}
                    onChange={(e) => setAdmittingDoctor(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Consultant's name"
                  />
                </div>
              </div>
            )}
            
            {/* Discharge-specific fields */}
            {dispositionType && dispositionType.startsWith('discharge-') && (
              <div className="bg-green-50 rounded-lg p-4 space-y-4 border border-green-200">
                <h3 className="font-bold text-green-900">Discharge Details</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Discharge Instructions for Patient
                  </label>
                  <textarea
                    value={dischargeInstructions}
                    onChange={(e) => setDischargeInstructions(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Instructions for care at home, warning signs to return, activity restrictions..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Follow-Up Instructions
                  </label>
                  <textarea
                    value={followUpInstructions}
                    onChange={(e) => setFollowUpInstructions(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Follow up with GP/specialist in X days, bring reports, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Discharge Medications / Prescriptions
                  </label>
                  <textarea
                    value={prescriptions}
                    onChange={(e) => setPrescriptions(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="List medications to continue at home (one per line)&#10;e.g., Paracetamol 1g TDS x 3 days"
                  />
                  <p className="text-xs text-slate-500 mt-1">One medication per line</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Medical Certificate (Days)
                  </label>
                  <input
                    type="number"
                    value={mcDays}
                    onChange={(e) => setMcDays(e.target.value)}
                    min="0"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Number of days MC"
                  />
                </div>
              </div>
            )}
            
            {/* Transfer-specific fields */}
            {dispositionType === 'transfer-hospital' && (
              <div className="bg-indigo-50 rounded-lg p-4 space-y-4 border border-indigo-200">
                <h3 className="font-bold text-indigo-900">Transfer Details</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Destination Hospital *
                  </label>
                  <input
                    type="text"
                    value={transferHospital}
                    onChange={(e) => setTransferHospital(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Hospital name"
                  />
                </div>
              </div>
            )}
            
            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Any additional disposition notes..."
              />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {dispositionType ? (
              <span className="font-semibold text-indigo-600">
                Disposition: {dispositionType.replace(/-/g, ' ').toUpperCase()}
              </span>
            ) : (
              'Select a disposition option above'
            )}
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
              disabled={!dispositionType || !decidedBy}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Disposition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

