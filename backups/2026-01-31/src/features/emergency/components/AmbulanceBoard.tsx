'use client';

import React from 'react';
import type { IncomingPatient } from '../types/Patient';

interface AmbulanceBoardProps {
  incomingPatients: IncomingPatient[];
}

const triageColors = {
  P1: 'bg-red-500 text-white',
  P2: 'bg-orange-500 text-white',
  P3: 'bg-yellow-500 text-slate-900',
  P4: 'bg-green-500 text-white',
  P5: 'bg-blue-500 text-white',
};

export function AmbulanceBoard({ incomingPatients }: AmbulanceBoardProps) {
  const getETA = (eta: Date) => {
    const now = new Date();
    const diff = eta.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 0) return 'ARRIVED';
    if (minutes === 0) return 'ARRIVING NOW';
    return `${minutes} min`;
  };
  
  const getETAColor = (eta: Date) => {
    const now = new Date();
    const diff = eta.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 0) return 'text-green-600';
    if (minutes <= 5) return 'text-red-600 animate-pulse';
    if (minutes <= 10) return 'text-orange-600';
    return 'text-blue-600';
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 2.01C18.72 1.42 18.16 1 17.5 1h-11c-.66 0-1.21.42-1.42 1.01L3 8v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1V8l-2.08-5.99zM6.5 12c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 7l1.5-4.5h11L19 7H5z"/>
            </svg>
            <div>
              <h2 className="text-xl font-bold">Incoming Ambulances</h2>
              <p className="text-xs text-red-100">Real-time ETA tracking</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{incomingPatients.length}</div>
            <div className="text-xs text-red-100">En Route</div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {incomingPatients.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold">No incoming ambulances</p>
            <p className="text-sm">All clear at the moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incomingPatients.map(patient => (
              <div
                key={patient.id}
                className="border-l-4 bg-gradient-to-r from-slate-50 to-white rounded-lg p-4 hover:shadow-md transition-all duration-200 border border-slate-200"
                style={{ borderLeftColor: triageColors[patient.triageLevel].includes('red') ? '#ef4444' : triageColors[patient.triageLevel].includes('orange') ? '#f97316' : '#eab308' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${triageColors[patient.triageLevel]}`}>
                        {patient.triageLevel}
                      </span>
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                        {patient.ambulanceId}
                      </span>
                      {patient.mechanism && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          🚨 {patient.mechanism}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-slate-900 mb-1">{patient.chiefComplaint}</h3>
                    
                    <div className="text-sm text-slate-600 mb-2">
                      {patient.age}y {patient.gender}
                      {patient.specialInstructions && (
                        <div className="text-xs text-red-600 font-semibold mt-1">
                          ⚠️ {patient.specialInstructions}
                        </div>
                      )}
                    </div>
                    
                    {patient.vitals && (
                      <div className="flex gap-3 text-xs text-slate-600 mt-2">
                        {patient.vitals.bloodPressure && (
                          <span className="font-semibold">BP: {patient.vitals.bloodPressure}</span>
                        )}
                        {patient.vitals.heartRate && (
                          <span className="font-semibold">HR: {patient.vitals.heartRate}</span>
                        )}
                        {patient.vitals.oxygenSaturation && (
                          <span className="font-semibold">SpO2: {patient.vitals.oxygenSaturation}%</span>
                        )}
                        {patient.vitals.gcs && (
                          <span className="font-semibold">GCS: {patient.vitals.gcs}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className={`text-3xl font-bold ${getETAColor(patient.eta)}`}>
                      {getETA(patient.eta)}
                    </div>
                    <div className="text-xs text-slate-500">ETA</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

