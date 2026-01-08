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
} from 'lucide-react'
import { Button, Input, Select, Badge, Pagination, LoadingOverlay, Modal } from '@/components/ui'
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
  authentication: 'bg-blue-100 text-blue-700',
  user_activity: 'bg-purple-100 text-purple-700',
  administrative: 'bg-teal-100 text-teal-700',
  security: 'bg-amber-100 text-amber-700',
  system: 'bg-gray-100 text-gray-700',
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
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const hospitalId = user?.hospital_id

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
  const [moduleFilter, setModuleFilter] = useState<string>('all')
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
        const result = await getLogStatistics(hospitalId, 7)
        setStats({
          total: result.total,
          byCategory: result.byCategory,
          bySeverity: result.bySeverity,
        })
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }, [isSystemAdmin, isHospitalAdmin, hospitalId])

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
    setModuleFilter('all')
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
    <div className="space-y-6">
      {/* Header with Gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-8 shadow-xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {isSystemAdmin ? 'System Logs' : 'Hospital System Logs'}
                </h1>
                <p className="text-slate-100 text-sm">
                  {isSystemAdmin 
                    ? 'Monitor all system activities and events across all hospitals'
                    : `Monitor system activities and events for ${user?.hospital?.hospital_name || 'your hospital'}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={fetchLogs} 
                disabled={isLoading}
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                leftIcon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
              >
                Refresh
              </Button>
          <div className="relative group">
            <Button 
              variant="primary" 
              className="bg-white text-slate-700 hover:bg-slate-50 shadow-lg"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export
            </Button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
              >
                <FileJson className="w-4 h-4" />
                Export JSON
              </button>
            </div>
          </div>
        </div>
        </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
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
          <div className="rounded-xl p-4 bg-gradient-to-br from-slate-600 to-slate-800 text-white">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">Total Logs</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>

          {/* Category Stats */}
          {Object.entries(stats.byCategory).map(([category, count]) => {
            const Icon = categoryIcons[category as HospitalLogCategory]
            return (
              <div
                key={category}
                className={cn(
                  'rounded-xl p-4 cursor-pointer transition-all hover:scale-105',
                  categoryFilter === category ? 'ring-2 ring-primary-500' : '',
                  categoryColors[category as HospitalLogCategory]
                )}
                onClick={() => setCategoryFilter(categoryFilter === category ? 'all' : category)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium capitalize">{category.replace('_', ' ')}</span>
                </div>
                <p className="text-2xl font-bold">{count}</p>
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
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200"
        >
          <span className="text-sm font-medium text-gray-600">Severity (Last 7 days):</span>
          {Object.entries(stats.bySeverity).map(([severity, count]) => {
            const config = severityConfig[severity as HospitalLogSeverity]
            const Icon = config.icon
            return (
              <button
                key={severity}
                onClick={() => setSeverityFilter(severityFilter === severity ? 'all' : severity)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all',
                  config.bgColor,
                  severityFilter === severity ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                )}
              >
                <Icon className={cn('w-4 h-4', config.color)} />
                <span className={cn('text-sm font-medium capitalize', config.color)}>
                  {severity}: {count}
                </span>
              </button>
            )
          })}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filters</span>
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search logs by action, description, or module..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Hospital Filter - Only for System Admin */}
          {isSystemAdmin && (
            <Select
              value={hospitalFilter}
              onChange={(e) => {
                setHospitalFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'All Hospitals' },
                ...hospitals.map((hospital) => ({
                  value: hospital.id,
                  label: hospital.hospital_name,
                })),
              ]}
            />
          )}

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
            options={[
              { value: 'all', label: 'All Categories' },
              ...Object.entries(HOSPITAL_LOG_CATEGORY).map(([key, value]) => ({
                value,
                label: key.replace('_', ' '),
              })),
            ]}
          />

          {/* Severity Filter */}
          <Select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value)
              setCurrentPage(1)
            }}
            options={[
              { value: 'all', label: 'All Severities' },
              ...Object.entries(HOSPITAL_LOG_SEVERITY).map(([key, value]) => ({
                value,
                label: key,
              })),
            ]}
          />

          {/* User Filter */}
          <Select
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value)
              setCurrentPage(1)
            }}
            options={[
              { value: 'all', label: 'All Users' },
              ...users.map((user) => ({
                value: user.id,
                label: user.full_name,
              })),
            ]}
          />

          {/* Module Filter - Only for System Admin */}
          {isSystemAdmin && (
            <Select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'All Modules' },
                ...modules.map((module) => ({
                  value: module,
                  label: module,
                })),
              ]}
            />
          )}

          {/* Action Filter - Only for System Admin */}
          {isSystemAdmin && (
            <Select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'All Actions' },
                ...actions.map((action) => ({
                  value: action,
                  label: action.replace(/_/g, ' '),
                })),
              ]}
            />
          )}
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Date Range:</span>
          </div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setCurrentPage(1)
            }}
            className="w-40"
          />
          <span className="text-gray-400">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setCurrentPage(1)
            }}
            className="w-40"
          />
        </div>
      </motion.div>

      {/* Logs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <LoadingOverlay message="Loading logs..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No logs found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {logs.map((log, index) => {
                const CategoryIcon = categoryIcons[log.category]
                const severityConf = severityConfig[log.severity]
                const SeverityIcon = severityConf.icon

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewLog(log)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Severity Indicator */}
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          severityConf.bgColor
                        )}
                      >
                        <SeverityIcon className={cn('w-5 h-5', severityConf.color)} />
                      </div>

                      {/* Log Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                              categoryColors[log.category]
                            )}
                          >
                            <CategoryIcon className="w-3 h-3" />
                            {log.category.replace('_', ' ')}
                          </span>
                          <Badge
                            variant={
                              log.severity === 'critical'
                                ? 'error'
                                : log.severity === 'error'
                                  ? 'error'
                                  : log.severity === 'warning'
                                    ? 'warning'
                                    : 'gray'
                            }
                            size="sm"
                          >
                            {log.severity}
                          </Badge>
                          {log.hospital && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {log.hospital.hospital_name}
                            </span>
                          )}
                          {log.module && <span className="text-xs text-gray-400">• {log.module}</span>}
                        </div>

                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {log.action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">{log.description}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {log.user && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.user.full_name}
                            </span>
                          )}
                          {log.ip_address && <span>IP: {log.ip_address}</span>}
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                      </div>

                      {/* View Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewLog(log)
                        }}
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        View
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-200">
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

      {/* Log Detail Modal */}
      <AnimatePresence>
        {showLogDetail && selectedLog && (
          <Modal
            isOpen={showLogDetail}
            onClose={() => setShowLogDetail(false)}
            title="Log Details"
            size="lg"
          >
            <div className="space-y-4">
              {/* Header Info */}
              <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    severityConfig[selectedLog.severity].bgColor
                  )}
                >
                  {React.createElement(severityConfig[selectedLog.severity].icon, {
                    className: cn('w-6 h-6', severityConfig[selectedLog.severity].color),
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        selectedLog.severity === 'critical'
                          ? 'error'
                          : selectedLog.severity === 'error'
                            ? 'error'
                            : selectedLog.severity === 'warning'
                              ? 'warning'
                              : 'gray'
                      }
                    >
                      {selectedLog.severity}
                    </Badge>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        categoryColors[selectedLog.category]
                      )}
                    >
                      {React.createElement(categoryIcons[selectedLog.category], { className: 'w-3 h-3' })}
                      {selectedLog.category.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {selectedLog.action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedLog.description}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Timestamp</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDateTime(selectedLog.created_at)}</p>
                </div>
                {selectedLog.hospital && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Hospital</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedLog.hospital.hospital_name}</p>
                  </div>
                )}
                {selectedLog.user && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">User</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedLog.user.full_name}</p>
                  </div>
                )}
                {selectedLog.module && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Module</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedLog.module}</p>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">IP Address</label>
                    <p className="text-sm text-gray-900 mt-1 font-mono">{selectedLog.ip_address}</p>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">User Agent</label>
                    <p className="text-sm text-gray-900 mt-1 text-xs">{selectedLog.user_agent}</p>
                  </div>
                )}
                {selectedLog.entity_type && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Entity Type</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedLog.entity_type}</p>
                  </div>
                )}
                {selectedLog.entity_id && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Entity ID</label>
                    <p className="text-sm text-gray-900 mt-1 font-mono text-xs">{selectedLog.entity_id}</p>
                  </div>
                )}
              </div>

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Metadata</label>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700 overflow-auto max-h-48">
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
