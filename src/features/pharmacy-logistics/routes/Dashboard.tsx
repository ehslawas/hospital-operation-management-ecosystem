import { FastMovingTable } from '../components/FastMovingTable';
import { fetchFastMovingItems, fetchSlowMovingItems, fetchLowStockItems, fetchExpiringBatchesSoon, fetchOpsAlerts } from '../services/mockInventory';

export default async function PharmacyLogisticsDashboard() {
  const [fastMovingItems, slowMovingItems, lowStock, expiringSoon, ops] = await Promise.all([
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
    <div className="min-h-screen bg-gray-50 overflow-x-hidden" suppressHydrationWarning>
      <div className="px-2 xs:px-3 sm:px-4 md:px-6 py-3 xs:py-4 sm:py-5 md:py-6 space-y-3 xs:space-y-3 sm:space-y-4 md:space-y-6 max-w-[2560px] mx-auto" suppressHydrationWarning>
        
        {/* Government Header with H.O.M.E Branding */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-xl border border-blue-700 shadow-lg overflow-hidden" suppressHydrationWarning>
          <div className="p-4 xs:p-5 sm:p-6 md:p-8" suppressHydrationWarning>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 xs:gap-5 sm:gap-6" suppressHydrationWarning>
              {/* Left Side - Jata Negara & H.O.M.E Branding */}
              <div className="flex items-center gap-3 xs:gap-4 sm:gap-5 md:gap-6 min-w-0 flex-1" suppressHydrationWarning>
                {/* Malaysian Coat of Arms */}
                <div className="flex-shrink-0" suppressHydrationWarning>
                  <img
                    src="/512px-Jata_MalaysiaV2.svg.png"
                    alt="Jata Negara Malaysia"
                    className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain"
                  />
                </div>
                
                {/* Vertical Divider */}
                <div className="w-px h-16 xs:h-20 sm:h-24 md:h-28 bg-white/20 hidden sm:block" suppressHydrationWarning></div>
                
                {/* H.O.M.E Branding */}
                <div className="flex flex-col min-w-0 flex-1" suppressHydrationWarning>
                  <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-1" suppressHydrationWarning>
                    H.O.M.E
                  </h1>
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg text-blue-100 leading-tight mb-1" suppressHydrationWarning>
                    Hospital Operation & Management Ecosystem
                  </p>
                  <p className="text-xs xs:text-sm sm:text-base text-blue-200 font-semibold uppercase tracking-wide" suppressHydrationWarning>
                    KEMENTERIAN KESIHATAN MALAYSIA (KKM)
                  </p>
                </div>
              </div>

              {/* Right Side - Module & Role Info */}
              <div className="flex flex-col gap-2 xs:gap-2.5 sm:gap-3 items-start lg:items-end lg:text-right" suppressHydrationWarning>
                <div className="flex items-center gap-2 xs:gap-3 flex-wrap" suppressHydrationWarning>
                  <span className="text-xs xs:text-sm text-blue-200 uppercase tracking-wide whitespace-nowrap">MODULE:</span>
                  <span className="inline-flex items-center px-3 xs:px-4 py-1.5 xs:py-2 bg-teal-600/90 text-white rounded-full text-xs xs:text-sm font-semibold border border-teal-400/30 shadow-md">
                    Pharmacy Logistics
                  </span>
                </div>
                <div className="flex items-center gap-2 xs:gap-3 flex-wrap" suppressHydrationWarning>
                  <span className="text-xs xs:text-sm text-blue-200 uppercase tracking-wide whitespace-nowrap">ROLE:</span>
                  <span className="text-xs xs:text-sm sm:text-base font-bold text-white">
                    Pharmacy Assistant
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <section className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 xs:gap-3 sm:gap-4 md:gap-4 lg:gap-6" suppressHydrationWarning>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50 p-3 xs:p-3 sm:p-4 md:p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4" suppressHydrationWarning>
              <div className="h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0" suppressHydrationWarning>
                    <svg className="h-5 w-5 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30" suppressHydrationWarning>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" suppressHydrationWarning></div>
                  <span className="text-xs text-green-700 font-semibold">Live</span>
              </div>
                </div>
            <div className="flex-1 flex flex-col justify-center" suppressHydrationWarning>
              <p className="text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 truncate">Pending Requests</p>
              <p className="text-2xl xs:text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{ops?.pendingDepartmentRequests ?? 0}</p>
              
              
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
              <p className="text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 truncate">Pending LPO</p>
              <p className="text-2xl xs:text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{ops?.longOpenOrders ?? 0}</p>
              
              
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
              <p className="text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 truncate">Pending Deliveries</p>
              <p className="text-2xl xs:text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{(ops as any)?.pendingDeliveries ?? 0}</p>
              
              
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
              <p className="text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 truncate">Pending Payment</p>
              <p className="text-2xl xs:text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{(ops as any)?.pendingPayments ?? 0}</p>
              
              
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
              <p className="text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 truncate">Pending Approval</p>
              <p className="text-2xl xs:text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{ops?.pendingApproval ?? (ops as any)?.pendingApprovals ?? 0}</p>
              
              
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
              <p className="text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 truncate">Pending Penalty</p>
              <p className="text-2xl xs:text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{(ops as any)?.pendingPenalties ?? 0}</p>
              
              
            </div>
          </div>
      </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-4 md:gap-5 lg:gap-6" suppressHydrationWarning>
          
          {/* Left Column - Alerts */}
          <div className="space-y-3 xs:space-y-4 sm:space-y-4 md:space-y-5 lg:space-y-6" suppressHydrationWarning>
            <div className="bg-white rounded-xl border border-gray-200 p-3 xs:p-4 sm:p-5 md:p-6 shadow-sm" suppressHydrationWarning>
              <div className="flex items-center gap-2 xs:gap-3 mb-3 xs:mb-4" suppressHydrationWarning>
                <div className="h-7 w-7 xs:h-8 xs:w-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                  <svg className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1" suppressHydrationWarning>
                  <h3 className="text-sm xs:text-base sm:text-base md:text-lg font-semibold text-gray-900 truncate">Low Stock Alert</h3>
                  <p className="text-xs xs:text-xs sm:text-sm text-gray-600 hidden xs:block truncate">Items requiring attention</p>
              </div>
            </div>

              {/* Drug Category */}
              <div className="mb-3 xs:mb-4" suppressHydrationWarning>
                <div className="flex items-center gap-1.5 xs:gap-2 mb-2 xs:mb-3" suppressHydrationWarning>
                  <div className="h-5 w-5 xs:h-6 xs:w-6 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                    <svg className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xs xs:text-sm font-semibold text-gray-800 truncate">Drug</h4>
                </div>
                <div className="space-y-2" suppressHydrationWarning>
                  {lowStock.filter(item => item.category === 'Drug').slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 xs:p-3 sm:p-3 bg-red-50 rounded-lg border border-red-200 min-h-[44px] touch-target cursor-pointer hover:bg-red-100 transition-colors" suppressHydrationWarning>
                      <div className="flex-1 min-w-0 pr-2" suppressHydrationWarning>
                        <p className="text-xs xs:text-sm font-medium text-gray-900 truncate leading-tight">{item.name}</p>
                        <p className="text-[10px] xs:text-xs text-gray-600 truncate mt-0.5">Exp: {item.expiry} | Batch: {item.batchNo}</p>
                        <p className="text-[10px] xs:text-xs text-gray-600 truncate">Location: {item.location || '-'}</p>
                  </div>
                      <div className="flex items-center justify-center h-9 w-9 xs:h-10 xs:w-10 bg-red-500 rounded-full text-white text-xs xs:text-xs font-bold flex-shrink-0 touch-target" suppressHydrationWarning>
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
                  <h4 className="text-xs xs:text-sm font-semibold text-gray-800 truncate">Non-Drug</h4>
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

            <div className="bg-white rounded-xl border border-gray-200 p-3 xs:p-4 sm:p-5 md:p-6 shadow-sm" suppressHydrationWarning>
              <div className="flex items-center gap-2 xs:gap-3 mb-3 xs:mb-4" suppressHydrationWarning>
                <div className="h-7 w-7 xs:h-8 xs:w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                  <svg className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1" suppressHydrationWarning>
                  <h3 className="text-sm xs:text-base sm:text-base md:text-lg font-semibold text-gray-900 truncate">Fast Moving Items</h3>
                  <p className="text-xs xs:text-xs sm:text-sm text-gray-600 hidden xs:block truncate">Top performing drugs and medical supplies</p>
                </div>
              </div>

              {/* Drug Category */}
              <div className="mb-3 xs:mb-4" suppressHydrationWarning>
                <div className="flex items-center gap-1.5 xs:gap-2 mb-2 xs:mb-3" suppressHydrationWarning>
                  <div className="h-5 w-5 xs:h-6 xs:w-6 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                    <svg className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xs xs:text-sm font-semibold text-gray-800 truncate">Drug</h4>
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
                  <h4 className="text-xs xs:text-sm font-semibold text-gray-800 truncate">Non-Drug</h4>
                </div>
                <FastMovingTable items={fastMovingNonDrugs} bare />
              </div>
            </div>
        </div>

            {/* Expiring Soon */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 xs:p-4 sm:p-5 md:p-6 shadow-sm" suppressHydrationWarning>
              <div className="flex items-center gap-2 xs:gap-3 mb-3 xs:mb-4" suppressHydrationWarning>
                <div className="h-7 w-7 xs:h-8 xs:w-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                  <svg className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1" suppressHydrationWarning>
                  <h3 className="text-sm xs:text-base sm:text-base md:text-lg font-semibold text-gray-900 truncate">Expiring Soon</h3>
                  <p className="text-xs xs:text-xs sm:text-sm text-gray-600 hidden xs:block truncate">Within 90 days</p>
              </div>
            </div>

              {/* Drug Category */}
              <div className="mb-3 xs:mb-4" suppressHydrationWarning>
                <div className="flex items-center gap-1.5 xs:gap-2 mb-2 xs:mb-3" suppressHydrationWarning>
                  <div className="h-5 w-5 xs:h-6 xs:w-6 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                    <svg className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xs xs:text-sm font-semibold text-gray-800 truncate">Drug</h4>
                </div>
                <div className="space-y-2" suppressHydrationWarning>
                  {expiringSoon.filter(item => item.category === 'Drug').slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 xs:p-3 sm:p-3 bg-orange-50 rounded-lg border border-orange-200 min-h-[44px] touch-target cursor-pointer hover:bg-orange-100 transition-colors" suppressHydrationWarning>
                      <div className="flex-1 min-w-0 pr-2" suppressHydrationWarning>
                        <p className="text-xs xs:text-sm font-medium text-gray-900 truncate leading-tight">{item.itemName}</p>
                        <p className="text-[10px] xs:text-xs text-gray-600 truncate mt-0.5">Exp: {item.expiry} | Batch: {item.batchNo}</p>
                        <p className="text-[10px] xs:text-xs text-gray-600 truncate">Location: {item.location || '-'}</p>
              </div>
                      <div className="text-xs xs:text-xs text-orange-700 font-medium flex-shrink-0 min-w-[36px] text-center" suppressHydrationWarning>
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
                  <h4 className="text-xs xs:text-sm font-semibold text-gray-800 truncate">Non-Drug</h4>
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
            <div className="bg-white rounded-xl border border-gray-200 p-3 xs:p-4 sm:p-5 md:p-6 shadow-sm" suppressHydrationWarning>
              <div className="flex items-center gap-2 xs:gap-3 mb-3 xs:mb-4" suppressHydrationWarning>
                <div className="h-7 w-7 xs:h-8 xs:w-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                  <svg className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m0-10l-4-4-4 4" />
                        </svg>
                      </div>
                <div className="min-w-0 flex-1" suppressHydrationWarning>
                  <h3 className="text-sm xs:text-base sm:text-base md:text-lg font-semibold text-gray-900 truncate">Slow Moving Items</h3>
                  <p className="text-xs xs:text-xs sm:text-sm text-gray-600 hidden xs:block truncate">Lowest monthly usage</p>
                          </div>
                        </div>

              {/* Drug Category */}
              <div className="mb-3 xs:mb-4" suppressHydrationWarning>
                <div className="flex items-center gap-1.5 xs:gap-2 mb-2 xs:mb-3" suppressHydrationWarning>
                  <div className="h-5 w-5 xs:h-6 xs:w-6 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                    <svg className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xs xs:text-sm font-semibold text-gray-800 truncate">Drug</h4>
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
                  <h4 className="text-xs xs:text-sm font-semibold text-gray-800 truncate">Non-Drug</h4>
                </div>
                <FastMovingTable items={slowMovingNonDrugs} bare />
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}