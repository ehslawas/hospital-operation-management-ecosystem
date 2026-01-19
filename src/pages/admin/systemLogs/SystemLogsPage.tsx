import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Search,
  RefreshCw,
  Download,
  Filter,
  Shield,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  Building2,
  Calendar,
  Settings,
  User,
  LogIn
} from 'lucide-react'
import { Button, Input, Badge, Pagination, LoadingOverlay, Modal, Table } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, AdminFilterBar, StatItem } from '@/components/admin'
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
import { SYSTEM_ROLES, HOSPITAL_LOG_CATEGORY, HOSPITAL_LOG_SEVERITY, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'
import { formatDateTime, cn } from '@/lib/utils'
import type { HospitalLogCategory, HospitalLogSeverity, Hospital, User as UserType } from '@/types'

const categoryIcons: Record<HospitalLogCategory, React.ElementType> = {
  authentication: LogIn,
  user_activity: User,
  administrative: Settings,
  security: Shield,
  system: Activity,
}

const severityConfig: Record<HospitalLogSeverity, { variant: 'success' | 'warning' | 'error' | 'primary' | 'gray', icon: any }> = {
  info: { variant: 'primary', icon: Info },
  warning: { variant: 'warning', icon: AlertTriangle },
  error: { variant: 'error', icon: AlertCircle },
  critical: { variant: 'error', icon: AlertCircle },
}

export const SystemLogsPage: React.FC = () => {
  const { user } = useAuthStore()
  const { error: showError, success: showSuccess } = useToastStore()
  const isSystemAdmin = user?.role?.role_code === SYSTEM_ROLES.SYSTEM_ADMIN
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const hospitalId = user?.hospital_id

  // State
  const [logs, setLogs] = useState<(SystemLogWithRelations | HospitalLogWithRelations)[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Options
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [modules, setModules] = useState<string[]>([])
  const [actions, setActions] = useState<string[]>([])

  // Stats
  const [statsData, setStatsData] = useState<{
    total: number
    byCategory: Record<HospitalLogCategory, number>
    bySeverity: Record<HospitalLogSeverity, number>
  } | null>(null)

  // Modal
  const [selectedLog, setSelectedLog] = useState<(SystemLogWithRelations | HospitalLogWithRelations) | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Fetch Logic
  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page: currentPage,
        pageSize,
        category: categoryFilter as HospitalLogCategory | 'all',
        severity: severityFilter as HospitalLogSeverity | 'all',
        userId: userFilter !== 'all' ? userFilter : undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }

      if (isSystemAdmin) {
        const result = await getSystemLogs({
          ...params,
          hospitalId: hospitalFilter !== 'all' ? hospitalFilter : undefined,
          module: moduleFilter !== 'all' ? moduleFilter : undefined,
          action: actionFilter !== 'all' ? actionFilter : undefined,
        })
        setLogs(result.data)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      } else if (isHospitalAdmin && hospitalId) {
        const result = await getHospitalLogs({
          ...params,
          hospitalId
        })
        setLogs(result.data)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      }
    } catch (error) {
      showError('Error', 'Failed to load logs')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, hospitalFilter, categoryFilter, severityFilter, userFilter, moduleFilter, actionFilter, search, startDate, endDate, isSystemAdmin, isHospitalAdmin, hospitalId, showError])

  const fetchStats = useCallback(async () => {
    try {
      if (isSystemAdmin) {
        const result = await getSystemLogStatistics(7)
        setStatsData(result)
      } else if (isHospitalAdmin && hospitalId) {
        const result = await getLogStatistics(hospitalId, 7)
        setStatsData(result)
      }
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }, [isSystemAdmin, isHospitalAdmin, hospitalId])

  const fetchOptions = useCallback(async () => {
    try {
      if (isSystemAdmin) {
        const [h, m, a, u] = await Promise.all([
          getAllHospitals(),
          getSystemLogModules(),
          getSystemLogActions(),
          getUsers({ page: 1, pageSize: 100 }) // Limit for dropdown
        ])
        setHospitals(h)
        setModules(m)
        setActions(a)
        setUsers(u.data)
      } else if (isHospitalAdmin && hospitalId) {
        const u = await getUsers({ hospitalId, page: 1, pageSize: 100 })
        setUsers(u.data)
      }
    } catch (e) { console.error(e) }
  }, [isSystemAdmin, isHospitalAdmin, hospitalId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    fetchStats()
    fetchOptions()
  }, [fetchStats, fetchOptions])

  // Computed Stats for Grid
  const stats: StatItem[] = useMemo(() => {
    if (!statsData) return []

    return [
      {
        label: 'Total Logs (7d)',
        value: statsData.total,
        icon: FileText,
        color: 'blue'
      },
      {
        label: 'Critical / Errors',
        value: (statsData.bySeverity.critical || 0) + (statsData.bySeverity.error || 0),
        icon: AlertCircle,
        color: 'rose',
        description: 'Requires attention'
      },
      {
        label: 'Security Events',
        value: statsData.byCategory.security || 0,
        icon: Shield,
        color: 'indigo'
      },
      {
        label: 'User Info',
        value: statsData.bySeverity.info || 0,
        icon: Info,
        color: 'slate'
      }
    ]
  }, [statsData])

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true)
    try {
      // Similar to original logic but simplified for brevity in this rewrite
      const params = {
        page: 1,
        pageSize: 10000,
        hospitalId: isSystemAdmin && hospitalFilter !== 'all' ? hospitalFilter : isHospitalAdmin ? hospitalId : undefined,
        category: categoryFilter as HospitalLogCategory | 'all',
        severity: severityFilter as HospitalLogSeverity | 'all',
        userId: userFilter !== 'all' ? userFilter : undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }

      let content = ''
      let filename = `logs.${format}`
      let type = format === 'csv' ? 'text/csv' : 'application/json'

      if (isSystemAdmin) {
        const result = await getSystemLogs({ ...params, module: moduleFilter !== 'all' ? moduleFilter : undefined, action: actionFilter !== 'all' ? actionFilter : undefined })
        if (format === 'csv') content = exportSystemLogsToCSV(result.data as SystemLogWithRelations[])
        else content = exportSystemLogsToJSON(result.data as SystemLogWithRelations[])
      } else {
        const result = await getHospitalLogs(params)
        if (format === 'csv') content = exportLogsToCSV(result.data as HospitalLogWithRelations[])
        else content = JSON.stringify(result.data, null, 2)
      }

      const blob = new Blob([content], { type })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showSuccess('Success', 'Export completed')
    } catch (e) {
      showError('Error', 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const columns = [
    {
      key: 'severity',
      label: 'Severity',
      render: (_: unknown, row: any) => {
        const config = severityConfig[row.severity as HospitalLogSeverity]
        const Icon = config.icon
        return (
          <Badge variant={config.variant}>
            <Icon className="w-3 h-3 mr-1" />
            {row.severity}
          </Badge>
        )
      }
    },
    {
      key: 'timestamp',
      label: 'Time',
      render: (_: unknown, row: any) => (
        <div className="text-sm font-mono text-slate-600">
          {formatDateTime(row.created_at)}
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (_: unknown, row: any) => (
        <div>
          <div className="font-medium text-slate-900">{row.action.replace(/_/g, ' ')}</div>
          <div className="text-xs text-slate-500">{row.module}</div>
        </div>
      )
    },
    {
      key: 'user',
      label: 'User',
      render: (_: unknown, row: any) => (
        row.user ? (
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {row.user.full_name}
          </div>
        ) : <span className="text-slate-400 text-xs">-</span>
      )
    },
    ...(isSystemAdmin ? [{
      key: 'hospital',
      label: 'Hospital',
      render: (_: unknown, row: any) => (
        row.hospital ? (
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            {row.hospital.hospital_name}
          </div>
        ) : <span className="text-slate-400 text-xs">System</span>
      )
    }] : []),
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedLog(row)
            setShowDetailModal(true)
          }}
          className="text-slate-500 hover:text-indigo-600"
        >
          <Settings className="w-4 h-4" />
        </Button>
      ),
      className: 'w-16'
    }
  ]

  const headerActions = (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        leftIcon={<Filter className="w-4 h-4" />}
        className={showAdvancedFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}
      >
        Filters
      </Button>
      <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-sm">
        <Button variant="ghost" size="sm" onClick={() => handleExport('csv')} disabled={isExporting} title="Export CSV" className="h-8 w-8 p-0">
          <FileText className="w-4 h-4 text-slate-600" />
        </Button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <Button variant="ghost" size="sm" onClick={() => handleExport('json')} disabled={isExporting} title="Export JSON" className="h-8 w-8 p-0">
          <Settings className="w-4 h-4 text-slate-600" />
        </Button>
      </div>
      <Button
        variant="outline"
        onClick={() => fetchLogs()}
        disabled={isLoading}
        leftIcon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
      >
        Refresh
      </Button>
    </div>
  )

  return (
    <AdminPageLayout
      title={isSystemAdmin ? "System Logs" : "Hospital System Logs"}
      description="Monitor system activities, errors, and security events"
      icon={Activity}
      breadcrumbs={[{ label: 'Logs' }]}
      actions={headerActions}
    >
      <div className="space-y-6">
        <AdminStatsGrid stats={stats} isLoading={isLoading} />

        <div className="space-y-4">
          <AdminFilterBar
            searchValue={search}
            onSearchChange={(val) => {
              setSearch(val)
              setCurrentPage(1)
            }}
            searchPlaceholder="Search logs..."
            filters={[
              {
                key: 'category',
                label: 'Category',
                value: categoryFilter,
                onChange: setCategoryFilter,
                options: [
                  { value: 'all', label: 'All Categories' },
                  ...Object.keys(HOSPITAL_LOG_CATEGORY).map(k => ({ value: k, label: k.replace('_', ' ') }))
                ]
              },
              {
                key: 'severity',
                label: 'Severity',
                value: severityFilter,
                onChange: setSeverityFilter,
                options: [
                  { value: 'all', label: 'All Severities' },
                  ...Object.keys(HOSPITAL_LOG_SEVERITY).map(k => ({ value: k, label: k }))
                ]
              }
            ]}
            onReset={() => {
              setSearch('')
              setCategoryFilter('all')
              setSeverityFilter('all')
              setHospitalFilter('all')
              setUserFilter('all')
              setModuleFilter('all')
              setActionFilter('all')
              setStartDate('')
              setEndDate('')
              setCurrentPage(1)
            }}
          />

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                {isSystemAdmin && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Hospital</label>
                    <select
                      className="w-full text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      value={hospitalFilter}
                      onChange={(e) => setHospitalFilter(e.target.value)}
                    >
                      <option value="all">All Hospitals</option>
                      {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">User</label>
                  <select
                    className="w-full text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Start Date</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">End Date</label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">System Logs</h3>
            <span className="text-xs text-slate-500">
              Showing {logs.length} of {total} records
            </span>
          </div>

          <div className="relative">
            {isLoading && <LoadingOverlay message="Loading logs..." />}
            <Table
              data={logs}
              columns={columns}
              isLoading={isLoading}
              onRowClick={(row) => {
                setSelectedLog(row)
                setShowDetailModal(true)
              }}
              emptyMessage="No system logs found."
            />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/30 p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          </div>
        </div>
      </div>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Log Details" size="lg">
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">Action</span>
                <span className="font-medium text-slate-900">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">Severity</span>
                <Badge variant={severityConfig[selectedLog.severity as HospitalLogSeverity].variant as any}>{selectedLog.severity}</Badge>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">User</span>
                <span className="text-slate-900">{selectedLog.user?.full_name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">Module</span>
                <span className="text-slate-900">{selectedLog.module}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-xs uppercase font-semibold">Description</span>
                <p className="bg-slate-50 p-2 rounded text-slate-700 mt-1">{selectedLog.description}</p>
              </div>
              {/* JSON Metadata if available */}
              {(selectedLog as any).metadata && (
                <div className="col-span-2">
                  <span className="text-slate-500 block text-xs uppercase font-semibold">Metadata</span>
                  <pre className="bg-slate-800 text-slate-200 p-2 rounded text-xs mt-1 overflow-auto max-h-40">
                    {JSON.stringify((selectedLog as any).metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AdminPageLayout>
  )
}

export default SystemLogsPage
