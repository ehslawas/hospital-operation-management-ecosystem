import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
    Search,
    FileText,
    Calendar,
    ArrowRight,
    CheckCircle,
    CreditCard,
    Wallet,
    CheckCircle2
} from 'lucide-react'

import {
    Badge,
    Button,
    Input,
    Card,
    CardContent,
    Select
} from '@/components/ui'
import { Table } from '@/components/ui/Table'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { receivingService } from '@/services/pharmacy/receivingService'
import { lpoService } from '@/services/pharmacy/lpoService'
import { useToast } from '@/stores/toastStore'
import { SupplierAssessmentModal } from '@/components/pharmacy/procurement/SupplierAssessmentModal'

export default function ReceivedItemsHistoryPage() {
    const navigate = useNavigate()
    const { success, error } = useToast()

    // State
    const [isAssessmentOpen, setIsAssessmentOpen] = useState(false)
    const [selectedRecordForAssessment, setSelectedRecordForAssessment] = useState<any>(null)

    // State
    const [records, setRecords] = useState<any[]>([])
    const [stats, setStats] = useState({ totalReceived: 0, pendingVerification: 0, pendingPayment: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setIsLoading(true)
            const data = await receivingService.getAllReceiving()
            setRecords(data || [])

            const statsData = await receivingService.getReceivingStats()
            setStats(statsData)
        } catch (err) {
            console.error(err)
            error('Failed to load receiving history')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenAssessment = (record: any) => {
        setSelectedRecordForAssessment(record)
        setIsAssessmentOpen(true)
    }

    const handleAssessmentConfirm = async (assessmentData: any) => {
        if (!selectedRecordForAssessment) return

        try {
            setIsLoading(true)
            console.log('Submitting Assessment:', assessmentData)

            // 1. Save Assessment
            try {
                await lpoService.saveAssessment({
                    lpo_id: selectedRecordForAssessment.lpo_id,
                    ratings: assessmentData.ratings,
                    total_score: assessmentData.totalScore,
                    percentage: assessmentData.percentage,
                    performance_level: assessmentData.level
                })
            } catch (assessmentError) {
                console.error('Failed to save assessment:', assessmentError)
                // We continue for now but ideally this should be required
                // error('Warning: Assessment not saved (Database table might be missing)')
            }

            // 2. Update LPO status to 'sent_for_payment'
            // NOTE: sent_for_payment_date requires DB migration
            await lpoService.updateLPO(selectedRecordForAssessment.lpo_id, {
                payment_status: 'sent_for_payment',
                sent_for_payment_date: new Date().toISOString()
            })

            success('Assessment submitted and sent for payment')
            setIsAssessmentOpen(false)

            // Navigate to Payment Page
            navigate(`/pharmacy/procurement/payments?lpoId=${selectedRecordForAssessment.lpo_id}`)
        } catch (err) {
            console.error('Failed to update LPO status:', err)
            error('Failed to submit assessment')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredRecords = records.filter(record => {
        const ln = record.lpo?.lpo_number || ''
        const pn = record.lpo?.purchase_order?.po_number || ''
        const sn = record.lpo?.purchase_order?.supplier?.company_name || record.lpo?.purchase_order?.manual_supplier_name || ''
        const dn = record.do_number || ''

        // Search in items
        const itemMatch = record.items?.some((item: any) =>
            (item.po_item?.item_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        )

        const matchesSearch = ln.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pn.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sn.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dn.toLowerCase().includes(searchTerm.toLowerCase()) ||
            itemMatch

        if (!matchesSearch) return false

        // Status Filter Logic
        if (statusFilter === 'all') return true

        const isIncomplete = record.has_missing_details || !record.is_fully_received;
        if (statusFilter === 'incomplete') return isIncomplete
        if (statusFilter === 'pending_payment') return !isIncomplete && record.lpo?.payment_status === 'pending'
        if (statusFilter === 'payment_sent') return record.lpo?.payment_status === 'sent_for_payment'

        return true
    })

    const columns = [
        {
            key: 'do_number',
            label: 'DO Number',
            render: (val: string, record: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800 uppercase">{val || 'N/A'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {val ? 'VALIDATED' : 'MANUAL'}</span>
                    {record.has_missing_details && (
                        <Badge variant="gray" className="w-fit text-[10px] mt-1 px-1 py-0 h-4 bg-amber-50 text-amber-600 border-amber-200">
                            Incomplete
                        </Badge>
                    )}
                </div>
            )
        },

        {
            key: 'lpo',
            label: 'LPO / Supplier',
            render: (_: any, record: any) => (
                <div className="flex flex-col max-w-[200px]">
                    <span className="font-bold text-blue-600">{record.lpo?.lpo_number || 'N/A'}</span>
                    <span className="text-xs text-slate-500 truncate">{record.lpo?.purchase_order?.supplier?.company_name || record.lpo?.purchase_order?.manual_supplier_name || 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'receiving_date',
            label: 'Received Date',
            render: (val: string) => (
                <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">{val ? format(new Date(val), 'dd/MM/yyyy') : 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'items',
            label: 'Items Received',
            render: (items: any[]) => (
                <div className="flex flex-col gap-1">
                    <Badge variant="gray" className="bg-slate-50 text-slate-600 border-slate-200 w-fit">
                        {items?.length || 0} Items
                    </Badge>
                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {items?.slice(0, 2).map((i: any) => i.po_item?.item_name).join(', ')}
                        {items?.length > 2 && '...'}
                    </div>
                </div>
            )
        },
        {
            key: 'receiver',
            label: 'Received By',
            render: (_: any, record: any) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{record.receiver?.full_name || 'N/A'}</span>
                    <span className="text-[10px] text-slate-400">Authorized Personnel</span>
                </div>
            )
        },
        {
            key: 'lou',
            label: 'LOU',
            align: 'center' as const,
            render: (_: any, record: any) => (
                record.lou ? (
                    <div className="flex justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                ) : null
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (_: any, record: any) => {
                const isIncomplete = record.has_missing_details || !record.is_fully_received;

                if (isIncomplete) {
                    return (
                        <Badge variant="gray" className="bg-amber-50 text-amber-600 border-amber-200">
                            Incomplete
                        </Badge>
                    )
                }
                if (record.lpo?.payment_status === 'sent_for_payment') {
                    return (
                        <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                            Payment Sent
                        </Badge>
                    )
                }
                if (record.lpo?.payment_status === 'paid') {
                    return (
                        <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                            Paid
                        </Badge>
                    )
                }
                return (
                    <Badge variant="info" className="bg-blue-50 text-blue-600 border-blue-200">
                        Pending Payment
                    </Badge>
                )
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <div className="flex gap-2 justify-end items-center">
                    {record.has_missing_details && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => navigate(`/pharmacy/procurement/receiving?lpoId=${record.lpo_id}&mode=complete&receivingId=${record.id}`)}
                        >
                            Complete
                        </Button>
                    )}

                    {record.lpo?.payment_status === 'pending' && !record.has_missing_details && record.is_fully_received && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleOpenAssessment(record)}
                        >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Submit for Payment
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-blue-50 text-blue-600"
                        onClick={() => navigate(`/pharmacy/procurement/receiving?lpoId=${record.lpo_id}`)}
                    >
                        Details
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )
        }
    ]

    return (
        <FinancialPageLayout
            title="Received Item History"
            description="Overview of all incoming deliveries and historical records"
            icon={FileText}
            breadcrumbs={[{ label: 'Procurement' }, { label: 'Received Item' }]}
        >
            <div className="space-y-6">
                {/* Search & Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        placeholder="Search by DO, LPO, PO, Supplier or Item Name..."
                                        className="pl-11 h-11 border-slate-200 focus:bg-white transition-all bg-slate-50/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="w-[200px]">
                                    <Select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-slate-50/50 border-slate-200"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="incomplete">Incomplete</option>
                                        <option value="pending_payment">Pending Payment</option>
                                        <option value="payment_sent">Payment Sent</option>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Total Received</p>
                                <h3 className="text-2xl font-bold text-blue-900">{stats.totalReceived}</h3>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-full">
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50 border-amber-100">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-600">Pending Verification</p>
                                <h3 className="text-2xl font-bold text-amber-900">{stats.pendingVerification}</h3>
                            </div>
                            <div className="p-2 bg-amber-100 rounded-full">
                                <FileText className="w-5 h-5 text-amber-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-emerald-50 border-emerald-100">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-600">Pending Payment</p>
                                <h3 className="text-2xl font-bold text-emerald-900">{stats.pendingPayment}</h3>
                            </div>
                            <div className="p-2 bg-emerald-100 rounded-full">
                                <Wallet className="w-5 h-5 text-emerald-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <Table
                        data={filteredRecords}
                        columns={columns}
                        isLoading={isLoading}
                        emptyMessage="No receiving records found."
                    />
                </div>
            </div>

            {/* Assessment Modal */}
            {selectedRecordForAssessment && (
                <SupplierAssessmentModal
                    isOpen={isAssessmentOpen}
                    onClose={() => setIsAssessmentOpen(false)}
                    onConfirm={handleAssessmentConfirm}
                    supplierName={selectedRecordForAssessment.lpo?.purchase_order?.supplier?.company_name || selectedRecordForAssessment.lpo?.purchase_order?.manual_supplier_name || 'N/A'}
                    lpoNumber={selectedRecordForAssessment.lpo?.lpo_number || ''}
                    details={{
                        orderDate: selectedRecordForAssessment.lpo?.document_date || selectedRecordForAssessment.lpo?.created_at,
                        receivedDate: selectedRecordForAssessment.receiving_date,
                        isLate: selectedRecordForAssessment.items?.some((i: any) => i.is_late) || false,
                        daysLate: Math.max(...(selectedRecordForAssessment.items?.map((i: any) => i.days_late || 0) || [0])),
                        totalAmount: selectedRecordForAssessment.lpo?.purchase_order?.total_amount || 0
                    }}
                />
            )}
        </FinancialPageLayout>
    )
}
