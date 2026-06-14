import React, { useEffect, useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Plus,
  Wallet,
  FileDown,
  Download,
  Clock,
  User,
  Trash2,
  Edit,
  Check,
  DollarSign,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { Spinner, Button, Badge, Modal } from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { FinancialFilterBar } from '@/components/pharmacy/financial/FinancialFilterBar'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { FinancialStatsGrid } from '@/components/pharmacy/financial/FinancialStatsGrid'
import { WarrantBreakdown } from '@/components/pharmacy/financial/WarrantBreakdown'
import { CATEGORY_COLORS, DEPARTMENT_COLORS } from '@/components/pharmacy/financial/constants'
import {
  getWarrants,
  getWarrantSummary,
  getWarrantById,
  createWarrant,
  updateWarrant,
  deleteWarrant,
  WARRANT_VOTE_CODES,
  WARRANT_VOTE_ACTIVITIES,
  WARRANT_CATEGORIES,
  WARRANT_DEPARTMENTS,
} from '@/services/pharmacy/warrantService'
import {
  exportWarrantsToPDF,
  exportWarrantsToCSV,
} from '@/services/pharmacy/warrantExportService'
import type { Warrant, WarrantFormData, WarrantSummary, WarrantCategory, WarrantDepartment } from '@/types/pharmacy'

// Form validation schema
const warrantSchema = z.object({
  warrant_date: z.string().min(1, 'Date is required'),
  document_no: z.string().min(1, 'Document number is required'),
  vote_code: z.enum(['080702', '990102'], { required_error: 'Vote code is required' }),
  vote_activity: z.enum(['27401', '27499', '27404', '27403', '27402', '27501'], { required_error: 'Vote activity is required' }),
  category: z.enum(['drug', 'non_drug', 'non_standard', 'reagent', 'vaccine', 'insulin', 'hepc', 'medical_oxygen'], { required_error: 'Category is required' }),
  department: z.enum(['pharmacy', 'nephrology', 'radiology_radiography', 'emergency_trauma', 'cssu_cssd', 'operation_theater', 'laboratory_pathology', 'general_ward', 'wound_care', 'rehabilitation', 'anaesthesiology'], { required_error: 'Department is required' }),
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be positive'),
})

// Category colors for visual distinction
// Category and Department colors imported from constants

export const WarrantPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  const hospitalId = user?.hospital_id
  const isSessionReady = useIsSessionReady()

  // State
  const [warrants, setWarrants] = useState<Warrant[]>([])
  const [summary, setSummary] = useState<WarrantSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedWarrant, setSelectedWarrant] = useState<(Warrant & { created_by_user?: { full_name: string; email: string } }) | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [formattedAmount, setFormattedAmount] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<WarrantFormData>({
    resolver: zodResolver(warrantSchema),
    defaultValues: {
      warrant_date: new Date().toISOString().split('T')[0],
    },
  })

  // Format number with commas and 2 decimal places
  const formatAmount = (value: string | number): string => {
    const numericValue = String(value).replace(/[^\d.]/g, '')
    if (!numericValue || numericValue === '0' || numericValue === '.') return ''
    const parts = numericValue.split('.')
    const integerPart = parts[0] || '0'
    const decimalPart = parts[1] || ''
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const formattedDecimal = decimalPart.slice(0, 2)
    if (formattedDecimal) return `${formattedInteger}.${formattedDecimal}`
    return formattedInteger
  }

  const parseAmount = (formattedValue: string): number => {
    const numericValue = formattedValue.replace(/[^\d.]/g, '')
    const parsed = parseFloat(numericValue) || 0
    return parsed
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formatted = formatAmount(inputValue)
    setFormattedAmount(formatted)
    const numericValue = parseAmount(formatted)
    setValue('amount', numericValue, { shouldValidate: true, shouldDirty: true })
  }

  useEffect(() => {
    if (!isFormOpen) setFormattedAmount('')
  }, [isFormOpen])

  // Load data
  useEffect(() => {
    if (!isSessionReady || !hospitalId) return

    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      setCurrentPage(1) // Reset to page 1 on filter change

      // Convert 'all' to undefined for service call
      const categoryParam = filterCategory === 'all' ? undefined : filterCategory as WarrantCategory
      const departmentParam = filterDepartment === 'all' ? undefined : filterDepartment as WarrantDepartment

      const [warrantsRes, summaryRes] = await Promise.all([
        getWarrants(hospitalId, {
          startDate: `${selectedYear}-01-01`,
          endDate: `${selectedYear}-12-31`,
          category: categoryParam,
          department: departmentParam,
        }),
        getWarrantSummary(hospitalId, selectedYear, {
          category: categoryParam,
          department: departmentParam,
        }),
      ])

      if (warrantsRes.error) {
        setError(warrantsRes.error)
      } else {
        setWarrants(warrantsRes.data || [])
      }

      if (summaryRes.data) {
        setSummary(summaryRes.data)
      }

      setIsLoading(false)
    }

    void loadData()
  }, [isSessionReady, hospitalId, selectedYear, filterCategory, filterDepartment])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getCategoryLabel = (value: string) => {
    return WARRANT_CATEGORIES.find((c) => c.value === value)?.label || value
  }

  const getDepartmentLabel = (value: string) => {
    return WARRANT_DEPARTMENTS.find((d) => d.value === value)?.label || value
  }

  // Filtered and Paginated warrants
  const filteredWarrants = useMemo(() => {
    let result = warrants

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (w) =>
          w.document_no.toLowerCase().includes(query) ||
          getCategoryLabel(w.category).toLowerCase().includes(query) ||
          getDepartmentLabel(w.department).toLowerCase().includes(query)
      )
    }

    return result
  }, [warrants, searchQuery])

  const paginatedWarrants = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredWarrants.slice(start, start + pageSize)
  }, [filteredWarrants, currentPage, pageSize])

  const onSubmit = async (data: WarrantFormData) => {
    if (!hospitalId || !user?.id) return

    setIsSubmitting(true)

    let result
    if (isEditing && selectedWarrant) {
      result = await updateWarrant(selectedWarrant.id, data)
    } else {
      result = await createWarrant(hospitalId, user.id, data)
    }

    if (result.error) {
      showError(`Failed to ${isEditing ? 'update' : 'create'} warrant`, result.error)
    } else {
      showSuccess(`Warrant ${isEditing ? 'updated' : 'created'} successfully`)
      setIsFormOpen(false)
      setIsDetailsOpen(false)
      setIsEditing(false)
      setSelectedWarrant(null)
      setFormattedAmount('')
      reset()

      // Reload logic tailored to match initial load
      const categoryParam = filterCategory === 'all' ? undefined : filterCategory as WarrantCategory
      const departmentParam = filterDepartment === 'all' ? undefined : filterDepartment as WarrantDepartment

      const [warrantsRes, summaryRes] = await Promise.all([
        getWarrants(hospitalId, {
          startDate: `${selectedYear}-01-01`,
          endDate: `${selectedYear}-12-31`,
          category: categoryParam,
          department: departmentParam,
        }),
        getWarrantSummary(hospitalId, selectedYear, {
          category: categoryParam,
          department: departmentParam,
        }),
      ])
      if (warrantsRes.data) setWarrants(warrantsRes.data)
      if (summaryRes.data) setSummary(summaryRes.data)
    }

    setIsSubmitting(false)
  }

  const handleRowClick = async (warrant: Warrant) => {
    const result = await getWarrantById(warrant.id)
    if (result.data) {
      setSelectedWarrant(result.data)
      setIsDetailsOpen(true)
    } else {
      showError('Failed to load warrant details', result.error || 'Unknown error')
    }
  }

  const handleEdit = (warrant?: Warrant) => {
    const target = warrant || selectedWarrant
    if (!target) return

    if (warrant) {
      setSelectedWarrant(warrant as any)
    }

    setIsEditing(true)
    setIsDetailsOpen(false)
    setIsFormOpen(true)
    setValue('warrant_date', target.warrant_date)
    setValue('document_no', target.document_no)
    setValue('vote_code', target.vote_code)
    setValue('vote_activity', target.vote_activity)
    setValue('category', target.category)
    setValue('department', target.department)
    const amount = Number(target.amount)
    setValue('amount', amount)
    setFormattedAmount(formatAmount(amount))
  }

  const handleDelete = async (warrant: Warrant) => {
    if (!confirm('Are you sure you want to delete this warrant?')) return

    const result = await deleteWarrant(warrant.id)

    if (result.error) {
      showError('Failed to delete warrant', result.error)
    } else {
      showSuccess('Warrant deleted successfully')
      setIsDetailsOpen(false)
      if (selectedWarrant?.id === warrant.id) {
        setSelectedWarrant(null)
      }
      setWarrants((prev) => prev.filter((w) => w.id !== warrant.id))

      // Reload summary
      if (hospitalId) {
        const categoryParam = filterCategory === 'all' ? undefined : filterCategory as WarrantCategory
        const departmentParam = filterDepartment === 'all' ? undefined : filterDepartment as WarrantDepartment
        const summaryRes = await getWarrantSummary(hospitalId, selectedYear, {
          category: categoryParam,
          department: departmentParam,
        })
        if (summaryRes.data) setSummary(summaryRes.data)
      }
    }
  }

  const handleExportPDF = async () => {
    if (!summary || filteredWarrants.length === 0) {
      showError('No data to export', 'Please ensure there are warrants to export')
      return
    }

    setIsExporting(true)
    try {
      const blob = await exportWarrantsToPDF(
        filteredWarrants,
        summary,
        user?.hospital?.hospital_name || 'Hospital',
        selectedYear,
        {
          category: filterCategory === 'all' ? undefined : filterCategory as WarrantCategory,
          department: filterDepartment === 'all' ? undefined : filterDepartment as WarrantDepartment,
        }
      )

      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')

      // Clean up after a delay since window.open might need the blob url for a moment
      setTimeout(() => window.URL.revokeObjectURL(url), 100)

      showSuccess('Export successful', 'Warrant report generated')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      showError('Export failed', 'Failed to generate warrant report')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = () => {
    if (!summary || filteredWarrants.length === 0) {
      showError('No data to export', 'Please ensure there are warrants to export')
      return
    }

    try {
      const csvContent = exportWarrantsToCSV(
        filteredWarrants,
        summary,
        user?.hospital?.hospital_name || 'Hospital',
        selectedYear,
        {
          category: filterCategory === 'all' ? undefined : filterCategory as WarrantCategory,
          department: filterDepartment === 'all' ? undefined : filterDepartment as WarrantDepartment,
        }
      )

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `warrant-report-FY${selectedYear}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showSuccess('Export successful', 'Warrant report exported as CSV')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      showError('Export failed', 'Failed to export warrant report as CSV')
    }
  }

  // Table Columns
  const columns = [
    {
      key: 'warrant_date',
      label: 'Date',
      render: (_: any, w: Warrant) => (
        <span className="font-medium text-slate-900">{formatDate(w.warrant_date)}</span>
      ),
    },
    {
      key: 'document_no',
      label: 'Document No',
      render: (_: any, w: Warrant) => (
        <span className="font-mono text-sm text-slate-700">{w.document_no}</span>
      ),
    },
    {
      key: 'vote_code',
      label: 'Vote Code',
      render: (_: any, w: Warrant) => (
        <Badge variant="gray" className="font-mono">
          {w.vote_code}
        </Badge>
      ),
    },
    {
      key: 'vote_activity',
      label: 'Vote Activity',
      render: (_: any, w: Warrant) => (
        <Badge variant="gray" className="font-mono">
          {w.vote_activity}
        </Badge>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (_: any, w: Warrant) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[w.category]}`}>
          {getCategoryLabel(w.category)}
        </span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (_: any, w: Warrant) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DEPARTMENT_COLORS[w.department]}`}>
          {getDepartmentLabel(w.department)}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      render: (_: number, w: Warrant) => (
        <span className="font-semibold text-emerald-600">{formatCurrency(Number(w.amount))}</span>
      ),
    },
  ]

  // Header Actions
  const headerActions = (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleExportPDF}
          disabled={isExporting || !summary || filteredWarrants.length === 0}
          variant="outline"
          className="border-slate-300 hover:bg-slate-50"
        >
          {isExporting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </>
          )}
        </Button>
        <Button
          onClick={handleExportCSV}
          disabled={!summary || filteredWarrants.length === 0}
          variant="outline"
          className="border-slate-300 hover:bg-slate-50"
        >
          <Download className="w-4 h-4 mr-2" />
          CSV
        </Button>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Warrant
        </Button>
      </div>
    </>
  )

  return (
    <FinancialPageLayout
      title="Warrant Management"
      description="Government allocated funds for hospital pharmacy operations"
      icon={Wallet}
      breadcrumbs={[{ label: 'Warrant' }]}
      actions={headerActions}
      notice={{
        title: `Fiscal Year ${selectedYear} - Independent Financial Period`,
        message: `Each fiscal year operates independently. Balances from previous years do not carry forward. All financial metrics shown are for FY ${selectedYear} only.`,
        type: 'info'
      }}
    >
      <div className="space-y-6">
        {/* Filter Bar */}
        <FinancialFilterBar
          onSearchChange={setSearchQuery}
          searchValue={searchQuery}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          filters={[
            {
              key: 'category',
              label: 'Category',
              value: filterCategory,
              options: WARRANT_CATEGORIES,
              onChange: setFilterCategory,
            },
            {
              key: 'department',
              label: 'Department',
              value: filterDepartment,
              options: WARRANT_DEPARTMENTS,
              onChange: setFilterDepartment,
            }
          ]}
          onReset={() => {
            setFilterCategory('all')
            setFilterDepartment('all')
            setSearchQuery('')
            setCurrentPage(1)
          }}
        />

        {/* Financial Dashboard - Core Metrics */}
        {!isLoading && !error && summary && (
          <>
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
                    {summary.total_count} record{summary.total_count !== 1 ? 's' : ''}
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

            <div className="mt-6">
              <FinancialStatsGrid
                liabilities={summary.total_liabilities}
                netExpenses={summary.net_expenses}
                usageRate={summary.usage_percentage}
                currencyFormatter={formatCurrency}
              />
            </div>

            <div className="mt-6">
              <WarrantBreakdown
                summary={summary}
                currencyFormatter={formatCurrency}
              />
            </div>
          </>
        )}

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400">Loading warrants...</div>
          ) : filteredWarrants.length === 0 ? (
            <div className="text-center py-10 text-slate-400 border border-dashed border-slate-300 rounded-xl bg-slate-50">
              No warrants found matching your filters
            </div>
          ) : (
            paginatedWarrants.map((warrant) => (
              <div
                key={warrant.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 active:scale-[0.99] transition-transform"
                onClick={() => handleRowClick(warrant)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Document No</p>
                    <p className="font-mono text-sm font-bold text-slate-800">{warrant.document_no}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Date</p>
                    <p className="text-sm font-medium text-slate-700">{formatDate(warrant.warrant_date)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-50 mt-2">
                  <Badge variant="gray" className="text-[10px] font-mono bg-slate-100 text-slate-600 border-slate-200">
                    {warrant.vote_code}
                  </Badge>
                  <Badge variant="gray" className="text-[10px] font-mono bg-slate-100 text-slate-600 border-slate-200">
                    {warrant.vote_activity}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2">
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${CATEGORY_COLORS[warrant.category]}`}>
                      {getCategoryLabel(warrant.category)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${DEPARTMENT_COLORS[warrant.department]}`}>
                      {getDepartmentLabel(warrant.department)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Amount</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(Number(warrant.amount))}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(warrant)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(warrant)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Warrants Table - Desktop */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <Table
            data={paginatedWarrants}
            columns={columns}
            isLoading={isLoading}
            onRowClick={handleRowClick}
            emptyMessage="No warrants found matching your filters"
            onSort={(key) => console.log('Sort by', key)}
          />
        </div>

        {/* Pagination - Shared */}
        {filteredWarrants.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:border-none md:shadow-none md:bg-transparent md:p-0">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredWarrants.length / pageSize)}
              pageSize={pageSize}
              total={filteredWarrants.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
            />
          </div>
        ) as React.ReactNode}
      </div>

      {/* Warrant Details Modal */}
      <AnimatePresence>
        {isDetailsOpen && selectedWarrant && (
          <Modal
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false)
              setSelectedWarrant(null)
            }}
            title="Warrant Details"
            size="lg"
          >
            <div className="space-y-6">
              {/* Warrant Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <p className="text-sm font-medium text-slate-900">{formatDate(selectedWarrant.warrant_date)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Document Number</label>
                  <p className="text-sm font-mono text-slate-900">{selectedWarrant.document_no}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Vote Code</label>
                  <Badge variant="gray" className="font-mono">{selectedWarrant.vote_code}</Badge>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Vote Activity</label>
                  <Badge variant="gray" className="font-mono">{selectedWarrant.vote_activity}</Badge>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[selectedWarrant.category]}`}>
                    {getCategoryLabel(selectedWarrant.category)}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DEPARTMENT_COLORS[selectedWarrant.department]}`}>
                    {getDepartmentLabel(selectedWarrant.department)}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(Number(selectedWarrant.amount))}</p>
                </div>
              </div>

              {/* Audit Information */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Record Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedWarrant.created_at && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Created At</label>
                      <p className="text-sm text-slate-700">
                        {new Date(selectedWarrant.created_at).toLocaleString('en-MY', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                  {selectedWarrant.created_by_user && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Created By
                      </label>
                      <p className="text-sm text-slate-700">{selectedWarrant.created_by_user.full_name}</p>
                      <p className="text-xs text-slate-500">{selectedWarrant.created_by_user.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => selectedWarrant && handleDelete(selectedWarrant)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={() => handleEdit()}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Add/Edit Warrant Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <Modal
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false)
              setIsEditing(false)
              setSelectedWarrant(null)
              setFormattedAmount('')
              reset()
            }}
            title={isEditing ? 'Edit Warrant' : 'Add New Warrant'}
            size="lg"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('warrant_date')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                  {errors.warrant_date && (
                    <p className="mt-1 text-sm text-rose-500">{errors.warrant_date.message}</p>
                  )}
                </div>

                {/* Document Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Document Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('document_no')}
                    placeholder="e.g., WAR-2026-001"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                  {errors.document_no && (
                    <p className="mt-1 text-sm text-rose-500">{errors.document_no.message}</p>
                  )}
                </div>

                {/* Vote Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Vote Code <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('vote_code')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
                  >
                    <option value="">Select Vote Code</option>
                    {WARRANT_VOTE_CODES.map((code) => (
                      <option key={code.value} value={code.value}>
                        {code.label}
                      </option>
                    ))}
                  </select>
                  {errors.vote_code && (
                    <p className="mt-1 text-sm text-rose-500">{errors.vote_code.message}</p>
                  )}
                </div>

                {/* Vote Activity */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Vote Activity <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('vote_activity')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
                  >
                    <option value="">Select Vote Activity</option>
                    {WARRANT_VOTE_ACTIVITIES.map((activity) => (
                      <option key={activity.value} value={activity.value}>
                        {activity.label}
                      </option>
                    ))}
                  </select>
                  {errors.vote_activity && (
                    <p className="mt-1 text-sm text-rose-500">{errors.vote_activity.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {WARRANT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-rose-500">{errors.category.message}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('department')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {WARRANT_DEPARTMENTS.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="mt-1 text-sm text-rose-500">{errors.department.message}</p>
                  )}
                </div>

                {/* Amount */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Amount (RM) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      RM
                    </span>
                    <input
                      type="text"
                      value={formattedAmount}
                      onChange={handleAmountChange}
                      onBlur={(e) => {
                        const parsed = parseAmount(e.target.value)
                        if (parsed > 0) {
                          const formatted = parsed.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          setFormattedAmount(formatted)
                          setValue('amount', parsed, { shouldValidate: true, shouldDirty: true })
                        } else {
                          setFormattedAmount('')
                          setValue('amount', 0, { shouldValidate: true, shouldDirty: true })
                        }
                      }}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                    />
                    <input
                      type="hidden"
                      {...register('amount', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-rose-500">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false)
                    setIsEditing(false)
                    setSelectedWarrant(null)
                    setFormattedAmount('')
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      {isEditing ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update Warrant' : 'Save Warrant'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </FinancialPageLayout >
  )
}

export default WarrantPage
