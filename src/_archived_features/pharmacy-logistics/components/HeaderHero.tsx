export function HeaderHero() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm" suppressHydrationWarning>
      <div className="flex items-center justify-between" suppressHydrationWarning>
        <div className="flex items-center gap-4" suppressHydrationWarning>
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center" suppressHydrationWarning>
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div suppressHydrationWarning>
            <h1 className="text-2xl font-bold text-gray-900">Pharmacy Logistics</h1>
            <p className="text-sm text-gray-600">Enterprise-grade inventory management system</p>
          </div>
        </div>
        <div className="flex items-center gap-2" suppressHydrationWarning>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200" suppressHydrationWarning>
            <div className="h-2 w-2 bg-green-500 rounded-full" suppressHydrationWarning></div>
            <span className="text-xs text-green-700 font-medium">Live System</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200" suppressHydrationWarning>
            <div className="h-2 w-2 bg-blue-500 rounded-full" suppressHydrationWarning></div>
            <span className="text-xs text-blue-700 font-medium">All Systems Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}