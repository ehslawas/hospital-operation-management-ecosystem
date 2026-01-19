import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Download,
  FileDown,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Spinner, Button, Badge } from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { FinancialFilterBar, FilterOption } from '@/components/pharmacy/financial/FinancialFilterBar'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import {
  getCCAllocationSummary,
  getCCExpenses,
  syncCCExpensesFromPOs,
} from '@/services/pharmacy/ccAllocationService'
import {
  exportCCToPDF,
  exportCCToCSV,
} from '@/services/pharmacy/ccExportService'
import { WARRANT_DEPARTMENTS, WARRANT_VOTE_ACTIVITIES } from '@/services/pharmacy/warrantService'
import type { CCAllocationSummary, CCExpenseWithRelations } from '@/types/pharmacy'
import { FinancialStatsGrid } from '@/components/pharmacy/financial/FinancialStatsGrid'

export const CCAllocationPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  const hospitalId = user?.hospital_id

  const [summary, setSummary] = useState<CCAllocationSummary | null>(null)
  const [expenses, setExpenses] = useState<CCExpenseWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterVoteActivity, setFilterVoteActivity] = useState<string>('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Fetch data
  useEffect(() => {
    if (!hospitalId) return

    const fetchData = async () => {
      // Trigger background sync first to ensure data is fresh
      if (hospitalId) {
        syncCCExpensesFromPOs(hospitalId, selectedYear).catch(console.error)
      }

      setIsLoading(true)
      setError(null)
      setCurrentPage(1)

      try {
        const voteActivityParam = filterVoteActivity !== 'all' ? filterVoteActivity : undefined
        const departmentParam = filterDepartment !== 'all' ? filterDepartment : undefined
        const statusParam = filterStatus !== 'all' ? filterStatus : undefined

        const [summaryResult, expensesResult] = await Promise.all([
          getCCAllocationSummary(hospitalId, selectedYear, {
            voteActivity: voteActivityParam,
            category: undefined,
            department: departmentParam,
          }),
          getCCExpenses(hospitalId, selectedYear, {
            status: statusParam,
            voteActivity: voteActivityParam,
            category: undefined,
            department: departmentParam,
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
  }, [hospitalId, selectedYear, filterStatus, filterVoteActivity, filterDepartment])

  const handleSync = async () => {
    if (!hospitalId) return

    setIsSyncing(true)
    try {
      const result = await syncCCExpensesFromPOs(hospitalId, selectedYear)
      if (result.error) {
        showError('Sync failed', result.error)
      } else if (result.data) {
        showSuccess('Sync completed', `Synced ${result.data.synced} expenses from Purchase Orders`)
        window.location.reload()
      }
    } catch (err) {
      showError('Sync failed', err instanceof Error ? err.message : 'Failed to sync expenses')
    } finally {
      setIsSyncing(false)
    }
  }

  // Filtered and Paginated expenses
  const filteredExpenses = useMemo(() => {
    let result = expenses.filter(e => e.status !== 'cancelled')

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.po_number.toLowerCase().includes(query) ||
          (e.lpo_number && e.lpo_number.toLowerCase().includes(query)) ||
          (e.purchase_order?.supplier?.company_name?.toLowerCase().includes(query))
      )
    }

    // Additional client-side department filtering for robustness
    if (filterDepartment !== 'all') {
      result = result.filter((e) => {
        const dept = e.department || e.warrant?.department
        return dept?.toLowerCase() === filterDepartment.toLowerCase()
      })
    }

    // Sort by date (newest first)
    return result.sort((a, b) => {
      const dateA = new Date(a.expense_date).getTime()
      const dateB = new Date(b.expense_date).getTime()
      if (dateB !== dateA) return dateB - dateA
      return b.po_number.localeCompare(a.po_number)
    })
  }, [expenses, searchQuery, filterDepartment])

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredExpenses.slice(start, start + pageSize)
  }, [filteredExpenses, currentPage, pageSize])

  const hospitalName = user?.hospital?.hospital_name || 'Hospital'

  const handleExportPDF = async () => {
    if (!summary || filteredExpenses.length === 0) {
      showError('No data to export', 'Please ensure there are expenses to export')
      return
    }

    setIsExporting(true)
    try {
      const blob = await exportCCToPDF(
        filteredExpenses,
        summary,
        hospitalName,
        selectedYear,
        {
          voteActivity: filterVoteActivity !== 'all' ? filterVoteActivity : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          category: undefined,
          department: filterDepartment !== 'all' ? filterDepartment : undefined,
        },
        user?.email || 'System User'
      )

      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')

      // Clean up after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
      showSuccess('Success', 'PDF report generated')
    } catch (error) {
      showError('Export Failed', 'Unable to generate PDF report')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = () => {
    if (!summary || filteredExpenses.length === 0) {
      showError('No data to export', 'Please ensure there are expenses to export')
      return
    }

    try {
      const csvContent = exportCCToCSV(
        filteredExpenses,
        summary,
        hospitalName,
        selectedYear,
        {
          voteActivity: filterVoteActivity !== 'all' ? filterVoteActivity : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          category: undefined,
          department: filterDepartment !== 'all' ? filterDepartment : undefined,
        },
        user?.email || 'System User'
      )

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cc-allocation-report-FY${selectedYear}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showSuccess('Success', 'CSV report downloaded')
    } catch (error) {
      showError('Export Failed', 'Unable to generate CSV report')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'gray'; label: string }> = {
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'info', label: 'Approved' },
      completed: { color: 'success', label: 'Completed' },
      cancelled: { color: 'error', label: 'Cancelled' },
    }
    const cfg = map[status] || { color: 'gray', label: status }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  const getPoTypeBadge = (poType: string) => {
    const map: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'gray'; label: string }> = {
      regular: { color: 'info', label: 'PO' },
      lpo: { color: 'success', label: 'LPO' },
      emergency: { color: 'error', label: 'Emergency' },
    }
    const cfg = map[poType] || { color: 'gray', label: poType }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  const columns = [
    {
      key: 'expense_date',
      label: 'Date',
      render: (_: any, e: CCExpenseWithRelations) => (
        <span className="font-medium text-slate-900">{formatDate(e.expense_date)}</span>
      ),
    },
    {
      key: 'po_number',
      label: 'PO Number',
      render: (_: any, e: CCExpenseWithRelations) => (
        <span className="font-mono text-sm text-slate-700">{e.po_number}</span>
      ),
    },
    {
      key: 'lpo_number',
      label: 'LPO Number',
      render: (_: any, e: CCExpenseWithRelations) => (
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
      render: (_: any, e: CCExpenseWithRelations) => getPoTypeBadge(e.po_type),
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      render: (_: any, e: CCExpenseWithRelations) => (
        <span className="font-semibold text-slate-900">{formatCurrency(Number(e.amount))}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: any, e: CCExpenseWithRelations) => getStatusBadge(e.status),
    },
  ]

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        variant="outline"
        className="border-slate-300 hover:bg-slate-50 shadow-sm"
      >
        {isSyncing ? (
          <><Spinner size="sm" className="mr-2" />Syncing...</>
        ) : (
          <><RefreshCw className="w-4 h-4 mr-2" />Sync POs</>
        )}
      </Button>
      <Button onClick={handleExportPDF} disabled={isExporting} variant="outline" className="border-slate-300 hover:bg-slate-50">
        <FileDown className="w-4 h-4 mr-2" />
        PDF
      </Button>
      <Button onClick={handleExportCSV} variant="outline" className="border-slate-300 hover:bg-slate-50">
        <Download className="w-4 h-4 mr-2" />
        CSV
      </Button>
    </div>
  )

  const statusOptions: FilterOption[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Completed', value: 'completed' },
  ]

  return (
    <FinancialPageLayout
      title="CC Allocation"
      description="Track expenses from Purchase Orders (PO) and Local Purchase Orders (LPO) linked to warrants (vote code 080702)"
      icon={Wallet}
      breadcrumbs={[{ label: 'CC Allocation' }]}
      actions={headerActions}
      notice={{
        title: `Fiscal Year ${selectedYear} Status`,
        message: 'This dashboard shows allocation and expenses for the selected fiscal year. Ensure all POs are properly synced.',
        type: 'info'
      }}
    >
      <div className="space-y-6">
        <FinancialFilterBar
          onSearchChange={setSearchQuery}
          searchValue={searchQuery}
          searchPlaceholder="Search PO/LPO/Supplier..."
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          filters={[
            {
              key: 'voteActivity',
              label: 'Activity',
              value: filterVoteActivity,
              options: WARRANT_VOTE_ACTIVITIES,
              onChange: setFilterVoteActivity,
            },
            {
              key: 'department',
              label: 'Department',
              value: filterDepartment,
              options: WARRANT_DEPARTMENTS,
              onChange: setFilterDepartment,
            },
            {
              key: 'status',
              label: 'Status',
              value: filterStatus,
              options: statusOptions,
              onChange: setFilterStatus,
            }
          ]}
          onReset={() => {
            setFilterVoteActivity('all')
            setFilterDepartment('all')
            setFilterStatus('all')
            setSearchQuery('')
            setCurrentPage(1)
          }}
        />

        {!isLoading && error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Data Loading Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="ml-auto border-rose-300 text-rose-700 hover:bg-rose-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </motion.div>
        )}

        {/* Dashboard Cards */}
        {!isLoading && !error && summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total Allocation */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div className="text-emerald-100 bg-emerald-500/30 px-2 py-1 rounded-lg backdrop-blur-sm border border-emerald-400/30">
                      <span className="text-xs font-bold uppercase tracking-wider">Total</span>
                    </div>
                  </div>
                  <p className="text-emerald-100 text-sm font-medium mb-1 tracking-wide">Total Allocation</p>
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(summary.total_allocation)}</p>
                  <p className="text-emerald-100/80 text-xs mt-3 font-medium">
                    In {summary.total_count} record{summary.total_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-rose-100 text-sm font-medium mb-1 tracking-wide">Total Expenses</p>
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(summary.total_expenses)}</p>
                  <p className="text-rose-200 text-xs mt-3 bg-rose-500/30 inline-block px-2 py-1 rounded-lg backdrop-blur-sm border border-rose-400/30">
                    {summary.usage_percentage.toFixed(1)}% of allocation
                  </p>
                </div>
              </div>

              {/* Available Balance */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                      <Wallet className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm font-medium mb-1 tracking-wide">Available Balance</p>
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(summary.total_balance)}</p>
                  <p className="text-blue-200 text-xs mt-3 bg-blue-500/30 inline-block px-2 py-1 rounded-lg backdrop-blur-sm border border-blue-400/30">
                    {summary.total_allocation > 0
                      ? ((summary.total_balance / summary.total_allocation) * 100).toFixed(1)
                      : '0'}% remaining
                  </p>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <FinancialStatsGrid
              liabilities={summary.total_liabilities}
              netExpenses={summary.net_expenses}
              usageRate={summary.usage_percentage}
              currencyFormatter={formatCurrency}
            />
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <Table
            data={paginatedExpenses}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No expenses found matching your filters"
            onSort={(key) => console.log('Sort by', key)}
          />
          {filteredExpenses.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredExpenses.length / pageSize)}
              pageSize={pageSize}
              total={filteredExpenses.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
            />
          )}
        </div>
      </div>
    </FinancialPageLayout>
  )
}

export default CCAllocationPage
