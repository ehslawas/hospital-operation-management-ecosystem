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
  Pill,
  Building2,
  AlertCircle,
  Eye,
  FileText,
  XCircle,
  User,
  Printer,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Select, Button } from '@/components/ui'
import {
  getIndentRequests,
  getDepartments,
  canUserApproveIndent,
} from '@/modules/distribution/services/indentService'
import { IndentIssuePrintView } from '@/modules/distribution/components/IndentIssuePrintView'
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
  const [printRequestId, setPrintRequestId] = useState<string | null>(null)

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

  const renderStatusBadge = (status: IndentStatus, row?: IndentRequestWithRelations) => {
    if (status === 'rejected') {
      return (
        <div className="space-y-1 py-0.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-md shadow-rose-950/70">
            <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            REJECTED
          </span>
          {row?.rejection_reason && (
            <p className="text-[11px] text-rose-300/90 font-medium leading-snug max-w-[250px] bg-rose-950/40 p-1.5 rounded-lg border border-rose-900/50 mt-1">
              <span className="text-rose-400 font-bold">Reason:</span> "{row.rejection_reason}"
            </p>
          )}
          {row?.approver?.full_name && (
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-rose-400/80 flex-shrink-0" />
              <span>Rejected by: <strong className="text-slate-200">{row.approver.full_name}</strong></span>
            </p>
          )}
        </div>
      )
    }

    if (status === 'approved') {
      return (
        <div className="space-y-1 py-0.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            Approved
          </span>
          {row?.approver?.full_name && (
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-cyan-400/80 flex-shrink-0" />
              <span>Approved by: <strong className="text-slate-200">{row.approver.full_name}</strong></span>
            </p>
          )}
        </div>
      )
    }

    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse shadow-sm">
          <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          Pending Approval
        </span>
      )
    }

    if (status === 'issued') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm">
          <Package className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
          Issued from Store
        </span>
      )
    }

    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          Completed
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        {status}
      </span>
    )
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
    if (!dateStr || dateStr === 'N/A') return '—'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr || dateStr === 'N/A') return '—'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return dateStr
    }
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
          {requests.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No department indent requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Indent No.</th>
                    <th className="p-3.5">Department & Requester</th>
                    <th className="p-3.5">Items & Type</th>
                    <th className="p-3.5">Request Date & Time</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Approved / Rejected By</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {requests.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`${ROUTES.PHARMACY_DISTRIBUTION_INDENT}/${row.id}`)}
                      className={`transition-colors cursor-pointer ${
                        row.status === 'rejected'
                          ? 'bg-rose-950/15 hover:bg-rose-950/30 border-l-4 border-l-rose-500'
                          : row.status === 'pending'
                          ? 'hover:bg-slate-800/40 border-l-4 border-l-amber-500'
                          : 'hover:bg-slate-800/40 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="p-3.5 pl-5 font-mono text-emerald-400 font-bold">
                        {row.indent_number}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-100 text-xs flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              {row.requesting_department?.department_name || 'Department'}
                            </span>
                            <span className="text-slate-500 font-bold text-xs">➔</span>
                            <span className="font-bold text-emerald-400 text-[11px] flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                              🎯 {row.fulfilling_department?.department_name || 'Pharmacy logistic'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                            <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span>Requester: <strong className="text-slate-200">{row.requester?.full_name || 'Staff'}</strong></span>
                          </p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {(() => {
                          const items = row.items || []
                          const drugCount = items.filter((i) => i.item_type === 'drug').length
                          const nonDrugCount = items.filter((i) => i.item_type === 'non_drug').length

                          if (drugCount > 0 && nonDrugCount === 0) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-800/70 text-purple-200 text-xs font-bold shadow-sm">
                                <Pill className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                {drugCount} {drugCount === 1 ? 'Drug' : 'Drugs'}
                              </span>
                            )
                          }

                          if (nonDrugCount > 0 && drugCount === 0) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-800/70 text-blue-200 text-xs font-bold shadow-sm">
                                <Package className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                {nonDrugCount} {nonDrugCount === 1 ? 'Non-Drug' : 'Non-Drugs'}
                              </span>
                            )
                          }

                          if (drugCount > 0 && nonDrugCount > 0) {
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800/70 text-purple-200 text-[10px] font-bold">
                                  <Pill className="w-3 h-3 text-purple-400" /> {drugCount} Drug
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/70 border border-blue-800/70 text-blue-200 text-[10px] font-bold">
                                  <Package className="w-3 h-3 text-blue-400" /> {nonDrugCount} Non-Drug
                                </span>
                              </div>
                            )
                          }

                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-xs font-medium">
                              <Package className="w-3.5 h-3.5 text-slate-500" />
                              {items.length} items
                            </span>
                          )
                        })()}
                      </td>
                      <td className="p-3.5 text-slate-200 font-semibold text-xs whitespace-nowrap">
                        {formatDateTime(row.request_date || row.created_at)}
                      </td>
                      <td className="p-3.5">
                        {renderPriorityBadge(row.priority)}
                      </td>
                      <td className="p-3.5">
                        {renderStatusBadge(row.status, row)}
                      </td>
                      <td className="p-3.5">
                        {row.status === 'rejected' ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                              {row.approver?.full_name || user?.full_name || (user as any)?.name || 'Store Officer'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Rejected on {formatDateTime(row.updated_at)}
                            </p>
                          </div>
                        ) : row.status === 'approved' ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                              {row.approver?.full_name || user?.full_name || (user as any)?.name || 'Store Officer'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Approved on {formatDateTime(row.approved_at || row.updated_at)}
                            </p>
                          </div>
                        ) : row.status === 'issued' || row.status === 'completed' ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                              {row.approver?.full_name || user?.full_name || (user as any)?.name || 'Store Officer'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Issued on {formatDateTime(row.issued_at || row.updated_at)}
                            </p>
                          </div>
                        ) : row.status === 'pending' ? (
                          canUserApproveIndent(user, row) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 animate-pulse">
                              <Clock className="w-3 h-3 text-emerald-400" /> Pending Your Action
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
                              <Clock className="w-3 h-3 text-slate-500" /> Awaiting {row.fulfilling_department?.department_name || 'Target Unit'}
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">—</span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPrintRequestId(row.id)
                            }}
                            className="text-xs text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 px-2.5 py-1.5"
                            title="Cetak Borang Indent (KEW.PS-11)"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1 text-slate-400" /> Cetak
                          </Button>

                          {row.status === 'pending' && canUserApproveIndent(user, row) ? (
                            <Button
                              size="sm"
                              onClick={() => navigate(`${ROUTES.PHARMACY_DISTRIBUTION_INDENT}/${row.id}`)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-1.5 shadow-md shadow-emerald-600/20"
                            >
                              Review & Approve
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`${ROUTES.PHARMACY_DISTRIBUTION_INDENT}/${row.id}`)}
                              className="text-xs text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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

      {/* Print Document Modal */}
      <IndentIssuePrintView
        requestId={printRequestId}
        isOpen={!!printRequestId}
        onClose={() => setPrintRequestId(null)}
      />
    </div>
  )
}

export default IndentRequestListPage
