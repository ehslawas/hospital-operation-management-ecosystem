import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { adminProcurementService } from '@/services/admin/adminProcurementService';
import { AdminPayment, AdminLPO, AdminPaymentFormData } from '@/types/adminOperations.types';
import { Badge } from '@/components/ui/Badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/stores/toastStore';
import { format } from 'date-fns';

const AdminPaymentPage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [payments, setPayments] = useState<AdminPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [availableLPOs, setAvailableLPOs] = useState<AdminLPO[]>([]);
    const [selectedLPOId, setSelectedLPOId] = useState<string>('');
    const [selectedLPOData, setSelectedLPOData] = useState<AdminLPO | null>(null);

    // Form State
    const [voucherNo, setVoucherNo] = useState('');
    const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [amount, setAmount] = useState<number | string>('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchPayments = async () => {
        if (!user?.hospital_id) return;
        setLoading(true);
        try {
            const data = await adminProcurementService.getAdminPayments(user.hospital_id);
            setPayments(data);
        } catch (error) {
            console.error('Failed to fetch payments:', error);
            toast.error('Error', 'Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableLPOs = async () => {
        if (!user?.hospital_id) return;
        try {
            // Find LPOs that are 'received' or 'sent' (pending payment)
            const lpos = await adminProcurementService.getAdminLPOs(user.hospital_id);
            // Filter LPOs that are not fully paid
            // Ideally, check total payments vs LPO amount. For MPV, filtering by status != 'paid'
            setAvailableLPOs(lpos.filter(l => l.status !== 'pending' && l.status !== 'paid'));
        } catch (error) {
            console.error('Failed to fetch LPOs:', error);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [user?.hospital_id]);

    useEffect(() => {
        if (isCreateOpen) {
            fetchAvailableLPOs();
        }
    }, [isCreateOpen]);

    useEffect(() => {
        const loadLPOData = async () => {
            if (selectedLPOId) {
                try {
                    const lpo = await adminProcurementService.getAdminLPOById(selectedLPOId);
                    setSelectedLPOData(lpo);
                    // Propose amount = remaining amount (Logic suppressed for MVP, just default to total)
                    // if (lpo.purchase_order) {
                    //     setAmount(lpo.purchase_order.total_amount); 
                    // }
                } catch (error) {
                    console.error('Error loading LPO:', error);
                }
            } else {
                setSelectedLPOData(null);
                setAmount('');
            }
        };
        loadLPOData();
    }, [selectedLPOId]);

    const handleCreatePayment = async () => {
        if (!user?.hospital_id || !user?.id || !selectedLPOId || !amount) return;

        setSubmitting(true);
        try {
            const formData: AdminPaymentFormData = {
                lpo_id: selectedLPOId,
                payment_voucher_number: voucherNo,
                payment_date: paymentDate,
                amount: Number(amount),
                payment_method: paymentMethod || 'EFT',
                reference_number: referenceNo,
                notes: notes
            };

            await adminProcurementService.createAdminPayment(user.hospital_id, user.id, formData);

            // Check if full payment, then close LPO
            // For now, assume if payment made, we can set LPO to paid or keep it open.
            // Let's simplified: Set to 'paid'
            await adminProcurementService.updateAdminLPOStatus(selectedLPOId, 'paid');

            toast.success('Success', 'Payment recorded successfully');
            setIsCreateOpen(false);
            fetchPayments();

            // Reset
            setSelectedLPOId('');
            setVoucherNo('');
            setAmount('');
            setReferenceNo('');
            setNotes('');
        } catch (error) {
            console.error('Failed to create payment:', error);
            toast.error('Error', 'Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
        }).format(amount);
    };

    const filteredPayments = payments.filter(pay =>
        pay.payment_voucher_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pay.lpo?.lpo_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Payments</h1>
                    <p className="text-slate-500 mt-1">Manage payments for LPOs</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchPayments} disabled={loading}>
                        <RefreshCw className={`h - 4 w - 4 mr - 2 ${loading ? 'animate-spin' : ''} `} />
                        Refresh
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                New Payment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Record Payment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select LPO</label>
                                    <Select value={selectedLPOId} onValueChange={setSelectedLPOId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select LPO..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableLPOs.map(lpo => (
                                                <SelectItem key={lpo.id} value={lpo.id}>
                                                    {lpo.lpo_number}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedLPOData && selectedLPOData.purchase_order && (
                                    <div className="text-sm text-slate-500 mb-2 p-2 bg-slate-50 rounded">
                                        <p>PO Amount: RM {selectedLPOData.purchase_order.total_amount.toFixed(2)}</p>
                                        <p>Supplier: {selectedLPOData.purchase_order.supplier?.company_name}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Voucher No.</label>
                                        <Input
                                            value={voucherNo}
                                            onChange={(e) => setVoucherNo(e.target.value)}
                                            placeholder="PV-XXXX"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Payment Date</label>
                                        <Input
                                            type="date"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount (RM)</label>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Reference / Cheque No.</label>
                                    <Input
                                        value={referenceNo}
                                        onChange={(e) => setReferenceNo(e.target.value)}
                                        placeholder="Optional"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreatePayment} disabled={!selectedLPOId || !amount || submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Payment
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <CardTitle>Payment History</CardTitle>
                        <div className="relative w-[300px]">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by Voucher or LPO..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Voucher No</TableHead>
                                <TableHead>LPO Number</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                        <span className="text-slate-500 mt-2 block">Loading payments...</span>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                        No payments found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPayments.map((pay) => (
                                    <TableRow key={pay.id}>
                                        <TableCell>{format(new Date(pay.payment_date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="font-medium">{pay.payment_voucher_number}</TableCell>
                                        <TableCell>{pay.lpo?.lpo_number}</TableCell>
                                        <TableCell>{pay.payment_method}</TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatCurrency(pay.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminPaymentPage;
