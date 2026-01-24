export default function MedicalOxygenDeliveriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100">
      <div className=" p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Medical Oxygen Deliveries</h1>
              <p className="text-slate-600 mt-1">Manage incoming and outgoing oxygen cylinder deliveries</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl shadow-lg border border-amber-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Pending Deliveries</p>
                <p className="text-3xl font-bold text-amber-900 mt-2">3</p>
                <p className="text-xs text-amber-600 mt-1">Awaiting arrival</p>
              </div>
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl shadow-lg border border-emerald-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">This Week</p>
                <p className="text-3xl font-bold text-emerald-900 mt-2">8</p>
                <p className="text-xs text-emerald-600 mt-1">Deliveries received</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border border-blue-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">This Month</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">24</p>
                <p className="text-xs text-blue-600 mt-1">Total deliveries</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-lg border border-purple-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Overdue</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">1</p>
                <p className="text-xs text-purple-600 mt-1">Delayed deliveries</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Status Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white rounded-md shadow-sm">
              Pending Deliveries
            </button>
            <button className="flex-1 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
              In Transit
            </button>
            <button className="flex-1 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
              Completed
            </button>
            <button className="flex-1 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
              All Deliveries
            </button>
          </div>
        </div>

        {/* Pending Deliveries Table */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Pending Deliveries</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Delivery ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Supplier</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Order Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Expected Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Cylinders</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-mono text-slate-700">DEL-2024-001</td>
                  <td className="py-3 px-4 text-sm text-slate-700">Air Liquide</td>
                  <td className="py-3 px-4 text-sm text-slate-700">2024-01-10</td>
                  <td className="py-3 px-4 text-sm text-slate-700">2024-01-16</td>
                  <td className="py-3 px-4 text-sm text-slate-700">4x F Size, 2x N Size</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Track</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-mono text-slate-700">DEL-2024-002</td>
                  <td className="py-3 px-4 text-sm text-slate-700">Linde Gas</td>
                  <td className="py-3 px-4 text-sm text-slate-700">2024-01-12</td>
                  <td className="py-3 px-4 text-sm text-slate-700">2024-01-18</td>
                  <td className="py-3 px-4 text-sm text-slate-700">6x D Size, 4x E Size</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Track</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-mono text-slate-700">DEL-2024-003</td>
                  <td className="py-3 px-4 text-sm text-slate-700">BOC</td>
                  <td className="py-3 px-4 text-sm text-slate-700">2024-01-14</td>
                  <td className="py-3 px-4 text-sm text-slate-700">2024-01-20</td>
                  <td className="py-3 px-4 text-sm text-slate-700">2x HS Size, 3x F Size</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Overdue
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-red-600 hover:text-red-800 text-sm font-medium">Contact</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Deliveries</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">DEL-2024-000</div>
                  <div className="text-sm text-slate-500">Air Liquide • 2024-01-15</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">5x F Size, 2x N Size</div>
                <div className="text-xs text-slate-500">Completed</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">DEL-2024-001</div>
                  <div className="text-sm text-slate-500">Linde Gas • 2024-01-14</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">8x D Size, 4x E Size</div>
                <div className="text-xs text-slate-500">Completed</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">DEL-2024-002</div>
                  <div className="text-sm text-slate-500">BOC • 2024-01-13</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">3x HS Size, 6x F Size</div>
                <div className="text-xs text-slate-500">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
