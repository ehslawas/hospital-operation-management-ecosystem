'use client';

import React, { useState } from 'react';
import type { WardPatient } from '../types/Ward';

interface WardCensusBoardProps {
  patients: WardPatient[];
  onPatientClick: (patient: WardPatient) => void;
}

const statusColors = {
  admitted: 'bg-blue-100 text-blue-800 border-blue-300',
  stable: 'bg-green-100 text-green-800 border-green-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
  observation: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'pending-discharge': 'bg-purple-100 text-purple-800 border-purple-300',
  discharged: 'bg-gray-100 text-gray-800 border-gray-300',
};

const isolationColors = {
  none: '',
  contact: 'bg-yellow-50 border-yellow-300',
  droplet: 'bg-blue-50 border-blue-300',
  airborne: 'bg-red-50 border-red-300',
  'contact-droplet': 'bg-orange-50 border-orange-300',
};

export function WardCensusBoard({ patients, onPatientClick }: WardCensusBoardProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'isolation'>('all');
  
  const filteredPatients = patients.filter(p => {
    if (filter === 'critical') return p.status === 'critical';
    if (filter === 'isolation') return p.isolationPrecautions !== 'none';
    return p.status !== 'discharged';
  }).sort((a, b) => {
    // Priority: critical > observation > stable
    const statusOrder = { critical: 0, observation: 1, admitted: 2, stable: 3, 'pending-discharge': 4, discharged: 5 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
  
  const getLengthOfStay = (admissionDate: Date) => {
    const now = new Date();
    const diff = now.getTime() - admissionDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Ward Census</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({patients.filter(p => p.status !== 'discharged').length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'critical'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Critical ({patients.filter(p => p.status === 'critical').length})
            </button>
            <button
              onClick={() => setFilter('isolation')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'isolation'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Isolation ({patients.filter(p => p.isolationPrecautions !== 'none').length})
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg font-semibold">No patients</p>
            </div>
          ) : (
            filteredPatients.map(patient => (
              <div
                key={patient.id}
                onClick={() => onPatientClick(patient)}
                className={`border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-r from-white to-slate-50 ${
                  patient.isolationPrecautions !== 'none' ? isolationColors[patient.isolationPrecautions] : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[patient.status]}`}>
                        {patient.status.replace('-', ' ').toUpperCase()}
                      </span>
                      {patient.isolationPrecautions !== 'none' && (
                        <span className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-bold">
                          ⚠️ {patient.isolationPrecautions.toUpperCase()} PRECAUTIONS
                        </span>
                      )}
                      {patient.codeStatus !== 'Full Code' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold border border-purple-300">
                          {patient.codeStatus}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900">{patient.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {patient.age}y • {patient.gender} • {patient.registrationNumber}
                    </p>
                    <p className="text-sm text-slate-700 font-semibold mt-2">
                      Bed: {patient.bedNumber} ({patient.wardRoom})
                    </p>
                    <p className="text-sm text-slate-800 font-semibold mt-1">
                      {patient.primaryDiagnosis}
                    </p>
                    
                    {patient.vitals.length > 0 && (
                      <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-xs text-slate-600 mb-1">Latest Vitals</div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <div className="text-slate-600">BP</div>
                            <div className="font-bold text-slate-900">{patient.vitals[0].bloodPressureSystolic}/{patient.vitals[0].bloodPressureDiastolic}</div>
                          </div>
                          <div>
                            <div className="text-slate-600">HR</div>
                            <div className="font-bold text-slate-900">{patient.vitals[0].heartRate}</div>
                          </div>
                          <div>
                            <div className="text-slate-600">Temp</div>
                            <div className="font-bold text-slate-900">{patient.vitals[0].temperature}°C</div>
                          </div>
                          <div>
                            <div className="text-slate-600">SpO2</div>
                            <div className="font-bold text-slate-900">{patient.vitals[0].oxygenSaturation}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 flex gap-2 text-xs text-slate-600">
                      <span>Dr. {patient.attendingPhysician}</span>
                      <span>• {patient.assignedNurse}</span>
                    </div>
                    
                    {patient.allergies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {patient.allergies.map((allergy, idx) => (
                          <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                            🚫 {allergy}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-blue-900">{getLengthOfStay(patient.admissionDate)}</div>
                    <div className="text-xs text-slate-500">length of stay</div>
                    {patient.estimatedDischargeDate && patient.status !== 'discharged' && (
                      <div className="mt-2 text-xs text-green-700 font-semibold">
                        Est. D/C: {new Date(patient.estimatedDischargeDate).toLocaleDateString('en-MY', { day: '2-digit', month: 'short' })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}








