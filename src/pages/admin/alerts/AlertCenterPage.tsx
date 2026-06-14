import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Filter,
  Check,
  X,
  Eye,
  EyeOff,
  Download,
  Search,
  Shield,
  Activity,
  Database,
  Settings,
} from 'lucide-react'
import { Button, Badge, Select, Input, Pagination, LoadingOverlay, Modal } from '@/components/ui'
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

const alertTypeConfig: Record<AlertType, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  critical: { color: 'text-error-600', bgColor: 'bg-error-100', icon: XCircle, label: 'Critical' },
  error: { color: 'text-error-600', bgColor: 'bg-error-100', icon: XCircle, label: 'Error' },
  warning: { color: 'text-warning-600', bgColor: 'bg-warning-100', icon: AlertTriangle, label: 'Warning' },
  info: { color: 'text-info-600', bgColor: 'bg-info-100', icon: Info, label: 'Info' },
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
  const [filters, setFilters] = useState<{
    alert_type?: AlertType
    category?: AlertCategory
    is_resolved?: boolean
    is_read?: boolean
  }>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    if (!isSystemAdmin) return

    setIsLoading(true)
    try {
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
  }, [currentPage, pageSize, filters, isSystemAdmin])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts()
    }, 30000)
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

  const handleViewDetail = (alert: SystemAlert) => {
    setSelectedAlert(alert)
    setShowDetailModal(true)
    // Auto-mark as read when viewing
    if (!alert.is_read) {
      handleMarkAsRead(alert.id)
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        alert.title.toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query) ||
        alert.category.toLowerCase().includes(query)
      )
    }
    return true
  })

  const criticalCount = alerts.filter((a) => a.alert_type === 'critical' && !a.is_resolved).length
  const warningCount = alerts.filter((a) => a.alert_type === 'warning' && !a.is_resolved).length
  const errorCount = alerts.filter((a) => a.alert_type === 'error' && !a.is_resolved).length
  const infoCount = alerts.filter((a) => a.alert_type === 'info' && !a.is_resolved).length
  const unresolvedCount = alerts.filter((a) => !a.is_resolved).length

  if (!isSystemAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-900">Access Denied</p>
          <p className="text-slate-600">Only System Admin can access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-6 h-6 text-primary-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Alert Center</h1>
            <p className="text-sm text-slate-600 mt-1">
              Monitor and manage system alerts
            </p>
          </div>
        </div>
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
            leftIcon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
          >
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Alert Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <StatCard
          title="Critical"
          value={criticalCount}
          icon={XCircle}
          color="error"
          subtitle="Requires immediate attention"
        />
        <StatCard
          title="Errors"
          value={errorCount}
          icon={XCircle}
          color="error"
          subtitle="System errors detected"
        />
        <StatCard
          title="Warnings"
          value={warningCount}
          icon={AlertTriangle}
          color="warning"
          subtitle="Potential issues"
        />
        <StatCard
          title="Info"
          value={infoCount}
          icon={Info}
          color="info"
          subtitle="Informational alerts"
        />
        <StatCard
          title="Unresolved"
          value={unresolvedCount}
          icon={Bell}
          color="primary"
          subtitle="Total active alerts"
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter className="w-4 h-4" />
            Filters:
          </div>
          <Select
            value={filters.alert_type || 'all'}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                alert_type: e.target.value === 'all' ? undefined : (e.target.value as AlertType),
              }))
              setCurrentPage(1)
            }}
            className="w-40"
          >
            <option value="all">All Types</option>
            <option value="critical">Critical</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </Select>
          <Select
            value={filters.category || 'all'}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                category: e.target.value === 'all' ? undefined : (e.target.value as AlertCategory),
              }))
              setCurrentPage(1)
            }}
            className="w-40"
          >
            <option value="all">All Categories</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="backup">Backup</option>
            <option value="system">System</option>
            <option value="module">Module</option>
          </Select>
          <Select
            value={filters.is_resolved === undefined ? 'all' : filters.is_resolved ? 'resolved' : 'unresolved'}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                is_resolved: e.target.value === 'all' ? undefined : e.target.value === 'resolved',
              }))
              setCurrentPage(1)
            }}
            className="w-40"
          >
            <option value="all">All Status</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
          </Select>
          <Select
            value={filters.is_read === undefined ? 'all' : filters.is_read ? 'read' : 'unread'}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                is_read: e.target.value === 'all' ? undefined : e.target.value === 'read',
              }))
              setCurrentPage(1)
            }}
            className="w-40"
          >
            <option value="all">All Read Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </Select>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </motion.div>

      {/* Alert List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        {isLoading ? (
          <LoadingOverlay message="Loading alerts..." />
        ) : filteredAlerts.length > 0 ? (
          <>
            <div className="divide-y divide-slate-50">
              {filteredAlerts.map((alert) => {
                const config = alertTypeConfig[alert.alert_type]
                const Icon = config.icon
                const CategoryIcon = categoryIcons[alert.category]

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'p-4 hover:bg-slate-50 transition-colors cursor-pointer',
                      !alert.is_read && 'bg-blue-50/50 border-l-4 border-l-primary-500'
                    )}
                    onClick={() => handleViewDetail(alert)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', config.bgColor)}>
                        <Icon className={cn('w-6 h-6', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                              {!alert.is_read && (
                                <span className="w-2 h-2 bg-primary-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{alert.message}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={config.color.replace('text-', '').replace('-600', '') as any} size="sm">
                              {config.label}
                            </Badge>
                            {alert.is_resolved && (
                              <Badge variant="success" size="sm">
                                Resolved
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                          <div className="flex items-center gap-1">
                            <CategoryIcon className="w-3 h-3" />
                            <span className="capitalize">{alert.category}</span>
                          </div>
                          <span>{getRelativeTime(alert.created_at)}</span>
                          {alert.resolved_at && (
                            <span>Resolved {getRelativeTime(alert.resolved_at)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!alert.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(alert.id)
                            }}
                            title="Mark as read"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {!alert.is_resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAlert(alert)
                              setShowResolveModal(true)
                            }}
                            title="Resolve alert"
                            className="text-success-600 hover:text-success-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
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
          </>
        ) : (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Alerts Found</h3>
            <p className="text-slate-600">No alerts match your current filters</p>
          </div>
        )}
      </motion.div>

      {/* Alert Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedAlert(null)
        }}
        title={selectedAlert?.title || 'Alert Details'}
        size="large"
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  alertTypeConfig[selectedAlert.alert_type].bgColor
                )}
              >
                {React.createElement(alertTypeConfig[selectedAlert.alert_type].icon, {
                  className: cn('w-6 h-6', alertTypeConfig[selectedAlert.alert_type].color),
                })}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={alertTypeConfig[selectedAlert.alert_type].color.replace('text-', '').replace('-600', '') as any}
                  >
                    {alertTypeConfig[selectedAlert.alert_type].label}
                  </Badge>
                  <Badge variant="gray" size="sm" className="capitalize">
                    {selectedAlert.category}
                  </Badge>
                  {selectedAlert.is_resolved && (
                    <Badge variant="success" size="sm">
                      Resolved
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  Created {formatDateTime(selectedAlert.created_at)}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-900 mb-2">Message</p>
              <p className="text-slate-700">{selectedAlert.message}</p>
            </div>

            {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-900 mb-2">Additional Information</p>
                <pre className="text-xs text-slate-600 overflow-auto">
                  {JSON.stringify(selectedAlert.metadata, null, 2)}
                </pre>
              </div>
            )}

            {selectedAlert.resolved_at && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                <p className="text-sm font-medium text-success-900 mb-1">Resolved</p>
                <p className="text-xs text-success-700">
                  {formatDateTime(selectedAlert.resolved_at)}
                </p>
                {selectedAlert.resolved_by && (
                  <p className="text-xs text-success-600 mt-1">Resolved by: {selectedAlert.resolved_by}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              {!selectedAlert.is_read && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleMarkAsRead(selectedAlert.id)
                    setShowDetailModal(false)
                  }}
                  leftIcon={<Eye className="w-4 h-4" />}
                >
                  Mark as Read
                </Button>
              )}
              {!selectedAlert.is_resolved && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowDetailModal(false)
                    setShowResolveModal(true)
                  }}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Resolve Alert
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Resolve Alert Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false)
          setSelectedAlert(null)
        }}
        title="Resolve Alert"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Are you sure you want to mark this alert as resolved?
          </p>
          {selectedAlert && (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-900">{selectedAlert.title}</p>
              <p className="text-xs text-slate-600 mt-1">{selectedAlert.message}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveModal(false)
                setSelectedAlert(null)
              }}
              disabled={resolvingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => selectedAlert && handleResolve(selectedAlert.id)}
              disabled={resolvingId !== null}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {resolvingId ? 'Resolving...' : 'Resolve Alert'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: 'primary' | 'success' | 'warning' | 'error' | 'info'
  subtitle?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      icon: 'bg-primary-100 text-primary-600',
    },
    success: {
      bg: 'bg-success-50',
      icon: 'bg-success-100 text-success-600',
    },
    warning: {
      bg: 'bg-warning-50',
      icon: 'bg-warning-100 text-warning-600',
    },
    error: {
      bg: 'bg-error-50',
      icon: 'bg-error-100 text-error-600',
    },
    info: {
      bg: 'bg-info-50',
      icon: 'bg-info-100 text-info-600',
    },
  }

  const colors = colorClasses[color]

  return (
    <div className={cn('card p-6', colors.bg)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.icon)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
      <p className="text-sm text-slate-600">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  )
}

export default AlertCenterPage
