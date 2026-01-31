import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'

import {
    Truck,
    AlertTriangle,
    CheckCircle,
    Package,
    RefreshCw,

    ExternalLink,
    Search,
    Info
} from 'lucide-react'
import { format } from 'date-fns'

import { useNavigate } from 'react-router-dom'
import { useToast } from '@/stores/toastStore'
import { orderTrackingService } from '@/services/pharmacy/orderTrackingService'
import { getPurchaseOrderById } from '@/services/pharmacy/procurementService'



// Components
import {
    Badge,
    Button,
    Tabs,
    TabsList,
    TabsTrigger,
    ActionTooltip
} from '@/components/ui'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { POItemsModal } from '@/components/pharmacy/procurement/modals/POItemsModal'
import { DetailedReceivePanel } from '@/components/pharmacy/procurement/modals/DetailedReceivePanel'
import { LPOComparisonModal } from '@/components/pharmacy/procurement/modals/LPOComparisonModal'
import { ReminderModal } from '@/components/pharmacy/procurement/modals/ReminderModal'
import { BellRing } from 'lucide-react'

// --- Sub-components ---

const DeliveryProgressCell = ({ items }: { items: any[] }) => {
    if (!items || items.length === 0) return <span className="text-slate-400">0/0 Items</span>

    const total = items.length
    const delivered = items.filter(i => i.status === 'delivered').length
    const received = items.filter(i => i.status === 'received').length

    const deliveredPercentage = Math.round((delivered / total) * 100)
    const receivedPercentage = Math.round((received / total) * 100)

    const tooltipContent = (
        <div className="p-2 space-y-2 min-w-[200px]">
            <p className="text-xs font-bold border-b border-white/20 pb-1 mb-1">Item Breakdown</p>
            {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] gap-4">
                    <span className="truncate max-w-[100px]">{item.item_code}</span>
                    <Badge
                        variant={item.status === 'delivered' ? 'success' : item.status === 'received' ? 'info' : 'warning'}
                        size="sm"
                        className="scale-90"
                    >
                        {item.status}
                    </Badge>
                </div>
            ))}
        </div>
    )

    return (
        <ActionTooltip content={tooltipContent} position="top">
            <div className="w-full max-w-[140px] cursor-help">
                <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500">{delivered + received}/{total} Arrived</span>
                    <span className="font-bold text-slate-700">{deliveredPercentage + receivedPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-700"
                        style={{ width: `${deliveredPercentage}%` }}
                    />
                    <div
                        className="h-full bg-blue-400 transition-all duration-700"
                        style={{ width: `${receivedPercentage}%` }}
                    />
                </div>
                {received > 0 && (
                    <div className="text-[9px] text-blue-600 font-medium mt-0.5">
                        {received} Pending Verification
                    </div>
                )}
            </div>
        </ActionTooltip>
    )
}

// --- Main Page ---

