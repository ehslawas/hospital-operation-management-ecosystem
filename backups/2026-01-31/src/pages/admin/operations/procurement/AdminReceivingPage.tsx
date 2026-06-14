import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { adminProcurementService } from '@/services/admin/adminProcurementService';
import { AdminReceivingRecord, AdminLPO, AdminReceivingFormData } from '@/types/adminOperations.types';
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

const AdminReceivingPage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [receivings, setReceivings] = useState<AdminReceivingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [availableLPOs, setAvailableLPOs] = useState<AdminLPO[]>([]);
    const [selectedLPOId, setSelectedLPOId] = useState<string>('');
    const [selectedLPOData, setSelectedLPOData] = useState<AdminLPO | null>(null);
    const [doNumber, setDoNumber] = useState('');
    const [receivedDate, setReceivedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [receivingItems, setReceivingItems] = useState<{ description: string, ordered: number, received: number }[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const fetchReceivings = async () => {
        if (!user?.hospital_id) return;
        setLoading(true);
        try {
            const data = await adminProcurementService.getAdminReceivingRecords(user.hospital_id);
            setReceivings(data);
        } catch (error) {
            console.error('Failed to fetch receiving records:', error);
            toast.error('Error', 'Failed to load receiving records');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableLPOs = async () => {
        if (!user?.hospital_id) return;
        try {
            // Find LPOs that are 'sent' or 'verified' and ready to be received
            // For now fetching all and filtering in memory or simplified query
            const lpos = await adminProcurementService.getAdminLPOs(user.hospital_id);
            // Filter LPOs that can be received (e.g. status is sent or partially received)
            // Simplified: allow receiving on any LPO that isn't fully closed
            setAvailableLPOs(lpos.filter(l => l.status !== 'pending'));
        } catch (error) {
            console.error('Failed to fetch LPOs:', error);
        }
    };

    useEffect(() => {
        fetchReceivings();
    }, [user?.hospital_id]);

    useEffect(() => {
        if (isCreateOpen) {
            fetchAvailableLPOs();
        }
    }, [isCreateOpen]);

    useEffect(() => {
        const loadLPOItems = async () => {
            if (selectedLPOId) {
                try {
                    const lpo = await adminProcurementService.getAdminLPOById(selectedLPOId);
                    setSelectedLPOData(lpo);
                    if (lpo.purchase_order?.items) {
                        setReceivingItems(lpo.purchase_order.items.map(item => ({
                            description: item.item_description,
                            ordered: item.quantity,
                            received: item.quantity // Default to full receive
                        })));
                    }
                } catch (error) {
                    console.error('Error loading LPO items:', error);
                }
            } else {
                setSelectedLPOData(null);
                setReceivingItems([]);
            }
        };
        loadLPOItems();
    }, [selectedLPOId]);

    const handleCreateReceiving = async () => {
        if (!user?.hospital_id || !user?.id || !selectedLPOId) return;

        setSubmitting(true);
        try {
            const formData: AdminReceivingFormData = {
                lpo_id: selectedLPOId,
                do_number: doNumber,
                received_date: receivedDate,
                items: receivingItems.map(item => ({
                    item_description: item.description,
                    ordered_quantity: item.ordered,
                    received_quantity: item.received
                })),
                notes: ''
            };

            await adminProcurementService.createAdminReceivingRecord(user.hospital_id, user.id, formData);

            // Optionally update LPO status to 'received' or 'partial'
            await adminProcurementService.updateAdminLPOStatus(selectedLPOId, 'received');

            toast.success('Success', 'Receiving record created successfully');
            setIsCreateOpen(false);
            fetchReceivings();

            // Reset form
            setSelectedLPOId('');
            setDoNumber('');
            setReceivingItems([]);
        } catch (error) {
            console.error('Failed to create receiving record:', error);
            toast.error('Error', 'Failed to create receiving record');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredReceivings = receivings.filter(rec =>
        rec.do_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.lpo?.lpo_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Receiving</h1>
                    <p className="text-slate-500 mt-1">Receive goods against LPOs</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchReceivings} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                New Receipt
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>New Receiving Record</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
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
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Delivery Order (DO) No.</label>
                                        <Input
                                            value={doNumber}
                                            onChange={(e) => setDoNumber(e.target.value)}
                                            placeholder="Enter DO Number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Received Date</label>
                                        <Input
                                            type="date"
                                            value={receivedDate}
                                            onChange={(e) => setReceivedDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {selectedLPOData && (
                                    <div className="border rounded-md p-4 bg-slate-50">
                                        <h3 className="font-semibold mb-2">Items to Receive</h3>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead className="w-[100px]">Ordered</TableHead>
                                                    <TableHead className="w-[100px]">Received</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {receivingItems.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{item.description}</TableCell>
                                                        <TableCell>{item.ordered}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                value={item.received}
                                                                onChange={(e) => {
                                                                    const newItems = [...receivingItems];
                                                                    newItems[index].received = Number(e.target.value);
                                                                    setReceivingItems(newItems);
                                                                }}
                                                                className="h-8"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateReceiving} disabled={!selectedLPOId || !doNumber || submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit
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
                        <CardTitle>Receiving Records</CardTitle>
                        <div className="relative w-[300px]">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by DO or LPO..."
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
                                <TableHead>DO Number</TableHead>
                                <TableHead>LPO Number</TableHead>
                                <TableHead>Received By</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                        <span className="text-slate-500 mt-2 block">Loading records...</span>
                                    </TableCell>
                                </TableRow>
                            ) : filteredReceivings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                        No receiving records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReceivings.map((rec) => (
                                    <TableRow key={rec.id}>
                                        <TableCell>{format(new Date(rec.received_date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="font-medium">{rec.do_number}</TableCell>
                                        <TableCell>{rec.lpo?.lpo_number}</TableCell>
                                        <TableCell>{rec.received_by || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={rec.status === 'complete' ? 'success' : 'gray'}>
                                                {rec.status.toUpperCase()}
                                            </Badge>
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

export default AdminReceivingPage;
