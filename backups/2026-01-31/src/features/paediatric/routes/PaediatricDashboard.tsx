'use client';

import { useState, useEffect } from 'react';
import { MetricsCard } from '@/features/emergency/components/MetricsCard';
import { PharmacyLogisticsWidget } from '@/features/pharmacy-logistics/components/PharmacyLogisticsWidget';
import type { PaediatricPatient } from '../types/Paediatric';
import { mockPaediatricPatients, mockPaediatricBeds, calculatePaediatricStats } from '../services/mockPaediatricData';

export default function PaediatricDashboard() {
  const [patients] = useState<PaediatricPatient[]>(mockPaediatricPatients);
  const [selectedPatient, setSelectedPatient] = useState<PaediatricPatient | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = calculatePaediatricStats(patients, mockPaediatricBeds);
  const activePatients = patients.filter(p => p.status !== 'discharged');

  const getAge = (ageMonths: number) => {
    if (ageMonths < 1) return `${Math.floor(ageMonths * 30)} days`;
    if (ageMonths < 12) return `${ageMonths} months`;
    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    return months > 0 ? `${years}y ${months}m` : `${years} years`;
  };

  const statusColors = {
    admitted: 'bg-blue-100 text-blue-800',
    stable: 'bg-green-100 text-green-800',
    critical: 'bg-red-100 text-red-800',
    observation: 'bg-yellow-100 text-yellow-800',
    discharged: 'bg-gray-100 text-gray-800',
  };

  const ageGroupColors = {
    neonate: 'bg-purple-500',
    infant: 'bg-blue-500',
    toddler: 'bg-green-500',
    preschool: 'bg-yellow-500',
    'school-age': 'bg-orange-500',
    adolescent: 'bg-pink-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-4xl font-extrabold">Paediatric Ward</h1>
            </div>
            <p className="text-pink-100 text-lg">Child health & development</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{currentTime.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-pink-100">{currentTime.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Patients"
          value={stats.totalPatients}
          subtitle={`New today: ${stats.newAdmissions}`}
          color="blue"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
          title="Immunization Status"
          value={stats.immunizationUpToDate}
          subtitle={`${stats.immunizationDelayed} delayed`}
          color={stats.immunizationDelayed > 0 ? 'orange' : 'green'}
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />

        <MetricsCard
          title="Critical Cases"
          value={stats.criticalCases}
          subtitle="Requiring close monitoring"
          color="red"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Age Group Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Patients by Age Group</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Neonate', key: 'neonate', desc: '0-1m', color: ageGroupColors.neonate },
            { label: 'Infant', key: 'infant', desc: '1-12m', color: ageGroupColors.infant },
            { label: 'Toddler', key: 'toddler', desc: '1-3y', color: ageGroupColors.toddler },
            { label: 'Preschool', key: 'preschool', desc: '3-6y', color: ageGroupColors.preschool },
            { label: 'School Age', key: 'schoolAge', desc: '6-12y', color: ageGroupColors['school-age'] },
            { label: 'Adolescent', key: 'adolescent', desc: '12-18y', color: ageGroupColors.adolescent },
          ].map(group => (
            <div key={group.key} className="text-center">
              <div className={`${group.color} text-white rounded-xl p-4 mb-2`}>
                <div className="text-3xl font-bold">{stats.byAgeGroup[group.key as keyof typeof stats.byAgeGroup]}</div>
              </div>
              <div className="text-sm font-semibold text-slate-900">{group.label}</div>
              <div className="text-xs text-slate-500">{group.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Shared Logistics Widget (Permission-aware) */}
      <div className="mt-6">
        <PharmacyLogisticsWidget />
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Patient Census</h2>
        </div>

        <div className="p-6">
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {activePatients.map(patient => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-r from-white to-pink-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[patient.status]}`}>
                        {patient.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${ageGroupColors[patient.ageGroup]}`}>
                        {patient.ageGroup.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{patient.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {getAge(patient.ageMonths)} • {patient.gender} • {patient.registrationNumber}
                    </p>
                    <p className="text-sm text-slate-700 font-semibold mt-2">
                      Bed: {patient.bedNumber} • {patient.primaryDiagnosis}
                    </p>

                    {patient.vitals.length > 0 && (
                      <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-xs text-slate-600 mb-1">Latest Vitals</div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
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
                          <div>
                            <div className="text-slate-600">Pain</div>
                            <div className="font-bold text-slate-900">{patient.vitals[0].painScore}/10</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-slate-600">
                      Parents: {patient.motherName} & {patient.fatherName} • Contact: {patient.contactNumber}
                    </div>

                    <div className="mt-2 flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${patient.immunizationStatus === 'up-to-date' ? 'bg-green-100 text-green-700' :
                        patient.immunizationStatus === 'delayed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                        💉 {patient.immunizationStatus.replace('-', ' ')}
                      </span>
                      {patient.developmentalAssessments.length > 0 && patient.developmentalAssessments[0].overallStatus === 'on-track' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                          ✓ Development on track
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold text-purple-900">{patient.attendingPediatrician}</div>
                    <div className="text-xs text-slate-500">{patient.assignedNurse}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPatient(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                  <div className="text-sm mt-2">
                    {getAge(selectedPatient.ageMonths)} • {selectedPatient.gender} • {selectedPatient.registrationNumber}
                  </div>
                  <div className="text-sm mt-1">
                    Parents: {selectedPatient.motherName} & {selectedPatient.fatherName}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Diagnosis</h3>
                <p className="text-slate-800 font-semibold">{selectedPatient.primaryDiagnosis}</p>
              </div>

              {selectedPatient.growthMeasurements.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Latest Growth Measurements</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-slate-600">Weight</div>
                      <div className="text-2xl font-bold text-blue-600">{selectedPatient.growthMeasurements[0].weight} kg</div>
                      <div className="text-xs text-slate-500">{selectedPatient.growthMeasurements[0].weightPercentile}th percentile</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-slate-600">Height</div>
                      <div className="text-2xl font-bold text-green-600">{selectedPatient.growthMeasurements[0].height} cm</div>
                      <div className="text-xs text-slate-500">{selectedPatient.growthMeasurements[0].heightPercentile}th percentile</div>
                    </div>
                    {selectedPatient.growthMeasurements[0].headCircumference && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-slate-600">Head Circumference</div>
                        <div className="text-2xl font-bold text-purple-600">{selectedPatient.growthMeasurements[0].headCircumference} cm</div>
                        <div className="text-xs text-slate-500">{selectedPatient.growthMeasurements[0].headCircumferencePercentile}th percentile</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Immunization Status: {selectedPatient.immunizationStatus.replace('-', ' ')}</h3>
                <div className="space-y-2">
                  {selectedPatient.immunizationRecords.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-slate-900">{record.vaccineName} (Dose {record.doseNumber})</div>
                        <div className="text-xs text-slate-600">{record.scheduledAge}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${record.status === 'given' ? 'bg-green-100 text-green-700' :
                        record.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {record.status === 'given' && record.givenDate ? `✓ Given ${new Date(record.givenDate).toLocaleDateString('en-MY')}` : record.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPatient.developmentalAssessments.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Developmental Assessment</h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm font-semibold text-purple-900 mb-2">
                      Overall Status: {selectedPatient.developmentalAssessments[0].overallStatus.replace('-', ' ').toUpperCase()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Gross Motor: {selectedPatient.developmentalAssessments[0].grossMotor.status}</div>
                      <div>Fine Motor: {selectedPatient.developmentalAssessments[0].fineMotor.status}</div>
                      <div>Language: {selectedPatient.developmentalAssessments[0].language.status}</div>
                      <div>Social/Emotional: {selectedPatient.developmentalAssessments[0].socialEmotional.status}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}










