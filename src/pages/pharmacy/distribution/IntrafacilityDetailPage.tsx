"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Truck,
    Clock,
    CheckCircle2,
    XCircle,
    Building2,
    Calendar,
    User,
    FileText,
    AlertCircle,
    Package,
    Printer,
    ChevronDown,
    Save
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
    getIntrafacilityTransferDetail,
    updateTransferStatus,
    processTransferIssue
} from '@/services/pharmacy/intrafacilityTransferService';
import { Button, Badge, Card, Spinner } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import { generateTransferNotePDF } from '@/services/pharmacy/TransferNotePDF';

import type { TransferRequestWithRelations, TransferStatus } from '@/types/pharmacy';

export default function IntrafacilityDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [transfer, setTransfer] = useState<TransferRequestWithRelations | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [approveQuantities, setApproveQuantities] = useState<Record<string, number>>({});

    const loadDetail = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        const res = await getIntrafacilityTransferDetail(id);
        if (res.data) {
            setTransfer(res.data);
            // Initialize approve quantities with requested quantities
            const quantities: Record<string, number> = {};
            res.data.items?.forEach(item => {
                quantities[item.id] = item.quantity_approved || item.quantity_requested;
            });
            setApproveQuantities(quantities);
        } else {
            toast.error(res.error || "Failed to load transfer details");
            navigate(ROUTES.PHARMACY_INTRA_FACILITY_LIST);
        }
        setLoading(false);
    }, [id, navigate]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    const handleStatusUpdate = async (newStatus: TransferStatus) => {
        if (!id || !user) return;
        setProcessing(true);
        const res = await updateTransferStatus(id, newStatus, user.id);
        if (!res.error) {
            toast.success(`Transfer status updated to ${newStatus}`);
            loadDetail();
        } else {
            toast.error(res.error);
        }
        setProcessing(false);
    };

    const handleProcessIssue = async () => {
        if (!id || !user || !transfer) return;
        setProcessing(true);

        const itemsToUpdate = Object.entries(approveQuantities).map(([itemId, qty]) => ({
            id: itemId,
            quantity_approved: qty
        }));

        const res = await processTransferIssue(id, itemsToUpdate, user.id);
        if (!res.error) {
            toast.success("Transfer approved and items prepared");
            loadDetail();
        } else {
            toast.error(res.error);
        }
        setProcessing(false);
    };

    const getStatusBadge = (status?: TransferStatus) => {
        if (!status) return null;
        switch (status) {
            case 'pending': return <Badge variant="warning" className="px-3 py-1">Pending Approval</Badge>;
            case 'approved': return <Badge variant="info" className="px-3 py-1">Approved / Preparing</Badge>;
            case 'preparing': return <Badge variant="info" className="px-3 py-1">In Preparation</Badge>;
            case 'in_transit': return <Badge variant="info" className="px-3 py-1">In Transit</Badge>;
            case 'received': return <Badge variant="success" className="px-3 py-1">Received</Badge>;
            case 'completed': return <Badge variant="success" className="px-3 py-1">Completed</Badge>;
            case 'rejected': return <Badge variant="error" className="px-3 py-1">Rejected</Badge>;
            case 'cancelled': return <Badge variant="gray" className="px-3 py-1">Cancelled</Badge>;
            default: return <Badge variant="gray">{status}</Badge>;
        }
    };

    const handlePrint = () => {
        if (!transfer) return;
        generateTransferNotePDF({
            transfer_number: transfer.transfer_number,
            from_dept: "PHARMACY LOGISTIC",
            to_dept: transfer.to_department?.department_name || 'Unknown Dept',
            requested_by: transfer.requested_by_user?.full_name || 'System',
            request_date: transfer.request_date,
            approved_by: transfer.approved_by_user?.full_name,
            approved_date: transfer.approved_at,
            priority: transfer.priority,
            notes: transfer.notes,
            items: (transfer.items || []).map(item => ({
                name: item.drug?.drug_name || item.non_drug?.item_name || 'Unknown Item',
                code: item.drug?.drug_code || item.non_drug?.item_code || 'N/A',
                requested_qty: item.quantity_requested,
                approved_qty: item.quantity_approved || 0,
                unit: 'UNIT'
            }))
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Spinner className="w-10 h-10 text-purple-600" />
                <p className="text-slate-500 animate-pulse font-medium">Loading transfer details...</p>
            </div>
        );
    }

    if (!transfer) return null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Breadcrumb / Back */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(ROUTES.PHARMACY_INTRA_FACILITY_LIST)}
                    className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Transfers</span>
                </button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handlePrint}>
                        <Printer className="w-4 h-4" />
                        Print Note
                    </Button>
                </div>
            </div>

            {/* Header Card */}
            <Card className="p-6 border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6">
                    {getStatusBadge(transfer.status)}
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="p-4 bg-purple-50 rounded-2xl">
                        <Truck className="w-10 h-10 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                                {transfer.transfer_number}
                            </h1>
                            {transfer.priority === 'high' || transfer.priority === 'urgent' ? (
                                <Badge variant="error" className="h-5 text-[10px] font-bold">URGENT</Badge>
                            ) : null}
                        </div>
                        <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            To: <span className="font-bold text-slate-700">{transfer.to_department?.department_name} ({transfer.to_department?.department_code})</span>
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested By</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                    <User className="w-3.5 h-3.5 text-purple-400" />
                                    {transfer.requested_by_user?.full_name || 'System'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Request Date</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                                    {new Date(transfer.request_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Required Date</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium font-mono text-blue-600">
                                    <Clock className="w-3.5 h-3.5" />
                                    {transfer.required_date ? new Date(transfer.required_date).toLocaleDateString() : 'Immediate'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flow</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                                    {transfer.flow_direction === 'request' ? 'Dept Request' : 'Pharmacy Issue'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Items Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden border-slate-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <Package className="w-4 h-4 text-purple-600" />
                                Requested Items
                            </h2>
                            <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                {transfer.items?.length || 0} Positions
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Details</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Qty Required</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Qty Appr/Issue</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transfer.items?.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                                                        {item.drug?.drug_name || item.non_drug?.item_name || 'Unknown Item'}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                        {item.drug?.drug_code || item.non_drug?.item_code || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg text-sm">
                                                    {item.quantity_requested}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {transfer.status === 'pending' ? (
                                                    <input
                                                        type="number"
                                                        value={approveQuantities[item.id] || 0}
                                                        onChange={(e) => setApproveQuantities(prev => ({
                                                            ...prev,
                                                            [item.id]: parseInt(e.target.value) || 0
                                                        }))}
                                                        className="w-20 px-2 py-1 text-center border-2 border-purple-100 focus:border-purple-400 outline-none rounded-lg text-sm font-bold text-purple-700 bg-purple-50/30"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-sm border border-emerald-100">
                                                        {item.quantity_approved || 0}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate">
                                                {item.notes || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                        <div className="flex items-center gap-3 text-sm text-purple-700">
                            <AlertCircle className="w-5 h-5" />
                            <p className="font-medium">Please review and adjust quantities before issuing.</p>
                        </div>
                        <div className="flex gap-3">
                            {transfer.status === 'pending' && (
                                <>
                                    <Button
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={() => handleStatusUpdate('rejected')}
                                        disabled={processing}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                        onClick={handleProcessIssue}
                                        disabled={processing}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Approve & Prepare
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="p-5 border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">Workflow Actions</h3>

                        <div className="space-y-3">
                            <Button
                                className="w-full justify-between h-12 border-slate-200"
                                variant="outline"
                                disabled={transfer.status !== 'approved'}
                                onClick={() => handleStatusUpdate('preparing')}
                            >
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-blue-500" />
                                    <span>Start Preparation</span>
                                </div>
                                <ChevronDown className="w-4 h-4 opacity-50" />
                            </Button>

                            <Button
                                className="w-full justify-between h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                disabled={!['approved', 'preparing'].includes(transfer.status)}
                                onClick={() => handleStatusUpdate('in_transit')}
                            >
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4" />
                                    <span>Issue & Dispatch</span>
                                </div>
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Transfer Notes</span>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                {transfer.notes || "No additional notes provided for this transfer request."}
                            </p>
                        </div>
                    </Card>

                    <Card className="p-5 border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4">Activity Log</h3>
                        <div className="space-y-4 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-100 before:ml-2">
                            <div className="flex gap-4 relative">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 z-10 border-4 border-white">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Requested</p>
                                    <p className="text-[10px] text-slate-500">{new Date(transfer.request_date).toLocaleString()}</p>
                                </div>
                            </div>
                            {transfer.approved_at && (
                                <div className="flex gap-4 relative">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 z-10 border-4 border-white">
                                        <Save className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Approved & Quantities Set</p>
                                        <p className="text-[10px] text-slate-500">By {transfer.approved_by_user?.full_name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
