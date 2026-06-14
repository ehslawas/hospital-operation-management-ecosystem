import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    QrCode,
    Package,
    CheckCircle2,
    AlertCircle,
    Hash,
    Barcode,
    Calendar,
    History,
    FileText
} from 'lucide-react';
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Input,
    Label,
    Badge,
    ScrollArea,
    toast
} from '@/components/ui';
import { QRScanner } from '@/components/pharmacy/QRScanner';
import { receivingService } from '@/services/pharmacy/receivingService';
import * as itemRegistryService from '@/services/pharmacy/itemRegistryService';
import * as itemMovementService from '@/services/pharmacy/itemMovementService';
import { useAuthStore, useHospitalId } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

const PhysicalReceivingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const hospital_id = useHospitalId();

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [lpoSearch, setLpoSearch] = useState('');
    const [selectedLPO, setSelectedLPO] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [scannedItems, setScannedItems] = useState<any[]>([]);
    const [currentStep, setCurrentStep] = useState<'lpo' | 'scan' | 'verify'>('lpo');

    // Search for LPO
    const handleLPOSearch = async () => {
        if (!lpoSearch.trim()) return;

        setIsLoading(true);
        try {
            const lpo = await receivingService.getLPOForReceiving(lpoSearch.trim());
            if (lpo) {
                setSelectedLPO(lpo);
                setCurrentStep('scan');
            } else {
                toast.error("LPO Not Found", "Could not find an LPO with that number. Please check and try again.");
            }
        } catch (error) {
            console.error('Error searching LPO:', error);
            toast.error("Search Error", error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle QR Scan
    const handleQRScan = async (qrCode: string) => {
        // Expected format: ITEM-{type}-{catalogId}-{serial}
        if (scannedItems.some(item => item.qr_code === qrCode)) {
            toast.warning("Already Scanned", "This item has already been added to the list.");
            return;
        }

        setIsLoading(true);
        try {
            // Find item in registry
            const { data: item, error } = await itemRegistryService.findByQR(hospital_id || '', qrCode);

            if (item) {
                // Find matching item in LPO to pre-fill details or validate
                const matchingLpoItem = selectedLPO?.purchase_order?.items?.find((i: any) =>
                    i.item_id === item.item_id || i.drug_id === item.item_id || i.non_drug_id === item.item_id
                );

                if (!matchingLpoItem) {
                    toast.error("Item Mismatch", "This item is not part of the selected LPO.");
                    setIsLoading(false);
                    return;
                }

                setScannedItems(prev => [...prev, {
                    ...item,
                    lpo_item_id: matchingLpoItem.id,
                    name: matchingLpoItem.item_name || matchingLpoItem.drug_name || 'Generic Item',
                    code: matchingLpoItem.item_code || matchingLpoItem.drug_code || '-',
                    scanned_at: new Date().toISOString()
                }]);

                toast.success("Item Scanned", `Added: ${matchingLpoItem.item_name || matchingLpoItem.drug_name}`);

                // Do NOT close scanner for continuous flow
                // setIsScannerOpen(false);
            } else {
                toast.error("Invalid QR", "This QR code is not registered in the system registry.");
            }
        } catch (error) {
            console.error('Scan error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (scannedItems.length === 0) return;

        setIsLoading(true);
        try {
            // 1. Record movements for each item
            const movementPromises = scannedItems.map(item =>
                itemMovementService.recordReceiving(
                    hospital_id || '',
                    item.id,
                    {
                        type: 'lpo',
                        id: selectedLPO.id,
                        number: selectedLPO.lpo_number
                    },
                    'Central Store',
                    user?.id || '',
                    'qr'
                )
            );

            await Promise.all(movementPromises);

            toast.success("Receiving Finalized", `Successfully recorded ${scannedItems.length} item movements.`);

            navigate(ROUTES.PHARMACY_ITEM_MOVEMENT);
        } catch (error) {
            console.error('Finalize error:', error);
            toast.error("Processing Failed", "An error occurred while finalizing the receiving record.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Physical Receiving</h1>
                        <p className="text-sm text-gray-500">Scan QR codes to record incoming items</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(ROUTES.PHARMACY_ITEM_MOVEMENT)}>
                        <History className="mr-2 h-4 w-4" />
                        History
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {currentStep === 'lpo' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="max-w-xl mx-auto border-dashed border-2">
                            <CardHeader className="text-center">
                                <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Select Source LPO</CardTitle>
                                <CardDescription>Enter LPO or PO number to begin physical receiving</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="LPO-2026-0001..."
                                            className="pl-9"
                                            value={lpoSearch}
                                            onChange={(e) => setLpoSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleLPOSearch()}
                                        />
                                    </div>
                                    <Button onClick={handleLPOSearch} disabled={isLoading}>
                                        {isLoading ? "Searching..." : "Search"}
                                    </Button>
                                </div>
                                <div className="pt-4 border-t text-xs text-gray-500 text-center">
                                    Physical receiving links scanned physical items to system procurement records.
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {currentStep === 'scan' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        {/* LPO Info Sidebar */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <Badge variant="gray" className="w-fit mb-2">Source Document</Badge>
                                    <CardTitle className="text-lg">{selectedLPO?.lpo_number}</CardTitle>
                                    <CardDescription>{selectedLPO?.purchase_order?.supplier?.company_name}</CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Date:</span>
                                        <span className="font-medium">{new Date(selectedLPO?.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Items Expected:</span>
                                        <span className="font-medium">{selectedLPO?.purchase_order?.items?.length}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="w-full mt-4 text-xs font-normal"
                                        onClick={() => setCurrentStep('lpo')}
                                    >
                                        Change LPO
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="pt-6">
                                    <div className="text-center space-y-4">
                                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                            <QrCode className="h-8 w-8 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">Ready to Scan</h3>
                                            <p className="text-sm text-gray-600">Scan each item's QR code to register movement</p>
                                        </div>
                                        <Button className="w-full" size="lg" onClick={() => setIsScannerOpen(true)}>
                                            <QrCode className="mr-2 h-5 w-5" />
                                            Open Scanner
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Scanned List */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card className="min-h-[400px] flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                    <div>
                                        <CardTitle>Scanned Items</CardTitle>
                                        <CardDescription>{scannedItems.length} items scanned so far</CardDescription>
                                    </div>
                                    {scannedItems.length > 0 && (
                                        <Button onClick={handleFinalize} disabled={isLoading}>
                                            {isLoading ? "Processing..." : "Finalize Receipt"}
                                            <CheckCircle2 className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="p-0 flex-1">
                                    <ScrollArea className="h-[500px]">
                                        {scannedItems.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500 space-y-4">
                                                <div className="bg-gray-100 p-4 rounded-full">
                                                    <Package className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">No items scanned yet</p>
                                                    <p className="text-sm">Click 'Open Scanner' to begin physical intake</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {scannedItems.map((item, index) => (
                                                    <motion.div
                                                        key={item.qr_code}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 bg-green-50 rounded flex items-center justify-center">
                                                                <Barcode className="h-5 w-5 text-green-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                                                <div className="flex gap-3 mt-1">
                                                                    <span className="text-xs font-mono text-gray-500 flex items-center">
                                                                        <Hash className="h-3 w-3 mr-1" /> {item.serial_number}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 flex items-center">
                                                                        <Calendar className="h-3 w-3 mr-1" /> {item.batch_number || 'No Batch'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                                                Scanned
                                                            </Badge>
                                                            <span className="text-[10px] text-gray-400">
                                                                {new Date(item.scanned_at).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QR Scanner Dialog */}
            {isScannerOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-primary" />
                                <span className="font-bold">Scan Item QR Code</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsScannerOpen(false)}>
                                Close
                            </Button>
                        </div>
                        <div className="p-4">
                            <QRScanner
                                onScan={handleQRScan}
                                className="border-0 shadow-none"
                                continuous={true}
                                allowDuplicates={false}
                            />
                        </div>
                        <div className="p-4 bg-gray-50 text-xs text-gray-500 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                            <p>Position the QR code within the frame. The scanner will automatically detect and process the item.</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="mt-6 text-white border-white hover:bg-white/10"
                        onClick={() => setIsScannerOpen(false)}
                    >
                        Cancel Scanning
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PhysicalReceivingPage;
