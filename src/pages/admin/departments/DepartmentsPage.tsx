import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Building2,
  RefreshCw,
  FolderOpen,
  LayoutGrid,
  CheckCircle,
  Users,
} from 'lucide-react'
import { Button, Table, Badge, LoadingOverlay, ConfirmationDialog, Pagination } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, AdminFilterBar, StatItem } from '@/components/admin'
import { cn } from '@/lib/utils'
import { getAllDepartments, deleteDepartment } from '@/services/departmentService'
import { getAllHospitals } from '@/services/hospitalService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE, SYSTEM_ROLES } from '@/lib/constants'
import type { Department, DepartmentWithRelations, Hospital, SortConfig } from '@/types'

const DepartmentsPage: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError, success: showSuccess } = useToastStore()
  const { user } = useAuthStore()
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const isSystemAdmin = user?.role?.role_code === SYSTEM_ROLES.SYSTEM_ADMIN
  const canModify = isSystemAdmin || isHospitalAdmin
  const userHospitalId = user?.hospital_id

  // State
  const [departments, setDepartments] = useState<DepartmentWithRelations[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [hospitalFilter, setHospitalFilter] = useState<string>('all')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'department_name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // Confirmation State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => Promise<void>
    variant: 'danger' | 'warning' | 'info' | 'success'
    confirmText?: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => { },
    variant: 'danger'
  })

  const [isActionLoading, setIsActionLoading] = useState(false)

  // Fetch Data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [deptsData, hospitalsData] = await Promise.all([
        getAllDepartments(isHospitalAdmin && userHospitalId ? userHospitalId : undefined),
        !isHospitalAdmin ? getAllHospitals() : Promise.resolve([])
      ])

      setDepartments(deptsData)
      if (!isHospitalAdmin) {
        setHospitals(hospitalsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      showError('Error', 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [isHospitalAdmin, userHospitalId, showError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Statistics
  const stats: StatItem[] = useMemo(() => {
    const total = departments.length
    const active = departments.filter(d => d.status === 'active').length
    // Sum staff counts
    const totalStaff = departments.reduce((acc, curr) => acc + (curr.staff_count || 0), 0)

    return [
      {
        label: 'Total Departments',
        value: total,
        icon: Building,
        color: 'blue'
      },
      {
        label: 'Active Units',
        value: active,
        icon: CheckCircle,
        color: 'emerald',
        description: 'Operational departments'
      },
      {
        label: 'Staff Assigned',
        value: totalStaff,
        icon: Users,
        color: 'indigo',
        description: 'Total headcount'
      },
      {
        label: 'Standard Code',
        value: 'Standard',
        icon: LayoutGrid,
        color: 'slate',
        description: 'Department coding'
      }
    ]
  }, [departments])

  // Filtering and Sorting
  const filteredDepartments = useMemo(() => {
    let result = [...departments]

    // Hospital Filter
    if (hospitalFilter !== 'all') {
      result = result.filter(d => d.hospital_id === hospitalFilter)
    }

    // Search
    if (search) {
      const query = search.toLowerCase()
      result = result.filter(
        d =>
          d.department_name.toLowerCase().includes(query) ||
          d.department_code.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query) ||
          d.hospital?.hospital_name.toLowerCase().includes(query)
      )
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof DepartmentWithRelations]
        let bValue: any = b[sortConfig.key as keyof DepartmentWithRelations]

        // Handle nested hospital name
        if (sortConfig.key === 'hospital') {
          aValue = a.hospital?.hospital_name || ''
          bValue = b.hospital?.hospital_name || ''
        }

        // Handle staff count
        if (sortConfig.key === 'staff_count') {
          aValue = a.staff_count || 0
          bValue = b.staff_count || 0
        }

        if (aValue === bValue) return 0
        const comparison = aValue > bValue ? 1 : -1
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [departments, search, hospitalFilter, sortConfig])

  // Pagination
  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDepartments.slice(start, start + pageSize)
  }, [filteredDepartments, currentPage, pageSize])

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleDelete = async (dept: Department) => {
    setIsActionLoading(true)
    try {
      await deleteDepartment(dept.id)
      showSuccess('Success', 'Department deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting department:', error)
      showError('Error', 'Failed to delete department')
    } finally {
      setIsActionLoading(false)
      setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    }
  }

  const confirmDelete = (dept: Department) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Department?',
      message: `Are you sure you want to delete ${dept.department_name}? Users assigned to this department may lose access.`,
      variant: 'danger',
      confirmText: 'Delete Department',
      onConfirm: () => handleDelete(dept)
    })
  }

  const columns = [
    {
      key: 'department_name',
      label: 'Department',
      sortable: true,
      render: (_: unknown, row: DepartmentWithRelations) => (
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-royal-blue/5 rounded-xl text-royal-blue group-hover:bg-royal-blue group-hover:text-white transition-all duration-300">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 group-hover:text-royal-blue transition-colors">{row.department_name}</div>
            <div className="text-xs text-slate-500 font-mono mt-0.5 uppercase tracking-wider">{row.department_code}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'hospital',
      label: 'Hospital',
      sortable: true,
      render: (_: unknown, row: DepartmentWithRelations) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="truncate max-w-[200px]" title={row.hospital?.hospital_name}>
              {row.hospital?.hospital_name || 'N/A'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Organizational Unit</div>
        </div>
      ),
    },
    {
      key: 'staff_count',
      label: 'Staff',
      sortable: true,
      render: (_: unknown, row: DepartmentWithRelations) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-md text-slate-600">
            <Users className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-medium text-slate-700">{row.staff_count || 0}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: unknown, row: DepartmentWithRelations) => (
        <Badge
          variant={row.status === 'active' ? 'success' : 'gray'}
          className="px-3 py-1 rounded-full shadow-sm"
        >
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: DepartmentWithRelations) => (
        <div className="flex items-center justify-end gap-2">
          {canModify && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`${ROUTES.ADMIN_DEPARTMENTS}/${row.id}`)
              }}
              className="h-9 w-9 p-0 text-slate-400 hover:text-royal-blue hover:bg-royal-blue/10 rounded-xl transition-all"
              title="Edit Department"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {isSystemAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                confirmDelete(row)
              }}
              className="h-9 w-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Delete Department"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      className: 'w-24',
    },
  ]

  const headerActions = (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        onClick={fetchData}
        disabled={isLoading}
        className="text-slate-500 hover:text-royal-blue hover:bg-royal-blue/5 rounded-xl transition-all"
        leftIcon={<RefreshCw className={cn('w-4 h-4', isLoading ? 'animate-spin' : '')} />}
      >
        Refresh
      </Button>
      {isSystemAdmin && (
        <Button
          variant="primary"
          onClick={() => navigate(`${ROUTES.ADMIN_DEPARTMENTS}/new`)}
          leftIcon={<Plus className="w-5 h-5" />}
          className="bg-royal-blue hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl px-5 py-2.5"
        >
          Add Department
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
      {/* Ambient Background Shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <AdminPageLayout
        title="Department Management"
        description="Monitor and manage organizational units across all hospital divisions."
        icon={Building}
        breadcrumbs={[{ label: 'Departments' }]}
        actions={headerActions}
      >
        <div className="space-y-8">
          {/* Stats Section with Glass Effect */}
          <div className="glass-card rounded-2xl p-1 bg-white/40 backdrop-blur-sm border border-white/60">
            <AdminStatsGrid stats={stats} isLoading={isLoading} />
          </div>

          <div className="glass-card rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-xl shadow-blue-900/5 overflow-hidden">
            {/* Filter Bar */}
            <div className="p-6 border-b border-slate-100/80 bg-slate-50/40">
              <AdminFilterBar
                searchValue={search}
                onSearchChange={(val) => {
                  setSearch(val)
                  setCurrentPage(1)
                }}
                searchPlaceholder="Search departments by name or code..."
                filters={!isHospitalAdmin ? [
                  {
                    key: 'hospital',
                    label: 'Filter by Hospital',
                    value: hospitalFilter,
                    onChange: setHospitalFilter,
                    options: hospitals.map(h => ({ value: h.id, label: h.hospital_name }))
                  }
                ] : []}
                onReset={() => {
                  setSearch('')
                  setHospitalFilter('all')
                  setCurrentPage(1)
                }}
              />
            </div>

            {/* Table Section */}
            <div className="relative">
              {isActionLoading && <LoadingOverlay message="Processing..." />}
              <Table
                data={paginatedDepartments}
                columns={columns}
                sortConfig={sortConfig}
                onSort={handleSort}
                isLoading={isLoading}
                onRowClick={(row) => navigate(`${ROUTES.ADMIN_DEPARTMENTS}/${row.id}`)}
                emptyMessage="No departments matching your criteria were found."
                className="group"
              />
            </div>

            {/* Pagination with Glass Footer */}
            <div className="border-t border-slate-100 bg-slate-50/50 p-6 backdrop-blur-sm">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredDepartments.length / pageSize)}
                pageSize={pageSize}
                total={filteredDepartments.length}
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

        <ConfirmationDialog
          isOpen={confirmConfig.isOpen}
          onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          variant={confirmConfig.variant}
          confirmText={confirmConfig.confirmText}
          isLoading={isActionLoading}
        />
      </AdminPageLayout>
    </div>
  )
}

export default DepartmentsPage
