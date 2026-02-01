import React, { useEffect, useState, useCallback } from 'react'
import { Truck, Plus, ArrowRightLeft, Search, Filter, AlertTriangle, ChevronRight, Inbox, LogOut, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Select, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, StatCard, Pagination } from '@/components/ui'
import { StandardPageLayout } from '@/components/layouts/StandardPageLayout'
import { getTransferRequests, getPendingTransfersCount } from '@/services/pharmacy/distributionService'
import type { TransferRequestWithRelations, TransferFilter, TransferStatus, TransferType } from '@/types/pharmacy'
import type { Column } from '@/types'
import { ROUTES } from '@/lib/constants'

export const TransferRequestListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const isSessionReady = useIsSessionReady()

  const [transfers, setTransfers] = useState<TransferRequestWithRelations[]>([])
  const [pendingCounts, setPendingCounts] = useState({ incoming: 0, outgoing: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNewTransferDialogOpen, setIsNewTransferDialogOpen] = useState(false)

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
    if (!isSessionReady || !hospitalId) return
    const loadCounts = async () => {
      const res = await getPendingTransfersCount(hospitalId)
      if (res.data) {
        setPendingCounts(res.data)
      }
    }
    void loadCounts()
  }, [isSessionReady, hospitalId])

  // Load transfers with filters
  const loadTransfers = useCallback(async () => {
    if (!isSessionReady || !hospitalId) return

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
  }, [isSessionReady, hospitalId, search, statusFilter, typeFilter, page])

  useEffect(() => {
    void loadTransfers()
  }, [loadTransfers])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, typeFilter])

  const renderStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">In Review</Badge>
      case 'approved': return <Badge variant="info">Preparing</Badge>
      case 'preparing': return <Badge variant="info">Preparing</Badge>
      case 'in_transit': return <Badge variant="info">In Transit</Badge>
      case 'received': return <Badge variant="success">Received</Badge>
      case 'completed': return <Badge variant="success">Completed</Badge>
      case 'rejected': return <Badge variant="error">Declined</Badge>
      case 'cancelled': return <Badge variant="gray">Cancelled</Badge>
      default: return <Badge variant="gray">{status}</Badge>
    }
  }

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="warning">High</Badge>
      case 'medium': return <Badge variant="info">Medium</Badge>
      case 'normal': return <Badge variant="gray">Normal</Badge>
      case 'low': return <Badge variant="gray">Low</Badge>
      case 'urgent': return <Badge variant="error">Urgent</Badge>
      default: return <Badge variant="gray">{priority}</Badge>
    }
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
        <div className="flex items-center">
          <div className="flex-1 overflow-hidden">
            <span className="font-bold text-slate-900">{row.from_hospital?.hospital_name || row.from_department?.department_name || '—'}</span>
            {row.from_hospital?.hospital_code && <div className="text-[10px] text-slate-500">{row.from_hospital?.hospital_code}</div>}
          </div>
          <ArrowRightLeft className="w-3 h-3 text-slate-300 mx-1 shrink-0" />
          <div className="flex-1 overflow-hidden">
            <span className="font-bold text-slate-900">{row.to_hospital?.hospital_name || row.to_department?.department_name || '—'}</span>
            {row.to_hospital?.hospital_code && <div className="text-[10px] text-slate-500">{row.to_hospital?.hospital_code}</div>}
          </div>
        </div>
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

  const breadcrumbs = [
    { label: 'Pharmacy Logistics' },
    { label: 'Distribution', href: ROUTES.PHARMACY_DISTRIBUTION_DASHBOARD },
    { label: 'Transfer Requests' }
  ]

  const headerActions = (
    <Button onClick={() => setIsNewTransferDialogOpen(true)} className="flex items-center gap-2">
      <Plus className="w-4 h-4" />
      New Transfer
    </Button>
  )

  return (
    <StandardPageLayout
      title="Transfer Requests"
      description="Manage and track stock transfers between facilities and departments."
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {/* New Transfer Dialog */}
      <Dialog open={isNewTransferDialogOpen} onOpenChange={setIsNewTransferDialogOpen} size="sm">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Transfer</DialogTitle>
            <DialogDescription>Select the type of transfer you want to create.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <button
              onClick={() => {
                setIsNewTransferDialogOpen(false)
                navigate(ROUTES.PHARMACY_INTRA_FACILITY)
              }}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-purple-700">Intrafacility Request</div>
                  <div className="text-xs text-slate-500 mt-1">Department requesting items from Pharmacy Store</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500" />
              </div>
            </button>

            <button
              onClick={() => {
                setIsNewTransferDialogOpen(false)
                navigate(ROUTES.PHARMACY_INTRA_FACILITY_ISSUE)
              }}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-emerald-700">Pharmacy Issue (Push)</div>
                  <div className="text-xs text-slate-500 mt-1">Pharmacy Store proactively pushing items to Department</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
              </div>
            </button>

            <div className="p-3 bg-gray-50 rounded-lg text-[10px] text-gray-500 flex items-center gap-2 italic">
              <AlertTriangle className="w-3 h-3" />
              Inter-facility transfers (borrow/lend) will be available in the next phase.
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewTransferDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Transfers"
          value={total}
          icon={Truck}
          color="primary"
        />
        <StatCard
          title="Incoming Pending"
          value={pendingCounts.incoming}
          icon={Inbox}
          color="info"
        />
        <StatCard
          title="Outgoing Pending"
          value={pendingCounts.outgoing}
          icon={LogOut}
          color="warning"
        />
        <StatCard
          title="In Transit"
          value={transfers.filter(t => t.status === 'in_transit').length}
          icon={Clock}
          color="success"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Transfer number..."
              className="pl-10 h-11 bg-white border-slate-200 hover:border-purple-300 focus:border-purple-500 focus:ring-purple-200 transition-all rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-56">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Type</label>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TransferType | 'all')}
            className="h-11 bg-white border-slate-200 rounded-xl"
          >
            <option value="all">All Types</option>
            <option value="inter_facility">Inter-Facility</option>
            <option value="intra_facility">Intra-Facility</option>
          </Select>
        </div>

        <div className="w-full md:w-56">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Status</label>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TransferStatus | 'all')}
            className="h-11 bg-white border-slate-200 rounded-xl"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="in_transit">In Transit</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-3 rounded-xl border border-slate-100 h-11">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[12px] font-bold text-slate-600">{total} <span className="text-slate-400 font-medium">RECORDS</span></span>
        </div>
      </div>

      {/* Error Message */}
      {!isLoading && error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-700 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="font-bold uppercase tracking-tight">Failed to load transfers</p>
            <p className="mt-1 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" className="text-purple-600" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading transfers...</span>
            </div>
          </div>
        ) : null}

        <div className={isLoading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <Table
              data={transfers}
              columns={columns}
              emptyMessage="No transfer requests found."
              onRowClick={(row) => {
                if (row.transfer_type === 'inter_facility') {
                  navigate(ROUTES.PHARMACY_INTER_FACILITY_DETAIL(row.id))
                } else {
                  navigate(ROUTES.PHARMACY_INTRA_FACILITY_DETAIL(row.id))
                }
              }}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      </div>
    </StandardPageLayout>
  )
}

export default TransferRequestListPage

