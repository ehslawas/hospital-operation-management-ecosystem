import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  FileArchive,
  Download,
  Play,
  Trash2,
  TrendingUp,
  Info,
  AlertTriangle
} from 'lucide-react'
import { Button, Badge, Modal, Table, Pagination, LoadingOverlay, ConfirmationDialog } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, AdminFilterBar, StatItem } from '@/components/admin'
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
import { SYSTEM_ROLES, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'
import { formatDate, formatFileSize, getRelativeTime } from '@/lib/utils'
import type { SystemBackup, BackupStatus } from '@/types'

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

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean, backup: SystemBackup | null }>({ isOpen: false, backup: null })
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const fetchBackups = useCallback(async () => {
    setIsLoading(true)
    try {
      if (isSystemAdmin) {
        const result = await getSystemBackups(currentPage, pageSize)
        setBackups(result.data)
        setTotal(result.total)
        setTotalPages(result.totalPages)
        const latestResult = await getLatestBackup()
        if (latestResult.data) setLatestBackup(latestResult.data)
      } else if (isHospitalAdmin && hospitalId) {
        const result = await getHospitalBackups(hospitalId, currentPage, pageSize)
        setBackups(result.data)
        setTotal(result.total)
        setTotalPages(result.totalPages)
        const latestResult = await getLatestHospitalBackup(hospitalId)
        if (latestResult.data) setLatestBackup(latestResult.data)
      }
    } catch (error) {
      showError('Error', 'Failed to load backups')
      console.error('Error fetching backups:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, isSystemAdmin, isHospitalAdmin, hospitalId, showError])

  useEffect(() => {
    fetchBackups()
  }, [fetchBackups])

  // Auto-refresh for in-progress backups
  useEffect(() => {
    const hasInProgress = backups.some((b) => b.status === 'in_progress')
    if (hasInProgress) {
      const interval = setInterval(fetchBackups, 5000)
      return () => clearInterval(interval)
    }
  }, [backups, fetchBackups])

  // Stats
  const stats: StatItem[] = useMemo(() => {
    const completedCount = backups.filter(b => b.status === 'completed').length
    const failedCount = backups.filter(b => b.status === 'failed').length
    const storageUsed = backups.reduce((sum, b) => sum + (b.file_size || 0), 0)
    const successRate = total > 0 ? Math.round((completedCount / total) * 100) : 100

    return [
      {
        label: 'Total Backups',
        value: total,
        icon: FileArchive,
        color: 'blue'
      },
      {
        label: 'Last Backup',
        value: latestBackup ? getRelativeTime(latestBackup.created_at) : 'Never',
        icon: Clock,
        color: latestBackup ? 'emerald' : 'slate',
        description: latestBackup ? formatDate(latestBackup.created_at) : '-'
      },
      {
        label: 'Success Rate',
        value: `${successRate}%`,
        icon: TrendingUp,
        color: successRate > 90 ? 'emerald' : successRate > 70 ? 'amber' : 'rose',
        description: `${failedCount} failed`
      },
      {
        label: 'Storage Used',
        value: formatFileSize(storageUsed),
        icon: HardDrive,
        color: 'indigo'
      }
    ]
  }, [backups, total, latestBackup])

  const handleCreateBackup = async () => {
    if (!user) return

    setIsCreating(true)
    try {
      let result
      if (isSystemAdmin) {
        result = await createManualBackup(user.id)
      } else if (isHospitalAdmin && hospitalId) {
        const backup = await createManualHospitalBackup(hospitalId, user.id)
        result = { data: backup, error: undefined }
      } else {
        return
      }

      if (result.data) {
        showSuccess('Success', 'Backup initiated successfully')
        setShowCreateModal(false)
        setTimeout(fetchBackups, 1000)
      } else {
        showError('Error', result.error || 'Failed to create backup')
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDownload = async (backup: SystemBackup) => {
    if (backup.status !== 'completed' || !backup.file_path) return

    setDownloadingId(backup.id)
    try {
      let result
      if (isSystemAdmin) {
        result = await getBackupDownloadUrl(backup.id)
      } else if (isHospitalAdmin && hospitalId) {
        const url = await getHospitalBackupDownloadUrl(backup.id, hospitalId)
        result = { data: url, error: undefined }
      }

      if (result?.data) {
        window.open(result.data, '_blank')
        showSuccess('Success', 'Download started')
      } else {
        showError('Error', 'Failed to get download URL')
      }
    } catch (error) {
      showError('Error', 'Failed to download backup')
    } finally {
      setDownloadingId(null)
    }
  }

  // Filter Logic
  const filteredBackups = useMemo(() => {
    return backups.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (typeFilter !== 'all' && b.backup_type !== typeFilter) return false
      return true
    })
  }, [backups, statusFilter, typeFilter])

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: SystemBackup) => {
        const statusMap: Record<BackupStatus, { variant: 'success' | 'warning' | 'error' | 'primary' | 'gray', icon: any }> = {
          completed: { variant: 'success', icon: CheckCircle },
          failed: { variant: 'error', icon: XCircle },
          in_progress: { variant: 'primary', icon: RefreshCw },
          pending: { variant: 'warning', icon: Clock }
        }
        const config = statusMap[row.status] || statusMap.pending
        const Icon = config.icon

        return (
          <Badge variant={config.variant}>
            <Icon className={`w-3 h-3 mr-1 ${row.status === 'in_progress' ? 'animate-spin' : ''}`} />
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </Badge>
        )
      }
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (_: unknown, row: SystemBackup) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700">{formatDate(row.created_at)}</span>
          <span className="text-xs text-slate-500">{getRelativeTime(row.created_at)}</span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (_: unknown, row: SystemBackup) => (
        <span className="capitalize text-slate-700">{row.backup_type.replace('_', ' ')}</span>
      )
    },
    {
      key: 'size',
      label: 'Size',
      render: (_: unknown, row: SystemBackup) => (
        <span className="font-mono text-sm text-slate-600">{row.file_size ? formatFileSize(row.file_size) : '-'}</span>
      )
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (_: unknown, row: SystemBackup) => {
        if (!row.started_at || !row.completed_at) return <span className="text-slate-400">-</span>
        const minutes = Math.round((new Date(row.completed_at).getTime() - new Date(row.started_at).getTime()) / 1000 / 60)
        return <span className="text-sm text-slate-600">{minutes < 1 ? '< 1m' : `${minutes}m`}</span>
      }
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: SystemBackup) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDownload(row)
              }}
              disabled={downloadingId === row.id}
              className="text-indigo-600 hover:bg-indigo-50"
              title="Download"
            >
              <Download className={`w-4 h-4 ${downloadingId === row.id ? 'animate-bounce' : ''}`} />
            </Button>
          )}
          {row.status !== 'in_progress' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setConfirmDelete({ isOpen: true, backup: row })
              }}
              className="text-rose-600 hover:bg-rose-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      className: 'w-24'
    }
  ]

  const headerActions = (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={fetchBackups}
        disabled={isLoading}
        leftIcon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
      >
        Refresh
      </Button>
      <Button
        variant="primary"
        onClick={() => setShowCreateModal(true)}
        disabled={isCreating}
        className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        leftIcon={<Play className="w-5 h-5" />}
      >
        Backup Now
      </Button>
    </div>
  )

  return (
    <AdminPageLayout
      title={isSystemAdmin ? "Backup Management" : "Hospital Backups"}
      description="Manage system backups, recovery points, and data archives"
      icon={Database}
      breadcrumbs={[{ label: 'Backups' }]}
      actions={headerActions}
    >
      <div className="space-y-6">
        <AdminStatsGrid stats={stats} isLoading={isLoading} />

        <div className="flex flex-col gap-6">
          <AdminFilterBar
            searchValue=""
            onSearchChange={() => { }}
            // Search not implemented in backend service for backups? 
            // Assuming no search needed or supported, passing dummy
            hideSearch={true}
            filters={[
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: 'completed', label: 'Completed' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'failed', label: 'Failed' },
                ]
              },
              {
                key: 'type',
                label: 'Type',
                value: typeFilter,
                onChange: setTypeFilter,
                options: [
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'manual', label: 'Manual' },
                  { value: 'pre_update', label: 'Pre-Update' },
                ]
              }
            ]}
            onReset={() => {
              setStatusFilter('all')
              setTypeFilter('all')
            }}
          />

          {/* Info Box */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-sm text-indigo-800">
            <Info className="w-5 h-5 text-indigo-600 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Backup Policy:</p>
              <p>• Automated backups run daily at 02:00 UTC.</p>
              <p>• Retention period is 30 days.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-700">Backup History</h3>
              <span className="text-xs text-slate-500">
                Showing {filteredBackups.length} records
              </span>
            </div>

            <div className="relative">
              {isLoading && <LoadingOverlay message="Loading backups..." />}
              <Table
                data={filteredBackups}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No backups available."
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
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Manual Backup"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-900 mb-1">Notice</p>
              <p>This will trigger an immediate full backup. The process may take several minutes depending on database size.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateBackup} disabled={isCreating} variant="primary" leftIcon={isCreating ? <RefreshCw className="animate-spin" /> : <Play className="w-4 h-4" />}>
              {isCreating ? 'Backing up...' : 'Start Backup'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, backup: null })}
        onConfirm={async () => {
          showError('Restricted', 'Delete functionality is disabled in this view.')
          setConfirmDelete({ isOpen: false, backup: null })
        }}
        title="Delete Backup?"
        message={`Are you sure you want to delete backup from ${confirmDelete.backup ? formatDate(confirmDelete.backup.created_at) : ''}?`}
        variant="danger"
        confirmText="Delete"
      />
    </AdminPageLayout>
  )
}

export default BackupManagementPage
