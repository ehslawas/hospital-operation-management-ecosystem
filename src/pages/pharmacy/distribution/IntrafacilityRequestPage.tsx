"use client";

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Filter,
    ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getIntrafacilityTransfers } from '@/services/pharmacy/intrafacilityTransferService';
import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    Pagination
} from '@/components/ui';
import { StandardPageLayout } from '@/components/layouts/StandardPageLayout';

// Sub-components
import { IntrafacilityStats } from './components/IntrafacilityStats';
import { IntrafacilityTable } from './components/IntrafacilityTable';
import { IntrafacilityRequestForm } from './components/IntrafacilityRequestForm';

import type { TransferRequestWithRelations } from '@/types/pharmacy';
import { ROUTES } from '@/lib/constants';

export default function IntrafacilityRequestPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const hospitalId = user?.hospital_id;

    // -- Dashboard State --
    const [requests, setRequests] = useState<TransferRequestWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // -- Stats State --
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    // -- Pagination --
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    // -- Data Fetching --
    const loadRequests = useCallback(async () => {
        if (!hospitalId) return;

        setIsLoading(true);
        const res = await getIntrafacilityTransfers(hospitalId, {}, page, pageSize);
        setIsLoading(false);

        if (res.data) {
            setRequests(res.data.data);
            setTotalPages(res.data.totalPages);
            setTotal(res.data.total);

            // Derive basic stats from the first page for now (or could be a separate API call)
            // In a real scenario, we'd have a summary API.
            const totalItems = res.data.total;
            const pending = res.data.data.filter(r => r.status === 'pending').length;
            const approved = res.data.data.filter(r => r.status === 'approved' || r.status === 'preparing').length;
            const rejected = res.data.data.filter(r => r.status === 'rejected' || r.status === 'cancelled').length;

            setStats({
                total: totalItems,
                pending, // This is just a sample for UI, real stats should come from server
                approved,
                rejected
            });
        }
    }, [hospitalId, page, pageSize]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const breadcrumbs = [
        { label: 'Pharmacy Logistics' },
        { label: 'Distribution', href: ROUTES.PHARMACY_DISTRIBUTION_DASHBOARD },
        { label: 'Intrafacility Requests' }
    ];

    const headerActions = (
        <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg shadow-purple-100 h-11 px-6 transition-all active:scale-[0.98]"
        >
            <Plus className="w-4 h-4 mr-2" />
            NEW REQUEST
        </Button>
    );

    return (
        <StandardPageLayout
            title="Intrafacility Requests"
            description="Manage and track stock requests between departments in this facility."
            breadcrumbs={breadcrumbs}
            actions={headerActions}
            className="bg-slate-50/50"
        >
            <div className="space-y-8 animate-in fade-in duration-500">

                {/* 1. KPI Stats Section */}
                <IntrafacilityStats stats={stats} loading={isLoading} />

                {/* 2. Request History Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Request History</h2>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                            <Filter className="w-3 h-3" />
                            SHOWING {requests.length} OF {total} RECORDS
                        </div>
                    </div>

                    <IntrafacilityTable
                        data={requests}
                        loading={isLoading}
                        onViewDetail={(req) => navigate(ROUTES.PHARMACY_INTRA_FACILITY_DETAIL(req.id))}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                pageSize={pageSize}
                                total={total}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 3. New Request Modal */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen} size="xl">
                <DialogContent className="max-w-[1200px] w-[95vw] rounded-3xl border-0 shadow-2xl">
                    <DialogHeader className="px-8 pt-8 pb-4">
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                                <Plus className="w-6 h-6" />
                            </div>
                            NEW INTRAFACILITY REQUEST
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <IntrafacilityRequestForm
                            onClose={() => setIsFormOpen(false)}
                            onSuccess={() => {
                                setIsFormOpen(false);
                                loadRequests();
                            }}
                        />
                    </DialogBody>
                </DialogContent>
            </Dialog>
        </StandardPageLayout>
    );
}
