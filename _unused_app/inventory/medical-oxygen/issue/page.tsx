'use client';

import { useState, useEffect } from 'react';
import ClientOnly from '@/components/ClientOnly';

export default function OxygenIssuedDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  const toggleCylinderDetails = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const requests = [
    {
      id: 'REQ-001',
      date: '2024-12-15',
      department: 'ETU',
      requester: 'MA Syahirunnisa',
      departmentIcon: 'truck',
      status: 'In Transit',
      statusColor: 'orange',
      totalCylinders: 16,
      oxygenTypes: [
        { type: 'BN 1.4', qty: 3, cylinders: 'BN 001, BN 002, BN 003', color: 'blue' },
        { type: 'PI 1.4', qty: 2, cylinders: 'PI 001f, PI 002f', color: 'purple' },
        { type: 'PI 0.5', qty: 4, cylinders: 'PI 001d, PI 002d, PI 003d, PI 004d', color: 'pink' },
        { type: 'PI 1.4-loan', qty: 7, cylinders: 'No Tag (Loan)', color: 'orange' }
      ]
    },
    {
      id: 'REQ-002',
      date: '2024-12-14',
      department: 'ICU',
      requester: 'Dr. Ahmad Rahman',
      departmentIcon: 'heart',
      status: 'Delivered',
      statusColor: 'green',
      totalCylinders: 9,
      oxygenTypes: [
        { type: 'BN 6.4', qty: 2, cylinders: 'BN 001, BN 002', color: 'blue' },
        { type: 'PI 1.4', qty: 3, cylinders: 'PI 003f, PI 004f, PI 005f', color: 'purple' },
        { type: 'BN 1.4-loan', qty: 4, cylinders: 'No Tag (Loan)', color: 'orange' }
      ]
    },
    {
      id: 'REQ-003',
      date: '2024-12-13',
      department: 'Operating Theater',
      requester: 'Nurse Sarah Lim',
      departmentIcon: 'cross',
      status: 'Delivered',
      statusColor: 'green',
      totalCylinders: 8,
      oxygenTypes: [
        { type: 'BN 8.0', qty: 1, cylinders: 'No Tag (Loan)', color: 'blue' },
        { type: 'PI 1.4', qty: 5, cylinders: 'PI 006f, PI 007f, PI 008f, PI 009f, PI 010f', color: 'purple' },
        { type: 'BN 0.7', qty: 2, cylinders: 'BN 001, BN 002', color: 'indigo' }
      ]
    },
    {
      id: 'REQ-004',
      date: '2024-12-12',
      department: 'Emergency',
      requester: 'Dr. Fatimah Zahra',
      departmentIcon: 'lightning',
      status: 'In Transit',
      statusColor: 'orange',
      totalCylinders: 13,
      oxygenTypes: [
        { type: 'BN 1.4', qty: 4, cylinders: 'BN 004, BN 005, BN 006, BN 007', color: 'blue' },
        { type: 'PI 0.5', qty: 6, cylinders: 'PI 005d, PI 006d, PI 007d, PI 008d, PI 009d, PI 010d', color: 'pink' },
        { type: 'BN 1.4-loan', qty: 3, cylinders: 'No Tag (Loan)', color: 'orange' }
      ]
    }
  ];

  const getDepartmentIcon = (iconType: string) => {
    switch (iconType) {
      case 'truck':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'heart':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'cross':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'lightning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Delivered') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    }
  };

        return (
          <ClientOnly>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
            <div className=" p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Oxygen Issued Dashboard</h1>
            <p className="text-slate-600">Live overview of distribution, requests, and cylinder details.</p>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => window.print()}
              className="px-6 py-3 bg-white/80 backdrop-blur-sm text-slate-900 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center border border-white/20"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button className="px-6 py-3 bg-white/80 backdrop-blur-sm text-slate-900 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center border border-white/20">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">2</div>
                  <div className="text-sm text-slate-600">Active Requests</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Active Requests</h3>
                <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-medium shadow-md">+12% WoW</span>
              </div>
            </div>
          </div>

          <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">25</div>
                  <div className="text-sm text-slate-600">Total Cylinders</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Total Cylinders</h3>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-medium shadow-md">7d trend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by date, department, or request #"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm text-slate-900 rounded-xl border border-white/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 placeholder-slate-500"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-3 bg-white/80 backdrop-blur-sm text-slate-900 rounded-xl border border-white/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              >
                <option value="All Departments">All Departments</option>
                <option value="ETU">ETU</option>
                <option value="ICU">ICU</option>
                <option value="Operating Theater">Operating Theater</option>
                <option value="Emergency">Emergency</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 bg-white/80 backdrop-blur-sm text-slate-900 rounded-xl border border-white/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Request List */}
        <div className="space-y-6">
          {requests.map((request) => (
            <div key={request.id} className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-slate-600 text-sm font-medium">{request.date}</div>
                    <div className="flex items-center space-x-2">
                      <div className="text-slate-500">
                        {getDepartmentIcon(request.departmentIcon)}
                      </div>
                      <span className="text-slate-900 font-semibold">{request.department} ({request.requester})</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-medium shadow-md">{request.id}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-md ${
                      request.statusColor === 'green' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                    }`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{request.status}</span>
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Oxygen Issued: {request.totalCylinders} cylinders</h3>
                  <div className="flex flex-wrap gap-2">
                    {request.oxygenTypes.map((type, index) => (
                      <span key={index} className={`px-3 py-1 rounded-full text-sm font-medium shadow-md ${
                        type.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                        type.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' :
                        type.color === 'pink' ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white' :
                        type.color === 'orange' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                        'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
                      }`}>
                        {type.type} × {type.qty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200/50 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700">Cylinder Numbers</h4>
                    <button 
                      onClick={() => toggleCylinderDetails(request.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200 flex items-center"
                    >
                      {expandedRequests.has(request.id) ? 'Hide details' : 'View details'}
                      <svg 
                        className={`w-4 h-4 ml-1 transition-transform duration-200 ${expandedRequests.has(request.id) ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {expandedRequests.has(request.id) && (
                    <div className="mt-2 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40">
                      <div className="space-y-3">
                        {request.oxygenTypes.map((type, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-24">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                type.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                type.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                                type.color === 'pink' ? 'bg-pink-100 text-pink-800' :
                                type.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                                'bg-indigo-100 text-indigo-800'
                              }`}>
                                {type.type}
                              </span>
                            </div>
                            <div className="flex-1">
                              <span className="text-xs text-slate-600 font-mono">
                                {type.type} : {type.cylinders}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
          </ClientOnly>
  );
}
