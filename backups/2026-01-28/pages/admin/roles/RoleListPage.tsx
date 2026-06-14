import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Lock,
  Users,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Key
} from 'lucide-react'
import { Button, Table, Badge, LoadingOverlay, ConfirmationDialog, Pagination } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, AdminFilterBar, StatItem } from '@/components/admin'
import { getAllRoles, deleteRole } from '@/services/roleService'
import { useToastStore } from '@/stores/toastStore'
import { ROUTES, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE, SYSTEM_ROLES } from '@/lib/constants'
import type { Role, SortConfig } from '@/types'

export const RoleListPage: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError, success: showSuccess } = useToastStore()

  // State
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'role_name', direction: 'asc' })
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

  // Track mounted state to prevent race conditions
  const isMounted = React.useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Fetch Roles
  const fetchRoles = useCallback(async () => {
    if (isMounted.current) setIsLoading(true)
    try {
      const data = await getAllRoles()
      if (isMounted.current) setRoles(data)
    } catch (error) {
      console.error('Error fetching roles:', error)
      if (isMounted.current) showError('Error', 'Failed to load roles')
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  // Statistics
  const stats: StatItem[] = useMemo(() => {
    const total = roles.length
    // Assuming we don't have exact counts for users in each role from just getAllRoles, 
    // we show generic role stats.
    const systemRoles = roles.filter(r =>
      Object.values(SYSTEM_ROLES).includes(r.role_code)
    ).length
    const customRoles = total - systemRoles

    return [
      {
        label: 'Total Roles',
        value: total,
        icon: Shield,
        color: 'blue'
      },
      {
        label: 'System Roles',
        value: systemRoles,
        icon: Lock,
        color: 'emerald',
        description: 'Built-in permissions'
      },
      {
        label: 'Custom Roles',
        value: customRoles,
        icon: Users,
        color: 'indigo',
        description: 'User defined'
      },
      {
        label: 'Policy Status',
        value: 'Active',
        icon: Key,
        color: 'slate',
        description: 'RBAC Enforced'
      }
    ]
  }, [roles])

  // Filtering and Sorting
  const filteredRoles = useMemo(() => {
    let result = [...roles]

    if (search) {
      const query = search.toLowerCase()
      result = result.filter(
        r =>
          r.role_name.toLowerCase().includes(query) ||
          r.role_code.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query)
      )
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Role]
        const bValue = b[sortConfig.key as keyof Role]

        if (aValue === bValue) return 0

        const comparison = aValue > bValue ? 1 : -1
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [roles, search, sortConfig])

  // Pagination
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRoles.slice(start, start + pageSize)
  }, [filteredRoles, currentPage, pageSize])

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleDelete = async (role: Role) => {
    // Prevent deleting system roles if needed - though UI should probably disable it first
    if (Object.values(SYSTEM_ROLES).includes(role.role_code)) {
      showError('Action Denied', 'Cannot delete system roles')
      setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      return
    }

    setIsActionLoading(true)
    try {
      await deleteRole(role.id)
      showSuccess('Success', 'Role deleted successfully')
      fetchRoles()
    } catch (error) {
      console.error('Error deleting role:', error)
      showError('Error', 'Failed to delete role')
    } finally {
      setIsActionLoading(false)
      setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    }
  }

  const confirmDelete = (role: Role) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Role?',
      message: `Are you sure you want to delete ${role.role_name}? Users assigned to this role may lose access permissions.`,
      variant: 'danger',
      confirmText: 'Delete Role',
      onConfirm: () => handleDelete(role)
    })
  }

  const columns = [
    {
      key: 'role_name',
      label: 'Role Name',
      sortable: true,
      render: (_: unknown, row: Role) => (
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">{row.role_name}</div>
            <div className="text-sm text-slate-500 font-mono mt-0.5">{row.role_code}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (_: unknown, row: Role) => (
        <div className="text-sm text-slate-600 max-w-md truncate">
          {row.description || '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: Role) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${ROUTES.ADMIN_ROLES}/${row.id}`)
            }}
            className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            title="Edit Role"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${ROUTES.ADMIN_ROLES}/${row.id}/permissions`)
            }}
            className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
            title="Manage Permissions"
          >
            <Shield className="w-4 h-4" />
          </Button>
          {!Object.values(SYSTEM_ROLES).includes(row.role_code) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                confirmDelete(row)
              }}
              className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              title="Delete Role"
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
        variant="outline"
        onClick={fetchRoles}
        disabled={isLoading}
        leftIcon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
      >
        Refresh
      </Button>
      <Button
        variant="outline"
        onClick={() => navigate(`${ROUTES.ADMIN_ROLES}/features`)}
        leftIcon={<Key className="w-5 h-5" />}
      >
        Manage Features
      </Button>
      <Button
        variant="primary"
        onClick={() => navigate(`${ROUTES.ADMIN_ROLES}/new`)}
        leftIcon={<Plus className="w-5 h-5" />}
        className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
      >
        Add Role
      </Button>
    </div>
  )

  return (
    <AdminPageLayout
      title="Role Management"
      description="Define user roles and access permissions for the system"
      icon={Shield}
      breadcrumbs={[{ label: 'Roles' }]}
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
          searchPlaceholder="Search roles..."
          onReset={() => {
            setSearch('')
            setCurrentPage(1)
          }}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">Role List</h3>
            <span className="text-xs text-slate-500">
              Showing {paginatedRoles.length} of {filteredRoles.length} roles
            </span>
          </div>

          <div className="relative">
            {isActionLoading && <LoadingOverlay message="Processing..." />}
            <Table
              data={paginatedRoles}
              columns={columns}
              sortConfig={sortConfig}
              onSort={handleSort}
              isLoading={isLoading}
              onRowClick={(row) => navigate(`${ROUTES.ADMIN_ROLES}/${row.id}`)}
              emptyMessage="No roles found."
            />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/30 p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredRoles.length / pageSize)}
              pageSize={pageSize}
              total={filteredRoles.length}
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
  )
}

export default RoleListPage
