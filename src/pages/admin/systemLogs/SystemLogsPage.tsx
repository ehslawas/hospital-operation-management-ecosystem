import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Search,
  RefreshCw,
  Download,
  Filter,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  User,
  Settings,
  LogIn,
  Activity,
  Calendar,
  X,
  Eye,
  Building2,
  FileJson,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { Badge, Pagination, LoadingOverlay, Modal } from '@/components/ui'
import {
  getSystemLogs,
  getSystemLogStatistics,
  getSystemLogModules,
  getSystemLogActions,
  exportSystemLogsToCSV,
  exportSystemLogsToJSON,
  type SystemLogWithRelations,
} from '@/services/systemLogService'
import {
  getHospitalLogs,
  getLogStatistics,
  exportLogsToCSV,
  type HospitalLogWithRelations,
} from '@/services/hospitalLogService'
import { getAllHospitals } from '@/services/hospitalService'
import { getUsers } from '@/services/userService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { SYSTEM_ROLES } from '@/lib/constants'
import { formatDateTime, cn } from '@/lib/utils'
import { HOSPITAL_LOG_CATEGORY, HOSPITAL_LOG_SEVERITY, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'
import type { HospitalLogCategory, HospitalLogSeverity, Hospital, User as UserType } from '@/types'

const categoryIcons: Record<HospitalLogCategory, React.ElementType> = {
  authentication: LogIn,
  user_activity: User,
  administrative: Settings,
  security: Shield,
  system: Activity,
}

const categoryColors: Record<HospitalLogCategory, string> = {
  authentication: 'bg-blue-50 text-blue-700 border-blue-100',
  user_activity: 'bg-purple-50 text-purple-700 border-purple-100',
  administrative: 'bg-teal-50 text-teal-700 border-teal-100',
  security: 'bg-amber-50 text-amber-700 border-amber-100',
  system: 'bg-slate-50 text-slate-700 border-slate-100',
}

const severityConfig: Record<HospitalLogSeverity, { color: string; icon: React.ElementType; bgColor: string }> = {
  info: { color: 'text-blue-600', icon: Info, bgColor: 'bg-blue-50' },
  warning: { color: 'text-amber-600', icon: AlertTriangle, bgColor: 'bg-amber-50' },
  error: { color: 'text-red-600', icon: AlertCircle, bgColor: 'bg-red-50' },
  critical: { color: 'text-red-800', icon: AlertCircle, bgColor: 'bg-red-100' },
}

const SystemLogsPage: React.FC = () => {
  const { user } = useAuthStore()
  const { error: showError, success: showSuccess } = useToastStore()
  const isSystemAdmin = user?.role?.role_code === SYSTEM_ROLES.SYSTEM_ADMIN
  const hospitalId = user?.hospital_id
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN || (!isSystemAdmin && !!hospitalId)

  const [logs, setLogs] = useState<(SystemLogWithRelations | HospitalLogWithRelations)[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [hospitalFilter, setHospitalFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('pharmacy_logistics')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Options for filters
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [modules, setModules] = useState<string[]>([])
  const [actions, setActions] = useState<string[]>([])

  // Statistics
  const [stats, setStats] = useState<{
    total: number
    byCategory: Record<HospitalLogCategory, number>
    bySeverity: Record<HospitalLogSeverity, number>
    byHospital?: { hospital_id: string; hospital_name: string; count: number }[]
  } | null>(null)

  // Log detail modal
  const [selectedLog, setSelectedLog] = useState<(SystemLogWithRelations | HospitalLogWithRelations) | null>(null)
  const [showLogDetail, setShowLogDetail] = useState(false)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      if (isSystemAdmin) {
        // System Admin - use system logs
        const result = await getSystemLogs({
          page: currentPage,
          pageSize,
          hospitalId: hospitalFilter !== 'all' ? hospitalFilter : undefined,
          category: categoryFilter as HospitalLogCategory | 'all',
          severity: severityFilter as HospitalLogSeverity | 'all',
          userId: userFilter !== 'all' ? userFilter : undefined,
          module: moduleFilter !== 'all' ? moduleFilter : undefined,
          action: actionFilter !== 'all' ? actionFilter : undefined,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        })
        setLogs(result.data)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      } else if (isHospitalAdmin && hospitalId) {
        // Hospital Admin - use hospital logs (filtered by their hospital)
        const result = await getHospitalLogs({
          page: currentPage,
          pageSize,
          hospitalId, // Always filter by their hospital
          category: categoryFilter as HospitalLogCategory | 'all',
          severity: severityFilter as HospitalLogSeverity | 'all',
          userId: userFilter !== 'all' ? userFilter : undefined,
          module: moduleFilter !== 'all' ? moduleFilter : undefined,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        })
        setLogs(result.data)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      }
    } catch (error) {
      showError('Error', 'Failed to load system logs')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [
    currentPage,
    pageSize,
    hospitalFilter,
    categoryFilter,
    severityFilter,
    userFilter,
    moduleFilter,
    actionFilter,
    search,
    startDate,
    endDate,
    showError,
    isSystemAdmin,
    isHospitalAdmin,
    hospitalId,
  ])

  const fetchStats = useCallback(async () => {
    try {
      if (isSystemAdmin) {
        const result = await getSystemLogStatistics(7)
        setStats(result)
      } else if (isHospitalAdmin && hospitalId) {
        const result = await getLogStatistics(hospitalId, 7, moduleFilter)
        setStats({
          total: result.total,
          byCategory: result.byCategory,
          bySeverity: result.bySeverity,
        })
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }, [isSystemAdmin, isHospitalAdmin, hospitalId, moduleFilter])

  const fetchFilterOptions = useCallback(async () => {
    try {
      if (isSystemAdmin) {
        const [hospitalsData, modulesData, actionsData] = await Promise.all([
          getAllHospitals(),
          getSystemLogModules(),
          getSystemLogActions(),
        ])
        setHospitals(hospitalsData)
        setModules(modulesData)
        setActions(actionsData)
      } else if (isHospitalAdmin) {
        // Hospital Admin doesn't need hospital filter or system-wide modules/actions
        setHospitals([])
        setModules([])
        setActions([])
      }
    } catch (error) {
      console.error('Failed to load filter options:', error)
    }
  }, [isSystemAdmin, isHospitalAdmin])

  const fetchUsers = useCallback(async () => {
    try {
      if (isHospitalAdmin && hospitalId) {
        const result = await getUsers({ hospitalId, page: 1, pageSize: 1000 })
        setUsers(result.data)
      } else if (isSystemAdmin) {
        const result = await getUsers({ page: 1, pageSize: 1000 })
        setUsers(result.data)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }, [isSystemAdmin, isHospitalAdmin, hospitalId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    fetchStats()
    fetchFilterOptions()
    fetchUsers()
  }, [fetchStats, fetchFilterOptions, fetchUsers])

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      let result
      if (isSystemAdmin) {
        // Fetch all logs for export
        result = await getSystemLogs({
          page: 1,
          pageSize: 10000,
          hospitalId: hospitalFilter !== 'all' ? hospitalFilter : undefined,
          category: categoryFilter as HospitalLogCategory | 'all',
          severity: severityFilter as HospitalLogSeverity | 'all',
          userId: userFilter !== 'all' ? userFilter : undefined,
          module: moduleFilter !== 'all' ? moduleFilter : undefined,
          action: actionFilter !== 'all' ? actionFilter : undefined,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        })
      } else if (isHospitalAdmin && hospitalId) {
        result = await getHospitalLogs({
          page: 1,
          pageSize: 10000,
          hospitalId,
          category: categoryFilter as HospitalLogCategory | 'all',
          severity: severityFilter as HospitalLogSeverity | 'all',
          userId: userFilter !== 'all' ? userFilter : undefined,
          module: moduleFilter !== 'all' ? moduleFilter : undefined,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        })
      } else {
        return
      }

      let content: string
      let filename: string
      let mimeType: string

      if (format === 'csv') {
        if (isSystemAdmin) {
          content = exportSystemLogsToCSV(result.data as SystemLogWithRelations[])
          filename = `system_logs_${new Date().toISOString().split('T')[0]}.csv`
        } else {
          content = exportLogsToCSV(result.data as HospitalLogWithRelations[])
          filename = `hospital_logs_${new Date().toISOString().split('T')[0]}.csv`
        }
        mimeType = 'text/csv'
      } else {
        if (isSystemAdmin) {
          content = exportSystemLogsToJSON(result.data as SystemLogWithRelations[])
          filename = `system_logs_${new Date().toISOString().split('T')[0]}.json`
        } else {
          // For Hospital Admin, create JSON manually
          content = JSON.stringify(result.data, null, 2)
          filename = `hospital_logs_${new Date().toISOString().split('T')[0]}.json`
        }
        mimeType = 'application/json'
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      showSuccess('Export Complete', `Logs exported successfully as ${format.toUpperCase()}`)
    } catch (error) {
      showError('Export Failed', 'Failed to export logs')
    }
  }

  const resetFilters = () => {
    setSearch('')
    setHospitalFilter('all')
    setCategoryFilter('all')
    setSeverityFilter('all')
    setUserFilter('all')
    setModuleFilter('pharmacy_logistics')
    setActionFilter('all')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  const handleViewLog = (log: SystemLogWithRelations | HospitalLogWithRelations) => {
    setSelectedLog(log)
    setShowLogDetail(true)
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] relative font-sans overflow-x-hidden pb-16">
      {/* Premium Ambient Radial Lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-teal-500/[0.04] to-emerald-500/[0.02] rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/[0.02] to-teal-500/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-8">
        {/* Breadcrumbs & Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="space-y-4"
        >
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="text-slate-400">Monitoring</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-extrabold tracking-wide">MyWarrant Logs</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-teal-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900">
                  MyWarrant Activity Logs
                </h1>
                <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-teal-500 animate-pulse" />
                  {isSystemAdmin 
                    ? 'Monitor MyWarrant system activities and events across all hospitals'
                    : `Monitor MyWarrant activities and events for ${user?.hospital?.hospital_name || 'your hospital'}`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={fetchLogs} 
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
                Refresh
              </button>
              
              <div className="relative group">
                <button 
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 border border-teal-200/50 bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 active:scale-95 shadow-md shadow-teal-500/15"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Data
                </button>
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100/85 p-1.5 opacity-0 scale-95 origin-top-right invisible group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-200 z-30">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <FileJson className="w-4 h-4 text-teal-500" />
                    Export JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            {/* Total */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg border border-slate-800/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2.5 mb-3 opacity-80">
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">Total Logs</span>
              </div>
              <p className="text-3xl font-black tracking-tight">{stats.total}</p>
            </div>

            {/* Category Stats */}
            {Object.entries(stats.byCategory).map(([category, count]) => {
              const Icon = categoryIcons[category as HospitalLogCategory]
              return (
                <div
                  key={category}
                  className={cn(
                    'rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border',
                    categoryFilter === category 
                      ? 'ring-2 ring-teal-500 bg-white border-transparent shadow-md' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  )}
                  onClick={() => setCategoryFilter(categoryFilter === category ? 'all' : category)}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={cn("p-1.5 rounded-lg border", categoryColors[category as HospitalLogCategory])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 capitalize tracking-tight">{category.replace('_', ' ')}</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{count}</p>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* Severity Summary */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Severity (Last 7 days):</span>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(stats.bySeverity).map(([severity, count]) => {
                const config = severityConfig[severity as HospitalLogSeverity]
                const Icon = config.icon
                return (
                  <button
                    key={severity}
                    onClick={() => setSeverityFilter(severityFilter === severity ? 'all' : severity)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 border',
                      severityFilter === severity 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                        : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                    )}
                  >
                    <Icon className={cn('w-3.5 h-3.5', severityFilter === severity ? 'text-white' : config.color)} />
                    <span className="text-xs font-semibold capitalize">
                      {severity}: <span className={cn("font-bold", severityFilter === severity ? 'text-white' : 'text-slate-800')}>{count}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg">
                <Filter className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">Filter Controls</span>
            </div>
            <button 
              onClick={resetFilters}
              className="text-xs font-black uppercase tracking-wider text-teal-600 hover:text-teal-700 transition-colors"
            >
              Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Search Logs</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs by action, description, or module..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200"
                />
              </div>
            </div>

            {/* Hospital Filter - Only for System Admin */}
            {isSystemAdmin && (
              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Hospital</label>
                <div className="relative">
                  <select
                    value={hospitalFilter}
                    onChange={(e) => {
                      setHospitalFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 appearance-none transition-all duration-200"
                  >
                    <option value="all">All Hospitals</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>{hospital.hospital_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Category</label>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 appearance-none transition-all duration-200"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(HOSPITAL_LOG_CATEGORY).map(([key, value]) => (
                    <option key={value} value={value}>{key.replace('_', ' ')}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Severity Filter */}
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Severity</label>
              <div className="relative">
                <select
                  value={severityFilter}
                  onChange={(e) => {
                    setSeverityFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 appearance-none transition-all duration-200"
                >
                  <option value="all">All Severities</option>
                  {Object.entries(HOSPITAL_LOG_SEVERITY).map(([key, value]) => (
                    <option key={value} value={value}>{key}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* User Filter */}
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">User</label>
              <div className="relative">
                <select
                  value={userFilter}
                  onChange={(e) => {
                    setUserFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 appearance-none transition-all duration-200"
                >
                  <option value="all">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Module Filter - Only for System Admin */}
            {isSystemAdmin && (
              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Module</label>
                <div className="relative">
                  <select
                    value={moduleFilter}
                    onChange={(e) => {
                      setModuleFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 appearance-none transition-all duration-200"
                  >
                    <option value="all">All Modules</option>
                    {modules.map((module) => (
                      <option key={module} value={module}>{module}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Action Filter - Only for System Admin */}
            {isSystemAdmin && (
              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Action</label>
                <div className="relative">
                  <select
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 appearance-none transition-all duration-200"
                  >
                    <option value="all">All Actions</option>
                    {actions.map((action) => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Start Date */}
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 appearance-none transition-all duration-200"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 appearance-none transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Logs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
        >
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <LoadingOverlay message="Loading logs..." />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">No logs found</h3>
              <p className="text-xs font-semibold text-slate-400">Try adjusting your filters or date range</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-4.5 px-6">Date & Time</th>
                      <th className="py-4.5 px-6">User / Operator</th>
                      <th className="py-4.5 px-6">Action / Event</th>
                      <th className="py-4.5 px-6">Target Entity</th>
                      <th className="py-4.5 px-6 text-center">Category</th>
                      <th className="py-4.5 px-6 text-center">Severity</th>
                      <th className="py-4.5 px-6 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => {
                      const CategoryIcon = categoryIcons[log.category]
                      const severityConf = severityConfig[log.severity]
                      const SeverityIcon = severityConf.icon

                      return (
                        <tr 
                          key={log.id} 
                          className="hover:bg-slate-50/30 transition-colors group cursor-pointer text-sm"
                          onClick={() => handleViewLog(log)}
                        >
                          {/* Timestamp Column */}
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            <div className="font-bold text-slate-700">{formatDateTime(log.created_at)}</div>
                            {log.ip_address && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">IP: {log.ip_address}</div>
                            )}
                          </td>

                          {/* User Column */}
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                  <User className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                                <div className="font-extrabold text-slate-800" title={log.user.full_name}>
                                  {log.user.full_name}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-semibold">System</span>
                            )}
                          </td>

                          {/* Action & Description Column */}
                          <td className="py-4.5 px-6 max-w-[280px]">
                            <div className="font-black text-slate-900 leading-snug group-hover:text-teal-650 transition-colors capitalize">
                              {log.action.replace(/_/g, ' ')}
                            </div>
                            <div className="text-xs text-slate-500 font-semibold truncate mt-1" title={log.description}>
                              {log.description}
                            </div>
                          </td>

                          {/* Target Entity Column */}
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            {log.entity_type ? (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100 capitalize">
                                  {log.entity_type.replace(/_/g, ' ')}
                                </span>
                                {log.entity_id && (
                                  <span className="text-[10px] font-mono text-slate-400/90 mt-1">
                                    ID: <span className="font-semibold text-slate-500">{log.entity_id.substring(0, 8)}...</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-350">-</span>
                            )}
                          </td>

                          {/* Category Badge Column */}
                          <td className="py-4.5 px-6 text-center whitespace-nowrap">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border',
                                categoryColors[log.category]
                              )}
                            >
                              <CategoryIcon className="w-3 h-3" />
                              {log.category.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Severity Badge Column */}
                          <td className="py-4.5 px-6 text-center whitespace-nowrap">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                              log.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                              log.severity === 'error' ? 'bg-red-50 text-red-650 border-red-150' :
                              log.severity === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-150' :
                              'bg-slate-50 text-slate-650 border-slate-150'
                            )}>
                              {log.severity}
                            </span>
                          </td>

                          {/* Action Button Column */}
                          <td className="py-4.5 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleViewLog(log)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-teal-600 hover:text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-100 transition-all active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-slate-100 p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize)
                    setCurrentPage(1)
                  }}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                />
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {showLogDetail && selectedLog && (
          <Modal
            isOpen={showLogDetail}
            onClose={() => setShowLogDetail(false)}
            title="Activity Log Details"
            size="lg"
          >
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-start gap-4 pb-5 border-b border-slate-100">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border',
                    severityConfig[selectedLog.severity].bgColor,
                    selectedLog.severity === 'critical' ? 'border-red-200' :
                    selectedLog.severity === 'error' ? 'border-red-150' :
                    selectedLog.severity === 'warning' ? 'border-amber-150' : 'border-blue-150'
                  )}
                >
                  {React.createElement(severityConfig[selectedLog.severity].icon, {
                    className: cn('w-6 h-6', severityConfig[selectedLog.severity].color),
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                      selectedLog.severity === 'critical' ? 'bg-red-50 text-red-750 border-red-200' :
                      selectedLog.severity === 'error' ? 'bg-red-50 text-red-650 border-red-150' :
                      selectedLog.severity === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-150' :
                      'bg-slate-50 text-slate-600 border-slate-150'
                    )}>
                      {selectedLog.severity}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border',
                        categoryColors[selectedLog.category]
                      )}
                    >
                      {React.createElement(categoryIcons[selectedLog.category], { className: 'w-3 h-3' })}
                      {selectedLog.category.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-800 mb-1 leading-snug">
                    {selectedLog.action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </h3>
                  <p className="text-sm font-semibold text-slate-500 leading-relaxed">{selectedLog.description}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Timestamp</label>
                  <p className="text-sm font-extrabold text-slate-800">{formatDateTime(selectedLog.created_at)}</p>
                </div>
                {selectedLog.hospital && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Hospital</label>
                    <p className="text-sm font-extrabold text-slate-800">{selectedLog.hospital.hospital_name}</p>
                  </div>
                )}
                {selectedLog.user && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">User</label>
                    <p className="text-sm font-extrabold text-slate-800">{selectedLog.user.full_name}</p>
                  </div>
                )}
                {selectedLog.module && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Module</label>
                    <p className="text-sm font-extrabold text-slate-800">{selectedLog.module}</p>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">IP Address</label>
                    <p className="text-sm font-mono font-extrabold text-slate-800">{selectedLog.ip_address}</p>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">User Agent</label>
                    <p className="text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-normal">{selectedLog.user_agent}</p>
                  </div>
                )}
                {selectedLog.entity_type && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Entity Type</label>
                    <p className="text-sm font-extrabold text-slate-800">{selectedLog.entity_type}</p>
                  </div>
                )}
                {selectedLog.entity_id && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Entity ID</label>
                    <p className="text-sm font-mono font-extrabold text-slate-800 text-xs truncate" title={selectedLog.entity_id}>{selectedLog.entity_id}</p>
                  </div>
                )}
              </div>

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Metadata Details</label>
                  <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs overflow-auto max-h-48 font-mono leading-normal shadow-inner">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SystemLogsPage
