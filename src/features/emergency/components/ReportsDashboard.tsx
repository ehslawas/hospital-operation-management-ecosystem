'use client';

import React, { useState } from 'react';
import type { EmergencyPatient, DepartmentMetrics } from '../types/Patient';

interface ReportsDashboardProps {
  patients: EmergencyPatient[];
  onClose: () => void;
}

export function ReportsDashboard({ patients, onClose }: ReportsDashboardProps) {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate metrics
  const todayPatients = patients.filter(p => p.arrivalTime >= today);
  
  const currentInDept = patients.filter(p => 
    p.status !== 'discharged' && 
    p.status !== 'transferred' && 
    p.status !== 'admitted' &&
    p.status !== 'left-without-being-seen' &&
    p.status !== 'deceased'
  ).length;
  
  const admitted = todayPatients.filter(p => 
    p.status === 'admitted' || p.status === 'awaiting-admission' || 
    p.disposition?.type.startsWith('admit-')
  ).length;
  
  const discharged = todayPatients.filter(p => 
    p.status === 'discharged' || 
    p.disposition?.type.startsWith('discharge-')
  ).length;
  
  const transferred = todayPatients.filter(p => p.status === 'transferred').length;
  const lwbs = todayPatients.filter(p => p.status === 'left-without-being-seen').length;
  const deceased = todayPatients.filter(p => p.status === 'deceased').length;
  
  const traumaActivations = todayPatients.filter(p => p.trauma.activated).length;
  
  // Triage breakdown
  const triageBreakdown = {
    P1: todayPatients.filter(p => p.triageLevel === 'P1').length,
    P2: todayPatients.filter(p => p.triageLevel === 'P2').length,
    P3: todayPatients.filter(p => p.triageLevel === 'P3').length,
    P4: todayPatients.filter(p => p.triageLevel === 'P4').length,
    P5: todayPatients.filter(p => p.triageLevel === 'P5').length,
  };
  
  // Wait times
  const calculateWaitTimes = () => {
    const triageWaitTimes = todayPatients
      .filter(p => p.triageTime && p.timeline.find(t => t.type === 'doctor-assigned'))
      .map(p => {
        const triage = p.triageTime!.getTime();
        const doctorAssigned = p.timeline.find(t => t.type === 'doctor-assigned')!.timestamp.getTime();
        return (doctorAssigned - triage) / (1000 * 60);
      });
    
    const losValues = todayPatients
      .filter(p => p.disposition?.completedAt)
      .map(p => {
        const arrival = p.arrivalTime.getTime();
        const departure = p.disposition!.completedAt!.getTime();
        return (departure - arrival) / (1000 * 60);
      });
    
    const avgTriageWait = triageWaitTimes.length > 0 
      ? Math.round(triageWaitTimes.reduce((a, b) => a + b, 0) / triageWaitTimes.length)
      : 0;
    
    const avgLOS = losValues.length > 0
      ? Math.round(losValues.reduce((a, b) => a + b, 0) / losValues.length)
      : 0;
    
    return { avgTriageWait, avgLOS };
  };
  
  const { avgTriageWait, avgLOS } = calculateWaitTimes();
  
  // Arrival mode breakdown
  const arrivalModes = {
    'walk-in': todayPatients.filter(p => p.arrivalMode === 'walk-in').length,
    'ambulance': todayPatients.filter(p => p.arrivalMode === 'ambulance').length,
    'police': todayPatients.filter(p => p.arrivalMode === 'police').length,
    'referral': todayPatients.filter(p => p.arrivalMode === 'referral').length,
    'helicopter': todayPatients.filter(p => p.arrivalMode === 'helicopter').length,
  };
  
  // Disposition breakdown
  const dispositionBreakdown = {
    'Admit General': todayPatients.filter(p => p.disposition?.type === 'admit-general').length,
    'Admit ICU': todayPatients.filter(p => p.disposition?.type === 'admit-icu').length,
    'Admit HDU': todayPatients.filter(p => p.disposition?.type === 'admit-hdu').length,
    'Admit Surgical': todayPatients.filter(p => p.disposition?.type === 'admit-surgical').length,
    'Discharge Home': todayPatients.filter(p => p.disposition?.type === 'discharge-home').length,
    'Discharge AMA': todayPatients.filter(p => p.disposition?.type === 'discharge-ama').length,
    'Transfer': todayPatients.filter(p => p.disposition?.type === 'transfer-hospital').length,
    'LWBS': lwbs,
    'Deceased': deceased,
  };
  
  // Hourly arrivals
  const hourlyArrivals = Array.from({ length: 24 }, (_, hour) => {
    const count = todayPatients.filter(p => {
      const arrivalHour = p.arrivalTime.getHours();
      return arrivalHour === hour;
    }).length;
    return { hour, count };
  });
  
  const maxHourlyCount = Math.max(...hourlyArrivals.map(h => h.count), 1);
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Emergency Department Reports</h2>
              <p className="text-blue-100 mt-1">Comprehensive analytics and metrics</p>
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
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Key Metrics (Today)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-600 font-semibold">Total Patients</div>
                  <div className="text-3xl font-bold text-blue-600 mt-1">{todayPatients.length}</div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-600 font-semibold">In Department</div>
                  <div className="text-3xl font-bold text-orange-600 mt-1">{currentInDept}</div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-600 font-semibold">Admitted</div>
                  <div className="text-3xl font-bold text-purple-600 mt-1">{admitted}</div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-600 font-semibold">Discharged</div>
                  <div className="text-3xl font-bold text-green-600 mt-1">{discharged}</div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-600 font-semibold">Transferred</div>
                  <div className="text-3xl font-bold text-indigo-600 mt-1">{transferred}</div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-600 font-semibold">LWBS</div>
                  <div className="text-3xl font-bold text-yellow-600 mt-1">{lwbs}</div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-600 font-semibold">Trauma Alerts</div>
                  <div className="text-3xl font-bold text-red-600 mt-1">{traumaActivations}</div>
                </div>
              </div>
            </div>
            
            {/* Triage Breakdown */}
            <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Triage Level Distribution</h3>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(triageBreakdown).map(([level, count]) => (
                  <div key={level} className="text-center">
                    <div className={`h-32 flex items-end justify-center mb-2 ${
                      level === 'P1' ? 'bg-red-100' :
                      level === 'P2' ? 'bg-orange-100' :
                      level === 'P3' ? 'bg-yellow-100' :
                      level === 'P4' ? 'bg-green-100' :
                      'bg-blue-100'
                    } rounded-lg`}>
                      <div 
                        className={`w-full ${
                          level === 'P1' ? 'bg-red-500' :
                          level === 'P2' ? 'bg-orange-500' :
                          level === 'P3' ? 'bg-yellow-500' :
                          level === 'P4' ? 'bg-green-500' :
                          'bg-blue-500'
                        } rounded-t text-white font-bold flex items-center justify-center transition-all duration-500`}
                        style={{ height: `${Math.max((count / Math.max(...Object.values(triageBreakdown))) * 100, 10)}%` }}
                      >
                        {count}
                      </div>
                    </div>
                    <div className="font-semibold text-slate-900">{level}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Wait Times */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Average Wait Times</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">Triage → Doctor</span>
                      <span className="text-2xl font-bold text-blue-600">{avgTriageWait} min</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((avgTriageWait / 60) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">Average Length of Stay</span>
                      <span className="text-2xl font-bold text-purple-600">{avgLOS} min</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((avgLOS / 300) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Arrival Mode */}
              <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Arrival Mode</h3>
                <div className="space-y-3">
                  {Object.entries(arrivalModes).map(([mode, count]) => (
                    <div key={mode}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-700 capitalize">
                          {mode === 'walk-in' && '🚶'} {mode === 'ambulance' && '🚑'} 
                          {mode === 'police' && '🚓'} {mode === 'referral' && '📄'} 
                          {mode === 'helicopter' && '🚁'} {mode.replace('-', ' ')}
                        </span>
                        <span className="text-lg font-bold text-slate-900">{count}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(count / todayPatients.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Disposition Breakdown */}
            <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Disposition Outcomes</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {Object.entries(dispositionBreakdown).map(([type, count]) => (
                  <div key={type} className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">{count}</div>
                    <div className="text-xs text-slate-600 font-semibold mt-1">{type}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Hourly Arrivals */}
            <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Hourly Patient Arrivals (24-Hour)</h3>
              <div className="flex items-end gap-1 h-48">
                {hourlyArrivals.map(({ hour, count }) => (
                  <div key={hour} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 cursor-pointer relative group"
                      style={{ height: `${(count / maxHourlyCount) * 100}%` }}
                    >
                      {count > 0 && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded">
                          {count}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-2 font-semibold">
                      {hour.toString().padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Report generated: {new Date().toLocaleString('en-MY')}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

