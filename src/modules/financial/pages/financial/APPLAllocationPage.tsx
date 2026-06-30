// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Info,
  BarChart2,
  PieChart,
  X,
  FileText,
  ShoppingCart,
  Sparkles,
  Zap
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { cn, formatDateTime, formatCurrency, formatDate } from '@/lib/utils'
import { Spinner, Button, Input, Select, Badge, Table } from '@/components/ui'
import {
  getUnifiedBudgetSummary,
  getExpenseList
} from '@/services/pharmacy/budgetEngine'
import {
  getPurchaseOrderDetails,
  syncAPPLExpensesFromPOs,
} from '@/services/pharmacy/applAllocationService'
import { supabase } from '@/services/supabase'
import { WARRANT_CATEGORIES, WARRANT_DEPARTMENTS, normalize } from '@/services/pharmacy/warrantService'
import type { UnifiedBudgetSummary, PurchaseOrderWithRelations, PurchaseOrderItem } from '@/types/pharmacy'

interface PurchaseOrderItemWithDetails extends PurchaseOrderItem {
  item_name?: string
}

export const APPLAllocationPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  const hospitalId = user?.hospital_id

  const [summary, setSummary] = useState<UnifiedBudgetSummary | null>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterVoteActivity, setFilterVoteActivity] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const [isSyncing, setIsSyncing] = useState(false)
  
  // PO Detail State
  const [selectedPO, setSelectedPO] = useState<any | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // Years for dropdown
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  // Fetch data
  useEffect(() => {
    if (!hospitalId) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [summaryResult, expensesResult] = await Promise.all([
          getUnifiedBudgetSummary({
            hospitalId,
            fiscalYear: selectedYear,
            voteCode: '990102',
            voteActivity: filterVoteActivity !== 'all' ? filterVoteActivity as any : undefined,
            category: filterCategory !== 'all' ? filterCategory as any : undefined,
          }),
          getExpenseList({
            hospitalId,
            fiscalYear: selectedYear,
            voteCode: '990102',
            status: filterStatus !== 'all' ? filterStatus : undefined,
            voteActivity: filterVoteActivity !== 'all' ? filterVoteActivity as any : undefined,
            category: filterCategory !== 'all' ? filterCategory as any : undefined,
          }),
        ])

        if (summaryResult.error) {
          setError(summaryResult.error)
        } else {
          setSummary(summaryResult.data)
        }

        if (expensesResult.error) {
          setError(expensesResult.error)
        } else {
          setExpenses(expensesResult.data || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [hospitalId, selectedYear, filterStatus, filterVoteActivity, filterCategory])

  // Sync expenses from POs
  const handleSync = async () => {
    if (!hospitalId) return

    setIsSyncing(true)
    try {
      const result = await syncAPPLExpensesFromPOs(hospitalId, selectedYear)
      if (result.error) {
        showError('Sync failed', result.error)
      } else if (result.data) {
        showSuccess('Sync completed', `Synced ${result.data.synced} expenses from Purchase Orders`)
        // Reload data
        window.location.reload()
      }
    } catch (err) {
      showError('Sync failed', err instanceof Error ? err.message : 'Failed to sync expenses')
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredExpenses = useMemo(() => {
    let filtered = expenses

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.po_number.toLowerCase().includes(query) ||
          (e.lpo_number && e.lpo_number.toLowerCase().includes(query)) ||
          (e.purchase_order?.supplier?.company_name?.toLowerCase().includes(query)) ||
          (e.purchase_order?.items?.some((item: any) => 
            (item.item_name && item.item_name.toLowerCase().includes(query)) ||
            (item.item_code && item.item_code.toLowerCase().includes(query)) ||
            (item.item_id && item.item_id.toLowerCase().includes(query))
          ))
      )
    }

    return filtered
  }, [expenses, searchQuery])

  // Pagination Logic
  const totalPages = Math.ceil(filteredExpenses.length / pageSize)
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredExpenses.slice(start, start + pageSize)
  }, [filteredExpenses, currentPage, pageSize])

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterVoteActivity, filterCategory, selectedYear])

  // Handle View Details
  const handleViewDetails = async (poId: string) => {
    setIsDetailLoading(true)
    setIsDrawerOpen(true)
    try {
      const result = await getPurchaseOrderDetails(hospitalId!, poId)
      if (result.error) {
        showError('Failed to load details', result.error)
        setIsDrawerOpen(false)
      } else if (result.data) {
        const po = result.data
        if (po.items && po.items.length > 0) {
          const itemsWithNames = await Promise.all(
            po.items.map(async (item: any) => {
              if (!item.item_id || item.item_id === 'null') {
                return item
              }

              try {
                let name = item.item_name || `Item #${item.item_id.substring(0, 8)}`
                
                if (!item.item_name) {
                  const primaryTable = item.item_type === 'drug' ? 'drugs' : 'non_drugs'
                  const primaryField = item.item_type === 'drug' ? 'drug_name' : 'item_name'
                  
                  const { data: primaryData } = await supabase
                    .from(primaryTable)
                    .select(primaryField)
                    .eq('id', item.item_id)
                    .maybeSingle()
                  
                  if (primaryData) {
                    name = primaryData[primaryField]
                  } else {
                    const fallbackTable = item.item_type === 'drug' ? 'appl_drugs' : 'appl_non_drugs'
                    const { data: fallbackData } = await supabase
                      .from(fallbackTable)
                      .select('item_name')
                      .eq('id', item.item_id)
                      .maybeSingle()
                    
                    if (fallbackData) {
                      name = fallbackData.item_name
                    }
                  }
                }
                
                return {
                  ...item,
                  item_name: name
                }
              } catch (err) {
                console.error(`Error fetching name for item ${item.item_id}:`, err)
                return { ...item, item_name: item.item_name || `Item #${item.item_id.substring(0, 8)}` }
              }
            })
          )
          setSelectedPO({ ...po, items: itemsWithNames })
        } else {
          setSelectedPO(po)
        }
      }
    } catch (err) {
      showError('Error', 'An unexpected error occurred')
      setIsDrawerOpen(false)
    } finally {
      setIsDetailLoading(false)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'secondary'; label: string }> = {
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'info', label: 'Approve' },
      completed: { color: 'success', label: 'Complete' },
      cancelled: { color: 'error', label: 'Cancel' },
    }
    const cfg = map[status] || { color: 'secondary', label: status }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  // Get PO type badge
  const getPoTypeBadge = (poType: string) => {
    const map: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'secondary'; label: string }> = {
      regular: { color: 'info', label: 'PO' },
      lpo: { color: 'success', label: 'LPO' },
      emergency: { color: 'error', label: 'Emergency' },
    }
    const cfg = map[poType] || { color: 'secondary', label: poType }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] relative font-sans overflow-x-hidden pb-16">
      {/* Premium Ambient Radial Lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/[0.04] to-indigo-500/[0.02] rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-subtle" />
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
            <span className="text-slate-800 font-extrabold tracking-wide">APPL Allocation</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                  APPL Allocation (990102)
                </h1>
                <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                  Track purchase orders (PO/LPO) distribution constraints and warrant status
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="h-10 px-5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-950 hover:to-black text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 flex items-center gap-1.5 active:scale-95 hover:shadow-lg hover:shadow-slate-300/30 disabled:opacity-50"
              >
                <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                Sync POs
              </button>
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-150 shadow-sm">
            <Spinner size="lg" className="text-indigo-650 mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling APPL sheets...</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-2xl border-2 border-rose-100 bg-gradient-to-r from-rose-50 to-red-50 p-4 text-sm text-rose-700 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold uppercase text-xs tracking-wider">Synchronization Failure</p>
              <p className="mt-0.5 text-rose-600 font-bold">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Financial Dashboard */}
        {!isLoading && !error && summary && (
          <div className="space-y-8">
            {/* Information Alert */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-50/50 border-l-4 border-indigo-600 rounded-r-2xl p-4 flex items-start gap-3 shadow-sm"
            >
              <Info className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-indigo-950 uppercase tracking-wider">Fiscal Year {selectedYear} System Alerts</p>
                <p className="text-[11px] font-semibold text-indigo-750 mt-1 leading-relaxed">
                  This registry aggregates contract allocation metrics and records real-time procurement deductions. Sync purchase orders regularly to maintain accounting accuracy.
                </p>
              </div>
            </motion.div>

            {/* Filtering Bar */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/10 flex flex-col gap-4">
              
              {/* Row 1: Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by PO/LPO number, supplier, items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 h-11 bg-slate-50 hover:bg-slate-100/50 border border-slate-150 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Row 2: Filters & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-2xl px-4 py-2.5 min-w-[130px]">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-transparent text-xs font-black text-slate-700 focus:outline-none cursor-pointer w-full outline-none"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          FY {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl px-4 py-2.5 flex items-center justify-between min-w-[150px]">
                    <select
                      value={filterVoteActivity}
                      onChange={(e) => setFilterVoteActivity(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-700 focus:outline-none cursor-pointer w-full outline-none"
                    >
                      <option value="all">All Activities</option>
                      <option value="27401">27401</option>
                      <option value="27499">27499</option>
                    </select>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl px-4 py-2.5 flex items-center justify-between min-w-[160px]">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-700 focus:outline-none cursor-pointer w-full outline-none"
                    >
                      <option value="all">All Categories</option>
                      {WARRANT_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl px-4 py-2.5 flex items-center justify-between min-w-[150px]">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-700 focus:outline-none cursor-pointer w-full outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="approved">Approved</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => window.location.reload()}
                    className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-450 hover:text-slate-800 transition-colors shadow-sm active:scale-95"
                    title="Refresh Data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Elevated Dashboard KPI Metrics Section wrapped in a luxurious white background card */}
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl mb-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Total Allocation */}
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
                      <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-widest leading-none">
                        {filterVoteActivity !== 'all' ? `Allocation (${filterVoteActivity})` : 'Total Allocation'}
                      </p>
                      <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-emerald-900 mt-2.5 tracking-tight tabular-nums truncate" title={formatCurrency(summary.total_allocation).replace('MYR', 'RM')}>
                        {formatCurrency(summary.total_allocation).replace('MYR', 'RM')}
                      </h3>
                      <p className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1.5 pt-0.5">
                        <span className="font-extrabold">{summary.total_count}</span>
                        <span>Allocation records registered</span>
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Total Expenses */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-rose-50/50 border-2 border-rose-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-rose-50 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rose-900/60 uppercase tracking-widest leading-none">Total Expenses</p>
                      <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-rose-900 mt-2.5 tracking-tight tabular-nums truncate" title={formatCurrency(summary.total_expenses).replace('MYR', 'RM')}>
                        {formatCurrency(summary.total_expenses).replace('MYR', 'RM')}
                      </h3>
                      <p className="text-[11px] font-bold text-rose-605 mt-2 flex items-center gap-1.5 pt-0.5">
                        <span className="font-extrabold">{summary.usage_percentage.toFixed(1)}%</span>
                        <span>utilization rate reached</span>
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Balance */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className={cn(
                    "p-6 rounded-[2.5rem] relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default border-2",
                    summary.total_balance < 0 
                      ? "bg-rose-50/50 border-rose-100 hover:bg-rose-50 hover:border-rose-200 hover:shadow-rose-100/40" 
                      : "bg-blue-50/50 border-blue-100 hover:bg-blue-50 hover:border-blue-200 hover:shadow-blue-100/40"
                  )}
                >
                  <div className={cn(
                    "absolute top-0 right-0 w-32 h-32 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300",
                    summary.total_balance < 0 ? "bg-rose-500/10" : "bg-blue-500/10"
                  )} />
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className={cn(
                      "w-12 h-12 border rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300",
                      summary.total_balance < 0 ? "bg-rose-100 border-rose-200 text-rose-600" : "bg-blue-100 border-blue-200 text-blue-600"
                    )}>
                      <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={cn(
                        "text-xs font-bold uppercase tracking-widest leading-none",
                        summary.total_balance < 0 ? "text-rose-900/60" : "text-blue-900/60"
                      )}>
                        {filterVoteActivity !== 'all' ? 'Activity Balance' : 'Consolidated Balance'}
                      </p>
                      <h3 className={cn(
                        "text-2xl sm:text-3xl xl:text-4xl font-black mt-2.5 tracking-tight tabular-nums truncate",
                        summary.total_balance < 0 ? "text-rose-900" : "text-blue-900"
                      )} title={formatCurrency(summary.total_balance).replace('MYR', 'RM')}>
                        {formatCurrency(summary.total_balance).replace('MYR', 'RM')}
                      </h3>
                      <p className={cn(
                        "text-[11px] font-bold mt-2 flex items-center gap-1.5 pt-0.5",
                        summary.total_balance < 0 ? "text-rose-600" : "text-blue-600"
                      )}>
                        <span className="font-extrabold">{(100 - summary.usage_percentage).toFixed(1)}%</span>
                        <span>Remaining balance</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Sub-metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-100">
                <div className="bg-amber-50/50 border-2 border-amber-100 p-5 rounded-[2rem] flex items-center gap-4 group hover:bg-amber-50 hover:border-amber-200 hover:shadow-xl transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-200 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-amber-900/65 uppercase tracking-widest leading-none">Committed Liabilities</p>
                    <h4 className="text-lg font-black text-amber-900 mt-1.5 tabular-nums">{formatCurrency(summary.total_liabilities).replace('MYR', 'RM')}</h4>
                  </div>
                </div>

                <div className="bg-sky-50/50 border-2 border-sky-100 p-5 rounded-[2rem] flex items-center gap-4 group hover:bg-sky-50 hover:border-sky-200 hover:shadow-xl transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center border border-sky-200 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-sky-900/65 uppercase tracking-widest leading-none">Net Expenses</p>
                    <h4 className="text-lg font-black text-sky-900 mt-1.5 tabular-nums">{formatCurrency(summary.net_expenses).replace('MYR', 'RM')}</h4>
                  </div>
                </div>

                <div className="bg-teal-50/50 border-2 border-teal-100 p-5 rounded-[2rem] flex items-center gap-4 group hover:bg-teal-50 hover:border-teal-200 hover:shadow-xl transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 bg-teal-100 text-teal-605 rounded-2xl flex items-center justify-center border border-teal-200 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-teal-900/65 uppercase tracking-widest leading-none">Usage rate</p>
                      <span className="text-[10px] font-black text-teal-600 leading-none">{summary.usage_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(summary.usage_percentage, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Records Table Registry Card Wrapper */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-200/80 overflow-hidden relative z-10">
              <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-950" />
                    Deduction Logs
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{filteredExpenses.length} entries registered</p>
                </div>
              </div>

              {/* Desktop View - Table */}
              <div className="hidden lg:block px-4 pb-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-indigo-50/10 border-b border-slate-200/80">
                      <th className="w-1.5 p-0" />
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PO Number</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">LPO Number</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Type</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Approved By</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                      <th className="w-10 px-3 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedExpenses.length > 0 ? (
                      paginatedExpenses.map((expense) => (
                        <tr 
                          key={expense.id} 
                          onClick={() => handleViewDetails(expense.po_id)}
                          className="hover:bg-slate-50/50 transition-colors duration-200 group cursor-pointer relative h-16"
                        >
                          {/* Slide-in Hover Accent Indicator */}
                          <td className="w-1.5 p-0 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-650 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center rounded-r" />
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-xs text-slate-500 tabular-nums">{formatDate(expense.expense_date)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetails(expense.po_id)
                              }}
                              className="font-mono font-black text-xs text-indigo-650 hover:text-indigo-800 hover:underline transition-all tabular-nums"
                            >
                              {expense.po_number}
                            </button>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700 tabular-nums">
                            {expense.lpo_number || '—'}
                          </td>
                          <td className="px-6 py-4">
                            {getPoTypeBadge(expense.po_type)}
                          </td>
                          <td className="px-6 py-4 font-black text-slate-900 tabular-nums">
                            {formatCurrency(Number(expense.amount)).replace('MYR', 'RM')}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600">
                            {expense.purchase_order?.approver?.full_name || '—'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(expense.status)}
                          </td>
                          <td className="w-10 px-3 py-4 text-right">
                            <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                          No expenses matching parameters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View - Cards */}
              <div className="lg:hidden space-y-4 py-4 px-4">
                {paginatedExpenses.length > 0 ? (
                  paginatedExpenses.map((expense) => (
                    <div 
                      key={expense.id} 
                      className="bg-white border-2 border-slate-100 rounded-[2rem] p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-205 cursor-pointer"
                      onClick={() => handleViewDetails(expense.po_id)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {formatDate(expense.expense_date)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-indigo-650">{expense.po_number}</span>
                            {getPoTypeBadge(expense.po_type)}
                          </div>
                        </div>
                        {getStatusBadge(expense.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 pt-3 border-t border-slate-50">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">LPO Number</span>
                          <span className="text-xs font-mono font-bold text-slate-800">{expense.lpo_number || '—'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Amount</span>
                          <span className="text-sm font-black text-slate-950 tabular-nums">{formatCurrency(Number(expense.amount)).replace('MYR', 'RM')}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Approved By</span>
                          <span className="text-xs font-bold text-slate-700">
                            {expense.purchase_order?.approver?.full_name || '—'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No expenses logged</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {!isLoading && filteredExpenses.length > 0 && (
                <div className="mt-8 pt-6 pb-6 px-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Count Summary */}
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                    Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(currentPage * pageSize, filteredExpenses.length)}</span> of <span className="text-slate-900 font-bold">{filteredExpenses.length}</span> entries
                  </div>

                  {/* Page Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Jump-to dropdown */}
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/50">
                        <span>Jump to</span>
                        <select 
                          value={currentPage}
                          onChange={(e) => setCurrentPage(Number(e.target.value))}
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
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm text-slate-600 active:scale-95"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm text-slate-600 active:scale-95"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      {/* Dynamic numeric pages rendering */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            "h-9 w-9 rounded-xl font-bold text-xs active:scale-95 transition-all border",
                            currentPage === pageNum 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10' 
                              : 'border-slate-200/30 text-slate-500 bg-white hover:bg-slate-50'
                          )}
                        >
                          {pageNum}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm text-slate-600 active:scale-95"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage >= totalPages}
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

      {/* PO Detail Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-[70] flex flex-col font-sans"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-2xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Purchase Order Details</h2>
                    <p className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-widest">{selectedPO?.po_number}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isDetailLoading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="w-8 h-8 text-indigo-650 animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching PO contents...</p>
                  </div>
                ) : selectedPO ? (
                  <>
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</p>
                        <p className="text-xs font-bold text-slate-800 leading-tight">
                          {WARRANT_DEPARTMENTS.find(d => d.value === normalize(selectedPO.department || ''))?.label || selectedPO.department || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Category & Vote</p>
                        <p className="text-xs font-bold text-slate-800 leading-tight">
                          {WARRANT_CATEGORIES.find(c => c.value === selectedPO.category)?.label || selectedPO.category || 'N/A'}
                          {selectedPO.vote_code && <span className="block text-[10px] text-slate-500 mt-1 font-semibold font-mono">{selectedPO.vote_code} - {selectedPO.vote_activity}</span>}
                        </p>
                      </div>
                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Supplier</p>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{selectedPO.supplier?.company_name || selectedPO.manual_supplier_name || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Date</p>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{formatDate(selectedPO.order_date)}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Created By</p>
                        <p className="text-xs font-bold text-slate-800 leading-tight leading-snug">{selectedPO.creator_name || selectedPO.creator?.full_name || selectedPO.signature_snapshot?.applicantName || 'Pegawai Bertanggungjawab'}</p>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold">{formatDateTime(selectedPO.created_at)}</p>
                      </div>
                      {(selectedPO.status === 'approved' || selectedPO.approved_at) && (
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Approved By</p>
                          <p className="text-xs font-bold text-slate-800 leading-snug">
                            {selectedPO.approver_name || selectedPO.approver?.full_name || selectedPO.signature_snapshot?.headName || 'System (Auto)'}
                          </p>
                          {selectedPO.approved_at && (
                            <p className="text-[9px] text-slate-400 mt-1 font-bold">{formatDateTime(selectedPO.approved_at)}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cancellation Reason if applicable */}
                    {selectedPO.status === 'cancelled' && selectedPO.notes && (
                      <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[9px] font-black text-rose-650 uppercase tracking-widest mb-1">Cancellation Reason</p>
                          <p className="text-xs font-bold text-rose-900 leading-relaxed">{selectedPO.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Items Table */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">Purchase Items</h3>
                      <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/50">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-150 text-[9px] font-black text-slate-400 uppercase">
                            <tr>
                              <th className="py-3 px-4">Item Name</th>
                              <th className="py-3 px-4 text-center">Qty</th>
                              <th className="py-3 px-4 text-right">Unit Price</th>
                              <th className="py-3 px-4 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedPO.items?.map((item: any, idx: number) => (
                              <tr key={idx} className="text-xs hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-4 font-bold text-slate-800">{item.item_name}</td>
                                <td className="py-4 px-4 text-center text-slate-500 font-bold">
                                  {item.quantity_ordered || item.quantity} {item.packaging_description || item.uom}
                                </td>
                                <td className="py-4 px-4 text-right text-slate-500 font-semibold tabular-nums">{formatCurrency(Number(item.unit_price)).replace('MYR', '')}</td>
                                <td className="py-4 px-4 text-right font-black text-indigo-650 tabular-nums">{formatCurrency(Number(item.total_price)).replace('MYR', '')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                      <span className="text-xl font-black text-indigo-650 tabular-nums">{formatCurrency(Number(selectedPO.total_amount))}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center">
                    <AlertTriangle className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-bold text-sm uppercase text-slate-450 tracking-widest">Failed to load PO details</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default APPLAllocationPage
