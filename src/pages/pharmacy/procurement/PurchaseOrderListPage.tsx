import React, { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, ShoppingCart, Search, Filter, ChevronLeft, ChevronRight, Plus, DollarSign, FileText, TrendingUp, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Select, Button, StatCard } from '@/components/ui'
import { getPurchaseOrders, getActiveSuppliers } from '@/services/pharmacy/procurementService'
import type { PurchaseOrderWithRelations, Supplier, ProcurementFilter, POStatus } from '@/types/pharmacy'
import { ROUTES } from '@/lib/constants'

export const PurchaseOrderListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [orders, setOrders] = useState<PurchaseOrderWithRelations[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all')
  const [supplierId, setSupplierId] = useState('')
  const [voteCodeFilter, setVoteCodeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  // Load suppliers once
  useEffect(() => {
    const loadSuppliers = async () => {
      const res = await getActiveSuppliers()
      if (res.data) {
        setSuppliers(res.data)
      }
    }
    void loadSuppliers()
  }, [])

  // Load orders with filters
  const loadOrders = useCallback(async () => {
    if (!hospitalId) return

    setIsLoading(true)
    setError(null)

    const filter: ProcurementFilter = {
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      supplier_id: supplierId || undefined,
    }

    // Apply client-side filters for vote_code, category, department
    // Note: These should ideally be server-side filters, but for now we'll filter client-side

    const res = await getPurchaseOrders(hospitalId, filter, page, pageSize)

    if (res.error) {
      setError(res.error)
      setOrders([])
    } else if (res.data) {
      let filteredOrders = res.data.data

      // Apply client-side filters
      if (voteCodeFilter) {
        filteredOrders = filteredOrders.filter((o) => o.vote_code === voteCodeFilter)
      }
      if (categoryFilter) {
        filteredOrders = filteredOrders.filter((o) => o.category === categoryFilter)
      }
      if (departmentFilter) {
        filteredOrders = filteredOrders.filter((o) => o.department === departmentFilter)
      }

      setOrders(filteredOrders)
      setTotalPages(Math.ceil(filteredOrders.length / pageSize))
      setTotal(filteredOrders.length)
    }

    setIsLoading(false)
  }, [hospitalId, search, statusFilter, supplierId, page])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, supplierId, voteCodeFilter, categoryFilter, departmentFilter])

  const renderStatusBadge = (status: POStatus) => {
    const map: Record<POStatus, { color: 'success' | 'warning' | 'error' | 'info' | 'secondary'; label: string }> = {
      draft: { color: 'secondary', label: 'Draft' },
      pending_approval: { color: 'warning', label: 'Pending Approval' },
      approved: { color: 'info', label: 'Approved' },
      sent: { color: 'info', label: 'Sent' },
      partial_received: { color: 'warning', label: 'Partial' },
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

  // Calculate KPIs
  const calculateKPIs = () => {
    const totalOrders = orders.length
    const totalValue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const pendingOrders = orders.filter((o) => o.status === 'pending_approval' || o.status === 'draft').length
    const completedOrders = orders.filter((o) => o.status === 'completed').length

    // Orders by status
    const statusBreakdown = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Orders by category
    const categoryBreakdown = orders.reduce((acc, o) => {
      const cat = o.category || 'unknown'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Orders by department
    const departmentBreakdown = orders.reduce((acc, o) => {
      const dept = o.department || 'unknown'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalOrders,
      totalValue,
      pendingOrders,
      completedOrders,
      statusBreakdown,
      categoryBreakdown,
      departmentBreakdown,
    }
  }

  const kpis = calculateKPIs()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Purchase Orders
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage purchase orders for drugs and non-drug items.
          </p>
        </div>

        <Button onClick={() => navigate(ROUTES.PHARMACY_PO_CREATE)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New PO
        </Button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Purchase Orders"
          value={kpis.totalOrders.toString()}
          icon={FileText}
          color="primary"
        />
        <StatCard
          title="Total Purchase Value"
          value={formatCurrency(kpis.totalValue)}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Pending Orders"
          value={kpis.pendingOrders.toString()}
          icon={Package}
          color="warning"
        />
        <StatCard
          title="Completed Orders"
          value={kpis.completedOrders.toString()}
          icon={TrendingUp}
          color="info"
        />
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Orders by Status</h3>
          <div className="space-y-2">
            {Object.entries(kpis.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Orders by Category</h3>
          <div className="space-y-2">
            {Object.entries(kpis.categoryBreakdown).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Orders by Department</h3>
          <div className="space-y-2">
            {Object.entries(kpis.departmentBreakdown).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">{dept.replace('_', ' ')}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">All Suppliers</option>
            {suppliers.map((sup) => (
              <option key={sup.id} value={sup.id}>
                {sup.company_name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-44">
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as POStatus | 'all')}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="sent">Sent</option>
            <option value="partial_received">Partial Received</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        <div className="w-full md:w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">Vote Code</label>
          <Select value={voteCodeFilter} onChange={(e) => setVoteCodeFilter(e.target.value)}>
            <option value="">All</option>
            <option value="080702">080702</option>
            <option value="990102">990102</option>
          </Select>
        </div>

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All</option>
            <option value="drug">Drug</option>
            <option value="non_drug">Non-Drug</option>
            <option value="non_standard">Non-Standard</option>
            <option value="reagent">Reagent</option>
            <option value="vaccine">Vaccine</option>
            <option value="insulin">Insulin</option>
            <option value="hepc">HEPC</option>
            <option value="medical_oxygen">Medical Oxygen</option>
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
            <p className="font-medium">Failed to load purchase orders</p>
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
                  <Table.Cell as="th">Order Date</Table.Cell>
                  <Table.Cell as="th" className="min-w-[140px]">PO Number</Table.Cell>
                  <Table.Cell as="th" className="min-w-[200px]">Supplier</Table.Cell>
                  <Table.Cell as="th">Vote Code</Table.Cell>
                  <Table.Cell as="th">Category</Table.Cell>
                  <Table.Cell as="th">Department</Table.Cell>
                  <Table.Cell as="th" className="text-right">Total</Table.Cell>
                  <Table.Cell as="th" className="text-center">Status</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {orders.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={8} className="text-center text-sm text-gray-500 py-8">
                      No purchase orders found matching your filters.
                    </Table.Cell>
                  </Table.Row>
                )}

                {orders.map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell className="text-sm text-gray-600">
                      {formatDate(order.order_date)}
                    </Table.Cell>
                    <Table.Cell>
                      <button
                        onClick={() => navigate(ROUTES.PHARMACY_PO_DETAIL.replace(':id', order.id))}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {order.po_number}
                      </button>
                    </Table.Cell>
                    <Table.Cell className="text-sm text-gray-900">
                      {order.supplier?.company_name || '—'}
                    </Table.Cell>
                    <Table.Cell className="text-sm text-gray-600">
                      {order.vote_code || '—'}
                    </Table.Cell>
                    <Table.Cell className="text-sm">
                      {order.category ? (
                        <Badge variant="secondary" className="capitalize">
                          {order.category.replace('_', ' ')}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-sm text-gray-600 capitalize">
                      {order.department ? order.department.replace('_', ' ') : '—'}
                    </Table.Cell>
                    <Table.Cell className="text-right text-sm font-medium">
                      {formatCurrency(order.total_amount)}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      {renderStatusBadge(order.status)}
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

export default PurchaseOrderListPage

