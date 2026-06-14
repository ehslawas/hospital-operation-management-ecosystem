"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    FileText,
    Calendar,
    Building2,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getTransferRequests } from '@/services/pharmacy/distributionService';
import { ROUTES } from '@/lib/constants';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

import type { TransferRequestWithRelations, TransferStatus, TransferFilter } from '@/types/pharmacy';

export default function IntrafacilityListPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // -- State --
    const [transfers, setTransfers] = useState<TransferRequestWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // -- Data Fetching --
    const loadTransfers = useCallback(async () => {
        if (!user?.hospital_id) return;
        setLoading(true);

        const filter: TransferFilter = {
            transfer_type: 'intra_facility',
            status: statusFilter === 'all' ? undefined : statusFilter as TransferStatus,
            search: searchTerm || undefined
        };

        const res = await getTransferRequests(user.hospital_id, filter);
        if (res.data) {
            setTransfers(res.data.data);
        }
        setLoading(false);
    }, [user?.hospital_id, searchTerm, statusFilter]);

    useEffect(() => {
        loadTransfers();
    }, [loadTransfers]);

    // -- Derived Statistics --
    const stats = useMemo(() => {
        return {
            total: transfers.length,
            pending: transfers.filter(t => t.status === 'pending').length,
            inProgress: transfers.filter(t => ['approved', 'preparing', 'in_transit'].includes(t.status)).length,
            completed: transfers.filter(t => ['completed', 'received'].includes(t.status)).length
        };
    }, [transfers]);

    // -- Helpers --
    const getStatusBadge = (status: TransferStatus) => {
        const styles = {
            pending: "bg-amber-100 text-amber-700 border-amber-200",
            approved: "bg-blue-50 text-blue-700 border-blue-200",
            preparing: "bg-indigo-50 text-indigo-700 border-indigo-200",
            in_transit: "bg-purple-50 text-purple-700 border-purple-200",
            received: "bg-emerald-50 text-emerald-700 border-emerald-200",
            completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
            rejected: "bg-red-50 text-red-700 border-red-200",
            cancelled: "bg-slate-100 text-slate-600 border-slate-200",
        };
        const labels = {
            pending: "Pending Approval",
            approved: "Approved",
            preparing: "Preparing",
            in_transit: "In Transit",
            received: "Received",
            completed: "Completed",
            rejected: "Rejected",
            cancelled: "Cancelled",
        };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.cancelled}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getPriorityIcon = (priority: string) => {
        if (priority === 'urgent' || priority === 'high') {
            return <Badge variant="error" className="h-5 px-1.5 text-[10px] uppercase">Urgent</Badge>;
        }
        return <span className="text-slate-500 text-xs capitalize">{priority}</span>;
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
            {/* -- Header Section -- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Intrafacility Requests</h1>
                    <p className="text-slate-500 mt-1">Manage stock transfers between departments</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={loadTransfers}
                        className="text-slate-600 hover:bg-slate-100"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => navigate(ROUTES.PHARMACY_INTRA_FACILITY)}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20 transition-all"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Request
                    </Button>
                </div>
            </div>

            {/* -- KPI Cards -- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Pending Approval</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.pending}</h3>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Processing</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.inProgress}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Completed Today</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.completed}</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border-slate-200 shadow-sm bg-slate-50/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Requests</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</h3>
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* -- Main Content -- */}
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search requests..."
                            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            className="h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/20"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="in_transit">In Transit</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px] bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Spinner className="w-8 h-8 text-brand-primary mb-4" />
                            <p className="text-slate-500 text-sm">Loading requests...</p>
                        </div>
                    ) : transfers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">No requests found</h3>
                            <p className="text-slate-500 max-w-sm mt-1">Try adjusting your filters or create a new request to get started.</p>
                            <Button
                                variant="outline"
                                className="mt-6"
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Request Ref</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Requested On</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transfers.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span
                                                    className="font-mono text-sm font-medium text-brand-primary hover:underline cursor-pointer"
                                                    onClick={() => navigate(ROUTES.PHARMACY_INTRA_FACILITY_DETAIL.replace(':id', item.id))}
                                                >
                                                    {item.transfer_number}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    by {item.requested_by_user?.full_name?.split(' ')[0] || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                                                    <Building2 className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {item.to_department?.department_name}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {item.to_department?.department_code}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.flow_direction === 'request' ? (
                                                <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100 gap-1 pl-1 pr-2">
                                                    <ArrowDownLeft className="w-3 h-3" />
                                                    Incoming
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-100 gap-1 pl-1 pr-2">
                                                    <ArrowUpRight className="w-3 h-3" />
                                                    Outgoing
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {new Date(item.request_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getPriorityIcon(item.priority)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => navigate(ROUTES.PHARMACY_INTRA_FACILITY_DETAIL.replace(':id', item.id))}>
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {item.status === 'pending' && (
                                                        <DropdownMenuItem className="text-red-600">
                                                            Cancel Request
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination (Placeholder for now) */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <div>Showing {transfers.length} records</div>
                    {/* Add pagination controls logic here if needed */}
                </div>
            </Card>
        </div>
    );
}
