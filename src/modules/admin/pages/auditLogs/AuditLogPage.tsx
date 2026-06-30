// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, RefreshCw, Download, Filter, Calendar, User, FileText, Eye } from 'lucide-react'
import { Button, Table, Pagination, Input, Select, Badge, LoadingOverlay, Modal } from '@/components/ui'
import { getAuditLogs, exportAuditLogsToCSV, getAuditLogModules, getAuditLogActions } from '@/services/auditLogService'
import { useToastStore } from '@/stores/toastStore'
import { ROUTES, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import type { AuditLogWithRelations, SortConfig } from '@/types'

export const AuditLogPage: React.FC = () => {
  const { error: showError, success: showSuccess } = useToastStore()
  const [logs, setLogs] = useState<AuditLogWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>({ key: 'created_at', direction: 'desc' })
  const [availableModules, setAvailableModules] = useState<string[]>([])
  const [availableActions, setAvailableActions] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogWithRelations | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchModulesAndActions()
  }, [])

  const fetchModulesAndActions = async () => {
    try {
      const [modules, actions] = await Promise.all([getAuditLogModules(), getAuditLogActions()])
      setAvailableModules(modules)
      setAvailableActions(actions)
    } catch (error) {
      console.error('Error fetching modules and actions:', error)
    }
  }

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
      showError('Error', 'Failed to load audit logs. Please try again.')
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, search, moduleFilter, actionFilter, startDate, endDate, sortConfig])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

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

      // Download CSV
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
      console.error('Error exporting audit logs:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'success'
      case 'update':
        return 'info'
      case 'delete':
        return 'error'
      case 'approve':
        return 'success'
      case 'reject':
        return 'error'
      case 'login':
        return 'info'
      default:
        return 'gray'
    }
  }

  const columns = [
    {
      key: 'created_at',
      label: 'Date & Time',
      sortable: true,
      render: (_: unknown, row: AuditLogWithRelations) => (
        <span className="text-sm text-slate-700">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (_: unknown, row: AuditLogWithRelations) => (
        <div>
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
        <span className="text-sm text-slate-700 capitalize">{row.module}</span>
      ),
    },
    {
      key: 'entity_type',
      label: 'Entity',
      render: (_: unknown, row: AuditLogWithRelations) => (
        <div>
          {row.entity_type && (
            <span className="text-sm text-slate-700 capitalize">{row.entity_type}</span>
          )}
          {row.entity_id && (
            <div className="text-xs text-slate-500 font-mono">{row.entity_id.slice(0, 8)}...</div>
          )}
        </div>
      ),
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (_: unknown, row: AuditLogWithRelations) => (
        <span className="text-sm text-slate-500 font-mono">{row.ip_address || 'N/A'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: AuditLogWithRelations) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedLog(row)
            setShowDetailModal(true)
          }}
          leftIcon={<Eye className="w-4 h-4" />}
        >
          View
        </Button>
      ),
      className: 'w-24',
    },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
            <p className="text-sm text-slate-600 mt-1">View system activity and changes</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="w-5 h-5" />}
            >
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              isLoading={isExporting}
              leftIcon={<Download className="w-5 h-5" />}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by action, module, or entity..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={fetchLogs} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value)
                  setCurrentPage(1)
                }}
                label="Module"
              >
                <option value="all">All Modules</option>
                {availableModules.map((module) => (
                  <option key={module} value={module}>
                    {module.charAt(0).toUpperCase() + module.slice(1)}
                  </option>
                ))}
              </Select>
              <Select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value)
                  setCurrentPage(1)
                }}
                label="Action"
              >
                <option value="all">All Actions</option>
                {availableActions.map((action) => (
                  <option key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </option>
                ))}
              </Select>
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="p-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table
              data={logs}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => {
                setSortConfig((prev) => {
                  if (prev?.key === key) {
                    return prev.direction === 'asc'
                      ? { key, direction: 'desc' }
                      : undefined
                  }
                  return { key, direction: 'asc' }
                })
              }}
              isLoading={isLoading}
              emptyMessage="No audit logs found"
            />
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
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedLog(null)
        }}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Date & Time</p>
                <p className="font-medium text-slate-900">{formatDateTime(selectedLog.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">User</p>
                <p className="font-medium text-slate-900">
                  {selectedLog.user?.full_name || 'Unknown'} ({selectedLog.user?.email || 'N/A'})
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Action</p>
                <Badge variant={getActionColor(selectedLog.action)} className="capitalize">
                  {selectedLog.action}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Module</p>
                <p className="font-medium text-slate-900 capitalize">{selectedLog.module}</p>
              </div>
              {selectedLog.entity_type && (
                <div>
                  <p className="text-sm text-slate-500">Entity Type</p>
                  <p className="font-medium text-slate-900 capitalize">{selectedLog.entity_type}</p>
                </div>
              )}
              {selectedLog.entity_id && (
                <div>
                  <p className="text-sm text-slate-500">Entity ID</p>
                  <p className="font-medium text-slate-900 font-mono text-sm">{selectedLog.entity_id}</p>
                </div>
              )}
              {selectedLog.ip_address && (
                <div>
                  <p className="text-sm text-slate-500">IP Address</p>
                  <p className="font-medium text-slate-900 font-mono">{selectedLog.ip_address}</p>
                </div>
              )}
              {selectedLog.user_agent && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">User Agent</p>
                  <p className="font-medium text-slate-900 text-sm">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>

            {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
              <div>
                <p className="text-sm text-slate-500 mb-2">Old Values</p>
                <pre className="bg-slate-50 p-3 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
              <div>
                <p className="text-sm text-slate-500 mb-2">New Values</p>
                <pre className="bg-slate-50 p-3 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AuditLogPage

