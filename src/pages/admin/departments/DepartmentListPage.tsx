import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plus, RefreshCw, Edit, Trash2, Building2, TrendingUp, FileText, AlertCircle, Filter, CheckCircle } from 'lucide-react'
import { Button, Table, Pagination, Input, Select, Badge, LoadingOverlay, Modal } from '@/components/ui'
import { getDepartments, deleteDepartment } from '@/services/departmentService'
import { getAllHospitals } from '@/services/hospitalService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SYSTEM_ROLES } from '@/lib/constants'
import { formatDate, cn } from '@/lib/utils'
import type { DepartmentWithRelations, SortConfig, Hospital } from '@/types'

export const DepartmentListPage: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError, success: showSuccess } = useToastStore()
  const { user } = useAuthStore()
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const userHospitalId = user?.hospital_id

  const [departments, setDepartments] = useState<DepartmentWithRelations[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [hospitalFilter, setHospitalFilter] = useState<string>('all')
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>({ key: 'department_name', direction: 'asc' })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentWithRelations | null>(null)

  useEffect(() => {
    if (!isHospitalAdmin) {
      fetchHospitals()
    }
  }, [isHospitalAdmin])

  const fetchHospitals = async () => {
    try {
      const data = await getAllHospitals()
      setHospitals(data)
    } catch (error) {
      console.error('Error fetching hospitals:', error)
    }
  }

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true)
    try {
      // For Hospital Admin, always filter by their hospital_id
      const effectiveHospitalId = isHospitalAdmin && userHospitalId 
        ? userHospitalId 
        : hospitalFilter !== 'all' 
          ? hospitalFilter 
          : undefined

      const result = await getDepartments({
        page: currentPage,
        pageSize,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        hospitalId: effectiveHospitalId,
        sort: sortConfig,
      })

      setDepartments(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      showError('Error', 'Failed to load departments. Please try again.')
      console.error('Failed to fetch departments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, search, statusFilter, hospitalFilter, sortConfig, isHospitalAdmin, userHospitalId])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  // Calculate statistics
  const stats = useMemo(() => {
    const active = departments.filter((d) => d.status === 'active').length
    const inactive = departments.filter((d) => d.status === 'inactive').length
    return { active, inactive, total }
  }, [departments, total])

  const handleDelete = async () => {
    if (!departmentToDelete) return

    try {
      await deleteDepartment(departmentToDelete.id)
      showSuccess('Success', 'Department deleted successfully')
      setShowDeleteModal(false)
      setDepartmentToDelete(null)
      fetchDepartments()
    } catch (error) {
      showError('Error', 'Failed to delete department')
      console.error('Failed to delete department:', error)
    }
  }

  const columns = [
    {
      key: 'department_code',
      label: 'Code',
      sortable: true,
      render: (_: unknown, row: DepartmentWithRelations) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          <span className="font-mono font-semibold text-slate-900">{row.department_code}</span>
        </div>
      ),
    },
    {
      key: 'department_name',
      label: 'Department Name',
      sortable: true,
      render: (_: unknown, row: DepartmentWithRelations) => (
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">{row.department_name}</div>
          {row.description && <div className="text-sm text-slate-500">{row.description}</div>}
        </div>
      ),
    },
    {
      key: 'hospital',
      label: 'Hospital',
      render: (_: unknown, row: DepartmentWithRelations) => (
        <span className="text-sm font-medium text-slate-700">{row.hospital?.hospital_name || 'N/A'}</span>
      ),
    },
    {
      key: 'head_of_department',
      label: 'Head of Department',
      render: (_: unknown, row: DepartmentWithRelations) => (
        <span className="text-sm text-slate-700">
          {row.head_of_department?.full_name || 'Not assigned'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: unknown, row: DepartmentWithRelations) => {
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
      render: (_: unknown, row: DepartmentWithRelations) => (
        <span className="text-sm text-slate-500">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: DepartmentWithRelations) => (
        <div className="flex items-center gap-2">
          {!isHospitalAdmin ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`${ROUTES.ADMIN_DEPARTMENTS}/${row.id}`)
                }}
                leftIcon={<Edit className="w-4 h-4" />}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                Edit
              </Button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDepartmentToDelete(row)
                  setShowDeleteModal(true)
                }}
                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`${ROUTES.ADMIN_DEPARTMENTS}/${row.id}`)
              }}
              className="text-slate-600 border-slate-200"
            >
              View Details
            </Button>
          )}
        </div>
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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 p-8 shadow-xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Department Management</h1>
                <p className="text-emerald-100 text-sm">Manage departments and organizational structure</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchDepartments}
                disabled={isLoading}
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                leftIcon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
              >
                Refresh
              </Button>
              {!isHospitalAdmin && (
                <Button
                  variant="primary"
                  onClick={() => navigate(`${ROUTES.ADMIN_DEPARTMENTS}/new`)}
                  className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg"
                  leftIcon={<Plus className="w-5 h-5" />}
                >
                  Add Department
                </Button>
              )}
            </div>
          </div>
          {isHospitalAdmin && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
              <p className="text-emerald-50 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Departments are managed by the System Administrator based on enabled hospital modules.
              </p>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{stats.active}</p>
            <p className="text-sm font-medium text-slate-600">Active Departments</p>
            <p className="text-xs text-slate-500">Currently operational</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{stats.inactive}</p>
            <p className="text-sm font-medium text-slate-600">Inactive</p>
            <p className="text-xs text-slate-500">Not operational</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{total}</p>
            <p className="text-sm font-medium text-slate-600">Total Departments</p>
            <p className="text-xs text-slate-500">All departments</p>
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
              placeholder="Search by name, code, or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-12 h-11 border-slate-300 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          {!isHospitalAdmin && (
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <Select
                value={hospitalFilter}
                onChange={(e) => {
                  setHospitalFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-48 h-11 border-slate-300 focus:border-primary-500"
              >
                <option value="all">All Hospitals</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hospital_name}
                  </option>
                ))}
              </Select>
            </div>
          )}
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
              <Building2 className="w-5 h-5 text-primary-600" />
              Departments
            </h2>
            <Badge variant="gray" size="sm">
              {total} {total === 1 ? 'department' : 'departments'}
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table
            data={departments}
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
                <p className="text-slate-600 font-medium">No departments found</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
              </div>
            }
            onRowClick={(row) => navigate(`${ROUTES.ADMIN_DEPARTMENTS}/${row.id}`)}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDepartmentToDelete(null)
        }}
        title="Delete Department"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Are you sure you want to delete <strong>{departmentToDelete?.department_name}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setDepartmentToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Department
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DepartmentListPage


