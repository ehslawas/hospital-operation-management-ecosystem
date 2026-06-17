'use client';

import { useState, useEffect } from 'react';

// Interfaces for our rich budget forecasting system
interface JustificationItem {
  id: string;
  code: string;
  name: string;
  monthlyConsumption: string;
  reason: string;
  addedCost: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ForecastCategory {
  id: string;
  voteCode: string;
  voteActivity: string;
  categoryName: string;
  baseAllocation: number;
  baseMonthlyBurn: number; // The steady average burn rate
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
  justifications: JustificationItem[];
}

// ══════════════════════════════════════════════════════════════════════════════════
// EXQUISITE MOCK DATASET AT THE VOTE-CODE & CATEGORY LEVEL
// ══════════════════════════════════════════════════════════════════════════════════
const forecastCategories: ForecastCategory[] = [
  {
    id: 'cat-001',
    voteCode: '080702',
    voteActivity: '27401',
    categoryName: 'APPL Standard Drug Procurement',
    baseAllocation: 5000000,
    baseMonthlyBurn: 520000,
    trend: 'increasing',
    confidence: 94,
    justifications: [
      {
        id: 'item-101',
        code: 'APPL-DRG-001',
        name: 'Paracetamol 500mg (Standard Grade)',
        monthlyConsumption: '15,000 boxes (100 tabs/box)',
        reason: 'Severe seasonal influenza and dengue caseload surge (35% year-on-year inpatient spike).',
        addedCost: 340000,
        priority: 'HIGH'
      },
      {
        id: 'item-102',
        code: 'APPL-DRG-008',
        name: 'Insulin Glargine 100 U/mL (rDNA Origin)',
        monthlyConsumption: '3,200 pre-filled pens',
        reason: 'Accelerated Q3 Clinical Transition of 1,200 type-2 diabetic patients from older NPH formulations to Glargine.',
        addedCost: 500000,
        priority: 'HIGH'
      },
      {
        id: 'item-103',
        code: 'APPL-DRG-012',
        name: 'Amoxicillin 250mg Suspension',
        monthlyConsumption: '8,000 bottles (60ml)',
        reason: 'Pediatric ward capacity expansion and subsequent outpatient general prescription surges.',
        addedCost: 400000,
        priority: 'MEDIUM'
      }
    ]
  },
  {
    id: 'cat-002',
    voteCode: '080702',
    voteActivity: '27402',
    categoryName: 'Consumables & Surgical Supplies (CC)',
    baseAllocation: 1200000,
    baseMonthlyBurn: 124000,
    trend: 'increasing',
    confidence: 88,
    justifications: [
      {
        id: 'item-201',
        code: 'CC-NDR-005',
        name: 'Examination Gloves (Medium Nitrile)',
        monthlyConsumption: '4,000 boxes (100 pcs/box)',
        reason: 'SOP tightening on standard precautions and high-volume sanitization cycles following audit reports.',
        addedCost: 120000,
        priority: 'HIGH'
      },
      {
        id: 'item-202',
        code: 'CC-NDR-011',
        name: 'Sterile Gauze Bandages 10cm',
        monthlyConsumption: '2,500 rolls',
        reason: 'Establishment of the new regional Wound Care Center bringing 18% additional diabetic ulcer patients.',
        addedCost: 78000,
        priority: 'MEDIUM'
      },
      {
        id: 'item-203',
        code: 'CC-NDR-023',
        name: 'Disposable Syringes (5ml with needle)',
        monthlyConsumption: '12,000 units',
        reason: 'Increased day-surgery throughput and oncology infusion center expansion.',
        addedCost: 90000,
        priority: 'MEDIUM'
      }
    ]
  },
  {
    id: 'cat-003',
    voteCode: '990102',
    voteActivity: '27404',
    categoryName: 'DP Reagents & Lab Diagnostics',
    baseAllocation: 3000000,
    baseMonthlyBurn: 230000,
    trend: 'stable',
    confidence: 91,
    justifications: [
      {
        id: 'item-301',
        code: 'DP-REA-003',
        name: 'Dengue NS1 Antigen Rapid Test Kits',
        monthlyConsumption: '1,500 single-use kits',
        reason: 'Pre-emptive outbreak reserve stock. Kept at stable levels; currently within allocation limits.',
        addedCost: 0,
        priority: 'LOW'
      }
    ]
  },
  {
    id: 'cat-004',
    voteCode: '080702',
    voteActivity: '27403',
    categoryName: 'Critical Support Equipment Maintenance',
    baseAllocation: 900000,
    baseMonthlyBurn: 96000,
    trend: 'increasing',
    confidence: 85,
    justifications: [
      {
        id: 'item-401',
        code: 'EQ-MNT-089',
        name: 'Ventilator Preventative Maintenance Kits',
        monthlyConsumption: '45 full kits',
        reason: 'Scheduled replacement of turbine seals and backup battery packs across 12 high-use ICU ventilators.',
        addedCost: 180000,
        priority: 'CRITICAL'
      },
      {
        id: 'item-402',
        code: 'EQ-MNT-102',
        name: 'Patient Monitor Replacement ECG Leads',
        monthlyConsumption: '120 sets',
        reason: 'Routine replacement of degraded sensor lines and temperature probes across general medical ward beds.',
        addedCost: 72000,
        priority: 'LOW'
      }
    ]
  },
  {
    id: 'cat-005',
    voteCode: '080702',
    voteActivity: '27501',
    categoryName: 'Medical Oxygen & Cylinder Support (Gas)',
    baseAllocation: 1500000,
    baseMonthlyBurn: 164000,
    trend: 'increasing',
    confidence: 95,
    justifications: [
      {
        id: 'item-501',
        code: 'OXY-CYL-01',
        name: 'Liquid Medical Oxygen Refills (Bulk)',
        monthlyConsumption: '45,000 Liters',
        reason: 'Opening of the Respiratory High Dependency Unit (HDU) adding 8 permanent oxygen lines.',
        addedCost: 360000,
        priority: 'CRITICAL'
      },
      {
        id: 'item-502',
        code: 'OXY-CYL-05',
        name: 'High Pressure Cylinder Safety Valves',
        monthlyConsumption: '50 units',
        reason: 'Compliance with mandatory occupational safety regulations requiring replacement of aged pressure-relief manifolds.',
        addedCost: 108000,
        priority: 'HIGH'
      }
    ]
  }
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function FinancialForecastingPage() {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(4); // Default to Month 5 (May, 0-indexed is 4)
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [department, setDepartment] = useState<string>('');
  
  // Interactive Sandbox Modeler state
  const [sandboxTarget, setSandboxTarget] = useState<string>('cat-001');
  const [sandboxAmount, setSandboxAmount] = useState<number>(1000000);
  const [sandboxActive, setSandboxActive] = useState<boolean>(false);
  
  // Justification Drawer state
  const [activeDrawerId, setActiveDrawerId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const dept = localStorage.getItem('department') ||
        document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1] || '';
      try { setDepartment(decodeURIComponent(dept)); } catch { setDepartment(dept); }
    }
  }, []);

  const elapsedMonths = selectedMonthIndex + 1; // 1-indexed (Jan is 1, May is 5)
  const remainingMonths = 12 - elapsedMonths;

  // ══════════════════════════════════════════════════════════════════════════════════
  // CORE MATHEMATICAL FORECAST CALCULATIONS
  // ══════════════════════════════════════════════════════════════════════════════════
  const processedData = forecastCategories.map(cat => {
    // Add small organic variance to monthly spent based on month index to feel "alive"
    const varianceFactor = 1 + Math.sin(parseInt(cat.id.split('-')[1]) * elapsedMonths) * 0.05;
    const actualMonthlySpent = cat.baseMonthlyBurn * varianceFactor;

    // YTD Actual Spent (historical accumulated)
    const ytdSpent = actualMonthlySpent * elapsedMonths;
    
    // Average Monthly Use (Burn rate)
    const avgMonthlyUse = ytdSpent / elapsedMonths;
    
    // Remaining Run-rate spend projected until Dec
    const projectedRemaining = avgMonthlyUse * remainingMonths;
    
    // Total Needed until end of year
    const eoyProjectedSpend = ytdSpent + projectedRemaining;
    
    // Get allocation factoring in Sandbox modifications
    let currentAllocation = cat.baseAllocation;
    if (sandboxActive && sandboxTarget === cat.id) {
      currentAllocation += sandboxAmount;
    }
    
    // Shortfall / Deficit calculation
    const variance = currentAllocation - eoyProjectedSpend;
    const shortfall = variance < 0 ? Math.abs(variance) : 0;

    return {
      ...cat,
      allocation: currentAllocation,
      ytdSpent,
      avgMonthlyUse,
      projectedRemaining,
      eoyProjectedSpend,
      shortfall,
      variance,
      isDeficit: variance < 0
    };
  });

  // Aggregated Core Statistics
  const totalAllocation = processedData.reduce((sum, c) => sum + c.allocation, 0);
  const totalYtdSpent = processedData.reduce((sum, c) => sum + c.ytdSpent, 0);
  const totalAvgBurn = processedData.reduce((sum, c) => sum + c.avgMonthlyUse, 0);
  const totalProjectedSpend = processedData.reduce((sum, c) => sum + c.eoyProjectedSpend, 0);
  const totalShortfall = processedData.reduce((sum, c) => sum + c.shortfall, 0);
  const burnRatePercentage = (totalProjectedSpend / totalAllocation) * 100;

  // Generate Quarterly analysis dynamically based on the current calculation engine
  const quarterlyAnalysis = [1, 2, 3, 4].map(quarter => {
    const quarterAllocPortion = totalAllocation / 4;
    
    let quarterSpent = 0;
    let isProjected = false;

    // Determine actual vs projected portions per quarter
    if (quarter === 1) {
      // Q1: Months 1, 2, 3
      if (elapsedMonths >= 3) {
        quarterSpent = totalAvgBurn * 3;
      } else {
        quarterSpent = (totalAvgBurn * elapsedMonths) + (totalAvgBurn * (3 - elapsedMonths));
        isProjected = true;
      }
    } else if (quarter === 2) {
      // Q2: Months 4, 5, 6
      if (elapsedMonths >= 6) {
        quarterSpent = totalAvgBurn * 3;
      } else if (elapsedMonths >= 3) {
        const spentActuals = totalAvgBurn * (elapsedMonths - 3);
        const spentProj = totalAvgBurn * (6 - elapsedMonths);
        quarterSpent = spentActuals + spentProj;
        isProjected = true;
      } else {
        quarterSpent = totalAvgBurn * 3;
        isProjected = true;
      }
    } else if (quarter === 3) {
      // Q3: Months 7, 8, 9
      if (elapsedMonths >= 9) {
        quarterSpent = totalAvgBurn * 3;
      } else if (elapsedMonths >= 6) {
        const spentActuals = totalAvgBurn * (elapsedMonths - 6);
        const spentProj = totalAvgBurn * (9 - elapsedMonths);
        quarterSpent = spentActuals + spentProj;
        isProjected = true;
      } else {
        quarterSpent = totalAvgBurn * 3;
        isProjected = true;
      }
    } else {
      // Q4: Months 10, 11, 12
      if (elapsedMonths >= 12) {
        quarterSpent = totalAvgBurn * 3;
      } else if (elapsedMonths >= 9) {
        const spentActuals = totalAvgBurn * (elapsedMonths - 9);
        const spentProj = totalAvgBurn * (12 - elapsedMonths);
        quarterSpent = spentActuals + spentProj;
        isProjected = true;
      } else {
        quarterSpent = totalAvgBurn * 3;
        isProjected = true;
      }
    }

    // Variance
    const variance = quarterAllocPortion - quarterSpent;

    return {
      quarter: `Q${quarter}`,
      allocation: quarterAllocPortion,
      spent: quarterSpent,
      variance,
      isProjected,
      status: variance >= 0 ? 'safe' : Math.abs(variance) < (quarterAllocPortion * 0.1) ? 'warning' : 'danger'
    };
  });

  const activeDrawerCategory = processedData.find(c => c.id === activeDrawerId);

  // Formatting utility
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val).replace('MYR', 'RM');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* =================================================════════════════ */}
        {/* PREMIUM HEADER SECTION */}
        {/* =================================================════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              <span className="text-xs uppercase tracking-widest font-semibold text-indigo-400">Senior Financial Intelligence</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
              Budget Forecasting & Run-Rate Projections
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Predictive fiscal modeling using real-time burn rates and itemized procurement backups
            </p>
          </div>

          {/* Month simulation slider widget */}
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/60 shadow-xl min-w-[280px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Simulative Current Month</span>
              <span className="text-sm font-extrabold text-white bg-indigo-600/80 px-2 py-0.5 rounded-lg border border-indigo-400/30">
                {months[selectedMonthIndex]} ({elapsedMonths} Months YTD)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10" // Up to Nov, since Dec represents 12 complete months (no remaining)
              value={selectedMonthIndex}
              onChange={(e) => setSelectedMonthIndex(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all duration-150"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1.5 px-0.5">
              <span>JAN</span>
              <span>MAY (CURRENT)</span>
              <span>NOV</span>
            </div>
          </div>
        </div>

        {/* =================================================════════════════ */}
        {/* ADVANCED OVERVIEW KPI CARDS */}
        {/* =================================================════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Annual Allocation</span>
              <span className="text-lg">💰</span>
            </div>
            <p className="text-xl font-black text-white">{formatCurrency(totalAllocation)}</p>
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold">FY2026 Base</span>
              {sandboxActive && <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded font-bold border border-indigo-500/20">Modded</span>}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">YTD Actual Spent</span>
              <span className="text-lg">💳</span>
            </div>
            <p className="text-xl font-black text-white">{formatCurrency(totalYtdSpent)}</p>
            <p className="text-xs text-slate-400 mt-2 font-semibold">
              {(totalYtdSpent / totalAllocation * 100).toFixed(1)}% of allocation utilized
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Avg Monthly Burn</span>
              <span className="text-lg">🔥</span>
            </div>
            <p className="text-xl font-black text-white">{formatCurrency(totalAvgBurn)}</p>
            <p className="text-xs text-slate-400 mt-2 font-semibold">
              Monthly runtime burn-rate
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Projected EOY Spend</span>
              <span className="text-lg">📉</span>
            </div>
            <p className="text-xl font-black text-white">{formatCurrency(totalProjectedSpend)}</p>
            <div className="mt-2 flex items-center space-x-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${burnRatePercentage > 100 ? 'bg-red-900/60 text-red-300' : 'bg-emerald-950/80 text-emerald-400'}`}>
                {burnRatePercentage.toFixed(0)}% Run-Rate
              </span>
            </div>
          </div>

          {/* REQUIRED ADDED BUDGET CARD (DYNAMICAL RED GRADIENT IF SHORTFALL) */}
          <div className={`backdrop-blur-sm rounded-2xl p-5 border shadow-lg hover:-translate-y-1 transition-all duration-300 ${
            totalShortfall > 0 
              ? 'bg-gradient-to-br from-red-950/85 via-red-900/40 to-slate-800 border-red-700/50 text-white animate-pulse-slow' 
              : 'bg-gradient-to-br from-emerald-950/80 to-slate-800 border-emerald-800/50 text-white'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider">Required Added Budget</span>
              <span className="text-lg">{totalShortfall > 0 ? '⚠️' : '✅'}</span>
            </div>
            <p className="text-2xl font-black tracking-tight">{formatCurrency(totalShortfall)}</p>
            <p className="text-xs mt-2 font-semibold text-slate-300">
              {totalShortfall > 0 ? 'Shortfall predicted' : 'Surplus or Balanced EOY'}
            </p>
          </div>

        </div>

        {/* =================================================════════════════ */}
        {/* INTERACTIVE SCENARIO PLAYGROUND (SANDBOX MODELER) */}
        {/* =================================================════════════════ */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 rounded-3xl p-6 shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-700/40 pb-5 mb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-indigo-900/80 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">SIMULATION MODE</span>
                <span className="text-white text-base font-extrabold">Forecasting Sandbox Playground</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Inject simulative supplemental warrants to test how budget revisions balance future deficits in real-time
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSandboxActive(!sandboxActive)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 border shadow-lg ${
                  sandboxActive 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 hover:scale-102 hover:shadow-emerald-950/40' 
                    : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 hover:scale-102'
                }`}
              >
                {sandboxActive ? '🛑 Deactivate Sandbox' : '⚡ Activate Sandbox'}
              </button>
              <button
                onClick={() => {
                  setSandboxActive(false);
                  setSandboxAmount(1000000);
                }}
                disabled={!sandboxActive}
                className="text-xs text-slate-500 font-bold hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset simulation
              </button>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300 ${sandboxActive ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none'}`}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">1. Target Vote & Category</label>
              <select
                value={sandboxTarget}
                onChange={(e) => setSandboxTarget(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {processedData.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.voteCode}-{cat.voteActivity} ({cat.categoryName.substring(0, 20)}...)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">2. Simulative Added Funds</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-sm">RM</span>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  value={sandboxAmount}
                  onChange={(e) => setSandboxAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">3. Sandbox Action</label>
              <div className="h-10 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="3000000"
                  step="100000"
                  value={sandboxAmount}
                  onChange={(e) => setSandboxAmount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================════════════════ */}
        {/* MAIN DETAILED FORECAST TABLE */}
        {/* =================================================════════════════ */}
        <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl border border-slate-800/80 shadow-xl overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Itemized Category Analysis</h3>
              <p className="text-xs text-slate-400 mt-0.5">Budget allocations, burn-rates, and forecast variances grouped by standard vote code</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Filter:</span>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Vote Codes</option>
                <option value="080702">Vote 080702</option>
                <option value="990102">Vote 990102</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-slate-900/60 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Vote Code & Category</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Annual Allocation</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">YTD Actual Spent</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Avg Monthly Use</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">EOY Projected Spend</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Variance / Shortfall</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Confidence & Trend</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {processedData
                  .filter(cat => selectedDepartment === 'all' || cat.voteCode === selectedDepartment)
                  .map((cat) => {
                    return (
                      <tr 
                        key={cat.id} 
                        className={`hover:bg-slate-800/30 transition-colors ${
                          sandboxActive && sandboxTarget === cat.id ? 'bg-indigo-950/20 border-l-4 border-l-indigo-500' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-slate-900 border border-slate-700 text-indigo-400 font-black px-2 py-0.5 rounded">
                                {cat.voteCode}-{cat.voteActivity}
                              </span>
                              {sandboxActive && sandboxTarget === cat.id && (
                                <span className="text-[10px] bg-indigo-900 text-indigo-200 px-1.5 py-0.2 rounded font-extrabold border border-indigo-500/20">
                                  +Simulated
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-white mt-1">{cat.categoryName}</div>
                            <div className="text-[10px] text-slate-400 font-medium">Forecast projection up to Q4 Dec 2026</div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-bold text-white">
                          {formatCurrency(cat.allocation)}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-200">
                          {formatCurrency(cat.ytdSpent)}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-bold text-indigo-300">
                          {formatCurrency(cat.avgMonthlyUse)}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-bold text-white">
                          {formatCurrency(cat.eoyProjectedSpend)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div>
                            <span className={`text-sm font-bold block ${cat.isDeficit ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {cat.isDeficit ? `-${formatCurrency(cat.shortfall)}` : `+${formatCurrency(cat.variance)}`}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                              cat.isDeficit 
                                ? 'bg-red-950/60 text-red-400 border border-red-900/40' 
                                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40'
                            }`}>
                              {cat.isDeficit ? 'Added Budget Needed' : 'Safe Surplus'}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-semibold text-slate-300 capitalize">{cat.trend}</span>
                              <span className="text-sm">
                                {cat.trend === 'increasing' ? '📈' : cat.trend === 'decreasing' ? '📉' : '➡️'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <div className="w-12 bg-slate-900 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    cat.confidence >= 90 ? 'bg-emerald-500' : 'bg-indigo-500'
                                  }`}
                                  style={{ width: `${cat.confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{cat.confidence}% conf</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setActiveDrawerId(cat.id)}
                            className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 inline-flex items-center space-x-1 group shadow"
                          >
                            <span>Why Backup</span>
                            <span className="transform group-hover:translate-x-1 transition-transform">➡️</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* =================================================════════════════ */}
        {/* QUARTERLY SPEND ANALYSIS SECTION */}
        {/* =================================================════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-md rounded-3xl border border-slate-800/80 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-1">Quarterly Financial Breakdown</h3>
            <p className="text-xs text-slate-400 mb-5">Comparison of allocation portions vs. actuals and projections by fiscal quarter</p>

            <div className="space-y-4">
              {quarterlyAnalysis.map((q) => {
                const percentUsed = (q.spent / q.allocation) * 100;
                
                return (
                  <div key={q.quarter} className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/40">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2.5 gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-white">{q.quarter}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black border uppercase tracking-wider ${
                          q.isProjected 
                            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-900/40' 
                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-900/40'
                        }`}>
                          {q.isProjected ? 'Projected / Simulated' : 'Completed Actual'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className="text-xs font-medium text-slate-400">
                          Spent: <span className="font-extrabold text-slate-200">{formatCurrency(q.spent)}</span> / {formatCurrency(q.allocation)}
                        </span>
                        
                        <span className={`text-xs font-extrabold ${q.status === 'safe' ? 'text-emerald-400' : q.status === 'warning' ? 'text-yellow-400' : 'text-rose-400'}`}>
                          {q.variance >= 0 ? `+${formatCurrency(q.variance)}` : `-${formatCurrency(Math.abs(q.variance))}`}
                        </span>
                      </div>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-800">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          q.status === 'safe' 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                            : q.status === 'warning' 
                              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 animate-pulse-slow' 
                              : 'bg-gradient-to-r from-rose-500 to-red-500 animate-pulse'
                        }`}
                        style={{ width: `${Math.min(100, percentUsed)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <span>0%</span>
                      <span>Target Portion: {formatCurrency(q.allocation)}</span>
                      <span>{percentUsed.toFixed(0)}% Used</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COL: ACCURACY & RISKS */}
          <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl border border-slate-800/80 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Fiscal Stability Metrics</h3>
              <p className="text-xs text-slate-400 mb-5">Predictive integrity indicators based on current burn-rates</p>

              <div className="space-y-4">
                <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Forecast Accuracy Rating</span>
                    <span className="text-sm text-slate-500 font-medium">Historical precision baseline</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-indigo-400 block">93.2%</span>
                    <span className="text-[10px] bg-indigo-950/80 text-indigo-300 font-bold px-1.5 py-0.2 rounded border border-indigo-900/40 uppercase">High Precision</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Identified High-Risk Codes</span>
                    <span className="text-sm text-slate-500 font-medium">Categories facing deficit</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-rose-400 block">
                      {processedData.filter(c => c.isDeficit).length}
                    </span>
                    <span className="text-[10px] bg-red-950/80 text-red-300 font-bold px-1.5 py-0.2 rounded border border-red-900/40 uppercase">Action Needed</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Annual Trend Analysis</span>
                    <span className="text-sm text-slate-500 font-medium">Year-on-year curve prediction</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-orange-400 block">Aggressive Expansion</span>
                    <span className="text-[10px] bg-orange-950/80 text-orange-300 font-bold px-1.5 py-0.2 rounded border border-orange-900/40 uppercase">CASLOAD SURGE</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-4 mt-6">
              <div className="flex items-start space-x-2 bg-slate-900/20 rounded-xl p-3 border border-slate-800">
                <span className="text-lg mt-0.5">ℹ️</span>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  This forecast model operates as an advanced predictive run-rate calculator. Projections adapt instantaneously to updates in the month index slider or simulative warrant overrides inside the Sandbox.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* =================================================════════════════ */}
      {/* GLASSMORPHIC SLIDE-OVER JUSTIFICATION DRAWER */}
      {/* =================================================════════════════ */}
      {activeDrawerId && activeDrawerCategory && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-modal="true" role="dialog">
          
          {/* Backdrop overlay */}
          <div 
            onClick={() => setActiveDrawerId(null)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl relative flex flex-col h-full transform transition-transform duration-300">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-indigo-900 text-indigo-300 font-black px-2 py-0.5 rounded border border-indigo-500/20">
                      {activeDrawerCategory.voteCode}-{activeDrawerCategory.voteActivity}
                    </span>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Purchasing Backup Details</span>
                  </div>
                  <h2 className="text-lg font-black text-white mt-1.5">{activeDrawerCategory.categoryName}</h2>
                </div>
                
                <button 
                  onClick={() => setActiveDrawerId(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Deficit Alert Banner */}
                <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                  activeDrawerCategory.isDeficit 
                    ? 'bg-red-950/30 border-red-700/30 text-white' 
                    : 'bg-emerald-950/30 border-emerald-700/30 text-white'
                }`}>
                  <span className="text-2xl mt-0.5">{activeDrawerCategory.isDeficit ? '⚠️' : '✅'}</span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block text-slate-400">Annual Run-Rate Summary</span>
                    <p className="text-sm font-semibold mt-1">
                      {activeDrawerCategory.isDeficit 
                        ? `A deficit of ${formatCurrency(activeDrawerCategory.shortfall)} is projected for this category based on standard 12-month average consumption.` 
                        : `This category is projected to finish the year safely with a surplus of ${formatCurrency(activeDrawerCategory.variance)}.`}
                    </p>
                  </div>
                </div>

                {/* KPI Breakdown */}
                <div className="grid grid-cols-3 gap-4 bg-slate-950/50 p-4 border border-slate-800/80 rounded-2xl">
                  <div className="text-center border-r border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Allocation</span>
                    <span className="text-sm font-extrabold text-white mt-1 block">{formatCurrency(activeDrawerCategory.allocation)}</span>
                  </div>
                  <div className="text-center border-r border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Avg Burn</span>
                    <span className="text-sm font-extrabold text-indigo-300 mt-1 block">{formatCurrency(activeDrawerCategory.avgMonthlyUse)}/mo</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">EOY Proj Spend</span>
                    <span className="text-sm font-extrabold text-white mt-1 block">{formatCurrency(activeDrawerCategory.eoyProjectedSpend)}</span>
                  </div>
                </div>

                {/* Itemized Justifications (The "Why" Backup) */}
                <div className="space-y-5">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Procurement & Itemized Driver Breakdown</h3>
                  
                  {activeDrawerCategory.justifications.map((item) => (
                    <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700/60 transition-colors">
                      
                      {/* Item Header */}
                      <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-black border border-slate-700/50">
                            {item.code}
                          </span>
                          <span className="text-sm font-extrabold text-white ml-2">{item.name}</span>
                        </div>
                        
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${
                          item.priority === 'CRITICAL' 
                            ? 'bg-rose-950/80 border-rose-700/40 text-rose-300' 
                            : item.priority === 'HIGH' 
                              ? 'bg-orange-950/80 border-orange-700/40 text-orange-300' 
                              : item.priority === 'MEDIUM' 
                                ? 'bg-yellow-950/80 border-yellow-700/40 text-yellow-300' 
                                : 'bg-slate-950 border-slate-700/40 text-slate-300'
                        }`}>
                          {item.priority}
                        </span>
                      </div>

                      {/* Item Body */}
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Est. Consumption</span>
                            <span className="text-xs font-semibold text-slate-300 mt-0.5 block">{item.monthlyConsumption}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Estimated Added Cost</span>
                            <span className="text-xs font-black text-rose-400 mt-0.5 block">
                              {item.addedCost > 0 ? formatCurrency(item.addedCost) : 'RM 0 (Covered)'}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-slate-850 pt-3">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Primary Purchasing Backing Justification</span>
                          <p className="text-xs font-medium text-slate-300 mt-1 leading-relaxed">
                            {item.reason}
                          </p>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end space-x-3">
                <button
                  onClick={() => setActiveDrawerId(null)}
                  className="bg-slate-800 text-slate-300 border border-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Dismiss Panel
                </button>
                {activeDrawerCategory.isDeficit && (
                  <button
                    onClick={() => {
                      setSandboxTarget(activeDrawerCategory.id);
                      setSandboxAmount(activeDrawerCategory.shortfall);
                      setSandboxActive(true);
                      setActiveDrawerId(null);
                    }}
                    className="bg-indigo-600 text-white border border-indigo-500 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow"
                  >
                    Simulate Top-Up
                  </button>
                )}
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
