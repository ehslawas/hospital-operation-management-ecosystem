'use client';

import React, { useState, useEffect } from 'react';
import { MetricsCard } from '@/features/emergency/components/MetricsCard';
import { WardCensusBoard } from '../components/WardCensusBoard';
import { PatientCareModal } from '../components/PatientCareModal';
import { PharmacyLogisticsWidget } from '@/features/pharmacy-logistics/components/PharmacyLogisticsWidget';
import type { WardPatient } from '../types/Ward';
import { mockWardPatients, mockWardBeds, calculateWardStats } from '../services/mockWardData';

export default function GeneralWardDashboard() {
  const [patients, setPatients] = useState<WardPatient[]>(mockWardPatients);
  const [selectedPatient, setSelectedPatient] = useState<WardPatient | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = calculateWardStats(patients, mockWardBeds);

  const handlePatientClick = (patient: WardPatient) => {
    setSelectedPatient(patient);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h1 className="text-4xl font-extrabold">General Ward</h1>
            </div>
            <p className="text-blue-100 text-lg">Patient care & ward management</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{currentTime.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-blue-100">{currentTime.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Patients"
          value={stats.totalPatients}
          subtitle={`New: ${stats.newAdmissions}`}
          color="blue"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />

        <MetricsCard
          title="Bed Occupancy"
          value={`${stats.occupancyRate}%`}
          subtitle={`${stats.availableBeds} of ${stats.totalBeds} available`}
          color={stats.occupancyRate > 85 ? 'orange' : 'green'}
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />

        <MetricsCard
          title="Critical Patients"
          value={stats.criticalPatients}
          subtitle="Requiring close monitoring"
          color="red"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />

        <MetricsCard
          title="Pending Discharge"
          value={stats.pendingDischarges}
          subtitle="Ready for discharge"
          color="purple"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
        />
      </div>

      {/* Ward Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Bed Utilization</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Occupied Beds</span>
                <span className="text-lg font-bold text-blue-600">{stats.occupiedBeds}</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  style={{ width: `${stats.occupancyRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-slate-200">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.availableBeds}</div>
                <div className="text-xs text-slate-600">Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.isolationBeds}</div>
                <div className="text-xs text-slate-600">Isolation</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.averageLengthOfStay}</div>
                <div className="text-xs text-slate-600">Avg LOS (days)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Patient Status</h3>
          <div className="space-y-3">
            {[
              { status: 'critical', count: patients.filter(p => p.status === 'critical').length, color: 'bg-red-500', label: 'Critical' },
              { status: 'observation', count: patients.filter(p => p.status === 'observation').length, color: 'bg-yellow-500', label: 'Observation' },
              { status: 'stable', count: patients.filter(p => p.status === 'stable').length, color: 'bg-green-500', label: 'Stable' },
              { status: 'pending-discharge', count: stats.pendingDischarges, color: 'bg-purple-500', label: 'Pending D/C' },
            ].map(item => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shared Logistics Widget (Permission-aware) */}
      <div className="mt-6">
        <PharmacyLogisticsWidget />
      </div>

      {/* Ward Census */}
      <WardCensusBoard patients={patients} onPatientClick={handlePatientClick} />

      {/* Patient Care Modal */}
      {selectedPatient && (
        <PatientCareModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}










