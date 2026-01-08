import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  Package,
  AlertTriangle,
  X,
  Search,
  Filter,
  ChevronDown,
  BarChart3,
  PieChart,
  Wallet,
  FileSpreadsheet,
  Check,
  Edit,
  Trash2,
  User,
  Clock,
  Download,
  FileDown,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/authStore'
import { Spinner, Button, Input, Select, Badge, Modal, DataTable } from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
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
const CATEGORY_COLORS: Record<WarrantCategory, string> = {
  drug: 'bg-blue-100 text-blue-700 border-blue-200',
  non_drug: 'bg-purple-100 text-purple-700 border-purple-200',
  non_standard: 'bg-amber-100 text-amber-700 border-amber-200',
  reagent: 'bg-teal-100 text-teal-700 border-teal-200',
  vaccine: 'bg-green-100 text-green-700 border-green-200',
  insulin: 'bg-rose-100 text-rose-700 border-rose-200',
  hepc: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  medical_oxygen: 'bg-cyan-100 text-cyan-700 border-cyan-200',
}

// Department colors
const DEPARTMENT_COLORS: Record<WarrantDepartment, string> = {
  pharmacy: 'bg-emerald-100 text-emerald-700',
  nephrology: 'bg-blue-100 text-blue-700',
  radiology_radiography: 'bg-violet-100 text-violet-700',
  emergency_trauma: 'bg-red-100 text-red-700',
  cssu_cssd: 'bg-orange-100 text-orange-700',
  operation_theater: 'bg-pink-100 text-pink-700',
  laboratory_pathology: 'bg-teal-100 text-teal-700',
  general_ward: 'bg-sky-100 text-sky-700',
  wound_care: 'bg-amber-100 text-amber-700',
  rehabilitation: 'bg-lime-100 text-lime-700',
  anaesthesiology: 'bg-fuchsia-100 text-fuchsia-700',
}

