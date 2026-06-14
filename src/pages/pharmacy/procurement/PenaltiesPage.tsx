import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Badge,
    Input,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Textarea,
    Checkbox
} from '@/components/ui'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    Search,
    Download,
    XCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    FileText,
    History,
    Info
} from 'lucide-react'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { penaltyService } from '@/services/pharmacy/penaltyService'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { APPLPenaltyForm } from '@/components/pharmacy/penalties/APPLPenaltyForm'
import { CCPenaltyFormNew } from '@/components/pharmacy/penalties/CCPenaltyFormNew'
import { performanceStandardsService } from '@/services/pharmacy/performanceStandardsService'
import type { PerformanceStandard, PenaltyType } from '@/types/pharmacy/procurementNew'

interface PenaltyRecord {
    id: string
    lpo_id: string
    order_tracking_id: string
    item_name?: string
    item_code?: string
    item_type?: string
    quantity: number
    unit_price: number
    days_overdue: number
    penalty_rate: number
    penalty_amount: number
    status: 'pending' | 'approved' | 'waived' | 'paid'
    waiver_reason?: string
    approved_by?: string
    approved_at?: string
    created_at: string
    // Payment details
    payment_method?: string
    payment_reference?: string
    payment_date?: string
    penalty_paid?: boolean

    lpo?: {
        id: string
        lpo_number: string
        expected_delivery_date?: string
        document_date?: string
        purchase_order?: {
            id: string
            po_number: string
            order_date?: string
            vote_code?: string
            vote_activity?: string
            category?: string
            department?: string
            supplier?: {
                id: string
                company_name: string
            }
            manual_supplier_name?: string
        }
    }
    order_tracking?: {
        id: string
        actual_delivery_date?: string
        item_name?: string
        item_code?: string
    }
}

interface PenaltySummary {
    total_pending: number
    total_approved: number
    total_waived: number
    total_paid: number
    count_pending: number
    count_approved: number
    count_waived: number
    count_paid: number
}

const MOCK_PENALTIES: PenaltyRecord[] = [
    {
        id: '00000000-0000-0000-0000-000000000001',
        lpo_id: 'lpo-123',
        order_tracking_id: 'ot-123',
        item_name: 'Paracetamol 500mg Tablet (MOCK DATA)',
        item_code: 'PHA-001',
        item_type: 'Medicine',
        quantity: 1000,
        unit_price: 0.50,
        days_overdue: 5,
        penalty_rate: 0.001,
        penalty_amount: 2.50,
        status: 'pending',
        created_at: new Date().toISOString(),
        lpo: {
            id: 'lpo-123',
            lpo_number: 'LPO/2024/001',
            expected_delivery_date: '2024-03-25',
            document_date: '2024-03-15',
            purchase_order: {
                id: 'po-1',
                po_number: 'PO/2024/001',
                order_date: '2024-03-10',
                supplier: {
                    id: 'sup-1',
                    company_name: 'PharmaCorp Malaysia'
                },
                vote_code: '990102', // APPL Code
                vote_activity: '27401',
                category: 'APPL',
                department: 'Pharmacy'
            }
        },
        order_tracking: {
            id: 'ot-1',
            actual_delivery_date: '2024-03-30',
            item_name: 'Paracetamol 500mg Tablet',
            item_code: 'PHA-001'
        }
    },
    {
        id: '00000000-0000-0000-0000-000000000002',
        lpo_id: 'lpo-456',
        order_tracking_id: 'ot-456',
        item_name: 'Amoxicillin 250mg Capsules',
        item_code: 'AMX-250',
        item_type: 'Medicine',
        quantity: 500,
        unit_price: 1.20,
        days_overdue: 12,
        penalty_rate: 0.001,
        penalty_amount: 7.20,
        status: 'approved',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lpo: {
            id: 'lpo-456',
            lpo_number: 'LPO/2024/789',
            expected_delivery_date: '2024-06-10',
            document_date: '2024-05-20',
            purchase_order: {
                id: 'po-456',
                po_number: 'PO/KL/2024/1122',
                order_date: '2024-05-15',
                supplier: {
                    id: 'sup-456',
                    company_name: 'Apex Pharmacy Marketing Sdn Bhd'
                },
                vote_code: '080702', // CC Code
                vote_activity: '27401',
                category: 'KONTRAK PUSAT', // Central Contract
                department: 'Pharmacy'
            }
        },
        order_tracking: {
            id: 'ot-456',
            actual_delivery_date: '2024-06-22',
            item_name: 'Amoxicillin 250mg Capsules',
            item_code: 'AMX-250'
        }
    }
]

