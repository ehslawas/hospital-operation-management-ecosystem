import React, { useState } from 'react'
import {
    RotateCcw,
    QrCode,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Hash
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
    Button,
    Card,
    Badge,
    Input,
    Select
} from '@/components/ui'
import { QRScanner } from '@/components/medical-oxygen/QRScanner'
import { useToast } from '@/stores/toastStore'
import { updateCylinderStatus, findCylinderByQR } from '@/services/pharmacy/oxygenService'
import { formatDate } from '@/lib/utils'

export const ReturnFromDepartment: React.FC = () => {
    const { user } = useAuthStore()
    const toast = useToast()

    // Step Logic
    const [returnStep, setReturnStep] = useState<'info' | 'scanning'>('info')
    const [returnForm, setReturnForm] = useState({
        department_name: '',
        submitter_name: '',
        return_date: new Date().toISOString()
    })

    const [scannedQRs, setScannedQRs] = useState<{
        qr: string,
        status: 'scanned' | 'success' | 'error' | 'validating',
        msg?: string,
        details?: any
    }[]>([])
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Master Data for Departments (using the same official list)
    const GOVERNMENT_DEPARTMENTS = [
        "Radiology & Radiography", "CSSU/CSSD", "Asset Management", "Advanced Reports",
        "Emergency & Trauma", "Maternity Ward", "Pharmacy Logistics", "Paediatric Ward",
        "Haemodialysis", "Pharmacy Galenical & Prepacking", "Pharmacy Emergency",
        "Pharmacy In Patient", "Pathologist", "Pharmacy Substore", "Human Resources",
        "Operation Theater", "Financial & Billing", "Klinik Pakar", "General Ward",
        "Hospital Office", "Driver Room", "Front Desk", "Pharmacy Outpatient"
    ]

    const handleStartReturn = () => {
        if (!returnForm.department_name) {
            toast.error('Required', 'Please select source department')
            return
        }
        if (!returnForm.submitter_name) {
            toast.error('Required', 'Please enter submitter name')
            return
        }
        setReturnStep('scanning')
    }

    const handleScan = async (qr: string) => {
        if (scannedQRs.find(i => i.qr === qr)) {
            toast.error('Duplicate', 'Already in the queue')
            return
        }

        const newItem = { qr, status: 'validating' as const }
        setScannedQRs(prev => [...prev, newItem])
        setIsScannerOpen(false)

        try {
            const cylRes = await findCylinderByQR(user?.hospital_id || '', qr)
            if (cylRes.error || !cylRes.data) {
                updateQueueStatus(qr, 'error', 'Cylinder not found in registry')
                return
            }

            if (cylRes.data.status !== 'issued') {
                updateQueueStatus(qr, 'error', `INVALID STATUS: ${cylRes.data.status.toUpperCase()}. ONLY 'ISSUED' UNITS CAN BE RECOVERED.`)
                return
            }

            updateQueueStatus(qr, 'scanned', undefined, cylRes.data)
        } catch (e) {
            updateQueueStatus(qr, 'error', 'Validation protocol failed')
        }
    }

    const updateQueueStatus = (qr: string, status: any, msg?: string, details?: any) => {
        setScannedQRs(prev => prev.map(item =>
            item.qr === qr ? { ...item, status, msg, details } : item
        ))
    }

    const processReturn = async () => {
        if (!user?.hospital_id || !user?.id) return

        setIsSubmitting(true)
        const itemsToProcess = scannedQRs.filter(i => i.status === 'scanned')

        for (const item of itemsToProcess) {
            try {
                const updateRes = await updateCylinderStatus(
                    user.hospital_id,
                    item.details.id,
                    'empty',
                    'Store',
                    user.id,
                    'Returned from department'
                )

                if (updateRes.error) {
                    updateQueueStatus(item.qr, 'error', updateRes.error)
                } else {
                    updateQueueStatus(item.qr, 'success')
                }
            } catch (e) {
                updateQueueStatus(item.qr, 'error', 'Failed to process')
            }
        }

        setIsSubmitting(false)
        const successCount = scannedQRs.filter(r => r.status === 'success').length
        if (successCount > 0) {
            toast.success('Processed', `${successCount} cylinders updated to EMPTY.`)
        }
    }
    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900 selection:bg-sky-100 selection:text-sky-900">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Government Professional Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                                <RotateCcw className="w-6 h-6 text-slate-900" />
                            </div>
                            Return from Department
                        </h1>
                        <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-[11px]">Cylinder Recovery & Status Reset Protocol</p>
                    </div>
                    {returnStep === 'scanning' && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setReturnStep('info')
                                setScannedQRs([])
                            }}
                            className="border-slate-300 text-slate-700 font-black h-11 px-6 rounded-xl hover:bg-slate-50"
                        >
                            Reset Process
                        </Button>
                    )}
                </div>

                {returnStep === 'info' ? (
                    /* STEP 1: FORMAL RETURN DATA ENTRY */
                    <div className="max-w-2xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="p-10 border-slate-200/60 shadow-2xl shadow-slate-900/5 bg-white rounded-[2rem] space-y-10">
                            <div className="text-center space-y-3">
                                <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-slate-200 transform -rotate-6">
                                    <RotateCcw className="w-10 h-10" />
                                </div>
                                <div className="pt-4">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Initiate Recovery</h2>
                                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] mt-2">Official Movement Documentation</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Source Department</label>
                                    <Select
                                        value={returnForm.department_name}
                                        onChange={(e: any) => setReturnForm(p => ({ ...p, department_name: e.target.value }))}
                                        options={[
                                            { label: "SELECT SOURCE DEPARTMENT", value: "" },
                                            ...GOVERNMENT_DEPARTMENTS.map(d => ({ label: d.toUpperCase(), value: d }))
                                        ]}
                                        className="h-16 font-black border-slate-200 bg-slate-50/30 rounded-2xl focus:ring-0 focus:border-slate-900 text-sm tracking-tight px-6"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Submitter / Carrier Name</label>
                                    <Input
                                        placeholder="ENTER FULL NAME (E.G. DR. AMRI AMIT)"
                                        value={returnForm.submitter_name}
                                        onChange={e => setReturnForm(p => ({ ...p, submitter_name: e.target.value }))}
                                        className="h-16 font-black border-slate-200 bg-slate-50/30 rounded-2xl focus:border-slate-900 px-6 text-sm placeholder:text-slate-300 uppercase tracking-tight"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Recovery Date</label>
                                        <p className="font-black text-slate-900">{formatDate(new Date().toISOString())}</p>
                                    </div>
                                    <div className="text-right">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Processor</label>
                                        <p className="font-black text-slate-900 uppercase tracking-tight">{user?.full_name}</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleStartReturn}
                                className="w-full bg-slate-900 hover:bg-black text-white h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-200 group"
                            >
                                Confirm & Begin Scanner
                                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Card>
                    </div>
                ) : (
                    /* STEP 2: UNIT RECOVERY SCANNING */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Manifest Summary Sidebar */}
                        <div className="space-y-6">
                            <Card className="p-8 border-slate-200/60 shadow-xl shadow-slate-900/5 bg-white rounded-3xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                    <RotateCcw className="w-24 h-24 text-slate-900" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Recovery From</h3>
                                        <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">{returnForm.department_name}</p>
                                        <p className="text-xs font-bold text-slate-500 mt-2 uppercase flex items-center gap-2">
                                            SUBMITTER: <span className="text-indigo-600 underline decoration-slate-200 underline-offset-4">{returnForm.submitter_name}</span>
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Manual QR Entry</label>
                                        <Input
                                            placeholder="SCAN OR TYPE QR..."
                                            className="h-14 font-black border-slate-200 bg-slate-50 focus:border-slate-900 rounded-2xl shadow-sm px-6 text-xs placeholder:text-slate-300 uppercase tracking-tight"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleScan(e.currentTarget.value)
                                                    e.currentTarget.value = ''
                                                }
                                            }}
                                        />
                                        <p className="text-[9px] text-slate-400 font-bold mt-3 px-1 uppercase tracking-widest italic leading-relaxed">
                                            Note: Only <span className="text-slate-900 underline">ISSUED</span> units will be accepted by the validator.
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-8 border-slate-200 bg-slate-900 text-white shadow-2xl shadow-slate-900/20 rounded-3xl">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Units</h3>
                                        <p className="text-5xl font-black tracking-tighter">{scannedQRs.filter(i => i.status === 'scanned').length}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                        <Hash className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <Button
                                    className={`w-full mt-10 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 ${scannedQRs.filter(i => i.status === 'scanned').length > 0
                                        ? 'bg-white text-slate-900 hover:bg-slate-50 shadow-xl shadow-white/5'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                        }`}
                                    onClick={processReturn}
                                    disabled={isSubmitting || scannedQRs.filter(i => i.status === 'scanned').length === 0}
                                    isLoading={isSubmitting}
                                >
                                    Commit to Registry
                                    <ArrowRight className="w-4 h-4 ml-3" />
                                </Button>
                            </Card>
                        </div>

                        {/* Scan Queue Area */}
                        <Card className="lg:col-span-2 overflow-hidden border-slate-200 shadow-xl shadow-slate-900/5 bg-white rounded-3xl flex flex-col min-h-[600px]">
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
                                <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-[0.2em] text-[10px]">
                                    <QrCode className="w-4 h-4 text-slate-400" />
                                    Intake Manifest
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => setIsScannerOpen(true)}
                                        className="bg-slate-900 hover:bg-black text-white px-5 font-black h-10 rounded-xl shadow-lg shadow-slate-200"
                                    >
                                        <QrCode className="w-4 h-4 mr-2" />
                                        Launch Scanner
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setScannedQRs([])}
                                        className="text-slate-400 font-black hover:text-rose-600 h-10 px-4 rounded-xl uppercase text-[9px] tracking-widest"
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>

                            <div className="p-8 flex-1 bg-slate-50/10 overflow-y-auto">
                                {scannedQRs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-200 space-y-6">
                                        <div className="p-10 bg-white rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-50">
                                            <QrCode className="w-16 h-16" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-black text-slate-900 uppercase tracking-[0.2em]">Queue is empty</p>
                                            <p className="text-xs font-bold text-slate-400 mt-2">Awaiting unit scan or manual entry...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[...scannedQRs].reverse().map((item) => (
                                            <div
                                                key={item.qr}
                                                className={`group relative p-5 rounded-[1.5rem] border-2 transition-all duration-300 ${item.status === 'success' ? 'bg-emerald-50/50 border-emerald-100 animate-in fade-in zoom-in-95' :
                                                    item.status === 'error' ? 'bg-rose-50/50 border-rose-100' :
                                                        'bg-white border-slate-100 hover:border-slate-900 shadow-sm hover:shadow-xl hover:shadow-slate-200/50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${item.status === 'success' ? 'bg-emerald-600 text-white' :
                                                            item.status === 'error' ? 'bg-rose-600 text-white' :
                                                                'bg-slate-900 text-white'
                                                            }`}>
                                                            {item.status === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                                                                item.status === 'error' ? <AlertCircle className="w-6 h-6" /> :
                                                                    <QrCode className="w-5 h-5" />}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-mono font-black text-slate-900 tracking-tighter text-lg leading-none">{item.qr}</p>
                                                            {item.details && (
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                                    Last Movement: {formatDate(item.details.updated_at)}
                                                                </p>
                                                            )}
                                                            {item.msg && <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight mt-1 leading-tight">{item.msg}</p>}
                                                        </div>
                                                    </div>
                                                    {item.status !== 'success' && (
                                                        <button
                                                            onClick={() => setScannedQRs(prev => prev.filter(i => i.qr !== item.qr))}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            &times;
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-slate-100/60 flex justify-between items-center">
                                                    <Badge className={`font-black text-[9px] tracking-[0.2em] px-3 py-1 rounded-lg border-none ${item.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                                        item.status === 'error' ? 'bg-rose-100 text-rose-700' :
                                                            item.status === 'validating' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-slate-200 text-slate-600'
                                                        }`}>
                                                        {item.status.toUpperCase()}
                                                    </Badge>
                                                    {item.details?.size_info && (
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            Size: {item.details.size_info.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {isScannerOpen && (
                    <QRScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
                )}
            </div>
        </div>
    )
}

export default ReturnFromDepartment
