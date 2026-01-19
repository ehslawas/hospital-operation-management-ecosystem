import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { registerNewCylinders } from '@/services/pharmacy/oxygenService';
import { useAuthStore } from '@/stores/authStore';
import { QRCodeSVG } from 'qrcode.react';
import {
    QrCode,
    Printer,
    Plus,
    Trash2,
    Layout,
    AirVent,
    Activity
} from 'lucide-react';
import { Button, Card, Input, Select } from '@/components/ui';

interface GeneratedLabel {
    id: string;
    size_code: string;
    type_name: string;
    qr_value: string;
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

    const [recentCylinders, setRecentCylinders] = useState<any[]>([]);

    // Hardcoded presets for quick selection
    const sizePresets = [
        { code: 'P101-D', capacity: '0.5m³' },
        { code: 'P101-E', capacity: '0.7m³' },
        { code: 'P101-F', capacity: '1.4m³' },
        { code: 'P101-HS', capacity: '6.4m³' },
        { code: '101-F', capacity: '1.4m³' },
        { code: '101-N', capacity: '8.0m³' }
    ];

    const typePresets = ['Bullnose', 'Pin Index'];

    useEffect(() => {
        if (user?.hospital_id) {
            fetchExistingSerials();
            fetchRecentCylinders();
        }
    }, [user?.hospital_id]);

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

            // Suggest next serial
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

