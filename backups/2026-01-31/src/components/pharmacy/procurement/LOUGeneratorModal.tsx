import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, ChevronLeft, ChevronRight, FileText, Check, Calendar, Package2, AlertTriangle } from 'lucide-react'
import { LOU } from '@/types/pharmacy/procurementNew'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Badge } from '@/components/ui'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'

interface LOUGeneratorModalProps {
    lou: LOU
    isOpen: boolean
    onClose: () => void
    onSendEmail?: (file?: Blob) => void
}

const REASON_OPTIONS = [
    {
        id: 'damaged',
        label: 'Produk rosak / usang / tamat tarikh luput',
        template: (qty: string, name: string) =>
            `Terdapat sebanyak ${qty} produk ${name} yang dihantar melalui DO tersebut di atas telah rosak / usang / tamat tarikh luput *.`
    },
    {
        id: 'specs',
        label: 'Produk tidak menepati spesifikasi',
        template: (qty: string, name: string) =>
            `Terdapat sebanyak ${qty} produk ${name} yang dihantar melalui DO tersebut di atas adalah tidak (nyatakan spesifikasi produk yang dihantar) dan tidak menepati spesifikasi produk yang diluluskan.`
    },
    {
        id: 'description',
        label: 'Produk tidak menepati deskripsi',
        template: (qty: string, name: string) =>
            `Terdapat sebanyak ${qty} produk ${name} yang dihantar melalui DO tersebut di atas adalah (nyatakan deskripsi produk yang dihantar) dan tidak menepati deskripsi produk iaitu.`
    },
    {
        id: 'expiry_soon',
        label: 'Produk akan tamat tarikh luput / telah tamat tarikh luput',
        template: (qty: string, name: string) =>
            `Terdapat sebanyak ${qty} produk ${name} akan tamat tarikh luput / tamat tarikh luput.`
    },
    {
        id: 'short_expiry',
        label: 'Produk tidak menepati jangka hayat (kurang dari 12/18 bulan)',
        template: (qty: string, name: string, expiry: string) =>
            `Terdapat sebanyak ${qty} produk ${name} yang dihantar melalui DO tersebut di atas adalah tidak menepati jangka hayat produk iaitu kurang dari 12 bulan, di mana akan tamat tarikh luput pada ${expiry}`
    },
    {
        id: 'cold_chain',
        label: 'Produk tidak menepati suhu rangkaian sejuk (2°C - 8°C)',
        template: (qty: string, name: string) =>
            `Terdapat sebanyak ${qty} produk ${name} yang dihantar melalui DO tersebut di atas adalah tidak menepati suhu rangkaian sejuk produk yang ditetapkan iaitu 2°C hingga 8°C.`
    },
    {
        id: 'recall',
        label: 'Produk terlibat dengan panggilan balik produk',
        template: (qty: string, name: string) =>
            `Terdapat sebanyak ${qty} produk ${name} terlibat dengan panggilan balik produk yang dinyatakan dalam Surat Arahan Panggilan Balik Produk tersebut di atas.`
    },
]

const ACTION_OPTIONS = [
    { id: 'reject_7days', label: 'Produk tidak diterima dan pohon penggantian dalam masa 7 hari berkerja dari tarikh surat notifikasi ini.' },
    { id: 'return_30days', label: 'Produk akan dipulangkan dan pohon penggantian dalam tempoh 30 hari sebelum tarikh luput produk berkenaan.' },
    { id: 'return_24hrs', label: 'Produk akan dipulangkan dan pohon penggantian dalam tempoh 24 jam dari tarikh surat notifikasi ini.' },
]

