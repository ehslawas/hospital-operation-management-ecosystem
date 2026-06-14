'use client';

import React from 'react';

export default function CostCentrePage() {
  // Mock data matching the reference image
  const departmentBudgets = [
    { name: 'Pharmacy', icon: 'P', budget: 1500000, percentage: 30, balance: 450000, color: 'blue' },
    { name: 'Emergency', icon: 'E', budget: 800000, percentage: 16, balance: 240000, color: 'red' },
    { name: 'General Ward', icon: 'G', budget: 600000, percentage: 12, balance: 180000, color: 'green' },
    { name: 'Laboratory', icon: 'L', budget: 300000, percentage: 6, balance: 90000, color: 'purple' },
    { name: 'CSS', icon: 'C', budget: 400000, percentage: 8, balance: 120000, color: 'orange' },
    { name: 'Anesthesiology', icon: 'A', budget: 350000, percentage: 7, balance: 105000, color: 'teal' },
    { name: 'Rehabilitation', icon: 'R', budget: 300000, percentage: 6, balance: 90000, color: 'indigo' },
    { name: 'Nephro Drug', icon: 'ND', budget: 300000, percentage: 6, balance: 90000, color: 'cyan' },
    { name: 'Nephro Non-Drug', icon: 'NN', budget: 200000, percentage: 4, balance: 60000, color: 'pink' },
    { name: 'Radiology', icon: 'X', budget: 250000, percentage: 5, balance: 75000, color: 'yellow' },
    { name: 'Wound Care', icon: 'W', budget: 200000, percentage: 4, balance: 60000, color: 'emerald' },
    { name: 'Vaccine', icon: 'V', budget: 100000, percentage: 2, balance: 30000, color: 'violet' },
    { name: 'Insulin', icon: 'I', budget: 80000, percentage: 1.6, balance: 24000, color: 'lime' },
    { name: 'Hep C', icon: 'H', budget: 70000, percentage: 1.4, balance: 21000, color: 'rose' },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'from-blue-500/10 to-blue-600/20', border: 'border-blue-500/20', icon: 'from-blue-500 to-blue-600', text: 'text-blue-700', progress: 'from-blue-500 to-blue-600' },
      red: { bg: 'from-red-500/10 to-red-600/20', border: 'border-red-500/20', icon: 'from-red-500 to-red-600', text: 'text-red-700', progress: 'from-red-500 to-red-600' },
      green: { bg: 'from-green-500/10 to-green-600/20', border: 'border-green-500/20', icon: 'from-green-500 to-green-600', text: 'text-green-700', progress: 'from-green-500 to-green-600' },
      purple: { bg: 'from-purple-500/10 to-purple-600/20', border: 'border-purple-500/20', icon: 'from-purple-500 to-purple-600', text: 'text-purple-700', progress: 'from-purple-500 to-purple-600' },
      orange: { bg: 'from-orange-500/10 to-orange-600/20', border: 'border-orange-500/20', icon: 'from-orange-500 to-orange-600', text: 'text-orange-700', progress: 'from-orange-500 to-orange-600' },
      teal: { bg: 'from-teal-500/10 to-teal-600/20', border: 'border-teal-500/20', icon: 'from-teal-500 to-teal-600', text: 'text-teal-700', progress: 'from-teal-500 to-teal-600' },
      indigo: { bg: 'from-indigo-500/10 to-indigo-600/20', border: 'border-indigo-500/20', icon: 'from-indigo-500 to-indigo-600', text: 'text-indigo-700', progress: 'from-indigo-500 to-indigo-600' },
      cyan: { bg: 'from-cyan-500/10 to-cyan-600/20', border: 'border-cyan-500/20', icon: 'from-cyan-500 to-cyan-600', text: 'text-cyan-700', progress: 'from-cyan-500 to-cyan-600' },
      pink: { bg: 'from-pink-500/10 to-pink-600/20', border: 'border-pink-500/20', icon: 'from-pink-500 to-pink-600', text: 'text-pink-700', progress: 'from-pink-500 to-pink-600' },
      yellow: { bg: 'from-yellow-500/10 to-yellow-600/20', border: 'border-yellow-500/20', icon: 'from-yellow-500 to-yellow-600', text: 'text-yellow-700', progress: 'from-yellow-500 to-yellow-600' },
      emerald: { bg: 'from-emerald-500/10 to-emerald-600/20', border: 'border-emerald-500/20', icon: 'from-emerald-500 to-emerald-600', text: 'text-emerald-700', progress: 'from-emerald-500 to-emerald-600' },
      violet: { bg: 'from-violet-500/10 to-violet-600/20', border: 'border-violet-500/20', icon: 'from-violet-500 to-violet-600', text: 'text-violet-700', progress: 'from-violet-500 to-violet-600' },
      lime: { bg: 'from-lime-500/10 to-lime-600/20', border: 'border-lime-500/20', icon: 'from-lime-500 to-lime-600', text: 'text-lime-700', progress: 'from-lime-500 to-lime-600' },
      rose: { bg: 'from-rose-500/10 to-rose-600/20', border: 'border-rose-500/20', icon: 'from-rose-500 to-rose-600', text: 'text-rose-700', progress: 'from-rose-500 to-rose-600' },
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

  // Mock procurement list (100 rows) with purchase details kept in a nested structure
  type PurchaseItem = { name: string; category: 'DRUG'|'NON DRUG'|'VACCINE'; sku: string; qty: number; price: number };
  type OrderRow = { date: string; po: string; lpo: string; cc: string; department: string; supplier: string; items: PurchaseItem[]; status: 'Completed' | 'In Progress' | 'Pending' };
  const allOrders: OrderRow[] = Array.from({ length: 100 }).map((_, i) => ({
    date: `2024-${String(((i%12)+1)).padStart(2,'0')}-${String(((i%28)+1)).padStart(2,'0')}`,
    po: `PO-2024-${String(i+1).padStart(3,'0')}`,
    lpo: `LPO-2024${String(2000+i).padStart(4,'0')}`,
    cc: `KKM-26${i%10}/2024/F(U)`,
    department: ['Pharmacy','Emergency Department','General Ward','Laboratory','Central Sterile Services','Anesthesiology','Rehabilitation Services','Nephro Drug','Nephro Non-Drug','Radiology'][i%10],
    supplier: ['MediSupply Sdn Bhd','HealthTech Equipment','VaxCorp Malaysia','PharmaCorp','MediTech Solutions','BioMed Supplies','CarePlus Medical','Advanced Healthcare','Medical Innovations','Global Health Supply'][i%10],
    items: [
      { name: ['Paracetamol 500mg','Syringes 10ml','Influenza Vaccine','Metformin 500mg','Medical Masks'][i%5], category: (i%3===0?'DRUG':i%3===1?'NON DRUG':'VACCINE') as any, sku: `SKU-${i+1}${i%5}`, qty: 100+((i%5)*50), price: 0.6+ (i%5)*0.5 },
      { name: ['Simvastatin 20mg','IV Bags','Furosemide 40mg'][i%3], category: (i%2===0?'DRUG':'NON DRUG') as any, sku: `SKU-${i+2}${i%7}`, qty: 50+((i%4)*25), price: 1.2 + (i%4)*0.8 }
    ],
    status: ['Completed','In Progress','Pending'][i%3] as OrderRow['status']
  }));

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'All'|'Completed'|'In Progress'|'Pending'>('All');
  const [deptFilter, setDeptFilter] = React.useState<string>('All');
  const [currentPage, setCurrentPage] = React.useState(1);
  const perPage = 10;
  const filtered = React.useMemo(() => allOrders.filter(o => {
    const q = !search || [o.po, o.lpo, o.department, o.supplier].some(x => x.toLowerCase().includes(search.toLowerCase()));
    const st = statusFilter === 'All' || o.status === statusFilter;
    const dp = deptFilter === 'All' || o.department === deptFilter;
    return q && st && dp;
  }), [search, statusFilter, deptFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = React.useMemo(() => filtered.slice((currentPage-1)*perPage, (currentPage)*perPage), [filtered, currentPage]);

  const [openOrder, setOpenOrder] = React.useState<OrderRow | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden" suppressHydrationWarning>
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden" suppressHydrationWarning>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[min(600px,90vh)] bg-gradient-to-br from-cyan-400/5 to-blue-500/5 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-green-400/5 to-emerald-500/5 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.05)_1px,transparent_0)] bg-[size:32px_32px]" suppressHydrationWarning></div>
        {/* Modern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20" suppressHydrationWarning></div>
      </div>

      <div className="relative z-10 p-6 space-y-8" suppressHydrationWarning>
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl border border-white/40 shadow-xl" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/3 to-purple-500/5" suppressHydrationWarning></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full filter blur-3xl" suppressHydrationWarning></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full filter blur-3xl" suppressHydrationWarning></div>
          
          <div className="relative px-8 py-10 sm:px-10" suppressHydrationWarning>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6" suppressHydrationWarning>
              <div className="flex items-center gap-6" suppressHydrationWarning>
                <div className="relative group" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div suppressHydrationWarning>
                  <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3">
                    Cost Centre (CC/DP)
                  </h1>
                  <p className="text-xl text-gray-700 max-w-2xl font-medium">
                    Departmental budgets and cost center allocations
                  </p>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 backdrop-blur-sm rounded-full border border-green-500/20" suppressHydrationWarning>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-lg" suppressHydrationWarning></div>
                <span className="text-sm font-semibold text-green-700">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern KPI Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-6" suppressHydrationWarning>
          {/* Total Department Budget */}
          <div className="group relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-3xl" suppressHydrationWarning></div>
            <div className="relative p-6" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
                <div className="relative group/icon" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="text-center" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 mb-2">Total Department Budget</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">RM 5,000,000</p>
              </div>
            </div>
          </div>

          {/* Total Departments */}
          <div className="group relative bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-3xl" suppressHydrationWarning></div>
            <div className="relative p-6" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
                <div className="relative group/icon" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="text-center" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 mb-2">Total Departments</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">14</p>
              </div>
            </div>
          </div>

          {/* Total Utilized */}
          <div className="group relative bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-3xl" suppressHydrationWarning></div>
            <div className="relative p-6" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
                <div className="relative group/icon" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="text-center" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 mb-2">Total Utilized</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">RM 3,000,000</p>
              </div>
            </div>
          </div>

          {/* Remaining Budget */}
          <div className="group relative bg-gradient-to-br from-white via-purple-50/20 to-violet-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-3xl" suppressHydrationWarning></div>
            <div className="relative p-6" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
                <div className="relative group/icon" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="text-center" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 mb-2">Remaining Budget</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">RM 2,000,000</p>
              </div>
            </div>
          </div>
        </section>

        {/* Department Budgets Section */}
        <div className="group relative bg-gradient-to-br from-white via-gray-50/20 to-slate-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-slate-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
          
          <div className="relative p-8" suppressHydrationWarning>
            <div className="flex items-center gap-6 mb-8" suppressHydrationWarning>
              <div className="relative group/icon" suppressHydrationWarning>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                <div className="relative h-14 w-14 bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div suppressHydrationWarning>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-slate-800 bg-clip-text text-transparent">Department Budgets</h2>
                <p className="text-sm text-gray-600 mt-1">Individual department budget allocations and utilization</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" suppressHydrationWarning>
              {departmentBudgets.map((dept, index) => {
                const colors = getColorClasses(dept.color);
                return (
                  <div key={index} className="group/card relative bg-gradient-to-br from-white via-white/80 to-white/60 backdrop-blur-sm rounded-3xl border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-3xl" suppressHydrationWarning></div>
                    
                    <div className="relative p-6" suppressHydrationWarning>
                      {/* Department Icon and Name */}
                      <div className="flex items-center gap-4 mb-4" suppressHydrationWarning>
                        <div className="relative group/icon" suppressHydrationWarning>
                          <div className={`absolute inset-0 bg-gradient-to-br ${colors.icon} rounded-2xl blur-md opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300`} suppressHydrationWarning></div>
                          <div className={`relative h-16 w-16 bg-gradient-to-br ${colors.icon} rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-xl group-hover/icon:scale-110 transition-transform duration-300`} suppressHydrationWarning>
                            {dept.icon}
                          </div>
                        </div>
                        <div className="flex-1" suppressHydrationWarning>
                          <h3 className="font-bold text-gray-900 text-lg leading-tight">{dept.name}</h3>
                          <div className="flex items-center gap-2 mt-1" suppressHydrationWarning>
                            <span className="text-sm text-gray-600 font-medium">{dept.percentage}%</span>
                            <div className="h-1 w-1 bg-gray-400 rounded-full" suppressHydrationWarning></div>
                            <span className="text-sm text-gray-600 font-medium">of total</span>
                          </div>
                        </div>
                      </div>

                      {/* Budget Amount */}
                      <div className="mb-4" suppressHydrationWarning>
                        <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                          {formatCurrency(dept.budget)}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Allocated Budget</p>
                      </div>

                      {/* Balance */}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50/80 to-emerald-50/60 rounded-2xl border border-green-200/50" suppressHydrationWarning>
                        <div suppressHydrationWarning>
                          <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Balance</p>
                          <p className="font-bold text-green-700 text-sm">{formatCurrency(dept.balance)}</p>
                        </div>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center" suppressHydrationWarning>
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Procurement Items (CC/DP) - simplified table with clickable PO/LPO */}
        <div className="bg-white/90 rounded-3xl shadow-xl ring-1 ring-slate-200">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="text-lg font-bold text-slate-900">Procurement Items</div>
            <div className="flex items-center gap-2 ml-auto">
              <select value={deptFilter} onChange={(e)=>{setDeptFilter(e.target.value as any); setCurrentPage(1);}} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="All">All Departments</option>
                {Array.from(new Set(allOrders.map(o=>o.department))).map(d=> <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={statusFilter} onChange={(e)=>{setStatusFilter(e.target.value as any); setCurrentPage(1);}} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option>All</option>
                <option>Completed</option>
                <option>In Progress</option>
                <option>Pending</option>
              </select>
              <input value={search} onChange={(e)=>{setCurrentPage(1); setSearch(e.target.value);}} placeholder="Search PO/LPO/Dept/Supplier" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">PO</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">LPO</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Contract KKM</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Total (RM)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pageRows.map((r,i)=> {
                  const total = r.items.reduce((s,it)=> s + it.qty*it.price, 0);
                  const chip = r.status==='Completed' ? 'bg-green-50 text-green-700' : r.status==='In Progress' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700';
                  return (
                    <tr key={i} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-sm text-slate-700">{r.date}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-700 cursor-pointer" onClick={()=>setOpenOrder(r)}>{r.po}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-indigo-700 cursor-pointer" onClick={()=>setOpenOrder(r)}>{r.lpo}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{r.cc}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{r.department}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{r.supplier}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">RM {Math.round(total).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${chip}`}>{r.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-600" colSpan={6}>Subtotal (page)</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    RM {Math.round(pageRows.reduce((acc,r)=>acc + r.items.reduce((s,it)=>s+it.qty*it.price,0),0)).toLocaleString()}
                  </td>
                  <td />
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-600" colSpan={6}>Total (filtered)</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    RM {Math.round(filtered.reduce((acc,r)=>acc + r.items.reduce((s,it)=>s+it.qty*it.price,0),0)).toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="text-sm text-slate-600">Page {currentPage} of {totalPages}</div>
            <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden">
              <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} className={`px-3 py-1.5 text-sm ${currentPage===1?'text-slate-400':'hover:bg-slate-100 text-slate-700'}`}>Prev</button>
              <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} className={`px-3 py-1.5 text-sm border-l border-slate-200 ${currentPage===totalPages?'text-slate-400':'hover:bg-slate-100 text-slate-700'}`}>Next</button>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        {openOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-slate-900">{openOrder.po} • {openOrder.lpo}</div>
                  <div className="text-xs text-slate-600">{openOrder.department} • {openOrder.supplier} • {openOrder.date}</div>
                </div>
                <button onClick={()=>setOpenOrder(null)} className="p-2 hover:bg-slate-100 rounded-lg">✕</button>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-end gap-2 mb-3">
                  <button onClick={()=>{
                    if(!openOrder) return; const rows = openOrder.items.map(it=>({Item:it.name, Category:it.category, SKU:it.sku, Quantity:it.qty, Amount:`RM ${it.price.toFixed(2)}`, Total: Math.round(it.qty*it.price)}));
                    const csv = ['Item,Category,SKU,Quantity,Amount,Total', ...rows.map(r=>`${r.Item},${r.Category},${r.SKU},${r.Quantity},${typeof r.Amount==='string'?r.Amount:(r.Amount as any) },${r.Total}`)].join('\n');
                    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${openOrder.po}-items.csv`; link.click();
                  }} className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700">Export CSV</button>
                  <button onClick={()=>{
                    if(!openOrder) return; const w=window.open('','_blank'); if(!w) return; const total = openOrder.items.reduce((s,it)=>s+it.qty*it.price,0);
                    w.document.write(`<html><head><title>${openOrder.po}</title></head><body>`);
                    w.document.write(`<h3>${openOrder.po} • ${openOrder.lpo}</h3><div>${openOrder.department} • ${openOrder.supplier} • ${openOrder.date}</div>`);
                    w.document.write('<table border="1" cellspacing="0" cellpadding="6"><tr><th>Item</th><th>Category</th><th>SKU</th><th>Qty</th><th>Amount</th><th>Total</th></tr>');
                    openOrder.items.forEach(it=> w.document.write(`<tr><td>${it.name}</td><td>${it.category}</td><td>${it.sku}</td><td>${it.qty}</td><td>RM ${it.price.toFixed(2)}</td><td>RM ${Math.round(it.qty*it.price).toLocaleString()}</td></tr>`));
                    w.document.write(`<tr><td colspan="5" align="right"><b>Total</b></td><td><b>RM ${Math.round(total).toLocaleString()}</b></td></tr>`);
                    w.document.write('</table></body></html>'); w.document.close(); w.print();
                  }} className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white">Print</button>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700">SKU/PKU</th>
                      <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Quantity</th>
                      <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Amount</th>
                      <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {openOrder.items.map((it,idx)=> (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-sm text-slate-800">{it.name}</td>
                        <td className="px-3 py-2 text-xs"><span className={`px-2 py-1 rounded-full ${it.category==='DRUG'?'bg-blue-50 text-blue-700':it.category==='NON DRUG'?'bg-emerald-50 text-emerald-700':'bg-violet-50 text-violet-700'}`}>{it.category}</span></td>
                        <td className="px-3 py-2 text-sm text-slate-600">{it.sku}</td>
                        <td className="px-3 py-2 text-sm text-right">{it.qty.toLocaleString()}</td>
                        <td className="px-3 py-2 text-sm text-right">RM {it.price.toFixed(2)}</td>
                        <td className="px-3 py-2 text-sm text-right font-semibold">RM {(it.qty*it.price).toLocaleString(undefined,{minimumFractionDigits:0, maximumFractionDigits:0})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
                <button onClick={()=>setOpenOrder(null)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
