// @ts-nocheck
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
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  PieChart,
  Wallet,
  FileSpreadsheet,
  Check,
  Edit,
  Trash2,
  User,
  Clock,
  RefreshCw,
  BarChart2,
  Sparkles,
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
import type { Warrant, WarrantFormData, WarrantSummary, WarrantCategory, WarrantDepartment } from '@/types/pharmacy'
import { cn, formatCurrency } from '@/lib/utils'

// Form validation schema
const warrantSchema = z.object({
  warrant_date: z.string().min(1, 'Date is required'),
  document_no: z.string().min(1, 'Document number is required'),
  vote_code: z.string().min(1, 'Vote code is required'),
  vote_activity: z.string().min(1, 'Vote activity is required'),
  category: z.string().min(1, 'Category is required'),
  department: z.string().min(1, 'Department is required'),
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be positive'),
})

// Category colors for visual distinction
const CATEGORY_COLORS: Record<string, string> = {
  drug: 'bg-blue-50 text-blue-750 border-blue-150',
  non_drug: 'bg-purple-50 text-purple-750 border-purple-150',
  non_standard: 'bg-amber-50 text-amber-750 border-amber-150',
  reagent: 'bg-teal-50 text-teal-750 border-teal-150',
  vaccine: 'bg-green-50 text-green-750 border-green-150',
  insulin: 'bg-rose-50 text-rose-755 border-rose-150',
  hepc: 'bg-indigo-50 text-indigo-750 border-indigo-150',
  medical_oxygen: 'bg-cyan-50 text-cyan-750 border-cyan-150',
  sglt2: 'bg-emerald-50 text-emerald-750 border-emerald-150',
  pathologist: 'bg-orange-50 text-orange-750 border-orange-150',
  medical_cylinder: 'bg-slate-50 text-slate-750 border-slate-150',
  x_ray: 'bg-zinc-50 text-zinc-755 border-zinc-150',
  duit_khas: 'bg-amber-100/80 text-amber-900 border-amber-300 font-black',
}