export const LOUGeneratorModal: React.FC<LOUGeneratorModalProps> = ({ lou, isOpen, onClose }) => {
    const { user } = useAuthStore()

    // --- STATE ---
    const [step, setStep] = useState<'form' | 'preview'>('form')

    // Checkbox selections
    const [selectedReason, setSelectedReason] = useState<string>('short_expiry')
    const [selectedAction, setSelectedAction] = useState<string>('return_30days')

    if (!isOpen) return null

    // --- DERIVED DATA ---
    const hospitalName = user?.hospital?.hospital_name || 'HOSPITAL SULTANAH AMINAH'
    const hospitalAddress = user?.hospital?.address || 'Jalan Persiaran Abu Bakar Sultan\n80100 Johor Bahru, Johor'
    const hospitalPhone = user?.hospital?.phone || '07-2231666'

    const supplierData = (lou as any).lpo?.purchase_order?.supplier
    const supplierName = supplierData?.company_name || lou.supplier_name || 'SUPPLIER NAME'
    const supplierAddress = supplierData?.address || 'ALAMAT PEMBEKAL'

    const refNumber = `HL/FAR/S7/${format(new Date(), 'yy')} (${lou.id?.slice(0, 4).toUpperCase()})`
    const doNumber = lou.do_numbers?.[0] || (lou as any).do_number || '-'
    const doDate = format(new Date(), 'dd MMMM yyyy')
    const lpoNumber = lou.lpo_number || '-'

    const signatoryName = user?.full_name?.toUpperCase() || 'PEGAWAI FARMASI'
    const signatoryPosition = user?.jawatan?.toUpperCase() || 'PEGAWAI FARMASI'

    // STRICTLY 1 ITEM LOGIC
    const activeItem = lou.items?.[0]
    const itemQty = `${activeItem?.quantity_received || 0} ${activeItem?.item_code ? 'UNIT' : 'UNIT'}`
    const itemName = `${activeItem?.item_name || 'ITEM NAME'} (${activeItem?.item_code || '-'})`
    const expiryStr = activeItem?.expiry_date ? format(new Date(activeItem.expiry_date), 'dd MMM yyyy').toUpperCase() : 'TARIKH LUPUT'

    // --- HANDLERS ---
    const handlePrint = () => {
        window.print()
    }

    // --- RENDER HELPERS ---
    const LetterContent = () => (
        <div className="text-black font-serif text-[11pt] leading-relaxed">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-6">
                    <img
                        src="/jata-logo.png"
                        className="h-[22mm] w-auto object-contain"
                        alt="Jata Negara"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                    <div className="uppercase font-bold leading-tight text-[10pt] pt-1 border-l-2 border-slate-300 pl-6">
                        <div className="text-black mb-1 scale-y-110 tracking-widest opacity-90">JABATAN KESIHATAN NEGERI SARAWAK,</div>
                        <div className="text-black mb-1 scale-y-110 tracking-widest">{hospitalName},</div>
                        <div className="text-black font-normal text-[9pt] whitespace-pre-line leading-tight mt-2 opacity-80">{hospitalAddress}</div>
                    </div>
                </div>
                <div className="text-right text-[9pt] whitespace-nowrap pt-2 font-medium">
                    <div className="mb-1">Telefon<span className="ml-4">: {hospitalPhone}</span></div>
                </div>
            </div>

            <div className="border-b-[2pt] border-black mb-8"></div>

            {/* Reference & Date */}
            <div className="flex justify-end text-[10pt] mb-8 font-serif">
                <div className="text-left">
                    <div className="grid grid-cols-[80px_1fr] gap-x-2">
                        <span>Ruj. Kami</span>
                        <span className="font-bold">: {refNumber}</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-x-2 mt-1">
                        <span>Tarikh</span>
                        <span className="font-bold uppercase">: {format(new Date(), 'dd MMMM yyyy')}</span>
                    </div>
                </div>
            </div>

            {/* Supplier Address */}
            <div className="mb-8 text-[10pt] whitespace-pre-line font-serif">
                <div className="font-bold uppercase tracking-wide mb-1">{supplierName}</div>
                <div className="uppercase mb-4">{supplierAddress}</div>
                <div className="italic">(u.p.: Bahagian Khidmat Pelanggan)</div>
                <div className="mt-6 text-[11pt]">Tuan/Puan,</div>
            </div>

            {/* Title */}
            <div className="mb-6">
                <h1 className="font-bold underline text-[11pt] uppercase tracking-wide">SURAT NOTIFIKASI</h1>
            </div>

            {/* Opening Paragraph */}
            <div className="mb-6 text-[10pt] text-justify font-serif leading-relaxed">
                Dengan hormatnya <span className="italic">Delivery Order</span> (DO) / <span className="italic font-bold">Letter of Undertaking</span> (LOU) / Surat Arahan Panggilan Balik Produk * no. rujukan <span className="font-bold">{doNumber}</span> bertarikh <span className="font-bold">{doDate}</span> adalah dirujuk.
            </div>

            {/* Section 2: Reason */}
            <div className="mb-6 text-[10pt] break-inside-avoid">
                <div className="mb-3 font-medium">2. <span className="ml-6">Dimaklumkan bahawa:</span></div>
                <div className="ml-10 space-y-3">
                    {REASON_OPTIONS.map((opt) => {
                        const isSelected = selectedReason === opt.id
                        const content = isSelected
                            ? opt.template(itemQty, `<span class="font-bold border-b border-black">${itemName}</span>`, `<span class="font-bold">${expiryStr}</span>`)
                            : opt.label

                        return (
                            <div key={opt.id} className="flex items-start gap-4 break-inside-avoid">
                                <div className={`w-4 h-4 border flex items-center justify-center text-[10pt] flex-shrink-0 mt-1 transition-colors ${isSelected ? 'border-black bg-black text-white' : 'border-slate-300'}`}>
                                    {isSelected ? <Check className="w-3 h-3" strokeWidth={4} /> : ''}
                                </div>
                                <div
                                    className={`text-justify leading-relaxed font-serif ${isSelected ? 'text-black' : 'text-slate-500'}`}
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Section 3: Action */}
            <div className="mb-6 text-[10pt] break-inside-avoid">
                <div className="mb-3 font-medium">3. <span className="ml-6">Sehubungan itu:</span></div>
                <div className="ml-10 space-y-3">
                    {ACTION_OPTIONS.map((opt) => {
                        const isSelected = selectedAction === opt.id
                        return (
                            <div key={opt.id} className="flex items-start gap-4 break-inside-avoid">
                                <div className={`w-4 h-4 border flex items-center justify-center text-[10pt] flex-shrink-0 mt-1 transition-colors ${isSelected ? 'border-black bg-black text-white' : 'border-slate-300'}`}>
                                    {isSelected ? <Check className="w-3 h-3" strokeWidth={4} /> : ''}
                                </div>
                                <div className={`text-justify leading-relaxed font-serif ${isSelected ? 'font-bold text-black' : 'text-slate-500'}`}>
                                    {opt.label}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Section 4 & Closing */}
            <div className="mb-8 text-[10pt] font-serif">
                <div>4. <span className="ml-6">Penalti akan dikenakan sekiranya pihak tuan gagal menggantikan produk dalam tempoh yang telah ditetapkan.</span></div>
            </div>
            <div className="mb-12 text-[10pt] font-bold font-serif uppercase tracking-widest">"BERKHIDMAT UNTUK NEGARA"</div>
            <div className="mb-8 text-[10pt] font-serif">Saya yang menurut perintah,</div>

            {/* Signature */}
            <div className="text-[10pt] mt-16 break-inside-avoid">
                <div className="italic mb-8 font-cursive text-lg leading-none opacity-50">Signed digitally</div>
                <div className="border-t border-black w-48 mb-1"></div>
                <div className="font-bold">{signatoryName}</div>
                <div>{signatoryPosition}</div>
            </div>

            <div className="mt-8 text-[9pt] border-t border-slate-200 pt-4 break-inside-avoid">
                <div className="underline mb-2">Catatan:</div>
                <div className="flex items-center gap-2"><span>Sila tanda ( X ) pada kotak yang berkaitan</span></div>
                <div>* Sila potong yang berkaitan</div>
            </div>
        </div>
    )

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} size="xl">
                <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white border-0 shadow-2xl overflow-hidden rounded-[20px]">
                    {/* Header - matches procurement modal pattern */}
                    <DialogHeader className="px-6 py-5 border-b border-slate-100 flex flex-row justify-between items-start bg-white">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900">
                                    {step === 'form' ? 'Generate Notification Letter' : 'Preview Document'}
                                </DialogTitle>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge variant="info" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs">
                                        {lpoNumber}
                                    </Badge>
                                    <Badge variant="gray" className="bg-slate-50 text-slate-600 border-slate-200 font-mono text-xs">
                                        DO: {doNumber}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={step === 'form' ? 'primary' : 'success'}
                                className={`text-xs font-semibold ${step === 'form' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                            >
                                Step {step === 'form' ? '1' : '2'} of 2
                            </Badge>
                        </div>
                    </DialogHeader>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/50">
                        {step === 'form' ? (
                            // --- STEP 1: FORM VIEW ---
                            <div className="max-w-4xl mx-auto p-6 space-y-6">
                                {/* 1. Transaction Summary Card */}
                                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                            <Package2 className="w-4 h-4 text-blue-500" />
                                            Transaction Details
                                        </h3>
                                        <Badge variant="info" className="bg-white border-slate-200 text-slate-500 font-mono text-[10px]">
                                            LOU GENERATION
                                        </Badge>
                                    </div>
                                    <div className="p-5">
                                        <div className="grid grid-cols-2 gap-6 pb-5 border-b border-slate-100">
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Supplier</span>
                                                <div className="text-sm font-bold text-slate-900 mt-1">{supplierName}</div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">DO Number</span>
                                                <div className="text-sm font-mono text-slate-700 mt-1">{doNumber}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-6 pt-5">
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">LPO Number</span>
                                                <div className="text-sm font-mono text-slate-700 mt-1">{lpoNumber}</div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Date Ordered
                                                </span>
                                                <div className="text-sm font-mono text-slate-700 mt-1">
                                                    {(lou as any).lpo?.document_date ? format(new Date((lou as any).lpo.document_date), 'dd/MM/yyyy') : '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Date Arrived
                                                </span>
                                                <div className="text-sm font-mono text-slate-700 mt-1">
                                                    {(lou as any).lpo?.receiving_records?.[0]?.receiving_date
                                                        ? format(new Date((lou as any).lpo.receiving_records[0].receiving_date), 'dd/MM/yyyy')
                                                        : '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Amount</span>
                                                <div className="text-sm font-bold text-emerald-600 mt-1">
                                                    RM {(lou as any).lpo?.purchase_order?.total_amount ? (lou as any).lpo.purchase_order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Item Details */}
                                        <div className="grid grid-cols-4 gap-6 pt-5 mt-5 border-t border-slate-100">
                                            <div className="col-span-2">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Item</span>
                                                <div className="text-sm font-medium text-slate-700 mt-1 truncate" title={itemName}>{itemName}</div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quantity</span>
                                                <div className="text-sm font-mono font-bold text-slate-900 mt-1">{activeItem?.quantity_received || 0}</div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3 text-amber-500" /> Expiry
                                                </span>
                                                <div className="text-sm font-mono text-amber-600 font-bold mt-1">
                                                    {activeItem?.expiry_date ? format(new Date(activeItem.expiry_date), 'dd/MM/yyyy') : '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Reason Selection */}
                                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
                                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            Sebab LOU (Reason)
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">Select the reason for this Letter of Undertaking</p>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {REASON_OPTIONS.map((opt) => (
                                            <label
                                                key={opt.id}
                                                className={`group flex items-start gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${selectedReason === opt.id
                                                        ? 'bg-blue-50/50 border-blue-500 ring-4 ring-blue-50 shadow-sm'
                                                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${selectedReason === opt.id
                                                        ? 'border-blue-500 bg-blue-500'
                                                        : 'border-slate-300 group-hover:border-slate-400'
                                                    }`}>
                                                    {selectedReason === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                                <input type="radio" name="reason" checked={selectedReason === opt.id} onChange={() => setSelectedReason(opt.id)} className="sr-only" />
                                                <span className={`text-sm leading-snug transition-colors ${selectedReason === opt.id
                                                        ? 'text-blue-900 font-semibold'
                                                        : 'text-slate-600'
                                                    }`}>{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* 3. Action Selection */}
                                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
                                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            Tindakan Diperlukan (Required Action)
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">Select the required action from the supplier</p>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {ACTION_OPTIONS.map((opt) => (
                                            <label
                                                key={opt.id}
                                                className={`group flex items-start gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${selectedAction === opt.id
                                                        ? 'bg-emerald-50/50 border-emerald-500 ring-4 ring-emerald-50 shadow-sm'
                                                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${selectedAction === opt.id
                                                        ? 'border-emerald-500 bg-emerald-500'
                                                        : 'border-slate-300 group-hover:border-slate-400'
                                                    }`}>
                                                    {selectedAction === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                                <input type="radio" name="action" checked={selectedAction === opt.id} onChange={() => setSelectedAction(opt.id)} className="sr-only" />
                                                <span className={`text-sm leading-snug transition-colors ${selectedAction === opt.id
                                                        ? 'text-emerald-900 font-semibold'
                                                        : 'text-slate-600'
                                                    }`}>{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // --- STEP 2: PREVIEW VIEW ---
                            <div className="w-full h-full flex items-start justify-center p-8 overflow-y-auto">
                                <div className="bg-white shadow-2xl border border-slate-200 min-h-[297mm] w-[210mm] p-[25mm] shrink-0 rounded-lg">
                                    <LetterContent />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions - matches procurement design */}
                    <DialogFooter className="p-5 border-t border-slate-100 bg-white flex justify-between items-center shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                        {step === 'form' ? (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="h-11 px-5 hover:bg-slate-50 text-slate-500"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => setStep('preview')}
                                    className="h-11 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold"
                                >
                                    Preview Letter
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('form')}
                                    className="h-11 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Back to Form
                                </Button>
                                <Button
                                    onClick={handlePrint}
                                    className="h-11 px-6 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white shadow-lg shadow-slate-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold"
                                >
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print Document
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* PRINTABLE CONTENT (Rendered outside #root via Portal) */}
            {createPortal(
                <div id="lou-print-portal" className="hidden print:block" aria-hidden="true">
                    <style>
                        {`
                        @media print {
                            @page { 
                                size: A4 portrait; 
                                margin: 15mm 20mm; 
                            }
                            /* Hide EVERYTHING that is a direct child of body except our portal */
                            body > *:not(#lou-print-portal) {
                                display: none !important;
                            }
                            html, body { 
                                background: white !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100% !important;
                                height: auto !important;
                                overflow: visible !important;
                            }
                            #lou-print-portal {
                                display: block !important;
                                position: static !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                visibility: visible !important;
                            }
                            .print-document-container {
                                display: block !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: white !important;
                                font-family: 'Times New Roman', Times, serif !important;
                                color: black !important;
                                font-size: 11pt !important;
                                line-height: 1.5 !important;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            /* Ensure break isolation */
                            .break-inside-avoid {
                                break-inside: avoid !important;
                                page-break-inside: avoid !important;
                            }
                            /* Ensure all nested elements are visible */
                            .print-document-container * {
                                visibility: visible !important;
                            }
                        }
                        `}
                    </style>
                    <div className="print-document-container">
                        <LetterContent />
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
