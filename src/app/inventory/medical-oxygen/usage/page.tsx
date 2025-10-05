export default function MedicalOxygenUsagePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Medical Oxygen Usage</h1>
              <p className="text-slate-600 mt-1">Track consumption patterns and usage trends</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl shadow-lg border border-emerald-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Daily Usage</p>
                <p className="text-3xl font-bold text-emerald-900 mt-2">45.2</p>
                <p className="text-xs text-emerald-600 mt-1">m³ per day</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border border-blue-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Weekly Average</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">316.4</p>
                <p className="text-xs text-blue-600 mt-1">m³ per week</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl shadow-lg border border-amber-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Monthly Average</p>
                <p className="text-3xl font-bold text-amber-900 mt-2">1,356</p>
                <p className="text-xs text-amber-600 mt-1">m³ per month</p>
              </div>
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-lg border border-purple-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Peak Usage</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">67.8</p>
                <p className="text-xs text-purple-600 mt-1">m³ peak day</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Usage Trend Chart */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Usage Trend (Last 30 Days)</h3>
            <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-slate-500">Usage trend chart will be displayed here</p>
              </div>
            </div>
          </div>

          {/* Department Usage */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Usage by Department</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="font-medium text-slate-700">ICU</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">18.5 m³</div>
                  <div className="text-sm text-slate-500">41% of total</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-slate-700">Operating Theater</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">12.3 m³</div>
                  <div className="text-sm text-slate-500">27% of total</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="font-medium text-slate-700">Emergency</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">8.7 m³</div>
                  <div className="text-sm text-slate-500">19% of total</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="font-medium text-slate-700">Ward A & B</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">5.7 m³</div>
                  <div className="text-sm text-slate-500">13% of total</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage History Table */}
        <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Usage History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Cylinder Used</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Volume (m³)</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-700">2024-01-15</td>
                  <td className="py-3 px-4 text-sm text-slate-700">ICU</td>
                  <td className="py-3 px-4 text-sm text-slate-700">PRIV-HS-Bull-001</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900">6.4</td>
                  <td className="py-3 px-4 text-sm text-slate-700">8 hours</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Completed
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-700">2024-01-15</td>
                  <td className="py-3 px-4 text-sm text-slate-700">Operating Theater</td>
                  <td className="py-3 px-4 text-sm text-slate-700">LOAN-F-Bull-001</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900">1.4</td>
                  <td className="py-3 px-4 text-sm text-slate-700">3 hours</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Completed
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-700">2024-01-14</td>
                  <td className="py-3 px-4 text-sm text-slate-700">Emergency</td>
                  <td className="py-3 px-4 text-sm text-slate-700">PRIV-E-Pin-001</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900">0.7</td>
                  <td className="py-3 px-4 text-sm text-slate-700">2 hours</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      In Progress
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-700">2024-01-14</td>
                  <td className="py-3 px-4 text-sm text-slate-700">Ward A</td>
                  <td className="py-3 px-4 text-sm text-slate-700">PRIV-D-Bull-001</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900">0.5</td>
                  <td className="py-3 px-4 text-sm text-slate-700">4 hours</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Completed
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
