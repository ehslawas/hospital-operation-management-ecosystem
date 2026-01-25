import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
    FileText,
    CheckCircle,
    CreditCard,
    Calendar,
    Search,
    Filter,
    ArrowRight,
    CalendarDays,
    Hash,
    ShieldCheck,
    Info,
    ChevronRight,
    Banknote,
    Building2,
    Receipt
} from 'lucide-react'

import {
    Card,
    CardContent,
    CardHeader,
    Button,
    Input,
    Badge,
    Dialog,
    DialogContent,
    Label,
    Checkbox,
    Separator
} from '@/components/ui'
import { Table } from '@/components/ui/Table'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { paymentService } from '@/services/pharmacy/paymentService'
import { LPOWithRelations, Payment } from '@/types/pharmacy/procurementNew'
import { useSearchParams } from 'react-router-dom'
import { useToast } from '@/stores/toastStore'

export default function PaymentPage() {
    const [searchParams] = useSearchParams()
    const { success, error } = useToast()

    // State
    const [lpos, setLpos] = useState<LPOWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({ totalPaid: 0, pendingCount: 0 })
    const [searchTerm, setSearchTerm] = useState('')

    // Modal State
    const [selectedLpo, setSelectedLpo] = useState<LPOWithRelations | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [paymentForm, setPaymentForm] = useState<Partial<Payment>>({})

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [pendingLpos, statistics] = await Promise.all([
                paymentService.getPendingPayments(),
                paymentService.getPaymentStats()
            ])

            // MOCK DATA FOR TESTING
            const mockLpo: any = {
                id: 'mock-lpo-1',
                lpo_number: 'LPO-2024-TEST-001',
                created_at: new Date().toISOString(),
                sent_for_payment_date: new Date().toISOString(),
                payment_status: 'sent_for_payment',
                status: 'verified',
                purchase_order: {
                    total_amount: 12500.00,
                    supplier: {
                        company_name: 'MedTech Supplies Sdn Bhd',
                        registration_number: 'MTS-2024-888'
                    }
                },
                payment: {
                    status: 'pending'
                }
            }

            setLpos([...pendingLpos, mockLpo])
            setStats(statistics)
        } catch (err) {
            console.error('Error fetching payments:', err)
            error('Failed to load payment data')
        } finally {
            setIsLoading(false)
        }
    }

    // Initial Fetch
    useEffect(() => {
        fetchData()
    }, [])

    // Handle Deep Linking
    useEffect(() => {
        const lpoId = searchParams.get('lpoId')
        if (lpoId) {
            handleDeepLink(lpoId)
        }
    }, [searchParams, lpos])

    const handleDeepLink = async (id: string) => {
        const existing = lpos.find(l => l.id === id)
        if (existing) {
            handleOpenPayment(existing)
            return
        }

        try {
            const lpo = await paymentService.getLPOPaymentDetails(id)
            if (lpo) {
                handleOpenPayment(lpo)
            }
        } catch (err) {
            console.error('Failed to load deep linked LPO:', err)
        }
    }

    const handleOpenPayment = (lpo: LPOWithRelations) => {
        setSelectedLpo(lpo)
        setPaymentForm({
            lpo_id: lpo.id,
            lpo_number: lpo.lpo_number,
            payment_amount: lpo.purchase_order?.total_amount || 0,
            status: lpo.payment?.status || 'pending',
            payment_method: lpo.payment?.payment_method || 'Bank Transfer',
            payment_reference: lpo.payment?.payment_reference || '',
            egrn_number: lpo.payment?.egrn_number || '',
            invoice_number: lpo.payment?.invoice_number || '',
            phis_status: lpo.payment?.phis_status || 'pending',
            payment_keyed_date: new Date().toISOString().split('T')[0]
        })
        setIsModalOpen(true)
    }

    const handleSubmitPayment = async () => {
        setIsLoading(true)
        try {
            if (paymentForm.lpo_number === 'LPO-2024-TEST-001') {
                await new Promise(resolve => setTimeout(resolve, 1000))
                success('Payment updated successfully (MOCK TEST)')
                setIsModalOpen(false)
                return
            }

            await paymentService.updatePayment({
                ...paymentForm,
                payment_keyed_date: new Date(paymentForm.payment_keyed_date || new Date()).toISOString()
            })
            success('Payment updated successfully')
            setIsModalOpen(false)
            fetchData()
        } catch (err) {
            error('Failed to update payment')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredLpos = lpos.filter(lpo =>
        lpo.lpo_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lpo.purchase_order?.supplier?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const columns = [
        {
            key: 'lpo_number',
            label: 'Reference No.',
            render: (_: any, record: LPOWithRelations) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 font-mono tracking-tight group-hover:text-blue-600 transition-colors">
                            {record.lpo_number}
                        </span>
                        <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-100 px-1.5 py-0 rounded-md">
                            VERIFIED
                        </Badge>
                    </div>
                    <span className="text-xs text-slate-400">
                        Requested: {record.sent_for_payment_date ? format(new Date(record.sent_for_payment_date), 'dd MMM yyyy') : 'N/A'}
                    </span>
                </div>
            )
        },
        {
            key: 'supplier',
            label: 'Beneficiary',
            render: (_: any, record: LPOWithRelations) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                        {record.purchase_order?.supplier?.company_name?.charAt(0) || 'S'}
                    </div>
                    <div className="flex flex-col max-w-[200px]">
                        <span className="font-semibold text-slate-900 truncate">
                            {record.purchase_order?.supplier?.company_name || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                            {record.purchase_order?.supplier?.registration_number || 'REG-N/A'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            align: 'center' as const,
            render: (_: any, record: LPOWithRelations) => (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                    Pending Disbursement
                </div>
            )
        },
        {
            key: 'amount',
            label: 'Amount (RM)',
            align: 'right' as const,
            render: (_: any, record: LPOWithRelations) => (
                <div className="flex flex-col items-end">
                    <span className="font-bold text-slate-900 text-base">
                        {(record.purchase_order?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">MYR</span>
                </div>
            )
        },
        {
            key: 'action',
            label: 'Action',
            align: 'right' as const,
            render: (_: any, record: LPOWithRelations) => (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenPayment(record)}
                    className="group hover:bg-blue-600 hover:text-white text-blue-600 border-blue-200 hover:border-blue-600 font-semibold transition-all duration-200 shadow-sm"
                >
                    Process
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
            )
        }
    ]

    return (
        <FinancialPageLayout
            title="Payment Processing"
            description="Manage and authorize treasury disbursements and supplier payments."
            icon={CreditCard}
            breadcrumbs={[{ label: 'Procurement' }, { label: 'Payment' }]}
        >
            <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-900/10 relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/15 transition-all" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

                            <CardContent className="p-6 relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                        <Banknote className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex items-center text-blue-100 text-xs font-medium bg-blue-500/30 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                                        +12.5%
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-blue-100 font-medium text-sm tracking-wide">Total Disbursed</p>
                                    <h3 className="text-3xl font-bold tracking-tight text-white">
                                        RM {stats.totalPaid.toLocaleString()}
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
                            <div className="absolute right-0 top-0 h-full w-1 bg-amber-500 rounded-l-full opacity-60 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                                        <CalendarDays className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div className="flex items-center text-slate-400 text-xs font-medium">
                                        Pending Actions
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 font-medium text-sm tracking-wide">Pending Payment</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                                            {stats.pendingCount}
                                        </h3>
                                        <span className="text-sm text-slate-400 font-medium">invoices</span>
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
                            <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500 rounded-l-full opacity-60 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div className="flex items-center text-slate-400 text-xs font-medium">
                                        Utilization
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 font-medium text-sm tracking-wide">Budget Utilization</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                                            --%
                                        </h3>
                                        <span className="text-sm text-emerald-600 font-medium">Healthy</span>
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
                    transition={{ delay: 0.4 }}
                    className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100"
                >
                    <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Search by Reference No, Supplier..."
                            className="pl-12 h-12 bg-transparent border-none shadow-none focus-visible:ring-0 text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto px-2">
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-10 px-4 rounded-xl gap-2 font-medium">
                            <Filter className="w-4 h-4" />
                            Filters
                        </Button>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-6 rounded-xl shadow-lg shadow-slate-200 font-medium">
                            Export
                        </Button>
                    </div>
                </motion.div>

                {/* Content Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Table
                        data={filteredLpos}
                        columns={columns}
                        isLoading={isLoading}
                        emptyMessage={
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No pending payments</h3>
                                <p className="text-slate-500">All disbursements have been processed.</p>
                            </div>
                        }
                    />
                </motion.div>

                {/* --- GOOGLE STYLE REDESIGN (MODAL) --- */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen} size="full">
                    <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-[#F8F9FA] border-none shadow-2xl rounded-[20px] mx-auto my-auto self-center">
                        {selectedLpo && (
                            <div className="flex flex-col md:flex-row h-[90vh] md:h-[700px]">

                                {/* LEFT PANEL: CONTEXT SIDER */}
                                <div className="w-full md:w-1/3 bg-white border-r border-slate-100 p-8 flex flex-col relative">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />

                                    <div className="mb-8">
                                        <div className="flex items-center gap-3 text-blue-600 mb-6">
                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-md px-3 py-1">
                                                    PAYMENT
                                                </Badge>
                                            </div>
                                            <span className="font-mono text-xs text-slate-400">{selectedLpo.lpo_number}</span>
                                        </div>

                                        <h2 className="text-2xl font-medium text-slate-900 mb-2 leading-tight">
                                            {selectedLpo.purchase_order?.supplier?.company_name}
                                        </h2>
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Building2 className="w-4 h-4" />
                                            <span>Authorized Official Vendor</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 mt-4">
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block">Total Amount Due</Label>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg text-slate-400 font-medium">RM</span>
                                                <span className="text-4xl font-normal text-slate-900 tracking-tight">
                                                    {(selectedLpo.purchase_order?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Issued Date</span>
                                                <span className="font-medium text-slate-900">
                                                    {selectedLpo.created_at ? format(new Date(selectedLpo.created_at), 'dd MMM yyyy') : 'N/A'}
                                                </span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Status</span>
                                                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100">
                                                    Ready for Disbursement
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-8">
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            This transaction is subject to Treasury Circular 2024 (Amendment 3). Ensure all eGRN references are validated before disbursement.
                                        </p>
                                    </div>
                                </div>

                                {/* RIGHT PANEL: ACTION FORM */}
                                <div className="flex-1 bg-[#F8F9FA] p-6 md:p-8 overflow-y-auto flex flex-col justify-center">
                                    <div className="max-w-lg mx-auto space-y-5 w-full">

                                        <div>
                                            <h3 className="text-lg font-medium text-slate-900 mb-1">Transaction Details</h3>
                                            <p className="text-slate-500 text-sm">Enter the payment execution details below.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-slate-700">Effective Date</Label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <Input
                                                        type="date"
                                                        className="pl-10 h-14 bg-white border-slate-200 rounded-xl text-base shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                                        value={paymentForm.payment_keyed_date}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_keyed_date: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-slate-700">Credit Note</Label>
                                                <Input
                                                    placeholder="eg if available"
                                                    className="h-11 bg-white border-slate-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                                    value={paymentForm.notes || ''}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                                />
                                            </div>
                                        </div>



                                        <Separator className="my-2" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-slate-700">eGRN Reference</Label>
                                                <div className="relative">
                                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <Input
                                                        placeholder="GRN Number"
                                                        className="pl-10 h-14 bg-white border-slate-200 rounded-xl text-base shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-mono"
                                                        value={paymentForm.egrn_number}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, egrn_number: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-slate-700">Invoice Number</Label>
                                                <div className="relative">
                                                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <Input
                                                        placeholder="Invoice Number"
                                                        className="pl-10 h-14 bg-white border-slate-200 rounded-xl text-base shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-mono"
                                                        value={paymentForm.invoice_number}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, invoice_number: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex gap-4 mt-6">
                                            <Checkbox
                                                id="phis_check"
                                                className="w-6 h-6 mt-1 border-orange-300 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                                                checked={paymentForm.phis_status === 'paid'}
                                                onCheckedChange={(checked) =>
                                                    setPaymentForm({ ...paymentForm, phis_status: checked ? 'paid' : 'pending' })
                                                }
                                            />
                                            <div className="space-y-1">
                                                <Label htmlFor="phis_check" className="text-sm font-bold text-orange-900 cursor-pointer">
                                                    Confirm PHIS Ledger Entry
                                                </Label>
                                                <p className="text-sm text-orange-800/80 leading-relaxed">
                                                    I hereby confirm that this payment has been recorded in the Pharmacy Information accordingly
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setIsModalOpen(false)}
                                                className="flex-1 h-14 text-slate-500 font-medium hover:bg-slate-200/50 rounded-xl"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSubmitPayment}
                                                disabled={isLoading}
                                                className="flex-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all text-base"
                                            >
                                                {isLoading ? 'Processing...' : 'Authorize Disbursement'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </FinancialPageLayout>
    )
}
