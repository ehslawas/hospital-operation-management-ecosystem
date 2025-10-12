"use client";

import { useEffect, useState } from 'react';

export default function MedicalOxygenBalancePage() {
  const [department, setDepartment] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDepartment(localStorage.getItem('department'));
    }
  }, []);
  const isViewOnly = department === 'Office Admin';
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      {/* Glass Orbs */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto p-6 lg:p-8">
        {/* Modern Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title Section */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl"></div>
                  <svg className="w-8 h-8 text-slate-700 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-lg"></div>
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-black text-slate-800 mb-2 tracking-tight">
                  Medical Oxygen
                  <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Balance
                  </span>
                </h1>
                <p className="text-slate-600 text-lg font-medium">
                  Real-time cylinder tracking • Multi-region ready • BN & PI systems
                </p>
              </div>
            </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <a href="/inventory/medical-oxygen/request" onClick={(e) => { if (isViewOnly) e.preventDefault(); }} title={isViewOnly ? 'View-only for Office Admin' : undefined} className={`group relative px-6 py-4 bg-white/20 backdrop-blur-xl rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-3 border border-white/30 overflow-hidden ${isViewOnly ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-400/30">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <span className="text-slate-700 font-semibold">Request</span>
                      </div>
                    </a>

                    <a href="/inventory/medical-oxygen/receive" className="group relative px-6 py-4 bg-white/20 backdrop-blur-xl rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-3 border border-white/30 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex items-center space-x-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-400/30">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <span className="text-slate-700 font-semibold">Receive</span>
                      </div>
                    </a>

                    <a href="/inventory/medical-oxygen/issue" onClick={(e) => { if (isViewOnly) e.preventDefault(); }} title={isViewOnly ? 'View-only for Office Admin' : undefined} className={`group relative px-6 py-4 bg-white/20 backdrop-blur-xl rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-3 border border-white/30 overflow-hidden ${isViewOnly ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex items-center space-x-3">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center border border-amber-400/30">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <span className="text-slate-700 font-semibold">Issue</span>
                      </div>
                    </a>

                    <a href="/inventory/medical-oxygen/return" onClick={(e) => { if (isViewOnly) e.preventDefault(); }} title={isViewOnly ? 'View-only for Office Admin' : undefined} className={`group relative px-6 py-4 bg-white/20 backdrop-blur-xl rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-3 border border-white/30 overflow-hidden ${isViewOnly ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-400/30">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <span className="text-slate-700 font-semibold">Return</span>
                      </div>
                    </a>

                    <a href="/inventory/medical-oxygen/return-from-unit" onClick={(e) => { if (isViewOnly) e.preventDefault(); }} title={isViewOnly ? 'View-only for Office Admin' : undefined} className={`group relative px-6 py-4 bg-white/20 backdrop-blur-xl rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-3 border border-white/30 overflow-hidden ${isViewOnly ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-400/30">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        <span className="text-slate-700 font-semibold">Return from Unit</span>
                      </div>
                    </a>
                  </div>
          </div>
        </div>

        {/* Medical Oxygen Budget Usage */}
        <div className="mb-12">
          <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/30 bg-white/20">
              <h3 className="text-2xl font-bold text-slate-800">Medical Oxygen Budget Usage</h3>
              <p className="text-slate-600 mt-2">Monthly budget consumption and spending patterns (RM)</p>
            </div>
            
            <div className="p-8">
              {/* Budget Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-emerald-600">Total Budget</div>
                      <div className="text-xs text-slate-500">Annual</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-900">RM 1,250,000</div>
                  <div className="text-sm text-emerald-700 mt-1">Allocated for 2024</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">Used Budget</div>
                      <div className="text-xs text-slate-500">YTD</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">RM 847,500</div>
                  <div className="text-sm text-blue-700 mt-1">67.8% utilized</div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-amber-600">Monthly Avg</div>
                      <div className="text-xs text-slate-500">Spending</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-amber-900">RM 70,625</div>
                  <div className="text-sm text-amber-700 mt-1">Per month</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-purple-600">Remaining</div>
                      <div className="text-xs text-slate-500">Budget</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">RM 402,500</div>
                  <div className="text-sm text-purple-700 mt-1">Available</div>
                </div>
              </div>

              {/* Monthly Budget Chart */}
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 border border-white/30">
                <h4 className="text-lg font-semibold text-slate-800 mb-6">Monthly Budget Usage (RM)</h4>
                <div className="h-80 relative">
                  <svg className="w-full h-full" viewBox="0 0 800 300">
                    <defs>
                      <linearGradient id="budgetGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Y-axis grid lines and labels */}
                    <line x1="60" y1="20" x2="60" y2="260" stroke="#E5E7EB" strokeWidth="2"/>
                    <line x1="60" y1="260" x2="760" y2="260" stroke="#E5E7EB" strokeWidth="2"/>
                    
                    {/* Grid lines */}
                    <line x1="60" y1="60" x2="760" y2="60" stroke="#E5E7EB" strokeWidth="0.5"/>
                    <line x1="60" y1="100" x2="760" y2="100" stroke="#E5E7EB" strokeWidth="0.5"/>
                    <line x1="60" y1="140" x2="760" y2="140" stroke="#E5E7EB" strokeWidth="0.5"/>
                    <line x1="60" y1="180" x2="760" y2="180" stroke="#E5E7EB" strokeWidth="0.5"/>
                    <line x1="60" y1="220" x2="760" y2="220" stroke="#E5E7EB" strokeWidth="0.5"/>
                    
                    {/* Y-axis labels */}
                    <text x="50" y="25" fontSize="12" fill="#6B7280" textAnchor="end">120k</text>
                    <text x="50" y="65" fontSize="12" fill="#6B7280" textAnchor="end">100k</text>
                    <text x="50" y="105" fontSize="12" fill="#6B7280" textAnchor="end">80k</text>
                    <text x="50" y="145" fontSize="12" fill="#6B7280" textAnchor="end">60k</text>
                    <text x="50" y="185" fontSize="12" fill="#6B7280" textAnchor="end">40k</text>
                    <text x="50" y="225" fontSize="12" fill="#6B7280" textAnchor="end">20k</text>
                    <text x="50" y="265" fontSize="12" fill="#6B7280" textAnchor="end">0</text>
                    
                    {/* Budget line chart */}
                    <polyline
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="4"
                      points="120,200 180,180 240,160 300,140 360,120 420,100 480,110 540,90 600,80 660,70 720,60"
                    />
                    
                    {/* Area fill */}
                    <polygon
                      fill="url(#budgetGradient)"
                      points="120,260 120,200 180,180 240,160 300,140 360,120 420,100 480,110 540,90 600,80 660,70 720,60 720,260"
                    />
                    
                    {/* Data points */}
                    <circle cx="120" cy="200" r="6" fill="#3B82F6"/>
                    <circle cx="180" cy="180" r="6" fill="#3B82F6"/>
                    <circle cx="240" cy="160" r="6" fill="#3B82F6"/>
                    <circle cx="300" cy="140" r="6" fill="#3B82F6"/>
                    <circle cx="360" cy="120" r="6" fill="#3B82F6"/>
                    <circle cx="420" cy="100" r="6" fill="#3B82F6"/>
                    <circle cx="480" cy="110" r="6" fill="#3B82F6"/>
                    <circle cx="540" cy="90" r="6" fill="#3B82F6"/>
                    <circle cx="600" cy="80" r="6" fill="#3B82F6"/>
                    <circle cx="660" cy="70" r="6" fill="#3B82F6"/>
                    <circle cx="720" cy="60" r="6" fill="#3B82F6"/>
                    
                    {/* X-axis labels */}
                    <text x="120" y="285" fontSize="11" fill="#6B7280" textAnchor="middle">Jan</text>
                    <text x="180" y="285" fontSize="11" fill="#6B7280" textAnchor="middle">Feb</text>
                    <text x="240" y="285" fontSize="11" fill="#6B7280" textAnchor="middle">Mar</text>
                    <text x="300" y="285" fontSize="11" fill="#6B7280" textAnchor="middle">Apr</text>
                    <text x="360" y="285" fontSize="11" fill="#6B7280" textAnchor="middle">May</text>
                    <text x="420" y="285" fontSize="11" fill="#6B7280" textAnchor="middle">Jun</text>
                    <text x="480" y="285" fontSize="11" fill="#6B7280" textAnchor="middle">Jul</text>
                    <text x="540" y="285" fontSize="11" fill="#6B7280" textAnchor="middle">Aug</text>
                    <text x="600" y="285" fontSize="11" fill="#6B7280" textAnchor="middle">Sep</text>
                    <text x="660" y="285" fontSize="11" fill="#6B7280" textAnchor="middle">Oct</text>
                    <text x="720" y="285" fontSize="11" fill="#6B7280" textAnchor="middle">Nov</text>
                  </svg>
                </div>
                
                {/* Monthly Values */}
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2 mt-6 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 45k</div>
                    <div className="text-slate-500">Jan</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 55k</div>
                    <div className="text-slate-500">Feb</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 65k</div>
                    <div className="text-slate-500">Mar</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 75k</div>
                    <div className="text-slate-500">Apr</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 85k</div>
                    <div className="text-slate-500">May</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 95k</div>
                    <div className="text-slate-500">Jun</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 90k</div>
                    <div className="text-slate-500">Jul</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 80k</div>
                    <div className="text-slate-500">Aug</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 70k</div>
                    <div className="text-slate-500">Sep</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 60k</div>
                    <div className="text-slate-500">Oct</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 50k</div>
                    <div className="text-slate-500">Nov</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-800">RM 40k</div>
                    <div className="text-slate-500">Dec</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cylinder Balance */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-black text-slate-900">Cylinder Balance</h3>
            <div className="text-sm text-slate-600">
              <span className="font-semibold">BN = Bull Nose • PI = Pin Index • Private & Loan</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* BN 8.0 Loan */}
            <div className="group relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:bg-white/50 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm font-bold text-emerald-700 mb-2 uppercase tracking-wider">BN • LOAN</div>
                    <div className="text-4xl font-black text-slate-900">8</div>
                    <div className="text-xs text-slate-600 font-medium">m³ per cylinder</div>
                  </div>
                  <div className="w-14 h-14 bg-white/60 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-emerald-400/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl"></div>
                    <svg className="w-7 h-7 text-emerald-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Available:</span>
                    <span className="text-lg font-bold text-slate-800">50 cyl</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Empty:</span>
                    <span className="text-lg font-bold text-slate-800">12 cyl</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-emerald-600 text-sm font-semibold">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                  In Stock
                </div>
              </div>
            </div>

            {/* BN 6.4 Private */}
            <div className="group relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:bg-white/50 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm font-bold text-blue-700 mb-2 uppercase tracking-wider">BN • PRIVATE</div>
                    <div className="text-4xl font-black text-slate-900">6.4</div>
                    <div className="text-xs text-slate-600 font-medium">m³ per cylinder</div>
                  </div>
                  <div className="w-14 h-14 bg-white/60 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-blue-400/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl"></div>
                    <svg className="w-7 h-7 text-blue-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Available:</span>
                    <span className="text-lg font-bold text-slate-800">40 cyl</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Empty:</span>
                    <span className="text-lg font-bold text-slate-800">8 cyl</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-blue-600 text-sm font-semibold">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  In Stock
                </div>
              </div>
            </div>

            {/* PI 1.4 Loan */}
            <div className="group relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:bg-white/50 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm font-bold text-amber-700 mb-2 uppercase tracking-wider">PI • LOAN</div>
                    <div className="text-4xl font-black text-slate-900">1.4</div>
                    <div className="text-xs text-slate-600 font-medium">m³ per cylinder</div>
                  </div>
                  <div className="w-14 h-14 bg-white/60 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-amber-400/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl"></div>
                    <svg className="w-7 h-7 text-amber-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Available:</span>
                    <span className="text-lg font-bold text-slate-800">10 cyl</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Empty:</span>
                    <span className="text-lg font-bold text-slate-800">3 cyl</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-amber-600 text-sm font-semibold">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                  In Stock
                </div>
              </div>
            </div>

            {/* PI 1.4 Private */}
            <div className="group relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:bg-white/50 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm font-bold text-orange-700 mb-2 uppercase tracking-wider">PI • PRIVATE</div>
                    <div className="text-4xl font-black text-slate-900">1.4</div>
                    <div className="text-xs text-slate-600 font-medium">m³ per cylinder</div>
                  </div>
                  <div className="w-14 h-14 bg-white/60 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-orange-400/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl"></div>
                    <svg className="w-7 h-7 text-orange-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Available:</span>
                    <span className="text-lg font-bold text-slate-800">10 cyl</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Empty:</span>
                    <span className="text-lg font-bold text-slate-800">2 cyl</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-orange-600 text-sm font-semibold">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  In Stock
                </div>
              </div>
            </div>

            {/* PI 0.7 Private */}
            <div className="group relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:bg-white/50 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm font-bold text-pink-700 mb-2 uppercase tracking-wider">PI • PRIVATE</div>
                    <div className="text-4xl font-black text-slate-900">0.7</div>
                    <div className="text-xs text-slate-600 font-medium">m³ per cylinder</div>
                  </div>
                  <div className="w-14 h-14 bg-white/60 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-pink-400/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl"></div>
                    <svg className="w-7 h-7 text-pink-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Available:</span>
                    <span className="text-lg font-bold text-slate-800">5 cyl</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Empty:</span>
                    <span className="text-lg font-bold text-slate-800">1 cyl</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-pink-600 text-sm font-semibold">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
                  In Stock
                </div>
              </div>
            </div>

            {/* PI 0.5 Private */}
            <div className="group relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:bg-white/50 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm font-bold text-red-700 mb-2 uppercase tracking-wider">PI • PRIVATE</div>
                    <div className="text-4xl font-black text-slate-900">0.5</div>
                    <div className="text-xs text-slate-600 font-medium">m³ per cylinder</div>
                  </div>
                  <div className="w-14 h-14 bg-white/60 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-red-400/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-2xl"></div>
                    <svg className="w-7 h-7 text-red-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Available:</span>
                    <span className="text-lg font-bold text-slate-800">3 cyl</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Empty:</span>
                    <span className="text-lg font-bold text-slate-800">0 cyl</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-red-600 text-sm font-semibold">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  In Stock
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Oxygen Usage Analytics */}
        <div className="mb-12">
          <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/30 bg-white/20">
              <h3 className="text-2xl font-bold text-slate-800">Medical Oxygen Usage Analytics</h3>
              <p className="text-slate-600 mt-2">Quarterly usage patterns by oxygen type</p>
            </div>
            
            <div className="p-8">
              {/* Total Usage Summary */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-slate-800 mb-4">Total Annual Usage Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <div className="text-sm font-medium text-emerald-700">BN 8.0 - Loan</div>
                    <div className="text-2xl font-bold text-emerald-900">71 cyl</div>
                    <div className="text-xs text-emerald-600 mb-1">Annual total</div>
                    <div className="text-xs text-emerald-500">Avg: 5.9 cyl/month</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="text-sm font-medium text-blue-700">BN 6.4 - Private</div>
                    <div className="text-2xl font-bold text-blue-900">58 cyl</div>
                    <div className="text-xs text-blue-600 mb-1">Annual total</div>
                    <div className="text-xs text-blue-500">Avg: 4.8 cyl/month</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="text-sm font-medium text-amber-700">PI 1.4 - Loan</div>
                    <div className="text-2xl font-bold text-amber-900">39 cyl</div>
                    <div className="text-xs text-amber-600 mb-1">Annual total</div>
                    <div className="text-xs text-amber-500">Avg: 3.3 cyl/month</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <div className="text-sm font-medium text-red-700">PI 1.4 - Private</div>
                    <div className="text-2xl font-bold text-red-900">50 cyl</div>
                    <div className="text-xs text-red-600 mb-1">Annual total</div>
                    <div className="text-xs text-red-500">Avg: 4.2 cyl/month</div>
                  </div>
                  <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                    <div className="text-sm font-medium text-pink-700">PI 0.7 - Private</div>
                    <div className="text-2xl font-bold text-pink-900">31 cyl</div>
                    <div className="text-xs text-pink-600 mb-1">Annual total</div>
                    <div className="text-xs text-pink-500">Avg: 2.6 cyl/month</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <div className="text-sm font-medium text-purple-700">PI 0.5 - Private</div>
                    <div className="text-2xl font-bold text-purple-900">20 cyl</div>
                    <div className="text-xs text-purple-600 mb-1">Annual total</div>
                    <div className="text-xs text-purple-500">Avg: 1.7 cyl/month</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* BN 8.0 - Loan */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">BN 8.0 - Loan</h4>
                    <span className="text-xs text-slate-500">cyl/quarter</span>
                  </div>
                  <div className="h-40 relative">
                    <svg className="w-full h-full" viewBox="0 0 300 120">
                      <defs>
                        <linearGradient id="bn8loanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      {/* Y-axis grid lines and labels */}
                      <line x1="15" y1="20" x2="15" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="20" x2="300" y2="20" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="40" x2="300" y2="40" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="60" x2="300" y2="60" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="80" x2="300" y2="80" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="100" x2="300" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      
                      {/* Y-axis labels */}
                      <text x="10" y="25" fontSize="10" fill="#6B7280" textAnchor="end">25</text>
                      <text x="10" y="45" fontSize="10" fill="#6B7280" textAnchor="end">20</text>
                      <text x="10" y="65" fontSize="10" fill="#6B7280" textAnchor="end">15</text>
                      <text x="10" y="85" fontSize="10" fill="#6B7280" textAnchor="end">10</text>
                      <text x="10" y="105" fontSize="10" fill="#6B7280" textAnchor="end">5</text>
                      
                      <polyline
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3"
                        points="20,70 80,50 140,60 200,65"
                      />
                      <polygon
                        fill="url(#bn8loanGradient)"
                        points="20,100 20,70 80,50 140,60 200,65 200,100"
                      />
                      <circle cx="20" cy="70" r="4" fill="#10B981"/>
                      <circle cx="80" cy="50" r="4" fill="#10B981"/>
                      <circle cx="140" cy="60" r="4" fill="#10B981"/>
                      <circle cx="200" cy="65" r="4" fill="#10B981"/>
                    </svg>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-600">
                    <div className="text-center">
                      <div className="font-medium text-slate-800">15</div>
                      <div className="text-slate-500">Jan-Mar</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">22</div>
                      <div className="text-slate-500">Apr-Jun</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">18</div>
                      <div className="text-slate-500">Jul-Sep</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">16</div>
                      <div className="text-slate-500">Oct-Dec</div>
                    </div>
                  </div>
                </div>

                {/* BN 6.4 - Private */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">BN 6.4 - Private</h4>
                    <span className="text-xs text-slate-500">cyl/quarter</span>
                  </div>
                  <div className="h-40 relative">
                    <svg className="w-full h-full" viewBox="0 0 300 120">
                      <defs>
                        <linearGradient id="bn64Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      {/* Y-axis grid lines and labels */}
                      <line x1="15" y1="20" x2="15" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="20" x2="300" y2="20" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="40" x2="300" y2="40" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="60" x2="300" y2="60" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="80" x2="300" y2="80" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="100" x2="300" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      
                      {/* Y-axis labels */}
                      <text x="10" y="25" fontSize="10" fill="#6B7280" textAnchor="end">20</text>
                      <text x="10" y="45" fontSize="10" fill="#6B7280" textAnchor="end">15</text>
                      <text x="10" y="65" fontSize="10" fill="#6B7280" textAnchor="end">10</text>
                      <text x="10" y="85" fontSize="10" fill="#6B7280" textAnchor="end">5</text>
                      <text x="10" y="105" fontSize="10" fill="#6B7280" textAnchor="end">0</text>
                      
                      <polyline
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        points="20,80 80,60 140,70 200,75"
                      />
                      <polygon
                        fill="url(#bn64Gradient)"
                        points="20,100 20,80 80,60 140,70 200,75 200,100"
                      />
                      <circle cx="20" cy="80" r="4" fill="#3B82F6"/>
                      <circle cx="80" cy="60" r="4" fill="#3B82F6"/>
                      <circle cx="140" cy="70" r="4" fill="#3B82F6"/>
                      <circle cx="200" cy="75" r="4" fill="#3B82F6"/>
                    </svg>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-600">
                    <div className="text-center">
                      <div className="font-medium text-slate-800">12</div>
                      <div className="text-slate-500">Jan-Mar</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">18</div>
                      <div className="text-slate-500">Apr-Jun</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">15</div>
                      <div className="text-slate-500">Jul-Sep</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">13</div>
                      <div className="text-slate-500">Oct-Dec</div>
                    </div>
                  </div>
                </div>

                {/* PI 1.4 - Loan */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">PI 1.4 - Loan</h4>
                    <span className="text-xs text-slate-500">cyl/quarter</span>
                  </div>
                  <div className="h-40 relative">
                    <svg className="w-full h-full" viewBox="0 0 300 120">
                      <defs>
                        <linearGradient id="pi14loanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      {/* Y-axis grid lines and labels */}
                      <line x1="15" y1="20" x2="15" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="20" x2="300" y2="20" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="40" x2="300" y2="40" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="60" x2="300" y2="60" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="80" x2="300" y2="80" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="100" x2="300" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      
                      {/* Y-axis labels */}
                      <text x="10" y="25" fontSize="10" fill="#6B7280" textAnchor="end">15</text>
                      <text x="10" y="45" fontSize="10" fill="#6B7280" textAnchor="end">12</text>
                      <text x="10" y="65" fontSize="10" fill="#6B7280" textAnchor="end">8</text>
                      <text x="10" y="85" fontSize="10" fill="#6B7280" textAnchor="end">4</text>
                      <text x="10" y="105" fontSize="10" fill="#6B7280" textAnchor="end">0</text>
                      
                      <polyline
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="3"
                        points="20,90 80,70 140,80 200,85"
                      />
                      <polygon
                        fill="url(#pi14loanGradient)"
                        points="20,100 20,90 80,70 140,80 200,85 200,100"
                      />
                      <circle cx="20" cy="90" r="4" fill="#F59E0B"/>
                      <circle cx="80" cy="70" r="4" fill="#F59E0B"/>
                      <circle cx="140" cy="80" r="4" fill="#F59E0B"/>
                      <circle cx="200" cy="85" r="4" fill="#F59E0B"/>
                    </svg>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-600">
                    <div className="text-center">
                      <div className="font-medium text-slate-800">8</div>
                      <div className="text-slate-500">Jan-Mar</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">12</div>
                      <div className="text-slate-500">Apr-Jun</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">10</div>
                      <div className="text-slate-500">Jul-Sep</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">9</div>
                      <div className="text-slate-500">Oct-Dec</div>
                    </div>
                  </div>
                </div>

                {/* PI 1.4 - Private */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">PI 1.4 - Private</h4>
                    <span className="text-xs text-slate-500">cyl/quarter</span>
                  </div>
                  <div className="h-40 relative">
                    <svg className="w-full h-full" viewBox="0 0 300 120">
                      <defs>
                        <linearGradient id="pi14privateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      {/* Y-axis grid lines and labels */}
                      <line x1="15" y1="20" x2="15" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="20" x2="300" y2="20" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="40" x2="300" y2="40" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="60" x2="300" y2="60" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="80" x2="300" y2="80" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="100" x2="300" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      
                      {/* Y-axis labels */}
                      <text x="10" y="25" fontSize="10" fill="#6B7280" textAnchor="end">20</text>
                      <text x="10" y="45" fontSize="10" fill="#6B7280" textAnchor="end">15</text>
                      <text x="10" y="65" fontSize="10" fill="#6B7280" textAnchor="end">10</text>
                      <text x="10" y="85" fontSize="10" fill="#6B7280" textAnchor="end">5</text>
                      <text x="10" y="105" fontSize="10" fill="#6B7280" textAnchor="end">0</text>
                      
                      <polyline
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="3"
                        points="20,85 80,65 140,75 200,80"
                      />
                      <polygon
                        fill="url(#pi14privateGradient)"
                        points="20,100 20,85 80,65 140,75 200,80 200,100"
                      />
                      <circle cx="20" cy="85" r="4" fill="#EF4444"/>
                      <circle cx="80" cy="65" r="4" fill="#EF4444"/>
                      <circle cx="140" cy="75" r="4" fill="#EF4444"/>
                      <circle cx="200" cy="80" r="4" fill="#EF4444"/>
                    </svg>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-600">
                    <div className="text-center">
                      <div className="font-medium text-slate-800">10</div>
                      <div className="text-slate-500">Jan-Mar</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">16</div>
                      <div className="text-slate-500">Apr-Jun</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">13</div>
                      <div className="text-slate-500">Jul-Sep</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">11</div>
                      <div className="text-slate-500">Oct-Dec</div>
                    </div>
                  </div>
                </div>

                {/* PI 0.7 - Private */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">PI 0.7 - Private</h4>
                    <span className="text-xs text-slate-500">cyl/quarter</span>
                  </div>
                  <div className="h-40 relative">
                    <svg className="w-full h-full" viewBox="0 0 300 120">
                      <defs>
                        <linearGradient id="pi07Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#EC4899" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#EC4899" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      {/* Y-axis grid lines and labels */}
                      <line x1="15" y1="20" x2="15" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="20" x2="300" y2="20" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="40" x2="300" y2="40" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="60" x2="300" y2="60" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="80" x2="300" y2="80" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="100" x2="300" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      
                      {/* Y-axis labels */}
                      <text x="10" y="25" fontSize="10" fill="#6B7280" textAnchor="end">12</text>
                      <text x="10" y="45" fontSize="10" fill="#6B7280" textAnchor="end">10</text>
                      <text x="10" y="65" fontSize="10" fill="#6B7280" textAnchor="end">8</text>
                      <text x="10" y="85" fontSize="10" fill="#6B7280" textAnchor="end">4</text>
                      <text x="10" y="105" fontSize="10" fill="#6B7280" textAnchor="end">0</text>
                      
                      <polyline
                        fill="none"
                        stroke="#EC4899"
                        strokeWidth="3"
                        points="20,95 80,75 140,85 200,90"
                      />
                      <polygon
                        fill="url(#pi07Gradient)"
                        points="20,100 20,95 80,75 140,85 200,90 200,100"
                      />
                      <circle cx="20" cy="95" r="4" fill="#EC4899"/>
                      <circle cx="80" cy="75" r="4" fill="#EC4899"/>
                      <circle cx="140" cy="85" r="4" fill="#EC4899"/>
                      <circle cx="200" cy="90" r="4" fill="#EC4899"/>
                    </svg>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-600">
                    <div className="text-center">
                      <div className="font-medium text-slate-800">6</div>
                      <div className="text-slate-500">Jan-Mar</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">10</div>
                      <div className="text-slate-500">Apr-Jun</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">8</div>
                      <div className="text-slate-500">Jul-Sep</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">7</div>
                      <div className="text-slate-500">Oct-Dec</div>
                    </div>
                  </div>
                </div>

                {/* PI 0.5 - Private */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">PI 0.5 - Private</h4>
                    <span className="text-xs text-slate-500">cyl/quarter</span>
                  </div>
                  <div className="h-40 relative">
                    <svg className="w-full h-full" viewBox="0 0 300 120">
                      <defs>
                        <linearGradient id="pi05Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      {/* Y-axis grid lines and labels */}
                      <line x1="15" y1="20" x2="15" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="20" x2="300" y2="20" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="15" y1="40" x2="300" y2="40" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="60" x2="300" y2="60" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="80" x2="300" y2="80" stroke="#E5E7EB" strokeWidth="0.5"/>
                      <line x1="15" y1="100" x2="300" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                      
                      {/* Y-axis labels */}
                      <text x="10" y="25" fontSize="10" fill="#6B7280" textAnchor="end">8</text>
                      <text x="10" y="45" fontSize="10" fill="#6B7280" textAnchor="end">6</text>
                      <text x="10" y="65" fontSize="10" fill="#6B7280" textAnchor="end">4</text>
                      <text x="10" y="85" fontSize="10" fill="#6B7280" textAnchor="end">2</text>
                      <text x="10" y="105" fontSize="10" fill="#6B7280" textAnchor="end">0</text>
                      
                      <polyline
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="3"
                        points="20,100 80,80 140,90 200,95"
                      />
                      <polygon
                        fill="url(#pi05Gradient)"
                        points="20,100 20,100 80,80 140,90 200,95 200,100"
                      />
                      <circle cx="20" cy="100" r="4" fill="#8B5CF6"/>
                      <circle cx="80" cy="80" r="4" fill="#8B5CF6"/>
                      <circle cx="140" cy="90" r="4" fill="#8B5CF6"/>
                      <circle cx="200" cy="95" r="4" fill="#8B5CF6"/>
                    </svg>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-600">
                    <div className="text-center">
                      <div className="font-medium text-slate-800">4</div>
                      <div className="text-slate-500">Jan-Mar</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">7</div>
                      <div className="text-slate-500">Apr-Jun</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">5</div>
                      <div className="text-slate-500">Jul-Sep</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-800">4</div>
                      <div className="text-slate-500">Oct-Dec</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}