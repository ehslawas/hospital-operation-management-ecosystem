'use client';

import React, { useState } from 'react';
import type { EmergencyPatient } from '../types/Patient';

interface TriageBoardProps {
  patients: EmergencyPatient[];
  onPatientClick: (patient: EmergencyPatient) => void;
}

const triageColors = {
  P1: 'bg-red-100 border-red-500 text-red-900',
  P2: 'bg-orange-100 border-orange-500 text-orange-900',
  P3: 'bg-yellow-100 border-yellow-500 text-yellow-900',
  P4: 'bg-green-100 border-green-500 text-green-900',
  P5: 'bg-blue-100 border-blue-500 text-blue-900',
};

const triageLabels = {
  P1: 'Immediate',
  P2: 'Urgent',
  P3: 'Semi-Urgent',
  P4: 'Non-Urgent',
  P5: 'Non-Emergency',
};

const statusColors = {
  'waiting': 'bg-slate-100 text-slate-700',
  'in-assessment': 'bg-blue-100 text-blue-700',
  'in-treatment': 'bg-purple-100 text-purple-700',
  'admitted': 'bg-green-100 text-green-700',
  'discharged': 'bg-gray-100 text-gray-700',
  'transferred': 'bg-indigo-100 text-indigo-700',
};

export function TriageBoard({ patients, onPatientClick }: TriageBoardProps) {
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active'>('all');
  
  const filteredPatients = patients.filter(p => {
    if (filter === 'waiting') return p.status === 'waiting';
    if (filter === 'active') return p.status === 'in-assessment' || p.status === 'in-treatment';
    return p.status !== 'discharged' && p.status !== 'transferred';
  }).sort((a, b) => {
    // Sort by triage level first
    const levelOrder = { P1: 0, P2: 1, P3: 2, P4: 3, P5: 4 };
    if (levelOrder[a.triageLevel] !== levelOrder[b.triageLevel]) {
      return levelOrder[a.triageLevel] - levelOrder[b.triageLevel];
    }
    // Then by arrival time
    return a.arrivalTime.getTime() - b.arrivalTime.getTime();
  });
  
  const getWaitTime = (patient: EmergencyPatient) => {
    const now = new Date();
    const diff = now.getTime() - patient.arrivalTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Triage Board</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({patients.filter(p => p.status !== 'discharged' && p.status !== 'transferred').length})
            </button>
            <button
              onClick={() => setFilter('waiting')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'waiting'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Waiting ({patients.filter(p => p.status === 'waiting').length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'active'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Active ({patients.filter(p => p.status === 'in-assessment' || p.status === 'in-treatment').length})
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-semibold">No patients in queue</p>
            </div>
          ) : (
            filteredPatients.map(patient => (
              <div
                key={patient.id}
                onClick={() => onPatientClick(patient)}
                className="border-l-4 bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border border-slate-200/60"
                style={{ borderLeftColor: triageColors[patient.triageLevel].split(' ')[1].replace('border-', '') }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${triageColors[patient.triageLevel]}`}>
                        {patient.triageLevel} - {triageLabels[patient.triageLevel]}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[patient.status]}`}>
                        {patient.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{patient.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {patient.age}y • {patient.gender} • {patient.registrationNumber}
                    </p>
                    <p className="text-sm text-slate-800 font-semibold mt-2">{patient.chiefComplaint}</p>
                    {patient.assignedBed && (
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-semibold">Bed:</span> {patient.assignedBed}
                        {patient.assignedDoctor && <span className="ml-3"><span className="font-semibold">Doctor:</span> {patient.assignedDoctor}</span>}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{getWaitTime(patient)}</div>
                    <div className="text-xs text-slate-500">wait time</div>
                  </div>
                </div>
                
                {/* Quick indicators */}
                <div className="flex gap-2 mt-3">
                  {patient.labOrders.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a1 1 0 00-1 1v1H3a1 1 0 000 2h1v1a1 1 0 001 1h1a1 1 0 001-1V6h1a1 1 0 100-2H6V3a1 1 0 00-1-1zM4 9a1 1 0 011-1h10a1 1 0 011 1v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" />
                      </svg>
                      {patient.labOrders.length} Lab
                    </span>
                  )}
                  {patient.radiologyOrders.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      {patient.radiologyOrders.length} Imaging
                    </span>
                  )}
                  {patient.pharmacyOrders.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                      </svg>
                      {patient.pharmacyOrders.length} Meds
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}










