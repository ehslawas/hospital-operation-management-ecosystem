// @ts-nocheck
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'

import { 
  IconAlertTriangle, 
  IconSearch, 
  IconFilter, 
  IconRefreshCw,
  IconClock,
  IconFileText
} from '@/components/ui/Icons'
import { getPenalties, getPenaltyStats, updatePenaltyStatus, deletePenalty } from '@/services/pharmacy/penaltyService'
import type { SupplierPenalty } from '@/types/pharmacy'
import { useAuthStore } from '@/stores/authStore'
import { Spinner, Input, Select, SlideOver } from '@/components/ui'
import { PurchaseOrderDetailView } from './PurchaseOrderDetailView'
import { cn, formatCurrency } from '@/lib/utils'
import { useToast } from '@/stores/toastStore'
import { ChevronRight, Sparkles, DollarSign, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PenaltyPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const toast = useToast()
  const hospitalId = user?.hospital_id

  const [penalties, setPenalties] = useState<SupplierPenalty[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'all' | 'appl' | 'cc'>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (hospitalId) {
      loadData()
    }
  }, [hospitalId, statusFilter, activeTab])

  const loadData = async () => {
    if (!hospitalId) return
    setIsLoading(true)
    
    try {
      const filter: any = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined
      }

      if (activeTab !== 'all') {
        filter.penalty_type = activeTab
      }

      const [penaltiesRes, statsRes] = await Promise.all([
        getPenalties(hospitalId, filter, 1, 50),
        getPenaltyStats(hospitalId)
      ])

      if (penaltiesRes.data) {
        setPenalties(penaltiesRes.data)
      }
      if (statsRes.data) {
        setStats(statsRes.data)
      }
    } catch (error) {
      console.error('Failed to load penalties', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadData()
  }

  const handleStatusUpdate = async (id: string, newStatus: any, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row click navigation
    if (!user?.id) return
    
    try {
      let reason = undefined
      if (newStatus === 'waived') {
        const input = window.prompt('Please enter a reason for rejecting/waiving this penalty:')
        if (input === null) return // User cancelled
        reason = input
      }

      const res = await updatePenaltyStatus(id, newStatus, user.id, reason)
      if (res.error) throw new Error(res.error)
      
      const friendlyStatus = newStatus === 'enforced' ? 'Submitted' : newStatus === 'waived' ? 'Rejected' : newStatus
      toast.success(`Penalty marked as ${friendlyStatus}`)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update penalty')
    }
  }

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row click navigation
    if (!user?.id) return

    const confirmDelete = window.confirm('Are you sure you want to delete this penalty record? This action cannot be undone.')
    if (!confirmDelete) return

    const reason = window.prompt('Please enter a reason for deleting this penalty record:')
    if (reason === null) return // User cancelled
    if (reason.trim() === '') {
      toast.error('Deletion reason is required to delete a penalty record.')
      return
    }

    try {
      const res = await deletePenalty(id, user.id, reason)
      if (res.error) throw new Error(res.error)

      toast.success('Penalty record deleted successfully')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete penalty')
    }
  }

  const renderStatusBadge = (status: string) => {
    const normStatus = status?.toLowerCase() || ''
    switch (normStatus) {
      case 'pending': // DB status 'pending' maps to 'Draft' in UI
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Draft
          </span>
        )
      case 'enforced': // DB status 'enforced' maps to 'Pending' in UI
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-755 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        )
      case 'approved': // DB status 'approved' maps to 'Approved' in UI
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-705 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Approved
          </span>
        )
      case 'waived': // DB status 'waived' maps to 'Rejected' in UI
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-750 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-650" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            {status?.toUpperCase()}
          </span>
        )
    }
  }

  const renderContractCategory = (type: string) => {
    const normType = type?.toLowerCase() || ''
    if (normType === 'appl') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-755 border border-indigo-200 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
          APPL (990102)
        </span>
      )
    }
    if (normType === 'cc') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-755 border border-violet-200 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
          CC (080702)
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        {type?.toUpperCase() || 'DIRECT PURCHASE'}
      </span>
    )
  }

  const handleRowClick = (id: string) => {
    navigate(ROUTES.PHARMACY_PENALTY_DETAIL.replace(':id', id))
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden font-sans selection:bg-slate-900 selection:text-white">
      {/* Premium Ambient Radial Lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/[0.04] to-purple-500/[0.02] rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/[0.02] to-teal-500/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-6">
        {/* Enhanced Breadcrumb navigation */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="text-slate-400">Financial</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400">Procurement</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-extrabold tracking-wide">Penalty Management</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-955 border border-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
              <IconAlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-955 to-slate-900">
                Penalty Management
              </h1>
              <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Dual-Type Penalty Enforcement System (APPL 990102 & CC 080702)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={loadData}
              className="p-2 h-10 w-10 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm hover:border-slate-300"
              title="Refresh"
            >
              <IconRefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* KPI Section with Premium Style */}
        {stats && (
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl mb-10 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Total Violations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="bg-slate-50/30 border border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/[0.02] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm">
                    <IconAlertTriangle className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Breaches</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                      {stats.total || 0}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400">Identified deliveries</p>
                  </div>
                </div>
              </motion.div>

              {/* Drafts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-slate-50/20 border border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm">
                    <IconFileText className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Drafts</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                      {stats.pending || 0}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400">Under preparation</p>
                  </div>
                </div>
              </motion.div>

              {/* Pending Approval */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="bg-amber-50/10 border border-amber-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-amber-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white border border-amber-100 rounded-2xl flex items-center justify-center text-amber-700 shadow-sm">
                    <IconClock className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending Approval</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-amber-955 tracking-tight tabular-nums animate-pulse">
                      {stats.enforced || 0}
                    </h3>
                    <p className="text-[11px] font-bold text-amber-600">Awaiting HoD review</p>
                  </div>
                </div>
              </motion.div>

              {/* Approved Fines Value */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-indigo-50/10 border border-indigo-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 shadow-sm">
                    <DollarSign className="w-6 h-6 text-indigo-650" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Approved Fines Value</p>
                    <h3 className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight tabular-nums truncate">
                      {formatCurrency(Number((stats.appl_amount || 0) + (stats.cc_amount || 0)))}
                    </h3>
                    <p className="text-[11px] font-bold text-indigo-600">{stats.approved || 0} Approved penalties</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Premium Type Tabs Selector */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 border border-slate-200/50 rounded-2xl w-fit relative z-20">
          {[
            { id: 'all', label: 'All Penalty Records' },
            { id: 'appl', label: 'APPL Penalty (990102)' },
            { id: 'cc', label: 'CC Penalty (080702)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 relative",
                activeTab === tab.id 
                  ? "bg-white text-indigo-955 shadow-sm border border-slate-200/30" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-xl overflow-hidden relative">
          <div>
            {/* Filters Row */}
            <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200/60 shadow-sm mb-6">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div className="lg:col-span-3 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search</label>
                  <div className="relative">
                    <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="text"
                      placeholder="Search by Supplier, PO, LPO or Item Name..."
                      className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-100 transition-all outline-none"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <div className="relative">
                    <IconFilter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                    <Select 
                      className="pl-11 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-rose-100 transition-all outline-none"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Draft</option>
                      <option value="enforced">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="waived">Rejected</option>
                    </Select>
                  </div>
                </div>
              </form>
            </div>

            {/* Table Area - Desktop Table */}
            <div className="hidden lg:block overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">LPO/PO</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">DO Number</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Penalty Type</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Supplier & Item Details</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Delays</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Penalty Amount</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Status</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Spinner size="lg" className="mb-4" />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading records...</p>
                        </div>
                      </td>
                    </tr>
                  ) : penalties.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-8 py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <IconAlertTriangle className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No penalties found</p>
                      </td>
                    </tr>
                  ) : (
                    penalties.map((penalty) => (
                      <tr 
                        key={penalty.id} 
                        onClick={() => handleRowClick(penalty.id)}
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-5">
                          <div className="text-sm font-bold text-slate-900">
                            {new Date(penalty.created_at || penalty.issue_date).toLocaleDateString('en-MY', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-5" onClick={e => e.stopPropagation()}>
                          <div className="flex flex-col items-start gap-1.5">
                            {penalty.po_id ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedOrderId(penalty.po_id!)
                                }}
                                className="group/link inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-[10px] font-bold transition-all w-fit text-left"
                              >
                                <span className="text-slate-400 group-hover/link:text-rose-400 font-mono text-[9px] uppercase tracking-wider">PO:</span>
                                <span className="font-mono">{penalty.purchase_order?.po_number || 'â€”'}</span>
                              </button>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-[10px] font-bold w-fit">
                                <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider">PO:</span>
                                <span className="font-mono">{penalty.purchase_order?.po_number || 'â€”'}</span>
                              </div>
                            )}
                            {penalty.lpo?.lpo_number && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/60 text-indigo-700 border border-indigo-100/80 rounded-lg text-[10px] font-bold w-fit">
                                <span className="text-indigo-400 font-mono text-[9px] uppercase tracking-wider">LPO:</span>
                                <span className="font-mono">{penalty.lpo.lpo_number}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {(penalty.goods_receipt?.delivery_note_number || (penalty as any).receiving?.do_number) ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                              <IconFileText className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono uppercase">
                                {penalty.goods_receipt?.delivery_note_number || (penalty as any).receiving?.do_number}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-bold font-mono">â€”</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          {renderContractCategory(penalty.penalty_type)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1 max-w-[280px]">
                            <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-650 transition-colors truncate" title={penalty.supplier?.company_name}>
                              {penalty.supplier?.company_name || 'â€”'}
                            </div>
                            {penalty.item_name && (
                              <div className="text-[11px] font-semibold text-slate-600 truncate leading-relaxed flex items-center gap-1" title={penalty.item_name}>
                                <span className="truncate">{penalty.item_name}</span>
                                {penalty.item_code && <span className="text-[9px] font-mono text-slate-500 shrink-0">({penalty.item_code})</span>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full text-rose-700 shadow-sm">
                            <IconClock className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-xs font-black tracking-tight">{penalty.days_delayed || 0} Days</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-sm font-extrabold text-rose-600 font-mono tracking-tight">
                              {penalty.penalty_amount ? formatCurrency(Number(penalty.penalty_amount)) : 'RM 0.00'}
                            </span>
                            {(penalty as any).selected_penalty_type === 'minimum' && (
                              <span className="text-[8px] font-black text-rose-500 bg-rose-50/50 border border-rose-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                MIN FINE APPLIED
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {renderStatusBadge(penalty.status)}
                        </td>
                        <td className="px-6 py-5">
                          {penalty.penalty_paid ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-705 border border-emerald-250 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-750 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-650" />
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {penalty.status === 'pending' && (
                              <>
                                <button
                                  onClick={(e) => handleStatusUpdate(penalty.id, 'enforced', e)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200"
                                >
                                  Submit
                                </button>
                                <button
                                  onClick={(e) => handleStatusUpdate(penalty.id, 'waived', e)}
                                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-650 border border-rose-200 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleRowClick(penalty.id)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200"
                            >
                              Process
                            </button>
                            <button
                              onClick={(e) => handleDelete(penalty.id, e)}
                              className="p-1.5 bg-white hover:bg-rose-50 text-rose-650 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-lg transition-all duration-200"
                              title="Delete Duplicate/Incorrect Penalty"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards */}
            <div className="lg:hidden space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Spinner size="lg" className="mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing penalties...</p>
                </div>
              ) : penalties.length === 0 ? (
                <div className="bg-slate-50 rounded-[2rem] p-12 text-center border border-dashed border-slate-200">
                  <IconAlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No penalties identified</p>
                </div>
              ) : (
                penalties.map((penalty) => (
                  <div 
                    key={penalty.id} 
                    onClick={() => handleRowClick(penalty.id)}
                    className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all space-y-5 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                          <IconAlertTriangle className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Procurement Type</span>
                          {renderContractCategory(penalty.penalty_type)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {renderStatusBadge(penalty.status)}
                        {penalty.penalty_paid ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-705 border border-emerald-250 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-750 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-650" />
                            Unpaid
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-55">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Supplier & Item</span>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight mb-0.5">{penalty.supplier?.company_name}</h4>
                        {penalty.item_name && (
                          <p className="text-[10px] font-semibold text-slate-600 leading-normal">{penalty.item_name}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Issue Date</span>
                          <p className="text-xs font-bold text-slate-800">
                            {new Date(penalty.created_at || penalty.issue_date).toLocaleDateString('en-MY', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">DO Number</span>
                          <p className="text-xs font-mono font-bold text-slate-700 uppercase">
                            {penalty.goods_receipt?.delivery_note_number || (penalty as any).receiving?.do_number || 'â€”'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">LPO/PO Reference</span>
                          <div className="flex flex-col gap-1 items-start mt-0.5" onClick={e => e.stopPropagation()}>
                            {penalty.po_id ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedOrderId(penalty.po_id!)
                                }}
                                className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-mono font-bold text-slate-650 hover:text-rose-600 text-left"
                              >
                                PO: {penalty.purchase_order?.po_number}
                              </button>
                            ) : (
                              <span className="text-xs font-mono font-bold text-slate-600">
                                PO: {penalty.purchase_order?.po_number || 'â€”'}
                              </span>
                            )}
                            {penalty.lpo?.lpo_number && (
                              <span className="px-2 py-0.5 bg-indigo-50/50 border border-indigo-100 rounded text-[9px] font-mono font-bold text-indigo-700">
                                LPO: {penalty.lpo.lpo_number}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Penalty Amount</span>
                          <p className="text-sm font-extrabold text-rose-600 font-mono tracking-tight leading-none mt-1">
                            {penalty.penalty_amount ? formatCurrency(Number(penalty.penalty_amount)) : 'RM 0.00'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-55" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <IconClock className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-black text-rose-600">{penalty.days_delayed || 0} Days Late</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {penalty.status === 'pending' && (
                          <>
                            <button
                              onClick={(e) => handleStatusUpdate(penalty.id, 'waived', e)}
                              className="px-3 py-1.5 bg-white text-rose-650 border border-rose-200 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-rose-50"
                            >
                              Reject
                            </button>
                            <button
                              onClick={(e) => handleStatusUpdate(penalty.id, 'enforced', e)}
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm transition-all hover:bg-indigo-700"
                            >
                              Submit
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleRowClick(penalty.id)}
                          className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-slate-950"
                        >
                          Process
                        </button>
                        <button
                          onClick={(e) => handleDelete(penalty.id, e)}
                          className="p-1.5 bg-white text-rose-650 border border-rose-200 rounded-lg transition-all hover:bg-rose-50"
                          title="Delete Duplicate/Incorrect Penalty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination / Total Indicator */}
            {penalties.length > 0 && (
              <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-8 h-px bg-slate-100"></span>
                  Showing <span className="text-rose-600 font-black">{penalties.length}</span> {activeTab.toUpperCase()} Penalty Records
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <SlideOver
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        title="Purchase Order Details"
        size="5xl"
      >
        {selectedOrderId && (
          <PurchaseOrderDetailView 
            id={selectedOrderId} 
            isSlideOver={true} 
            onClose={() => setSelectedOrderId(null)} 
            onMutate={() => {
              void loadData()
            }}
          />
        )}
      </SlideOver>
    </div>
  )
}
