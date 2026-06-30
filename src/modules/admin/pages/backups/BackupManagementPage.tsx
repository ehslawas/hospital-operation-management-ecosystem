// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Calendar,
  AlertTriangle,
  FileArchive,
  Download,
  Play,
  Settings,
  Trash2,
  TrendingUp,
  Info,
} from 'lucide-react'
import { Button, Badge, Modal, Table, Pagination, LoadingOverlay, Select } from '@/components/ui'
import {
  getSystemBackups,
  getLatestBackup,
  createManualBackup,
  getBackupDownloadUrl,
} from '@/services/backupService'
import {
  getHospitalBackups,
  getLatestHospitalBackup,
  createManualHospitalBackup,
  getHospitalBackupDownloadUrl,
} from '@/services/hospitalBackupService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { SYSTEM_ROLES } from '@/lib/constants'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'
import { cn, formatDate, formatFileSize, getRelativeTime } from '@/lib/utils'
import type { SystemBackup, BackupStatus, BackupType } from '@/types'

const statusConfig: Record<BackupStatus, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'text-slate-600', bgColor: 'bg-slate-100', icon: Clock, label: 'Pending' },
  in_progress: { color: 'text-primary-600', bgColor: 'bg-primary-100', icon: RefreshCw, label: 'In Progress' },
  completed: { color: 'text-success-600', bgColor: 'bg-success-100', icon: CheckCircle, label: 'Completed' },
  failed: { color: 'text-error-600', bgColor: 'bg-error-100', icon: XCircle, label: 'Failed' },
}

