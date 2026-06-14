import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, RefreshCw, Shield, Settings } from 'lucide-react'
import { Button, Table, Pagination, Input, Select, Badge, LoadingOverlay } from '@/components/ui'
import { getRoles } from '@/services/roleService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SYSTEM_ROLES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Role, SortConfig } from '@/types'

export const RoleListPage: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError } = useToastStore()
  const { user } = useAuthStore()
  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const userHospitalId = user?.hospital_id
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [roleTypeFilter, setRoleTypeFilter] = useState<string>('all')
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>({ key: 'role_name', direction: 'asc' })

  const fetchRoles = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getRoles({
        page: currentPage,
        pageSize,
        search: search || undefined,
        isSystemRole: roleTypeFilter === 'system' ? true : roleTypeFilter === 'hospital' ? false : undefined,
        hospitalId: isHospitalAdmin ? userHospitalId : undefined,
        sort: sortConfig,
      })

      setRoles(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      showError('Error', 'Failed to load roles. Please try again.')
      console.error('Failed to fetch roles:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, search, roleTypeFilter, sortConfig])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const columns = [
    {
      key: 'role_code',
      label: 'Code',
      sortable: true,
      render: (_: unknown, row: Role) => (
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-600" />
          <span className="font-mono font-semibold text-slate-900">{row.role_code}</span>
        </div>
      ),
    },
    {
      key: 'role_name',
      label: 'Role Name',
      sortable: true,
      render: (_: unknown, row: Role) => (
        <div>
          <div className="font-medium text-slate-900">{row.role_name}</div>
          {row.description && <div className="text-sm text-slate-500">{row.description}</div>}
        </div>
      ),
    },
    {
      key: 'is_system_role',
      label: 'Type',
      sortable: true,
      render: (_: unknown, row: Role) => (
        <Badge variant={row.is_system_role ? 'info' : 'gray'}>
          {row.is_system_role ? 'System Role' : 'Hospital Role'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (_: unknown, row: Role) => (
        <span className="text-sm text-slate-500">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: Role) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`${ROUTES.ADMIN_ROLES}/${row.id}`)
          }}
          leftIcon={<Settings className="w-4 h-4" />}
        >
          Manage Permissions
        </Button>
      ),
      className: 'w-40',
    },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Role & Permission Management</h1>
            <p className="text-sm text-slate-600 mt-1">Manage roles and their permissions</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none" />
            <Input
              placeholder="Search by role name or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={roleTypeFilter}
            onChange={(e) => {
              setRoleTypeFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="w-48"
          >
            <option value="all">All Types</option>
            <option value="system">System Roles</option>
            <option value="hospital">Hospital Roles</option>
          </Select>
          <Button variant="outline" onClick={fetchRoles} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="p-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table
              data={roles}
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
              emptyMessage="No roles found"
              onRowClick={(row) => navigate(`${ROUTES.ADMIN_ROLES}/${row.id}`)}
            />
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
    </div>
  )
}

export default RoleListPage

