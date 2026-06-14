import React, { useState, useEffect } from 'react';
import {
    History,
    Search,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    AlertCircle,
    Database,
    QrCode,
    FileText,
    Download
} from 'lucide-react';
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Input,
    Badge,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    ScrollArea,
    toast,
    Skeleton
} from '@/components/ui';
import * as itemMovementService from '@/services/pharmacy/itemMovementService';
import { useHospitalId } from '@/stores/authStore';
import { format } from 'date-fns';
import { generateKEWPS4 } from '@/services/pharmacy/kewPs4Service';
import { generateMovementSummaryPDF } from '@/services/pharmacy/MovementSummaryPDF';

const ItemMovementPage: React.FC = () => {
    const hospital_id = useHospitalId();

    const [activeTab, setActiveTab] = useState('history');
    const [searchQuery, setSearchQuery] = useState('');
    const [movements, setMovements] = useState<any[]>([]);
    const [reconciliation, setReconciliation] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (!hospital_id) return;
            setIsRefreshing(true);

            const { data, error } = await itemMovementService.getRecentMovements(hospital_id);
            if (error) throw new Error(error);
            setMovements(data || []);

            const { data: reconData, error: reconError } = await itemMovementService.reconcilePhysicalVsSystem(hospital_id);
            if (reconError) throw new Error(reconError);
            setReconciliation(reconData || []);
        } catch (err: any) {
            toast.error('Failed to load data', err.message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleDownloadSummary = async () => {
        try {
            if (!hospital_id) return;
            const { data: summary, error } = await itemMovementService.getMovementsSummary(hospital_id, {
                startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd')
            });

            if (error) throw new Error(error);
            if (summary) {
                generateMovementSummaryPDF({
                    hospitalName: 'Hospital Operation Management System',
                    dateRange: {
                        startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                        endDate: format(new Date(), 'yyyy-MM-dd')
                    },
                    summary,
                    generatedBy: 'Current User' // Should ideally come from auth store
                });
                toast.success('Summary report generated');
            }
        } catch (err: any) {
            toast.error('Failed to generate summary', err.message);
        }
    };

    const handleDownloadKEWPS4 = async (item: any) => {
        try {
            if (!hospital_id) return;

            // For KEW.PS-4, we need all movements for this catalog item
            // We'll use a search or filter by catalog_item_id if our service supports it
            // For now, we'll fetch movements for this hospital and filter
            const { data, error } = await itemMovementService.getRecentMovements(hospital_id, 500);
            if (error) throw new Error(error);

            const itemMovements = data?.filter(m =>
                (m.item?.item_id === item.catalog_item_id)
            ) || [];

            generateKEWPS4({
                itemName: item.name,
                itemCode: item.code,
                uom: item.uom || 'Unit',
                location: item.system_location || 'Store',
                movements: itemMovements,
                generatedBy: 'Current User'
            });

            toast.success(`KEW.PS-4 generated for ${item.name}`);
        } catch (err: any) {
            toast.error('Failed to generate KEW.PS-4', err.message);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, hospital_id]);

    const getMovementBadge = (type: string) => {
        switch (type) {
            case 'received': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Received</Badge>;
            case 'issued': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Issued</Badge>;
            case 'returned': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Returned</Badge>;
            case 'at_patient': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Dispensed</Badge>;
            case 'discarded': return <Badge variant="error">Discarded</Badge>;
            default: return <Badge variant="gray">{type}</Badge>;
        }
    };

    const loadData = () => {
        fetchData();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Item Movement & Reconciliation</h1>
                    <p className="text-sm text-gray-500">Track physical vs digital inventory flow</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by QR, Serial, or Reference..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={loadData}
                            disabled={isRefreshing || !hospital_id}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleDownloadSummary}
                            disabled={isLoading || !hospital_id}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Export Summary
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Movement History
                    </TabsTrigger>
                    <TabsTrigger value="reconciliation" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Reconciliation View
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="mt-6 space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[600px]">
                                {isLoading ? (
                                    <div className="p-4 space-y-4">
                                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                                    </div>
                                ) : movements.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                                        <History className="h-12 w-12 text-gray-300 mb-4" />
                                        <p className="font-medium">No movements recorded yet</p>
                                    </div>
                                ) : (
                                    <table className="w-full border-collapse">
                                        <thead className="bg-gray-50 sticky top-0 z-10 border-b">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Item / ID</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Type</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">From/To</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Method</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">User</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {movements.map((move) => (
                                                <tr key={move.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-4 text-sm text-gray-600">
                                                        {new Date(move.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="font-medium text-gray-900">
                                                            {move.registry?.drug?.drug_name || move.registry?.non_drug?.item_name || 'Generic Item'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-mono">
                                                            {move.registry?.serial_number}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        {getMovementBadge(move.movement_type)}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-gray-600">
                                                        <div className="flex flex-col">
                                                            {move.from_location && (
                                                                <span className="flex items-center gap-1">
                                                                    <ArrowUpRight className="h-3 w-3 text-red-400" /> {move.from_location}
                                                                </span>
                                                            )}
                                                            {move.to_location && (
                                                                <span className="flex items-center gap-1">
                                                                    <ArrowDownLeft className="h-3 w-3 text-green-400" /> {move.to_location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Badge variant={move.scan_method === 'qr' ? 'success' : 'info'} size="sm">
                                                            {move.scan_method === 'qr' ? <QrCode className="h-3 w-3 mr-1 inline" /> : null}
                                                            {move.scan_method}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-gray-600">
                                                        {move.user?.full_name || 'System'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reconciliation" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            [1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)
                        ) : reconciliation.map((item) => {
                            const diff = item.physical_count - item.system_qty;
                            const hasDiscrepancy = diff !== 0;

                            return (
                                <Card key={item.catalog_item_id} className={hasDiscrepancy ? 'border-red-200' : ''}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-sm font-bold truncate max-w-[200px]">
                                                {item.name}
                                            </CardTitle>
                                            {hasDiscrepancy ? (
                                                <Badge variant="error" className="animate-pulse">Discrepancy</Badge>
                                            ) : (
                                                <Badge variant="gray" className="bg-green-50 text-green-700 border-green-200">Balanced</Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-xs font-mono">{item.code}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-lg bg-blue-50 p-3">
                                                <div className="text-[10px] uppercase font-bold text-blue-600 mb-1">System Qty</div>
                                                <div className="text-xl font-bold text-blue-700 flex items-center gap-2">
                                                    <Database className="h-4 w-4" /> {item.system_qty}
                                                </div>
                                            </div>
                                            <div className={`rounded-lg p-3 ${hasDiscrepancy ? 'bg-orange-50' : 'bg-green-50'}`}>
                                                <div className="text-[10px] uppercase font-bold text-gray-600 mb-1">Physical (QR)</div>
                                                <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                    <QrCode className="h-4 w-4" /> {item.physical_count}
                                                </div>
                                            </div>
                                        </div>

                                        {hasDiscrepancy && (
                                            <div className="p-2 rounded bg-red-50 border border-red-100 flex items-center gap-2 text-xs text-red-700">
                                                <AlertCircle className="h-3 w-3" />
                                                Variance of {diff > 0 ? `+${diff}` : diff} detected in physical tracking
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="ghost"
                                                className="text-xs"
                                                size="sm"
                                            >
                                                View Detailed Log
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                size="sm"
                                                onClick={() => handleDownloadKEWPS4(item)}
                                            >
                                                <Download className="h-3 w-3 mr-1" /> KEW.PS-4
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ItemMovementPage;
