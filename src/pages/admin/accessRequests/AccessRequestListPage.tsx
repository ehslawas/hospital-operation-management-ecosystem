import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  TrendingUp,
  FileText,
  Users,
  AlertCircle,
  Mail,
  Building2,
  Briefcase,
} from 'lucide-react'
import { Button, Table, Pagination, Input, Select, Badge, Avatar, LoadingOverlay } from '@/components/ui'
import { getAccessRequests } from '@/services/accessRequestManagementService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES, ACCESS_REQUEST_STATUS, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SYSTEM_ROLES } from '@/lib/constants'
import { formatDate, cn } from '@/lib/utils'
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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>({ key: 'created_at', direction: 'desc' })

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      // For Hospital Admin, always filter by their hospital_id
      const result = await getAccessRequests({
        page: currentPage,
        pageSize,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
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
  }, [currentPage, pageSize, search, statusFilter, sortConfig, isHospitalAdmin, userHospitalId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Calculate statistics from current page (for display)
  // Note: For accurate stats, you'd need to fetch counts separately
  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === ACCESS_REQUEST_STATUS.PENDING).length
    const approved = requests.filter((r) => r.status === ACCESS_REQUEST_STATUS.APPROVED).length
    const rejected = requests.filter((r) => r.status === ACCESS_REQUEST_STATUS.REJECTED).length
    return { pending, approved, rejected, total }
  }, [requests, total])

  const columns = [
    {
      key: 'profile_photo_url',
      label: '',
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.profile_photo_url}
            alt={row.full_name}
            fallback={row.full_name.charAt(0)}
            size="md"
            className="ring-2 ring-slate-200"
          />
        </div>
      ),
      className: 'w-20',
    },
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">{row.full_name}</div>
          <div className="text-sm text-slate-500 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {row.email}
          </div>
        </div>
      ),
    },
    {
      key: 'hospital',
      label: 'Hospital',
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{row.hospital?.hospital_name || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{row.department?.department_name || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'jawatan',
      label: 'Position',
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <span className="text-sm font-medium text-slate-700">{row.jawatan || 'N/A'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: unknown, row: AccessRequestWithRelations) => {
        const statusColors = {
          pending: 'warning',
          approved: 'success',
          rejected: 'error',
        } as const

        const statusIcons = {
          pending: Clock,
          approved: CheckCircle,
          rejected: XCircle,
        } as const

        const Icon = statusIcons[row.status] || Clock

        return (
          <Badge variant={statusColors[row.status] || 'gray'}>
            <div className="flex items-center gap-1.5">
              <Icon className="w-3 h-3" />
              <span>{row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span>
            </div>
          </Badge>
        )
      },
    },
    {
      key: 'created_at',
      label: 'Requested',
      sortable: true,
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <span className="text-sm text-slate-500">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: 'reviewed_at',
      label: 'Reviewed',
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <span className="text-sm text-slate-500">
          {row.reviewed_at ? formatDate(row.reviewed_at) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: AccessRequestWithRelations) => (
        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`${ROUTES.ADMIN_ACCESS_REQUESTS}/${row.id}`)
          }}
          leftIcon={<Eye className="w-4 h-4" />}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          View Details
        </Button>
      ),
      className: 'w-32',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 shadow-xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Access Request Management</h1>
                <p className="text-primary-100 text-sm">Review and manage user access requests to the system</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={fetchRequests}
              disabled={isLoading}
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              leftIcon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
            >
              Refresh
            </Button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
            <p className="text-sm font-medium text-slate-600">Pending Requests</p>
            <p className="text-xs text-slate-500">Awaiting review</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{stats.approved}</p>
            <p className="text-sm font-medium text-slate-600">Approved</p>
            <p className="text-xs text-slate-500">Access granted</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-error-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-error-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{stats.rejected}</p>
            <p className="text-sm font-medium text-slate-600">Rejected</p>
            <p className="text-xs text-slate-500">Access denied</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{total}</p>
            <p className="text-sm font-medium text-slate-600">Total Requests</p>
            <p className="text-xs text-slate-500">All time</p>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by name, email, IC number, or position..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-12 h-11 border-slate-300 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-48 h-11 border-slate-300 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value={ACCESS_REQUEST_STATUS.PENDING}>Pending</option>
              <option value={ACCESS_REQUEST_STATUS.APPROVED}>Approved</option>
              <option value={ACCESS_REQUEST_STATUS.REJECTED}>Rejected</option>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Access Requests
            </h2>
            <Badge variant="gray" size="sm">
              {total} {total === 1 ? 'request' : 'requests'}
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table
            data={requests}
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
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-slate-600 font-medium">No access requests found</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
              </div>
            }
            onRowClick={(row) => navigate(`${ROUTES.ADMIN_ACCESS_REQUESTS}/${row.id}`)}
          />
        </div>
        <div className="border-t border-slate-200 bg-slate-50/50">
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
      </motion.div>

      {isLoading && <LoadingOverlay message="Loading access requests..." />}
    </div>
  )
}

export default AccessRequestListPage

