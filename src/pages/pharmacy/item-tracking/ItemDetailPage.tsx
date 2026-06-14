import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    QrCode,
    MapPin,
    Calendar,
    ArrowLeft,
    History,
    Edit,
    AlertTriangle,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    Download
} from 'lucide-react';
import {
    Button,
    Card,
    Badge,
    Spinner,
    toast,
    ScrollArea
} from '@/components/ui';
import { getRegisteredItemById, RegisteredItemWithRelations } from '@/services/pharmacy/itemRegistryService';
import { getMovementHistory, ItemMovementWithRelations } from '@/services/pharmacy/itemMovementService';
import { generateKEWPS4 } from '@/services/pharmacy/kewPs4Service';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';

const ItemDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [item, setItem] = useState<RegisteredItemWithRelations | null>(null);
    const [history, setHistory] = useState<ItemMovementWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const fetchData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const { data, error } = await getRegisteredItemById(id);
            if (error) throw new Error(error);
            setItem(data);

            setIsHistoryLoading(true);
            const { data: historyData, error: historyError } = await getMovementHistory(id);
            if (historyError) throw new Error(historyError);
            setHistory(historyData || []);
        } catch (err: any) {
            toast.error(`Failed to load item details: ${err.message}`);
        } finally {
            setIsLoading(false);
            setIsHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleDownloadKEWPS4 = async () => {
        if (!item) return;
        try {
            generateKEWPS4({
                itemName: item.item_details?.drug_name || item.item_details?.item_name || 'Generic Item',
                itemCode: item.item_details?.drug_code || item.item_details?.item_code || '-',
                uom: item.item_details?.unit_of_measure || 'Unit',
                location: item.current_location,
                movements: history,
                generatedBy: user?.full_name || user?.email || 'HospOS User'
            });
            toast.success('KEW.PS-4 generated successfully');
        } catch (err) {
            toast.error('Failed to generate KEW.PS-4');
        }
    };

    const getStatusVariant = (status: string): "success" | "info" | "gray" | "error" => {
        switch (status) {
            case 'available': return 'success';
            case 'issued': return 'info';
            case 'consumed': return 'gray';
            case 'expired':
            case 'damaged': return 'error';
            default: return 'gray';
        }
    };

    const getMovementBadge = (type: string) => {
        switch (type) {
            case 'received': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Received</Badge>;
            case 'issued': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Issued</Badge>;
            case 'returned_from_dept': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Returned</Badge>;
            case 'transferred': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Transferred</Badge>;
            case 'disposed': return <Badge variant="error">Disposed</Badge>;
            default: return <Badge variant="gray">{type.replace(/_/g, ' ')}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Item Not Found</h2>
                <Button onClick={() => navigate(-1)} variant="secondary" className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Registry
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadKEWPS4}>
                        <Download className="h-4 w-4 mr-2" /> KEW.PS-4
                    </Button>
                    <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" /> Edit Details
                    </Button>
                </div>
            </div>

            {/* Main Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 space-y-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-slate-100 rounded-xl flex items-center justify-center">
                                <QrCode className="h-8 w-8 text-slate-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {item.item_details?.drug_name || item.item_details?.item_name || 'Unknown Item'}
                                </h1>
                                <p className="text-gray-500 font-mono text-sm">QR: {item.qr_code}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge variant={getStatusVariant(item.status)} size="md">
                                {item.status.toUpperCase()}
                            </Badge>
                            <span className="text-[10px] text-gray-400 font-mono uppercase">ID: {item.id.split('-')[0]}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t font-sans">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Serial Number</p>
                            <p className="font-medium">{item.serial_number || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Batch Number</p>
                            <p className="font-medium">{item.batch_details?.batch_number || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Expiry Date</p>
                            <p className="font-medium text-red-600">
                                {item.batch_details?.expiry_date ? format(new Date(item.batch_details.expiry_date), 'dd MMM yyyy') : 'N/A'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Current Location</p>
                            <div className="flex items-center gap-1 font-medium text-blue-700">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                {item.current_location}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Registered At</p>
                            <div className="flex items-center gap-1 font-medium text-slate-700">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                {format(new Date(item.created_at), 'dd MMM yyyy')}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Last Activity</p>
                            <div className="flex items-center gap-1 font-medium text-slate-700">
                                <Clock className="h-4 w-4 text-slate-400" />
                                {item.last_scanned_at ? format(new Date(item.last_scanned_at), 'dd/MM/yyyy HH:mm') : 'None'}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Sidebar Details */}
                <Card className="p-6 space-y-6">
                    <h3 className="font-bold border-b pb-2">Tracking Details</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Ownership</span>
                            <Badge variant="gray" className="text-[10px]">KEMENTERIAN KESIHATAN</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Item Type</span>
                            <Badge variant={item.item_type === 'drug' ? 'info' : 'success'} className="text-[10px]">
                                {item.item_type.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Last Scanned By</span>
                            <span className="font-medium text-gray-700">{item.last_scanner?.full_name || item.last_scanner?.email || 'N/A'}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* History Table */}
            <Card>
                <div className="p-6 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-gray-400" />
                        <h2 className="text-lg font-bold text-gray-900">Movement & Status History</h2>
                    </div>
                    {isHistoryLoading && <Spinner size="sm" />}
                </div>
                <Card className="border-0 rounded-none overflow-hidden">
                    <ScrollArea className="h-[400px]">
                        {history.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <History className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p>No movement history records found for this item.</p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-50 sticky top-0 z-10 border-b">
                                    <tr>
                                        <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                                        <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Activity</th>
                                        <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Logistics</th>
                                        <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Performer</th>
                                        <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Reference</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.map((move) => (
                                        <tr key={move.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 text-xs text-gray-500 whitespace-nowrap">
                                                {new Date(move.performed_at).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6">
                                                {getMovementBadge(move.movement_type)}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-gray-600">
                                                <div className="flex flex-col gap-1">
                                                    {move.from_location && (
                                                        <span className="flex items-center gap-1 opacity-60">
                                                            <ArrowUpRight className="h-3 w-3 text-red-500" /> {move.from_location}
                                                        </span>
                                                    )}
                                                    {move.to_location && (
                                                        <span className="flex items-center gap-1 font-medium">
                                                            <ArrowDownLeft className="h-3 w-3 text-green-500" /> {move.to_location}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-gray-600">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{move.performer?.full_name || 'System'}</span>
                                                    <span className="text-[10px] font-mono text-gray-400 italic">via {move.scan_method}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-gray-500">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-[10px]">{move.source_document_number || 'No Reference'}</span>
                                                    <span className="text-[9px] opacity-60">{move.remarks || ''}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </ScrollArea>
                </Card>
            </Card>
        </div>
    );
};

export default ItemDetailPage;

