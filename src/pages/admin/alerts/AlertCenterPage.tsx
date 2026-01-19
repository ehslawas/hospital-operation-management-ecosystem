import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Filter,
  Check,
  Eye,
  Shield,
  Activity,
  Database,
  Settings,
} from 'lucide-react'
import { Button, Badge, Modal, Table, Pagination, LoadingOverlay } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, AdminFilterBar, StatItem } from '@/components/admin'
import {
  getSystemAlerts,
  getUnreadAlertCount,
  markAlertAsRead,
  resolveAlert,
} from '@/services/alertService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'
import { cn, formatDateTime, getRelativeTime } from '@/lib/utils'
import type { SystemAlert, AlertType, AlertCategory } from '@/types'

const alertTypeConfig: Record<AlertType, { variant: 'error' | 'warning' | 'primary' | 'success', icon: any }> = {
  critical: { variant: 'error', icon: XCircle },
  error: { variant: 'error', icon: XCircle },
  warning: { variant: 'warning', icon: AlertTriangle },
  info: { variant: 'primary', icon: Info },
}

const categoryIcons: Record<AlertCategory, React.ElementType> = {
  security: Shield,
  performance: Activity,
  backup: Database,
  system: Settings,
  module: Settings,
}

export const AlertCenterPage: React.FC = () => {
  const { user } = useAuthStore()
  const { error: showError, success: showSuccess } = useToastStore()
  const isSystemAdmin = user?.role?.role_code === 'system_admin'

  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [readFilter, setReadFilter] = useState<string>('all')

  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    if (!isSystemAdmin) return

    setIsLoading(true)
    try {
      const filters = {
        alert_type: typeFilter !== 'all' ? (typeFilter as AlertType) : undefined,
        category: categoryFilter !== 'all' ? (categoryFilter as AlertCategory) : undefined,
        is_resolved: statusFilter !== 'all' ? statusFilter === 'resolved' : undefined,
        is_read: readFilter !== 'all' ? readFilter === 'read' : undefined,
      }

      const result = await getSystemAlerts(currentPage, pageSize, filters)
      setAlerts(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)

      // Get unread count
      const unread = await getUnreadAlertCount()
      setUnreadCount(unread)
    } catch (error) {
      showError('Error', 'Failed to load alerts')
      console.error('Error fetching alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, typeFilter, categoryFilter, statusFilter, readFilter, isSystemAdmin, showError])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  useEffect(() => {
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const result = await markAlertAsRead(alertId)
      if (result.data) {
        showSuccess('Success', 'Alert marked as read')
        fetchAlerts()
      } else {
        showError('Error', result.error || 'Failed to mark alert as read')
      }
    } catch (error) {
      showError('Error', 'Failed to mark alert as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadAlerts = alerts.filter((a) => !a.is_read && !a.is_resolved)
      await Promise.all(unreadAlerts.map((a) => markAlertAsRead(a.id)))
      showSuccess('Success', 'All alerts marked as read')
      fetchAlerts()
    } catch (error) {
      showError('Error', 'Failed to mark all alerts as read')
    }
  }

  const handleResolve = async (alertId: string) => {
    if (!user) return

    setResolvingId(alertId)
    try {
      const result = await resolveAlert(alertId, user.id)
      if (result.data) {
        showSuccess('Success', 'Alert resolved successfully')
        setShowResolveModal(false)
        setSelectedAlert(null)
        fetchAlerts()
      } else {
        showError('Error', result.error || 'Failed to resolve alert')
      }
    } catch (error) {
      showError('Error', 'Failed to resolve alert')
    } finally {
      setResolvingId(null)
    }
  }

  // Stats
  const stats: StatItem[] = useMemo(() => {
    // Note: These counts are from current page if not fetched separately. 
    // Ideal would be to fetch stats from API. Assuming we rely on what we have or just simplify.
    // For now, let's keep it simple or remove if accurate stats unavailable.
    // Current implementation fetches separate stats in variables. I will just calculate from fetched list or if backend doesn't support aggregate stats easily, I will omit or use 'Overview'.
    return [
      {
        label: 'Unread Alerts',
        value: unreadCount,
        icon: Bell,
        color: unreadCount > 0 ? (unreadCount > 10 ? 'rose' : 'amber') : 'slate',
        description: 'Requires attention'
      },
      {
        label: 'Total Alerts',
        value: total,
        icon: Activity,
        color: 'blue'
      }
    ]
  }, [unreadCount, total])

  const columns = [
    {
      key: 'type',
      label: 'Severity',
      render: (_: unknown, row: SystemAlert) => {
        const config = alertTypeConfig[row.alert_type]
        const Icon = config.icon
        return (
          <Badge variant={config.variant}>
            <Icon className="w-3 h-3 mr-1" />
            {row.alert_type}
          </Badge>
        )
      }
    },
    {
      key: 'category',
      label: 'Category',
      render: (_: unknown, row: SystemAlert) => {
        const Icon = categoryIcons[row.category]
        return (
          <span className="flex items-center gap-1.5 text-sm text-slate-600 capitalize">
            <Icon className="w-3.5 h-3.5 text-slate-400" />
            {row.category}
          </span>
        )
      }
    },
    {
      key: 'message',
      label: 'Message',
      render: (_: unknown, row: SystemAlert) => (
        <div>
          <div className="font-medium text-slate-900 flex items-center gap-2">
            {row.title}
            {!row.is_read && <span className="w-2 h-2 rounded-full bg-rose-500" />}
          </div>
          <div className="text-sm text-slate-500 line-clamp-1">{row.message}</div>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Time',
      render: (_: unknown, row: SystemAlert) => (
        <div className="text-sm text-slate-600">
          {getRelativeTime(row.created_at)}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: SystemAlert) => (
        row.is_resolved ? (
          <Badge variant="success">Resolved</Badge>
        ) : (
          <Badge variant="warning">Unresolved</Badge>
        )
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: SystemAlert) => (
        <div className="flex items-center justify-end gap-2">
          {!row.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleMarkAsRead(row.id)
              }}
              title="Mark as Read"
              className="text-slate-500 hover:text-indigo-600"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {!row.is_resolved && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedAlert(row)
                setShowResolveModal(true)
              }}
              title="Resolve"
              className="text-emerald-600 hover:bg-emerald-50"
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      className: 'w-24'
    }
  ]

  const headerActions = (
    <div className="flex items-center gap-3">
      {unreadCount > 0 && (
        <Button
          variant="outline"
          onClick={handleMarkAllAsRead}
          leftIcon={<Check className="w-4 h-4" />}
        >
          Mark All Read
        </Button>
      )}
      <Button
        variant="outline"
        onClick={fetchAlerts}
        disabled={isLoading}
        leftIcon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
      >
        Refresh
      </Button>
    </div>
  )

  if (!isSystemAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-600 mt-2">Only System Administrators can access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <AdminPageLayout
      title="Alert Center"
      description="Monitor system health, security alerts, and critical notifications"
      icon={Bell}
      breadcrumbs={[{ label: 'Alerts' }]}
      actions={headerActions}
    >
      <div className="space-y-6">
        <AdminStatsGrid stats={stats} isLoading={isLoading} />

        <AdminFilterBar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val)
            setCurrentPage(1)
          }}
          searchPlaceholder="Search alerts..."
          filters={[
            {
              key: 'type',
              label: 'Type',
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { value: 'critical', label: 'Critical' },
                { value: 'error', label: 'Error' },
                { value: 'warning', label: 'Warning' },
                { value: 'info', label: 'Info' }
              ]
            },
            {
              key: 'category',
              label: 'Category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: 'security', label: 'Security' },
                { value: 'performance', label: 'Performance' },
                { value: 'backup', label: 'Backup' },
                { value: 'system', label: 'System' },
                { value: 'module', label: 'Module' }
              ]
            },
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'unresolved', label: 'Unresolved' },
                { value: 'resolved', label: 'Resolved' }
              ]
            },
            {
              key: 'read',
              label: 'Read Status',
              value: readFilter,
              onChange: setReadFilter,
              options: [
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' }
              ]
            }
          ]}
          onReset={() => {
            setSearch('')
            setTypeFilter('all')
            setCategoryFilter('all')
            setStatusFilter('all')
            setReadFilter('all')
            setCurrentPage(1)
          }}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">Alert List</h3>
            <span className="text-xs text-slate-500">
              Showing {alerts.length} of {total} alerts
            </span>
          </div>

          <div className="relative">
            {isLoading && <LoadingOverlay message="Loading alerts..." />}
            <Table
              data={alerts}
              columns={columns}
              isLoading={isLoading}
              onRowClick={(row) => {
                setSelectedAlert(row)
                setShowDetailModal(true)
                if (!row.is_read) handleMarkAsRead(row.id)
              }}
              emptyMessage="No alerts found."
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

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Alert Details"
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${alertTypeConfig[selectedAlert.alert_type].variant === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {React.createElement(alertTypeConfig[selectedAlert.alert_type].icon, { className: 'w-6 h-6' })}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">{selectedAlert.title}</h3>
                <div className="flex gap-2 mt-1">
                  <Badge variant={alertTypeConfig[selectedAlert.alert_type].variant}>{selectedAlert.alert_type}</Badge>
                  <Badge variant="gray">{selectedAlert.category}</Badge>
                  {selectedAlert.is_resolved && <Badge variant="success">Resolved</Badge>}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg text-slate-700 border border-slate-100">
              {selectedAlert.message}
            </div>

            <div className="text-xs text-slate-500">
              <p>Created: {formatDateTime(selectedAlert.created_at)}</p>
              {selectedAlert.resolved_at && <p>Resolved: {formatDateTime(selectedAlert.resolved_at)}</p>}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              {!selectedAlert.is_resolved && (
                <Button
                  onClick={() => {
                    setShowDetailModal(false)
                    setShowResolveModal(true)
                  }}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Resolve
                </Button>
              )}
              {selectedAlert.is_resolved && (
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Resolve Confirmation */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Resolve Alert"
      >
        <div className="space-y-4">
          <p className="text-slate-600">Are you sure you want to mark this alert as resolved?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowResolveModal(false)}>Cancel</Button>
            <Button
              onClick={() => selectedAlert && handleResolve(selectedAlert.id)}
              disabled={resolvingId !== null}
              variant="primary"
            >
              {resolvingId ? 'Resolving...' : 'Confirm Resolve'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminPageLayout>
  )
}

export default AlertCenterPage
