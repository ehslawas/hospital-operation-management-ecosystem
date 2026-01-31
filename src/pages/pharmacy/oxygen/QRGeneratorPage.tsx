import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { registerNewCylinders, clearOxygenCylinderRegistry, deleteCylindersBySizeAndType } from '@/services/pharmacy/oxygenService';
import { useAuthStore } from '@/stores/authStore';
import { QRCodeSVG } from 'qrcode.react';
import {
    QrCode,
    Printer,
    Plus,
    Trash2,
    AirVent,
    Activity,
    ChevronRight,
    History,
    CheckCircle2,
    Layers,
    BadgeCheck,
    RotateCcw
} from 'lucide-react';
import { Button, Card, Input, Select, Badge, Spinner } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedLabel {
    id: string;
    size_code: string;
    type_name: string;
    qr_value: string;
    capacity: string;
    serial_no?: string;
}

export const QRGeneratorPage: React.FC = () => {
    const { user } = useAuthStore();
    const [labels, setLabels] = useState<GeneratedLabel[]>([]);
    const [currentSize, setCurrentSize] = useState('P101-D');
    const [currentType, setCurrentType] = useState('Bullnose');
    const [count, setCount] = useState(1);
    const [startingSerial, setStartingSerial] = useState('1');
    const [existingSerials, setExistingSerials] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [registrySummary, setRegistrySummary] = useState<any[]>([]);
    const [selectedRegistrySize, setSelectedRegistrySize] = useState<string | null>(null);
    const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [sizeDetails, setSizeDetails] = useState<any[]>([]);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    const sizePresets = [
        { code: 'P101-E', capacity: '0.7m³', label: 'E' },
        { code: 'P101-D', capacity: '0.5m³', label: 'D' },
        { code: 'P101-F', capacity: '1.4m³', label: 'F' },
        { code: 'P101-HS', capacity: '6.4m³', label: 'HS' },
        { code: '101-F', capacity: '1.4m³', label: '101-F' },
        { code: '101-N', capacity: '8.0m³', label: '101-N' }
    ];

    const typePresets = ['Bullnose', 'Pin Index'];

    useEffect(() => {
        if (user?.hospital_id) {
            fetchExistingSerials();
            fetchRegistrySummary();
        }
    }, [user?.hospital_id]);

    const fetchRegistrySummary = async () => {
        try {
            // Fetch all valid combinations from the database (no hardcoding)
            const { data: combos, error: combosError } = await supabase
                .from('pharmacy_oxygen_size_type_combos')
                .select(`
                    display_name,
                    display_order,
                    size:pharmacy_oxygen_cylinder_sizes(id, code),
                    type:pharmacy_oxygen_cylinder_types(id, name)
                `)
                .eq('is_active', true)
                .order('display_order');

            if (combosError) throw combosError;

            // Fetch inventory counts
            const { data: inventory, error: invError } = await supabase
                .from('pharmacy_oxygen_cylinder_inventory')
                .select('serial_number, cylinder_size_id, cylinder_type_id')
                .eq('hospital_id', user?.hospital_id);

            if (invError) throw invError;

            // Build summary from combos table
            const summary = combos.map((combo: any) => {
                const sizeId = combo.size?.id;
                const typeId = combo.type?.id;

                const matching = inventory.filter((item: any) =>
                    item.cylinder_size_id === sizeId && item.cylinder_type_id === typeId
                );

                const serials = matching.map((m: any) => m.serial_number).sort();

                return {
                    display_name: combo.display_name,
                    size_code: combo.size?.code,
                    type_name: combo.type?.name,
                    total_count: matching.length,
                    first_serial: serials[0] || '',
                    last_serial: serials[serials.length - 1] || ''
                };
            });

            setRegistrySummary(summary);
        } catch (err) {
            console.error("Failed to fetch registry summary:", err);
        }
    };

    const fetchSizeDetails = async (sizeCode: string, typeName?: string, displayName?: string) => {
        setIsDetailsLoading(true);
        // Use the display_name passed from the registry card (database-driven)
        setSelectedRegistrySize(displayName || sizeCode);
        try {
            const { data: sizeData } = await supabase.from('pharmacy_oxygen_cylinder_sizes').select('id').eq('code', sizeCode).single();
            const { data: typeData } = typeName ? await supabase.from('pharmacy_oxygen_cylinder_types').select('id').eq('name', typeName).single() : { data: null };

            if (sizeData) {
                setSelectedSizeId(sizeData.id);
                setSelectedTypeId(typeData?.id || null);

                let query = supabase
                    .from('pharmacy_oxygen_cylinder_inventory')
                    .select('*')
                    .eq('hospital_id', user?.hospital_id)
                    .eq('cylinder_size_id', sizeData.id);

                if (typeData) {
                    query = query.eq('cylinder_type_id', typeData.id);
                }

                const { data: items } = await query.order('serial_number', { ascending: false });
                setSizeDetails(items || []);
            }
        } catch (err) {
            console.error("Failed to fetch size details:", err);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const handleClearCategory = async () => {
        if (!user?.hospital_id || !selectedSizeId) return;

        const confirmed = window.confirm(
            `⚠️ DANGER: This will permanently delete ALL ${sizeDetails.length} records for "${selectedRegistrySize}".\n\nAre you sure?`
        );

        if (!confirmed) return;

        setIsDetailsLoading(true);
        try {
            const { error } = await deleteCylindersBySizeAndType(
                user.hospital_id,
                selectedSizeId,
                selectedTypeId || undefined
            );

            if (error) throw new Error(error);

            setSizeDetails([]);
            fetchRegistrySummary();
            setSelectedRegistrySize(null);
            alert("Category cleared successfully.");
        } catch (err: any) {
            alert(`Failed to clear category: ${err.message}`);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const fetchExistingSerials = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('pharmacy_oxygen_cylinder_inventory')
                .select('serial_number')
                .eq('hospital_id', user?.hospital_id);

            if (error) throw error;
            const serials = data?.map(d => d.serial_number).filter(Boolean) as string[];
            setExistingSerials(serials || []);

            const numericSerials = serials
                ?.map(s => {
                    const match = s.match(/\d+$/);
                    return match ? parseInt(match[0]) : 0;
                })
                .filter(n => n > 0) || [];

            if (numericSerials.length > 0) {
                setStartingSerial((Math.max(...numericSerials) + 1).toString());
            }
        } catch (err) {
            console.error('Failed to fetch serials:', err);
        } finally {
            setIsLoading(false);
        }
    };


    const generateLabels = async () => {
        if (!user?.hospital_id) return;

        const newLabels: GeneratedLabel[] = [];
        let serialNum = parseInt(startingSerial) || 1;
        const usedInSession = labels.map(l => l.serial_no).filter(Boolean) as string[];
        const allTaken = new Set([...existingSerials, ...usedInSession]);

        let generatedCount = 0;
        let attempts = 0;

        while (generatedCount < count && attempts < 1000) {
            const serialStr = `${currentSize}-${serialNum.toString().padStart(4, '0')}`;

            if (!allTaken.has(serialStr)) {
                const uniqueId = `O2-${serialStr}`;
                const preset = sizePresets.find(s => s.code === currentSize);
                newLabels.push({
                    id: Math.random().toString(36).substr(2, 9),
                    size_code: currentSize,
                    type_name: currentType,
                    qr_value: uniqueId,
                    capacity: preset?.capacity || 'N/A',
                    serial_no: serialStr
                });
                generatedCount++;
            }
            serialNum++;
            attempts++;
        }

        if (newLabels.length < count) {
            alert(`Only generated ${newLabels.length} labels. Some serial numbers might already be in use.`);
        }

        setIsLoading(true);
        try {
            const { error } = await registerNewCylinders(
                user.hospital_id,
                newLabels.map(l => ({
                    qr_code: l.qr_value,
                    serial_number: l.serial_no!,
                    size_code: l.size_code,
                    type_name: l.type_name
                }))
            );

            if (error) throw new Error(error);

            setLabels([...labels, ...newLabels]);
            setStartingSerial(serialNum.toString());
            fetchRegistrySummary(); // Refresh stats immediately

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

    const handleWipeRegistry = async () => {
        if (!user?.hospital_id) return;

        const confirmed = window.confirm(
            "⚠️ DANGER: This will permanently delete ALL registered cylinder assets and movement history for this hospital from the database.\n\nAre you absolutely sure?"
        );

        if (!confirmed) return;

        setIsLoading(true);
        try {
            const res = await clearOxygenCylinderRegistry(user.hospital_id);
            if (res.error) throw new Error(res.error);

            setLabels([]);
            fetchRegistrySummary();
            alert("Registry wiped successfully.");
        } catch (err: any) {
            alert(`Failed to wipe registry: ${err.message}`);
        } finally {
            setIsLoading(true); // Short delay for reload
            window.location.reload();
        }
    };

    // Grouping Logic
    const groupedLabelsMap = labels.reduce((acc, label) => {
        const key = `${label.type_name} — ${label.size_code}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(label);
        return acc;
    }, {} as Record<string, GeneratedLabel[]>);

    const groupedLabels = Object.entries(groupedLabelsMap);

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900 selection:bg-sky-100 selection:text-sky-900 print:bg-white print:p-0 print:m-0 print:min-h-0">
            {/* Global print styles are managed in index.css via #print-labels-grid-root */}
            <div className="max-w-[1600px] mx-auto space-y-8 print:hidden">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200 print:hidden">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>Pharmacy</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span>Oxygen</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-sky-600">QR Generator</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-sky-600 rounded-2xl shadow-lg shadow-sky-200">
                                <QrCode className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-slate-900">Cylinder Asset Factory</h1>
                                <p className="text-slate-500 font-medium">Generate, register, and print professional-grade QR identifiers.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleWipeRegistry}
                            className="border-rose-200 text-rose-600 hover:bg-rose-50 h-12 px-6 rounded-xl font-bold transition-all"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Wipe Assets
                        </Button>
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

                {/* Horizontal Registry Dashboard */}
                <div className="mb-8 space-y-4 print:hidden">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        <BadgeCheck className="w-3.5 h-3.5" /> Established Registry Overview
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {registrySummary.map((stat, idx) => (
                            <motion.div
                                key={`${stat.size_code}-${stat.type_name}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => fetchSizeDetails(stat.size_code, stat.type_name, stat.display_name)}
                                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-400 hover:shadow-md transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-12 h-12 bg-slate-50 rounded-full -mr-6 -mt-6 group-hover:bg-sky-50 transition-colors" />

                                <div className="relative z-10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-slate-900 tracking-tight leading-none truncate pr-1">{stat.display_name}</span>
                                        <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] px-1.5 py-0 font-black">
                                            {stat.total_count}
                                        </Badge>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Latest SN</p>
                                        <p className="text-[10px] font-mono font-bold text-slate-600 truncate">
                                            {stat.last_serial ? stat.last_serial.split('-').pop() : '...'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cylinder Size</label>
                                    <Select value={currentSize} onChange={e => setCurrentSize(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold focus:ring-2 focus:ring-sky-500/20">
                                        {sizePresets.map(s => (
                                            <option key={s.code} value={s.code}>{s.code} — {s.capacity}</option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valve / Connection Type</label>
                                    <Select value={currentType} onChange={e => setCurrentType(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold focus:ring-2 focus:ring-sky-500/20">
                                        {typePresets.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Serial</label>
                                            {isLoading && <Spinner className="w-3 h-3 text-sky-500" />}
                                        </div>
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
                                            max={99}
                                            value={count}
                                            onChange={e => setCount(parseInt(e.target.value) || 1)}
                                            className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={generateLabels}
                                    isLoading={isLoading}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-slate-200"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Generate & Record
                                </Button>
                            </div>
                        </Card>

                        <Card className="p-4 bg-indigo-900 border-none shadow-xl shadow-indigo-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <BadgeCheck className="w-16 h-16 text-white" />
                            </div>
                            <div className="relative z-10 flex gap-4">
                                <div className="shrink-0 p-2.5 bg-white/10 rounded-xl">
                                    <Activity className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-sky-300 uppercase tracking-widest mb-1">System Logic</p>
                                    <p className="text-[11px] text-white/80 font-medium leading-relaxed">
                                        Cylinders are automatically registered to <strong>Store</strong> as <strong>Available</strong> assets upon generation.
                                    </p>
                                </div>
                            </div>
                        </Card>

                    </aside>

                    {/* Main Labels Display */}
                    {/* Main Labels Display - Screen Only */}
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
                                    <p className="text-sm text-slate-400 mt-2 font-medium max-w-xs text-center">Configure generator settings on the left to start manufacturing cylinder identifiers.</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-12">
                                    {groupedLabels.map(([groupKey, groupLabels], gIdx) => (
                                        <motion.div
                                            key={groupKey}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: gIdx * 0.1 }}
                                            className="space-y-6"
                                        >
                                            {/* Group Banner */}
                                            <div className="flex items-center gap-4 print:hidden">
                                                <div className="h-px flex-1 bg-slate-200/60" />
                                                <div className="flex items-center gap-3 px-6 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
                                                    <Badge variant="info" className="px-3 py-1 font-black text-xs uppercase tracking-widest">{groupKey}</Badge>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{groupLabels.length} Units Generated</span>
                                                </div>
                                                <div className="h-px flex-1 bg-slate-200/60" />
                                            </div>

                                            {/* Sub-grid of Labels */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 print:grid print:grid-cols-4 print:gap-[4mm] print:place-content-center print:w-full print:h-full print:mx-auto">
                                                {groupLabels.map((label) => {
                                                    // Split volume for styling
                                                    const volMatch = label.capacity.match(/^([\d.]+)(.*)$/);
                                                    const volNum = volMatch ? volMatch[1] : label.capacity;
                                                    const volUnit = volMatch ? volMatch[2] : '';

                                                    return (
                                                        <motion.div
                                                            key={label.id}
                                                            whileHover={{ y: -4, scale: 1.02 }}
                                                            className="label-card relative group bg-white border-2 border-slate-200 p-2 rounded-2xl shadow-sm hover:shadow-2xl hover:border-sky-400 transition-all flex items-stretch gap-2 print:shadow-none print:border-slate-300 print:rounded-none print:w-[67mm] print:h-[64mm] print:p-2 print:gap-2 print:border-[0.2pt] print:m-0 print:overflow-hidden print:flex print:box-border"
                                                        >
                                                            <div className="flex h-full w-full">
                                                                {/* LEFT SIDEBAR: Header + QR + Footer */}
                                                                <div className="w-[35%] bg-slate-50 border-r border-slate-200 flex flex-col items-center justify-between p-2 shrink-0 print:border-r-[0.5pt] print:w-[22mm] print:bg-transparent print:p-1">
                                                                    {/* Header */}
                                                                    <div className="flex flex-col items-center gap-0.5 w-full text-center">
                                                                        <div className="flex items-center gap-1 opacity-90">
                                                                            <AirVent className="w-3 h-3 text-sky-600 print:w-2 print:h-2 print:text-black" />
                                                                            <span className="text-[8px] font-black text-slate-950 uppercase tracking-wider print:text-[5pt]">OXY ID</span>
                                                                        </div>
                                                                        <span className="text-[9px] font-black text-slate-950 px-1 py-0 rounded border border-slate-200 bg-white leading-none print:text-[6pt] print:border-[0.5pt]">
                                                                            #{label.serial_no?.split('-').pop()}
                                                                        </span>
                                                                    </div>

                                                                    {/* QR Code */}
                                                                    <div className="py-1 flex items-center justify-center">
                                                                        <QRCodeSVG
                                                                            value={label.qr_value}
                                                                            size={85}
                                                                            level="H"
                                                                            includeMargin={false}
                                                                            className="print:w-[18mm] print:h-[18mm]"
                                                                        />
                                                                    </div>

                                                                    {/* Footer / Ownership */}
                                                                    <div className="text-center w-full">
                                                                        <p className="text-[9px] font-black text-rose-700 uppercase tracking-tight leading-none mb-0.5 print:text-[6pt] print:leading-none">
                                                                            HOSPITAL LAWAS
                                                                        </p>
                                                                        {label.size_code?.startsWith('101-') ? (
                                                                            <span className="mt-1 px-1.5 py-0.5 bg-sky-100 text-[#0c4a6e] border border-sky-200 rounded text-[6px] font-bold tracking-[0.1em] uppercase print:bg-none print:border-[0.2pt] print:border-black print:text-black print:text-[4pt]">
                                                                                LOAN CYLINDER
                                                                            </span>
                                                                        ) : (
                                                                            <p className="text-[7px] font-black text-slate-950 uppercase tracking-wider print:text-[4.5pt]">
                                                                                (PRIVATE)
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* RIGHT CONTENT: Data Details */}
                                                                <div className="flex-1 p-2 flex flex-col justify-center gap-2 print:p-2 print:gap-1">
                                                                    {/* Cylinder Name */}
                                                                    <div className="border-b-2 border-slate-100 pb-1 print:border-b-[0.5pt]">
                                                                        <div className="flex items-baseline gap-2">
                                                                            <span className="text-4xl font-black text-slate-950 leading-none tracking-tighter block whitespace-nowrap print:text-[20pt]">
                                                                                {label.size_code}
                                                                            </span>
                                                                            {label.size_code?.startsWith('101-') && (
                                                                                <span className="text-xl font-black text-sky-600 leading-none tracking-tighter print:text-[10pt] print:text-black">
                                                                                    LOAN
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-2 print:space-y-1">
                                                                        {/* Valve Type */}
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[8px] font-black text-slate-950 uppercase tracking-widest print:text-[5pt]">
                                                                                VALVE
                                                                            </span>
                                                                            <span className="text-[10px] font-black text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 print:text-[7pt] print:bg-transparent print:border-[0.5pt]">
                                                                                {label.type_name}
                                                                            </span>
                                                                        </div>

                                                                        {/* Volume - MASSIVE */}
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[8px] font-black text-slate-950 uppercase tracking-widest print:text-[5pt]">
                                                                                VOL
                                                                            </span>
                                                                            <div className="flex items-baseline gap-0.5">
                                                                                <span className="text-5xl font-black text-slate-950 leading-none tracking-tighter print:text-[28pt]">
                                                                                    {volNum}
                                                                                </span>
                                                                                <span className="text-xs font-black text-slate-950 print:text-[8pt]">
                                                                                    {volUnit}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Serial ID */}
                                                                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 print:border-t-[0.5pt]">
                                                                            <span className="text-[8px] font-black text-slate-950 uppercase tracking-widest text-slate-400 print:text-[5pt] print:text-black">
                                                                                SN
                                                                            </span>
                                                                            <span className="text-[10px] font-mono font-black text-slate-950 print:text-[7pt]">
                                                                                {label.serial_no}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeLabel(label.id)}
                                                                className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden hover:scale-110 active:scale-95"
                                                            >
                                                                <Plus className="w-3 h-3 rotate-45" />
                                                            </button>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            {/* Drill Down Modal: Registry Archive */}
            {selectedRegistrySize && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
                    >
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Registry Archive: {selectedRegistrySize}</h2>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Historical Generated ID Log</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setSelectedRegistrySize(null)}
                                className="rounded-xl border-slate-200 hover:bg-slate-50 h-9 text-xs font-bold"
                            >
                                <Plus className="w-3.5 h-3.5 rotate-45 mr-1" /> Close
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sizeDetails.length} Registered Identifiers</p>
                                <Button
                                    variant="outline"
                                    onClick={handleClearCategory}
                                    disabled={sizeDetails.length === 0}
                                    className="border-rose-100 text-rose-500 hover:bg-rose-50 h-8 text-[10px] font-black uppercase px-3 rounded-lg transition-all active:scale-95"
                                >
                                    <Trash2 className="w-3 h-3 mr-1.5" /> Clear All Records
                                </Button>
                            </div>
                            {isDetailsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Spinner className="w-10 h-10 text-sky-600" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Querying Registry...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
                                    {sizeDetails.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.005 }}
                                            className="p-2 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-1 group hover:bg-white hover:border-sky-200 transition-all hover:shadow-md cursor-default relative overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-mono font-black text-sky-600">
                                                    #{item.serial_number?.split('-').pop() || 'N/A'}
                                                </span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            </div>
                                            <div className="space-y-0 text-center py-0.5">
                                                <p className="text-[10px] font-black text-slate-800 font-mono tracking-tighter leading-none">{item.qr_code}</p>
                                            </div>
                                            <div className="pt-1 border-t border-slate-100 mt-0.5 flex items-center justify-between">
                                                <p className="text-[7px] font-bold text-slate-400 uppercase">{new Date(item.created_at).toLocaleDateString()}</p>
                                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500/30" />
                                            </div>
                                        </motion.div>
                                    ))}
                                    {sizeDetails.length === 0 && (
                                        <div className="col-span-full py-20 text-center">
                                            <p className="text-slate-400 italic">No records found for this size.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}


            {/* Unified Print-Only Grid Container */}
            <div id="print-labels-grid-root" className={labels.length > 0 ? '' : 'hidden'}>
                {labels.map((label) => {
                    const volMatch = label.capacity.match(/^([\d.]+)(.*)$/);
                    const volNum = volMatch ? volMatch[1] : label.capacity;
                    const volUnit = volMatch ? volMatch[2] : '';

                    return (
                        <div key={`print-${label.id}`} className="bg-white border-[0.5pt] border-black p-2 flex items-stretch gap-2 overflow-hidden box-border" style={{ width: '72mm', height: '50mm' }}>
                            <div className="flex h-full w-full">
                                {/* LEFT SIDEBAR */}
                                <div className="w-[35%] border-r-[0.5pt] border-black flex flex-col items-center justify-between p-1 shrink-0">
                                    <div className="flex flex-col items-center gap-0.5 w-full text-center">
                                        <div className="flex items-center gap-1">
                                            <AirVent className="w-2.5 h-2.5 text-black" />
                                            <span className="text-[7pt] font-black text-black uppercase tracking-wider">OXY ID</span>
                                        </div>
                                        <span className="text-[8pt] font-black text-black px-1 py-0.5 rounded border-[0.5pt] border-black leading-none">
                                            #{label.serial_no?.split('-').pop()}
                                        </span>
                                    </div>
                                    <div className="py-1 flex items-center justify-center">
                                        <QRCodeSVG
                                            value={label.qr_value}
                                            size={85}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <div className="text-center w-full">
                                        <p className="text-[10pt] font-black text-black uppercase leading-none">HOSPITAL LAWAS</p>
                                        {label.size_code?.startsWith('101-') ? (
                                            <div className="mt-1 px-2 py-0.5 border-[0.8pt] border-black rounded-sm text-[6.5pt] font-black tracking-widest text-center">
                                                LOAN CYLINDER
                                            </div>
                                        ) : (
                                            <p className="text-[7pt] font-black text-black uppercase tracking-widest">(PRIVATE)</p>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT CONTENT */}
                                <div className="flex-1 p-2 flex flex-col justify-center gap-1">
                                    <div className="border-b-[0.5pt] border-black pb-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-[20pt] font-black text-black leading-none tracking-tighter block whitespace-nowrap">
                                                {label.size_code}
                                            </span>
                                            {label.size_code?.startsWith('101-') && (
                                                <span className="text-[10pt] font-black text-black leading-none tracking-tighter">
                                                    LOAN
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[5pt] font-black text-black uppercase tracking-widest">VALVE</span>
                                            <span className="text-[7pt] font-black text-black px-1.5 py-0.5 rounded border-[0.5pt] border-black">
                                                {label.type_name}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[5pt] font-black text-black uppercase tracking-widest">VOL</span>
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="text-[28pt] font-black text-black leading-none tracking-tighter">{volNum}</span>
                                                <span className="text-[8pt] font-black text-black">{volUnit}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-1 border-t-[0.5pt] border-black">
                                            <span className="text-[5pt] font-black text-black uppercase tracking-widest">SN</span>
                                            <span className="text-[7pt] font-mono font-black text-black">{label.serial_no}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QRGeneratorPage;
