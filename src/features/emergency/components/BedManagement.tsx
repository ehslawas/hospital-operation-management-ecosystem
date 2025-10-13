'use client';

import React from 'react';
import type { EmergencyBed, EmergencyPatient } from '../types/Patient';

interface BedManagementProps {
  beds: EmergencyBed[];
  patients: EmergencyPatient[];
  onBedClick: (bed: EmergencyBed) => void;
}

const zoneColors = {
  Resuscitation: 'bg-red-50 border-red-200',
  Major: 'bg-orange-50 border-orange-200',
  Minor: 'bg-yellow-50 border-yellow-200',
  Observation: 'bg-blue-50 border-blue-200',
};

const statusColors = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  cleaning: 'bg-yellow-500',
  maintenance: 'bg-gray-500',
};

const statusLabels = {
  available: 'Available',
  occupied: 'Occupied',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
};

export function BedManagement({ beds, patients, onBedClick }: BedManagementProps) {
  const zones = ['Resuscitation', 'Major', 'Minor', 'Observation'] as const;
  
  const getBedStats = (zone: typeof zones[number]) => {
    const zoneBeds = beds.filter(b => b.zone === zone);
    return {
      total: zoneBeds.length,
      available: zoneBeds.filter(b => b.status === 'available').length,
      occupied: zoneBeds.filter(b => b.status === 'occupied').length,
    };
  };
  
  const getPatientForBed = (bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed || !bed.patientId) return null;
    return patients.find(p => p.id === bed.patientId);
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Bed Management</h2>
        <div className="flex gap-4 mt-4">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
              <span className="text-sm text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-6">
          {zones.map(zone => {
            const zoneBeds = beds.filter(b => b.zone === zone);
            const stats = getBedStats(zone);
            
            return (
              <div key={zone} className={`rounded-xl border-2 p-4 ${zoneColors[zone]}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{zone}</h3>
                  <div className="text-sm font-semibold text-slate-700">
                    {stats.available}/{stats.total} Available
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {zoneBeds.map(bed => {
                    const patient = getPatientForBed(bed.id);
                    
                    return (
                      <div
                        key={bed.id}
                        onClick={() => onBedClick(bed)}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                          bed.status === 'available'
                            ? 'bg-white border-green-300 hover:border-green-500'
                            : bed.status === 'occupied'
                            ? 'bg-red-50 border-red-300 hover:border-red-500'
                            : bed.status === 'cleaning'
                            ? 'bg-yellow-50 border-yellow-300 hover:border-yellow-500'
                            : 'bg-gray-50 border-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {/* Status indicator */}
                        <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${statusColors[bed.status]}`} />
                        
                        {/* Bed number */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900">{bed.bedNumber}</div>
                          <div className="text-xs text-slate-500 mt-1">{bed.roomNumber}</div>
                          
                          {/* Patient info if occupied */}
                          {patient && (
                            <div className="mt-2 pt-2 border-t border-slate-200">
                              <div className="text-xs font-semibold text-slate-700 truncate">
                                {patient.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {patient.triageLevel}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}








