// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
  Eye,
  FileText,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Select, Button } from '@/components/ui'
import { getIndentRequests, getDepartments } from '@/modules/distribution/services/indentService'
import type { IndentRequestWithRelations, IndentFilter, IndentStatus, IndentPriority } from '@/types/pharmacy'
import type { Column } from '@/types'
import { ROUTES } from '@/lib/constants'

export const IndentRequestListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || 'hosp-1'

  const [requests, setRequests] = useState<IndentRequestWithRelations[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<IndentStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<IndentPriority | 'all'>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  // Load departments
  useEffect(() => {
    getDepartments(hospitalId).then((res) => {
      if (res.data) setDepartments(res.data)
    })
  }, [hospitalId])

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const filter: IndentFilter = {
      search: search || undefined,
      status: statusFilter,
      priority: priorityFilter,
      department_id: departmentFilter,
    }

    const res = await getIndentRequests(hospitalId, filter, page, pageSize)

    if (res.error) {
      setError(res.error)
      setRequests([])
    } else if (res.data) {
      setRequests(res.data.data)
      setTotalPages(res.data.totalPages)
      setTotal(res.data.total)
    }

    setIsLoading(false)
  }, [hospitalId, search, statusFilter, priorityFilter, departmentFilter, page])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, priorityFilter, departmentFilter])

  const renderStatusBadge = (status: IndentStatus) => {
    const map: Record<IndentStatus, { variant: 'warning' | 'info' | 'success' | 'danger' | 'neutral'; label: string }> = {
      draft: { variant: 'neutral', label: 'Draft' },
      pending: { variant: 'warning', label: 'Pending Approval' },
      approved: { variant: 'info', label: 'Approved' },
      rejected: { variant: 'danger', label: 'Rejected' },
      issued: { variant: 'info', label: 'Issued' },
      completed: { variant: 'success', label: 'Completed' },
      cancelled: { variant: 'neutral', label: 'Cancelled' },
    }
    const cfg = map[status] || { variant: 'neutral', label: status }
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>
  }

  const renderPriorityBadge = (priority: IndentPriority) => {
    const map: Record<IndentPriority, { color: string; label: string }> = {
      low: { color: 'bg-slate-800/60 text-slate-400 border-slate-700', label: 'Low' },
      normal: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Normal' },
      high: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'High' },
      urgent: { color: 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse', label: '⚡ Urgent' },
    }
    const cfg = map[priority] || map.normal
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
        {cfg.label}
      </span>
    )
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const columns: Column<IndentRequestWithRelations>[] = [
    {
      key: 'indent_number',
      label: 'Indent No.',
      className: 'font-mono text-xs text-emerald-400 font-semibold',
    },
    {
      key: 'requesting_department',
      label: 'Requesting Department',
      render: (_, row) => (
        <div>
          <p className="text-xs font-semibold text-slate-100">
            {row.requesting_department?.department_name || 'Department'}
          </p>
          <p className="text-[11px] text-slate-400">{row.requester?.full_name || 'Staff'}</p>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      className: 'text-xs text-slate-300',
      render: (_, row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs font-medium">
          <Package className="w-3.5 h-3.5 text-emerald-400" />
          {row.items?.length || 0} items
        </span>
      ),
    },
    {
      key: 'request_date',
      label: 'Request Date',
      className: 'text-xs text-slate-300',
      render: (val) => formatDate(val as string),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (val) => renderPriorityBadge(val as IndentPriority),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => renderStatusBadge(val as IndentStatus),
    },
    {
      key: 'actions',
      label: 'Action',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`${ROUTES.PHARMACY_DISTRIBUTION_INDENT}/${row.id}`)}
            className="text-xs text-emerald-400 hover:bg-emerald-500/10"
          >
            <Eye className="w-3.5 h-3.5 mr-1" /> View
          </Button>
        </div>
      ),
    },
  ]

  // Counts for KPI
  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const approvedCount = requests.filter((r) => r.status === 'approved').length
  const issuedCount = requests.filter((r) => r.status === 'issued' || r.status === 'completed').length

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/20 shadow-xl shadow-emerald-950/20">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Department Indent Requests
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                  Distribution Module
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Issue drug and non-drug items from Pharmacy Store to hospital departments (e.g. Nephrology, Emergency)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate(ROUTES.PHARMACY_DISTRIBUTION_ISSUE)}
            variant="outline"
            className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
          >
            <Package className="w-4 h-4 mr-1.5 text-teal-400" /> Issue Counter
          </Button>
          <Button
            onClick={() => navigate(`${ROUTES.PHARMACY_DISTRIBUTION_INDENT}/new`)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Indent Request
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Requests</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-300">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-400 font-medium">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-300 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-blue-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-400 font-medium">Approved (Ready Issue)</p>
            <p className="text-2xl font-bold text-blue-300 mt-1">{approvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400 font-medium">Issued / Completed</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{issuedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Search Indent No. / Dept
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-950/80 border-slate-800 text-xs text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Department
            </label>
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-950/80 border-slate-800 text-xs text-slate-200"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.department_name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as IndentStatus | 'all')}
              className="bg-slate-950/80 border-slate-800 text-xs text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="issued">Issued</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </Select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Priority
            </label>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as IndentPriority | 'all')}
              className="bg-slate-950/80 border-slate-800 text-xs text-slate-200"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
          <Table
            data={requests}
            columns={columns}
            emptyMessage="No department indent requests found."
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/80 text-xs text-slate-400">
              <span>
                Showing Page {page} of {totalPages} ({total} total requests)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default IndentRequestListPage
