import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  FileText,
  Eye,
  Activity,
  ShieldAlert,
  Database
} from 'lucide-react'
import { Button, Table, Pagination, Badge, LoadingOverlay, Modal, Input } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, AdminFilterBar, StatItem } from '@/components/admin'
import { getAuditLogs, exportAuditLogsToCSV, getAuditLogModules, getAuditLogActions } from '@/services/auditLogService'
import { useToastStore } from '@/stores/toastStore'
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import type { AuditLogWithRelations, SortConfig } from '@/types'

export const AuditLogPage: React.FC = () => {
  const { error: showError, success: showSuccess } = useToastStore()

  // State
  const [logs, setLogs] = useState<AuditLogWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')

  // Filters
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>({ key: 'created_at', direction: 'desc' })
  const [availableModules, setAvailableModules] = useState<string[]>([])
  const [availableActions, setAvailableActions] = useState<string[]>([])

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogWithRelations | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Fetch Metadata
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [modules, actions] = await Promise.all([getAuditLogModules(), getAuditLogActions()])
        setAvailableModules(modules)
        setAvailableActions(actions)
      } catch (error) {
        console.error('Error fetching metadata:', error)
      }
    }
    fetchMeta()
  }, [])

  // Fetch Logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAuditLogs({
        page: currentPage,
        pageSize,
        search: search || undefined,
        module: moduleFilter !== 'all' ? moduleFilter : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sort: sortConfig,
      })

      setLogs(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      showError('Error', 'Failed to load audit logs')
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, search, moduleFilter, actionFilter, startDate, endDate, sortConfig, showError])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Stats
  const stats: StatItem[] = useMemo(() => {
    return [
      {
        label: 'Total Logs',
        value: total,
        icon: Database,
        color: 'blue'
      },
      {
        label: 'Modules',
        value: availableModules.length,
        icon: Activity,
        color: 'indigo'
      },
      {
        label: 'Actions',
        value: availableActions.length,
        icon: FileText,
        color: 'emerald'
      },
      {
        label: 'Security Events',
        value: 'Monitored',
        icon: ShieldAlert,
        color: 'slate',
        description: 'System activity tracking'
      }
    ]
  }, [total, availableModules, availableActions])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csvContent = await exportAuditLogsToCSV({
        search: search || undefined,
        module: moduleFilter !== 'all' ? moduleFilter : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sort: sortConfig,
      })

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showSuccess('Success', 'Audit logs exported successfully')
    } catch (error) {
      showError('Error', 'Failed to export audit logs')
    } finally {
      setIsExporting(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'success'
      case 'update': return 'info'
      case 'delete': return 'error'
      case 'approve': return 'success'
      case 'reject': return 'error'
      case 'login': return 'info'
      default: return 'gray'
    }
  }

  const columns = [
    {
      key: 'created_at',
      label: 'Timestamp',
      sortable: true,
      render: (_: unknown, row: AuditLogWithRelations) => (
        <span className="text-sm font-mono text-slate-600">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (_: unknown, row: AuditLogWithRelations) => (
        <div className="space-y-0.5">
          <div className="font-medium text-slate-900">{row.user?.full_name || 'Unknown'}</div>
          <div className="text-xs text-slate-500">{row.user?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (_: unknown, row: AuditLogWithRelations) => (
        <Badge variant={getActionColor(row.action)} className="capitalize">
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'module',
      label: 'Module',
      sortable: true,
      render: (_: unknown, row: AuditLogWithRelations) => (
        <Badge variant="gray" className="capitalize">
          {row.module}
        </Badge>
      ),
    },
    {
      key: 'entity',
      label: 'Entity',
      render: (_: unknown, row: AuditLogWithRelations) => (
        <div className="text-sm text-slate-600">
          {row.entity_type && <span className="capitalize">{row.entity_type}</span>}
          {row.entity_id && <span className="text-slate-400 mx-1">#</span>}
          {row.entity_id && <span className="font-mono text-xs">{row.entity_id.slice(0, 8)}</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: AuditLogWithRelations) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedLog(row)
            setShowDetailModal(true)
          }}
          className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
      className: 'w-16',
    },
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
      <Button
        variant="outline"
        onClick={handleExport}
        isLoading={isExporting}
        leftIcon={<Download className="w-4 h-4" />}
      >
        Export
      </Button>
      <Button
        variant="ghost"
        onClick={fetchLogs}
        disabled={isLoading}
        className="text-slate-500 hover:bg-slate-100"
        title="Refresh"
      >
        <RefreshCw className={isLoading ? 'animate-spin w-5 h-5' : 'w-5 h-5'} />
      </Button>
    </div>
  )

  return (
    <AdminPageLayout
      title="Audit Logs"
      description="Track and monitor system activities, changes, and security events"
      icon={Activity}
      breadcrumbs={[{ label: 'Audit Logs' }]}
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
                key: 'module',
                label: 'Module',
                value: moduleFilter,
                onChange: setModuleFilter,
                options: availableModules.map(m => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))
              },
              {
                key: 'action',
                label: 'Action',
                value: actionFilter,
                onChange: setActionFilter,
                options: availableActions.map(a => ({ value: a, label: a.charAt(0).toUpperCase() + a.slice(1) }))
              }
            ]}
            onReset={() => {
              setSearch('')
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
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-end gap-4">
                  <div className="w-1/4">
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="w-1/4">
                    <label className="text-sm font-medium text-slate-700 mb-1 block">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">System Activity</h3>
            <span className="text-xs text-slate-500">
              Showing {logs.length} of {total} records
            </span>
          </div>

          <div className="relative">
            {isLoading && <LoadingOverlay message="Loading logs..." />}
            <Table
              data={logs}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => {
                setSortConfig(prev => prev?.key === key
                  ? (prev.direction === 'asc' ? { key, direction: 'desc' } : undefined)
                  : { key, direction: 'asc' })
              }}
              isLoading={isLoading}
              onRowClick={(row) => {
                setSelectedLog(row)
                setShowDetailModal(true)
              }}
              emptyMessage="No audit logs found matching your criteria."
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

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Timestamp</p>
                <p className="text-slate-900">{formatDateTime(selectedLog.created_at)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Action</p>
                <Badge variant={getActionColor(selectedLog.action)}>{selectedLog.action}</Badge>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">User</p>
                <div className="text-slate-900 font-medium">{selectedLog.user?.full_name}</div>
                <div className="text-slate-500 text-sm">{selectedLog.user?.email}</div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Module</p>
                <p className="text-slate-900 capitalize">{selectedLog.module}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">IP Address</p>
                <p className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block text-sm">
                  {selectedLog.ip_address || 'N/A'}
                </p>
              </div>
            </div>

            {(selectedLog.old_values || selectedLog.new_values) && (
              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-medium text-slate-900 mb-3">Changes</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.old_values && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Old Values</p>
                      <pre className="text-xs bg-rose-50 text-rose-800 p-3 rounded-lg overflow-x-auto border border-rose-100">
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.new_values && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">New Values</p>
                      <pre className="text-xs bg-emerald-50 text-emerald-800 p-3 rounded-lg overflow-x-auto border border-emerald-100">
                        {JSON.stringify(selectedLog.new_values, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminPageLayout>
  )
}

export default AuditLogPage