// Department colors
const DEPARTMENT_COLORS: Record<WarrantDepartment, string> = {
  pharmacy: 'bg-emerald-50 text-emerald-750 border-emerald-150',
  nephrology: 'bg-blue-50 text-blue-750 border-blue-150',
  radiology_radiography: 'bg-violet-50 text-violet-750 border-violet-150',
  emergency_trauma: 'bg-red-50 text-red-750 border-red-150',
  cssu_cssd: 'bg-orange-50 text-orange-750 border-orange-150',
  operation_theater: 'bg-pink-50 text-pink-750 border-pink-150',
  laboratory_pathology: 'bg-teal-50 text-teal-750 border-teal-150',
  general_ward: 'bg-sky-50 text-sky-750 border-sky-150',
  wound_care: 'bg-amber-50 text-amber-750 border-amber-150',
  rehabilitation: 'bg-lime-50 text-lime-750 border-lime-150',
  anaesthesiology: 'bg-fuchsia-50 text-fuchsia-750 border-fuchsia-150',
  paediatric_ward: 'bg-indigo-50 text-indigo-750 border-indigo-150',
  maternity_ward: 'bg-rose-50 text-rose-750 border-rose-150',
  klinik_pakar: 'bg-emerald-50 text-emerald-750 border-emerald-150',
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
  const [filterVoteCode, setFilterVoteCode] = useState<string>('')
  const [formattedAmount, setFormattedAmount] = useState<string>('')
  const [selectedVoteCodeOption, setSelectedVoteCodeOption] = useState<string>('')
  const [customVoteCode, setCustomVoteCode] = useState<string>('')
  const [voteCodeCustomError, setVoteCodeCustomError] = useState<string>('')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

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
    return parseFloat(numericValue) || 0
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formatted = formatAmount(inputValue)
    setFormattedAmount(formatted)
    const numericValue = parseAmount(formatted)
    setValue('amount', numericValue, { shouldValidate: true, shouldDirty: true })
  }

  const handleVoteCodeSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedVoteCodeOption(val)
    setVoteCodeCustomError('')
    if (val === 'others') {
      setValue('vote_code', customVoteCode.trim(), { shouldValidate: true })
    } else {
      setValue('vote_code', val, { shouldValidate: true })
    }
  }

  const handleCustomVoteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCustomVoteCode(val)
    setVoteCodeCustomError('')
    setValue('vote_code', val.trim(), { shouldValidate: true })
  }

  const resetModalForm = () => {
    setIsFormOpen(false)
    setIsEditing(false)
    setSelectedWarrant(null)
    setSelectedVoteCodeOption('')
    setCustomVoteCode('')
    setVoteCodeCustomError('')
    setFormattedAmount('')
    reset()
  }

  useEffect(() => {
    if (!isFormOpen) {
      setFormattedAmount('')
      setSelectedVoteCodeOption('')
      setCustomVoteCode('')
      setVoteCodeCustomError('')
    }
  }, [isFormOpen])

  // Compute available vote codes for filter
  const availableFilterVoteCodes = useMemo(() => {
    const defaultCodes = ['080702', '990102']
    const fromWarrants = Array.from(new Set(warrants.map(w => w.vote_code).filter(Boolean)))
    return Array.from(new Set([...defaultCodes, ...fromWarrants]))
  }, [warrants])

  // Load data
  const loadData = async () => {
    if (!hospitalId) return
    setIsLoading(true)
    setError(null)

    const [warrantsRes, summaryRes] = await Promise.all([
      getWarrants(hospitalId, {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
        category: filterCategory as WarrantCategory | undefined,
        department: filterDepartment as WarrantDepartment | undefined,
        voteCode: (filterVoteCode as any) || undefined,
      }),
      getWarrantSummary(hospitalId, selectedYear, {
        category: filterCategory as WarrantCategory | undefined,
        department: filterDepartment as WarrantDepartment | undefined,
        voteCode: (filterVoteCode as any) || undefined,
      }),
    ])

    if (warrantsRes.error) setError(warrantsRes.error)
    else setWarrants(warrantsRes.data || [])

    if (summaryRes.data) setSummary(summaryRes.data)
    setIsLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [hospitalId, selectedYear, filterCategory, filterDepartment, filterVoteCode])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getCategoryLabel = (value: string) => WARRANT_CATEGORIES.find((c) => c.value === value)?.label || value
  const getDepartmentLabel = (value: string) => WARRANT_DEPARTMENTS.find((d) => d.value === value)?.label || value

  const filteredWarrants = useMemo(() => {
    return warrants.filter((w) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          w.document_no.toLowerCase().includes(query) ||
          (w.vote_code && w.vote_code.toLowerCase().includes(query)) ||
          getCategoryLabel(w.category).toLowerCase().includes(query) ||
          getDepartmentLabel(w.department).toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [warrants, searchQuery])

  // Pagination Logic
  const totalPages = Math.ceil(filteredWarrants.length / pageSize)
  const paginatedWarrants = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredWarrants.slice(start, start + pageSize)
  }, [filteredWarrants, currentPage, pageSize])

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterCategory, filterDepartment])

  const onSubmit = async (data: WarrantFormData) => {
    if (!hospitalId || !user?.id) return

    // Custom vote code validation and assignment
    if (selectedVoteCodeOption === 'others') {
      if (!customVoteCode.trim()) {
        setVoteCodeCustomError('Custom vote code is required')
        return
      }
      data.vote_code = customVoteCode.trim() as any
    }

    setIsSubmitting(true)
    let result
    if (isEditing && selectedWarrant) result = await updateWarrant(selectedWarrant.id, data)
    else result = await createWarrant(hospitalId, user.id, data)

    if (result.error) {
      showError(`Failed to ${isEditing ? 'update' : 'create'} warrant`, result.error)
    } else {
      showSuccess(`Warrant ${isEditing ? 'updated' : 'created'} successfully`)
      resetModalForm()
      void loadData()
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

  const handleEdit = () => {
    if (!selectedWarrant) return
    setIsEditing(true)
    setIsDetailsOpen(false)
    setIsFormOpen(true)
    setValue('warrant_date', selectedWarrant.warrant_date)
    setValue('document_no', selectedWarrant.document_no)

    const vCode = selectedWarrant.vote_code
    if (vCode === '080702' || vCode === '990102') {
      setSelectedVoteCodeOption(vCode)
      setCustomVoteCode('')
      setValue('vote_code', vCode)
    } else {
      setSelectedVoteCodeOption('others')
      setCustomVoteCode(vCode || '')
      setValue('vote_code', vCode || '')
    }

    setValue('vote_activity', selectedWarrant.vote_activity)
    setValue('category', selectedWarrant.category)
    setValue('department', selectedWarrant.department)
    const amount = Number(selectedWarrant.amount)
    setValue('amount', amount)
    setFormattedAmount(formatAmount(amount))
  }

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
      if (hospitalId) void loadData()
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const hospitalName = user?.hospital?.hospital_name || 'Hospital'

  const columns = [
    {
      key: 'warrant_date',
      header: 'Date',
      render: (w: Warrant) => <span className="font-medium text-slate-800">{formatDate(w.warrant_date)}</span>,
    },
    {
      key: 'document_no',
      header: 'Document No',
      render: (w: Warrant) => <span className="font-mono text-xs text-slate-900 font-bold">{w.document_no}</span>,
    },
    {
      key: 'vote_code',
      header: 'Vote',
      render: (w: Warrant) => <Badge variant="outline" className="font-mono text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-50 border-slate-200 text-slate-700">{w.vote_code}</Badge>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (w: Warrant) => (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border", CATEGORY_COLORS[w.category])}>
          {getCategoryLabel(w.category)}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (w: Warrant) => (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border", DEPARTMENT_COLORS[w.department])}>
          {getDepartmentLabel(w.department)}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (w: Warrant) => <span className="font-black text-slate-900 tabular-nums">{formatCurrency(Number(w.amount))}</span>,
    },
  ]

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
            <span className="text-slate-800 font-extrabold tracking-wide">Warrant Management</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                  Warrant Management
                </h1>
                <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                  FY {selectedYear} Allocation Monitoring & Distribution Control
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setIsFormOpen(true)}
                className="h-10 px-5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-950 hover:to-black text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 flex items-center gap-1.5 active:scale-95 hover:shadow-lg hover:shadow-slate-300/30"
              >
                <Plus className="h-4 w-4" />
                Add Warrant
              </button>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Filters Deck */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/10 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by document number, category..."
              className="w-full pl-11 pr-4 h-11 bg-slate-50 hover:bg-slate-100/50 border border-slate-150 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 shrink-0">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-11 px-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs font-black text-slate-705 focus:ring-2 focus:ring-slate-900/10 outline-none"
            >
              {years.map(y => <option key={y} value={y}>FY {y}</option>)}
            </select>

            <select
              value={filterVoteCode}
              onChange={(e) => setFilterVoteCode(e.target.value)}
              className="h-11 px-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs font-black text-slate-705 focus:ring-2 focus:ring-slate-900/10 outline-none"
            >
              <option value="">All Vote Codes</option>
              {availableFilterVoteCodes.map(vc => <option key={vc} value={vc}>{vc}</option>)}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-11 px-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs font-black text-slate-705 focus:ring-2 focus:ring-slate-900/10 outline-none"
            >
              <option value="">All Categories</option>
              {WARRANT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="h-11 px-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs font-black text-slate-705 focus:ring-2 focus:ring-slate-900/10 outline-none"
            >
              <option value="">All Departments</option>
              {WARRANT_DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>

            <button 
              onClick={loadData} 
              className="h-11 w-11 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-400 hover:text-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Elevated Dashboard KPI Metrics Section wrapped in a luxurious white background card */}
        {!isLoading && summary && (
          <div className="space-y-6">
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
                      <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-widest leading-none">Total Allocation</p>
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
                    <div className="w-12 h-12 bg-rose-100 border border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <DollarSign className="w-6 h-6" />
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

                {/* Available Balance */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="bg-blue-50/50 border-2 border-blue-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-blue-50 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-900/60 uppercase tracking-widest leading-none">Available Balance</p>
                      <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-blue-900 mt-2.5 tracking-tight tabular-nums truncate" title={formatCurrency(summary.total_balance).replace('MYR', 'RM')}>
                        {formatCurrency(summary.total_balance).replace('MYR', 'RM')}
                      </h3>
                      <p className="text-[11px] font-bold text-blue-600 mt-2 flex items-center gap-1.5 pt-0.5">
                        <span className="font-extrabold">
                          {summary.total_allocation > 0 ? ((summary.total_balance / summary.total_allocation) * 100).toFixed(1) : '0'}%
                        </span>
                        <span>Left inside the vault</span>
                      </p>
                    </div>
                  </div>
                </motion.div>

              </div>

              {/* Sub-metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-100">
                <div className="bg-amber-50/50 border-2 border-amber-100 p-5 rounded-[2rem] flex items-center gap-4 group hover:bg-amber-50 hover:border-amber-200 hover:shadow-xl transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-200 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-amber-900/65 uppercase tracking-widest leading-none">Total Liabilities</p>
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
                      <p className="text-[9px] font-black text-teal-900/65 uppercase tracking-widest leading-none">Usage Percentage</p>
                      <span className="text-[10px] font-black text-teal-600">{summary.usage_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(summary.usage_percentage, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Category Breakdown */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/15 overflow-hidden flex flex-col">
              <div className="p-6 lg:p-8 pb-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Clock className="w-5.5 h-5.5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Category Breakdown</h3>
                    <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Allocation distribution by pharmaceutical catalog type</p>
                  </div>
                </div>
              </div>

              <div className="p-6 lg:p-8">
                <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
                  {summary.by_category.map((cat, catIdx) => {
                    const percentage = summary.total_allocation > 0 ? (cat.allocation / summary.total_allocation) * 100 : 0
                    
                    const themes = [
                      { border: 'border-emerald-100', top: 'bg-emerald-500', sub: 'text-emerald-700', light: 'bg-emerald-50/[0.15]' },
                      { border: 'border-blue-100', top: 'bg-blue-500', sub: 'text-blue-700', light: 'bg-blue-50/[0.15]' },
                      { border: 'border-indigo-100', top: 'bg-indigo-500', sub: 'text-indigo-700', light: 'bg-indigo-50/[0.15]' },
                      { border: 'border-violet-100', top: 'bg-violet-500', sub: 'text-violet-700', light: 'bg-violet-50/[0.15]' },
                      { border: 'border-rose-100', top: 'bg-rose-500', sub: 'text-rose-700', light: 'bg-rose-50/[0.15]' },
                      { border: 'border-amber-100', top: 'bg-amber-500', sub: 'text-amber-700', light: 'bg-amber-50/[0.15]' },
                    ]
                    const theme = themes[catIdx % themes.length]

                    return (
                      <div key={cat.category} className={`break-inside-avoid mb-6 bg-white rounded-3xl border-2 ${theme.border} shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden`}>
                        <div className={`h-1.5 w-full ${theme.top}`} />
                        
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-5">
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${theme.top} text-white`}>
                                {getCategoryLabel(cat.category)}
                              </span>
                              <div className="mt-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {cat.count} Warrants • {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-base font-black tracking-tight tabular-nums ${theme.sub}`}>
                                {formatCurrency(cat.allocation).replace('MYR', 'RM')}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-5">
                            {cat.departments.map((dept, index) => (
                              <div key={dept.department} className={`pt-4 ${index !== 0 ? 'border-t border-slate-100' : 'border-t border-dashed border-slate-200'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <div className={`w-1.5 h-1.5 rounded-full ${theme.top}`} />
                                  <div className={`text-[10px] font-black uppercase tracking-wider ${theme.sub}`}>
                                    {getDepartmentLabel(dept.department)}
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  {dept.vote_codes.map(vc => {
                                    const vcUsage = vc.allocation > 0 ? (vc.expenses / vc.allocation) * 100 : 0
                                    
                                    let vcTheme = { 
                                      badge: 'bg-white border-slate-200 text-slate-700', 
                                      bar: theme.top 
                                    }
                                    
                                    if (vc.vote_code === '080702') {
                                      vcTheme = { 
                                        badge: 'bg-indigo-50 border-indigo-100 text-indigo-700', 
                                        bar: 'bg-indigo-500' 
                                      }
                                    } else if (vc.vote_code === '990102') {
                                      vcTheme = { 
                                        badge: 'bg-amber-50 border-amber-200 text-amber-700', 
                                        bar: 'bg-amber-500' 
                                      }
                                    }
                                    
                                    return (
                                      <div key={vc.vote_code} className={`p-3 rounded-2xl transition-colors ${theme.light}`}>
                                        <div className="flex items-center justify-between text-xs mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className={`font-mono font-bold border px-2 py-0.5 rounded-lg text-[9px] ${vcTheme.badge}`}>
                                              {vc.vote_code}
                                            </span>
                                            <span className="font-black text-slate-900 tabular-nums">
                                              {formatCurrency(vc.allocation).replace('MYR', 'RM')}
                                            </span>
                                          </div>
                                          <div className="font-bold text-[9px] text-slate-400">
                                            BAL: <span className="text-slate-800 tabular-nums">{formatCurrency(vc.balance).replace('MYR', 'RM')}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden border border-slate-100">
                                            <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${vcUsage}%` }}
                                              className={`h-full rounded-full ${vcTheme.bar}`}
                                            />
                                          </div>
                                          <span className={`text-[9px] font-black w-8 text-right tabular-nums ${vcUsage > 90 ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`}>
                                            {vcUsage.toFixed(0)}%
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}        {/* Main Records Table Registry Card Wrapper */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-200/80 overflow-hidden relative z-10">
          <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-950" />
                Warrant Records
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{filteredWarrants.length} items logged</p>
            </div>
          </div>
          
          <div className="px-4 pb-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-indigo-50/10 border-b border-slate-200/80">
                    <th className="w-1.5 p-0" />
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Document No</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vote</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Department</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</th>
                    <th className="w-10 px-3 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <Spinner size="md" className="mx-auto mb-2 text-indigo-650" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing records...</span>
                      </td>
                    </tr>
                  ) : paginatedWarrants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        No warrants matching parameters
                      </td>
                    </tr>
                  ) : (
                    paginatedWarrants.map((w) => (
                      <tr 
                        key={w.id} 
                        onClick={() => handleRowClick(w)}
                        className="hover:bg-slate-50/50 transition-colors duration-200 group cursor-pointer relative h-16"
                      >
                        {/* Slide-in Hover Accent Indicator */}
                        <td className="w-1.5 p-0 relative">
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-650 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center rounded-r" />
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-xs text-slate-500 tabular-nums">{formatDate(w.warrant_date)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-slate-900 font-black group-hover:text-indigo-600 transition-colors tabular-nums">{w.document_no}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-mono text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-50 border-slate-200 text-slate-700">{w.vote_code}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border", CATEGORY_COLORS[w.category])}>
                            {getCategoryLabel(w.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border", DEPARTMENT_COLORS[w.department])}>
                            {getDepartmentLabel(w.department)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-black text-slate-900 tabular-nums">{formatCurrency(Number(w.amount))}</span>
                        </td>
                        <td className="w-10 px-3 py-4 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden space-y-4 py-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Spinner size="lg" className="text-indigo-650 mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing records...</p>
                </div>
              ) : paginatedWarrants.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No warrants matching parameters</p>
                </div>
              ) : (
                paginatedWarrants.map((w) => (
                  <div 
                    key={w.id} 
                    className="bg-white border-2 border-slate-100 rounded-[2rem] p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 cursor-pointer"
                    onClick={() => handleRowClick(w)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Document ID</span>
                        <h4 className="text-xs font-mono font-black text-slate-900">{w.document_no}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                        <p className="text-sm font-black text-slate-950 tabular-nums">{formatCurrency(Number(w.amount))}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 pt-3 border-t border-slate-50">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                        <p className="text-xs font-bold text-slate-700">{formatDate(w.warrant_date)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vote Code</span>
                        <div>
                          <Badge variant="outline" className="font-mono text-[9px] px-2.5 py-0.5 h-5 rounded-lg border-slate-200 bg-slate-50 text-slate-600">{w.vote_code}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                      <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border", CATEGORY_COLORS[w.category])}>
                        {getCategoryLabel(w.category)}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border", DEPARTMENT_COLORS[w.department])}>
                        {getDepartmentLabel(w.department)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && filteredWarrants.length > 0 && (
              <div className="mt-8 pt-6 pb-6 px-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Count Summary */}
                <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                  Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(currentPage * pageSize, filteredWarrants.length)}</span> of <span className="text-slate-900 font-bold">{filteredWarrants.length}</span> entries
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
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Warrant Details"
        size="lg"
      >
        {selectedWarrant && (
          <div className="space-y-6 p-2">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-650">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warrant Record Document</p>
                <p className="text-sm font-black text-slate-900 font-mono mt-0.5">{selectedWarrant.document_no}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Document No</p>
                <p className="text-xs font-black text-slate-900 font-mono mt-1">{selectedWarrant.document_no}</p>
              </div>
              <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                <p className="text-xs font-bold text-slate-900 mt-1">{formatDate(selectedWarrant.warrant_date)}</p>
              </div>
              <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                <p className="text-base font-black text-indigo-650 tabular-nums mt-1">{formatCurrency(Number(selectedWarrant.amount))}</p>
              </div>
              <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                <div className="mt-1">
                  <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border", CATEGORY_COLORS[selectedWarrant.category])}>
                    {getCategoryLabel(selectedWarrant.category)}
                  </Badge>
                </div>
              </div>
              <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vote Code & Activity</p>
                <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                  Vote {selectedWarrant.vote_code} • {selectedWarrant.vote_activity}
                </p>
              </div>
              <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                <div className="mt-1">
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border", DEPARTMENT_COLORS[selectedWarrant.department])}>
                    {getDepartmentLabel(selectedWarrant.department)}
                  </span>
                </div>
              </div>
            </div>

            {selectedWarrant.created_by_user && (
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-[10px]">
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Logged By</p>
                  <p className="font-black text-slate-750">{selectedWarrant.created_by_user.full_name}</p>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={handleDeleteFromDetails} 
                className="h-10 px-5 rounded-xl border border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button 
                onClick={handleEdit} 
                className="h-10 px-5 rounded-xl border border-indigo-200 hover:border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button 
                onClick={() => setIsDetailsOpen(false)} 
                className="h-10 px-5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-950 hover:to-black text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={resetModalForm}
        title={isEditing ? 'Edit Warrant Record' : 'Create New Warrant Record'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Warrant Date</label>
              <Input type="date" {...register('warrant_date')} error={errors.warrant_date?.message} className="rounded-xl border-slate-200 h-11 text-sm font-semibold" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Document No</label>
              <Input {...register('document_no')} placeholder="e.g. W/2024/001" error={errors.document_no?.message} className="rounded-xl border-slate-200 h-11 text-sm font-semibold" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Vote Code</label>
              <select 
                value={selectedVoteCodeOption} 
                onChange={handleVoteCodeSelectChange}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 outline-none bg-white"
              >
                <option value="">Select Vote Code</option>
                {WARRANT_VOTE_CODES.map(v => (
                  <option key={v.value} value={v.value}>
                    {v.value === 'others' ? 'Others+' : `${v.label} (${v.value})`}
                  </option>
                ))}
              </select>
              {errors.vote_code && !selectedVoteCodeOption && (
                <p className="text-xs text-rose-500 mt-1">{errors.vote_code.message}</p>
              )}

              {selectedVoteCodeOption === 'others' && (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-2 space-y-1.5"
                >
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    Enter Custom Vote Code
                  </label>
                  <Input
                    type="text"
                    value={customVoteCode}
                    onChange={handleCustomVoteCodeChange}
                    placeholder="e.g. 080703 or VOT-KHAS-01"
                    className="rounded-xl border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 text-sm font-bold font-mono bg-indigo-50/20"
                    error={voteCodeCustomError}
                  />
                </motion.div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Vote Activity</label>
              <select {...register('vote_activity')} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 outline-none bg-white">
                <option value="">Select Activity</option>
                {WARRANT_VOTE_ACTIVITIES.map(a => <option key={a.value} value={a.value}>{a.label} ({a.value})</option>)}
              </select>
              {errors.vote_activity && <p className="text-xs text-rose-500 mt-1">{errors.vote_activity.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Category</label>
              <select {...register('category')} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 outline-none bg-white">
                <option value="">Select Category</option>
                {WARRANT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Department</label>
              <select {...register('department')} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 outline-none bg-white">
                <option value="">Select Department</option>
                {WARRANT_DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              {errors.department && <p className="text-xs text-rose-500 mt-1">{errors.department.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Amount (MYR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">RM</span>
                <input
                  type="text"
                  value={formattedAmount}
                  onChange={handleAmountChange}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 font-bold text-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 outline-none bg-white"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetModalForm}
              className="h-10 px-5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-655 font-bold text-xs active:scale-95 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-950 hover:to-black text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? <Spinner size="sm" /> : isEditing ? 'Update Warrant' : 'Create Warrant'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default WarrantPage
