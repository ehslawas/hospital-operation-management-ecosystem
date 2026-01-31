import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart, Search, Plus, CheckCircle, XCircle, FileDigit, FileText,
  Edit, Clock, AlertTriangle, Truck, Package, FileCheck, DollarSign, X, Building2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useIsSessionReady } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import {
  Table, TableHeader, TableBody, TableRow, TableCell,
  Spinner, Badge, Button, Pagination, ConfirmationDialog
} from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { DepartmentBreakdownTable } from '@/components/pharmacy/procurement/DepartmentBreakdownTable'
import { ActionTooltip } from '@/components/ui/Tooltip'
import { getPurchaseOrders, getActiveSuppliers, getProcurementStats, approvePurchaseOrder, deletePurchaseOrder } from '@/services/pharmacy/procurementService'
import { WARRANT_VOTE_CODES, WARRANT_VOTE_ACTIVITIES, WARRANT_DEPARTMENTS } from '@/services/pharmacy/warrantService'
import type { PurchaseOrderWithRelations, Supplier, ProcurementFilter, POStatus, ProcurementStats } from '@/types/pharmacy'
import { ROUTES } from '@/lib/constants'
import { useDebounce } from '@/hooks/useDebounce'

export const PurchaseOrderListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  const hospitalId = user?.hospital_id
  const isSessionReady = useIsSessionReady()

  const [orders, setOrders] = useState<PurchaseOrderWithRelations[]>([])
  // Start as true to show loading spinner until session is verified and data is loaded
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Track if initial data has been loaded (to distinguish from subsequent fetches)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300) // Debounce search by 300ms
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all')
  const [supplierId, setSupplierId] = useState('')
  const [voteCodeFilter, setVoteCodeFilter] = useState('')
  const [voteActivityFilter, setVoteActivityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(15)

  const [stats, setStats] = useState<ProcurementStats | null>(null)
  const [activeTab, setActiveTab] = useState<'po' | 'sq'>('po')

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showBatchApproveDialog, setShowBatchApproveDialog] = useState(false)
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')

  // Load stats once (global KPIs)
  useEffect(() => {
    const loadStats = async () => {
      if (!isSessionReady || !hospitalId) return
      const res = await getProcurementStats(hospitalId)
      if (res.data) {
        setStats(res.data)
      }
    }
    void loadStats()
  }, [isSessionReady, hospitalId])

  const kpis = {
    totalOrders: stats?.total_orders || 0,
    totalValue: stats?.total_value || 0,
    pendingOrders: stats?.pending_orders || 0,
    completedOrders: stats?.completed_orders || 0,
    totalItems: stats?.total_items || 0,
    totalSQ: stats?.total_sq || 0,
    totalRegularPO: stats?.total_regular_po || 0,
    statusBreakdown: stats?.by_status || {},
    categoryBreakdown: stats?.by_category || {},
    departmentBreakdown: stats?.by_department || {},
    voteCodeBreakdown: stats?.by_vote_code || {},
  }

  // Load orders with filters
  const loadOrders = useCallback(async () => {
    // Only fetch if session is ready and we have hospitalId
    if (!isSessionReady || !hospitalId) {
      // Don't change loading state here - the effect below handles waiting for session
      return
    }

    setIsLoading(true)
    setError(null)

    const filter: ProcurementFilter = {
      search: debouncedSearch || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      supplier_id: supplierId || undefined,
      po_type: activeTab === 'sq' ? 'sq' : 'po_only', // Filter by tab
      vote_code: voteCodeFilter || undefined,
      vote_activity: voteActivityFilter || undefined,
      category: categoryFilter || undefined,
      department: departmentFilter || undefined,
    }

    try {
      const res = await getPurchaseOrders(hospitalId, filter, page, pageSize, 'po_number', 'desc')

      if (res.error) {
        setError(res.error)
        setOrders([])
      } else if (res.data) {
        setOrders(res.data.data)
        setTotalPages(res.data.totalPages)
        setTotal(res.data.total)
      }
    } catch (err) {
      console.error('[PurchaseOrderListPage] Error loading orders:', err)
      setError('Failed to load purchase orders')
      setOrders([])
    } finally {
      setIsLoading(false)
      setHasInitialLoad(true)
    }
  }, [isSessionReady, hospitalId, debouncedSearch, statusFilter, supplierId, voteCodeFilter, voteActivityFilter, categoryFilter, departmentFilter, page, pageSize, activeTab])

  // Effect to trigger data load when session becomes ready
  useEffect(() => {
    if (isSessionReady && hospitalId) {
      void loadOrders()
    }
  }, [isSessionReady, hospitalId, loadOrders])

  // Reset selection when data changes
  useEffect(() => {
    setSelectedIds([])
  }, [orders])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(orders.map((o) => o.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return

    setIsBatchProcessing(true)
    try {
      let successCount = 0
      let failCount = 0

      for (const id of selectedIds) {
        const order = orders.find((o) => o.id === id)
        if (order?.status === 'pending_approval') {
          const res = await approvePurchaseOrder(id, user?.id || 'system')
          if (!res.error) successCount++
          else failCount++
        }
      }

      if (successCount > 0) {
        showSuccess('Batch Approval Successful', `Successfully approved ${successCount} purchase orders.`)
        void loadOrders()
        // Determine whether to reload stats as well if needed, but wait for next mount is okay
      }
      if (failCount > 0) {
        showError('Batch Approval Partial Failure', `Failed to approve ${failCount} purchase orders.`)
      }
    } catch (err) {
      showError('Batch Approval Failed', 'An error occurred during batch approval.')
    } finally {
      setIsBatchProcessing(false)
      setShowBatchApproveDialog(false)
      setSelectedIds([])
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    if (deleteReason.trim().toLowerCase() !== 'delete') {
      showError('Validation Error', "Please type 'DELETE' to confirm.")
      return
    }

    setIsBatchProcessing(true)
    try {
      let successCount = 0
      let failCount = 0

      for (const id of selectedIds) {
        const order = orders.find((o) => o.id === id)
        if (order?.status === 'draft' && user?.id) {
          const res = await deletePurchaseOrder(id, user.id)
          if (!res.error) successCount++
          else failCount++
        }
      }

      if (successCount > 0) {
        showSuccess('Batch Deletion Successful', `Successfully deleted ${successCount} purchase orders.`)
        void loadOrders()
      }
      if (failCount > 0) {
        showError('Batch Deletion Partial Failure', `Failed to delete ${failCount} purchase orders.`)
      }
    } catch (err) {
      showError('Batch Deletion Failed', 'An error occurred during batch deletion.')
    } finally {
      setIsBatchProcessing(false)
      setShowBatchDeleteDialog(false)
      setSelectedIds([])
      setDeleteReason('')
    }
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

  const renderStatusBadge = (status: POStatus) => {
    const map: Record<POStatus, { color: 'success' | 'warning' | 'error' | 'info' | 'gray' | 'primary'; label: string; icon: React.ElementType; tooltip: string }> = {
      draft: { color: 'gray', label: 'Draft', icon: Clock, tooltip: 'Order is preparing' },
      pending_approval: { color: 'warning', label: 'Pending Approval', icon: AlertTriangle, tooltip: 'Awaiting approval' },
      approved: { color: 'info', label: 'Approved', icon: CheckCircle, tooltip: 'Approved' },
      sent: { color: 'primary', label: 'Sent', icon: Truck, tooltip: 'Sent to supplier' },
      partial_received: { color: 'warning', label: 'Partial', icon: Package, tooltip: 'Partial delivery' },
      completed: { color: 'success', label: 'Completed', icon: FileCheck, tooltip: 'Order completed' },
      cancelled: { color: 'error', label: 'Cancelled', icon: XCircle, tooltip: 'Order cancelled' },
    }
    const cfg = map[status] || { color: 'gray', label: status, icon: Clock, tooltip: 'Unknown' }
    const Icon = cfg.icon

    return (
      <ActionTooltip content={cfg.tooltip}>
        <Badge variant={cfg.color} className="flex items-center w-fit gap-1.5 py-1 px-2.5 shadow-sm font-medium mx-auto justify-center">
          <Icon className="w-3.5 h-3.5" />
          {cfg.label}
        </Badge>
      </ActionTooltip>
    )
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => navigate(ROUTES.PHARMACY_SQ_CREATE)} className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border-blue-200 text-blue-700 hover:bg-blue-50">
        <FileText className="w-4 h-4" />
        Create SQ
      </Button>
      <Button variant="outline" onClick={() => navigate(ROUTES.PHARMACY_MANUAL_CREATE)} className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border-purple-200 text-purple-700 hover:bg-purple-50">
        <Edit className="w-4 h-4" />
        Manual PO
      </Button>
      <Button onClick={() => navigate(ROUTES.PHARMACY_PO_CREATE)} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg transition-all">
        <Plus className="w-4 h-4" />
        New PO
      </Button>
    </div>
  )

  return (
    <FinancialPageLayout
      title="Purchase Orders"
      description="Manage purchase orders for drugs and non-drug items with real-time tracking."
      icon={ShoppingCart}
      breadcrumbs={[{ label: 'Procurement', href: '#' }, { label: 'Purchase Orders' }]}
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-500 rounded-2xl p-5 text-white shadow-lg group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileText className="w-5 h-5 text-blue-50" />
                </div>
                <span className="text-sm font-medium text-blue-50">Total KPI (POs + SQs)</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold leading-none">{kpis.totalOrders}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-wider font-bold opacity-80">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-300" />
                      {kpis.totalRegularPO} Regular
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-300" />
                      {kpis.totalSQ} SQ
                    </span>
                  </div>
                </div>
                <span className="text-xs text-blue-100 bg-blue-700/40 px-2 py-1 rounded-full border border-white/10">Yearly</span>
              </div>
            </div>
          </motion.div>

          {/* Total Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl p-5 text-white shadow-lg group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <DollarSign className="w-5 h-5 text-emerald-50" />
                </div>
                <span className="text-sm font-medium text-emerald-50">Total Value</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold">{formatCurrency(kpis.totalValue)}</p>
                <span className="text-xs text-emerald-100 bg-emerald-600/30 px-2 py-1 rounded-full">Accumulated</span>
              </div>
            </div>
          </motion.div>

          {/* Pending */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl p-5 text-white shadow-lg group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Clock className="w-5 h-5 text-amber-50" />
                </div>
                <span className="text-sm font-medium text-amber-50">Pending</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{kpis.pendingOrders}</p>
                <span className="text-xs text-amber-100 bg-amber-600/30 px-2 py-1 rounded-full">Action required</span>
              </div>
            </div>
          </motion.div>

          {/* Completed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-400 rounded-2xl p-5 text-white shadow-lg group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CheckCircle className="w-5 h-5 text-violet-50" />
                </div>
                <span className="text-sm font-medium text-violet-50">Completed</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{kpis.completedOrders}</p>
                <span className="text-xs text-violet-100 bg-violet-600/30 px-2 py-1 rounded-full">Fully received</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Department Breakdown */}
        {stats?.department_breakdown && stats.department_breakdown.length > 0 && (
          <DepartmentBreakdownTable data={stats.department_breakdown} />
        )}

        <div className="flex flex-col gap-6">
          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-100/50 rounded-2xl w-fit self-center lg:self-start shadow-inner border border-slate-200">
            <button
              onClick={() => {
                setActiveTab('po')
                setPage(1)
              }}
              className={`relative px-6 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl flex items-center gap-2 ${activeTab === 'po' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {activeTab === 'po' && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-100"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <ShoppingCart className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Purchase Orders</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('sq')
                setPage(1)
              }}
              className={`relative px-6 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl flex items-center gap-2 ${activeTab === 'sq' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {activeTab === 'sq' && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-100"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <FileDigit className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Stock Quotations</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="glass-card rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center gap-4 border border-white/40 shadow-xl">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Search PO#, supplier, or medication..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 h-11 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 transition-all text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 xl:flex xl:items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as POStatus | 'all')}
                className="h-11 px-3 bg-slate-50 border-transparent rounded-xl text-sm text-slate-600 focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="partial_received">Partial Received</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={voteCodeFilter}
                onChange={(e) => setVoteCodeFilter(e.target.value)}
                className="h-11 px-3 bg-slate-50 border-transparent rounded-xl text-sm text-slate-600 focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="">All Vote Codes</option>
                {WARRANT_VOTE_CODES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>

              <select
                value={voteActivityFilter}
                onChange={(e) => setVoteActivityFilter(e.target.value)}
                className="h-11 px-3 bg-slate-50 border-transparent rounded-xl text-sm text-slate-600 focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="">All Vote Activities</option>
                {WARRANT_VOTE_ACTIVITIES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-11 px-3 bg-slate-50 border-transparent rounded-xl text-sm text-slate-600 focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {WARRANT_DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setSupplierId('')
                  setVoteCodeFilter('')
                  setVoteActivityFilter('')
                  setCategoryFilter('')
                  setDepartmentFilter('')
                  setPage(1)
                }}
                className="h-11 border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 col-span-2 lg:col-span-4 xl:w-auto lg:col-start-5 xl:col-start-auto"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Loading - show when fetching OR when waiting for session to be ready */}
          {(isLoading || (!isSessionReady && !hasInitialLoad)) && (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          )}

          {/* Error */}
          {!isLoading && hasInitialLoad && error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Failed to load purchase orders</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Table - only show after initial load is complete */}
          {!isLoading && hasInitialLoad && !error && (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                    No orders found matching your filters
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 active:scale-[0.99] transition-transform"
                      onClick={() => navigate(ROUTES.PHARMACY_PO_DETAIL.replace(':id', order.id))}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{order.po_number}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {order.supplier?.company_name || order.manual_supplier_name || 'Unknown Supplier'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Date</p>
                          <p className="text-sm font-medium text-slate-700">{formatDate(order.order_date)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50 mt-2">
                        {order.vote_code && (
                          <Badge variant="gray" className="text-[10px] font-mono bg-slate-100 text-slate-600 border-slate-200">
                            {order.vote_code}
                          </Badge>
                        )}
                        {order.category && (
                          <Badge variant="gray" className="text-[10px] capitalize bg-slate-100 text-slate-600 border-slate-200">
                            {order.category.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>

                      {order.department && (
                        <div className="pb-2">
                          <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            {order.department === 'laboratory_pathology' ? 'Pathologist' : order.department.replace('_', ' ')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Amount</p>
                          <p className="text-lg font-bold text-emerald-600">{formatCurrency(order.total_amount)}</p>
                        </div>
                        <div>
                          {renderStatusBadge(order.status)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block glass-card rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-b border-slate-100 hover:bg-transparent">
                        <TableCell as="th" className="pl-4">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 shadow-sm"
                            checked={orders.length > 0 && selectedIds.length === orders.length}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell as="th" className="font-semibold text-slate-600">Order Date</TableCell>
                        <TableCell as="th" className="font-semibold text-slate-600">{activeTab === 'sq' ? 'SQ Number' : 'PO Number'}</TableCell>
                        <TableCell as="th" className="font-semibold text-slate-600">Supplier</TableCell>
                        <TableCell as="th" className="font-semibold text-slate-600">Vote Code</TableCell>
                        <TableCell as="th" className="font-semibold text-slate-600">Category</TableCell>
                        <TableCell as="th" className="font-semibold text-slate-600">Department</TableCell>
                        {activeTab === 'po' && (
                          <TableCell as="th" className="text-right font-semibold text-slate-600">Total</TableCell>
                        )}
                        <TableCell as="th" className="text-center font-semibold text-slate-600">Status</TableCell>
                        <TableCell as="th" className="text-right font-semibold text-slate-600 pr-4">Actions</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Batch Actions Toolbar */}
                      {selectedIds.length > 0 && (
                        <TableRow className="bg-blue-50/50 border-b border-blue-100 sticky top-0 z-20 backdrop-blur-sm">
                          <TableCell colSpan={activeTab === 'sq' ? 9 : 10} className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-md">
                                  {selectedIds.length} items selected
                                </span>
                                <div className="h-4 w-px bg-blue-200" />
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs gap-1.5 shadow-sm"
                                    onClick={() => setShowBatchApproveDialog(true)}
                                    disabled={!selectedIds.some((id) => orders.find((o) => o.id === id)?.status === 'pending_approval')}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Approve Selected
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs gap-1.5 shadow-sm"
                                    onClick={() => setShowBatchDeleteDialog(true)}
                                    disabled={!selectedIds.some((id) => orders.find((o) => o.id === id)?.status === 'draft')}
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Delete Drafts
                                  </Button>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedIds([])}
                                className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100/50"
                              >
                                Deselect All
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {orders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={activeTab === 'sq' ? 9 : 10} className="text-center py-16">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <div className="p-4 bg-slate-50 rounded-full mb-3">
                                <Search className="w-6 h-6" />
                              </div>
                              <p className="text-lg font-medium text-slate-600">No orders found</p>
                              <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {orders.map((order) => (
                        <TableRow
                          key={order.id}
                          className={`
                          group border-b border-slate-50 hover:bg-slate-50/50 transition-colors
                          ${order.status === 'cancelled' ? 'bg-red-50/20 grayscale-[0.3]' : ''}
                          ${selectedIds.includes(order.id) ? 'bg-blue-50/30' : ''}
                        `}
                        >
                          <TableCell className="pl-4">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              checked={selectedIds.includes(order.id)}
                              onChange={() => handleSelectOne(order.id)}
                            />
                          </TableCell>
                          <TableCell className="text-sm text-slate-500 font-medium">
                            {formatDate(order.order_date)}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => navigate(ROUTES.PHARMACY_PO_DETAIL.replace(':id', order.id))}
                              className="text-sm font-bold text-royal-blue hover:text-blue-700 hover:underline cursor-pointer"
                            >
                              {order.po_number}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm text-slate-700">
                            {order.supplier?.company_name || order.manual_supplier_name || '—'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 font-mono text-xs">
                            {order.vote_code || '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {order.category ? (
                              <Badge variant="gray" className="capitalize bg-slate-100 text-slate-600 border-slate-200">
                                {order.category.replace('_', ' ')}
                              </Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {order.department === 'laboratory_pathology' ? 'Pathologist' : (order.department ? order.department.replace('_', ' ') : '—')}
                          </TableCell>
                          {activeTab === 'po' && (
                            <TableCell className="text-right text-sm font-bold text-slate-700">
                              {formatCurrency(order.total_amount)}
                            </TableCell>
                          )}
                          <TableCell className="text-center">
                            {renderStatusBadge(order.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <button
                              onClick={() => navigate(ROUTES.PHARMACY_PO_DETAIL.replace(':id', order.id))}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination - Shared */}
              {totalPages > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:border-none md:shadow-none md:bg-transparent md:p-0">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={(p) => setPage(p)}
                    onPageSizeChange={(s) => {
                      setPageSize(s)
                      setPage(1)
                    }}
                    className="rounded-xl border-none justify-center px-0 py-0"
                  />
                </div>
              )}
            </>
          )}

          {/* Breakdown Cards in Grid - Hidden for now or keep them? 
            The requirements asked for a lively vibe and revamp. 
            Detailed textual breakdown lists might be clutter. 
            I'll keep them but styled cleanly if they are important.
            The user said "make it look modern", "less confusion". 
            Maybe hiding them or putting them in a collapsible logic or just cleaner grid.
            I will include them but as small "Overview" cards below KPI.
        */}
        </div>

        {/* Batch Dialogs */}
        <ConfirmationDialog
          isOpen={showBatchApproveDialog}
          onClose={() => !isBatchProcessing && setShowBatchApproveDialog(false)}
          onConfirm={handleBatchApprove}
          title="Batch Approval"
          message={`Are you sure you want to approve ${selectedIds.filter(id => orders.find(o => o.id === id)?.status === 'pending_approval').length} selected purchase orders? This will create financial liabilities for each approved order.`}
          variant="success"
          confirmText="Approve All"
          isLoading={isBatchProcessing}
        />

        <ConfirmationDialog
          isOpen={showBatchDeleteDialog}
          onClose={() => !isBatchProcessing && (setShowBatchDeleteDialog(false), setDeleteReason(''))}
          onConfirm={handleBatchDelete}
          title="Batch Delete Drafts"
          message={`Warning: You are about to permanently delete ${selectedIds.filter(id => orders.find(o => o.id === id)?.status === 'draft').length} draft purchase orders. This action cannot be undone.`}
          variant="danger"
          confirmText="Delete Permanently"
          isLoading={isBatchProcessing}
        >
          <div className="space-y-2 mt-2">
            <label className="block text-sm font-medium text-slate-700">
              Type 'DELETE' to confirm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Type DELETE here"
            />
          </div>
        </ConfirmationDialog>
      </div>
    </FinancialPageLayout>
  )
}

export default PurchaseOrderListPage
