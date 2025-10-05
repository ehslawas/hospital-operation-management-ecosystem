export function HeaderHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-xl border border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-500" suppressHydrationWarning>
      {/* Modern gradient background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/3 to-purple-500/5" suppressHydrationWarning></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full filter blur-3xl" suppressHydrationWarning></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full filter blur-3xl" suppressHydrationWarning></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/5 to-blue-500/5 rounded-full filter blur-3xl" suppressHydrationWarning></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] bg-[size:32px_32px]" suppressHydrationWarning></div>
      
      <div className="relative px-8 py-10 sm:px-10" suppressHydrationWarning>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8" suppressHydrationWarning>
          <div className="relative group" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
            <div className="relative h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300" suppressHydrationWarning>
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>
          <div className="flex-1" suppressHydrationWarning>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3">
              Pharmacy Logistics
            </h1>
            <div className="flex flex-wrap items-center gap-4" suppressHydrationWarning>
              <div className="flex items-center gap-3 px-4 py-2 bg-green-500/10 backdrop-blur-sm rounded-full border border-green-500/20" suppressHydrationWarning>
                <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
                <span className="text-sm text-green-700 font-semibold">Live System</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20" suppressHydrationWarning>
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
                <span className="text-sm text-blue-700 font-medium">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-xl text-gray-700 max-w-4xl leading-relaxed mb-8 font-medium">
          Enterprise-grade inventory management with real-time tracking, automated compliance monitoring, and advanced analytics for optimal healthcare operations.
        </p>
        
        {/* Modern feature badges */}
        <div className="flex flex-wrap items-center gap-4" suppressHydrationWarning>
          <div className="group flex items-center gap-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-green-500/20 hover:from-green-500/15 hover:to-emerald-500/15 transition-all duration-300 shadow-lg hover:shadow-xl" suppressHydrationWarning>
            <div className="h-3 w-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
            <span className="text-sm font-semibold text-green-800">99.9% Uptime</span>
          </div>
          <div className="group flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-blue-500/20 hover:from-blue-500/15 hover:to-cyan-500/15 transition-all duration-300 shadow-lg hover:shadow-xl" suppressHydrationWarning>
            <div className="h-3 w-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
            <span className="text-sm font-semibold text-blue-800">Real-time Sync</span>
          </div>
          <div className="group flex items-center gap-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-purple-500/20 hover:from-purple-500/15 hover:to-pink-500/15 transition-all duration-300 shadow-lg hover:shadow-xl" suppressHydrationWarning>
            <div className="h-3 w-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
            <span className="text-sm font-semibold text-purple-800">Advanced Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
}


