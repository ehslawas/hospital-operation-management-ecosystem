import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, LoadingOverlay, Dialog, DialogContent, DialogHeader, DialogTitle, Label } from '@/components/ui'
import { paymentService } from '@/services/pharmacy/paymentService'
import { LPOWithRelations, Payment } from '@/types/pharmacy/procurementNew'
import { format } from 'date-fns'
import { DollarSign, FileText, CheckCircle, CreditCard } from 'lucide-react'

export default function PaymentPage() {
    const [lpos, setLpos] = useState<LPOWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({ totalPaid: 0, pendingCount: 0 })

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
            setLpos(pendingLpos)
            setStats(statistics)
        } catch (error) {
            console.error('Error fetching payments:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenPayment = (lpo: LPOWithRelations) => {
        setSelectedLpo(lpo)
        setPaymentForm({
            lpo_id: lpo.id,
            lpo_number: lpo.lpo_number,
            payment_amount: lpo.purchase_order?.total_amount || 0,
            status: lpo.payment?.status || 'pending',
            payment_method: lpo.payment?.payment_method || 'Bank Transfer',
            payment_reference: lpo.payment?.payment_reference || ''
        })
        setIsModalOpen(true)
    }

    const handleSubmitPayment = async () => {
        setIsLoading(true)
        try {
            await paymentService.updatePayment({
                ...paymentForm,
                payment_issued_date: new Date().toISOString() // Assume issued now
            })
            alert('Payment updated successfully')
            setIsModalOpen(false)
            fetchData()
        } catch (error) {
            alert('Failed to update payment')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 pt-6 pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment & Invoicing</h1>
                    <p className="text-slate-500">Track and manage supplier payments</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Paid (YTD)</CardTitle>
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">RM {stats.totalPaid.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Pending Payments</CardTitle>
                        <FileText className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Budget Utilization</CardTitle>
                        <CreditCard className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--%</div>
                        <p className="text-xs text-slate-500">Based on allocated limits</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Payments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>LPO Number</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Date Issued</TableHead>
                                <TableHead className="text-right">Amount (RM)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lpos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                                        No pending payments found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                lpos.map((lpo) => (
                                    <TableRow key={lpo.id}>
                                        <TableCell className="font-medium">{lpo.lpo_number}</TableCell>
                                        <TableCell>{lpo.purchase_order?.supplier?.company_name}</TableCell>
                                        <TableCell>{format(new Date(lpo.created_at), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            {(lpo.purchase_order?.total_amount || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={lpo.payment ? 'warning' : 'gray'}>
                                                {lpo.payment?.status || 'Pending'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => handleOpenPayment(lpo)}>
                                                Manage
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Payment Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Payment Status</DialogTitle>
                    </DialogHeader>

                    {selectedLpo && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500">LPO:</span>
                                    <div className="font-medium">{selectedLpo.lpo_number}</div>
                                </div>
                                <div>
                                    <span className="text-slate-500">Amount:</span>
                                    <div className="font-medium">RM {selectedLpo.purchase_order?.total_amount?.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                                    value={paymentForm.status}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as any })}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="issued">Payment Issued</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Reference</Label>
                                <Input
                                    placeholder="e.g. Cheque No / EFT Ref"
                                    value={paymentForm.payment_reference}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSubmitPayment} disabled={isLoading}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Update Payment
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {isLoading && <LoadingOverlay />}
        </div>
    )
}
