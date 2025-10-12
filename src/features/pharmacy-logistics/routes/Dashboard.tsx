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
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <div className="max-w-[1400px] xl:max-w-[1600px] mx-auto px-3 sm:px-4 py-4 space-y-3 md:space-y-4" suppressHydrationWarning>
        
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-sm" suppressHydrationWarning>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" suppressHydrationWarning>
            <div className="flex items-center gap-3 md:gap-4" suppressHydrationWarning>
              <div className="h-10 w-10 md:h-12 md:w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                <svg className="h-5 w-5 md:h-6 md:w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div suppressHydrationWarning>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Pharmacy Logistics</h1>
                <p className="text-xs md:text-sm text-gray-600">Enterprise inventory management</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap" suppressHydrationWarning>
              <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-green-50 rounded-full border border-green-200" suppressHydrationWarning>
                <div className="h-1.5 w-1.5 md:h-2 md:w-2 bg-green-500 rounded-full" suppressHydrationWarning></div>
                <span className="text-xs text-green-700 font-medium">Live</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-blue-50 rounded-full border border-blue-200" suppressHydrationWarning>
                <div className="h-1.5 w-1.5 md:h-2 md:w-2 bg-blue-500 rounded-full" suppressHydrationWarning></div>
                <span className="text-xs text-blue-700 font-medium">Operational</span>
              </div>
            </div>
          </div>
      </div>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" suppressHydrationWarning>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50 p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30" suppressHydrationWarning>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
              </div>
                </div>
            <div suppressHydrationWarning>
              <p className="text-sm font-medium text-gray-700 mb-2">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{ops?.pendingDepartmentRequests ?? 0}</p>
              
              
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200/50 p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
              <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30" suppressHydrationWarning>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
              </div>
                </div>
            <div suppressHydrationWarning>
              <p className="text-sm font-medium text-gray-700 mb-2">Pending LPO</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{ops?.longOpenOrders ?? 0}</p>
              
              
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200/50 p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
              <div className="h-12 w-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30" suppressHydrationWarning>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
              </div>
                </div>
            <div suppressHydrationWarning>
              <p className="text-sm font-medium text-gray-700 mb-2">Pending Deliveries</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{ops?.pendingDeliveries ?? 0}</p>
              
              
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200/50 p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30" suppressHydrationWarning>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
              </div>
                </div>
            <div suppressHydrationWarning>
              <p className="text-sm font-medium text-gray-700 mb-2">Pending Payment</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{ops?.pendingPayments ?? 0}</p>
              
              
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200/50 p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30" suppressHydrationWarning>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
              </div>
                </div>
            <div suppressHydrationWarning>
              <p className="text-sm font-medium text-gray-700 mb-2">Pending Approval</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{ops?.pendingApprovals ?? 0}</p>
              
              
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200/50 p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30" suppressHydrationWarning>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
              </div>
                </div>
            <div suppressHydrationWarning>
              <p className="text-sm font-medium text-gray-700 mb-2">Pending Penalty</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{ops?.pendingPenalties ?? 0}</p>
              
              
            </div>
          </div>
      </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-4" suppressHydrationWarning>
          
          {/* Left Column - Alerts */}
          <div className="space-y-4 md:space-y-6" suppressHydrationWarning>
            <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-sm" suppressHydrationWarning>
              <div className="flex items-center gap-3 mb-4" suppressHydrationWarning>
                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                  <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div suppressHydrationWarning>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Low Stock Alert</h3>
                  <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Items requiring attention</p>
              </div>
            </div>

              {/* Drug Category */}
              <div className="mb-4" suppressHydrationWarning>
                <div className="flex items-center gap-2 mb-3" suppressHydrationWarning>
                  <div className="h-6 w-6 bg-blue-100 rounded-md flex items-center justify-center" suppressHydrationWarning>
                    <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">Drug</h4>
                </div>
                <div className="space-y-2" suppressHydrationWarning>
                  {lowStock.filter(item => item.category === 'Drug').slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200" suppressHydrationWarning>
                      <div className="flex-1 min-w-0" suppressHydrationWarning>
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-600">Exp: {item.expiry} | Batch: {item.batchNo}</p>
                        <p className="text-xs text-gray-600">Location: {item.location || '-'}</p>
                  </div>
                      <div className="flex items-center justify-center h-8 w-8 bg-red-500 rounded-full text-white text-xs font-bold flex-shrink-0 ml-2" suppressHydrationWarning>
                        {Math.max(item.onHand - item.minLevel, 0)}
                </div>
              </div>
                  ))}
              </div>
            </div>

              {/* Non-Drug Category */}
              <div suppressHydrationWarning>
                <div className="flex items-center gap-2 mb-3" suppressHydrationWarning>
                  <div className="h-6 w-6 bg-green-100 rounded-md flex items-center justify-center" suppressHydrationWarning>
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">Non-Drug</h4>
                </div>
                <div className="space-y-2" suppressHydrationWarning>
                  {lowStock.filter(item => item.category === 'Non-drug').slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200" suppressHydrationWarning>
                      <div className="flex-1 min-w-0" suppressHydrationWarning>
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-600">Exp: {item.expiry} | Batch: {item.batchNo}</p>
                        <p className="text-xs text-gray-600">Location: {item.location || '-'}</p>
                      </div>
                      <div className="flex items-center justify-center h-8 w-8 bg-red-500 rounded-full text-white text-xs font-bold flex-shrink-0 ml-2" suppressHydrationWarning>
                        {Math.max(item.onHand - item.minLevel, 0)}
                      </div>
                  </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-sm" suppressHydrationWarning>
              <div className="flex items-center gap-3 mb-4" suppressHydrationWarning>
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div suppressHydrationWarning>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Fast Moving Items</h3>
                  <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Top performing drugs and medical supplies</p>
                </div>
              </div>

              {/* Drug Category */}
              <div className="mb-4" suppressHydrationWarning>
                <div className="flex items-center gap-2 mb-3" suppressHydrationWarning>
                  <div className="h-6 w-6 bg-blue-100 rounded-md flex items-center justify-center" suppressHydrationWarning>
                    <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">Drug</h4>
                </div>
                <FastMovingTable items={fastMovingDrugs} bare />
              </div>

              {/* Non-Drug Category */}
                  <div suppressHydrationWarning>
                <div className="flex items-center gap-2 mb-3" suppressHydrationWarning>
                  <div className="h-6 w-6 bg-green-100 rounded-md flex items-center justify-center" suppressHydrationWarning>
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">Non-Drug</h4>
                </div>
                <FastMovingTable items={fastMovingNonDrugs} bare />
              </div>
            </div>
        </div>

            {/* Expiring Soon */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-sm" suppressHydrationWarning>
              <div className="flex items-center gap-3 mb-4" suppressHydrationWarning>
                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                  <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div suppressHydrationWarning>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Expiring Soon</h3>
                  <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Within 90 days</p>
              </div>
            </div>

              {/* Drug Category */}
              <div className="mb-4" suppressHydrationWarning>
                <div className="flex items-center gap-2 mb-3" suppressHydrationWarning>
                  <div className="h-6 w-6 bg-blue-100 rounded-md flex items-center justify-center" suppressHydrationWarning>
                    <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">Drug</h4>
                </div>
                <div className="space-y-2" suppressHydrationWarning>
                  {expiringSoon.filter(item => item.category === 'Drug').slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200" suppressHydrationWarning>
                      <div className="flex-1 min-w-0" suppressHydrationWarning>
                        <p className="text-sm font-medium text-gray-900 truncate">{item.itemName}</p>
                        <p className="text-xs text-gray-600">Exp: {item.expiry} | Batch: {item.batchNo}</p>
                        <p className="text-xs text-gray-600">Location: {item.location || '-'}</p>
              </div>
                      <div className="text-xs text-orange-700 font-medium flex-shrink-0 ml-2" suppressHydrationWarning>
                        {item.daysLeft}d
                      </div>
                    </div>
                  ))}
              </div>
            </div>

              {/* Non-Drug Category */}
              <div suppressHydrationWarning>
                <div className="flex items-center gap-2 mb-3" suppressHydrationWarning>
                  <div className="h-6 w-6 bg-green-100 rounded-md flex items-center justify-center" suppressHydrationWarning>
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">Non-Drug</h4>
                </div>
                <div className="space-y-2" suppressHydrationWarning>
                  {expiringSoon.filter(item => item.category === 'Non-drug').slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200" suppressHydrationWarning>
                      <div className="flex-1 min-w-0" suppressHydrationWarning>
                        <p className="text-sm font-medium text-gray-900 truncate">{item.itemName}</p>
                        <p className="text-xs text-gray-600">Exp: {item.expiry} | Batch: {item.batchNo}</p>
                        <p className="text-xs text-gray-600">Location: {item.location || '-'}</p>
                      </div>
                      <div className="text-xs text-orange-700 font-medium flex-shrink-0 ml-2" suppressHydrationWarning>
                        {item.daysLeft}d
                      </div>
                  </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Slow Moving - Combined */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-sm" suppressHydrationWarning>
              <div className="flex items-center gap-3 mb-4" suppressHydrationWarning>
                <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m0-10l-4-4-4 4" />
                        </svg>
                      </div>
                <div suppressHydrationWarning>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Slow Moving Items</h3>
                  <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Lowest monthly usage</p>
                          </div>
                        </div>

              {/* Drug Category */}
              <div className="mb-4" suppressHydrationWarning>
                <div className="flex items-center gap-2 mb-3" suppressHydrationWarning>
                  <div className="h-6 w-6 bg-blue-100 rounded-md flex items-center justify-center" suppressHydrationWarning>
                    <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">Drug</h4>
                </div>
                <FastMovingTable items={slowMovingDrugs} bare />
                        </div>

              {/* Non-Drug Category */}
              <div suppressHydrationWarning>
                <div className="flex items-center gap-2 mb-3" suppressHydrationWarning>
                  <div className="h-6 w-6 bg-green-100 rounded-md flex items-center justify-center" suppressHydrationWarning>
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                      </div>
                  <h4 className="text-sm font-semibold text-gray-800">Non-Drug</h4>
                </div>
                <FastMovingTable items={slowMovingNonDrugs} bare />
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}