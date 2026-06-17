'use client';

import React, { useState, useEffect } from 'react';
import { MetricsCard } from '../components/MetricsCard';
import { TriageBoard } from '../components/TriageBoard';
import { BedManagement } from '../components/BedManagement';
import { PatientAssessmentModal } from '../components/PatientAssessmentModal';
import { PatientRegistration } from '../components/PatientRegistration';
import { ClinicalDocumentation } from '../components/ClinicalDocumentation';
import { OrderManagement } from '../components/OrderManagement';
import { DispositionWorkflow } from '../components/DispositionWorkflow';
import { PatientTimeline } from '../components/PatientTimeline';
import { AmbulanceBoard } from '../components/AmbulanceBoard';
import { ReportsDashboard } from '../components/ReportsDashboard';
import type { EmergencyPatient, EmergencyBed } from '../types/Patient';
import { 
  mockEmergencyPatients, 
  mockEmergencyBeds, 
  mockIncomingPatients,
  calculateTriageStats,
  calculateDepartmentMetrics 
} from '../services/mockEmergencyData';

type ModalType = 'assessment' | 'register' | 'clinical' | 'orders' | 'disposition' | 'timeline' | 'reports' | null;

export default function EmergencyDashboard() {
  const [patients, setPatients] = useState<EmergencyPatient[]>(mockEmergencyPatients);
  const [beds, setBeds] = useState<EmergencyBed[]>(mockEmergencyBeds);
  const [selectedPatient, setSelectedPatient] = useState<EmergencyPatient | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [view, setView] = useState<'overview' | 'triage' | 'beds' | 'ambulances'>('overview');
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  const stats = calculateTriageStats(patients);
  const deptMetrics = calculateDepartmentMetrics(patients);
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const totalBeds = beds.length;
  const bedOccupancy = Math.round((totalBeds - availableBeds) / totalBeds * 100);
  
  const activePatients = patients.filter(
    p => p.status !== 'discharged' && 
        p.status !== 'transferred' && 
        p.status !== 'admitted' &&
        p.status !== 'left-without-being-seen' &&
        p.status !== 'deceased'
  );
  
  const criticalPatients = activePatients.filter(
    p => p.triageLevel === 'P1' || p.triageLevel === 'P2'
  );
  
  const handlePatientClick = (patient: EmergencyPatient) => {
    setSelectedPatient(patient);
    setActiveModal('assessment');
  };
  
  const handleBedClick = (bed: EmergencyBed) => {
    if (bed.patientId) {
      const patient = patients.find(p => p.id === bed.patientId);
      if (patient) {
        setSelectedPatient(patient);
        setActiveModal('assessment');
      }
    }
  };
  
  const handleRegisterPatient = (newPatient: Partial<EmergencyPatient>) => {
    const patient: EmergencyPatient = {
      ...newPatient,
      id: newPatient.id || `EP${Date.now()}`,
      registrationNumber: newPatient.registrationNumber || `ER2025-${Math.floor(Math.random() * 10000)}`,
      labOrders: newPatient.labOrders || [],
      radiologyOrders: newPatient.radiologyOrders || [],
      pharmacyOrders: newPatient.pharmacyOrders || [],
      timeline: newPatient.timeline || [],
      vitals: newPatient.vitals || [],
    } as EmergencyPatient;
    
    setPatients([...patients, patient]);
    setActiveModal(null);
  };
  
  const handleUpdatePatient = (updates: Partial<EmergencyPatient>) => {
    if (selectedPatient) {
      setPatients(prev =>
        prev.map(p => (p.id === selectedPatient.id ? { ...p, ...updates } : p))
      );
      setSelectedPatient(null);
      setActiveModal(null);
    }
  };
  
  const openPatientModal = (patient: EmergencyPatient, modal: ModalType) => {
    setSelectedPatient(patient);
    setActiveModal(modal);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
          <div>
                <h1 className="text-2xl font-bold text-gray-900">Emergency & Trauma Department</h1>
                <p className="text-sm text-gray-600 mt-1">Clinical Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 tabular-nums">
                  {currentTime.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-gray-600">
                  {currentTime.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
          </div>
          </div>
        </div>
      </div>
      
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        
        {/* Modern Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setView('overview')}
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  view === 'overview'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setView('triage')}
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  view === 'triage'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Triage Board
              </button>
              <button
                onClick={() => setView('beds')}
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  view === 'beds'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Bed Management
              </button>
              <button
                onClick={() => setView('ambulances')}
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  view === 'ambulances'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Incoming Ambulances
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveModal('register')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                + Register Patient
              </button>
              <button
                onClick={() => setActiveModal('reports')}
                className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                Reports
              </button>
            </div>
          </div>
        </div>
      
        {/* Modern Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 tabular-nums mb-2">{stats.total}</div>
            <div className="text-sm font-semibold text-gray-600">Total Patients</div>
            <div className="text-xs text-gray-500 mt-1">Currently in ED</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 tabular-nums mb-2">{criticalPatients.length}</div>
            <div className="text-sm font-semibold text-gray-600">Critical Cases</div>
            <div className="text-xs text-gray-500 mt-1">P1: {stats.p1} | P2: {stats.p2}</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bedOccupancy > 80 ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-green-600'}`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 tabular-nums mb-2">{bedOccupancy}%</div>
            <div className="text-sm font-semibold text-gray-600">Bed Occupancy</div>
            <div className="text-xs text-gray-500 mt-1">{availableBeds} of {totalBeds} available</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.averageWaitTime > 30 ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-teal-500 to-teal-600'}`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 tabular-nums mb-2">{stats.averageWaitTime}m</div>
            <div className="text-sm font-semibold text-gray-600">Avg Wait Time</div>
            <div className="text-xs text-gray-500 mt-1">Longest: {stats.longestWaitTime}m</div>
          </div>
        </div>
      
        {/* Modern Triage Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Triage Summary</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full">
                Total: {stats.total}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[
              { level: 'P1', label: 'Immediate', count: stats.p1, color: 'from-red-500 to-red-600' },
              { level: 'P2', label: 'Urgent', count: stats.p2, color: 'from-orange-500 to-orange-600' },
              { level: 'P3', label: 'Semi-Urgent', count: stats.p3, color: 'from-yellow-500 to-yellow-600' },
              { level: 'P4', label: 'Non-Urgent', count: stats.p4, color: 'from-green-500 to-green-600' },
              { level: 'P5', label: 'Non-Emergency', count: stats.p5, color: 'from-blue-500 to-blue-600' },
            ].map(({ level, label, count, color }) => (
              <div key={level} className="text-center group cursor-pointer">
                <div className={`bg-gradient-to-br ${color} text-white rounded-2xl p-6 mb-3 shadow-lg group-hover:shadow-xl transition-all duration-200`}>
                  <div className="text-4xl font-bold tabular-nums">{count}</div>
                </div>
                <div className="text-sm font-bold text-gray-900">{level}</div>
                <div className="text-xs text-gray-500 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      
      {/* Main Content Area */}
      <div className="space-y-6">
        {view === 'overview' && (
          <div className="space-y-6">
            
            {/* Modern Patient List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Active Patients</h2>
                  <p className="text-sm text-gray-600 mt-1">{activePatients.length} patients currently in department</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                    Filter
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                    Sort
                  </button>
                </div>
              </div>
              
              {activePatients.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No active patients</h3>
                  <p className="text-gray-500">All patients have been discharged or transferred</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {activePatients.map(patient => {
                    const bed = patient.assignedBed ? beds.find(b => b.bedNumber === patient.assignedBed) : null;
                    const waitTime = Math.floor((currentTime.getTime() - new Date(patient.arrivalTime).getTime()) / (1000 * 60));
                    
                    return (
                      <div key={patient.id} className="p-6 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-6">
                          {/* Triage Level Badge */}
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg ${
                            patient.triageLevel === 'P1' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                            patient.triageLevel === 'P2' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                            patient.triageLevel === 'P3' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                            patient.triageLevel === 'P4' ? 'bg-gradient-to-br from-green-500 to-green-600' : 
                            'bg-gradient-to-br from-blue-500 to-blue-600'
                          }`}>
                            {patient.triageLevel}
                          </div>
                          
                          {/* Patient Information */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">{patient.name}</h3>
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full">
                                #{patient.registrationNumber}
                              </span>
                              {patient.trauma.activated && (
                                <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse">
                                  🚨 TRAUMA {patient.trauma.level.toUpperCase()}
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                patient.status === 'in-treatment' ? 'bg-blue-100 text-blue-700' :
                                patient.status === 'in-assessment' ? 'bg-purple-100 text-purple-700' :
                                patient.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {patient.status.replace('-', ' ').toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                              <span className="font-semibold">{patient.age}y, {patient.gender}</span>
                              <span>•</span>
                              <span className="font-medium">{patient.chiefComplaint}</span>
                              {bed && (
                                <>
                                  <span>•</span>
                                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-semibold">
                                    🛏️ Bed {bed.bedNumber}
                                  </span>
                                </>
                              )}
                              {patient.assignedDoctor && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold">Dr. {patient.assignedDoctor}</span>
                                </>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500 font-medium">Wait: {waitTime}m</span>
                              {patient.labOrders && patient.labOrders.length > 0 && (
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
                                  🧪 {patient.labOrders.length} Lab
                                </span>
                              )}
                              {patient.radiologyOrders && patient.radiologyOrders.length > 0 && (
                                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-semibold">
                                  📸 {patient.radiologyOrders.length} Imaging
                                </span>
                              )}
                              {patient.pharmacyOrders && patient.pharmacyOrders.length > 0 && (
                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-semibold">
                                  💊 {patient.pharmacyOrders.length} Meds
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                              onClick={() => handlePatientClick(patient)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => openPatientModal(patient, 'orders')}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              Orders
                            </button>
                            <button
                              onClick={() => openPatientModal(patient, 'disposition')}
                              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
                            >
                              Disposition
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        
        {view === 'ambulances' && (
          <AmbulanceBoard incomingPatients={mockIncomingPatients} />
        )}
        
        {view === 'triage' && (
          <TriageBoard patients={patients} onPatientClick={handlePatientClick} />
        )}
        
        {view === 'beds' && (
          <BedManagement beds={beds} patients={patients} onBedClick={handleBedClick} />
        )}
      </div>
      
      </div>
      
      {/* Modals */}
      {activeModal === 'register' && (
        <PatientRegistration
          onClose={() => setActiveModal(null)}
          onRegister={handleRegisterPatient}
        />
      )}
      
      {activeModal === 'assessment' && selectedPatient && (
        <PatientAssessmentModal
          patient={selectedPatient}
          onClose={() => {
            setActiveModal(null);
            setSelectedPatient(null);
          }}
          onSave={handleUpdatePatient}
        />
      )}
      
      {activeModal === 'clinical' && selectedPatient && (
        <ClinicalDocumentation
          patient={selectedPatient}
          onClose={() => {
            setActiveModal(null);
            setSelectedPatient(null);
          }}
          onSave={handleUpdatePatient}
        />
      )}
      
      {activeModal === 'orders' && selectedPatient && (
        <OrderManagement
          patient={selectedPatient}
          onClose={() => {
            setActiveModal(null);
            setSelectedPatient(null);
          }}
          onSave={handleUpdatePatient}
        />
      )}
      
      {activeModal === 'disposition' && selectedPatient && (
        <DispositionWorkflow
          patient={selectedPatient}
          onClose={() => {
            setActiveModal(null);
            setSelectedPatient(null);
          }}
          onSave={handleUpdatePatient}
        />
      )}
      
      {activeModal === 'timeline' && selectedPatient && (
        <PatientTimeline
          patient={selectedPatient}
          onClose={() => {
            setActiveModal(null);
            setSelectedPatient(null);
          }}
        />
      )}
      
      {activeModal === 'reports' && (
        <ReportsDashboard
          patients={patients}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