    const fetchRecentCylinders = async () => {
        try {
            const { data, error } = await supabase
                .from('pharmacy_oxygen_cylinder_inventory')
                .select('*, size_info:pharmacy_oxygen_cylinder_sizes(*)')
                .eq('hospital_id', user?.hospital_id)
                .order('created_at', { ascending: false })
                .limit(12);

            if (error) throw error;
            setRecentCylinders(data || []);
        } catch (err) {
            console.error("Failed to fetch recent cylinders:", err);
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
                newLabels.push({
                    id: Math.random().toString(36).substr(2, 9),
                    size_code: currentSize,
                    type_name: currentType,
                    qr_value: uniqueId,
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

        const PREVIEW_LIMIT = 50;
        if (labels.length + newLabels.length > PREVIEW_LIMIT) {
            if (!confirm(`You are generating a large number of labels (${labels.length + newLabels.length}). This might be slow to render. Continue?`)) {
                return;
            }
        }

        // SAVE TO DB
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

            if (error) {
                alert(`Error saving to registry: ${error}`);
                return;
            }

            // On success
            setLabels([...labels, ...newLabels]);
            setStartingSerial(serialNum.toString());
            fetchRecentCylinders(); // Refresh list

        } catch (e) {
            console.error(e);
            alert("Failed to save cylinders to registry.");
        } finally {
            setIsLoading(false);
        }
    };

    const removeLabel = (id: string) => {
        setLabels(labels.filter(l => l.id !== id));
    };

    const clearAll = () => setLabels([]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header - Hide on print */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <QrCode className="w-8 h-8 text-sky-600" />
                        Cylinder QR Generator
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Generate and register professional QR labels for medical oxygen cylinders.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={clearAll} disabled={labels.length === 0}>
                        <Trash2 className="w-4 h-4 mr-2" /> Clear All
                    </Button>
                    <Button onClick={handlePrint} disabled={labels.length === 0} className="bg-sky-600 hover:bg-sky-700">
                        <Printer className="w-4 h-4 mr-2" /> Print Labels
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Controls Panel - Hide on print */}
                <div className="lg:col-span-1 space-y-6 print:hidden">
                    <Card className="p-5 space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                            <Layout className="w-4 h-4 text-sky-500" />
                            Generator Settings
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cylinder Size</label>
                                <Select value={currentSize} onChange={e => setCurrentSize(e.target.value)}>
                                    {sizePresets.map(s => (
                                        <option key={s.code} value={s.code}>{s.code} ({s.capacity})</option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cylinder Type</label>
                                <Select value={currentType} onChange={e => setCurrentType(e.target.value)}>
                                    {typePresets.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center justify-between">
                                        Start Serial
                                        {isLoading && <Activity className="w-3 h-3 animate-spin text-sky-500" />}
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={startingSerial}
                                        onChange={e => setStartingSerial(e.target.value)}
                                        placeholder="e.g. 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={count}
                                        onChange={e => setCount(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                            </div>

                            <Button onClick={generateLabels} isLoading={isLoading} className="w-full bg-sky-600">
                                <Plus className="w-4 h-4 mr-2" /> Generate & Register
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-4 bg-emerald-50 border-emerald-100 flex gap-3">
                        <div className="shrink-0 p-2 bg-emerald-100 rounded-full">
                            <Activity className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-800 uppercase mb-1">Registry Info</p>
                            <p className="text-[10px] text-emerald-700 leading-relaxed">
                                Labels generated here are automatically saved to the <strong>Pharmacy Registry</strong> as 'Available' in Store.
                            </p>
                        </div>
                    </Card>

                    {/* Recently Registered Section */}
                    <div className="pt-4 border-t border-slate-200">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Recently Registered</label>
                        <div className="space-y-2">
                            {recentCylinders.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No recent registrations.</p>
                            ) : (
                                recentCylinders.map(cyl => (
                                    <div key={cyl.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-700">{cyl.qr_code}</p>
                                            <p className="text-[9px] text-slate-400 uppercase">{cyl.size_info?.code || 'Unknown Size'}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mb-1"></span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Labels Preview Area */}
                <div className="lg:col-span-3 labels-container">
                    {labels.length === 0 ? (
                        <div className="h-64 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-white print:hidden">
                            <QrCode className="w-12 h-12 mb-2 opacity-20" />
                            <p>No labels generated in this session.</p>
                            <p className="text-xs text-gray-300 mt-2">Adjust settings and click Generate & Register</p>
                        </div>
                    ) : (
                        <div className="label-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 print:grid print:grid-cols-3 print:gap-[2mm] print:p-0">
                            {labels.map((label) => {
                                const isPrivate = label.size_code.startsWith('P');
                                return (
                                    <div
                                        key={label.id}
                                        className="label-card relative group bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:border-sky-300 transition-all flex items-center gap-4 print:shadow-none print:border-gray-400 print:rounded-none print:w-[65mm] print:h-[46mm] print:p-2 print:gap-2 print:border-[0.2pt] print:m-0 print:overflow-hidden print:flex print:box-border"
                                    >
                                        <div className="shrink-0 bg-white p-1 rounded border border-gray-100 print:border-none print:p-0">
                                            <QRCodeSVG
                                                value={label.qr_value}
                                                size={85}
                                                level="H"
                                                includeMargin={false}
                                                className="print:w-[28mm] print:h-[28mm]"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full print:h-[40mm]">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1">
                                                    <AirVent className="w-3 h-3 text-sky-500 print:w-2.5 print:h-2.5" />
                                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter print:text-[7pt] print:leading-none">Oxy Cylinder</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-[11px] font-bold text-sky-700 uppercase leading-none print:text-[8pt]">{label.size_code}</span>
                                                    <span className="text-[9px] text-gray-500 bg-gray-50 px-1 rounded font-bold print:text-[6.5pt] print:bg-transparent print:p-0">#{label.serial_no?.split('-').pop()}</span>
                                                </div>
                                                <div className="text-[9px] font-bold text-gray-600 uppercase leading-none flex items-center gap-1 print:text-[6.5pt] print:mt-1">
                                                    <span className="text-[7px] text-gray-400 font-mono print:text-[5.5pt]">SN:</span>
                                                    <span className="font-mono truncate print:text-[6pt]">{label.serial_no}</span>
                                                </div>
                                                <div className="text-[8px] text-gray-400 font-medium mt-1 print:hidden truncate">
                                                    {label.type_name}
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-1 border-t border-gray-100 print:border-gray-200 print:pt-0.5">
                                                <p className="text-[7.5px] font-black text-rose-600 leading-tight print:text-[6pt] print:font-black">
                                                    {isPrivate ? 'Hak Milik Hospital Lawas (Private)' : 'Loan to Hospital Lawas'}
                                                </p>
                                                <p className="text-[6px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5 print:text-[5.5pt] print:mt-0 text-center">
                                                    KKM MEDICAL RESOURCE
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeLabel(label.id)}
                                            className="absolute -top-2 -right-2 p-1 bg-white border border-rose-100 text-rose-500 rounded-full shadow-sm hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Print styles */}
            <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important; 
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Hide everything except labels */
          .print\\:hidden, button, .lg\\:col-span-1 { display: none !important; }
          .p-6, .max-w-7xl, .main-grid { position: static !important; width: auto !important; height: auto !important; margin: 0 !important; padding: 0 !important; border: none !important; }

          /* Absolute position labels container to bypass parent layout bugs */
          .labels-container {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 5mm !important;
            background: white !important;
            z-index: 9999 !important;
          }

          .label-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 65mm) !important;
            grid-auto-rows: 46mm !important;
            gap: 2mm !important;
            width: 200mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }

          .label-card {
            width: 65mm !important;
            height: 46mm !important;
            display: flex !important;
            margin: 0 !important;
            padding: 3mm !important;
            gap: 3mm !important;
            border: 0.1pt solid #ccc !important;
            page-break-inside: avoid !important;
            background: white !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
        </div>
    );
};

export default QRGeneratorPage;
