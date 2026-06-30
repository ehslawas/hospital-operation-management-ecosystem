// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Calendar,
  Wallet,
  ArrowUpRight,
  BarChart3,
  RefreshCw,
  Search,
  FileText,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  BarChart2
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Spinner, Badge, Button } from '@/components/ui'
import { getBudgetSummary, getBudgets } from '@/services/pharmacy/budgetService'
import type { BudgetSummary, Budget } from '@/types/pharmacy'
import { cn, formatCurrency } from '@/lib/utils'

export const BudgetOverviewPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear())
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const load = async () => {
    if (!hospitalId) return
    setIsLoading(true)
    setError(null)

    const [summaryRes, budgetsRes] = await Promise.all([
      getBudgetSummary(hospitalId, fiscalYear),
      getBudgets(hospitalId, fiscalYear),
    ])

    if (summaryRes.error) {
      setError(summaryRes.error)
    } else {
      setSummary(summaryRes.data)
    }

    if (budgetsRes.data) {
      setBudgets(budgetsRes.data)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    void load()
  }, [hospitalId, fiscalYear])

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

  const filteredBudgets = budgets
  const totalPages = Math.ceil(filteredBudgets.length / pageSize)
  const paginatedBudgets = useMemo(() => {
    return filteredBudgets.slice((page - 1) * pageSize, page * pageSize)
  }, [filteredBudgets, page, pageSize])

  // Reset to first page when fiscalYear changes
  useEffect(() => {
    setPage(1)
  }, [fiscalYear])

  return (
    <div className="min-h-screen bg-[#fcfdfe] relative font-sans overflow-x-hidden pb-16">
      {/* Premium Ambient Radial Lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/[0.04] to-blue-500/[0.02] rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/[0.02] to-teal-500/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-8">
        
        {/* Breadcrumbs & Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="space-y-4"
        >
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="text-slate-400">Financial</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-extrabold tracking-wide">Budget Overview</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                  Budget Overview
                </h1>
                <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                  FY {fiscalYear} Distribution Control & Consolidated Summary
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2.5 bg-white/85 border border-slate-150 px-4 py-2.5 rounded-2xl shadow-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-black text-slate-700 focus:outline-none cursor-pointer outline-none"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      FY {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={load}
                className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-450 hover:text-slate-800 transition-colors shadow-sm active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Loading / Error States */}
        {isLoading && !summary && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-150 shadow-sm">
            <Spinner size="lg" className="text-indigo-650 mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregating budget sheets...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2rem] flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-rose-550 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-rose-950 font-black text-sm uppercase tracking-wide">Synchronization Error</h3>
              <p className="text-rose-650 text-xs font-bold mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && summary && (
          <div className="space-y-8">
            
            {/* Elevated Dashboard KPI Metrics Section wrapped in a luxurious white background card */}
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl mb-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Total Allocated */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="bg-emerald-50/50 border-2 border-emerald-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-widest leading-none">Total Allocated</p>
                      <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-emerald-900 mt-2.5 tracking-tight tabular-nums truncate" title={formatCurrency(summary.total_allocated).replace('MYR', 'RM')}>
                        {formatCurrency(summary.total_allocated).replace('MYR', 'RM')}
                      </h3>
                      <p className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1.5 pt-0.5">
                        <span>Aggregate ceiling cap</span>
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Total Utilized */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-blue-50/50 border-2 border-blue-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-blue-50 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-900/60 uppercase tracking-widest leading-none">Total Utilized</p>
                      <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-blue-900 mt-2.5 tracking-tight tabular-nums truncate" title={formatCurrency(summary.total_utilized).replace('MYR', 'RM')}>
                        {formatCurrency(summary.total_utilized).replace('MYR', 'RM')}
                      </h3>
                      <p className="text-[11px] font-bold text-blue-650 mt-2 flex items-center gap-1.5 pt-0.5">
                        <span className="font-extrabold">{summary.utilization_percentage.toFixed(1)}%</span>
                        <span>utilization rate reached</span>
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Available Balance */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="bg-violet-50/50 border-2 border-violet-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-violet-50 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="w-12 h-12 bg-violet-100 border border-violet-200 rounded-2xl flex items-center justify-center text-violet-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-violet-900/60 uppercase tracking-widest leading-none">Remaining Balance</p>
                      <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-violet-900 mt-2.5 tracking-tight tabular-nums truncate" title={formatCurrency(summary.total_available).replace('MYR', 'RM')}>
                        {formatCurrency(summary.total_available).replace('MYR', 'RM')}
                      </h3>
                      <p className="text-[11px] font-bold text-violet-605 mt-2 flex items-center gap-1.5 pt-0.5">
                        <span className="font-extrabold">{(100 - summary.utilization_percentage).toFixed(1)}%</span>
                        <span>surplus remaining</span>
                      </p>
                    </div>
                  </div>
                </motion.div>

              </div>

              {/* Secondary Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-100">
                <div className="bg-amber-50/50 border-2 border-amber-100 p-5 rounded-[2rem] flex items-center gap-4 group hover:bg-amber-50 hover:border-amber-200 hover:shadow-xl transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-200 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-amber-900/65 uppercase tracking-widest leading-none">Committed Liabilities</p>
                    <h4 className="text-lg font-black text-amber-900 mt-1.5 tabular-nums">{formatCurrency(summary.total_committed).replace('MYR', 'RM')}</h4>
                  </div>
                </div>

                <div className="bg-sky-50/50 border-2 border-sky-100 p-5 rounded-[2rem] flex items-center gap-4 group hover:bg-sky-50 hover:border-sky-200 hover:shadow-xl transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center border border-sky-200 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-sky-900/65 uppercase tracking-widest leading-none">Utilization Trend</p>
                    <h4 className="text-lg font-black text-sky-900 mt-1.5 tabular-nums">{summary.utilization_percentage.toFixed(1)}%</h4>
                  </div>
                </div>

                <div className="bg-emerald-50/50 border-2 border-emerald-100 p-5 rounded-[2rem] flex items-center gap-4 group hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-xl transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-900/65 uppercase tracking-widest leading-none">Budget Health Status</p>
                    <h4 className="text-lg font-black text-emerald-600 uppercase tracking-wider text-[11px] mt-1.5">Healthy Distribution</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown Charts - Premium Styling */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Type Distribution */}
              <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/10 p-6 lg:p-8 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">By Budget Type</h3>
                    <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Allocations by source program</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {summary.by_type.map((item, idx) => {
                    const usage = item.allocated > 0 ? (item.utilized / item.allocated) * 100 : 0
                    
                    const barColors = [
                      'bg-indigo-500',
                      'bg-emerald-500',
                      'bg-sky-500'
                    ]
                    const barColor = barColors[idx % barColors.length]
                    
                    return (
                      <div key={item.type} className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-black text-slate-705 uppercase tracking-widest bg-white border px-2 py-0.5 rounded-lg shadow-sm">
                            {item.type}
                          </span>
                          <span className="font-bold text-slate-500 text-[11px]">
                            <span className="font-black text-slate-800">{formatCurrency(item.utilized).replace('MYR', 'RM')}</span>
                            {' '}/{' '}
                            <span>{formatCurrency(item.allocated).replace('MYR', 'RM')}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${usage}%` }}
                              className={`h-full rounded-full ${barColor}`}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-700 w-8 text-right tabular-nums">
                            {usage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/10 p-6 lg:p-8 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">By Pharmaceutical Category</h3>
                    <p className="text-[10px] font-bold text-slate-455 uppercase tracking-widest">Cap utilization based on catalog classes</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {summary.by_category.map((item, idx) => {
                    const usage = item.allocated > 0 ? (item.utilized / item.allocated) * 100 : 0
                    
                    const barColors = [
                      'bg-blue-500',
                      'bg-violet-500',
                      'bg-amber-500',
                      'bg-rose-500'
                    ]
                    const barColor = barColors[idx % barColors.length]
                    
                    return (
                      <div key={item.category} className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-black text-slate-705 uppercase tracking-widest bg-white border px-2 py-0.5 rounded-lg shadow-sm">
                            {item.category.replace('_', ' ')}
                          </span>
                          <span className="font-bold text-slate-500 text-[11px]">
                            <span className="font-black text-slate-800">{formatCurrency(item.utilized).replace('MYR', 'RM')}</span>
                            {' '}/{' '}
                            <span>{formatCurrency(item.allocated).replace('MYR', 'RM')}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${usage}%` }}
                              className={`h-full rounded-full ${barColor}`}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-700 w-8 text-right tabular-nums">
                            {usage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Detailed Table Registry Card Wrapper */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-200/80 overflow-hidden relative z-10">
              <div className="p-6 lg:p-8 border-b border-slate-100/80">
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-950" />
                  Budget Distribution Breakdown
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Detailed allocation records for FY {fiscalYear}</p>
              </div>
              
              {/* Desktop View - Table */}
              <div className="hidden lg:block px-4 pb-4">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-indigo-50/10 border-b border-slate-200/80">
                      <th className="w-1.5 p-0" />
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Type</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Allocated</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Utilized</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Available</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedBudgets.map((budget) => (
                      <tr key={budget.id} className="hover:bg-slate-50/50 transition-colors duration-200 group cursor-pointer relative h-16">
                        <td className="w-1.5 p-0 relative">
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-600 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center rounded-r" />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest bg-slate-100/80 border border-slate-150 px-2.5 py-1 rounded-lg">
                            {budget.budget_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide capitalize">{budget.category.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">
                          {formatCurrency(budget.allocated_amount).replace('MYR', 'RM')}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-750 tabular-nums">
                          {formatCurrency(budget.utilized_amount).replace('MYR', 'RM')}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600 tabular-nums">
                          {formatCurrency(budget.available_amount).replace('MYR', 'RM')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={budget.status === 'active' ? 'success' : 'secondary'} className="rounded-lg px-2.5 py-0.5 font-black uppercase text-[8px] tracking-widest">
                            {budget.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View - Cards */}
              <div className="lg:hidden space-y-4 py-4 px-4">
                {paginatedBudgets.map((budget) => (
                  <div key={budget.id} className="bg-white border-2 border-slate-100 rounded-[2rem] p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest bg-slate-100 px-2.5 py-0.5 rounded-lg w-fit border border-slate-150">
                          {budget.budget_type}
                        </span>
                        <span className="text-xs font-black text-slate-850 uppercase tracking-wider capitalize">
                          {budget.category.replace('_', ' ')}
                        </span>
                      </div>
                      <Badge variant={budget.status === 'active' ? 'success' : 'secondary'} className="rounded-lg px-2 py-0.5 font-black uppercase text-[8px] tracking-widest">
                        {budget.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 pt-3 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Allocated</p>
                        <p className="text-xs font-black text-slate-800 tabular-nums">{formatCurrency(budget.allocated_amount).replace('MYR', 'RM')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Utilized</p>
                        <p className="text-xs font-bold text-slate-650 tabular-nums">{formatCurrency(budget.utilized_amount).replace('MYR', 'RM')}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Available</p>
                        <p className="text-sm font-black text-emerald-600 tabular-nums">{formatCurrency(budget.available_amount).replace('MYR', 'RM')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {filteredBudgets.length > 0 && (
                <div className="mt-8 pt-6 pb-6 px-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Count Summary */}
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                    Showing <span className="text-slate-900 font-bold">{(page - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * pageSize, filteredBudgets.length)}</span> of <span className="text-slate-900 font-bold">{filteredBudgets.length}</span> entries
                  </div>

                  {/* Page Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Jump-to dropdown */}
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/50">
                        <span>Jump to</span>
                        <select 
                          value={page}
                          onChange={(e) => setPage(Number(e.target.value))}
                          className="bg-white border border-slate-200/80 rounded-lg px-1.5 py-0.5 font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {Array.from({ length: totalPages }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Standard Pill Controls with Chevron/Chevron Double */}
                    <div className="flex items-center gap-1 bg-slate-100/60 p-1 rounded-2xl border border-slate-200/20">
                      <button
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm text-slate-600 active:scale-95"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm text-slate-600 active:scale-95"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      {/* Dynamic numeric pages rendering */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            "h-9 w-9 rounded-xl font-bold text-xs active:scale-95 transition-all border",
                            page === pageNum 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10' 
                              : 'border-slate-200/30 text-slate-500 bg-white hover:bg-slate-50'
                          )}
                        >
                          {pageNum}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm text-slate-600 active:scale-95"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage(totalPages)}
                        disabled={page >= totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm text-slate-600 active:scale-95"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default BudgetOverviewPage