const isMockId = (id: string) => id.startsWith('00000000-0000-0000-0000-00000000000')

export default function PenaltiesPage() {
    // State
    const { user } = useAuthStore()
    const [performanceStandards, setPerformanceStandards] = useState<PerformanceStandard[]>([])
    const [penalties, setPenalties] = useState<PenaltyRecord[]>([])
    const [summary, setSummary] = useState<PenaltySummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(15)

    // Dialog states
    const [waiveDialogOpen, setWaiveDialogOpen] = useState(false)
    const [waivePenaltyId, setWaivePenaltyId] = useState<string | null>(null)
    const [waiveReason, setWaiveReason] = useState('')

    // Detail Modal State
    const [selectedPenalty, setSelectedPenalty] = useState<any>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    // Date range filter states
    const [isProcessing, setIsProcessing] = useState(false)

    // Load data
    useEffect(() => {
        loadData()
    }, [statusFilter])

    // Load performance standards on mount
    useEffect(() => {
        const loadStandards = async () => {
            try {
                const standards = await performanceStandardsService.getAll(user?.hospital_id)
                setPerformanceStandards(standards)
            } catch (error) {
                console.error('Error loading performance standards:', error)
            }
        }
        void loadStandards()
    }, [user?.hospital_id])

    const { success, error: toastError, warning, info } = useToast()

    const showToast = (title: string, message?: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        if (type === 'success') return success(title, message)
        if (type === 'error') return toastError(title, message)
        if (type === 'warning') return warning(title, message)
        return info(title, message)
    }

    const loadData = async () => {
        setLoading(true)
        try {
            const [penaltiesData, summaryData] = await Promise.all([
                penaltyService.getAllPenaltiesWithRelations(
                    statusFilter !== 'all' ? { status: statusFilter } : undefined
                ),
                penaltyService.getPenaltySummary()
            ])

            let combinedPenalties = penaltiesData

            // If database is empty, use mock data so user can see how it looks
            if (penaltiesData.length === 0) {
                combinedPenalties = MOCK_PENALTIES
            }

            setPenalties(combinedPenalties)

            if (summaryData && penaltiesData.length > 0) {
                setSummary(summaryData)
            } else if (penaltiesData.length === 0) {
                // Manually calculate summary for mock data
                setSummary({
                    total_pending: 2.50,
                    total_approved: 7.20,
                    total_waived: 0,
                    total_paid: 0,
                    count_pending: 1,
                    count_approved: 1,
                    count_waived: 0,
                    count_paid: 0
                })
            }
        } catch (error) {
            console.error('Failed to load penalties:', error)
            toastError('Failed to load penalty records')
            // Fallback to mock data on error so user can still see something
            if (penalties.length === 0) {
                setPenalties(MOCK_PENALTIES)
                setSummary({
                    total_pending: 2.50,
                    total_approved: 7.20,
                    total_waived: 0,
                    total_paid: 0,
                    count_pending: 1,
                    count_approved: 1,
                    count_waived: 0,
                    count_paid: 0
                })
            }
        } finally {
            setLoading(false)
        }
    }

    // Determine penalty type based on vote code
    const getPenaltyType = (penalty: PenaltyRecord): PenaltyType => {
        const voteCode = penalty.lpo?.purchase_order?.vote_code
        // Check for APPL vote code 990102
        if (voteCode === '990102') {
            return 'appl'
        }
        return 'cc'
    }

    const handleApprove = async () => {
        if (!selectedPenalty) return

        setIsProcessing(true)
        try {
            if (!isMockId(selectedPenalty.id)) {
                await penaltyService.updatePenaltyStatus(selectedPenalty.id, 'approved')
            } else {
                showToast('Demo Mode', 'Process is simulated for mock data. No real changes made.', 'info')
            }

            if (!isMockId(selectedPenalty.id)) {
                showToast('Success', 'Penalty processed for payment deduction', 'success')
            }

            setIsDetailModalOpen(false)
            await loadData()
        } catch (error) {
            console.error('Failed to approve penalty:', error)
            showToast('Error', 'Failed to process penalty', 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    // Filtered penalties
    const filteredPenalties = useMemo(() => {
        return penalties.filter(p => {
            const itemName = p.order_tracking?.item_name || p.item_name || ''
            const matchesSearch = searchQuery === '' ||
                itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.lpo?.lpo_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.lpo?.purchase_order?.po_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.lpo?.purchase_order?.manual_supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.lpo?.purchase_order?.supplier?.company_name || p.lpo?.purchase_order?.manual_supplier_name)?.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesSearch
        })
    }, [penalties, searchQuery])

    // Pagination
    const totalPages = Math.ceil(filteredPenalties.length / itemsPerPage)
    const paginatedPenalties = filteredPenalties.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(paginatedPenalties.filter(p => p.status === 'pending').map(p => p.id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id])
        } else {
            setSelectedIds(selectedIds.filter(i => i !== id))
        }
    }

    // Actions
    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return
        setIsProcessing(true)
        try {
            await penaltyService.bulkApprove(selectedIds)
            setSelectedIds([])
            await loadData()
        } catch (error) {
            console.error('Failed to approve penalties:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleWaive = async () => {
        if (!waivePenaltyId || !waiveReason.trim()) return
        setIsProcessing(true)
        try {
            await penaltyService.waivePenalty(waivePenaltyId, waiveReason)
            setWaiveDialogOpen(false)
            setWaivePenaltyId(null)
            setWaiveReason('')
            await loadData()
        } catch (error) {
            console.error('Failed to waive penalty:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    // Days late severity
    const getDaysLateBadge = (daysLate: number) => {
        if (daysLate <= 7) return <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-100">{daysLate} days</Badge>
        if (daysLate <= 14) return <Badge variant="warning" className="bg-orange-50 text-orange-700 border-orange-100">{daysLate} days</Badge>
        return <Badge variant="error" className="bg-red-50 text-red-700 border-red-100">{daysLate} days</Badge>
    }

    // Status badge renderer
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                        PENDING
                    </div>
                )
            case 'approved':
                return (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
                        APPROVED
                    </div>
                )
            case 'waived':
                return (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5" />
                        WAIVED
                    </div>
                )
            case 'paid':
                return (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        COLLECTED
                    </div>
                )
            default:
                return <Badge variant="gray">{status.toUpperCase()}</Badge>
        }
    }

    return (
        <FinancialPageLayout
            title="Late Delivery Penalties"
            description="Manage and track Liquidated Ascertained Damages (LAD) for delayed contract fulfillments."
            icon={AlertTriangle}
            breadcrumbs={[{ label: 'Procurement' }, { label: 'Penalties' }]}
            actions={
                <Button variant="outline" className="gap-2 h-10 border-slate-200">
                    <Download className="w-4 h-4" />
                    Export Report
                </Button>
            }
        >
            <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-xl shadow-amber-900/10 relative overflow-hidden group hover:shadow-2xl hover:shadow-amber-900/20 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/15 transition-all" />
                            <CardContent className="p-6 relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                    <Badge className="bg-white/20 text-white border-none backdrop-blur-sm">
                                        {summary?.count_pending || 0} items
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-amber-100 font-medium text-sm tracking-wide">Pending Review</p>
                                    <h3 className="text-3xl font-bold tracking-tight text-white">
                                        {formatCurrency(summary?.total_pending || 0)}
                                    </h3>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-white border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 h-full w-1 bg-blue-500 rounded-l-full opacity-60 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                                        <CheckCircle className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Approved</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 font-medium text-sm tracking-wide">Total Issued</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                                            {formatCurrency(summary?.total_approved || 0)}
                                        </h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-white border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 h-full w-1 bg-slate-400 rounded-l-full opacity-60 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <XCircle className="w-6 h-6 text-slate-500" />
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Waived</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 font-medium text-sm tracking-wide">Total Waived</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                                            {formatCurrency(summary?.total_waived || 0)}
                                        </h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="bg-white border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500 rounded-l-full opacity-60 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <DollarSign className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Collected</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 font-medium text-sm tracking-wide">Total Collected</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                                            {formatCurrency(summary?.total_paid || 0)}
                                        </h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Search & Filter Area */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100"
                >
                    <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Search by item, LPO, supplier..."
                            className="pl-12 h-12 bg-transparent border-none shadow-none focus-visible:ring-0 text-base"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto px-2">
                        <div className="flex items-center gap-2 h-10 px-3 bg-slate-50 rounded-xl border border-slate-100">
                            <History className="w-4 h-4 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="bg-transparent text-sm font-medium text-slate-600 focus:outline-none cursor-pointer pr-2"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="waived">Waived</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-6 rounded-xl shadow-lg shadow-slate-200 font-medium">
                            Apply
                        </Button>
                    </div>
                </motion.div>

                {/* Bulk Actions */}
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{selectedIds.length} item(s) selected</p>
                                        <p className="text-blue-100 text-xs text-center sm:text-left">Perform batch approval for these penalties.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button
                                        onClick={handleBulkApprove}
                                        disabled={isProcessing}
                                        className="flex-1 sm:flex-initial bg-white text-blue-600 hover:bg-blue-50 font-bold h-11 px-6 rounded-xl transition-all"
                                    >
                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
                                        Approve Selected
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSelectedIds([])}
                                        className="flex-1 sm:flex-initial text-white hover:bg-white/10 font-medium h-11"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Record Table */}
                <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-2xl bg-white">
                    <CardHeader className="bg-white border-b border-slate-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <History className="w-5 h-5 text-blue-500" />
                                Penalty Records
                            </CardTitle>
                            <Badge variant="gray" className="font-mono text-[10px] text-slate-400">
                                {filteredPenalties.length} TOTAL
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow hoverable={false} className="border-b border-slate-100">
                                    <TableHead className="w-14 pl-6" align="left">
                                        <Checkbox
                                            checked={selectedIds.length === paginatedPenalties.filter(p => p.status === 'pending').length && selectedIds.length > 0}
                                            onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                                        />
                                    </TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4" align="left">Reference No.</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4" align="left">Beneficiary</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4" align="center">Delayed</TableHead>
                                    <TableHead className="w-[100px] text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Penalty
                                    </TableHead>
                                    <TableHead className="w-[100px] text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow hoverable={false}>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                                <p className="text-slate-400 font-medium">Synchronizing records...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedPenalties.length === 0 ? (
                                    <TableRow hoverable={false}>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                    <FileText className="w-10 h-10 text-slate-200" />
                                                </div>
                                                <h3 className="text-lg font-medium text-slate-900">No penalties found</h3>
                                                <p className="text-slate-500">Records will appear here once late deliveries are detected.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedPenalties.map((penalty) => (
                                        <TableRow
                                            key={penalty.id}
                                            className="group hover:bg-blue-50/50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer"
                                            onClick={() => {
                                                setSelectedPenalty(penalty)
                                                setIsDetailModalOpen(true)
                                            }}
                                        >
                                            <TableCell className="w-14 pl-6" align="left">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    {penalty.status === 'pending' && (
                                                        <Checkbox
                                                            checked={selectedIds.includes(penalty.id)}
                                                            onCheckedChange={(checked: boolean) => handleSelectOne(penalty.id, checked)}
                                                        />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell align="left">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-gray-700 font-mono tracking-tight group-hover:text-blue-600 transition-colors">
                                                        {penalty.lpo?.lpo_number || 'N/A'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-wide">
                                                        <span>INV: {penalty.order_tracking?.item_code || penalty.item_code || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell align="left">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0 group-hover:bg-blue-100 group-hover:border-blue-200 group-hover:text-blue-700 transition-all">
                                                        {(penalty.lpo?.purchase_order?.supplier?.company_name || penalty.lpo?.purchase_order?.manual_supplier_name)?.charAt(0) || 'S'}
                                                    </div>
                                                    <div className="flex flex-col max-w-[200px]">
                                                        <span className="font-semibold text-gray-900 truncate text-sm">
                                                            {penalty.lpo?.purchase_order?.supplier?.company_name || penalty.lpo?.purchase_order?.manual_supplier_name || 'N/A'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 truncate uppercase mt-0.5">
                                                            {penalty.order_tracking?.item_name || penalty.item_name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell align="center">
                                                {getDaysLateBadge(penalty.days_overdue || (penalty as any).days_late)}
                                            </TableCell>
                                            <TableCell align="right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-red-600 text-base">
                                                        {(penalty.penalty_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">MYR</span>
                                                </div>
                                            </TableCell>
                                            <TableCell align="center">
                                                {renderStatusBadge(penalty.status)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {!loading && filteredPenalties.length > 0 && totalPages > 1 && (
                    <div className="px-6 py-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between mt-6">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            Displaying <span className="text-slate-900">{((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredPenalties.length)}</span> of {filteredPenalties.length} records
                        </p>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-xl border-slate-200"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-1 px-3 h-9 bg-white border border-slate-200 rounded-xl">
                                <span className="text-xs font-bold text-blue-600">{currentPage}</span>
                                <span className="text-[10px] font-medium text-slate-400 uppercase">/ {totalPages}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-xl border-slate-200"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Waive Dialog */}
                <Dialog open={waiveDialogOpen} onOpenChange={setWaiveDialogOpen}>
                    <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-none shadow-2xl rounded-3xl">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
                                    <XCircle className="w-6 h-6 text-amber-600" />
                                </div>
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-slate-900">Waive Penalty</DialogTitle>
                                    <p className="text-sm text-slate-500">Provide official justification for LAD waiver.</p>
                                </DialogHeader>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Waived penalties will remain in the system for historical auditing but will be excluded from financial recovery balances.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Textarea
                                        placeholder="Enter waiver reason and official reference number..."
                                        value={waiveReason}
                                        onChange={(e) => setWaiveReason(e.target.value)}
                                        className="min-h-[120px] bg-slate-50 border-slate-200 rounded-2xl focus:ring-blue-100 focus:border-blue-400 transition-all text-sm p-4"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setWaiveDialogOpen(false)}
                                    className="flex-1 h-12 text-slate-500 font-medium hover:bg-slate-100 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleWaive}
                                    disabled={!waiveReason.trim() || isProcessing}
                                    className="flex-[2] h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                                    Process Waiver
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Detail Modal - Standardized Forms */}
                {isDetailModalOpen && selectedPenalty && (
                    getPenaltyType(selectedPenalty) === 'appl' ? (
                        <APPLPenaltyForm
                            penalty={selectedPenalty}
                            performanceStandards={performanceStandards}
                            onClose={() => {
                                setIsDetailModalOpen(false)
                                setSelectedPenalty(null)
                            }}
                            onApprove={loadData}
                        />
                    ) : (
                        <CCPenaltyFormNew
                            penalty={selectedPenalty}
                            // Pass all active penalties for the same LPO to allow batch processing
                            availablePenalties={penalties.filter(p =>
                                p.lpo?.lpo_number === selectedPenalty.lpo?.lpo_number &&
                                p.status === selectedPenalty.status // Only group same-status items
                            )}
                            isOpen={true}
                            onSave={handleApprove}
                            onClose={() => setIsDetailModalOpen(false)}
                        />
                    )
                )}
            </div>
        </FinancialPageLayout>
    )
}
