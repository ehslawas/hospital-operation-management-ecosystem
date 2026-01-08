import React, { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Truck, Search, Filter, ChevronLeft, ChevronRight, Plus, ArrowRightLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Select, Button } from '@/components/ui'
import { getTransferRequests, getPendingTransfersCount } from '@/services/pharmacy/distributionService'
import type { TransferRequestWithRelations, TransferFilter, TransferStatus, TransferType } from '@/types/pharmacy'
import type { Column } from '@/types'
import { ROUTES } from '@/lib/constants'

export const TransferRequestListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [transfers, setTransfers] = useState<TransferRequestWithRelations[]>([])
  const [pendingCounts, setPendingCounts] = useState({ incoming: 0, outgoing: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<TransferType | 'all'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  // Load pending counts
  useEffect(() => {
    if (!hospitalId) return
    const loadCounts = async () => {
      const res = await getPendingTransfersCount(hospitalId)
      if (res.data) {
        setPendingCounts(res.data)
      }
    }
    void loadCounts()
  }, [hospitalId])

  // Load transfers with filters
  const loadTransfers = useCallback(async () => {
    if (!hospitalId) return

    setIsLoading(true)
    setError(null)

    const filter: TransferFilter = {
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      transfer_type: typeFilter === 'all' ? undefined : typeFilter,
    }

    const res = await getTransferRequests(hospitalId, filter, page, pageSize)

    if (res.error) {
      setError(res.error)
      setTransfers([])
    } else if (res.data) {
      setTransfers(res.data.data)
      setTotalPages(res.data.totalPages)
      setTotal(res.data.total)
    }

    setIsLoading(false)
  }, [hospitalId, search, statusFilter, typeFilter, page])

  useEffect(() => {
    void loadTransfers()
  }, [loadTransfers])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, typeFilter])

  const renderStatusBadge = (status: TransferStatus) => {
    const map: Record<TransferStatus, { color: 'success' | 'warning' | 'error' | 'info' | 'secondary'; label: string }> = {
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'info', label: 'Approved' },
      preparing: { color: 'info', label: 'Preparing' },
      in_transit: { color: 'info', label: 'In Transit' },
      received: { color: 'success', label: 'Received' },
      completed: { color: 'success', label: 'Completed' },
      rejected: { color: 'error', label: 'Rejected' },
    }
    const cfg = map[status] || { color: 'secondary', label: status }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  const renderPriorityBadge = (priority: string) => {
    const map: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'secondary'; label: string }> = {
      low: { color: 'secondary', label: 'Low' },
      normal: { color: 'info', label: 'Normal' },
      high: { color: 'warning', label: 'High' },
      urgent: { color: 'error', label: 'Urgent' },
    }
    const cfg = map[priority] || { color: 'secondary', label: priority }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const columns: Column<TransferRequestWithRelations>[] = [
    {
      key: 'transfer_number',
      label: 'Transfer No.',
      className: 'font-mono text-xs text-purple-600 font-medium',
    },
    {
      key: 'transfer_type',
      label: 'Type',
      className: 'text-xs uppercase text-gray-500',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <ArrowRightLeft className="w-3 h-3" />
          {row.transfer_type === 'inter_facility' ? 'Inter' : 'Intra'}
        </div>
      ),
    },
    {
      key: 'from_hospital_id',
      label: 'From → To',
      className: 'text-sm text-gray-900',
      render: (_, row) => (
        <span>
          {row.from_hospital?.nama || row.from_department?.department_name || '—'}
          <span className="text-gray-400 mx-1">→</span>
          {row.to_hospital?.nama || row.to_department?.department_name || '—'}
        </span>
      ),
    },
    {
      key: 'request_date',
      label: 'Request Date',
      className: 'text-sm text-gray-600',
      render: (value) => formatDate(value as string | undefined),
    },
    {
      key: 'required_date',
      label: 'Required Date',
      className: 'text-sm text-gray-600',
      render: (value) => formatDate(value as string | undefined),
    },
    {
      key: 'priority',
      label: 'Priority',
      className: 'text-center',
      render: (value) => renderPriorityBadge(String(value)),
    },
    {
      key: 'status',
      label: 'Status',
      className: 'text-center',
      render: (value) => renderStatusBadge(value as TransferStatus),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-purple-600" />
            Transfer Requests
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage inter-facility and intra-facility stock transfers.
          </p>
        </div>

        <Button onClick={() => navigate(ROUTES.PHARMACY_TRANSFER_REQUEST)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Transfer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <span className="text-sm font-medium text-purple-700">Total Transfers</span>
          <p className="text-2xl font-bold text-purple-800 mt-1">{total}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <span className="text-sm font-medium text-blue-700">Incoming Pending</span>
          <p className="text-2xl font-bold text-blue-800 mt-1">{pendingCounts.incoming}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="text-sm font-medium text-amber-700">Outgoing Pending</span>
          <p className="text-2xl font-bold text-amber-800 mt-1">{pendingCounts.outgoing}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <span className="text-sm font-medium text-green-700">In Transit</span>
          <p className="text-2xl font-bold text-green-800 mt-1">
            {transfers.filter(t => t.status === 'in_transit').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Transfer number..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-44">
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TransferType | 'all')}>
            <option value="all">All Types</option>
            <option value="inter_facility">Inter-Facility</option>
            <option value="intra_facility">Intra-Facility</option>
          </Select>
        </div>

        <div className="w-full md:w-44">
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TransferStatus | 'all')}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="in_transit">In Transit</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Filter className="w-3 h-3" />
          <span>{total} transfers</span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load transfers</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <Table
              data={transfers}
              columns={columns}
              emptyMessage="No transfer requests found."
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TransferRequestListPage

