import { KpiCard } from '../components/KpiCard';
import { FastMovingTable } from '../components/FastMovingTable';
import { Section } from '../components/Section';
import { HeaderHero } from '../components/HeaderHero';
import { fetchDashboardKpis, fetchFastMovingItems, fetchSlowMovingItems, fetchLowStockItems, fetchExpiringBatchesSoon, fetchOpsAlerts } from '../services/mockInventory';

export default async function PharmacyLogisticsDashboard() {
  const [kpis, fastMovingItems, slowMovingItems, lowStock, expiringSoon, ops] = await Promise.all([
    fetchDashboardKpis(),
    fetchFastMovingItems(),
    fetchSlowMovingItems(),
    fetchLowStockItems(),
    fetchExpiringBatchesSoon(),
    fetchOpsAlerts(),
  ]);

  // Pre-process data to avoid hydration mismatches
  const fastMovingDrugs = fastMovingItems.filter(item => item.category === 'Drug').slice(0, 5);
  const fastMovingNonDrugs = fastMovingItems.filter(item => item.category === 'Non-drug').slice(0, 5);
  const slowMovingDrugs = slowMovingItems.filter(item => item.category === 'Drug').slice(0, 5);
  const slowMovingNonDrugs = slowMovingItems.filter(item => item.category === 'Non-drug').slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden" suppressHydrationWarning>
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden" suppressHydrationWarning>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/5 to-blue-500/5 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-green-400/5 to-emerald-500/5 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.05)_1px,transparent_0)] bg-[size:32px_32px]" suppressHydrationWarning></div>
        {/* Modern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20" suppressHydrationWarning></div>
      </div>

      <div className="relative z-10 space-y-8 p-6" suppressHydrationWarning>
      <HeaderHero />

        {/* Modern KPI Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6" suppressHydrationWarning>
          <div className="group relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-3xl" suppressHydrationWarning></div>
            <div className="relative p-6" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
                <div className="relative group/icon" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 backdrop-blur-sm rounded-full border border-green-500/20" suppressHydrationWarning>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
                </div>
              </div>
              <div className="text-center" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 mb-2">Pending Request</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">{ops.pendingDepartmentRequests}</p>
                <div className="relative h-2 bg-gray-200/60 rounded-full overflow-hidden" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg animate-pulse" style={{width: '75%'}} suppressHydrationWarning></div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-3xl" suppressHydrationWarning></div>
            <div className="relative p-6" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
                <div className="relative group/icon" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 backdrop-blur-sm rounded-full border border-green-500/20" suppressHydrationWarning>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
                </div>
              </div>
              <div className="text-center" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 mb-2" style={{textAlign: 'center'}}>Pending LPO</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3" style={{textAlign: 'center'}}>{ops.longOpenOrders}</p>
                <div className="relative h-2 bg-gray-200/60 rounded-full overflow-hidden" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full shadow-lg animate-pulse" style={{width: '60%'}} suppressHydrationWarning></div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-white via-cyan-50/20 to-blue-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-3xl" suppressHydrationWarning></div>
            <div className="relative p-6" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
                <div className="relative group/icon" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 backdrop-blur-sm rounded-full border border-green-500/20" suppressHydrationWarning>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
                </div>
              </div>
              <div className="text-center" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 mb-2">Pending Deliveries</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">{ops.receivedNotPaid}</p>
                <div className="relative h-2 bg-gray-200/60 rounded-full overflow-hidden" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg animate-pulse" style={{width: '85%'}} suppressHydrationWarning></div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-3xl" suppressHydrationWarning></div>
            <div className="relative p-6" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
                <div className="relative group/icon" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 backdrop-blur-sm rounded-full border border-green-500/20" suppressHydrationWarning>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
                </div>
              </div>
              <div className="text-center" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 mb-2">Pending Payment</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">{ops.receivedNotPaid}</p>
                <div className="relative h-2 bg-gray-200/60 rounded-full overflow-hidden" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg animate-pulse" style={{width: '70%'}} suppressHydrationWarning></div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-3xl" suppressHydrationWarning></div>
            <div className="relative p-6" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
                <div className="relative group/icon" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 backdrop-blur-sm rounded-full border border-green-500/20" suppressHydrationWarning>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
                </div>
              </div>
              <div className="text-center" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 mb-2">Pending Approval</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">{ops.pendingApproval}</p>
                <div className="relative h-2 bg-gray-200/60 rounded-full overflow-hidden" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full shadow-lg animate-pulse" style={{width: '90%'}} suppressHydrationWarning></div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-white via-red-50/20 to-orange-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-3xl" suppressHydrationWarning></div>
            <div className="relative p-6" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
                <div className="relative group/icon" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 backdrop-blur-sm rounded-full border border-green-500/20" suppressHydrationWarning>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
                </div>
              </div>
              <div className="text-center" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 mb-2">Pending Penalty</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">{ops.overdueDeliveries}</p>
                <div className="relative h-2 bg-gray-200/60 rounded-full overflow-hidden" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 rounded-full shadow-lg animate-pulse" style={{width: '45%'}} suppressHydrationWarning></div>
                </div>
              </div>
            </div>
          </div>
      </section>

        {/* Modern Content Grid */}
      <section className="grid gap-8 lg:grid-cols-3" suppressHydrationWarning>
          <div className="lg:col-span-2 space-y-8" suppressHydrationWarning>
            <div className="group relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]" suppressHydrationWarning>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
              <div className="relative p-8 border-b border-white/40" suppressHydrationWarning>
                <div className="flex items-center gap-6" suppressHydrationWarning>
                  <div className="relative group/icon" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                    <div className="relative h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    </div>
                  </div>
                  <div suppressHydrationWarning>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">Fast Moving Drugs</h2>
                    <p className="text-sm text-gray-600 mt-1">Top performing pharmaceutical items by movement volume</p>
                  </div>
                </div>
              </div>
              <div className="relative p-8" suppressHydrationWarning>
                <FastMovingTable items={fastMovingDrugs} />
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]" suppressHydrationWarning>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
              <div className="relative p-8 border-b border-white/40" suppressHydrationWarning>
                <div className="flex items-center gap-6" suppressHydrationWarning>
                  <div className="relative group/icon" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                    <div className="relative h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    </div>
                  </div>
                  <div suppressHydrationWarning>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">Fast Moving Non-Drugs</h2>
                    <p className="text-sm text-gray-600 mt-1">Top performing medical supplies and equipment by movement volume</p>
                  </div>
                </div>
              </div>
              <div className="relative p-8" suppressHydrationWarning>
                <FastMovingTable items={fastMovingNonDrugs} />
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]" suppressHydrationWarning>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
              <div className="relative p-8 border-b border-white/40" suppressHydrationWarning>
                <div className="flex items-center gap-6" suppressHydrationWarning>
                  <div className="relative group/icon" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                    <div className="relative h-14 w-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    </div>
                  </div>
                  <div suppressHydrationWarning>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-amber-900 to-orange-900 bg-clip-text text-transparent">Slow Moving Drugs</h2>
                    <p className="text-sm text-gray-600 mt-1">Pharmaceutical items requiring attention and optimization</p>
                  </div>
                </div>
              </div>
              <div className="relative p-8" suppressHydrationWarning>
                <FastMovingTable items={slowMovingDrugs} />
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]" suppressHydrationWarning>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
              <div className="relative p-8 border-b border-white/40" suppressHydrationWarning>
                <div className="flex items-center gap-6" suppressHydrationWarning>
                  <div className="relative group/icon" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                    <div className="relative h-14 w-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0V8a2 2 0 00-2-2H6a2 2 0 00-2 2v4m16 0H4" />
                    </svg>
                    </div>
                  </div>
                  <div suppressHydrationWarning>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">Slow Moving Non-Drugs</h2>
                    <p className="text-sm text-gray-600 mt-1">Medical supplies and equipment requiring inventory review</p>
                  </div>
                </div>
              </div>
              <div className="relative p-8" suppressHydrationWarning>
                <FastMovingTable items={slowMovingNonDrugs} />
              </div>
            </div>
        </div>

          <div className="space-y-8" suppressHydrationWarning>
            <div className="group relative bg-gradient-to-br from-white via-red-50/20 to-orange-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]" suppressHydrationWarning>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
              <div className="relative p-8 border-b border-white/40" suppressHydrationWarning>
                <div className="flex items-center gap-6" suppressHydrationWarning>
                  <div className="relative group/icon" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                    <div className="relative h-14 w-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    </div>
                  </div>
                  <div suppressHydrationWarning>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-red-900 to-orange-900 bg-clip-text text-transparent">Low Stock Alert</h2>
                    <p className="text-sm text-gray-600 mt-1">Items requiring immediate attention</p>
                  </div>
                </div>
              </div>
              <div className="relative p-8" suppressHydrationWarning>
                <div className="space-y-4" suppressHydrationWarning>
              {lowStock.length === 0 ? (
                    <div className="text-sm text-gray-600 p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/50">
                      <div className="flex items-center justify-center mb-2">
                        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="font-semibold text-green-800">All items well-stocked</div>
                      <div className="text-green-600">No low stock alerts</div>
                    </div>
                  ) : (
                    lowStock.map(it => (
                      <div key={it.id} className="group/item flex items-center justify-between p-6 bg-gradient-to-r from-white/90 via-red-50/20 to-orange-50/30 backdrop-blur-sm rounded-2xl border border-red-200/40 hover:from-white hover:to-red-50/40 transition-all duration-300 shadow-sm hover:shadow-lg" suppressHydrationWarning>
                        <div className="min-w-0 flex-1" suppressHydrationWarning>
                          <div className="text-sm font-bold text-gray-900 truncate group-hover/item:text-gray-700">{it.name}</div>
                          <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                            <span>On-hand: <span className="font-semibold text-red-600">{it.onHand}</span></span>
                            <span>•</span>
                            <span>Min: <span className="font-semibold">{it.minLevel}</span></span>
                          </div>
                        </div>
                        <div className="ml-4" suppressHydrationWarning>
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white border border-red-500/20 shadow-sm">
                            -{it.deficit}
                          </span>
                        </div>
                      </div>
                    ))
              )}
                </div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-white via-yellow-50/20 to-amber-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]" suppressHydrationWarning>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
              <div className="relative p-8 border-b border-white/40" suppressHydrationWarning>
                <div className="flex items-center gap-6" suppressHydrationWarning>
                  <div className="relative group/icon" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                    <div className="relative h-14 w-14 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    </div>
                  </div>
                  <div suppressHydrationWarning>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-yellow-900 to-amber-900 bg-clip-text text-transparent">Expiring Soon</h2>
                    <p className="text-sm text-gray-600 mt-1">Items expiring within 90 days</p>
                  </div>
                </div>
              </div>
              <div className="relative p-8" suppressHydrationWarning>
                <div className="space-y-4" suppressHydrationWarning>
              {expiringSoon.length === 0 ? (
                    <div className="text-sm text-gray-600 p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/50">
                      <div className="flex items-center justify-center mb-2">
                        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="font-semibold text-green-800">All batches fresh</div>
                      <div className="text-green-600">No near-expiry items</div>
                    </div>
                  ) : (
                    expiringSoon.map(b => (
                      <div key={b.id} className="group/item flex items-center justify-between p-6 bg-gradient-to-r from-white/90 via-yellow-50/20 to-amber-50/30 backdrop-blur-sm rounded-2xl border border-yellow-200/40 hover:from-white hover:to-yellow-50/40 transition-all duration-300 shadow-sm hover:shadow-lg" suppressHydrationWarning>
                        <div className="min-w-0 flex-1" suppressHydrationWarning>
                          <div className="text-sm font-bold text-gray-900 truncate group-hover/item:text-gray-700">{b.itemName}</div>
                          <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                            <span>Batch: <span className="font-semibold">{b.id}</span></span>
                            <span>•</span>
                            <span>Qty: <span className="font-semibold">{b.quantity}</span></span>
                            <span>•</span>
                            <span>Exp: <span className="font-semibold text-amber-600">{b.expiry}</span></span>
                          </div>
                        </div>
                        <div className="ml-4" suppressHydrationWarning>
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold border shadow-sm ${
                            b.daysLeft <= 30 
                              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-red-500/20' 
                              : b.daysLeft <= 60 
                              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-500/20'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500/20'
                          }`}>
                            {b.daysLeft}d
                          </span>
                        </div>
                      </div>
                    ))
              )}
                </div>
              </div>
            </div>
        </div>
      </section>
      </div>
    </div>
  );
}


