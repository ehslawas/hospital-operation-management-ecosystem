import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserCheck,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  Building2,
  Briefcase,
  Mail
} from 'lucide-react'
import { Button, Table, Badge, LoadingOverlay, Pagination, Avatar } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, AdminFilterBar, StatItem } from '@/components/admin'
import { getAccessRequests } from '@/services/accessRequestManagementService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES, ACCESS_REQUEST_STATUS, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SYSTEM_ROLES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { AccessRequestWithRelations, SortConfig } from '@/types'

export const AccessRequestListPage: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError } = useToastStore()
  const { user } = useAuthStore()
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const userHospitalId = user?.hospital_id

  const [requests, setRequests] = useState<AccessRequestWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending')
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>({ key: 'created_at', direction: 'desc' })

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAccessRequests({
        page: currentPage,
        pageSize,
        search: search || undefined,
        status: activeTab === 'pending' ? ACCESS_REQUEST_STATUS.PENDING : ACCESS_REQUEST_STATUS.APPROVED,
        hospitalId: isHospitalAdmin && userHospitalId ? userHospitalId : undefined,
        sort: sortConfig,
      })

      setRequests(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      showError('Error', 'Failed to load access requests. Please try again.')
      console.error('Error fetching access requests:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, search, activeTab, sortConfig, isHospitalAdmin, userHospitalId, showError])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Statistics
  const stats: StatItem[] = useMemo(() => {
    return [
      {
        label: 'Pending Requests',
        value: activeTab === 'pending' ? total : 0, // Simplified for now since API pagination prevents correct "total" counts for other statuses without separate API calls
        icon: Clock,
        color: 'amber',
        description: 'Requires response'
      },
      {
        label: 'Total Approved',
        value: activeTab === 'approved' ? total : 0,
        icon: CheckCircle,
        color: 'emerald',
        description: 'Access granted'
      }
    ]
  }, [requests, total, activeTab])

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : undefined
      }
      return { key, direction: 'asc' }
    })
  }

  const columns = [
    {
      key: 'profile_photo_url',
      label: '',
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <Avatar
          src={row.profile_photo_url}
          name={row.full_name}
          size="md"
          className="ring-2 ring-white shadow-sm"
        />
      ),
      className: 'w-16',
    },
    {
      key: 'full_name',
      label: 'Applicant',
      sortable: true,
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-900">{row.full_name}</div>
          <div className="text-sm text-slate-500 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {row.email}
          </div>
        </div>
      ),
    },
    {
      key: 'hospital',
      label: 'Organization',
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            {row.hospital?.hospital_name || 'N/A'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Briefcase className="w-3 h-3 text-slate-400" />
            {row.department?.department_name || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'jawatan',
      label: 'Position',
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <Badge variant="gray" className="font-medium">
          {row.jawatan || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: unknown, row: AccessRequestWithRelations) => {
        const variants: Record<string, 'success' | 'error' | 'warning' | 'gray'> = {
          approved: 'success',
          rejected: 'error',
          pending: 'warning'
        }
        return (
          <Badge variant={variants[row.status] || 'gray'}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </Badge>
        )
      },
    },
    {
      key: 'created_at',
      label: 'Requested',
      sortable: true,
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <div className="text-sm text-slate-500">
          {formatDate(row.created_at)}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${ROUTES.ADMIN_ACCESS_REQUESTS}/${row.id}`)
            }}
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            leftIcon={<Eye className="w-4 h-4" />}
          >
            Review
          </Button>
        </div>
      ),
      className: 'w-24',
    },
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
      title="Access Requests"
      description="Review and manage user account requests and permissions"
      icon={UserCheck}
      breadcrumbs={[{ label: 'Access Requests' }]}
      actions={headerActions}
    >
      <div className="space-y-6">
        <AdminStatsGrid stats={stats} isLoading={isLoading} />

        {/* Custom Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          <button
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
            className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                    ${activeTab === 'pending'
                ? 'bg-white text-royal-blue shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                `}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'pending' ? 'bg-amber-500' : 'bg-slate-300'}`} />
            Pending Approval
          </button>
          <button
            onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
            className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                    ${activeTab === 'approved'
                ? 'bg-white text-royal-blue shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                `}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'approved' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            Approved Users
          </button>
        </div>

        <AdminFilterBar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val)
            setCurrentPage(1)
          }}
          searchPlaceholder="Search by name, email, or position..."
          // Removed status filter since we have tabs now
          filters={[]}
          onReset={() => {
            setSearch('')
            setCurrentPage(1)
          }}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">
              {activeTab === 'pending' ? 'Pending Requests' : 'Approved Users'}
            </h3>
            <span className="text-xs text-slate-500">
              Showing {requests.length} of {total} records
            </span>
          </div>

          <div className="relative">
            {isLoading && <LoadingOverlay message="Loading requests..." />}
            <Table
              data={requests}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => handleSort(key)}
              isLoading={isLoading}
              onRowClick={(row) => navigate(`${ROUTES.ADMIN_ACCESS_REQUESTS}/${row.id}`)}
              emptyMessage={activeTab === 'pending' ? "No pending requests found." : "No approved users found."}
            />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/30 p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          </div>
        </div>
      </div>
    </AdminPageLayout>
  )
}

export default AccessRequestListPage
