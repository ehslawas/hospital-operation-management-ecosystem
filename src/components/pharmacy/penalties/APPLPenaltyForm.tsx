import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { Printer, X, CheckCircle2, Calculator } from 'lucide-react'
import {
    Dialog, DialogContent, Button, Input,
} from '@/components/ui'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase'

interface APPLPenaltyFormProps {
    penalty: any
    onClose: () => void
    onApprove: () => void
}

// THE 21 OFFICIAL PERFORMANCE STANDARDS FROM LAMPIRAN 9
const OFFICIAL_STANDARDS = [
    { id: 'ps1', code: '1', description: 'Penghantaran produk melebihi 7 hari bekerja bagi Semenanjung atau 10 hari bagi Sabah, Sarawak dan WP Labuan', formula: '1.5% x nilai produk gagal dibekalkan x bilangan hari lewat', type: 'percentage', rate: 0.015 },
    { id: 'ps2', code: '2', description: 'Penghantaran di luar waktu pejabat', formula: 'RM500 bagi setiap insiden', type: 'fixed', amount: 500 },
    { id: 'ps3', code: '3', description: 'Tidak menepati lokasi penghantaran', formula: 'RM500 bagi setiap insiden', type: 'fixed', amount: 500 },
    { id: 'ps4', code: '4', description: 'Kuantiti produk yang dibekal melebihi pesanan pada LPO', formula: 'RM500 bagi setiap insiden', type: 'fixed', amount: 500 },
    { id: 'ps5', code: '5', description: 'Produk rosak, usang atau luput yang gagal digantikan setelah ditolak SEBELUM penerimaan dibuat', formula: '1.5% x nilai produk gagal diganti x bilangan hari lewat', type: 'percentage', rate: 0.015 },
    { id: 'ps6', code: '6', description: 'Produk rosak, usang atau luput yang gagal digantikan setelah ditolak SELEPAS penerimaan dibuat', formula: '1.5% x nilai produk gagal diganti x bilangan hari lewat', type: 'percentage', rate: 0.015 },
    { id: 'ps7', code: '7', description: 'Produk tidak mengikut spesifikasi atau deskripsi pada LPO yang gagal digantikan setelah ditolak SEBELUM penerimaan dibuat', formula: '1.5% x nilai produk gagal diganti x bilangan hari lewat', type: 'percentage', rate: 0.015 },
    { id: 'ps8', code: '8', description: 'Produk tidak mengikut spesifikasi atau deskripsi pada LPO yang gagal digantikan setelah ditolak SELEPAS penerimaan dibuat', formula: '1.5% x nilai produk gagal diganti x bilangan hari lewat', type: 'percentage', rate: 0.015 },
    { id: 'ps9', code: '9', description: 'Penghantaran melebihi 24 jam semasa Kecemasan', formula: 'RM5,000 bagi setiap insiden', type: 'fixed', amount: 5000 },
    { id: 'ps10', code: '10', description: 'Penghantaran produk melebihi tempoh yang ditetapkan semasa pandemik atau epidemik', formula: '1.5% x nilai produk gagal dibekalkan x bilangan hari lewat', type: 'percentage', rate: 0.015 },
    { id: 'ps11', code: '11', description: 'Produk dengan baki jangka hayat kurang daripada 50% (bukan vaksin) atau 6 bulan (vaksin) yang gagal digantikan setelah ditolak SEBELUM penerimaan dibuat', formula: '1.5% x nilai produk gagal diganti x bilangan hari lewat', type: 'percentage', rate: 0.015 },
    { id: 'ps12', code: '12', description: 'Produk dengan baki jangka hayat kurang daripada 50% (bukan vaksin) atau 6 bulan (vaksin) yang gagal digantikan setelah ditolak SELEPAS penerimaan dibuat', formula: '1.5% x nilai produk gagal diganti x bilangan hari lewat', type: 'percentage', rate: 0.015 },
    { id: 'ps13', code: '13', description: 'Produk yang dibekal dengan Letter of Undertaking (LOU) yang gagal digantikan dalam tempoh tujuh (7) hari bekerja dari tarikh tamat tempoh', formula: '1.5% x nilai produk gagal diganti x bilangan hari lewat', type: 'percentage', rate: 0.015 },
    { id: 'ps14', code: '14', description: 'Produk yang dibekal tidak mematuhi keperluan rangkaian sejuk dan gagal digantikan mengikut tempoh serahan asal', formula: '1.5% x nilai produk gagal diganti x bilangan hari lewat', type: 'percentage', rate: 0.015 },
    { id: 'ps15', code: '15', description: 'Produk rangkaian sejuk dibekal tanpa Cold Chain Monitoring (CCMD)', formula: 'RM500 x bilangan cold box tanpa CCMD', type: 'fixed_multiplier', amount: 500, multiplierLabel: 'Bil. Cold Box' },
    { id: 'ps16', code: '16', description: 'Tiada label "Kontrak Kerajaan"', formula: '1.5% x nilai produk tanpa label', type: 'percentage_nolev', rate: 0.015 },
    { id: 'ps17', code: '17', description: 'Kelewatan penyerahan invois', formula: 'RM50 x bilangan hari lewat', type: 'per_day', amount: 50 },
    { id: 'ps18', code: '18', description: 'Gagal menuntut bayaran dalam tahun kewangan semasa', formula: 'RM500 bagi setiap invois', type: 'fixed', amount: 500 },
    { id: 'ps19', code: '19', description: 'Pembelian terus oleh Kerajaan - perbezaan di antara kos pengangkutan dan Handling fee', formula: 'Jumlah kos pengangkutan - jumlah Handling fee', type: 'manual' },
    { id: 'ps20', code: '20', description: 'Gagal menggantikan produk yang dipanggil balik dalam tempoh 24 jam dari masa notifikasi atau mengikut tempoh yang ditentukan oleh Kerajaan', formula: '1.5% x nilai produk gagal diganti x bilangan hari lewat', type: 'percentage', rate: 0.015 },
    { id: 'ps21', code: '21', description: 'Gagal mematuhi paras stok penimbal', formula: 'RM5,000 bagi setiap produk', type: 'fixed', amount: 5000 },
]

