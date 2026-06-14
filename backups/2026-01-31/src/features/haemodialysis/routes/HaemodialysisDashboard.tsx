'use client';

import { useState } from 'react';
import type { DialysisPatient, DialysisSession, DialysisMachine, DialysisStaff, HaemodialysisStats } from '../types/Haemodialysis';

export default function HaemodialysisDashboard() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'patients' | 'machines'>('sessions');
  const [patients, setPatients] = useState<DialysisPatient[]>([]);
  const [sessions, setSessions] = useState<DialysisSession[]>([]);
  const [machines, setMachines] = useState<DialysisMachine[]>([]);
  const [staff, setStaff] = useState<DialysisStaff[]>([]);

  const stats: HaemodialysisStats = {
    totalActivePatients: 0,
    scheduledToday: 0,
    completedToday: 0,
    ongoingSessions: 0,
    morningSessionsToday: 0,
    afternoonSessionsToday: 0,
    eveningSessionsToday: 0,
    averageKtV: 0,
    adequateDialysisRate: 0,
    complicationRate: 0,
    totalMachines: 0,
    availableMachines: 0,
    machinesInUse: 0,
    machinesOffline: 0,
    averageSessionDuration: 0,
    machineUtilizationRate: 0,
    patientWaitTime: 0,
    missedSessionsThisMonth: 0,
    adverseEventsThisMonth: 0,
    waterQualityTests: 0,
    waterQualityPassRate: 0,
    avfRate: 0,
    catheterRate: 0,
    nursesOnDuty: 0,
    doctorsOnDuty: 0
  };

  const getSessionStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-800',
      missed: 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const getMachineStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800 border-green-200',
      'in-use': 'bg-blue-100 text-blue-800 border-blue-200',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      offline: 'bg-red-100 text-red-800 border-red-200',
      disinfecting: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[status as keyof typeof colors] || colors.offline;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Haemodialysis Unit</h1>
              <p className="text-cyan-100 mt-1">
                Renal replacement therapy, patient monitoring, and dialysis management
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="text-xs text-cyan-100">Ongoing Sessions</div>
                <div className="text-2xl font-bold">{stats.ongoingSessions}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="text-xs text-cyan-100">Today's Sessions</div>
                <div className="text-2xl font-bold">{stats.scheduledToday}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Patients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalActivePatients}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.completedToday} completed today</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Machine Status</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.availableMachines}/{stats.totalMachines}
                </p>
                <p className="text-xs text-gray-500 mt-1">Available</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                🏥
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Dialysis Adequacy</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.adequateDialysisRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Avg Kt/V: {stats.averageKtV}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                📊
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Water Quality</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.waterQualityPassRate}%</p>
                <p className="text-xs text-gray-500 mt-1">{stats.waterQualityTests} tests</p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center text-2xl">
                💧
              </div>
            </div>
          </div>
        </div>

        {/* Staff on Duty */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">👨‍⚕️ Staff on Duty</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {staff.filter(s => s.onDuty).map(member => (
              <div key={member.id} className="bg-white rounded-lg px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-600">{member.designation}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-gray-500">{member.shift} shift</span>
                  <span className="font-semibold text-blue-600">{member.patientsAssignedToday} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('sessions')}
                className={`flex-1 px-6 py-4 text-sm font-semibold ${activeTab === 'sessions'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                🩺 Today's Sessions ({sessions.length})
              </button>
              <button
                onClick={() => setActiveTab('patients')}
                className={`flex-1 px-6 py-4 text-sm font-semibold ${activeTab === 'patients'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                👥 Patient List ({patients.length})
              </button>
              <button
                onClick={() => setActiveTab('machines')}
                className={`flex-1 px-6 py-4 text-sm font-semibold ${activeTab === 'machines'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                🏥 Machines ({machines.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                {sessions.map(session => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-gray-900">{session.sessionNumber}</span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                            {session.status === 'in-progress' && '⏱️ In Progress'}
                            {session.status === 'scheduled' && '📅 Scheduled'}
                            {session.status === 'completed' && '✅ Completed'}
                          </span>
                          <span className="text-xs text-gray-600">{session.shift} Shift</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-2">{session.patientName} ({session.patientMRN})</p>
                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-gray-600">Machine:</span>
                            <span className="ml-1 font-semibold text-blue-600">{session.machineNumber}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Time:</span>
                            <span className="ml-1 font-medium">{session.scheduledStartTime} - {session.scheduledEndTime}</span>
                          </div>
                          {session.preWeight && (
                            <div>
                              <span className="text-gray-600">Pre-weight:</span>
                              <span className="ml-1 font-medium">{session.preWeight} kg</span>
                            </div>
                          )}
                          {session.postWeight && (
                            <div>
                              <span className="text-gray-600">Post-weight:</span>
                              <span className="ml-1 font-medium">{session.postWeight} kg</span>
                            </div>
                          )}
                        </div>
                        {session.hadComplications && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            ⚠️ Complications recorded - {session.complications?.[0]?.complicationType}
                          </div>
                        )}
                      </div>
                      <button className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                        View Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'patients' && (
              <div className="space-y-4">
                {patients.map(patient => (
                  <div key={patient.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-gray-900">{patient.patientName}</span>
                          <span className="text-xs text-gray-600">({patient.age}y, {patient.gender})</span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${patient.adequacy === 'adequate' ? 'bg-green-100 text-green-800' :
                              patient.adequacy === 'borderline' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            Kt/V: {patient.lastKtV}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{patient.patientMRN} • {patient.diagnosis}</p>
                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-gray-600">Schedule:</span>
                            <span className="ml-1 font-medium">{patient.schedule}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Access:</span>
                            <span className="ml-1 font-medium">{patient.accessType} - {patient.accessSite}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Dry Weight:</span>
                            <span className="ml-1 font-medium">{patient.dryWeight} kg</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Duration:</span>
                            <span className="ml-1 font-medium">{patient.dialysisDuration.toFixed(1)} years</span>
                          </div>
                        </div>
                      </div>
                      <button className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                        View Record
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'machines' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {machines.map(machine => (
                  <div key={machine.id} className={`border-2 rounded-lg p-4 ${getMachineStatusColor(machine.status)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{machine.machineNumber}</h4>
                        <p className="text-xs text-gray-600">{machine.manufacturer} {machine.model}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${machine.status === 'available' ? 'bg-green-600 text-white' :
                          machine.status === 'in-use' ? 'bg-blue-600 text-white' :
                            machine.status === 'maintenance' ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                        }`}>
                        {machine.status === 'in-use' && '🔄 In Use'}
                        {machine.status === 'available' && '✓ Available'}
                        {machine.status === 'maintenance' && '🔧 Maintenance'}
                        {machine.status === 'offline' && '✗ Offline'}
                        {machine.status === 'disinfecting' && '🧼 Disinfecting'}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-gray-600">{machine.station}</p>
                    </div>

                    {machine.currentPatient && (
                      <div className="mb-3 p-2 bg-white rounded">
                        <p className="text-xs text-blue-700 font-semibold">Current: {machine.currentPatient}</p>
                        {machine.estimatedEndTime && (
                          <p className="text-xs text-gray-600">
                            Est. end: {new Date(machine.estimatedEndTime).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Today:</span>
                        <span className="font-medium">{machine.totalSessionsToday} sessions</span>
                      </div>
                      <div className="flex justify-between">
                        <span>This month:</span>
                        <span className="font-medium">{machine.totalSessionsThisMonth} sessions</span>
                      </div>
                    </div>

                    {machine.hasIssues && machine.issues && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs font-semibold text-red-800 mb-1">⚠️ Issues:</p>
                        {machine.issues.map((issue, idx) => (
                          <p key={idx} className="text-xs text-red-700">• {issue}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}







