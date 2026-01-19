import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { Button, Table, Badge, Pagination, LoadingOverlay } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, AdminFilterBar, StatItem } from '@/components/admin'
import { getSensitiveDataRequests, getPendingRequestsCount } from '@/services/sensitiveDataRequestService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { formatDate } from '@/lib/utils'
import { ROUTES, SENSITIVE_DATA_CATEGORY, SENSITIVE_DATA_REQUEST_STATUS, SENSITIVE_DATA_URGENCY, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'
import type { SensitiveDataRequestWithRelations, SensitiveDataRequestStatus, SensitiveDataUrgency, SensitiveDataCategory } from '@/types'

const urgencyConfig: Record<SensitiveDataUrgency, { color: 'gray' | 'warning' | 'error' }> = {
  routine: { color: 'gray' },
  urgent: { color: 'warning' },
  emergency: { color: 'error' },
}

const statusConfig: Record<SensitiveDataRequestStatus, { variant: 'success' | 'error' | 'warning' | 'gray' | 'primary', icon: any }> = {
  pending: { variant: 'warning', icon: Clock },
  approved: { variant: 'success', icon: CheckCircle },
  denied: { variant: 'error', icon: XCircle },
  expired: { variant: 'gray', icon: Clock },
  revoked: { variant: 'error', icon: XCircle }
}

const categoryLabels: Record<SensitiveDataCategory, string> = {
  phi: 'Personal Health Info',
  financial: 'Financial',
  contact: 'Contact Info',
  all: 'All Data',
}

export const SensitiveDataRequestListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { error: showError } = useToastStore()

  const [requests, setRequests] = useState<SensitiveDataRequestWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Pending counts
  const [pendingCounts, setPendingCounts] = useState<{
    total: number
    routine: number
    urgent: number
    emergency: number
  }>({ total: 0, routine: 0, urgent: 0, emergency: 0 })

  const hospitalId = user?.hospital_id || ''

  const fetchRequests = useCallback(async () => {
    if (!hospitalId) return

    setIsLoading(true)
    try {
      const result = await getSensitiveDataRequests({
        page: currentPage,
        pageSize,
        hospitalId,
        status: statusFilter as SensitiveDataRequestStatus | 'all',
        urgency: urgencyFilter as SensitiveDataUrgency | 'all',
        category: categoryFilter as SensitiveDataCategory | 'all',
        search: search || undefined,
      })

      setRequests(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      showError('Error', 'Failed to load requests')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [hospitalId, currentPage, pageSize, statusFilter, urgencyFilter, categoryFilter, search, showError])

  const fetchPendingCounts = useCallback(async () => {
    if (!hospitalId) return

    try {
      const counts = await getPendingRequestsCount(hospitalId)
      setPendingCounts(counts)
    } catch (error) {
      console.error('Failed to fetch pending counts:', error)
    }
  }, [hospitalId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  useEffect(() => {
    fetchPendingCounts()
  }, [fetchPendingCounts])

  // Stats
  const stats: StatItem[] = useMemo(() => {
    return [
      {
        label: 'Pending Requests',
        value: pendingCounts.total,
        icon: Clock,
        color: 'amber',
        description: 'Awaiting review'
      },
      {
        label: 'Emergency',
        value: pendingCounts.emergency,
        icon: AlertTriangle,
        color: 'rose',
        description: 'Immediate action required'
      },
      {
        label: 'Urgent',
        value: pendingCounts.urgent,
        icon: TrendingUp,
        color: 'orange',
        description: 'High priority'
      },
      {
        label: 'Routine',
        value: pendingCounts.routine,
        icon: FileText,
        color: 'slate',
        description: 'Standard access'
      }
    ]
  }, [pendingCounts])

  const columns = [
    {
      key: 'urgency',
      label: 'Urgency',
      render: (_: unknown, row: SensitiveDataRequestWithRelations) => (
        <Badge variant={urgencyConfig[row.urgency].color} className="uppercase text-xs" size="sm">
          {row.urgency}
        </Badge>
      )
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (_: unknown, row: SensitiveDataRequestWithRelations) => (
        <div>
          <div className="font-medium text-slate-900">{row.patient_name}</div>
          <div className="text-xs text-slate-500 font-mono">IC: {row.patient_ic}</div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Data Type',
      render: (_: unknown, row: SensitiveDataRequestWithRelations) => (
        <span className="text-sm text-slate-600">
          {categoryLabels[row.data_category]}
        </span>
      )
    },
    {
      key: 'requestor',
      label: 'Requester',
      render: (_: unknown, row: SensitiveDataRequestWithRelations) => (
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-700">{row.requestor?.full_name || 'Unknown'}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: SensitiveDataRequestWithRelations) => {
        const config = statusConfig[row.status]
        const Icon = config.icon
        return (
          <Badge variant={config.variant}>
            <Icon className="w-3 h-3 mr-1" />
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </Badge>
        )
      }
    },
    {
      key: 'date',
      label: 'Date',
      render: (_: unknown, row: SensitiveDataRequestWithRelations) => (
        <div className="text-sm text-slate-600">
          {formatDate(row.created_at)}
        </div>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: SensitiveDataRequestWithRelations) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`${ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS}/${row.id}`)
          }}
          className="text-indigo-600 hover:bg-indigo-50"
          leftIcon={<Eye className="w-4 h-4" />}
        >
          Review
        </Button>
      ),
      className: 'w-24'
    }
  ]

  const headerActions = (
    <Button
      variant="outline"
      onClick={fetchRequests}
      disabled={isLoading}
      leftIcon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
    >
      Refresh
    </Button>
  )

  return (
    <AdminPageLayout
      title="Sensitive Data Requests"
      description="Review and approve access requests for protected patient information (PHI)"
      icon={Shield}
      breadcrumbs={[{ label: 'Access Requests' }]}
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
          searchPlaceholder="Search by patient, IC, or requester..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'denied', label: 'Denied' },
                { value: 'expired', label: 'Expired' },
                { value: 'revoked', label: 'Revoked' }
              ]
            },
            {
              key: 'urgency',
              label: 'Urgency',
              value: urgencyFilter,
              onChange: setUrgencyFilter,
              options: Object.entries(SENSITIVE_DATA_URGENCY).map(([key, value]) => ({
                value,
                label: key.charAt(0).toUpperCase() + key.slice(1)
              }))
            },
            {
              key: 'category',
              label: 'Category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: Object.entries(SENSITIVE_DATA_CATEGORY).map(([key, value]) => ({
                value,
                label: categoryLabels[value as SensitiveDataCategory]
              }))
            }
          ]}
          onReset={() => {
            setSearch('')
            setStatusFilter('all')
            setUrgencyFilter('all')
            setCategoryFilter('all')
            setCurrentPage(1)
          }}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">Request List</h3>
            <span className="text-xs text-slate-500">
              Showing {requests.length} of {total} requests
            </span>
          </div>

          <div className="relative">
            {isLoading && <LoadingOverlay message="Loading requests..." />}
            <Table
              data={requests}
              columns={columns}
              isLoading={isLoading}
              onRowClick={(row) => navigate(`${ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS}/${row.id}`)}
              emptyMessage="No sensitive data requests found."
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
    </AdminPageLayout>
  )
}

export default SensitiveDataRequestListPage
