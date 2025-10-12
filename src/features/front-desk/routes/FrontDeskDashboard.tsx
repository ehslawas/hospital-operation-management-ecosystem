'use client';

import { useState } from 'react';
import {
  getTodaysVisitors,
  getTodaysAppointments,
  getCurrentQueue,
  getCounterStatus,
  getFrontDeskStats,
  getRecentRegistrations,
} from '../services/mockFrontDeskData';
import type { Visitor, Appointment } from '../types/FrontDesk';

export default function FrontDeskDashboard() {
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientForm, setPatientForm] = useState({
    firstName: '',
    lastName: '',
    icNumber: '',
    passportNumber: '',
    dob: '',
    gender: '',
    phoneNumber: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    allergies: '',
    medicalHistory: '',
    insuranceProvider: '',
    insuranceNumber: '',
    preferredLanguage: '',
    maritalStatus: '',
    occupation: '',
    nationality: '',
    race: '',
    raceOther: '',
    religion: '',
    religionOther: ''
  });
  
  const visitors = getTodaysVisitors();
  const appointments = getTodaysAppointments();
  const queue = getCurrentQueue();
  const counters = getCounterStatus();
  const stats = getFrontDeskStats();
  const recentRegistrations = getRecentRegistrations();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('Patient Registration Data:', patientForm);
    // Reset form and close modal
    setPatientForm({
      firstName: '', lastName: '', icNumber: '', passportNumber: '', dob: '', gender: '',
      phoneNumber: '', email: '', address: '', emergencyContact: '', emergencyPhone: '',
      allergies: '', medicalHistory: '', insuranceProvider: '', insuranceNumber: '',
      preferredLanguage: '', maritalStatus: '', occupation: '', nationality: '', race: '', raceOther: '', religion: '', religionOther: ''
    });
    setShowNewPatientModal(false);
    alert('Patient registered successfully!');
  };

  const handleInputChange = (field: string, value: string) => {
    setPatientForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      {/* Modern Refreshing Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-emerald-200/50 shadow-lg">
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">FD</span>
              </div>
            <div>
                <h1 className="text-xl font-semibold text-emerald-700">Hospital Front Desk</h1>
                <p className="text-lg font-bold text-slate-800">Registration & Visitor Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowNewPatientModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Register New Patient
              </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name / NRIC / d"
                  className="w-80 px-4 py-3 pl-11 bg-white border-2 border-emerald-200 rounded-xl text-slate-800 placeholder-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none shadow-sm"
                />
                <svg className="w-5 h-5 text-emerald-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select className="px-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none shadow-sm">
                <option>All</option>
                <option>Active</option>
                <option>Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-8 py-8 space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Waiting Queue"
            value={stats.currentQueueSize}
            badge={{ text: "Live", color: "emerald" }}
            date={new Date().toLocaleDateString('en-CA')}
          />
          <MetricCard
            title="Checked-in Today"
            value={stats.totalVisitorsToday}
            date={new Date().toLocaleDateString('en-CA')}
          />
          <MetricCard
            title="New Registrations"
            value={stats.newRegistrationsToday}
            badge={{ text: "Auto-token enabled", color: "cyan" }}
          />
          <MetricCard
            title="No-shows"
            value={stats.noShows || 0}
            action={{ text: "Monitor & call back", color: "amber" }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200/50 shadow-lg">
            <div className="px-6 py-5 border-b border-emerald-200/50">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Today's Appointments</h3>
                <span className="text-sm text-emerald-600 font-semibold">{appointments.length} result(s)</span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {appointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200/50 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-emerald-600">
                          {appointment.appointmentTime}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{appointment.patientName}</div>
                          <div className="text-sm text-slate-600">
                            {appointment.icNumber} • {appointment.phoneNumber}
                          </div>
                          <div className="text-sm text-emerald-700 font-medium">
                            {appointment.department} / {appointment.doctorName}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                          Scheduled
                </span>
                        <button className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg">
                          Check-in & Issue Token
                        </button>
                        <button className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
                          Mark No-show
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Queue */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-cyan-200/50 shadow-lg">
            <div className="px-6 py-5 border-b border-cyan-200/50">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Live Queue</h3>
                <select className="px-3 py-1.5 bg-white border border-cyan-300 rounded-lg text-slate-800 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none">
                  <option>Prefix A</option>
                  <option>Prefix B</option>
                  <option>Prefix C</option>
                </select>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {queue.slice(0, 5).map((item) => (
                  <div key={item.id} className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200/50 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-cyan-600">{item.queueNumber}</div>
                        <div>
                          <div className="font-semibold text-slate-800">{item.patientName}</div>
                          <div className="text-sm text-slate-600">{item.department}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          item.status === 'waiting' ? 'bg-slate-200 text-slate-700' :
                          item.status === 'serving' ? 'bg-emerald-500 text-white' :
                          item.status === 'called' ? 'bg-cyan-500 text-white' :
                          'bg-teal-500 text-white'
                        }`}>
                          {item.status === 'called' ? 'Calling' : item.status}
                </span>
                        <button className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>

        {/* Quick Actions & Patient Directory */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                    <div className="font-semibold text-slate-800">Returning Patient Check-in</div>
                    <div className="text-sm text-amber-600">Scan</div>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg">
                    Check-in
                  </button>
                </div>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">Create Visitor Ticket</div>
                    <div className="text-sm text-amber-600">Visit</div>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg">
                    Issue Token
                  </button>
              </div>
                <div className="text-xs text-slate-500 mt-2">
                  For family/visitor queues not tied to a patient record.
            </div>
              </div>
            </div>
          </div>

          {/* Patient Directory */}
          <div className="xl:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-teal-200/50 shadow-lg">
            <div className="px-6 py-5 border-b border-teal-200/50">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Patient Directory</h3>
                <span className="text-sm text-teal-600 font-semibold">{recentRegistrations.length} record(s)</span>
              </div>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-teal-600 uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">NRIC / Passport</th>
                    <th className="pb-3">DOB</th>
                    <th className="pb-3">Gender</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Allergies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-100">
                  {recentRegistrations.map((patient) => (
                    <tr key={patient.id} className="hover:bg-teal-50/50 transition-colors">
                      <td className="py-3 font-semibold text-slate-800">{patient.name}</td>
                      <td className="py-3 text-slate-600">{patient.icNumber}</td>
                      <td className="py-3 text-slate-600">{patient.dob || '1990-01-01'}</td>
                      <td className="py-3 text-slate-600">{patient.gender || 'Male'}</td>
                      <td className="py-3 text-slate-600">{patient.phone || '012-3456789'}</td>
                      <td className="py-3 text-slate-600">NKDA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        </div>

      {/* Patient Registration Modal */}
      {showNewPatientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
              <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                        </div>
                        <div>
                    <h2 className="text-2xl font-bold text-white">Register New Patient</h2>
                    <p className="text-emerald-100">Complete patient information for registration</p>
                        </div>
                      </div>
                <button
                  onClick={() => setShowNewPatientModal(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                        </button>
                      </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleFormSubmit} className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={patientForm.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={patientForm.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={patientForm.dob}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                      <select
                        required
                        value={patientForm.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">NRIC Number *</label>
                      <input
                        type="text"
                        required
                        value={patientForm.icNumber}
                        onChange={(e) => handleInputChange('icNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="e.g., 900101-14-1234"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label>
                      <input
                        type="text"
                        value={patientForm.passportNumber}
                        onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="For non-citizens"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={patientForm.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="e.g., 012-3456789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={patientForm.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="patient@email.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                      <textarea
                        required
                        value={patientForm.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none resize-none"
                        placeholder="Enter complete address"
                      />
              </div>
            </div>
          </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={patientForm.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="Emergency contact full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={patientForm.emergencyPhone}
                        onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="Emergency contact phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    Medical Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Known Allergies</label>
                      <input
                        type="text"
                        value={patientForm.allergies}
                        onChange={(e) => handleInputChange('allergies', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="List any known allergies or 'NKDA'"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Provider</label>
                      <input
                        type="text"
                        value={patientForm.insuranceProvider}
                        onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="Insurance company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Number</label>
                      <input
                        type="text"
                        value={patientForm.insuranceNumber}
                        onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="Policy number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Language</label>
                      <select
                        value={patientForm.preferredLanguage}
                        onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      >
                        <option value="">Select Language</option>
                        <option value="Malay">Malay</option>
                        <option value="English">English</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Medical History</label>
                      <textarea
                        value={patientForm.medicalHistory}
                        onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none resize-none"
                        placeholder="Previous medical conditions, surgeries, medications, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Marital Status</label>
                      <select
                        value={patientForm.maritalStatus}
                        onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                      <input
                        type="text"
                        value={patientForm.occupation}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="Job title or profession"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label>
                      <input
                        type="text"
                        value={patientForm.nationality}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="e.g., Malaysian"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Race</label>
                      <select
                        value={patientForm.race}
                        onChange={(e) => handleInputChange('race', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      >
                        <option value="">Select Race</option>
                        <option value="Malay">Malay</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Indian">Indian</option>
                        <option value="Other">Other</option>
                      </select>
                      {patientForm.race === 'Other' && (
                        <input
                          type="text"
                          value={patientForm.raceOther}
                          onChange={(e) => handleInputChange('raceOther', e.target.value)}
                          className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                          placeholder="Please specify race"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Religion</label>
                      <select
                        value={patientForm.religion}
                        onChange={(e) => handleInputChange('religion', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      >
                        <option value="">Select Religion</option>
                        <option value="Islam">Islam</option>
                        <option value="Buddhism">Buddhism</option>
                        <option value="Hinduism">Hinduism</option>
                        <option value="Christianity">Christianity</option>
                        <option value="Other">Other</option>
                      </select>
                      {patientForm.religion === 'Other' && (
                        <input
                          type="text"
                          value={patientForm.religionOther}
                          onChange={(e) => handleInputChange('religionOther', e.target.value)}
                          className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                          placeholder="Please specify religion"
                        />
                      )}
                    </div>
                  </div>
            </div>
          </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-200 mt-8">
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(false)}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, badge, date, action }: {
  title: string;
  value: number;
  badge?: { text: string; color: 'emerald' | 'cyan' | 'amber' };
  date?: string;
  action?: { text: string; color: 'emerald' | 'cyan' | 'amber' };
}) {
  const badgeColors = {
    emerald: 'bg-emerald-100 text-emerald-800',
    cyan: 'bg-cyan-100 text-cyan-800',
    amber: 'bg-amber-100 text-amber-800',
  };

  const actionColors = {
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    cyan: 'bg-cyan-500 hover:bg-cyan-600',
    amber: 'bg-amber-500 hover:bg-amber-600',
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200/50 shadow-lg p-6 hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700">{title}</h3>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColors[badge.color]}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-800 mb-2">{value}</div>
      {date && (
        <div className="text-xs text-slate-500">{date}</div>
      )}
      {action && (
        <button className={`mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors shadow-md hover:shadow-lg ${actionColors[action.color]}`}>
          {action.text}
        </button>
      )}
    </div>
  );
}





