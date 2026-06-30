// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plus, RefreshCw, Edit, Trash2, Building2, User, Settings, AlertCircle, Filter, CheckCircle, XCircle } from 'lucide-react'
import { Button, Table, Pagination, Input, Select, Badge, LoadingOverlay, Modal, StatCard } from '@/components/ui'
import { getHospitals, deleteHospital } from '@/services/hospitalService'
import { getHospitalsWithAdmin } from '@/services/systemAdminService'
import { useToastStore } from '@/stores/toastStore'
import { ROUTES, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Hospital, HospitalWithAdmin, SortConfig } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { supabase, isSupabaseConfigured } from '@/services/supabase'

export const HospitalListPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  // Detect if we're on clinics route
  const isClinicRoute = location.pathname.includes('/clinics')
  const facilityType = isClinicRoute ? 'clinic' : 'hospital'
  const facilityTypePlural = isClinicRoute ? 'clinics' : 'hospitals'
  const facilityTypeCapital = isClinicRoute ? 'Clinic' : 'Hospital'
  const facilityTypePluralCapital = isClinicRoute ? 'Clinics' : 'Hospitals'
  const baseRoute = isClinicRoute ? ROUTES.ADMIN_CLINICS : ROUTES.ADMIN_HOSPITALS
  const { error: showError, success: showSuccess } = useToastStore()
  const { user } = useAuthStore()
  const isSystemAdmin = user?.role?.role_code === 'system_admin'
  const [hospitals, setHospitals] = useState<HospitalWithAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>({ key: 'hospital_name', direction: 'asc' })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [hospitalToDelete, setHospitalToDelete] = useState<HospitalWithAdmin | null>(null)
  
  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pendingSetup: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const fetchHospitals = useCallback(async () => {
    setIsLoading(true)
    try {
      let result
      if (isSystemAdmin) {
        // Use enhanced function for System Admin
        result = await getHospitalsWithAdmin(currentPage, pageSize, search || undefined)
      } else {
        // Use regular function for Hospital Admin
        result = await getHospitals({
          page: currentPage,
          pageSize,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sort: sortConfig,
        })
      }

      setHospitals(result.data as HospitalWithAdmin[])
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      showError('Error', `Failed to load ${facilityTypePlural}. Please try again.`)
      console.error(`Failed to fetch ${facilityTypePlural}:`, error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, search, statusFilter, sortConfig, isSystemAdmin])

  const fetchStatistics = useCallback(async () => {
    if (!isSystemAdmin) {
      setIsLoadingStats(false)
      return
    }
    
    setIsLoadingStats(true)
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('hospitals')
          .select('id, status, admin_id')
        
        if (error) throw error
        
        const total = data?.length || 0
        const active = data?.filter((h) => h.status === 'active').length || 0
        const inactive = data?.filter((h) => h.status === 'inactive').length || 0
        const pendingSetup = data?.filter((h) => h.status === 'active' && !h.admin_id).length || 0
        
        setStats({ total, active, inactive, pendingSetup })
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }, [isSystemAdmin])

  useEffect(() => {
    fetchHospitals()
    fetchStatistics()
  }, [fetchHospitals, fetchStatistics])

  const handleDelete = async () => {
    if (!hospitalToDelete) return

    try {
      await deleteHospital(hospitalToDelete.id)
      showSuccess('Success', 'Hospital deleted successfully')
      setShowDeleteModal(false)
      setHospitalToDelete(null)
      fetchHospitals()
    } catch (error) {
      showError('Error', 'Failed to delete hospital')
      console.error('Failed to delete hospital:', error)
    }
  }

  const columns = [
    {
      key: 'hospital_code',
      label: 'Code',
      sortable: true,
      render: (_: unknown, row: HospitalWithAdmin) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          <span className="font-mono font-semibold text-slate-900">{row.hospital_code}</span>
        </div>
      ),
    },
    {
      key: 'hospital_name',
      label: 'Hospital Name',
      sortable: true,
      render: (_: unknown, row: HospitalWithAdmin) => (
        <div>
          <div className="font-medium text-slate-900">{row.hospital_name}</div>
          {row.address && <div className="text-sm text-slate-500">{row.address}</div>}
        </div>
      ),
    },
    {
      key: 'state',
      label: 'State',
      render: (_: unknown, row: HospitalWithAdmin) => (
        <span className="text-sm text-slate-700">{row.state || 'N/A'}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (_: unknown, row: HospitalWithAdmin) => (
        <span className="text-sm text-slate-700">{row.phone || 'N/A'}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (_: unknown, row: HospitalWithAdmin) => (
        <span className="text-sm text-slate-700">{row.email || 'N/A'}</span>
      ),
    },
    {
      key: 'admin',
      label: 'Admin',
      render: (_: unknown, row: HospitalWithAdmin) => {
        if (!isSystemAdmin) return <span className="text-sm text-slate-500">-</span>
        if (!row.admin) {
          return (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning-500" />
              <span className="text-sm text-warning-600">No Admin</span>
            </div>
          )
        }
        return (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-success-500" />
            <span className="text-sm text-slate-700">{row.admin.full_name}</span>
          </div>
        )
      },
    },
    ...(isSystemAdmin
      ? [
          {
            key: 'modules',
            label: 'Modules',
            render: (_: unknown, row: HospitalWithAdmin) => (
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">
                  {row.enabled_modules_count || 0} / {row.modules?.length || 0}
                </span>
              </div>
            ),
          },
          {
            key: 'users',
            label: 'Users',
            render: (_: unknown, row: HospitalWithAdmin) => (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">
                  {row.active_user_count || 0} / {row.user_count || 0}
                </span>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: unknown, row: Hospital) => {
        const variant = row.status === 'active' ? 'success' : 'gray'
        return (
          <Badge variant={variant} className="capitalize">
            {row.status}
          </Badge>
        )
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (_: unknown, row: HospitalWithAdmin) => (
        <span className="text-sm text-slate-500">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: HospitalWithAdmin) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${baseRoute}/${row.id}`)
            }}
            className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setHospitalToDelete(row)
              setShowDeleteModal(true)
            }}
            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'w-24',
    },
  ]

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="flex-1 overflow-auto">
        <div className="w-full px-6 lg:px-10 py-8">
          {/* Modern Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-1.5">
                    {facilityTypePluralCapital} Management
                  </h1>
                  <p className="text-slate-600 text-base">
                    Manage and monitor all {facilityTypePlural} in the system
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => navigate(`${baseRoute}/new`)}
                leftIcon={<Plus className="w-5 h-5" />}
                className="shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all"
              >
                Add New {facilityTypeCapital}
              </Button>
            </div>

            {/* Statistics Cards */}
            {isSystemAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6"
              >
                <StatCard
                  title={`Total ${facilityTypePluralCapital}`}
                  value={stats.total}
                  icon={Building2}
                  color="primary"
                  subtitle={`${stats.active} active`}
                />
                <StatCard
                  title={`Active ${facilityTypePluralCapital}`}
                  value={stats.active}
                  icon={CheckCircle}
                  color="success"
                  subtitle={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
                />
                <StatCard
                  title={`Inactive ${facilityTypePluralCapital}`}
                  value={stats.inactive}
                  icon={XCircle}
                  color="warning"
                  subtitle="Requires attention"
                />
                <StatCard
                  title="Pending Setup"
                  value={stats.pendingSetup}
                  icon={AlertCircle}
                  color="error"
                  subtitle="Needs admin assignment"
                />
              </motion.div>
            )}

            {/* Enhanced Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder={`Search ${facilityTypePlural} by name, code, city, or address...`}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-12 h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-40 pl-10 h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 appearance-none"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      fetchHospitals()
                      fetchStatistics()
                    }}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    className="h-11 border-slate-200 hover:bg-slate-50"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Enhanced Table Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <Table
              data={hospitals}
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
              emptyMessage={`No ${facilityTypePlural} found`}
              onRowClick={(row) => navigate(`${baseRoute}/${row.id}`)}
            />
            <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4">
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
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setHospitalToDelete(null)
        }}
        title="Delete Hospital"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Are you sure you want to delete <strong>{hospitalToDelete?.hospital_name}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setHospitalToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete {facilityTypeCapital}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default HospitalListPage

