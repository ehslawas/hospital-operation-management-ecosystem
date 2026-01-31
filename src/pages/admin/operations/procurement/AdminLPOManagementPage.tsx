import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ExternalLink, Loader2, Plus, Printer, RefreshCw, Search } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { adminProcurementService } from '@/services/admin/adminProcurementService';
import { AdminLPO, AdminPurchaseOrder } from '@/types/adminOperations.types';
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
import AdminPurchaseOrderTemplate from '@/components/admin/operations/procurement/AdminPurchaseOrderTemplate';
import { format } from 'date-fns';
import { useToast } from '@/stores/toastStore';
import { supabase } from '@/services/supabase';

const AdminLPOManagementPage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [lpos, setLPOs] = useState<AdminLPO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Create LPO Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [approvedPOs, setApprovedPOs] = useState<AdminPurchaseOrder[]>([]);
    const [selectedPO, setSelectedPO] = useState<string>('');
    const [creating, setCreating] = useState(false);

    // PDF Print State
    const [selectedLPO, setSelectedLPO] = useState<AdminLPO | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: selectedLPO ? `LPO-${selectedLPO.lpo_number}` : 'LPO',
    });

    const fetchLPOs = async () => {
        if (!user?.hospital_id) return;
        setLoading(true);
        try {
            const data = await adminProcurementService.getAdminLPOs(user.hospital_id);
            setLPOs(data);
        } catch (error) {
            console.error('Failed to fetch LPOs:', error);
            toast.error('Error', 'Failed to load LPOs');
        } finally {
            setLoading(false);
        }
    };

    const fetchApprovedPOs = async () => {
        if (!user?.hospital_id) return;
        try {
            // Fetch approved POs that don't have an LPO yet
            // This logic might need strict filtering on the backend, 
            // for now fetching all approved and we'll filter client side if needed or rely on user
            const { data, error } = await supabase
                .from('admin_purchase_orders')
                .select('*')
                .eq('hospital_id', user.hospital_id)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filter out POs that already have an LPO
            // This requires fetching all LPOs first or a smart query.
            // For MVP, simplistic check: 
            const existingLPOPoIds = new Set(lpos.map(l => l.purchase_order_id));
            const availablePOs = data.filter(po => !existingLPOPoIds.has(po.id));

            setApprovedPOs(availablePOs as AdminPurchaseOrder[]);
        } catch (error) {
            console.error('Error fetching approved POs:', error);
        }
    };

    useEffect(() => {
        fetchLPOs();
    }, [user?.hospital_id]);

    useEffect(() => {
        if (isCreateOpen) {
            fetchApprovedPOs();
        }
    }, [isCreateOpen, lpos]); // Re-fetch when modal opens or lpos change

    const handleCreateLPO = async () => {
        if (!selectedPO || !user?.hospital_id || !user?.id) return;

        setCreating(true);
        try {
            await adminProcurementService.createAdminLPO(user.hospital_id, selectedPO, user.id);
            toast.success('Success', 'LPO Created successfully');
            setIsCreateOpen(false);
            fetchLPOs();
        } catch (error) {
            console.error('Failed to create LPO:', error);
            toast.error('Error', 'Failed to create LPO');
        } finally {
            setCreating(false);
        }
    };

    const handleViewLPO = async (lpo: AdminLPO) => {
        // Need to fetch full details including items for the template
        try {
            const fullLPO = await adminProcurementService.getAdminLPOById(lpo.id);
            // Ensure purchase_order is present and correct type
            if (fullLPO && fullLPO.purchase_order) {
                // Map AdminLPO structure to what template expects if needed, 
                // but typically we pass the PO data to template
                setSelectedLPO(fullLPO);
                setIsPreviewOpen(true);
            }
        } catch (error) {
            console.error('Error details for LPO:', error);
            toast.error('Error', 'Failed to load LPO details');
        }
    };

    const filteredLPOs = lpos.filter(lpo => {
        const matchesSearch =
            lpo.lpo_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lpo.purchase_order?.order_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || lpo.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'verified': return 'bg-blue-100 text-blue-800';
            case 'sent': return 'bg-purple-100 text-purple-800';
            case 'received': return 'bg-orange-100 text-orange-800';
            case 'paid': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Dummy signatures for now - in real app, fetch from settings or user profile
    const dummySignatures = {
        applicantName: user?.username || 'User',
        applicantPosition: 'Pegawai Memohon',
        headName: 'Ketua Bahagian',
        headPosition: 'Ketua Bahagian',
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Local Purchase Orders</h1>
                    <p className="text-slate-500 mt-1">Manage and verify LPOs</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchLPOs} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create LPO
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New LPO</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Approved Purchase Order</label>
                                    <Select value={selectedPO} onValueChange={setSelectedPO}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a PO..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {approvedPOs.length === 0 ? (
                                                <SelectItem value="none" disabled>No approved POs available</SelectItem>
                                            ) : (
                                                approvedPOs.map(po => (
                                                    <SelectItem key={po.id} value={po.id}>
                                                        {po.order_number} - {po.supplier?.company_name} (RM {po.total_amount.toFixed(2)})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateLPO} disabled={!selectedPO || creating}>
                                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Generate LPO
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
                        <CardTitle>LPO List</CardTitle>
                        <div className="flex gap-2 w-[400px]">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search LPO or PO number..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="received">Received</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>LPO Number</TableHead>
                                <TableHead>PO Reference</TableHead>
                                <TableHead>LPO Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                        <span className="text-slate-500 mt-2 block">Loading LPOs...</span>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLPOs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        No LPOs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLPOs.map((lpo) => (
                                    <TableRow key={lpo.id}>
                                        <TableCell className="font-medium">{lpo.lpo_number}</TableCell>
                                        <TableCell>{lpo.purchase_order?.order_number}</TableCell>
                                        <TableCell>{(lpo.lpo_date || '').split('T')[0]}</TableCell>
                                        <TableCell>{lpo.purchase_order?.supplier?.company_name || '-'}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(lpo.status)}>
                                                {lpo.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleViewLPO(lpo)}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Print Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center">
                            <span>LPO Preview: {selectedLPO?.lpo_number}</span>
                            <Button onClick={handlePrint} size="sm">
                                <Printer className="h-4 w-4 mr-2" />
                                Print LPO
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedLPO && selectedLPO.purchase_order && (
                        <div className="border p-4 bg-gray-50 overflow-auto">
                            <div ref={printRef}>
                                <AdminPurchaseOrderTemplate
                                    order={selectedLPO.purchase_order}
                                    signatures={dummySignatures}
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminLPOManagementPage;
