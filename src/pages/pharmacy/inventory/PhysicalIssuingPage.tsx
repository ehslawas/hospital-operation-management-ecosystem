import React, { useState } from 'react';
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
    History,
    Building2,
    Send,
    User
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
    toast,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui';
import { QRScanner } from '@/components/pharmacy/QRScanner';
import * as itemRegistryService from '@/services/pharmacy/itemRegistryService';
import * as itemMovementService from '@/services/pharmacy/itemMovementService';
import { useAuthStore, useHospitalId } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

const PhysicalIssuingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const hospital_id = useHospitalId();

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [targetDept, setTargetDept] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [scannedItems, setScannedItems] = useState<any[]>([]);
    const [currentStep, setCurrentStep] = useState<'setup' | 'scan' | 'verify'>('setup');

    // Dummy departments for demonstration (should come from a proper service)
    const departments = [
        { id: 'emergency', name: 'Emergency Department' },
        { id: 'ward1', name: 'Ward 1 - Medical' },
        { id: 'ward2', name: 'Ward 2 - Surgical' },
        { id: 'ot', name: 'Operating Theatre' },
        { id: 'clinic_k', name: 'Klinik Kesihatan - OPD' },
    ];

    const handleStartIssuing = () => {
        if (!targetDept) {
            toast.error("Selection Required", "Please select a target department.");
            return;
        }
        setCurrentStep('scan');
    };

    const handleQRScan = async (qrCode: string) => {
        if (scannedItems.some(item => item.qr_code === qrCode)) {
            toast.warning("Already Scanned", "This item is already in the issuing list.");
            return;
        }

        setIsLoading(true);
        try {
            const { data: item, error: fetchError } = await itemRegistryService.findByQR(hospital_id || '', qrCode);

            if (item) {
                // Check if item is already 'at_patient' or 'discarded' (simplified check)
                if (item.status !== 'available') {
                    toast.error("Item Unavailable", `Item status is currently "${item.status}". Cannot issue.`);
                    setIsLoading(false);
                    return;
                }

                setScannedItems(prev => [...prev, {
                    ...item,
                    name: item.drug?.drug_name || item.non_drug?.item_name || item.item_details?.drug_name || item.item_details?.item_name || 'Item Name',
                    code: item.drug?.drug_code || item.non_drug?.item_code || item.item_details?.drug_code || item.item_details?.item_code || '-',
                    scanned_at: new Date().toISOString()
                }]);

                toast.success("Item Added", `Ready to issue: ${item.drug?.drug_name || item.non_drug?.item_name || item.item_details?.drug_name || item.item_details?.item_name}`);

                // Do NOT close scanner for continuous flow
                // setIsScannerOpen(false);
            } else {
                toast.error("Invalid QR", "QR code not recognized in registry.");
            }
        } catch (error) {
            console.error('Scan error:', error);
            toast.error("Scan Error", "An error occurred while scanning the item.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (scannedItems.length === 0) return;

        setIsLoading(true);
        try {
            const selectedDeptName = departments.find(d => d.id === targetDept)?.name || targetDept;

            const movementPromises = scannedItems.map(item =>
                itemMovementService.recordIssuing(
                    hospital_id || '',
                    item.id,
                    selectedDeptName,
                    {
                        type: 'department_issue',
                        id: targetDept,
                        number: `ISSUE-${new Date().getTime()}`
                    },
                    user?.id || '',
                    'qr'
                )
            );

            await Promise.all(movementPromises);

            toast.success("Issuing Complete", `Successfully issued ${scannedItems.length} items to ${selectedDeptName}.`);

            navigate(ROUTES.PHARMACY_ITEM_MOVEMENT);
        } catch (error) {
            console.error('Finalize error:', error);
            toast.error("Error", "Failed to finalize issuing record.");
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
                        <h1 className="text-2xl font-bold text-gray-900">Physical Issuing</h1>
                        <p className="text-sm text-gray-500">Dispatch physical items to departments or clinics</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(ROUTES.PHARMACY_ITEM_MOVEMENT)}>
                        <History className="mr-2 h-4 w-4" />
                        Movement Log
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {currentStep === 'setup' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-xl mx-auto"
                    >
                        <Card className="border-t-4 border-t-orange-500 shadow-lg">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Building2 className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <CardTitle>Issuing Details</CardTitle>
                                </div>
                                <CardDescription>Select where these items are being sent</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Target Department / Clinic</Label>
                                    <Select onValueChange={setTargetDept}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select destination..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Recipient Name (Optional)</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Enter staff name..."
                                            className="pl-9"
                                            value={recipientName}
                                            onChange={(e) => setRecipientName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button className="w-full bg-orange-600 hover:bg-orange-700" size="lg" onClick={handleStartIssuing}>
                                    Proceed to Scanning
                                </Button>
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
                        {/* Issuing Metadata Sidebar */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <Badge variant="gray" className="w-fit mb-2">Source Document</Badge>
                                    <CardTitle className="text-lg">
                                        {departments.find(d => d.id === targetDept)?.name}
                                    </CardTitle>
                                    <CardDescription>
                                        Recipient: {recipientName || 'Unspecified Name'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">From:</span>
                                        <span className="font-medium">Main Inventory</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Date:</span>
                                        <span className="font-medium">{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="w-full mt-4 text-xs font-normal"
                                        onClick={() => setCurrentStep('setup')}
                                    >
                                        Modify Destination
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-orange-50 border-orange-200">
                                <CardContent className="pt-6">
                                    <div className="text-center space-y-4">
                                        <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                            <QrCode className="h-8 w-8 text-orange-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">Scan Items to Issue</h3>
                                            <p className="text-sm text-gray-600">Scan QR codes to track distribution</p>
                                        </div>
                                        <Button className="w-full bg-orange-600 hover:bg-orange-700" size="lg" onClick={() => setIsScannerOpen(true)}>
                                            <QrCode className="mr-2 h-5 w-5" />
                                            Scan QR Code
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* List and Actions */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card className="min-h-[400px] flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                    <div>
                                        <CardTitle>Issuing List</CardTitle>
                                        <CardDescription>{scannedItems.length} items scanned for dispatch</CardDescription>
                                    </div>
                                    {scannedItems.length > 0 && (
                                        <Button
                                            className="bg-orange-600 hover:bg-orange-700"
                                            onClick={handleFinalize}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Processing..." : "Confirm Dispatch"}
                                            <Send className="ml-2 h-4 w-4" />
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
                                                    <p className="text-sm">Click 'Scan QR Code' to register items for distribution</p>
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
                                                            <div className="h-10 w-10 bg-orange-50 rounded flex items-center justify-center">
                                                                <Barcode className="h-5 w-5 text-orange-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                                                <div className="flex gap-3 mt-1">
                                                                    <span className="text-xs font-mono text-gray-500 flex items-center">
                                                                        <Hash className="h-3 w-3 mr-1" /> {item.serial_number}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        Batch: {item.batch_number || '-'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] text-gray-400">
                                                            {new Date(item.scanned_at).toLocaleTimeString()}
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

            {/* QR Scanner Overlay */}
            {isScannerOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b flex items-center justify-between bg-orange-50">
                            <div className="flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-orange-600" />
                                <span className="font-bold">Scan QR for Issuing</span>
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
                        <div className="p-4 bg-gray-50 text-xs text-gray-500 space-y-1">
                            <div className="flex items-center gap-2 font-medium text-orange-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>Issuing Validation</span>
                            </div>
                            <p>System will verify item status is "in_stock" before allowing dispatch.</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="mt-6 text-white hover:bg-white/10"
                        onClick={() => setIsScannerOpen(false)}
                    >
                        Cancel
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PhysicalIssuingPage;
