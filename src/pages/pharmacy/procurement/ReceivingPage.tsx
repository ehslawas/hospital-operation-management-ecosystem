import React, { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, PackageCheck, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Select } from '@/components/ui'
import { getPurchaseOrders } from '@/services/pharmacy/procurementService'
import type { PurchaseOrderWithRelations, POStatus } from '@/types/pharmacy'

export const ReceivingPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [orders, setOrders] = useState<PurchaseOrderWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'sent' | 'partial_received' | 'all'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  // Load orders pending receiving
  const loadOrders = useCallback(async () => {
    if (!hospitalId) return

    setIsLoading(true)
    setError(null)

    // Only show orders that can be received (sent or partial_received)
    const validStatuses: POStatus[] = statusFilter === 'all' 
      ? ['sent', 'partial_received'] 
      : [statusFilter]

    const res = await getPurchaseOrders(
      hospitalId,
      { 
        search: search || undefined,
        status: validStatuses[0], // API takes single status, filter others client-side if needed
      },
      page,
      pageSize
    )

    if (res.error) {
      setError(res.error)
      setOrders([])
    } else if (res.data) {
      // Additional client-side filtering if needed
      const filtered = res.data.data.filter(o => validStatuses.includes(o.status))
      setOrders(filtered)
      setTotalPages(res.data.totalPages)
      setTotal(filtered.length)
    }

    setIsLoading(false)
  }, [hospitalId, search, statusFilter, page])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const renderStatusBadge = (status: POStatus) => {
    const map: Record<POStatus, { color: 'success' | 'warning' | 'error' | 'info' | 'secondary'; label: string }> = {
      draft: { color: 'secondary', label: 'Draft' },
      pending_approval: { color: 'warning', label: 'Pending' },
      approved: { color: 'info', label: 'Approved' },
      sent: { color: 'info', label: 'Awaiting Delivery' },
      partial_received: { color: 'warning', label: 'Partial Received' },
      completed: { color: 'success', label: 'Completed' },
      cancelled: { color: 'error', label: 'Cancelled' },
    }
    const cfg = map[status] || { color: 'secondary', label: status }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const isOverdue = (expectedDate?: string) => {
    if (!expectedDate) return false
    return new Date(expectedDate) < new Date()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PackageCheck className="w-6 h-6 text-green-600" />
          Goods Receiving
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Receive and inspect goods from purchase orders.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <span className="text-sm font-medium text-blue-700">Awaiting Delivery</span>
          <p className="text-2xl font-bold text-blue-800 mt-1">
            {orders.filter(o => o.status === 'sent').length}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="text-sm font-medium text-amber-700">Partial Received</span>
          <p className="text-2xl font-bold text-amber-800 mt-1">
            {orders.filter(o => o.status === 'partial_received').length}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <span className="text-sm font-medium text-red-700">Overdue</span>
          <p className="text-2xl font-bold text-red-800 mt-1">
            {orders.filter(o => isOverdue(o.expected_delivery_date)).length}
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
              placeholder="PO number..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'sent' | 'partial_received' | 'all')}
          >
            <option value="all">All Pending</option>
            <option value="sent">Awaiting Delivery</option>
            <option value="partial_received">Partial Received</option>
          </Select>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Filter className="w-3 h-3" />
          <span>{total} orders</span>
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
            <p className="font-medium">Failed to load orders</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell as="th">PO Number</Table.Cell>
                  <Table.Cell as="th">Supplier</Table.Cell>
                  <Table.Cell as="th">Order Date</Table.Cell>
                  <Table.Cell as="th">Expected Delivery</Table.Cell>
                  <Table.Cell as="th" className="text-right">Total</Table.Cell>
                  <Table.Cell as="th" className="text-center">Status</Table.Cell>
                  <Table.Cell as="th" className="text-center">Action</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {orders.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                      No orders pending receiving.
                    </Table.Cell>
                  </Table.Row>
                )}

                {orders.map((order) => (
                  <Table.Row
                    key={order.id}
                    className={isOverdue(order.expected_delivery_date) ? 'bg-red-50' : ''}
                  >
                    <Table.Cell className="font-mono text-xs text-blue-600 font-medium">
                      {order.po_number}
                    </Table.Cell>
                    <Table.Cell className="text-sm text-gray-900">
                      {order.supplier?.company_name || '—'}
                    </Table.Cell>
                    <Table.Cell className="text-sm text-gray-600">
                      {formatDate(order.order_date)}
                    </Table.Cell>
                    <Table.Cell className="text-sm text-gray-600">
                      <span className={isOverdue(order.expected_delivery_date) ? 'text-red-600 font-medium' : ''}>
                        {formatDate(order.expected_delivery_date)}
                        {isOverdue(order.expected_delivery_date) && ' (Overdue)'}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-right text-sm font-medium">
                      {formatCurrency(order.total_amount)}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      {renderStatusBadge(order.status)}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <button
                        className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Receive
                      </button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
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

export default ReceivingPage

