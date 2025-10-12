'use client';

import React, { useState } from 'react';
import type { WardPatient } from '../types/Ward';

interface PatientCareModalProps {
  patient: WardPatient;
  onClose: () => void;
}

export function PatientCareModal({ patient, onClose }: PatientCareModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'medications' | 'notes'>('overview');
  
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-MY', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{patient.name}</h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span>{patient.age}y • {patient.gender} • IC: {patient.icNumber}</span>
                <span>{patient.registrationNumber}</span>
              </div>
              <div className="flex gap-3 mt-2">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  Bed: {patient.bedNumber}
                </span>
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  {patient.status.replace('-', ' ').toUpperCase()}
                </span>
                {patient.isolationPrecautions !== 'none' && (
                  <span className="inline-block px-3 py-1 bg-orange-500 rounded-full text-sm font-bold">
                    ⚠️ {patient.isolationPrecautions.toUpperCase()}
                  </span>
                )}
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
              { id: 'overview', label: 'Overview' },
              { id: 'vitals', label: `Vitals (${patient.vitals.length})` },
              { id: 'medications', label: `Medications (${patient.medications.length})` },
              { id: 'notes', label: `Nursing Notes (${patient.nursingNotes.length})` },
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
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Admission Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Admitted:</span>
                      <span className="font-semibold text-slate-900">{formatDateTime(patient.admissionDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Type:</span>
                      <span className="font-semibold text-slate-900">{patient.admissionType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Code Status:</span>
                      <span className="font-semibold text-slate-900">{patient.codeStatus}</span>
                    </div>
                    {patient.estimatedDischargeDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Est. Discharge:</span>
                        <span className="font-semibold text-green-700">{new Date(patient.estimatedDischargeDate).toLocaleDateString('en-MY')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Care Team</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Attending:</span>
                      <span className="font-semibold text-slate-900">{patient.attendingPhysician}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Nurse:</span>
                      <span className="font-semibold text-slate-900">{patient.assignedNurse}</span>
                    </div>
                    {patient.consultingSpecialists.length > 0 && (
                      <div>
                        <div className="text-slate-600 mb-1">Consulting:</div>
                        {patient.consultingSpecialists.map((s, i) => (
                          <div key={i} className="font-semibold text-slate-900">{s}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Diagnosis</h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="font-semibold text-slate-900 mb-2">Primary: {patient.primaryDiagnosis}</div>
                  {patient.secondaryDiagnoses.length > 0 && (
                    <div className="text-sm text-slate-700">
                      <div className="font-semibold mb-1">Secondary:</div>
                      <ul className="list-disc list-inside">
                        {patient.secondaryDiagnoses.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              {patient.allergies.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Allergies</h3>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold border border-red-300">
                        🚫 {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Diet Order</h3>
                  <p className="text-slate-700">{patient.dietOrder}</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Activity Order</h3>
                  <p className="text-slate-700">{patient.activityOrder}</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'vitals' && (
            <div className="space-y-4">
              {patient.vitals.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No vitals recorded</div>
              ) : (
                patient.vitals.map(vital => (
                  <div key={vital.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-bold text-slate-900">{formatDateTime(vital.recordedAt)}</div>
                        <div className="text-xs text-slate-500">By {vital.recordedBy}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        vital.consciousnessLevel === 'Alert' ? 'bg-green-100 text-green-700' :
                        vital.consciousnessLevel === 'Verbal' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {vital.consciousnessLevel}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-slate-600">Blood Pressure</div>
                        <div className="text-xl font-bold text-slate-900">{vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600">Heart Rate</div>
                        <div className="text-xl font-bold text-slate-900">{vital.heartRate} bpm</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600">Temperature</div>
                        <div className="text-xl font-bold text-slate-900">{vital.temperature}°C</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600">SpO₂</div>
                        <div className="text-xl font-bold text-slate-900">{vital.oxygenSaturation}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600">Resp Rate</div>
                        <div className="text-xl font-bold text-slate-900">{vital.respiratoryRate}/min</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600">Pain Score</div>
                        <div className="text-xl font-bold text-slate-900">{vital.painScore}/10</div>
                      </div>
                      {vital.supplementalO2 && (
                        <div className="col-span-2">
                          <div className="text-sm text-slate-600">Oxygen</div>
                          <div className="text-sm font-semibold text-slate-900">{vital.supplementalO2}</div>
                        </div>
                      )}
                    </div>
                    
                    {vital.notes && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="text-xs text-slate-600 italic">{vital.notes}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'medications' && (
            <div className="space-y-4">
              {patient.medications.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No medications ordered</div>
              ) : (
                patient.medications.map(med => (
                  <div key={med.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-bold text-lg text-slate-900">{med.medicationName}</div>
                        <div className="text-sm text-slate-600 mt-1">
                          {med.dosage} {med.route} {med.frequency}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Indication: {med.indication} • Ordered by {med.orderedBy}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {med.isPRN && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">PRN</span>
                        )}
                        {med.isHighAlert && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">⚠️ HIGH ALERT</span>
                        )}
                      </div>
                    </div>
                    
                    {med.administrations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="text-xs font-semibold text-slate-700 mb-2">Administration Record:</div>
                        <div className="space-y-2">
                          {med.administrations.map(admin => (
                            <div key={admin.id} className="flex items-center justify-between text-xs bg-green-50 p-2 rounded">
                              <div>
                                <span className="font-semibold">{formatTime(admin.scheduledTime)}</span>
                                {admin.administeredAt && (
                                  <span className="ml-2 text-green-700">✓ Given by {admin.administeredBy}</span>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded font-semibold ${
                                admin.status === 'given' ? 'bg-green-200 text-green-800' :
                                admin.status === 'held' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-red-200 text-red-800'
                              }`}>
                                {admin.status.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {patient.nursingNotes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No nursing notes</div>
              ) : (
                patient.nursingNotes.map(note => (
                  <div key={note.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-slate-900">{formatDateTime(note.createdAt)}</div>
                        <div className="text-xs text-slate-500">By {note.createdBy} • {note.shift} shift</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        note.category === 'assessment' ? 'bg-blue-100 text-blue-700' :
                        note.category === 'intervention' ? 'bg-purple-100 text-purple-700' :
                        note.category === 'incident' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {note.category.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-slate-700 mt-2">{note.note}</div>
                    
                    {(note.subjective || note.objective || note.assessment || note.plan) && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs">
                        {note.subjective && (
                          <div>
                            <span className="font-semibold text-blue-700">S:</span> {note.subjective}
                          </div>
                        )}
                        {note.objective && (
                          <div>
                            <span className="font-semibold text-green-700">O:</span> {note.objective}
                          </div>
                        )}
                        {note.assessment && (
                          <div>
                            <span className="font-semibold text-purple-700">A:</span> {note.assessment}
                          </div>
                        )}
                        {note.plan && (
                          <div>
                            <span className="font-semibold text-orange-700">P:</span> {note.plan}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}







