import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  AlertCircle,
  Clock,
  Edit,
  Trash2,
  Mail,
  Briefcase,
  Building2,
  RefreshCw,
  FileText
} from 'lucide-react'
import { Button, Table, Pagination, Badge, Avatar, LoadingOverlay, ConfirmationDialog } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, AdminFilterBar, StatItem } from '@/components/admin'
import { getUsers, bulkUpdateUserStatus, bulkDeleteUsers } from '@/services/userService'
import { getAllRoles } from '@/services/roleService'
import { getDepartmentsByHospital } from '@/services/departmentService'
import { getAllHospitals } from '@/services/hospitalService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES, USER_STATUS, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SYSTEM_ROLES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { UserWithRelations, SortConfig, Role, Department, Hospital, UserStatus } from '@/types'

export const UserListPage: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError, success: showSuccess, warning: showWarning } = useToastStore()
  const { user } = useAuthStore()
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const userHospitalId = user?.hospital_id

  // State
  const [users, setUsers] = useState<UserWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [hospitalFilter, setHospitalFilter] = useState<string>('all')
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>()
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)

  // Filter options
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])

  // Confirmation Dialog State
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

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [rolesData, hospitalsData] = await Promise.all([
          getAllRoles(),
          !isHospitalAdmin ? getAllHospitals() : Promise.resolve([]),
        ])
        setRoles(rolesData)
        if (!isHospitalAdmin) {
          setHospitals(hospitalsData)
        }
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }
    fetchFilterOptions()
  }, [isHospitalAdmin])

  // Fetch departments when hospital filter changes
  useEffect(() => {
    const fetchDepartmentsForHospital = async () => {
      const effectiveHospitalId = isHospitalAdmin && userHospitalId
        ? userHospitalId
        : hospitalFilter !== 'all'
          ? hospitalFilter
          : null

      if (effectiveHospitalId) {
        try {
          const depts = await getDepartmentsByHospital(effectiveHospitalId)
          setDepartments(depts)
        } catch (error) {
          console.error('Error fetching departments:', error)
          setDepartments([])
        }
      } else if (!isHospitalAdmin) {
        setDepartments([])
      }
    }
    fetchDepartmentsForHospital()
  }, [hospitalFilter, isHospitalAdmin, userHospitalId])

  // Track mounted state to prevent race conditions
  const isMounted = React.useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    console.log('[UserListPage] fetchUsers called', {
      currentPage, pageSize, search, statusFilter, roleFilter, departmentFilter, hospitalFilter, sortConfig
    })

    if (isMounted.current) setIsLoading(true)

    try {
      const effectiveHospitalId = isHospitalAdmin && userHospitalId
        ? userHospitalId
        : hospitalFilter !== 'all'
          ? hospitalFilter
          : undefined

      const result = await getUsers({
        page: currentPage,
        pageSize,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter as UserStatus : undefined,
        hospitalId: effectiveHospitalId,
        departmentId: departmentFilter !== 'all' ? departmentFilter : undefined,
        roleId: roleFilter !== 'all' ? roleFilter : undefined,
        excludeSystemAdmins: isHospitalAdmin,
        sort: sortConfig,
      })

      if (isMounted.current) {
        console.log('[UserListPage] fetchUsers success', result.total)
        setUsers(result.data)
        setTotal(result.total)
        setTotalPages(result.totalPages)
        setSelectedUsers([])
      }
    } catch (error) {
      console.error('[UserListPage] fetchUsers error:', error)
      if (isMounted.current) {
        showError('Error', 'Failed to load users. Please refresh.')
      }
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }, [currentPage, pageSize, search, statusFilter, roleFilter, departmentFilter, hospitalFilter, sortConfig, isHospitalAdmin, userHospitalId])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Statistics
  const stats: StatItem[] = useMemo(() => {
    const active = users.filter((u) => u.status === USER_STATUS.ACTIVE).length
    const inactive = users.filter((u) => u.status === USER_STATUS.INACTIVE).length
    const suspended = users.filter((u) => u.status === USER_STATUS.SUSPENDED).length
    const pending = users.filter((u) => u.status === USER_STATUS.PENDING).length

    return [
      {
        label: 'Total Users',
        value: total,
        icon: Users,
        color: 'blue'
      },
      {
        label: 'Active',
        value: active,
        icon: UserCheck,
        color: 'emerald',
        description: 'Currently active accounts'
      },
      {
        label: 'Pending',
        value: pending,
        icon: Clock,
        color: 'amber',
        description: 'Awaiting approval'
      },
      {
        label: 'Suspended',
        value: suspended,
        icon: AlertCircle,
        color: 'rose',
        description: 'Accounts requiring attention'
      }
    ]
  }, [users, total])

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

  const performBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    setIsBulkActionLoading(true)
    try {
      if (action === 'delete') {
        await bulkDeleteUsers(selectedUsers)
        showSuccess('Deleted', `${selectedUsers.length} user(s) deleted successfully`)
      } else {
        const status = action === 'activate' ? USER_STATUS.ACTIVE : USER_STATUS.INACTIVE
        await bulkUpdateUserStatus(selectedUsers, status)
        showSuccess('Updated', `${selectedUsers.length} user(s) ${action}d successfully`)
      }
      setSelectedUsers([])
      fetchUsers()
    } catch (error) {
      showError('Failed', `Failed to ${action} users. Please try again.`)
    } finally {
      setIsBulkActionLoading(false)
      setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    }
  }

  const handleBulkActionClick = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) {
      showWarning('Selection Required', 'Please select at least one user.')
      return
    }

    const actionLabels = {
      activate: 'Activate',
      deactivate: 'Deactivate',
      delete: 'Delete'
    }

    setConfirmConfig({
      isOpen: true,
      title: `${actionLabels[action]} Users?`,
      message: `Are you sure you want to ${action} ${selectedUsers.length} selected user(s)? This action cannot be undone.`,
      variant: action === 'delete' ? 'danger' : 'warning',
      confirmText: `Yes, ${actionLabels[action]}`,
      onConfirm: () => performBulkAction(action)
    })
  }

  const performDeleteUser = async (user: UserWithRelations) => {
    setIsBulkActionLoading(true)
    try {
      await bulkDeleteUsers([user.id])
      showSuccess('Deleted', 'User deleted successfully')
      fetchUsers()
    } catch (error) {
      showError('Failed', 'Failed to delete user')
    } finally {
      setIsBulkActionLoading(false)
      setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    }
  }

  const handleDeleteUserClick = (user: UserWithRelations) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete User?',
      message: `Are you sure you want to delete ${user.full_name}? All data associated with this user will be permanently removed.`,
      variant: 'danger',
      confirmText: 'Delete User',
      onConfirm: () => performDeleteUser(user)
    })
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? users.map((u) => u.id) : [])
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId)
    )
  }

  const columns = [
    {
      key: 'select',
      label: '',
      render: (_: unknown, row: UserWithRelations) => (
        <input
          type="checkbox"
          checked={selectedUsers.includes(row.id)}
          onChange={(e) => {
            e.stopPropagation()
            handleSelectUser(row.id, e.target.checked)
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
        />
      ),
      className: 'w-12',
    },
    {
      key: 'profile_photo_url',
      label: '',
      render: (_: unknown, u: UserWithRelations) => (
        <Avatar
          src={u.profile_photo_url}
          name={u.full_name}
          size="md"
          className="border-2 border-white shadow-sm ring-1 ring-slate-100"
        />
      ),
      className: 'w-16',
    },
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      render: (_: unknown, row: UserWithRelations) => (
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
      key: 'employee_id',
      label: 'Employee ID',
      sortable: true,
      render: (_: unknown, row: UserWithRelations) => (
        <Badge variant="gray" className="font-mono">
          {row.employee_id}
        </Badge>
      ),
    },
    {
      key: 'role',
      label: 'Role & Dept',
      render: (_: unknown, row: UserWithRelations) => (
        <div className="space-y-1">
          <Badge variant="info">
            {row.role?.role_name || 'No Role'}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Briefcase className="w-3 h-3" />
            {row.department?.department_name || 'No Dept'}
          </div>
        </div>
      ),
    },
    {
      key: 'hospital',
      label: 'Hospital',
      render: (_: unknown, row: UserWithRelations) => (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="truncate max-w-[150px]" title={row.hospital?.hospital_name}>
            {row.hospital?.hospital_name || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: unknown, row: UserWithRelations) => {
        const variants: Record<string, 'success' | 'error' | 'warning' | 'gray'> = {
          active: 'success',
          suspended: 'error',
          pending: 'warning',
          inactive: 'gray'
        }
        return (
          <Badge variant={variants[row.status] || 'gray'}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </Badge>
        )
      },
    },
    {
      key: 'last_login',
      label: 'Last Login',
      sortable: true,
      render: (_: unknown, row: UserWithRelations) => (
        <div className="text-sm text-slate-500">
          {row.last_login ? (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(row.last_login)}
            </div>
          ) : (
            'Never'
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: UserWithRelations) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${ROUTES.ADMIN_USERS}/${row.id}`)
            }}
            className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteUserClick(row)
            }}
            className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
            title="Delete User"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'w-20',
    },
  ]

  const headerActions = (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={fetchUsers}
        disabled={isLoading}
        leftIcon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
      >
        Refresh
      </Button>
      <Button
        variant="primary"
        onClick={() => navigate(`${ROUTES.ADMIN_USERS}/new`)}
        leftIcon={<UserPlus className="w-5 h-5" />}
        className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
      >
        Add User
      </Button>
    </div>
  )

  return (
    <AdminPageLayout
      title="User Management"
      description="Manage system users, roles, and access permissions across the organization"
      icon={Users}
      breadcrumbs={[{ label: 'User Management' }]}
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <AdminStatsGrid stats={stats} isLoading={isLoading} />

        {/* Filter Bar */}
        <AdminFilterBar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val)
            setCurrentPage(1)
          }}
          searchPlaceholder="Search by name, email, or employee ID..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: USER_STATUS.ACTIVE, label: 'Active' },
                { value: USER_STATUS.INACTIVE, label: 'Inactive' },
                { value: USER_STATUS.SUSPENDED, label: 'Suspended' },
                { value: USER_STATUS.PENDING, label: 'Pending' },
              ]
            },
            {
              key: 'role',
              label: 'Role',
              value: roleFilter,
              onChange: setRoleFilter,
              options: roles.map(r => ({ value: r.id, label: r.role_name }))
            },
            // Only show Hospital filter for System Admin
            ...(!isHospitalAdmin ? [{
              key: 'hospital',
              label: 'Hospital',
              value: hospitalFilter,
              onChange: setHospitalFilter,
              options: hospitals.map(h => ({ value: h.id, label: h.hospital_name }))
            }] : []),
            {
              key: 'department',
              label: 'Department',
              value: departmentFilter,
              onChange: setDepartmentFilter,
              options: departments.map(d => ({ value: d.id, label: d.department_name })),
              disabled: departments.length === 0 && !isHospitalAdmin
            }
          ]}
          onReset={() => {
            setSearch('')
            setStatusFilter('all')
            setRoleFilter('all')
            setHospitalFilter('all')
            setDepartmentFilter('all')
            setCurrentPage(1)
          }}
        />

        {/* Bulk Actions Notice */}
        <AnimatePresence>
          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                  {selectedUsers.length}
                </div>
                <span className="text-indigo-900 font-medium">users selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkActionClick('activate')}
                  className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  leftIcon={<UserCheck className="w-4 h-4" />}
                >
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkActionClick('deactivate')}
                  className="bg-white border-indigo-200 text-slate-700 hover:bg-slate-50"
                  leftIcon={<UserX className="w-4 h-4" />}
                >
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkActionClick('delete')}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Delete
                </Button>
                <div className="h-6 w-px bg-indigo-200 mx-2" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedUsers([])}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Clear Selection
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-600">Select All</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileText className="w-4 h-4" />
              Showing {users.length} of {total} users
            </div>
          </div>

          <div className="relative">
            {isBulkActionLoading && <LoadingOverlay message="Processing..." />}
            <Table
              data={users}
              columns={columns}
              sortConfig={sortConfig}
              onSort={handleSort}
              isLoading={isLoading}
              onRowClick={(row) => navigate(`${ROUTES.ADMIN_USERS}/${row.id}`)}
              emptyMessage="No users found matching your search."
            />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/30 p-4">
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
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText}
        isLoading={isBulkActionLoading}
      />
    </AdminPageLayout>
  )
}

export default UserListPage
