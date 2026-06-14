import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { registerItems, generateQRCode } from '@/services/pharmacy/itemRegistryService';
import { useAuthStore } from '@/stores/authStore';
import { QRCodeSVG } from 'qrcode.react';
import {
    QrCode,
    Printer,
    Plus,
    Package,
    ChevronRight,
    PackageCheck,
    RotateCcw,
    Layers
} from 'lucide-react';
import { Button, Card, Input, Select, Badge, Spinner } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedQRLabel {
    id: string;
    item_type: 'drug' | 'non_drug';
    item_name: string;
    qr_code: string;
    serial_number: string;
    catalog_item_id: string;
    batch_id?: string;
    batch_number?: string;
}

interface CatalogItem {
    id: string;
    drug_code?: string;
    drug_name?: string;
    item_code?: string;
    item_name?: string;
    type: 'drug' | 'non_drug';
}

export const ItemQRGeneratorPage: React.FC = () => {
    const { user } = useAuthStore();
    const [labels, setLabels] = useState<GeneratedQRLabel[]>([]);
    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<string>('');
    const [itemType, setItemType] = useState<'drug' | 'non_drug'>('drug');
    const [count, setCount] = useState(1);
    const [startingSerial, setStartingSerial] = useState('1');
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingItems, setIsFetchingItems] = useState(false);

    useEffect(() => {
        if (user?.hospital_id) {
            fetchCatalogItems();
        }
    }, [user?.hospital_id, itemType]);

    // Fetch Batches for Selected Item
    useEffect(() => {
        const fetchBatches = async () => {
            if (!selectedItem || !user?.hospital_id) return;
            try {
                const { data, error } = await supabase
                    .from('pharmacy_stock_batches')
                    .select('id, batch_number, expiry_date')
                    .eq('item_id', selectedItem)
                    .eq('item_type', itemType)
                    .order('expiry_date', { ascending: true });

                if (error) throw error;
                setBatches(data || []);
                if (data && data.length > 0) {
                    setSelectedBatchId(data[0].id);
                } else {
                    setSelectedBatchId('');
                }
            } catch (err: any) {
                console.error('Failed to load batches:', err);
            }
        };
        fetchBatches();
    }, [selectedItem, user?.hospital_id, itemType]);

    const fetchCatalogItems = async () => {
        setIsFetchingItems(true);
        try {
            if (itemType === 'drug') {
                const { data, error } = await supabase
                    .from('master_drugs')
                    .select('id, drug_code, drug_name')
                    .order('drug_name');

                if (error) throw error;
                setCatalogItems(data?.map(d => ({ ...d, type: 'drug' as const })) || []);
            } else {
                const { data, error } = await supabase
                    .from('master_non_drugs')
                    .select('id, item_code, item_name')
                    .order('item_name');

                if (error) throw error;
                setCatalogItems(data?.map(d => ({ ...d, type: 'non_drug' as const })) || []);
            }
        } catch (err) {
            console.error('Failed to fetch catalog items:', err);
        } finally {
            setIsFetchingItems(false);
        }
    };

    const generateLabels = async () => {
        if (!user?.hospital_id || !selectedItem) {
            alert('Please select an item first');
            return;
        }

        const selectedCatalogItem = catalogItems.find(i => i.id === selectedItem);
        if (!selectedCatalogItem) return;

        const selectedBatch = batches.find(b => b.id === selectedBatchId);

        const newLabels: GeneratedQRLabel[] = [];
        let serialNum = parseInt(startingSerial) || 1;

        for (let i = 0; i < count; i++) {
            const serialStr = `${serialNum.toString().padStart(6, '0')}`;
            const qrCode = generateQRCode(itemType === 'drug' ? 'DRG' : 'NDG', serialNum, selectedBatch?.batch_number);
            const itemName = itemType === 'drug'
                ? selectedCatalogItem.drug_name!
                : selectedCatalogItem.item_name!;

            newLabels.push({
                id: Math.random().toString(36).substr(2, 9),
                item_type: itemType,
                item_name: itemName,
                qr_code: qrCode,
                serial_number: serialStr,
                catalog_item_id: selectedItem,
                batch_id: selectedBatchId || undefined,
                batch_number: selectedBatch?.batch_number || undefined
            });

            serialNum++;
        }

        setIsLoading(true);
        try {
            // Register items in database
            const { error } = await registerItems(
                user.hospital_id,
                newLabels.map(l => ({
                    qr_code: l.qr_code,
                    serial_number: l.serial_number,
                    item_type: l.item_type,
                    item_id: l.catalog_item_id, // Map catalog_item_id to item_id
                    batch_id: l.batch_id
                })),
                user?.id
            );

            if (error) throw new Error(error);

            setLabels([...labels, ...newLabels]);
            setStartingSerial(serialNum.toString());

        } catch (e: any) {
            console.error(e);
            alert(`Failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const removeLabel = (id: string) => {
        setLabels(labels.filter(l => l.id !== id));
    };

    const clearAll = () => setLabels([]);
    const handlePrint = () => window.print();

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900 selection:bg-sky-100 selection:text-sky-900 print:bg-white print:p-0 print:m-0 print:min-h-0">
            <div className="max-w-[1600px] mx-auto space-y-8 print:hidden">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200 print:hidden">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>Pharmacy</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span>Item Tracking</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-sky-600">QR Generator</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-sky-600 rounded-2xl shadow-lg shadow-sky-200">
                                <QrCode className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-slate-900">Item QR Generator</h1>
                                <p className="text-slate-500 font-medium">Generate QR codes for physical item tracking.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={clearAll}
                            disabled={labels.length === 0}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50 h-12 px-6 rounded-xl font-bold transition-all disabled:opacity-30"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" /> Clear Session
                        </Button>
                        <Button
                            onClick={handlePrint}
                            disabled={labels.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 h-12 px-8 gap-3 rounded-xl font-bold transition-all active:scale-95 border-b-4 border-indigo-800"
                        >
                            <Printer className="w-5 h-5" /> Print Labels ({labels.length})
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Controls Column */}
                    <aside className="lg:col-span-3 space-y-6 print:hidden">
                        <Card className="p-6 border-slate-200 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                                <Layers className="w-5 h-5 text-sky-500" />
                                <h3 className="font-black text-slate-800 uppercase tracking-tight">Generator Config</h3>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Type</label>
                                    <Select value={itemType} onChange={e => setItemType(e.target.value as 'drug' | 'non_drug')} className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold focus:ring-2 focus:ring-sky-500/20">
                                        <option value="drug">Drug</option>
                                        <option value="non_drug">Non-Drug</option>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Item</label>
                                        {isFetchingItems && <Spinner className="w-3 h-3 text-sky-500" />}
                                    </div>
                                    <Select
                                        value={selectedItem}
                                        onChange={e => setSelectedItem(e.target.value)}
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold focus:ring-2 focus:ring-sky-500/20"
                                        disabled={isFetchingItems}
                                    >
                                        <option value="">-- Select Item --</option>
                                        {catalogItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {itemType === 'drug'
                                                    ? `${item.drug_code} - ${item.drug_name}`
                                                    : `${item.item_code} - ${item.item_name}`
                                                }
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Batch (Optional)</label>
                                    <Select
                                        value={selectedBatchId}
                                        onChange={e => setSelectedBatchId(e.target.value)}
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold focus:ring-2 focus:ring-sky-500/20"
                                    >
                                        <option value="">-- No Batch --</option>
                                        {batches.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.batch_number} {b.expiry_date ? `(Exp: ${new Date(b.expiry_date).toLocaleDateString()})` : ''}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Serial</label>
                                        <Input
                                            type="number"
                                            value={startingSerial}
                                            onChange={e => setStartingSerial(e.target.value)}
                                            className="h-11 rounded-xl bg-slate-50 border-slate-200 font-mono font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={count}
                                            onChange={e => setCount(parseInt(e.target.value) || 1)}
                                            className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={generateLabels}
                                    isLoading={isLoading}
                                    disabled={!selectedItem}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-slate-200 disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Generate & Record
                                </Button>
                            </div>
                        </Card>

                        <Card className="p-4 bg-indigo-900 border-none shadow-xl shadow-indigo-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <PackageCheck className="w-16 h-16 text-white" />
                            </div>
                            <div className="relative z-10 flex gap-4">
                                <div className="shrink-0 p-2.5 bg-white/10 rounded-xl">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-sky-300 uppercase tracking-widest mb-1">System Logic</p>
                                    <p className="text-[11px] text-white/80 font-medium leading-relaxed">
                                        Items are registered to <strong>Store</strong> as <strong>Available</strong> upon QR generation.
                                    </p>
                                </div>
                            </div>
                        </Card>

                    </aside>

                    {/* Main Labels Display */}
                    <main className="lg:col-span-9 space-y-12 min-h-[600px] print:hidden">
                        <AnimatePresence mode="popLayout">
                            {labels.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="h-full min-h-[500px] border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 bg-white/50 print:hidden backdrop-blur-sm"
                                >
                                    <div className="p-8 bg-slate-100 rounded-full mb-6 text-slate-300">
                                        <QrCode className="w-16 h-16 opacity-40" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Workbench Empty</h3>
                                    <p className="text-sm text-slate-400 mt-2 font-medium max-w-xs text-center">Select an item and configure settings to start generating QR codes.</p>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {labels.map((label, idx) => (
                                        <motion.div
                                            key={label.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            whileHover={{ y: -4, scale: 1.02 }}
                                            className="label-card relative group bg-white border-2 border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-2xl hover:border-sky-400 transition-all"
                                        >
                                            <div className="flex flex-col items-center gap-4">
                                                {/* QR Code */}
                                                <div className="p-3 bg-slate-50 rounded-xl">
                                                    <QRCodeSVG
                                                        value={label.qr_code}
                                                        size={160}
                                                        level="H"
                                                        includeMargin={false}
                                                    />
                                                </div>

                                                {/* Item Details */}
                                                <div className="w-full space-y-2 text-center">
                                                    <Badge variant={label.item_type === 'drug' ? 'info' : 'success'} className="text-xs font-black uppercase">
                                                        {label.item_type === 'drug' ? 'Drug' : 'Non-Drug'}
                                                    </Badge>
                                                    <h4 className="text-sm font-black text-slate-900 truncate px-2">{label.item_name}</h4>
                                                    <div className="space-y-1 pt-2 border-t border-slate-100">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Serial Number</p>
                                                        <p className="text-xs font-mono font-black text-slate-700">{label.serial_number}</p>
                                                    </div>
                                                    {label.batch_number && (
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Batch</p>
                                                            <p className="text-xs font-mono font-black text-slate-700">{label.batch_number}</p>
                                                        </div>
                                                    )}
                                                    <p className="text-[9px] font-mono text-slate-400 truncate">{label.qr_code}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => removeLabel(label.id)}
                                                className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden hover:scale-110 active:scale-95"
                                            >
                                                <Plus className="w-3 h-3 rotate-45" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            {/* Print-Only Grid */}
            <div id="print-labels-grid" className={labels.length > 0 ? '' : 'hidden'}>
                {labels.map((label) => (
                    <div key={`print-${label.id}`} className="bg-white border border-black p-4 flex flex-col items-center gap-3" style={{ width: '80mm', height: '80mm', pageBreakAfter: 'always' }}>
                        <div className="text-center">
                            <p className="text-[8pt] font-black uppercase tracking-widest">Hospital Lawas</p>
                            <Badge variant={label.item_type === 'drug' ? 'info' : 'success'} className="text-[7pt] font-black uppercase mt-1">
                                {label.item_type === 'drug' ? 'Drug' : 'Non-Drug'}
                            </Badge>
                        </div>

                        <QRCodeSVG
                            value={label.qr_code}
                            size={180}
                            level="H"
                            includeMargin={false}
                        />

                        <div className="text-center space-y-1 w-full">
                            <p className="text-[10pt] font-black text-black leading-tight px-2">{label.item_name}</p>
                            <div className="border-t border-black pt-2 space-y-1">
                                <p className="text-[7pt] font-bold uppercase">Serial: {label.serial_number}</p>
                                {label.batch_number && <p className="text-[7pt] font-bold uppercase">Batch: {label.batch_number}</p>}
                            </div>
                            <p className="text-[6pt] font-mono text-black mt-2">{label.qr_code}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ItemQRGeneratorPage;

