import React, { useState, useEffect, useCallback } from 'react';
import {
    Button,
    Badge,
    Spinner,
    Input,
    Card
} from '@/components/ui';
import {
    Plus,
    Search,
    HandHelping,
    Building2,
    Calendar,
    ArrowRight,
    Truck,
    RefreshCw,
    Clock,
    FileText,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useIsSessionReady } from '@/stores/authStore';
import { getLoanRecords, getLoanStats } from '@/services/pharmacy/interfacilityLoanService';
import type { LoanRecordWithRelations } from '@/types/pharmacy';
import { format, isValid, parseISO } from 'date-fns';
import { ROUTES } from '@/lib/constants';

const InterfacilityListPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isSessionReady = useIsSessionReady();
    const hospitalId = user?.hospital_id;

    const [records, setRecords] = useState<LoanRecordWithRelations[]>([]);
    const [stats, setStats] = useState({ total: 0, active: 0, borrowed: 0, lent: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeType, setActiveType] = useState<'all' | 'borrowed' | 'lent'>('all');
    const [activeStatus, setActiveStatus] = useState<string>('all');

    const loadData = useCallback(async () => {
        if (!isSessionReady || !hospitalId) return;

        setIsLoading(true);
        try {
            const [recordsRes, statsRes] = await Promise.all([
                getLoanRecords(hospitalId, {
                    type: activeType,
                    status: activeStatus,
                    search: searchQuery
                }),
                getLoanStats(hospitalId)
            ]);

            if (!recordsRes.error && recordsRes.data) {
                setRecords(recordsRes.data.data);
            } else {
                setRecords([]);
            }

            if (!statsRes.error && statsRes.data) {
                setStats(statsRes.data);
            }
        } catch (error) {
            console.error('Error loading loan data:', error);
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    }, [isSessionReady, hospitalId, activeType, activeStatus, searchQuery]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="info">Active</Badge>;
            case 'partial_return':
                return <Badge variant="warning">Partial Return</Badge>;
            case 'fully_returned':
                return <Badge variant="success">Returned</Badge>;
            default:
                return <Badge variant="gray" className="capitalize">{status?.replace('_', ' ') || 'Unknown'}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            if (isValid(date)) {
                return format(date, 'dd MMM yyyy');
            }
            return 'Invalid Date';
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 pb-20">
            {/* -- Header Section -- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl">
                            <Truck className="w-8 h-8 text-white" />
                        </div>
                        Inter-facility Loans
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 ml-14">Track items borrowed from or lent to other facilities</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={loadData}
                        className="text-slate-600 hover:bg-slate-100"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate(ROUTES.PHARMACY_DISTRIBUTION_BORROW)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 font-bold"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Borrow Items
                    </Button>
                    <Button
                        onClick={() => navigate(ROUTES.PHARMACY_DISTRIBUTION_LEND)}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20 font-bold"
                    >
                        <HandHelping className="w-4 h-4 mr-2" />
                        Lend Items
                    </Button>
                </div>
            </div>

            {/* -- KPI Cards -- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Transactions</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.total}</h3>
                        </div>
                        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Loans</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.active}</h3>
                        </div>
                        <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Borrowed (BR)</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.borrowed}</h3>
                        </div>
                        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Lent (LD)</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.lent}</h3>
                        </div>
                        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* -- Main Content -- */}
            <Card className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-white flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="relative w-full lg:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search by loan number..."
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex bg-slate-100 p-1 rounded-xl w-full lg:w-auto">
                            {(['all', 'borrowed', 'lent'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setActiveType(type)}
                                    className={`flex-1 lg:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all ${activeType === type
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {type.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <select
                            value={activeStatus}
                            onChange={(e) => setActiveStatus(e.target.value)}
                            className="h-11 text-xs font-black bg-slate-50 border border-slate-200 px-4 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="all">ALL STATUS</option>
                            <option value="active">ACTIVE</option>
                            <option value="partial_return">PARTIAL</option>
                            <option value="fully_returned">RETURNED</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px] bg-white">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Spinner size="lg" className="mb-4 text-blue-600" />
                            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Fetching records...</p>
                        </div>
                    ) : records && records.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-black text-slate-400">
                                    <th className="px-8 py-5">Loan Details</th>
                                    <th className="px-6 py-5">Facility</th>
                                    <th className="px-6 py-5">Type</th>
                                    <th className="px-6 py-5">Date</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {records.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/75 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{record.loan_number}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase flex items-center gap-1">
                                                <span className="opacity-50">UID:</span> {record.id?.slice(0, 8)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-slate-200 transition-colors">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-slate-700 uppercase tracking-tight text-sm">
                                                    {record.counterparty_name || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge variant={record.loan_type === 'borrowed' ? 'warning' : 'info'} className="uppercase text-[10px] font-black tracking-widest px-2.5 py-1">
                                                {record.loan_type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-600 font-bold">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {formatDate(record.loan_date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {getStatusBadge(record.status)}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(ROUTES.PHARMACY_INTER_FACILITY_DETAIL.replace(':id', record.id))}
                                                className="text-blue-600 hover:bg-blue-50 font-black text-xs uppercase tracking-widest"
                                            >
                                                Details
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                                <Search className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">No loan records found</h3>
                            <p className="text-slate-500 max-w-sm mx-auto font-medium">
                                We couldn't find any records matching your criteria. Try adjusting your filters or record a new transaction.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer / Pagination Placeholder */}
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Showing {records.length} of {stats.total} total records
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default InterfacilityListPage;