export const BackupManagementPage: React.FC = () => {
  const { user } = useAuthStore()
  const { error: showError, success: showSuccess } = useToastStore()
  const isSystemAdmin = user?.role?.role_code === SYSTEM_ROLES.SYSTEM_ADMIN
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const hospitalId = user?.hospital_id

  const [backups, setBackups] = useState<SystemBackup[]>([])
  const [latestBackup, setLatestBackup] = useState<SystemBackup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [backupToDelete, setBackupToDelete] = useState<SystemBackup | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const fetchBackups = useCallback(async () => {
    setIsLoading(true)
    try {
      if (isSystemAdmin) {
        // System Admin - get system backups
        const result = await getSystemBackups(currentPage, pageSize)
        setBackups(result.data)
        setTotal(result.total)
        setTotalPages(result.totalPages)

        // Get latest backup
        const latestResult = await getLatestBackup()
        if (latestResult.data) {
          setLatestBackup(latestResult.data)
        }
      } else if (isHospitalAdmin && hospitalId) {
        // Hospital Admin - get hospital backups
        const result = await getHospitalBackups(hospitalId, currentPage, pageSize)
        setBackups(result.data)
        setTotal(result.total)
        setTotalPages(result.totalPages)

        // Get latest backup
        const latestResult = await getLatestHospitalBackup(hospitalId)
        if (latestResult.data) {
          setLatestBackup(latestResult.data)
        }
      }
    } catch (error) {
      showError('Error', 'Failed to load backups')
      console.error('Error fetching backups:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, isSystemAdmin, isHospitalAdmin, hospitalId])

  useEffect(() => {
    fetchBackups()
  }, [fetchBackups])

  // Auto-refresh for in-progress backups
  useEffect(() => {
    const hasInProgress = backups.some((b) => b.status === 'in_progress')
    if (hasInProgress) {
      const interval = setInterval(() => {
        fetchBackups()
      }, 5000) // Check every 5 seconds
      return () => clearInterval(interval)
    }
  }, [backups, fetchBackups])

  const handleCreateBackup = async () => {
    if (!user || !hospitalId) return

    setIsCreating(true)
    try {
      let result
      if (isSystemAdmin) {
        result = await createManualBackup(user.id)
      } else if (isHospitalAdmin) {
        const backup = await createManualHospitalBackup(hospitalId, user.id)
        result = { data: backup, error: undefined }
      } else {
        return
      }

      if (result.data) {
        showSuccess('Success', 'Backup initiated successfully. It will appear in the list once started.')
        setShowCreateModal(false)
        // Refresh after a short delay to see the new backup
        setTimeout(() => {
          fetchBackups()
        }, 1000)
      } else {
        showError('Error', result.error || 'Failed to create backup')
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred')
      console.error('Error creating backup:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDownload = async (backup: SystemBackup) => {
    if (backup.status !== 'completed' || !backup.file_path) {
      showError('Error', 'Backup is not available for download')
      return
    }

    setDownloadingId(backup.id)
    try {
      let result
      if (isSystemAdmin) {
        result = await getBackupDownloadUrl(backup.id)
      } else if (isHospitalAdmin && hospitalId) {
        const url = await getHospitalBackupDownloadUrl(backup.id, hospitalId)
        result = { data: url, error: undefined }
      } else {
        return
      }

      if (result.data) {
        // Open download URL
        window.open(result.data, '_blank')
        showSuccess('Success', 'Download started')
      } else {
        showError('Error', result.error || 'Failed to get download URL')
      }
    } catch (error) {
      showError('Error', 'Failed to download backup')
      console.error('Error downloading backup:', error)
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredBackups = backups.filter((backup) => {
    if (statusFilter !== 'all' && backup.status !== statusFilter) return false
    if (typeFilter !== 'all' && backup.backup_type !== typeFilter) return false
    return true
  })

  const completedBackups = backups.filter((b) => b.status === 'completed').length
  const failedBackups = backups.filter((b) => b.status === 'failed').length
  const successRate = backups.length > 0 ? Math.round((completedBackups / backups.length) * 100) : 100

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-8 shadow-xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {isSystemAdmin ? 'Backup Management' : 'Hospital Backup Status'}
                </h1>
                <p className="text-blue-100 text-sm">
                  {isSystemAdmin 
                    ? 'Manage system backups and recovery operations'
                    : `Monitor backup status for ${user?.hospital?.hospital_name || 'your hospital'}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchBackups}
                disabled={isLoading}
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                leftIcon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                disabled={isCreating}
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                leftIcon={<Play className="w-4 h-4" />}
              >
                Create Backup
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Last Backup"
          value={
            latestBackup
              ? formatDate(latestBackup.completed_at || latestBackup.created_at, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Never'
          }
          subtitle={
            latestBackup
              ? `${formatFileSize(latestBackup.file_size || 0)} â€¢ ${getRelativeTime(latestBackup.completed_at || latestBackup.created_at)}`
              : 'No backups yet'
          }
          icon={Database}
          color={latestBackup ? 'success' : 'gray'}
        />
        <StatCard
          title="Total Backups"
          value={total}
          subtitle={`${completedBackups} completed, ${failedBackups} failed`}
          icon={FileArchive}
          color="primary"
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          subtitle={`${completedBackups} of ${backups.length} successful`}
          icon={TrendingUp}
          color={successRate >= 95 ? 'success' : successRate >= 80 ? 'warning' : 'error'}
        />
        <StatCard
          title="Storage Used"
          value={formatFileSize(
            backups.reduce((sum, b) => sum + (b.file_size || 0), 0)
          )}
          subtitle="Total backup storage"
          icon={HardDrive}
          color="info"
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
      >
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="w-48"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </Select>
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="w-48"
          >
            <option value="all">All Types</option>
            <option value="scheduled">Scheduled</option>
            <option value="manual">Manual</option>
            <option value="pre_update">Pre-Update</option>
          </Select>
        </div>
      </motion.div>

      {/* Backup List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-primary-600" />
            Backup History
          </h3>
        </div>

        {isLoading ? (
          <LoadingOverlay message="Loading backups..." />
        ) : filteredBackups.length > 0 ? (
          <>
            <div className="divide-y divide-slate-50">
              {filteredBackups.map((backup) => {
                const config = statusConfig[backup.status]
                const Icon = config.icon

                return (
                  <div
                    key={backup.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', config.bgColor)}>
                          <Icon
                            className={cn(
                              'w-6 h-6',
                              config.color,
                              backup.status === 'in_progress' && 'animate-spin'
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-semibold text-slate-900">
                              {formatDate(backup.created_at, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <Badge
                              variant={
                                backup.backup_type === 'scheduled'
                                  ? 'gray'
                                  : backup.backup_type === 'manual'
                                  ? 'primary'
                                  : 'warning'
                              }
                              size="sm"
                            >
                              {backup.backup_type}
                            </Badge>
                            <Badge
                              variant={
                                backup.status === 'completed'
                                  ? 'success'
                                  : backup.status === 'failed'
                                  ? 'error'
                                  : backup.status === 'in_progress'
                                  ? 'primary'
                                  : 'gray'
                              }
                              size="sm"
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            {backup.file_path && (
                              <span className="font-mono text-xs">{backup.file_path.split('/').pop()}</span>
                            )}
                            {backup.file_size && (
                              <span>{formatFileSize(backup.file_size)}</span>
                            )}
                            {backup.started_at && backup.completed_at && (
                              <span>
                                Duration: {Math.round((new Date(backup.completed_at).getTime() - new Date(backup.started_at).getTime()) / 1000 / 60)} min
                              </span>
                            )}
                            {backup.initiated_by && (
                              <span>Initiated by: {backup.initiated_by}</span>
                            )}
                          </div>
                          {backup.error_message && (
                            <div className="mt-2 p-2 bg-error-50 border border-error-200 rounded text-sm text-error-700">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              {backup.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {backup.status === 'completed' && backup.file_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(backup)}
                            disabled={downloadingId === backup.id}
                            leftIcon={<Download className="w-4 h-4" />}
                          >
                            {downloadingId === backup.id ? 'Downloading...' : 'Download'}
                          </Button>
                        )}
                        {backup.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBackupToDelete(backup)
                              setShowDeleteModal(true)
                            }}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            className="text-error-600 hover:text-error-700"
                          >
                            Delete
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
            <FileArchive className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Backups Found</h3>
            <p className="text-slate-600 mb-4">Create your first backup to get started</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)} leftIcon={<Play className="w-4 h-4" />}>
              Create Backup
            </Button>
          </div>
        )}
      </motion.div>

      {/* Backup Settings Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-6"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Backup Information</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>â€¢ Scheduled backups run daily at 2:00 AM</li>
              <li>â€¢ Backups are retained for 30 days</li>
              <li>â€¢ Manual backups can be created at any time</li>
              <li>â€¢ Backups include full database and system configuration</li>
              <li>â€¢ Download backups for offline storage or migration</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Create Backup Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Manual Backup"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            This will create a manual backup of the entire system database. The backup process may take a few minutes.
          </p>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-900 mb-2">What will be backed up:</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>â€¢ All database tables and data</li>
              <li>â€¢ System configuration</li>
              <li>â€¢ User accounts and permissions</li>
              <li>â€¢ Hospital and department data</li>
            </ul>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateBackup} disabled={isCreating} leftIcon={<Play className="w-4 h-4" />}>
              {isCreating ? 'Creating...' : 'Create Backup'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Backup Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setBackupToDelete(null)
        }}
        title="Delete Backup"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Are you sure you want to delete this backup? This action cannot be undone.
          </p>
          {backupToDelete && (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-900">Backup Details:</p>
              <p className="text-sm text-slate-600 mt-1">
                Created: {formatDate(backupToDelete.created_at)}
              </p>
              {backupToDelete.file_path && (
                <p className="text-sm text-slate-600">{backupToDelete.file_path}</p>
              )}
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setBackupToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                // TODO: Implement delete backup
                showError('Error', 'Delete functionality will be implemented')
                setShowDeleteModal(false)
                setBackupToDelete(null)
              }}
            >
              Delete Backup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray'
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, color }) => {
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
    gray: {
      bg: 'bg-slate-50',
      icon: 'bg-slate-100 text-slate-600',
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

export default BackupManagementPage