// SIGNATURE UTILS AND COMPONENTS
interface SignerProfile {
    name: string
    designation: string
    date: string
    signature: string | null // Base64 data URL
}

const SignatureModal = ({ isOpen, onClose, onSave, title }: { isOpen: boolean, onClose: () => void, onSave: (data: string) => void, title: string }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = React.useState(false)

    React.useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.lineWidth = 2
                ctx.lineCap = 'round'
                ctx.strokeStyle = '#000'
                ctx.clearRect(0, 0, canvas.width, canvas.height)
            }
        }
    }, [isOpen])

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true)
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        let x, y
        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left
            y = e.touches[0].clientY - rect.top
        } else {
            x = (e as React.MouseEvent).clientX - rect.left
            y = (e as React.MouseEvent).clientY - rect.top
        }
        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        let x, y
        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left
            y = e.touches[0].clientY - rect.top
        } else {
            x = (e as React.MouseEvent).clientX - rect.left
            y = (e as React.MouseEvent).clientY - rect.top
        }
        ctx.lineTo(x, y)
        ctx.stroke()
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const handleSave = () => {
        if (canvasRef.current) {
            onSave(canvasRef.current.toDataURL())
            onClose()
        }
    }

    const handleClear = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
    }

    if (!isOpen) return null

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-2xl">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">{title}</h3>
                        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
                    </div>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 touch-none">
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={200}
                            className="w-full h-[200px] cursor-crosshair touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleClear}>Clear</Button>
                        <Button onClick={handleSave} className="bg-slate-900 text-white">Save Signature</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export const APPLPenaltyForm: React.FC<APPLPenaltyFormProps> = ({
    penalty,
    onClose,
    onApprove
}) => {
    // Basic Form State
    const [hospitalName, setHospitalName] = useState('HOSPITAL LAWAS')
    const [claimDate, setClaimDate] = useState(format(new Date(), 'dd/MM/yyyy HH:mm a'))
    const [lpoNumber, setLpoNumber] = useState('')
    const [totalLPOValue, setTotalLPOValue] = useState(0)
    const [failedProductValue, setFailedProductValue] = useState(0)
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [refNumber, setRefNumber] = useState('')
    const [daysLate, setDaysLate] = useState(0)
    const [multiplierValue, setMultiplierValue] = useState(1)
    const [isSaving, setIsSaving] = useState(false)
    const [selections, setSelections] = useState<Record<string, boolean>>({})
    const [manualAmounts, setManualAmounts] = useState<Record<string, number>>({})

    // Signature State
    const [preparedBy, setPreparedBy] = useState<SignerProfile>({ name: 'Amri Amit', designation: 'Penolong Pegawai Farmasi U5', date: format(new Date(), 'dd/MM/yyyy'), signature: null })
    const [checkedBy, setCheckedBy] = useState<SignerProfile>({ name: 'Kamriah bt Haji Mail', designation: 'Penolong Pegawai Farmasi U7', date: format(new Date(), 'dd/MM/yyyy'), signature: null })
    const [verifiedBy, setVerifiedBy] = useState<SignerProfile>({ name: 'Tan Yuan Zhang', designation: 'Pegawai Farmasi UF 12', date: format(new Date(), 'dd/MM/yyyy'), signature: null })

    // Modal State
    const [signatureModal, setSignatureModal] = useState<{ isOpen: boolean, role: 'prepared' | 'checked' | 'verified' | null }>({ isOpen: false, role: null })

    // Init from penalty
    useEffect(() => {
        if (penalty) {
            setLpoNumber(penalty.lpo?.lpo_number || '')
            setTotalLPOValue(penalty.lpo?.purchase_order?.total_amount || 0)
            setFailedProductValue(penalty.penalty_amount || 0)
            setRefNumber(penalty.id?.slice(0, 8).toUpperCase() || '')
            setDaysLate(penalty.days_late || 0)
            setHospitalName(penalty.hospital_name || 'HOSPITAL LAWAS')
        }
    }, [penalty])

    // Calculation Logic
    const calculateStandardAmount = (std: typeof OFFICIAL_STANDARDS[0]) => {
        if (!selections[std.id]) return 0
        switch (std.type) {
            case 'fixed': return std.amount || 0
            case 'percentage': return (std.rate || 0.015) * failedProductValue * daysLate
            case 'percentage_nolev': return (std.rate || 0.015) * failedProductValue
            case 'per_day': return (std.amount || 0) * daysLate
            case 'fixed_multiplier': return (std.amount || 0) * multiplierValue
            case 'manual': return manualAmounts[std.id] || 0
            default: return 0
        }
    }

    const totalPenalty = useMemo(() => {
        return OFFICIAL_STANDARDS.reduce((sum, std) => sum + calculateStandardAmount(std), 0)
    }, [selections, failedProductValue, daysLate, manualAmounts, multiplierValue])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('pharmacy_penalties')
                .update({
                    penalty_amount: totalPenalty,
                    status: 'verified',
                    verified_at: new Date().toISOString()
                })
                .eq('id', penalty.id)
            if (error) throw error
            toast.success('Penalty record updated')
            onApprove()
            onClose()
        } catch (err) {
            console.error(err)
            toast.error('Failed to save')
        } finally {
            setIsSaving(false)
        }
    }

    const handlePrint = () => window.print()

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-[1280px] w-[98vw] max-h-[96vh] p-0 overflow-hidden bg-[#F8FAFC] flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.25)] border-none">

                {/* MODERN TOP BAR */}
                <header className="bg-white border-b h-20 px-10 flex items-center justify-between z-30 shrink-0 shadow-sm print:hidden">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                            <Calculator className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Lampiran 9</h2>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm">Active Form</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 uppercase font-bold tracking-[0.2em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                Borang Tuntutan Penalti • {refNumber}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end px-6 border-r border-slate-100 italic">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Penalty</span>
                            <span className="text-3xl font-black text-slate-900 font-mono leading-none tracking-tighter">
                                <span className="text-sm opacity-30 mr-1">RM</span>
                                {totalPenalty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handlePrint} className="gap-2 border-slate-200 h-12 px-6 font-black hover:bg-slate-50 transition-all text-slate-700 bg-white rounded-xl shadow-sm">
                                <Printer className="w-4 h-4" />
                                Print Document
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 hover:bg-black text-white gap-2 h-12 px-8 font-black shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 rounded-xl">
                                {isSaving ? 'Updating...' : 'Verify & Save Record'}
                            </Button>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                {/* MAIN CONTENT SPLIT */}
                <main className="flex-1 overflow-hidden flex bg-[#F8FAFC] print:hidden">

                    {/* LEFT PANEL: INPUT FORM */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                        <div className="max-w-[840px] mx-auto space-y-6 pb-10">

                            {/* BLOCK 1: DATA METADATA */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 ml-1">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">01. Document Metadata</h3>
                                    <div className="flex-1 h-px bg-slate-200/60" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm space-y-4 transition-all hover:shadow-md col-span-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama PTJ</label>
                                                <Input value={hospitalName} onChange={e => setHospitalName(e.target.value)} className="font-bold border-slate-100 focus:ring-slate-900 h-10 rounded-xl bg-slate-50/50" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tarikh Tuntutan</label>
                                                <Input value={claimDate} onChange={e => setClaimDate(e.target.value)} className="font-bold border-slate-100 focus:ring-slate-900 h-10 rounded-xl bg-slate-50/50" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">No. LPO</label>
                                                <Input value={lpoNumber} onChange={e => setLpoNumber(e.target.value)} className="font-mono bg-blue-50/30 font-black h-10 rounded-xl border-blue-100 text-blue-600 tracking-wider" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">No. Invois</label>
                                                <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Wait for input..." className="font-black h-10 rounded-xl border-slate-100 focus:ring-slate-900 uppercase placeholder:text-slate-300" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-slate-200/50 shadow-sm space-y-2 transition-all hover:shadow-md">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 opacity-50">LPO Value (RM)</label>
                                        <Input type="number" value={totalLPOValue} onChange={e => setTotalLPOValue(parseFloat(e.target.value) || 0)} className="font-mono font-black h-10 rounded-xl border-slate-100 text-lg text-slate-400 bg-slate-50/20" />
                                    </div>

                                    <div className="bg-blue-600 p-4 rounded-xl shadow-lg space-y-2 transition-all hover:shadow-xl">
                                        <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest ml-1">Failed Product Value (RM)</label>
                                        <Input type="number" value={failedProductValue} onChange={e => setFailedProductValue(parseFloat(e.target.value) || 0)} className="font-mono font-black h-10 rounded-xl border-none bg-white text-xl text-blue-600 shadow-inner" />
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 2: STANDARDS CHECKLIST */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 ml-1">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">02. Performance Violations</h3>
                                    <div className="flex-1 h-px bg-slate-200/60" />
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {OFFICIAL_STANDARDS.map((std) => {
                                        const isChecked = selections[std.id]
                                        const val = calculateStandardAmount(std)
                                        return (
                                            <div key={std.id}
                                                onClick={() => setSelections(p => ({ ...p, [std.id]: !p[std.id] }))}
                                                className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${isChecked ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-blue-400'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-all ${isChecked ? 'bg-blue-500 border-blue-400' : 'bg-slate-50 border-slate-200'}`}>
                                                    {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isChecked ? 'bg-slate-800 text-blue-400' : 'bg-slate-100 text-slate-400'}`}>PS {std.code}</span>
                                                        {isChecked && val > 0 && <div className="text-sm font-bold font-mono text-blue-400">RM {val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>}
                                                    </div>
                                                    <h4 className={`text-sm font-bold leading-tight ${isChecked ? 'text-white' : 'text-slate-800'}`}>{std.description}</h4>
                                                    <div className={`mt-1.5 text-[9px] font-bold uppercase tracking-wide ${isChecked ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        {std.formula}
                                                    </div>

                                                    {isChecked && (std.type === 'fixed_multiplier' || std.type === 'manual') && (
                                                        <div onClick={e => e.stopPropagation()} className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 animate-pulse">{std.type === 'manual' ? 'Enter Amount' : std.multiplierLabel}:</span>
                                                                <Input
                                                                    type="number"
                                                                    autoFocus
                                                                    value={std.type === 'manual' ? (manualAmounts[std.id] || '') : multiplierValue}
                                                                    onChange={e => {
                                                                        const val = parseFloat(e.target.value) || 0
                                                                        if (std.type === 'manual') setManualAmounts(p => ({ ...p, [std.id]: val }))
                                                                        else setMultiplierValue(val)
                                                                    }}
                                                                    className="w-32 h-12 bg-white/10 text-white font-black border-none text-lg rounded-xl shadow-inner focus:bg-white/20 transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: ACTIONS & SUMMARY */}
                    <div className="w-[380px] border-l border-slate-200/60 bg-white flex flex-col p-6 gap-5 overflow-y-auto custom-scrollbar shrink-0 shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
                        <section className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Calculator className="w-20 h-20" />
                            </div>
                            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6">Total Projection</h3>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Total Amount to Claim</p>
                                    <div className="text-4xl font-black tracking-tighter text-white font-mono">
                                        <span className="text-lg opacity-20 mr-1 font-sans">RM</span>
                                        {totalPenalty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Items selected</span>
                                        <span className="text-white bg-blue-600 px-2 py-0.5 rounded">{Object.values(selections).filter(Boolean).length}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Hospital Code</span>
                                        <span className="text-white">PTJ839-LWS</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SIGNATURE AREAS */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex-1 flex flex-col">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Signatures
                            </h4>
                            <div className="space-y-4 flex-1">

                                {/* Prepared By */}
                                <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 group hover:border-blue-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-black text-[10px]">{preparedBy.name.slice(0, 2).toUpperCase()}</div>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                value={preparedBy.name}
                                                onChange={e => setPreparedBy(p => ({ ...p, name: e.target.value }))}
                                                className="h-5 p-0 border-none bg-transparent text-[11px] font-black text-slate-900 focus:ring-0 focus:bg-slate-50 rounded px-1 -ml-1 w-full"
                                            />
                                            <Input
                                                value={preparedBy.designation}
                                                onChange={e => setPreparedBy(p => ({ ...p, designation: e.target.value }))}
                                                className="h-4 p-0 border-none bg-transparent text-[9px] text-slate-400 font-bold uppercase tracking-widest focus:ring-0 focus:bg-slate-50 rounded px-1 -ml-1 w-full"
                                            />
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setSignatureModal({ isOpen: true, role: 'prepared' })}
                                        className={`h-16 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all overflow-hidden ${preparedBy.signature ? 'border-blue-500 bg-white' : 'border-slate-200 hover:border-blue-300'}`}
                                    >
                                        {preparedBy.signature ? (
                                            <img src={preparedBy.signature} alt="Signed" className="h-full object-contain" />
                                        ) : (
                                            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Click to Sign</span>
                                        )}
                                    </div>
                                </div>

                                {/* Checked By */}
                                <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 group hover:border-amber-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 font-black text-[10px]">{checkedBy.name.slice(0, 2).toUpperCase()}</div>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                value={checkedBy.name}
                                                onChange={e => setCheckedBy(p => ({ ...p, name: e.target.value }))}
                                                className="h-5 p-0 border-none bg-transparent text-[11px] font-black text-slate-900 focus:ring-0 focus:bg-slate-50 rounded px-1 -ml-1 w-full"
                                            />
                                            <Input
                                                value={checkedBy.designation}
                                                onChange={e => setCheckedBy(p => ({ ...p, designation: e.target.value }))}
                                                className="h-4 p-0 border-none bg-transparent text-[9px] text-slate-400 font-bold uppercase tracking-widest focus:ring-0 focus:bg-slate-50 rounded px-1 -ml-1 w-full"
                                            />
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setSignatureModal({ isOpen: true, role: 'checked' })}
                                        className={`h-16 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all overflow-hidden ${checkedBy.signature ? 'border-amber-500 bg-white' : 'border-slate-200 hover:border-amber-300'}`}
                                    >
                                        {checkedBy.signature ? (
                                            <img src={checkedBy.signature} alt="Signed" className="h-full object-contain" />
                                        ) : (
                                            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Click to Sign</span>
                                        )}
                                    </div>
                                </div>

                                {/* Verified By */}
                                <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 group hover:border-emerald-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 font-black text-[10px]">{verifiedBy.name.slice(0, 2).toUpperCase()}</div>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                value={verifiedBy.name}
                                                onChange={e => setVerifiedBy(p => ({ ...p, name: e.target.value }))}
                                                className="h-5 p-0 border-none bg-transparent text-[11px] font-black text-slate-900 focus:ring-0 focus:bg-slate-50 rounded px-1 -ml-1 w-full"
                                            />
                                            <Input
                                                value={verifiedBy.designation}
                                                onChange={e => setVerifiedBy(p => ({ ...p, designation: e.target.value }))}
                                                className="h-4 p-0 border-none bg-transparent text-[9px] text-slate-400 font-bold uppercase tracking-widest focus:ring-0 focus:bg-slate-50 rounded px-1 -ml-1 w-full"
                                            />
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setSignatureModal({ isOpen: true, role: 'verified' })}
                                        className={`h-16 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all overflow-hidden ${verifiedBy.signature ? 'border-emerald-500 bg-white' : 'border-slate-200 hover:border-emerald-300'}`}
                                    >
                                        {verifiedBy.signature ? (
                                            <img src={verifiedBy.signature} alt="Signed" className="h-full object-contain" />
                                        ) : (
                                            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Click to Sign</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full mt-4 bg-white border-slate-200 text-blue-600 font-bold text-xs uppercase tracking-wide">
                                Digital Deduction (Kaedah 1)
                            </Button>
                        </div>
                    </div>
                </main>

                <SignatureModal
                    isOpen={signatureModal.isOpen}
                    onClose={() => setSignatureModal({ isOpen: false, role: null })}
                    title={`Sign as ${signatureModal.role === 'prepared' ? 'Preparer' : signatureModal.role === 'checked' ? 'Checker' : 'Verifier'}`}
                    onSave={(data) => {
                        if (signatureModal.role === 'prepared') setPreparedBy(p => ({ ...p, signature: data }))
                        if (signatureModal.role === 'checked') setCheckedBy(p => ({ ...p, signature: data }))
                        if (signatureModal.role === 'verified') setVerifiedBy(p => ({ ...p, signature: data }))
                    }}
                />

                {/* THE STRICT PRINT DOCUMENT (Strictly Hidden on Screen, Modernly Invisible) */}
                {createPortal(
                    <div id="lampiran-9-print-root" className="hidden print:block bg-white text-black font-serif p-0 m-0 leading-tight">
                        <div id="lampiran-9-document" className="w-[210mm] mx-auto p-[10mm] bg-white text-[9pt]"> {/* Reduced base font to 9pt */}

                            <div className="flex flex-col items-end mb-2"> {/* Reduced margin */}
                                <span className="font-bold text-[10pt]">LAMPIRAN 9</span>
                                <div className="grid grid-cols-[70px_5px_130px] mt-1 text-[8.5pt]">
                                    <div className="font-bold">No. Rujukan</div><div>:</div><div className="border-b border-black text-center">{refNumber}</div>
                                    <div className="font-bold mt-0.5">Tarikh</div><div className="mt-0.5">:</div><div className="border-b border-black text-center mt-0.5 font-mono tracking-tight">{format(new Date(), 'dd/MM/yyyy')}</div>
                                </div>
                            </div>

                            <div className="border-[1.5pt] border-black text-center py-1 mb-4 font-bold text-[10.5pt] uppercase bg-slate-50">BORANG TUNTUTAN PEMBAYARAN PENALTI</div>

                            <div className="space-y-1 mb-4 text-[9pt]"> {/* Compacted Info Grid */}
                                <div className="grid grid-cols-[20px_200px_5px_1fr] gap-x-1 items-baseline">
                                    <div className="font-bold">1)</div><div className="font-bold">Nama PTJ</div><div className="font-bold">:</div><div className="border-b border-black font-bold uppercase">{hospitalName}</div>
                                </div>
                                <div className="grid grid-cols-[20px_200px_5px_1fr] gap-x-1 items-baseline">
                                    <div className="font-bold">2)</div><div className="font-bold">Tarikh Tuntutan</div><div className="font-bold">:</div><div className="border-b border-black">{claimDate}</div>
                                </div>
                                <div className="grid grid-cols-[20px_200px_5px_1fr] gap-x-1 items-baseline">
                                    <div className="font-bold">3)</div><div className="font-bold">No. LPO</div><div className="font-bold">:</div><div className="border-b border-black font-mono font-bold">{lpoNumber}</div>
                                </div>
                                <div className="grid grid-cols-[20px_200px_5px_1fr] gap-x-1 items-baseline">
                                    <div className="font-bold">4)</div><div className="font-bold">Nilai Produk/LPO (RM)</div><div className="font-bold">:</div><div className="border-b border-black font-mono font-bold text-right pr-2">{totalLPOValue.toFixed(2)}</div>
                                </div>
                                <div className="grid grid-cols-[20px_200px_5px_1fr] gap-x-1 items-baseline">
                                    <div className="font-bold">5)</div><div className="font-bold">Nilai Produk Gagal Dibekalkan (RM)</div><div className="font-bold">:</div>
                                    <div className="grid grid-cols-[1fr_auto] gap-2"><div className="border-b border-black font-mono font-bold text-right pr-2">{failedProductValue.toFixed(2)}</div><div className="text-[8pt] italic">(Jika berkenaan)</div></div>
                                </div>
                                <div className="grid grid-cols-[20px_200px_5px_1fr] gap-x-1 items-baseline">
                                    <div className="font-bold">6)</div><div className="font-bold">No. Invois</div><div className="font-bold">:</div><div className="border-b border-black">{invoiceNumber || ' '}</div>
                                </div>
                                <div className="grid grid-cols-[20px_200px_5px_1fr] gap-x-1 items-baseline">
                                    <div className="font-bold">7)</div><div className="font-bold">Kategori Performance Standard Yang Gagal Dipatuhi</div><div className="font-bold">:</div><div className="font-bold text-[8pt] italic">(Sila tandakan ( ✓ ) pada kategori yang berkenaan sahaja)</div>
                                </div>
                            </div>

                            <table className="w-full border-collapse border-[1pt] border-black text-[8.5pt]">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="border-[1pt] border-black p-1 text-center uppercase text-[8pt]">Performance Standard Yang Gagal Dipatuhi</th>
                                        <th className="border-[1pt] border-black p-1 text-center w-[30px]"></th>
                                        <th className="border-[1pt] border-black p-1 text-center w-[160px] uppercase text-[8pt]">Nilai Denda</th>
                                        <th className="border-[1pt] border-black p-1 text-center w-[90px] uppercase text-[8pt]">Jumlah (RM)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {OFFICIAL_STANDARDS.map((std) => (
                                        <tr key={std.id} className="min-h-[25px]">
                                            <td className="border-[1pt] border-black p-1 leading-snug"><div className="flex gap-2"><b>{std.code}</b> {std.description}</div></td>
                                            <td className="border-[1pt] border-black p-1 text-center align-middle font-black text-[10pt]">{selections[std.id] ? '✓' : ''}</td>
                                            <td className="border-[1pt] border-black p-1 text-[8pt] italic leading-tight">{std.formula} {selections[std.id] && std.type === 'fixed_multiplier' && `(${multiplierValue} box)`}</td>
                                            <td className="border-[1pt] border-black p-1 text-right font-mono font-bold">{selections[std.id] ? calculateStandardAmount(std).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold bg-slate-50">
                                        <td colSpan={3} className="border-[1pt] border-black p-1 text-right text-[9pt]">JUMLAH KESELURUHAN (RM)</td>
                                        <td className="border-[1pt] border-black p-1 text-right font-mono text-[10pt] underline decoration-double">{totalPenalty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Signature Section - Single Row 3 Cols (Compacted) */}
                            <div className="mt-4 page-break-inside-avoid">
                                <div className="border-[1.5pt] border-black pb-2">
                                    <div className="text-center font-bold uppercase py-1 border-b border-black text-[9pt] bg-slate-50">PERAKUAN / PENGESAHAN</div>
                                    <div className="text-center italic text-[8.5pt] py-0.5 border-b border-black mb-3">(Untuk diisi oleh PTJ bertanggungjawab)</div>

                                    <div className="grid grid-cols-3 gap-3 px-3">
                                        {/* Disediakan Oleh */}
                                        <div className="space-y-4 text-[9pt]">
                                            <div className="font-bold underline">Disediakan Oleh :-</div>
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Tandatangan</div><div>:</div>
                                                    <div className="h-6 border-b border-dashed border-slate-400 relative">
                                                        {preparedBy.signature && <img src={preparedBy.signature} className="absolute bottom-0 left-1/2 -translate-x-1/2 h-10 object-contain" alt="Sig" />}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Nama</div><div>:</div><div className="border-b border-black font-bold uppercase truncate">{preparedBy.name}</div>
                                                </div>
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Jawatan</div><div>:</div><div className="border-b border-black uppercase text-[8pt] truncate">{preparedBy.designation}</div>
                                                </div>
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Tarikh</div><div>:</div><div className="border-b border-black">{preparedBy.date || format(new Date(), 'dd/MM/yyyy')}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Disemak Oleh */}
                                        <div className="space-y-4 text-[9pt]">
                                            <div className="font-bold underline">Disemak Oleh :-</div>
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Tandatangan</div><div>:</div>
                                                    <div className="h-6 border-b border-dashed border-slate-400 relative">
                                                        {checkedBy.signature && <img src={checkedBy.signature} className="absolute bottom-0 left-1/2 -translate-x-1/2 h-10 object-contain" alt="Sig" />}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Nama</div><div>:</div><div className="border-b border-black font-bold uppercase truncate">{checkedBy.name}</div>
                                                </div>
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Jawatan</div><div>:</div><div className="border-b border-black uppercase text-[8pt] truncate">{checkedBy.designation}</div>
                                                </div>
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Tarikh</div><div>:</div><div className="border-b border-black">{checkedBy.date || format(new Date(), 'dd/MM/yyyy')}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Disahkan Oleh */}
                                        <div className="space-y-4 text-[9pt]">
                                            <div className="font-bold underline">Disahkan Oleh :-</div>
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Tandatangan</div><div>:</div>
                                                    <div className="h-6 border-b border-dashed border-slate-400 relative">
                                                        {verifiedBy.signature && <img src={verifiedBy.signature} className="absolute bottom-0 left-1/2 -translate-x-1/2 h-10 object-contain" alt="Sig" />}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Nama</div><div>:</div><div className="border-b border-black font-bold uppercase truncate">{verifiedBy.name}</div>
                                                </div>
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Jawatan</div><div>:</div><div className="border-b border-black uppercase text-[8pt] truncate">{verifiedBy.designation}</div>
                                                </div>
                                                <div className="grid grid-cols-[70px_5px_1fr] items-end">
                                                    <div>Tarikh</div><div>:</div><div className="border-b border-black">{verifiedBy.date || format(new Date(), 'dd/MM/yyyy')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* KAEDAH BAYARAN (Detailed & Compact) */}
                                <div className="mt-3 border-[1.5pt] border-black pb-2 text-[8.5pt]">
                                    <div className="text-center font-bold uppercase py-0.5 border-b border-black bg-slate-50">KAEDAH BAYARAN</div>
                                    <div className="text-center italic py-0.5 border-b border-black mb-2">(Untuk diisi oleh PTJ)</div>

                                    <div className="px-3 space-y-1.5">
                                        <p className="mb-1 font-bold">Tanda ( &#10003; ) pada mana yang berkenaan :</p>
                                        <div className="flex items-start gap-2">
                                            <div className="w-4 h-4 border border-black flex items-center justify-center shrink-0 mt-0.5"></div>
                                            <div className="leading-tight">Bayaran melalui Kaedah 1 - Bayaran penalti melalui potongan pada bayaran oleh PTJ.</div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-4 h-4 border border-black flex items-center justify-center shrink-0 mt-0.5"></div>
                                            <div className="leading-tight">Bayaran melalui Kaedah 2 - Bayaran penalti melalui cek oleh Syarikat Konsesi.</div>
                                        </div>

                                        <div className="pl-6 space-y-1 mt-1 text-[8pt] text-slate-700">
                                            <p className="leading-tight">* Pembayaran penalti melalui cek hendak dilakukan dalam masa <b>14 hari dari tarikh notifikasi</b>.</p>
                                            <p className="leading-tight text-justify">* Cek hendaklah dibuat atas nama <b>Ketua Setiausaha KKM / Pengarah Hospital / Pengarah Institusi / Pengarah JKN / Pegawai Kesihatan Daerah</b>.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Perakuan Syarikat Konsesi (Compact) */}
                                <div className="mt-3 border-[1.5pt] border-black pb-3 text-[8.5pt]">
                                    <div className="text-center font-bold uppercase py-0.5 border-b border-black bg-slate-50">PERAKUAN / PENGESAHAN</div>
                                    <div className="text-center italic py-0.5 border-b border-black mb-3">(Untuk diisi oleh Syarikat Konsesi)</div>

                                    <div className="px-3">
                                        <div className="mb-3 leading-snug">
                                            *Disertakan bayaran penalti melalui cek bernombor .................................. berjumlah RM ..................................
                                        </div>
                                        <div className="w-[85%] space-y-2">
                                            <div className="grid grid-cols-[130px_5px_1fr] items-end">
                                                <div>Tandatangan</div><div>:</div><div className="border-b border-black h-5"></div>
                                            </div>
                                            <div className="grid grid-cols-[130px_5px_1fr] items-end">
                                                <div>Nama</div><div>:</div><div className="border-b border-black h-5"></div>
                                            </div>
                                            <div className="grid grid-cols-[130px_5px_1fr] items-end">
                                                <div>Jawatan & Cop Jabatan</div><div>:</div><div className="border-b border-black h-5"></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="grid grid-cols-[130px_5px_1fr] items-end">
                                                    <div>Tarikh</div><div>:</div><div className="border-b border-black h-5"></div>
                                                </div>
                                                <div className="grid grid-cols-[80px_5px_1fr] items-end">
                                                    <div>No. Telefon</div><div>:</div><div className="border-b border-black h-5"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Catatan KKM (Footer) */}
                                <div className="mt-4 text-[8pt] space-y-1 leading-tight text-slate-600">
                                    <div className="font-bold underline mb-0.5">Catatan KKM</div>
                                    <div className="flex gap-2 text-justify">
                                        <div>1)</div>
                                        <div>Borang ini merupakan dokumen rasmi yang digunakan oleh KKM untuk menuntut penalti di bawah Perjanjian Konsesi Logistik Bekalan Perubatan.</div>
                                    </div>
                                    <div className="flex gap-2 text-justify">
                                        <div>2)</div>
                                        <div>Sila kepilkan bersama senarai semak dan dokumen-dokumen sokongan lain yang berkaitan.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <style>{`
                            @media print {
                                @page { 
                                    size: A4; 
                                    margin: 0; 
                                }
                                
                                html, body, #root, [data-radix-portal], [role="dialog"], .print\\:hidden {
                                    visibility: hidden !important;
                                    height: 0 !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    overflow: visible !important;
                                }

                                #lampiran-9-print-root, 
                                #lampiran-9-print-root * {
                                    visibility: visible !important;
                                }

                                #lampiran-9-print-root {
                                    display: flex !important;
                                    justify-content: center !important;
                                    position: absolute !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    width: 100% !important;
                                    background: white !important;
                                    z-index: 99999 !important;
                                }

                                #lampiran-9-document {
                                    width: 210mm !important;
                                    min-height: 297mm !important;
                                    margin: 0 !important;
                                    padding: 10mm !important;
                                    background: white !important;
                                    box-sizing: border-box !important;
                                }

                                * {
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                }
                            }
                            .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 20px; border: 2px solid #F8FAFC; }
                            .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94A3B8; }
                        `}</style>
                    </div>,
                    document.body
                )}

            </DialogContent>
        </Dialog >
    )
}
