import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Calendar,
  FileText,
  RefreshCw,
  Search,
  Download,
  FileDown,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Spinner, Button, Badge, Table } from '@/components/ui'
import {
  getAPPLAllocationSummary,
  getAPPLExpenses,
  syncAPPLExpensesFromPOs,
} from '@/services/pharmacy/applAllocationService'
import {
  exportAPPLToPDF,
  exportAPPLToCSV,
} from '@/services/pharmacy/applExportService'
import type { APPLAllocationSummary, APPLExpenseWithRelations } from '@/types/pharmacy'

export const APPLAllocationPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  const hospitalId = user?.hospital_id

  const [summary, setSummary] = useState<APPLAllocationSummary | null>(null)
  const [expenses, setExpenses] = useState<APPLExpenseWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterVoteActivity, setFilterVoteActivity] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)

  // Years for dropdown
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  // Fetch data
  useEffect(() => {
    if (!hospitalId) return

    const fetchData = async () => {
      // Trigger background sync first to ensure data is fresh
      if (hospitalId) {
        syncAPPLExpensesFromPOs(hospitalId, selectedYear).catch(console.error)
      }

      setIsLoading(true)
      setError(null)

      try {
        const [summaryResult, expensesResult] = await Promise.all([
          getAPPLAllocationSummary(hospitalId, selectedYear, {
            voteActivity: filterVoteActivity !== 'all' ? filterVoteActivity : undefined,
          }),
          getAPPLExpenses(hospitalId, selectedYear, {
            status: filterStatus !== 'all' ? filterStatus : undefined,
            voteActivity: filterVoteActivity !== 'all' ? filterVoteActivity : undefined,
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
  }, [hospitalId, selectedYear, filterStatus, filterVoteActivity])

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

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    let filtered = expenses

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.po_number.toLowerCase().includes(query) ||
          (e.lpo_number && e.lpo_number.toLowerCase().includes(query)) ||
          (e.purchase_order?.supplier?.company_name?.toLowerCase().includes(query))
      )
    }

    // Sort by date (newest first) and then by PO number (highest first)
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.expense_date).getTime()
      const dateB = new Date(b.expense_date).getTime()
      if (dateB !== dateA) return dateB - dateA
      return b.po_number.localeCompare(a.po_number)
    })
  }, [expenses, searchQuery])

  // Get hospital name
  const hospitalName = user?.hospital?.hospital_name || 'Hospital'

  // Handle PDF Export
  const handleExportPDF = async () => {
    if (!summary || filteredExpenses.length === 0) {
      showError('No data to export', 'Please ensure there are expenses to export')
      return
    }

    setIsExporting(true)
    try {
      const blob = await exportAPPLToPDF(
        filteredExpenses,
        summary,
        hospitalName,
        selectedYear,
        {
          voteActivity: filterVoteActivity !== 'all' ? filterVoteActivity : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        }
      )

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appl-allocation-report-${hospitalName.replace(/\s+/g, '-')}-FY${selectedYear}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showSuccess('Export successful', 'APPL allocation report exported as PDF')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      showError('Export failed', 'Failed to export APPL allocation report as PDF')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle CSV Export
  const handleExportCSV = () => {
    if (!summary || filteredExpenses.length === 0) {
      showError('No data to export', 'Please ensure there are expenses to export')
      return
    }

    try {
      const csvContent = exportAPPLToCSV(
        filteredExpenses,
        summary,
        hospitalName,
        selectedYear,
        {
          voteActivity: filterVoteActivity !== 'all' ? filterVoteActivity : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        }
      )

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appl-allocation-report-${hospitalName.replace(/\s+/g, '-')}-FY${selectedYear}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showSuccess('Export successful', 'APPL allocation report exported as CSV')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      showError('Export failed', 'Failed to export APPL allocation report as CSV')
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'gray'; label: string }> = {
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'info', label: 'Approved' },
      completed: { color: 'success', label: 'Completed' },
      cancelled: { color: 'error', label: 'Cancelled' },
    }
    const cfg = map[status] || { color: 'gray' as const, label: status }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  // Get PO type badge
  const getPoTypeBadge = (poType: string) => {
    const map: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'gray'; label: string }> = {
      regular: { color: 'info', label: 'PO' },
      lpo: { color: 'success', label: 'LPO' },
      emergency: { color: 'error', label: 'Emergency' },
    }
    const cfg = map[poType] || { color: 'gray' as const, label: poType }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  // Table columns
  const columns = [
    {
      key: 'expense_date',
      label: 'Date',
      render: (_: any, e: APPLExpenseWithRelations) => (
        <span className="font-medium text-slate-900">{formatDate(e.expense_date)}</span>
      ),
    },
    {
      key: 'po_number',
      label: 'PO Number',
      render: (_: any, e: APPLExpenseWithRelations) => (
        <span className="font-mono text-sm text-slate-700">{e.po_number}</span>
      ),
    },
    {
      key: 'lpo_number',
      label: 'LPO Number',
      render: (_: any, e: APPLExpenseWithRelations) => (
        e.lpo_number ? (
          <span className="font-mono text-sm text-slate-700">{e.lpo_number}</span>
        ) : (
          <span className="text-slate-400">—</span>
        )
      ),
    },
    {
      key: 'po_type',
      label: 'Type',
      render: (_: any, e: APPLExpenseWithRelations) => getPoTypeBadge(e.po_type),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (_: any, e: APPLExpenseWithRelations) => (
        <span className="font-semibold text-slate-900">{formatCurrency(Number(e.amount))}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: any, e: APPLExpenseWithRelations) => getStatusBadge(e.status),
    },
  ]

  // Quarterly progress data
  const quarterlyData = summary?.quarterly || []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">APPL Allocation</h1>
          <p className="text-slate-600 mt-1">
            Track expenses from Purchase Orders (PO) and Local Purchase Orders (LPO) linked to warrants (vote code 990102)
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-200/60 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  FY {year}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleSync}
            disabled={isSyncing}
            variant="outline"
            className="border-slate-300 hover:bg-slate-50"
          >
            {isSyncing ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync from POs
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 p-4 text-sm text-rose-700 shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Failed to load APPL allocation data</p>
            <p className="mt-0.5 text-rose-600">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Financial Dashboard */}
      {!isLoading && !error && summary && (
        <div className="space-y-6">
          {/* Year Independence Notice */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Fiscal Year {selectedYear} - APPL Allocation Tracking
                </p>
                <p className="text-xs text-blue-700">
                  Expenses from Purchase Orders (PO) and Local Purchase Orders (LPO) linked to warrants with vote code 990102.
                  All expenses shown are for FY {selectedYear} only.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Primary Financial KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Allocation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-4 text-white shadow-md"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <TrendingUp className="w-3 h-3 text-emerald-200" />
                </div>
                <p className="text-emerald-100 text-[10px] font-medium mb-1">Total Allocation</p>
                <p className="text-lg font-bold leading-tight">{formatCurrency(summary.total_allocation)}</p>
                <p className="text-emerald-200 text-[9px] mt-1.5">From warrants (990102)</p>
              </div>
            </motion.div>

            {/* Total Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg p-4 text-white shadow-md"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <TrendingUp className="w-3 h-3 text-rose-200" />
                </div>
                <p className="text-rose-100 text-[10px] font-medium mb-1">Total Expenses</p>
                <p className="text-lg font-bold leading-tight">{formatCurrency(summary.total_expenses)}</p>
                <p className="text-rose-200 text-[9px] mt-1.5">
                  {summary.usage_percentage.toFixed(1)}% of allocation
                </p>
              </div>
            </motion.div>

            {/* Available Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-4 text-white shadow-md"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  {summary.total_balance >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-blue-200" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-200" />
                  )}
                </div>
                <p className="text-blue-100 text-[10px] font-medium mb-1">Available Balance</p>
                <p className="text-lg font-bold leading-tight">{formatCurrency(summary.total_balance)}</p>
                <p className="text-blue-200 text-[9px] mt-1.5">
                  {summary.total_count} expense{summary.total_count !== 1 ? 's' : ''}
                </p>
              </div>
            </motion.div>

            {/* Liabilities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg p-4 text-white shadow-md"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <TrendingUp className="w-3 h-3 text-amber-200" />
                </div>
                <p className="text-amber-100 text-[10px] font-medium mb-1">Liabilities</p>
                <p className="text-lg font-bold leading-tight">{formatCurrency(summary.total_liabilities)}</p>
                <p className="text-amber-200 text-[9px] mt-1.5">Pending & approved</p>
              </div>
            </motion.div>

            {/* Net Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg p-4 text-white shadow-md"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                    <FileText className="w-4 h-4" />
                  </div>
                  <TrendingUp className="w-3 h-3 text-purple-200" />
                </div>
                <p className="text-purple-100 text-[10px] font-medium mb-1">Net Expenses</p>
                <p className="text-lg font-bold leading-tight">{formatCurrency(summary.net_expenses)}</p>
                <p className="text-purple-200 text-[9px] mt-1.5">Completed only</p>
              </div>
            </motion.div>

            {/* Usage Percentage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg p-4 text-white shadow-md"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <TrendingUp className="w-3 h-3 text-cyan-200" />
                </div>
                <p className="text-cyan-100 text-[10px] font-medium mb-1">Usage Rate</p>
                <p className="text-lg font-bold leading-tight">{summary.usage_percentage.toFixed(2)}%</p>
                <p className="text-cyan-200 text-[9px] mt-1.5">Of total allocation</p>
              </div>
            </motion.div>
          </div>

          {/* Breakdown by Vote Activity */}
          {summary.by_vote_activity && summary.by_vote_activity.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold text-slate-900 mb-3">Breakdown by Vote Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.by_vote_activity.map((item) => (
                  <div
                    key={item.vote_activity}
                    className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Activity {item.vote_activity}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.allocation > 0 ? ((item.expenses / item.allocation) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Allocation:</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(item.allocation)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Expenses:</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(item.expenses)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Balance:</span>
                        <span className={`font-semibold ${item.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(item.balance)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Liabilities:</span>
                        <span className="font-semibold text-amber-600">{formatCurrency(item.liabilities)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Net Expenses:</span>
                        <span className="font-semibold text-purple-600">{formatCurrency(item.net_expenses)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Count:</span>
                        <span className="font-semibold text-slate-900">{item.count}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min((item.expenses / item.allocation) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quarterly Progress */}
          {quarterlyData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quarterly Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quarterlyData.map((quarter) => (
                  <div
                    key={quarter.quarter}
                    className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700">
                        Q{quarter.quarter}
                      </span>
                      <span className="text-xs text-slate-500">
                        {quarter.usage_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-500">Allocation</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(quarter.allocation)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Expenses</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(quarter.expenses)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Balance</p>
                        <p
                          className={`text-sm font-semibold ${quarter.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                        >
                          {formatCurrency(quarter.balance)}
                        </p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(quarter.usage_percentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Expenses Table Header with Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Header Section */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Expense Records</h2>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleExportPDF}
                    disabled={isExporting || !summary || filteredExpenses.length === 0}
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-300"
                  >
                    {isExporting ? (
                      <>
                        <Spinner size="sm" className="mr-1.5" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4 mr-1.5" />
                        PDF
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleExportCSV}
                    disabled={!summary || filteredExpenses.length === 0}
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-300"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    CSV
                  </Button>
                </div>
              </div>
            </div>

            {/* Compact Filter Bar */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search PO/LPO..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                </div>

                {/* Vote Activity Filter */}
                <select
                  value={filterVoteActivity}
                  onChange={(e) => setFilterVoteActivity(e.target.value)}
                  className="px-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
                >
                  <option value="all">All Activities</option>
                  <option value="27401">27401</option>
                  <option value="27499">27499</option>
                  <option value="27404">27404</option>
                  <option value="27403">27403</option>
                  <option value="27402">27402</option>
                  <option value="27501">27501</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              {filteredExpenses.length > 0 ? (
                <Table
                  data={filteredExpenses}
                  columns={columns}
                  className="border-none"
                  hoverable
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <FileText className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm font-medium">No expenses found</p>
                  <p className="text-xs mt-1">
                    Click 'Sync from POs' to import expenses from Purchase Orders.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default APPLAllocationPage