export const WarrantPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  const hospitalId = user?.hospital_id

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
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterDepartment, setFilterDepartment] = useState<string>('')
  const [formattedAmount, setFormattedAmount] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WarrantFormData>({
    resolver: zodResolver(warrantSchema),
    defaultValues: {
      warrant_date: new Date().toISOString().split('T')[0],
    },
  })

  // Format number with commas and 2 decimal places
  const formatAmount = (value: string | number): string => {
    // Remove all non-digit characters except decimal point
    const numericValue = String(value).replace(/[^\d.]/g, '')
    
    if (!numericValue || numericValue === '0' || numericValue === '.') {
      return ''
    }
    
    // Split by decimal point
    const parts = numericValue.split('.')
    const integerPart = parts[0] || '0'
    const decimalPart = parts[1] || ''
    
    // Add commas to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    
    // Limit decimal part to 2 digits
    const formattedDecimal = decimalPart.slice(0, 2)
    
    // Combine - always show decimal if there's input
    if (formattedDecimal) {
      return `${formattedInteger}.${formattedDecimal}`
    }
    // If user is typing and hasn't added decimal yet, just show integer with commas
    return formattedInteger
  }

  // Parse formatted string back to number
  const parseAmount = (formattedValue: string): number => {
    const numericValue = formattedValue.replace(/[^\d.]/g, '')
    const parsed = parseFloat(numericValue) || 0
    return parsed
  }

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formatted = formatAmount(inputValue)
    setFormattedAmount(formatted)
    
    // Update form value with parsed number
    const numericValue = parseAmount(formatted)
    setValue('amount', numericValue, { shouldValidate: true, shouldDirty: true })
  }

  // Sync formatted amount when form is reset or edited
  useEffect(() => {
    if (!isFormOpen) {
      setFormattedAmount('')
    }
  }, [isFormOpen])

  // Load data
  useEffect(() => {
    if (!hospitalId) return

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      const [warrantsRes, summaryRes] = await Promise.all([
        getWarrants(hospitalId, {
          startDate: `${selectedYear}-01-01`,
          endDate: `${selectedYear}-12-31`,
          category: filterCategory as WarrantCategory | undefined,
          department: filterDepartment as WarrantDepartment | undefined,
        }),
        getWarrantSummary(hospitalId, selectedYear, {
          category: filterCategory as WarrantCategory | undefined,
          department: filterDepartment as WarrantDepartment | undefined,
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
  }, [hospitalId, selectedYear, filterCategory, filterDepartment])

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

  // Get category label
  const getCategoryLabel = (value: string) => {
    return WARRANT_CATEGORIES.find((c) => c.value === value)?.label || value
  }

  // Get department label
  const getDepartmentLabel = (value: string) => {
    return WARRANT_DEPARTMENTS.find((d) => d.value === value)?.label || value
  }

  // Filtered warrants
  const filteredWarrants = useMemo(() => {
    return warrants.filter((w) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          w.document_no.toLowerCase().includes(query) ||
          getCategoryLabel(w.category).toLowerCase().includes(query) ||
          getDepartmentLabel(w.department).toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [warrants, searchQuery])

  // Handle form submit
  const onSubmit = async (data: WarrantFormData) => {
    if (!hospitalId || !user?.id) return

    setIsSubmitting(true)

    let result
    if (isEditing && selectedWarrant) {
      // Update existing warrant
      result = await updateWarrant(selectedWarrant.id, data)
    } else {
      // Create new warrant
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
      // Reload data
      const [warrantsRes, summaryRes] = await Promise.all([
        getWarrants(hospitalId, {
          startDate: `${selectedYear}-01-01`,
          endDate: `${selectedYear}-12-31`,
        }),
        getWarrantSummary(hospitalId, selectedYear, {
          category: filterCategory as WarrantCategory | undefined,
          department: filterDepartment as WarrantDepartment | undefined,
        }),
      ])
      if (warrantsRes.data) setWarrants(warrantsRes.data)
      if (summaryRes.data) setSummary(summaryRes.data)
    }

    setIsSubmitting(false)
  }

  // Handle row click - open details
  const handleRowClick = async (warrant: Warrant) => {
    const result = await getWarrantById(warrant.id)
    if (result.data) {
      setSelectedWarrant(result.data)
      setIsDetailsOpen(true)
    } else {
      showError('Failed to load warrant details', result.error || 'Unknown error')
    }
  }

  // Handle edit
  const handleEdit = () => {
    if (!selectedWarrant) return
    setIsEditing(true)
    setIsDetailsOpen(false)
    setIsFormOpen(true)
    // Populate form with selected warrant data
    setValue('warrant_date', selectedWarrant.warrant_date)
    setValue('document_no', selectedWarrant.document_no)
    setValue('vote_code', selectedWarrant.vote_code)
    setValue('vote_activity', selectedWarrant.vote_activity)
    setValue('category', selectedWarrant.category)
    setValue('department', selectedWarrant.department)
    const amount = Number(selectedWarrant.amount)
    setValue('amount', amount)
    setFormattedAmount(formatAmount(amount))
  }

  // Handle delete from details modal
  const handleDeleteFromDetails = async () => {
    if (!selectedWarrant) return
    if (!confirm('Are you sure you want to delete this warrant?')) return

    const result = await deleteWarrant(selectedWarrant.id)

    if (result.error) {
      showError('Failed to delete warrant', result.error)
    } else {
      showSuccess('Warrant deleted successfully')
      setIsDetailsOpen(false)
      setSelectedWarrant(null)
      setWarrants((prev) => prev.filter((w) => w.id !== selectedWarrant.id))
      // Reload summary
      if (hospitalId) {
        const summaryRes = await getWarrantSummary(hospitalId, selectedYear)
        if (summaryRes.data) setSummary(summaryRes.data)
      }
    }
  }


  // Years for dropdown
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  // Get hospital name
  const hospitalName = user?.hospital?.hospital_name || 'Hospital'

  // Handle PDF Export
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
        hospitalName,
        selectedYear,
        {
          category: filterCategory || undefined,
          department: filterDepartment || undefined,
        }
      )

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `warrant-report-${hospitalName.replace(/\s+/g, '-')}-FY${selectedYear}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showSuccess('Export successful', 'Warrant report exported as PDF')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      showError('Export failed', 'Failed to export warrant report as PDF')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle CSV Export
  const handleExportCSV = () => {
    if (!summary || filteredWarrants.length === 0) {
      showError('No data to export', 'Please ensure there are warrants to export')
      return
    }

    try {
      const csvContent = exportWarrantsToCSV(
        filteredWarrants,
        summary,
        hospitalName,
        selectedYear,
        {
          category: filterCategory || undefined,
          department: filterDepartment || undefined,
        }
      )

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `warrant-report-${hospitalName.replace(/\s+/g, '-')}-FY${selectedYear}-${new Date().toISOString().split('T')[0]}.csv`
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

  // Table columns
  const columns = [
    {
      key: 'warrant_date',
      header: 'Date',
      render: (w: Warrant) => (
        <span className="font-medium text-slate-900">{formatDate(w.warrant_date)}</span>
      ),
    },
    {
      key: 'document_no',
      header: 'Document No',
      render: (w: Warrant) => (
        <span className="font-mono text-sm text-slate-700">{w.document_no}</span>
      ),
    },
    {
      key: 'vote_code',
      header: 'Vote Code',
      render: (w: Warrant) => (
        <Badge variant="outline" className="font-mono">
          {w.vote_code}
        </Badge>
      ),
    },
    {
      key: 'vote_activity',
      header: 'Vote Activity',
      render: (w: Warrant) => (
        <Badge variant="outline" className="font-mono">
          {w.vote_activity}
        </Badge>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (w: Warrant) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[w.category]}`}>
          {getCategoryLabel(w.category)}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (w: Warrant) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DEPARTMENT_COLORS[w.department]}`}>
          {getDepartmentLabel(w.department)}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (w: Warrant) => (
        <span className="font-semibold text-emerald-600">{formatCurrency(Number(w.amount))}</span>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              Warrant Management
            </h1>
            <p className="text-slate-600 mt-2">
              Government allocated funds for hospital pharmacy operations
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
              <p className="font-semibold">Failed to load warrant data</p>
              <p className="mt-0.5 text-rose-600">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Financial Dashboard - Core Metrics */}
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
                    Fiscal Year {selectedYear} - Independent Financial Period
                  </p>
                  <p className="text-xs text-blue-700">
                    Each fiscal year operates independently. Balances from previous years do not carry forward. 
                    All financial metrics shown are for FY {selectedYear} only. Previous year balances reset to zero at the start of each new fiscal year.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Primary Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total Allocation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-emerald-200" />
                  </div>
                  <p className="text-emerald-100 text-xs font-medium mb-1">Total Allocation</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.total_allocation)}</p>
                  <p className="text-emerald-200 text-xs mt-2">
                    {summary.total_count} warrant{summary.total_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </motion.div>

              {/* Total Expenses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-6 text-white shadow-lg"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-rose-200" />
                  </div>
                  <p className="text-rose-100 text-xs font-medium mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.total_expenses)}</p>
                  <p className="text-rose-200 text-xs mt-2">
                    {summary.usage_percentage.toFixed(1)}% of allocation
                  </p>
                </div>
              </motion.div>

              {/* Available Balance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-blue-200" />
                  </div>
                  <p className="text-blue-100 text-xs font-medium mb-1">Available Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.total_balance)}</p>
                  <p className="text-blue-200 text-xs mt-2">
                    {summary.total_allocation > 0 
                      ? ((summary.total_balance / summary.total_allocation) * 100).toFixed(1)
                      : '0'}% remaining
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Secondary Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Liabilities */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-medium mb-1">Liabilities</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(summary.total_liabilities)}</p>
                <p className="text-slate-400 text-xs mt-1">Committed but unpaid</p>
              </motion.div>

              {/* Net Expenses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-medium mb-1">Net Expenses</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(summary.net_expenses)}</p>
                <p className="text-slate-400 text-xs mt-1">Expenses - Liabilities</p>
              </motion.div>

              {/* Usage Percentage */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <PieChart className="w-4 h-4 text-teal-600" />
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-medium mb-1">Usage Rate</p>
                <p className="text-xl font-bold text-slate-900">{summary.usage_percentage.toFixed(2)}%</p>
                <p className="text-slate-400 text-xs mt-1">Expenses / Allocation</p>
              </motion.div>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* By Vote Code */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">By Vote Code</p>
                </div>
                <div className="space-y-3">
                  {summary.by_vote_code.length > 0 ? (
                    summary.by_vote_code.map((item) => (
                      <div key={item.vote_code} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <span className="text-sm font-mono font-semibold text-slate-900">{item.vote_code}</span>
                          <p className="text-xs text-slate-500 mt-0.5">{item.count} warrant{item.count !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(item.allocation)}</p>
                          <p className="text-xs text-slate-400">Allocated</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic text-center py-4">No data</p>
                  )}
                </div>
              </motion.div>

              {/* Top Categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Top Categories</p>
                </div>
                <div className="space-y-3">
                  {summary.by_category.slice(0, 5).length > 0 ? (
                    summary.by_category.slice(0, 5).map((item) => (
                      <div key={item.category} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[item.category]}`}>
                            {getCategoryLabel(item.category)}
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">{item.count} warrant{item.count !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(item.allocation)}</p>
                          <p className="text-xs text-slate-400">Allocated</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic text-center py-4">No data</p>
                  )}
                </div>
              </motion.div>

              {/* Top Departments */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Building2 className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Top Departments</p>
                </div>
                <div className="space-y-3">
                  {summary.by_department.slice(0, 5).length > 0 ? (
                    summary.by_department.slice(0, 5).map((item) => (
                      <div key={item.department} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${DEPARTMENT_COLORS[item.department]}`}>
                            {getDepartmentLabel(item.department)}
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">{item.count} warrant{item.count !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(item.allocation)}</p>
                          <p className="text-xs text-slate-400">Allocated</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic text-center py-4">No data</p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Warrants Table */}
        {!isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden"
          >
            {/* Table Header */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Warrant Records
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {filteredWarrants.length} warrant{filteredWarrants.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search warrants..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-64 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {WARRANT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>

                  {/* Department Filter */}
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="px-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
                  >
                    <option value="">All Departments</option>
                    {WARRANT_DEPARTMENTS.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {filteredWarrants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWarrants.map((warrant, idx) => (
                      <motion.tr
                        key={warrant.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => handleRowClick(warrant)}
                        className="hover:bg-emerald-50/50 cursor-pointer transition-colors"
                      >
                        {columns.map((col) => (
                          <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                            {col.render(warrant)}
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <FileText className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-500">No warrants found</p>
                <p className="text-sm mt-1">Add your first warrant to get started</p>
                <Button
                  onClick={() => setIsFormOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Warrant
                </Button>
              </div>
            )}
          </motion.div>
        )}

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
                    <Badge variant="outline" className="font-mono">{selectedWarrant.vote_code}</Badge>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Vote Activity</label>
                    <Badge variant="outline" className="font-mono">{selectedWarrant.vote_activity}</Badge>
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
                    onClick={handleDeleteFromDetails}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    onClick={handleEdit}
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
                          // Ensure 2 decimal places on blur
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
                      {/* Hidden input for form validation */}
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
      </div>
    </div>
  )
}

export default WarrantPage

