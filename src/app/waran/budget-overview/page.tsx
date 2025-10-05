'use client';

export default function BudgetOverviewPage() {

  const budgetItems = [
    // APPL Budgets
    { id: 1, name: 'DRUG', description: 'Critical medications and treatments', type: 'APPL', icon: 'D', total: 410000, used: 298500, balance: 111500, usage: 73, color: 'blue' },
    { id: 2, name: 'NON DRUG', description: 'Disposables and consumables', type: 'APPL', icon: 'N', total: 150000, used: 98500, balance: 51500, usage: 66, color: 'green' },
    { id: 3, name: 'VACCINE', description: 'Medical devices and tools', type: 'APPL', icon: 'V', total: 10000, used: 7200, balance: 2800, usage: 72, color: 'purple' },
    
    // Contract Budgets
    { id: 4, name: 'Contract Drug', description: 'Contractual Drugs', type: 'Contract', icon: 'C', total: 77000, used: 45800, balance: 31200, usage: 59, color: 'cyan' },
    { id: 5, name: 'Contract Non-Drug', description: 'Contractual Supplies', type: 'Contract', icon: 'S', total: 70000, used: 42000, balance: 28000, usage: 60, color: 'orange' },
    { id: 6, name: 'Oxygen', description: 'Medical Oxygen', type: 'Contract', icon: 'O', total: 140000, used: 84000, balance: 56000, usage: 60, color: 'teal' },
    { id: 7, name: 'ETU', description: 'Emergency Dept', type: 'Contract', icon: 'E', total: 40000, used: 22000, balance: 18000, usage: 55, color: 'pink' },
    { id: 8, name: 'GW', description: 'General Ward', type: 'Contract', icon: 'G', total: 45000, used: 24750, balance: 20250, usage: 55, color: 'pink' },
    { id: 9, name: 'Anaes', description: 'Anesthesiology', type: 'Contract', icon: 'A', total: 36000, used: 19800, balance: 16200, usage: 55, color: 'pink' },
    { id: 10, name: 'Rehab', description: 'Rehabilitation', type: 'Contract', icon: 'R', total: 40000, used: 22650, balance: 17350, usage: 57, color: 'pink' },
    { id: 11, name: 'Insulin', description: 'Diabetes Mgmt', type: 'Contract', icon: 'I', total: 2000, used: 1200, balance: 800, usage: 60, color: 'blue' },
    { id: 12, name: 'Vaksin', description: 'Contract Vaccine', type: 'Contract', icon: 'V', total: 10000, used: 6000, balance: 4000, usage: 60, color: 'purple' },
    { id: 13, name: 'Hep C', description: 'Hepatitis C', type: 'Contract', icon: 'H', total: 2000, used: 1200, balance: 800, usage: 60, color: 'green' },
    
    // Specialized Services
    { id: 14, name: 'Nephro Drug', description: 'Nephro Pharmaceuticals', type: 'Specialized', icon: 'N', total: 75000, used: 47250, balance: 27750, usage: 63, color: 'red' },
    { id: 15, name: 'Nephro Non-Drug', description: 'Nephro Supplies', type: 'Specialized', icon: 'N', total: 50000, used: 31250, balance: 18750, usage: 63, color: 'red' },
    { id: 16, name: 'Pathology', description: 'Lab Services', type: 'Specialized', icon: 'P', total: 72000, used: 43200, balance: 28800, usage: 60, color: 'indigo' },
    { id: 17, name: 'X-Ray', description: 'Radiology', type: 'Specialized', icon: 'X', total: 10000, used: 6000, balance: 4000, usage: 60, color: 'teal' },
    { id: 18, name: 'Wound Care', description: 'Wound Mgmt', type: 'Specialized', icon: 'W', total: 15000, used: 9000, balance: 6000, usage: 60, color: 'emerald' },
    { id: 19, name: 'CSSU/CSSD', description: 'Sterile Services', type: 'Specialized', icon: 'C', total: 6000, used: 3600, balance: 2400, usage: 60, color: 'orange' },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', icon: 'from-blue-500 to-blue-600', text: 'text-blue-600', progress: 'from-blue-500 to-blue-600' },
      green: { bg: 'from-green-50 to-green-100', border: 'border-green-200', icon: 'from-green-500 to-green-600', text: 'text-green-600', progress: 'from-green-500 to-green-600' },
      purple: { bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', icon: 'from-purple-500 to-purple-600', text: 'text-purple-600', progress: 'from-purple-500 to-purple-600' },
      cyan: { bg: 'from-cyan-50 to-cyan-100', border: 'border-cyan-200', icon: 'from-cyan-500 to-cyan-600', text: 'text-cyan-600', progress: 'from-cyan-500 to-cyan-600' },
      orange: { bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', icon: 'from-orange-500 to-orange-600', text: 'text-orange-600', progress: 'from-orange-500 to-orange-600' },
      teal: { bg: 'from-teal-50 to-teal-100', border: 'border-teal-200', icon: 'from-teal-500 to-teal-600', text: 'text-teal-600', progress: 'from-teal-500 to-teal-600' },
      pink: { bg: 'from-pink-50 to-pink-100', border: 'border-pink-200', icon: 'from-pink-500 to-pink-600', text: 'text-pink-600', progress: 'from-pink-500 to-pink-600' },
      red: { bg: 'from-red-50 to-red-100', border: 'border-red-200', icon: 'from-red-500 to-red-600', text: 'text-red-600', progress: 'from-red-500 to-red-600' },
      indigo: { bg: 'from-indigo-50 to-indigo-100', border: 'border-indigo-200', icon: 'from-indigo-500 to-indigo-600', text: 'text-indigo-600', progress: 'from-indigo-500 to-indigo-600' },
      emerald: { bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', icon: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', progress: 'from-emerald-500 to-emerald-600' },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `RM ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `RM ${(amount / 1000).toFixed(0)}K`;
    }
    return `RM ${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-4 sm:p-6" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto space-y-8" suppressHydrationWarning>
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 sm:p-10" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <div className="flex items-center gap-3 mb-2" suppressHydrationWarning>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div suppressHydrationWarning>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Financial Overview
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base font-medium">Comprehensive budget allocation and utilization tracking</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4" suppressHydrationWarning>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200" suppressHydrationWarning>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live Data</span>
              </div>
              <button className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm flex items-center gap-2" suppressHydrationWarning>
                <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Modern Budget Dashboard */}
        <div className="relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50"></div>
          {/* Dashboard Header */}
          <div className="relative px-8 py-8 border-b border-gray-200/30 bg-gradient-to-r from-white/80 to-gray-50/80" suppressHydrationWarning>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6" suppressHydrationWarning>
              <div suppressHydrationWarning>
                <div className="flex items-center gap-3 mb-2" suppressHydrationWarning>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div suppressHydrationWarning>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Budget Allocation Dashboard
                    </h2>
                    <p className="text-gray-600 mt-1 text-sm font-medium">Real-time budget tracking with interactive analytics</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6" suppressHydrationWarning>
                <div className="text-right" suppressHydrationWarning>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Budget</div>
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">RM 1,310,000</div>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200 shadow-sm" suppressHydrationWarning>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Summary Cards */}
          <div className="p-6 sm:p-8" suppressHydrationWarning>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16" suppressHydrationWarning>
              {/* APPL Budget Summary */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50/80 to-blue-100/60 backdrop-blur-sm border border-blue-200/50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]" suppressHydrationWarning>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6" suppressHydrationWarning>
                    <div className="flex items-center space-x-4" suppressHydrationWarning>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300">
                        A
                      </div>
                      <div suppressHydrationWarning>
                        <h3 className="text-xl font-bold text-gray-900">APPL Budgets</h3>
                        <p className="text-sm text-blue-600 font-medium">Annual Procurement</p>
                      </div>
                    </div>
                    <div className="text-right" suppressHydrationWarning>
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">RM 570K</div>
                      <div className="text-sm text-blue-600 font-semibold">71% used</div>
                    </div>
                  </div>
                  <div className="space-y-4" suppressHydrationWarning>
                    <div className="flex justify-between items-center" suppressHydrationWarning>
                      <span className="text-sm font-medium text-gray-600">Budget Utilization</span>
                      <span className="text-lg font-bold text-blue-600">RM 404,200</span>
                    </div>
                    <div className="w-full bg-blue-200/40 rounded-full h-3 overflow-hidden" suppressHydrationWarning>
                      <div className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-full transition-all duration-1000 ease-out shadow-sm" style={{width: '71%'}}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500" suppressHydrationWarning>
                      <span>Remaining: RM 165,800</span>
                      <span>29% available</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Budget Summary */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-green-50/80 to-green-100/60 backdrop-blur-sm border border-green-200/50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]" suppressHydrationWarning>
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6" suppressHydrationWarning>
                    <div className="flex items-center space-x-4" suppressHydrationWarning>
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300">
                        C
                      </div>
                      <div suppressHydrationWarning>
                        <h3 className="text-xl font-bold text-gray-900">Contract Budgets</h3>
                        <p className="text-sm text-green-600 font-medium">Contractual Services</p>
                      </div>
                    </div>
                    <div className="text-right" suppressHydrationWarning>
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">RM 481K</div>
                      <div className="text-sm text-green-600 font-semibold">60% used</div>
                    </div>
                  </div>
                  <div className="space-y-4" suppressHydrationWarning>
                    <div className="flex justify-between items-center" suppressHydrationWarning>
                      <span className="text-sm font-medium text-gray-600">Budget Utilization</span>
                      <span className="text-lg font-bold text-green-600">RM 288,350</span>
                    </div>
                    <div className="w-full bg-green-200/40 rounded-full h-3 overflow-hidden" suppressHydrationWarning>
                      <div className="h-full bg-gradient-to-r from-green-500 via-green-600 to-green-700 rounded-full transition-all duration-1000 ease-out shadow-sm" style={{width: '60%'}}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500" suppressHydrationWarning>
                      <span>Remaining: RM 192,650</span>
                      <span>40% available</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialized Budget Summary */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50/80 to-purple-100/60 backdrop-blur-sm border border-purple-200/50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]" suppressHydrationWarning>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6" suppressHydrationWarning>
                    <div className="flex items-center space-x-4" suppressHydrationWarning>
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300">
                        S
                      </div>
                      <div suppressHydrationWarning>
                        <h3 className="text-xl font-bold text-gray-900">Specialized Services</h3>
                        <p className="text-sm text-purple-600 font-medium">Specialized Care</p>
                      </div>
                    </div>
                    <div className="text-right" suppressHydrationWarning>
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">RM 228K</div>
                      <div className="text-sm text-purple-600 font-semibold">62% used</div>
                    </div>
                  </div>
                  <div className="space-y-4" suppressHydrationWarning>
                    <div className="flex justify-between items-center" suppressHydrationWarning>
                      <span className="text-sm font-medium text-gray-600">Budget Utilization</span>
                      <span className="text-lg font-bold text-purple-600">RM 140,900</span>
                    </div>
                    <div className="w-full bg-purple-200/40 rounded-full h-3 overflow-hidden" suppressHydrationWarning>
                      <div className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 rounded-full transition-all duration-1000 ease-out shadow-sm" style={{width: '62%'}}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500" suppressHydrationWarning>
                      <span>Remaining: RM 87,100</span>
                      <span>38% available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Budget Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" suppressHydrationWarning>
              {budgetItems.map((item) => {
                const colors = getColorClasses(item.color);
                return (
                  <div key={item.id} className={`group relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border ${colors.border} hover:border-opacity-80 hover:-translate-y-2 hover:scale-[1.02] min-h-[280px]`} suppressHydrationWarning>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      {/* Header Section */}
                      <div className="mb-6" suppressHydrationWarning>
                        <div className="flex items-center space-x-4 mb-4" suppressHydrationWarning>
                          <div className={`w-14 h-14 bg-gradient-to-br ${colors.icon} rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0" suppressHydrationWarning>
                            <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 break-words">{item.name}</h3>
                            <p className={`text-sm ${colors.text} font-medium leading-tight break-words`}>{item.description}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mb-4" suppressHydrationWarning>
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border} shadow-sm`}>
                            {item.type}
                          </div>
                          <div className="text-right" suppressHydrationWarning>
                            <span className={`text-2xl font-bold ${colors.text}`}>{item.usage}%</span>
                            <p className="text-xs text-gray-500 font-medium">utilized</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Usage Progress Bar */}
                      <div className="mb-6" suppressHydrationWarning>
                        <div className="w-full bg-gray-200/60 rounded-full h-3 overflow-hidden shadow-inner" suppressHydrationWarning>
                          <div className={`h-full bg-gradient-to-r ${colors.progress} rounded-full transition-all duration-1000 ease-out shadow-sm`} style={{width: `${item.usage}%`}}></div>
                        </div>
                      </div>
                      
                      {/* Financial Details */}
                      <div className="space-y-3" suppressHydrationWarning>
                        <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-gray-50/80 to-gray-100/60 rounded-2xl border border-gray-200/50" suppressHydrationWarning>
                          <div suppressHydrationWarning>
                            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total</span>
                            <p className="font-bold text-gray-900 text-sm">{formatCurrency(item.total)}</p>
                          </div>
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center" suppressHydrationWarning>
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-orange-50/80 to-orange-100/60 rounded-2xl border border-orange-200/50" suppressHydrationWarning>
                          <div suppressHydrationWarning>
                            <span className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Used</span>
                            <p className="font-bold text-orange-600 text-sm">{formatCurrency(item.used)}</p>
                          </div>
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center" suppressHydrationWarning>
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-green-50/80 to-green-100/60 rounded-2xl border border-green-200/50" suppressHydrationWarning>
                          <div suppressHydrationWarning>
                            <span className="text-xs text-green-600 font-semibold uppercase tracking-wide">Balance</span>
                            <p className="font-bold text-green-600 text-sm">{formatCurrency(item.balance)}</p>
                          </div>
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center" suppressHydrationWarning>
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
