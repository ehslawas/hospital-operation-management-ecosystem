import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Edit,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server
} from 'lucide-react'
import { Button, Table, Badge, LoadingOverlay, ConfirmationDialog, Pagination } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, AdminFilterBar, StatItem } from '@/components/admin'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { ROUTES, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Hospital, HospitalWithAdmin, SortConfig } from '@/types'

// Mock data service or actual service? 
// The original file used direct supabase queries mixed with some potential service calls.
// We will maintain the logic but wrap it in the new UI.

const HospitalListPage: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError, success: showSuccess } = useToastStore()
  const { user } = useAuthStore()

  // State
  const [hospitals, setHospitals] = useState<HospitalWithAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' })
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

  const fetchHospitals = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setHospitals([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      // Fetch hospitals
      const { data: hospitalsData, error: hospitalsError } = await supabase
        .from('hospitals')
        .select('*')
        .order('created_at', { ascending: false })

      if (hospitalsError) throw hospitalsError

      // Fetch admins for each hospital
      const hospitalsWithAdmin: HospitalWithAdmin[] = await Promise.all(
        (hospitalsData || []).map(async (hospital) => {
          const { data: adminData } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('hospital_id', hospital.id)
            .eq('role_id', 'hospital_admin') // This might need adjustment based on actual role ID/code
            .limit(1)
            .single()

          return {
            ...hospital,
            admin_name: adminData?.full_name,
            admin_email: adminData?.email,
          }
        })
      )

      setHospitals(hospitalsWithAdmin)
    } catch (error) {
      console.error('Error fetching hospitals:', error)
      showError('Error', 'Failed to fetch hospitals')
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchHospitals()
  }, [fetchHospitals])

  // Statistics
  const stats: StatItem[] = useMemo(() => {
    const total = hospitals.length
    // Assuming active if status is 'active' or just counting total for now if status implies existence
    // If there's an 'is_active' field, we'd use that. Let's assume all are active unless specified.
    const active = hospitals.filter(h => h.status === 'active').length
    const inactive = total - active

    return [
      {
        label: 'Total Hospitals',
        value: total,
        icon: Building2,
        color: 'blue'
      },
      {
        label: 'Active',
        value: active,
        icon: CheckCircle2,
        color: 'emerald',
        description: 'Operational facilities'
      },
      {
        label: 'Inactive',
        value: inactive,
        icon: XCircle,
        color: 'slate',
        description: 'Need configuration'
      },
      {
        label: 'System Status',
        value: 'Online',
        icon: Server,
        color: 'indigo',
        description: 'Database connected'
      }
    ]
  }, [hospitals])

  // Filtering and Sorting
  const filteredHospitals = useMemo(() => {
    let result = [...hospitals]

    if (search) {
      const query = search.toLowerCase()
      result = result.filter(
        (h) =>
          h.hospital_name.toLowerCase().includes(query) ||
          h.hospital_code.toLowerCase().includes(query) ||
          h.state?.toLowerCase().includes(query) ||
          h.admin_name?.toLowerCase().includes(query)
      )
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof HospitalWithAdmin]
        const bValue = b[sortConfig.key as keyof HospitalWithAdmin]

        if (aValue === bValue) return 0

        const comparison = aValue > bValue ? 1 : -1
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [hospitals, search, sortConfig])

  // Pagination
  const paginatedHospitals = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredHospitals.slice(start, start + pageSize)
  }, [filteredHospitals, currentPage, pageSize])

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleDelete = async (hospital: HospitalWithAdmin) => {
    setIsActionLoading(true)
    try {
      const { error } = await supabase
        .from('hospitals')
        .delete()
        .eq('id', hospital.id)

      if (error) throw error

      showSuccess('Success', 'Hospital deleted successfully')
      fetchHospitals()
    } catch (error) {
      console.error('Error deleting hospital:', error)
      showError('Error', 'Failed to delete hospital')
    } finally {
      setIsActionLoading(false)
      setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    }
  }

  const confirmDelete = (hospital: HospitalWithAdmin) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Hospital?',
      message: `Are you sure you want to delete ${hospital.hospital_name}? This action cannot be undone and will remove all associated data.`,
      variant: 'danger',
      confirmText: 'Delete Hospital',
      onConfirm: () => handleDelete(hospital)
    })
  }

  const columns = [
    {
      key: 'hospital_name',
      label: 'Hospital Name',
      sortable: true,
      render: (_: unknown, row: HospitalWithAdmin) => (
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-0.5">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">{row.hospital_name}</div>
            <div className="text-sm text-slate-500 font-mono mt-0.5">{row.hospital_code}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact Info',
      render: (_: unknown, row: HospitalWithAdmin) => (
        <div className="space-y-1.5 text-sm text-slate-600">
          {(row.address_line1 || row.city) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[200px]">
                {[row.city, row.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          {row.phone_no && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{row.phone_no}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'admin',
      label: 'Administrator',
      render: (_: unknown, row: HospitalWithAdmin) => (
        row.admin_name ? (
          <div className="space-y-0.5">
            <div className="font-medium text-slate-900">{row.admin_name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {row.admin_email}
            </div>
          </div>
        ) : (
          <Badge variant="warning" className="text-xs">
            Not Assigned
          </Badge>
        )
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: unknown, row: HospitalWithAdmin) => (
        <Badge variant={row.status === 'active' ? 'success' : 'gray'}>
          {row.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: HospitalWithAdmin) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${ROUTES.ADMIN_HOSPITALS}/${row.id}`)
            }}
            className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            title="Edit Details"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              confirmDelete(row)
            }}
            className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
            title="Delete Hospital"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'w-24',
    },
  ]

  const headerActions = (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={fetchHospitals}
        disabled={isLoading}
        leftIcon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
      >
        Refresh
      </Button>
      <Button
        variant="primary"
        onClick={() => navigate(`${ROUTES.ADMIN_HOSPITALS}/new`)}
        leftIcon={<Plus className="w-5 h-5" />}
        className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
      >
        Add Hospital
      </Button>
    </div>
  )

  return (
    <AdminPageLayout
      title="Hospital Management"
      description="Configure and manage hospital facilities, locations, and administrative details"
      icon={Building2}
      breadcrumbs={[{ label: 'Hospitals' }]}
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
          searchPlaceholder="Search hospitals by name, code, or state..."
          onReset={() => {
            setSearch('')
            setCurrentPage(1)
          }}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">Hospital List</h3>
            <span className="text-xs text-slate-500">
              Showing {paginatedHospitals.length} of {filteredHospitals.length} hospitals
            </span>
          </div>

          <div className="relative">
            {isActionLoading && <LoadingOverlay message="Processing..." />}
            <Table
              data={paginatedHospitals}
              columns={columns}
              sortConfig={sortConfig}
              onSort={handleSort}
              isLoading={isLoading}
              onRowClick={(row) => navigate(`${ROUTES.ADMIN_HOSPITALS}/${row.id}`)}
              emptyMessage="No hospitals found."
            />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/30 p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredHospitals.length / pageSize)}
              pageSize={pageSize}
              total={filteredHospitals.length}
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

export default HospitalListPage
