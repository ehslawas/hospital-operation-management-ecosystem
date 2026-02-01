import React, { useState, useEffect } from 'react';
import {
    Button,
    Badge,
    Spinner,
    Card
} from '@/components/ui';
import {
    ArrowLeft,
    Printer,
    CheckCircle2,
    Building2,
    Calendar,
    User,
    Disc,
    Package,
    History,
    FileText,
    Truck,
    Clock,
    ChevronDown
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLoanRecordDetail, getLoanItems, getLoanReturns } from '@/services/pharmacy/interfacilityLoanService';
import { generateLoanFormPDF } from '@/services/pharmacy/LoanFormPDF';
import { generateReturnNotePDF } from '@/services/pharmacy/ReturnNotePDF';
import { LoanRecordWithRelations } from '@/types/pharmacy';
import { format, isValid, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants';
import LoanReturnModal from '@/components/pharmacy/distribution/LoanReturnModal';

const formatDate = (dateString: string, formatStr: string = 'dd MMM yyyy') => {
    try {
        if (!dateString) return 'N/A';
        const date = parseISO(dateString);
        if (isValid(date)) {
            return format(date, formatStr);
        }
        return 'Invalid Date';
    } catch (e) {
        return 'Invalid Date';
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'active':
            return <Badge variant="warning" className="px-3 py-1 font-bold">ACTIVE LOAN</Badge>;
        case 'fully_returned':
            return <Badge variant="success" className="px-3 py-1 font-bold">FULLY RETURNED</Badge>;
        case 'partial_return':
            return <Badge variant="info" className="px-3 py-1 font-bold">PARTIALLY RETURNED</Badge>;
        default:
            return <Badge variant="gray" className="px-3 py-1 capitalize">{status?.replace('_', ' ') || 'Unknown'}</Badge>;
    }
};

const InterfacilityDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [record, setRecord] = useState<LoanRecordWithRelations | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [returns, setReturns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showReturnModal, setShowReturnModal] = useState(false);

    useEffect(() => {
        if (id) {
            loadDetail();
        }
    }, [id]);

    const handlePrintLoan = () => {
        if (!record || !items) return;
        generateLoanFormPDF({
            loan_number: record.loan_number,
            loan_type: record.loan_type,
            loan_date: record.loan_date,
            counterparty_name: (record.counterparty_facility as any)?.name || 'Unknown Facility',
            counterparty_type: (record.counterparty_facility as any)?.category || 'Facility',
            created_by: record.created_by_user?.full_name || record.created_by_user?.email || 'System',
            items: items.map(item => ({
                name: item.catalog_item_details?.drug?.drug_name || item.catalog_item_details?.non_drug?.item_name || 'Unknown Item',
                code: item.catalog_item_details?.drug?.drug_code || item.catalog_item_details?.non_drug?.item_code || 'N/A',
                quantity: item.quantity_loaned,
                unit: 'UNIT'
            }))
        });
    };

    const handlePrintReturn = (ret: any) => {
        if (!record) return;
        generateReturnNotePDF({
            return_number: ret.return_number,
            loan_number: record.loan_number,
            return_date: ret.return_date,
            recorded_by: ret.created_by_user?.full_name || ret.created_by_user?.email || 'System',
            notes: ret.notes,
            items: (ret.return_items || []).map((ri: any) => {
                const originalItem = items.find(i => i.id === ri.loan_item_id);
                const details = originalItem?.catalog_item_details;
                return {
                    name: details?.drug?.drug_name || details?.non_drug?.item_name || "Unknown Item",
                    code: details?.drug?.drug_code || details?.non_drug?.item_code || "N/A",
                    quantity_loaned: originalItem?.quantity_loaned || 0,
                    quantity_returned: ri.quantity_returned,
                    unit: 'UNIT'
                };
            })
        });
    };

    const loadDetail = async () => {
        setIsLoading(true);
        try {
            const [recordRes, itemsRes, returnsRes] = await Promise.all([
                getLoanRecordDetail(id!),
                getLoanItems(id!),
                getLoanReturns(id!)
            ]);

            if (recordRes.data) setRecord(recordRes.data);
            if (itemsRes.data) setItems(itemsRes.data);
            if (returnsRes.data) setReturns(returnsRes.data);

            if (recordRes.error) toast.error(recordRes.error);
        } catch (error) {
            console.error('Error loading loan details:', error);
            toast.error("Failed to load loan details");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Spinner className="w-10 h-10 text-purple-600" />
                <p className="text-slate-500 animate-pulse font-medium">Loading loan details...</p>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mx-auto max-w-2xl mt-10">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Loan Record Not Found</h2>
                <p className="text-slate-500 mt-2 mb-6">The loan record you are looking for does not exist or has been removed.</p>
                <Button variant="ghost" onClick={() => navigate(ROUTES.PHARMACY_INTER_FACILITY_LIST)} className="font-bold text-blue-600">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Ledger
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">

            {/* Breadcrumb / Back */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(ROUTES.PHARMACY_INTER_FACILITY_LIST)}
                    className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Ledger</span>
                </button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handlePrintLoan}>
                        <Printer className="w-4 h-4" />
                        Print Form
                    </Button>
                </div>
            </div>

            {/* Header Card */}
            <Card className="p-6 border-slate-200 shadow-sm relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 p-6">
                    {getStatusBadge(record.status)}
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="p-4 bg-purple-50 rounded-2xl shrink-0">
                        <Truck className="w-10 h-10 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                                {record.loan_number}
                            </h1>
                            <Badge variant={record.loan_type === 'borrowed' ? 'warning' : 'info'} className="h-5 text-[10px] font-bold uppercase">
                                {record.loan_type}
                            </Badge>
                        </div>

                        <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {record.loan_type === 'lent' ? 'To: ' : 'From: '}
                            <span className="font-bold text-slate-700">{record.counterparty_name}</span>
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized By</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                    <User className="w-3.5 h-3.5 text-purple-400" />
                                    {record.created_by_user?.full_name || record.created_by_user?.email || 'System'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issued Date</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                                    {formatDate(record.loan_date, 'dd MMM yyyy')}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected Return</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium font-mono">
                                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                                    {record.expected_return_date ? formatDate(record.expected_return_date, 'dd MMM yyyy') : 'No Date Set'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content: Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden border-slate-200 bg-white">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <Package className="w-4 h-4 text-purple-600" />
                                Loaned Items
                            </h2>
                            <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                {items.length} Items
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Details</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Loaned</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Returned</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Remaining</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {items.map((item) => {
                                        const details = item.catalog_item_details;

                                        // Robust name resolution across all catalog sources
                                        const name = details?.drug?.drug_name ||
                                            details?.non_drug?.item_name ||
                                            details?.appl_drug?.item_name ||
                                            details?.appl_non_drug?.item_name ||
                                            details?.lp_drug?.item_name ||
                                            details?.lp_non_drug?.item_name ||
                                            details?.contract?.item_name ||
                                            "Unknown Item";

                                        const code = details?.drug?.drug_code ||
                                            details?.non_drug?.item_code ||
                                            details?.appl_drug?.item_code ||
                                            details?.appl_non_drug?.item_code ||
                                            details?.lp_drug?.item_code ||
                                            details?.lp_non_drug?.item_code ||
                                            details?.contract?.item_code ||
                                            "N/A";

                                        const remaining = item.quantity_loaned - (item.quantity_returned || 0);

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                                                            {name}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-slate-400 mt-0.5" title={code}>
                                                            {code}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg text-sm">
                                                        {item.quantity_loaned}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-bold text-sm px-3 py-1 rounded-lg border ${item.quantity_returned > 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-300 border-transparent'}`}>
                                                        {item.quantity_returned || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-bold text-sm px-3 py-1 rounded-lg ${remaining > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                                        {remaining}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Sidebar: Actions & History */}
                <div className="space-y-6">
                    <Card className="p-5 border-slate-200 shadow-sm space-y-4 bg-white">
                        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">Actions</h3>
                        <div className="space-y-3">
                            {record.status !== 'fully_returned' ? (
                                <Button
                                    className="w-full justify-between h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    onClick={() => setShowReturnModal(true)}
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Process Return</span>
                                    </div>
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            ) : (
                                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-green-100">
                                    <CheckCircle2 className="w-4 h-4" />
                                    All items returned
                                </div>
                            )}
                        </div>

                        {record.notes && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Remarks
                                </span>
                                <p className="text-xs text-slate-600 italic leading-relaxed">
                                    "{record.notes}"
                                </p>
                            </div>
                        )}
                    </Card>

                    <Card className="p-5 border-slate-200 shadow-sm bg-white">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-400" />
                            Return History
                        </h3>
                        {returns.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="p-2 bg-slate-50 rounded-full mb-2">
                                    <Disc className="w-4 h-4 text-slate-300" />
                                </div>
                                <p className="text-xs text-slate-400 italic">No returns recorded yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-100 before:ml-2">
                                {returns.map((ret) => (
                                    <div key={ret.id} className="relative pl-8 group">
                                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 z-10 border-4 border-white group-hover:scale-110 transition-transform">
                                            <History className="w-4 h-4" />
                                        </div>
                                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:bg-white hover:border-blue-100 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-xs font-bold text-slate-800">{ret.return_number}</p>
                                                <button onClick={() => handlePrintReturn(ret)} className="text-slate-400 hover:text-blue-600">
                                                    <Printer className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mb-2">{formatDate(ret.return_date, 'dd MMM yyyy, HH:mm')}</p>
                                            <div className="space-y-1">
                                                {ret.return_items?.map((ri: any) => {
                                                    const originalItem = items.find(i => i.id === ri.loan_item_id);
                                                    const details = originalItem?.catalog_item_details;
                                                    const name = details?.drug?.drug_name || details?.non_drug?.item_name || "Unknown";
                                                    return (
                                                        <div key={ri.id} className="flex justify-between text-[10px]">
                                                            <span className="text-slate-600 truncate max-w-[120px]">{name}</span>
                                                            <span className="font-bold text-blue-600">+{ri.quantity_returned}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {record && (
                <LoanReturnModal
                    isOpen={showReturnModal}
                    onClose={() => setShowReturnModal(false)}
                    onSuccess={loadDetail}
                    loanId={record.id}
                    loanNumber={record.loan_number}
                    loanType={record.loan_type as 'borrowed' | 'lent'}
                    items={items}
                />
            )}
        </div>
    );
};

export default InterfacilityDetailPage;