export default function OrderTrackingPage() {
    const navigate = useNavigate()
    const { error } = useToast()


    // State
    const [lpos, setLpos] = useState<any[]>([])
    const [summary, setSummary] = useState({ total: 0, overdue: 0, partial: 0, pendingToReceive: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('990102') // APPL by default
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Modal State
    const [selectedPo, setSelectedPo] = useState<any>(null)
    const [isPoModalOpen, setIsPoModalOpen] = useState(false)

    // LPO Document Viewer State
    const [lpoViewerData, setLpoViewerData] = useState<{ url: string; poId: string; lpoNumber: string } | null>(null)

    // Receive Modals
    const [selectedLpoForReceive, setSelectedLpoForReceive] = useState<any>(null)

    const [isDetailedReceiveOpen, setIsDetailedReceiveOpen] = useState(false)

    // Reminder Modal
    const [selectedLpoForReminder, setSelectedLpoForReminder] = useState<any>(null)
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)

    useEffect(() => {
        loadTrackingData()
    }, [])

    const loadTrackingData = async () => {
        try {
            setIsLoading(true)
            const summaryData = await orderTrackingService.getActiveLPOsSummary()
            setSummary({
                total: summaryData.total,
                overdue: summaryData.overdue,
                partial: summaryData.partial,
                pendingToReceive: summaryData.pendingToReceive
            })
            setLpos(summaryData.allData)

            // Self-healing: Audit and fix incorrect delivery dates (APPL 0-day bug)
            if (summaryData.allData.length > 0) {
                const fixedCount = await orderTrackingService.auditAndFixTrackingDates(summaryData.allData)
                if (fixedCount > 0) {
                    // Reload data to show corrected values
                    const refreshedData = await orderTrackingService.getActiveLPOsSummary()
                    setLpos(refreshedData.allData)
                    setSummary({
                        total: refreshedData.total,
                        overdue: refreshedData.overdue,
                        partial: refreshedData.partial,
                        pendingToReceive: refreshedData.pendingToReceive
                    })
                }
            }

            // Background check for overdues
            orderTrackingService.checkOverdueItems().catch(console.error)
        } catch (err) {
            console.error('Error loading tracking data:', err)
            error('Failed to load tracking data')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePoClick = async (poId: string) => {
        try {
            const { data, error: poErr } = await getPurchaseOrderById(poId)
            if (poErr) throw new Error(poErr)
            setSelectedPo(data)
            setIsPoModalOpen(true)
        } catch (err) {
            error('Failed to load PO details')
        }
    }

    const handleLpoClick = (lpo: any) => {
        if (lpo.document_url) {
            setLpoViewerData({
                url: lpo.document_url,
                poId: lpo.po_id || lpo.purchase_order?.id,
                lpoNumber: lpo.lpo_number
            })
        } else {
            error('No document found for this LPO')
        }
    }

    // Determine LPO status
    const getLpoStatus = (items: any[]) => {
        if (!items || items.length === 0) return { label: 'Unknown', variant: 'gray' as const }

        const now = new Date()
        const activeItems = items.filter(i => i.status !== 'delivered')
        const hasOverdue = activeItems.some(i => i.is_overdue || new Date(i.expected_delivery_date) < now)

        if (hasOverdue) return { label: 'OVERDUE', variant: 'error' as const }

        const allDelivered = items.every(i => i.status === 'delivered')
        if (allDelivered) return { label: 'DELIVERED', variant: 'success' as const }

        const hasReceived = items.some(i => i.status === 'received')
        const allArrived = items.every(i => i.status === 'delivered' || i.status === 'received')

        if (allArrived && hasReceived) return { label: 'WAIT VERIFY', variant: 'info' as const }
        if (items.some(i => i.status === 'delivered' || i.status === 'received')) return { label: 'PARTIAL', variant: 'info' as const }

        return { label: 'PENDING', variant: 'warning' as const }
    }

    // Filtering & Sorting
    const filteredLpos = useMemo(() => {
        let results = lpos.filter(lpo => {
            // Tab filtering logic
            const poRaw = lpo.purchase_order
            const po = Array.isArray(poRaw) ? poRaw[0] : poRaw
            const vc = po?.vote_code
            if (activeTab === '990102' && vc !== '990102') return false
            if (activeTab === '080702' && vc !== '080702') return false
            if (activeTab === 'other' && (vc === '990102' || vc === '080702')) return false

            // Status filtering logic
            const status = getLpoStatus(lpo.tracking_items)
            if (statusFilter !== 'all' && status.label.toLowerCase() !== statusFilter.toLowerCase()) return false

            const sn = po?.supplier?.company_name || po?.manual_supplier_name || ''
            const ln = lpo.lpo_number || ''
            const pn = po?.po_number || ''

            const hasMatchingItem = po?.items?.some((item: any) =>
                item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
            )

            return ln.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hasMatchingItem
        })

        // Sorting by Est. Delivery (Priority: Overdue -> Soonest -> Future -> Delivered/None)
        return results.sort((a, b) => {
            const getMinDate = (items: any[]) => {
                const pendingItems = items?.filter((i: any) => i.status !== 'delivered') || []
                if (pendingItems.length === 0) return Infinity
                return Math.min(...pendingItems.map((i: any) => new Date(i.expected_delivery_date).getTime()))
            }

            const dateA = getMinDate(a.tracking_items)
            const dateB = getMinDate(b.tracking_items)

            return dateA - dateB
        })
    }, [lpos, searchTerm, activeTab, statusFilter])

    // Pagination
    const paginatedLpos = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredLpos.slice(start, start + pageSize)
    }, [filteredLpos, currentPage, pageSize])

    // Table Columns
    const columns = [
        {
            key: 'po_number',
            label: 'PO Number',
            render: (_: any, lpo: any) => {
                const poRaw = lpo.purchase_order
                const po = Array.isArray(poRaw) ? poRaw[0] : poRaw
                return (
                    <button
                        onClick={() => handlePoClick(lpo.po_id)}
                        className="flex items-center gap-1.5 text-blue-600 font-bold hover:text-blue-800 transition-colors group"
                    >
                        {po?.po_number || 'No PO'}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                )
            }
        },
        {
            key: 'lpo_number',
            label: 'LPO Number',
            render: (_: any, lpo: any) => (
                <button
                    onClick={() => handleLpoClick(lpo)}
                    className="flex flex-col items-start group"
                >
                    <span className="text-slate-900 font-bold group-hover:text-blue-600 transition-colors uppercase">
                        {lpo.lpo_number}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {format(new Date(lpo.document_date || lpo.created_at), 'dd/MM/yyyy')}
                    </span>
                </button>
            )
        },
        {
            key: 'supplier',
            label: 'Supplier',
            render: (_: any, lpo: any) => {
                const poRaw = lpo.purchase_order
                const po = Array.isArray(poRaw) ? poRaw[0] : poRaw
                return (
                    <div className="max-w-[180px]">
                        <div className="text-sm font-medium text-slate-700 truncate">
                            {po?.supplier?.company_name || po?.manual_supplier_name || 'No Supplier'}
                        </div>
                    </div>
                )
            }
        },
        {
            key: 'progress',
            label: 'Delivery Progress',
            render: (_: any, lpo: any) => <DeliveryProgressCell items={lpo.tracking_items || []} />
        },
        {
            key: 'est_delivery',
            label: 'Est. Delivery',
            render: (_: any, lpo: any) => {
                // Get the earliest expected date from items that aren't delivered
                const pendingItems = lpo.tracking_items?.filter((i: any) => i.status !== 'delivered') || []
                if (pendingItems.length === 0) return <span className="text-slate-400">-</span>

                const earliestDate = pendingItems
                    .map((i: any) => new Date(i.expected_delivery_date))
                    .sort((a: any, b: any) => a - b)[0]

                const daysRemaining = Math.ceil((earliestDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

                return (
                    <div>
                        <div className="text-xs font-medium text-slate-700">{format(earliestDate, 'dd/MM/yyyy')}</div>
                        <div className={`text-[10px] ${daysRemaining < 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                        </div>
                    </div>
                )
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: (_: any, lpo: any) => {
                const status = getLpoStatus(lpo.tracking_items)
                return <Badge variant={status.variant} className="font-bold tracking-tight">{status.label}</Badge>
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (_: any, lpo: any) => {
                const status = getLpoStatus(lpo.tracking_items)
                const isDelivered = status.label === 'DELIVERED'

                return (
                    <div className="flex justify-end pr-2 gap-2">
                        {/* Reminder Button for Overdue Items */}
                        {status.label === 'OVERDUE' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 shadow-sm transition-all"
                                onClick={() => {
                                    setSelectedLpoForReminder(lpo)
                                    setIsReminderModalOpen(true)
                                }}
                            >
                                <BellRing className="w-3 h-3 mr-1.5 animate-pulse" />
                                Reminder ({lpo.reminders?.length || 0})
                            </Button>
                        )}

                        <Button
                            variant={isDelivered ? "ghost" : "default"}
                            size="sm"
                            className={`h-8 px-4 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all
                                ${isDelivered
                                    ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
                                }
                            `}
                            onClick={() => {
                                if (!isDelivered) {
                                    navigate(`/pharmacy/procurement/receiving?lpoId=${lpo.id}`)
                                }
                            }}
                            disabled={isDelivered}
                        >
                            {isDelivered ? (
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle className="w-3 h-3" />
                                    Received
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <Package className="w-3 h-3" />
                                    Receive
                                </span>
                            )}
                        </Button>
                    </div>
                )
            }
        }
    ]

    return (
        <FinancialPageLayout
            title="Order Tracking"
            description="LPO-level monitoring and item arrival management"
            icon={Truck}
            breadcrumbs={[{ label: 'Procurement' }, { label: 'Order Tracking' }]}
            actions={
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTrackingData()}
                    disabled={isLoading}
                    className="border-slate-300 hover:bg-slate-50"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            }
        >
            <div className="space-y-6">

                {/* Modern KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1">
                                <p className="text-xs font-semibold text-slate-500 uppercase">Active Tracking</p>
                                <ActionTooltip content="LPOs where the 'Verify' button was clicked and tracking has started.">
                                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                </ActionTooltip>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">{summary.total}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Truck className="w-6 h-6" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1">
                                <p className="text-xs font-semibold text-slate-500 uppercase">Pending to Receive</p>
                                <ActionTooltip content="LPOs currently in transit or waiting to be received.">
                                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                </ActionTooltip>
                            </div>
                            <h3 className="text-2xl font-bold text-cyan-600">{summary.pendingToReceive}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"
                    >
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Partially Received</p>
                            <h3 className="text-2xl font-bold text-amber-600">{summary.partial}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Package className="w-6 h-6" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"
                    >
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Overdue LPOs</p>
                            <h3 className="text-2xl font-bold text-rose-600">{summary.overdue}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </motion.div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                    <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/30">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-fit">
                                <div className="overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
                                    <TabsList className="bg-slate-200/50 p-1 rounded-xl inline-flex w-auto">
                                        <TabsTrigger value="990102" className="px-3 md:px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap text-xs md:text-sm">
                                            APPL (990102)
                                        </TabsTrigger>
                                        <TabsTrigger value="080702" className="px-3 md:px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap text-xs md:text-sm">
                                            CC (080702)
                                        </TabsTrigger>
                                        <TabsTrigger value="other" className="px-3 md:px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap text-xs md:text-sm">
                                            Other
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                            </Tabs>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:justify-end">
                                <div className="relative w-full sm:max-w-[300px] lg:max-w-[500px] group order-2 sm:order-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search orders..."
                                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 shadow-sm group-hover:border-slate-300"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-sm w-full sm:w-auto overflow-x-auto order-1 sm:order-2">
                                    {['all', 'pending', 'overdue'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setStatusFilter(f)}
                                            className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap
                                                ${statusFilter === f
                                                    ? 'bg-slate-900 text-white shadow-md'
                                                    : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table
                            data={paginatedLpos}
                            columns={columns}
                            isLoading={isLoading}
                            emptyMessage="No active orders found for this vote code"
                        />
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden p-4 space-y-4 bg-slate-50/50">
                        {isLoading ? (
                            <div className="text-center py-10 text-slate-400 text-sm">Loading orders...</div>
                        ) : paginatedLpos.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">No active orders found</div>
                        ) : (
                            paginatedLpos.map((lpo, idx) => {
                                const status = getLpoStatus(lpo.tracking_items)
                                const isDelivered = status.label === 'DELIVERED'
                                const poRaw = lpo.purchase_order
                                const po = Array.isArray(poRaw) ? poRaw[0] : poRaw

                                // Calculate days remaining logic reuse
                                const pendingItems = lpo.tracking_items?.filter((i: any) => i.status !== 'delivered') || []
                                let daysRemaining: number | null = null
                                let earliestDate: Date | null = null

                                if (pendingItems.length > 0) {
                                    earliestDate = pendingItems
                                        .map((i: any) => new Date(i.expected_delivery_date))
                                        .sort((a: any, b: any) => a - b)[0]
                                    if (earliestDate) {
                                        daysRemaining = Math.ceil((earliestDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                    }
                                }

                                return (
                                    <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                                        {/* Header: PO & LPO */}
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <button
                                                    onClick={() => handlePoClick(lpo.po_id)}
                                                    className="flex items-center gap-1.5 text-blue-600 font-bold text-sm"
                                                >
                                                    {po?.po_number || 'No PO'}
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleLpoClick(lpo)}
                                                    className="block text-slate-900 font-bold text-xs uppercase hover:text-blue-600 transition-colors"
                                                >
                                                    {lpo.lpo_number}
                                                </button>
                                            </div>
                                            <Badge variant={status.variant} className="shrink-0 text-[10px] px-2 py-0.5 h-auto">
                                                {status.label}
                                            </Badge>
                                        </div>

                                        {/* Supplier */}
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Supplier</p>
                                            <p className="text-sm font-medium text-slate-700 truncate">
                                                {po?.supplier?.company_name || po?.manual_supplier_name || 'No Supplier'}
                                            </p>
                                        </div>

                                        {/* Delivery Info Grid */}
                                        <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-3">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Items</p>
                                                <DeliveryProgressCell items={lpo.tracking_items || []} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Est. Arrival</p>
                                                {earliestDate ? (
                                                    <div>
                                                        <div className="text-xs font-medium text-slate-700">{format(earliestDate, 'dd/MM/yyyy')}</div>
                                                        <div className={`text-[10px] ${daysRemaining! < 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                                                            {daysRemaining! < 0 ? `${Math.abs(daysRemaining!)}d overdue` : `${daysRemaining}d left`}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                                            {status.label === 'OVERDUE' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 h-9 font-bold text-[10px] uppercase text-amber-600 border-amber-200 bg-amber-50"
                                                    onClick={() => {
                                                        setSelectedLpoForReminder(lpo)
                                                        setIsReminderModalOpen(true)
                                                    }}
                                                >
                                                    <BellRing className="w-3 h-3 mr-1.5" />
                                                    Remind
                                                </Button>
                                            )}

                                            <Button
                                                variant={isDelivered ? "ghost" : "default"}
                                                size="sm"
                                                className={`flex-1 h-9 font-bold text-[10px] uppercase
                                                    ${isDelivered
                                                        ? 'bg-slate-50 text-slate-400 border border-slate-200'
                                                        : 'bg-emerald-600 text-white'
                                                    }
                                                `}
                                                onClick={() => {
                                                    if (!isDelivered) {
                                                        navigate(`/pharmacy/procurement/receiving?lpoId=${lpo.id}`)
                                                    }
                                                }}
                                                disabled={isDelivered}
                                            >
                                                {isDelivered ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3 mr-1.5" /> Received
                                                    </>
                                                ) : (
                                                    <>
                                                        <Package className="w-3 h-3 mr-1.5" /> Receive
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
                        <div className="text-xs text-slate-500 hidden sm:block">
                            Showing {Math.min(filteredLpos.length, (currentPage - 1) * pageSize + 1)} to {Math.min(filteredLpos.length, currentPage * pageSize)} of {filteredLpos.length} entries
                        </div>
                        <div className="w-full sm:w-auto flex justify-center">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredLpos.length / pageSize)}
                                pageSize={pageSize}
                                total={filteredLpos.length}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(size) => {
                                    setPageSize(size)
                                    setCurrentPage(1)
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <POItemsModal
                isOpen={isPoModalOpen}
                onClose={() => setIsPoModalOpen(false)}
                po={selectedPo}
            />

            <LPOComparisonModal
                isOpen={!!lpoViewerData}
                onClose={() => setLpoViewerData(null)}
                lpoDocumentUrl={lpoViewerData?.url || ''}
                poId={lpoViewerData?.poId || ''}
                lpoNumber={lpoViewerData?.lpoNumber || ''}
            />

            <DetailedReceivePanel
                isOpen={isDetailedReceiveOpen}
                onClose={() => {
                    setIsDetailedReceiveOpen(false)
                    setSelectedLpoForReceive(null)
                }}
                lpo={selectedLpoForReceive}
                onSuccess={() => {
                    loadTrackingData()
                }}
            />

            <ReminderModal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
                lpo={selectedLpoForReminder}
                onSuccess={loadTrackingData}
            />

        </FinancialPageLayout>
    )
}
