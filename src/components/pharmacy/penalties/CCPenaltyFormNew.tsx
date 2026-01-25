/**
 * CC Penalty Form Component (New Design)
 * 
 * Vote Code: 080702
 * Features:
 * - Modern Screen UI with Real-time Calculation
 * - Official Surat Rasmi Print Layout
 * - Calculation Sheet Print Layout
 * - Digital Signatures
 */

import React, { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Printer, Save, Calculator, CheckCircle2 } from 'lucide-react'
import {
    Dialog, DialogContent, Button, Input, Label,
    Card, CardHeader, CardTitle, CardContent,
    Badge, Separator
} from '@/components/ui' // Adjust imports based on your UI library
import { toast } from 'sonner'
import SignaturePad from '@/components/ui/SignaturePad'
import { penaltyService } from '@/services/pharmacy/penaltyService'
import { supabase } from '@/services/supabase'

interface CCPenaltyFormNewProps {
    penalty: any // Replace with proper type
    isOpen: boolean
    onClose: () => void
    onSave?: () => void
}

export const CCPenaltyFormNew: React.FC<CCPenaltyFormNewProps> = ({
    penalty,
    isOpen,
    onClose,
    onSave
}) => {
    // State
    const [isLoading, setIsLoading] = useState(false)

    // Calculation State
    const [formData, setFormData] = useState({
        unit_price: penalty.unit_price || 0,
        quantity: penalty.quantity || 0,
        days_late: penalty.days_late || penalty.days_overdue || 0,
        selected_penalty_type: penalty.selected_penalty_type || 'minimum', // 'calculated' | 'minimum'

        // Signatures
        prepared_by_name: penalty.prepared_by_name || '',
        prepared_by_designation: penalty.prepared_by_designation || '',
        prepared_at: penalty.prepared_at || format(new Date(), 'yyyy-MM-dd'),
        prepared_signature_url: penalty.prepared_signature_url || '',

        checked_by_name: penalty.checked_by_name || '',
        checked_by_designation: penalty.checked_by_designation || '',
        checked_at: penalty.checked_at || format(new Date(), 'yyyy-MM-dd'),
        checked_signature_url: penalty.checked_signature_url || '',

        verified_by_name: penalty.verified_by_name || '',
        verified_by_designation: penalty.verified_by_designation || '',
        verified_at: penalty.verified_at || format(new Date(), 'yyyy-MM-dd'),
        verified_signature_url: penalty.verified_signature_url || '',
    })

    // Calculated Values
    const [calculations, setCalculations] = useState({
        calculated: 0,
        minimum: 200.00
    })

    // Refs


    // Effects
    useEffect(() => {
        if (penalty) {
            calculate()
        }
    }, [penalty, formData.unit_price, formData.quantity, formData.days_late])

    const calculate = () => {
        const { unit_price, quantity, days_late } = formData
        const result = penaltyService.calculateCCPenalty(unit_price, quantity, days_late)
        setCalculations(result)
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const finalAmount = formData.selected_penalty_type === 'calculated'
                ? calculations.calculated
                : calculations.minimum

            const updates = {
                ...formData,
                penalty_amount: finalAmount,
                status: 'verified' // Assume saving verifies it for now, or keeps as 'issued'
            }

            // Save to DB
            const { error } = await supabase
                .from('pharmacy_penalties')
                .update(updates)
                .eq('id', penalty.id)

            if (error) throw error

            toast.success('Penalty updated successfully')
            if (onSave) onSave()
            // Don't close, user might want to print
        } catch (error) {
            console.error(error)
            toast.error('Failed to update penalty')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    // Render Helpers
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(val)

    const finalAmount = formData.selected_penalty_type === 'calculated' ? calculations.calculated : calculations.minimum

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] h-[95vh] p-0 gap-0 overflow-hidden flex flex-col bg-slate-50/50">

                {/* Header */}
                <div className="bg-white border-b px-6 py-4 flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                            CC
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-slate-800">CC Penalty Management</h2>
                            <p className="text-xs text-slate-500 font-mono">{penalty.kkm_contract_number || 'No Contract #'} • {penalty.lpo?.lpo_number}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSave} disabled={isLoading}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                        <Button onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print Documents
                        </Button>
                    </div>
                </div>

                {/* Main Content (Screen) */}
                <div className="flex-1 overflow-auto p-6 print:hidden">
                    <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto h-full">

                        {/* Left Column: Details & Calculation */}
                        <div className="col-span-8 flex flex-col gap-6">
                            {/* Calculation Card */}
                            <Card className="border-indigo-100 shadow-sm overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 py-3">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                            <Calculator className="w-4 h-4" />
                                            Penalty Calculation
                                        </CardTitle>
                                        <Badge variant="gray" className="bg-white text-indigo-700 border-indigo-200">
                                            Formula: Price × Qty × (Days/30) × 10%
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-3 gap-6 mb-6">
                                        <div className="space-y-2">
                                            <Label>Unit Price (RM)</Label>
                                            <Input
                                                type="number"
                                                value={formData.unit_price}
                                                onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                                                className="font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Quantity Late</Label>
                                            <Input
                                                type="number"
                                                value={formData.quantity}
                                                onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                                                className="font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Days Late</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={formData.days_late}
                                                    onChange={e => setFormData({ ...formData, days_late: parseFloat(e.target.value) })}
                                                    className="font-mono"
                                                />
                                                <div className="absolute right-3 top-2.5 text-xs text-slate-400">days</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 gap-4">

                                        {/* Option A: Calculated */}
                                        <div
                                            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.selected_penalty_type === 'calculated'
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-transparent bg-white hover:bg-slate-100'
                                                }`}
                                            onClick={() => setFormData({ ...formData, selected_penalty_type: 'calculated' })}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold uppercase text-slate-500">Calculated Amount</span>
                                                {formData.selected_penalty_type === 'calculated' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                                            </div>
                                            <div className="text-2xl font-bold text-slate-800 font-mono">
                                                {formatCurrency(calculations.calculated)}
                                            </div>
                                            <div className="mt-2 text-[10px] text-slate-400">
                                                Based on formula
                                            </div>
                                        </div>

                                        {/* Option B: Minimum */}
                                        <div
                                            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.selected_penalty_type === 'minimum'
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-transparent bg-white hover:bg-slate-100'
                                                }`}
                                            onClick={() => setFormData({ ...formData, selected_penalty_type: 'minimum' })}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold uppercase text-slate-500">Minimum Penalty</span>
                                                {formData.selected_penalty_type === 'minimum' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                                            </div>
                                            <div className="text-2xl font-bold text-slate-800 font-mono">
                                                {formatCurrency(calculations.minimum)}
                                            </div>
                                            <div className="mt-2 text-[10px] text-slate-400">
                                                Standard Minimum Charge
                                            </div>
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>

                            {/* Signatures Card */}
                            <Card>
                                <CardHeader className="py-3 border-b">
                                    <CardTitle className="text-sm">Digital Signatures</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 grid grid-cols-3 gap-4">
                                    {/* Prepared By */}
                                    <SignatureBlock
                                        role="Prepared By"
                                        name={formData.prepared_by_name}
                                        designation={formData.prepared_by_designation}
                                        date={formData.prepared_at}
                                        signatureUrl={formData.prepared_signature_url}
                                        onChange={(field: string, val: string) => setFormData(prev => ({ ...prev, [field]: val }))}
                                        prefix="prepared"
                                    />
                                    {/* Checked By */}
                                    <SignatureBlock
                                        role="Checked By"
                                        name={formData.checked_by_name}
                                        designation={formData.checked_by_designation}
                                        date={formData.checked_at}
                                        signatureUrl={formData.checked_signature_url}
                                        onChange={(field: string, val: string) => setFormData(prev => ({ ...prev, [field]: val }))}
                                        prefix="checked"
                                    />
                                    {/* Verified By */}
                                    <SignatureBlock
                                        role="Verified By"
                                        name={formData.verified_by_name}
                                        designation={formData.verified_by_designation}
                                        date={formData.verified_at}
                                        signatureUrl={formData.verified_signature_url}
                                        onChange={(field: string, val: string) => setFormData(prev => ({ ...prev, [field]: val }))}
                                        prefix="verified"
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Preview & Metadata */}
                        <div className="col-span-4 space-y-6">
                            <Card className="bg-slate-900 text-white border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-sm text-slate-400 uppercase tracking-widest">Final Penalty Amount</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-mono font-bold text-white mb-2">
                                        {formatCurrency(finalAmount)}
                                    </div>
                                    <div className="flex gap-2 mb-6">
                                        <Badge className={formData.selected_penalty_type === 'minimum' ? 'bg-indigo-500' : 'bg-slate-700'}>
                                            {formData.selected_penalty_type === 'minimum' ? 'Minimum Applied' : 'Calculated Applied'}
                                        </Badge>
                                        {penalty.status === 'paid' && <Badge className="bg-green-500">PAID</Badge>}
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-800">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Supplier</span>
                                            <span className="font-medium text-right max-w-[150px] truncate">{penalty.lpo?.purchase_order?.supplier?.company_name || 'Unknown Supplier'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Received Date</span>
                                            <span className="font-medium">{penalty.order_tracking?.actual_delivery_date ? format(new Date(penalty.order_tracking.actual_delivery_date), 'dd/MM/yyyy') : '-'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Due Date (21 Days)</span>
                                            <span className="font-medium">{penalty.tarikh_serahan ? format(new Date(penalty.tarikh_serahan), 'dd/MM/yyyy') : '-'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </div>

                {/* Print View (Hidden on Screen) */}
                <div className="hidden print:block bg-white p-0 m-0">
                    {/* Document 1: Official Letter */}
                    <div className="print-page relative p-[20mm] h-[297mm] w-[210mm] text-[12pt] font-[serif] leading-relaxed mx-auto bg-white mb-8">
                        {/* Header */}
                        <div className="mb-12">
                            <div className="font-bold uppercase mb-4">
                                <p>JABATAN KESIHATAN NEGERI SARAWAK,</p>
                                <p>HOSPITAL LAWAS,</p>
                                <p>98850 LAWAS.</p>
                                <p>Telefon : 085 – 283781 (Ext 206)</p>
                            </div>

                            <div className="flex justify-end text-sm">
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span>Ruj. tuan</span>
                                    <span>:</span>

                                    <span>Ruj. kami</span>
                                    <span>: {penalty.id ? `PENALTI/CC/${new Date().getFullYear()}-${penalty.id.slice(0, 4)}` : '...'}</span>

                                    <span>Tarikh</span>
                                    <span>: {format(new Date(), 'dd MMMM yyyy').toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recipient */}
                        <div className="mb-8 uppercase font-bold">
                            <p>Pengarah Urusan,</p>
                            <p>{penalty.lpo?.purchase_order?.supplier?.company_name}</p>
                            <p className="whitespace-pre-line font-normal">{penalty.lpo?.purchase_order?.supplier?.address || 'ALAMAT PEMBEKAL'}</p>
                        </div>

                        <p className="mb-4">Tuan/Puan,</p>

                        <div className="font-bold underline mb-6 uppercase">TUNTUTAN BAYARAN DENDA</div>

                        {/* References */}
                        <div className="grid grid-cols-[150px_20px_1fr] gap-1 mb-6 font-bold uppercase text-sm">
                            <span>NO. KONTRAK</span>
                            <span>:</span>
                            <span>{penalty.kkm_contract_number || 'KKM-XXX/202X/F(U)'}</span>

                            <span>NAMA ITEM</span>
                            <span>:</span>
                            <span>{penalty.item_name || 'ITEM NAME'}</span>

                            <span>NO. PESANAN</span>
                            <span>:</span>
                            <span>{penalty.lpo?.lpo_number}</span>

                            <span>TARIKH PESANAN</span>
                            <span>:</span>
                            <span>{penalty.lpo?.document_date ? format(new Date(penalty.lpo.document_date), 'dd.MM.yyyy') : '-'}</span>
                        </div>

                        {/* Content */}
                        <div className="space-y-4 text-justify">
                            <p>
                                Dengan segala hormatnya, saya merujuk kepada perkara di atas.
                            </p>

                            <div className="flex gap-4">
                                <span>2.</span>
                                <p>
                                    Adalah dimaklumkan bahawa, syarikat tuan/puan telah lewat menyempurnakan bekalan mengikut
                                    <span className="font-bold underline"> tempoh serahan di Jadual A – Perjanjian iaitu DUA PULUH SATU HARI (21) tarikh pesanan.</span>
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <span>3.</span>
                                <p>
                                    Oleh yang demikian, selaras dengan perjanjian Kontrak Fasal 14.1.3.1 yang telah ditandatangani,
                                    syarikat tuan/puan <span className="font-bold underline">dikehendaki membayar denda sebanyak RM {finalAmount.toFixed(2)}</span> seperti pada pengiraan di bawah.
                                </p>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="my-8 border border-black text-center text-sm">
                            <div className="grid grid-cols-5 bg-slate-100 border-b border-black font-bold divide-x divide-black">
                                <div className="p-2">Bil</div>
                                <div className="p-2">Tarikh Bekalan Diterima</div>
                                <div className="p-2">Kuantiti Bekalan Diterima=A</div>
                                <div className="p-2">Harga Seunit=B (RM)</div>
                                <div className="p-2">Bilangan Hari Lewat*=C</div>
                                <div className="p-2 border-l border-black">PENALTI {currencyTitle(formData.selected_penalty_type)}</div>
                            </div>
                            <div className="grid grid-cols-5 divide-x divide-black">
                                <div className="p-2">1.</div>
                                <div className="p-2">{penalty.order_tracking?.actual_delivery_date ? format(new Date(penalty.order_tracking.actual_delivery_date), 'dd.MM.yyyy') : '-'}</div>
                                <div className="p-2">{formData.quantity}</div>
                                <div className="p-2">{formData.unit_price.toFixed(2)}</div>
                                <div className="p-2">{formData.days_late}</div>
                                <div className="p-2 border-l border-black font-bold">{finalAmount.toFixed(2)}</div>
                            </div>
                        </div>

                        <p className="text-sm font-bold mt-4 mb-8">
                            Nota: *Bilangan hari lewat adalah bermula setelah tempoh serahan tamat
                        </p>

                        <div className="flex gap-4 mb-12">
                            <span>4.</span>
                            <p>
                                Mohon pihak tuan/puan memberi maklumbalas dan pengesahan secara bertulis berkenaan dengan jumlah denda tersebut.
                                <span className="font-bold"> Sila berhubung dengan pegawai kami iaitu {formData.prepared_by_name || '...'} di talian 085-284384</span> untuk keterangan lanjut.
                                <span className="italic font-bold"> Untuk makluman tuan/puan amaun potongan denda seperti di atas akan diproses atau dipotong terus melalui baucar bayaran jabatan ini.</span>
                            </p>
                        </div>

                        <p className="mb-12">Sekian, terima kasih dan harap maklum.</p>

                        <div className="font-bold uppercase mb-8">
                            <p>“MALAYSIA MADANI”</p>
                            <p>“BERKHIDMAT UNTUK NEGARA”</p>
                        </div>

                        <p className="mb-8">Saya yang menurut perintah,</p>

                        <div className="mt-12">
                            {formData.verified_signature_url && (
                                <img src={formData.verified_signature_url} className="h-16 w-auto mb-2" />
                            )}
                            <div className="border-b border-black w-[250px] mb-1"></div>
                            <p className="font-bold uppercase">({formData.verified_by_name || 'NAMA PEGAWAI'})</p>
                            <p>{formData.verified_by_designation || 'Jawatan'}</p>
                            <p>Hospital Lawas</p>
                        </div>
                    </div>

                    {/* Page Break */}
                    <div className="break-before-page"></div>

                    {/* Document 2: Calculation Sheet */}
                    <div className="print-page relative p-[20mm] h-[297mm] w-[210mm] text-[11pt] font-[serif] mx-auto bg-white">
                        {/* Sheet Header */}
                        <div className="font-bold uppercase mb-6 text-sm">
                            <p className="text-lg mb-2">{penalty.lpo?.purchase_order?.supplier?.company_name}</p>
                            <div className="grid grid-cols-[150px_10px_1fr] gap-1">
                                <span>KONTRAK/TENDER</span> <span>:</span> <span>{penalty.kkm_contract_number || '-'}</span>
                                <span>LPO NO.</span> <span>:</span> <span>{penalty.lpo?.lpo_number}</span>
                                <span>TARIKH SEBENAR LPO</span> <span>:</span> <span>{penalty.lpo?.document_date ? format(new Date(penalty.lpo.document_date), 'dd/MM/yyyy') : '-'}</span>
                                <span>ITEM</span> <span>:</span> <span>{penalty.item_name}</span>
                            </div>
                        </div>

                        {/* Calculation Table */}
                        <table className="w-full border-collapse border border-black mb-4 text-center text-xs">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-black p-2">SKU PEMBEKAL /<br />D/O PEMBEKAL</th>
                                    <th className="border border-black p-2">TARIKH AKHIR<br />PENGHANTARAN</th>
                                    <th className="border border-black p-2">TARIKH<br />DITERIMA</th>
                                    <th className="border border-black p-2">KUANTITI</th>
                                    <th className="border border-black p-2">HARGA<br />SEUNIT (RM)</th>
                                    <th className="border border-black p-2">JUMLAH<br />(RM)</th>
                                    <th className="border border-black p-2">BIL. HARI<br />LEWAT</th>
                                    <th className="border border-black p-2">PENALTI<br />{currencyTitle(formData.selected_penalty_type)} (RM)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-black p-2">{penalty.item_code || '-'}</td>
                                    <td className="border border-black p-2">{penalty.tarikh_serahan ? format(new Date(penalty.tarikh_serahan), 'dd.MM.yyyy') : '-'}</td>
                                    <td className="border border-black p-2">{penalty.order_tracking?.actual_delivery_date ? format(new Date(penalty.order_tracking.actual_delivery_date), 'dd.MM.yyyy') : '-'}</td>
                                    <td className="border border-black p-2">{formData.quantity}</td>
                                    <td className="border border-black p-2">{formData.unit_price.toFixed(2)}</td>
                                    <td className="border border-black p-2">{(formData.quantity * formData.unit_price).toFixed(2)}</td>
                                    <td className="border border-black p-2">{formData.days_late}</td>
                                    <td className="border border-black p-2 font-bold">{finalAmount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={7} className="border border-black p-2 text-right font-bold">JUMLAH:</td>
                                    <td className="border border-black p-2 font-bold">{finalAmount.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <p className="text-xs italic mb-8">
                            Format Pengiraan: Harga Barang x Kuantiti Barang Lewat x (Bilangan Hari Lewat / 30 hari) x 10% = Denda/Penalti
                        </p>

                        {/* Summary Block */}
                        <div className="max-w-md ml-auto mr-0 text-sm font-bold mb-12">
                            <div className="grid grid-cols-[150px_20px_1fr] gap-1 mb-2">
                                <span>AMAUN LPO</span> <span>=</span> <span>RM {(formData.quantity * formData.unit_price).toFixed(2)}</span>
                                <span>TOLAK DENDA</span> <span>=</span> <span>RM {finalAmount.toFixed(2)}</span>
                            </div>
                            <Separator className="border-black mb-2" />
                            <div className="grid grid-cols-[150px_20px_1fr] gap-1 mb-2">
                                <span></span> <span></span> <span>RM {((formData.quantity * formData.unit_price) - finalAmount).toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-[150px_20px_1fr] gap-1 mb-2 text-xs font-normal">
                                <span>TOLAK CDC 0.4%</span> <span>=</span> <span>RM {(finalAmount * 0.004).toFixed(2)} (Contoh)</span>
                            </div>
                            <Separator className="border-black mb-2" />
                            <div className="grid grid-cols-[150px_20px_1fr] gap-1 mb-2">
                                <span>JUMLAH BAUCER</span> <span>=</span> <span>RM {((formData.quantity * formData.unit_price) - finalAmount).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-3 gap-8 text-center text-sm">
                            <SignatureDisplay title="Disediakan Oleh:" name={formData.prepared_by_name} designation={formData.prepared_by_designation} url={formData.prepared_signature_url} />
                            <SignatureDisplay title="Disemak Oleh:" name={formData.checked_by_name} designation={formData.checked_by_designation} url={formData.checked_signature_url} />
                            <SignatureDisplay title="Disahkan Oleh:" name={formData.verified_by_name} designation={formData.verified_by_designation} url={formData.verified_signature_url} />
                        </div>

                        <div className="mt-8 text-xs">
                            Tarikh : {format(new Date(), 'dd MMMM yyyy').toUpperCase()}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Helpers
function currencyTitle(type: string) {
    return type === 'minimum' ? 'MINIMA' : ''
}

const SignatureBlock = ({ role, name, designation, signatureUrl, onChange, prefix }: any) => {
    const [isSigning, setIsSigning] = useState(false)

    return (
        <div className="space-y-3">
            <Label className="text-xs uppercase font-bold text-slate-500">{role}</Label>

            <Input
                placeholder="Name"
                value={name}
                onChange={e => onChange(`${prefix}_by_name`, e.target.value)}
                className="h-8 text-xs"
            />
            <Input
                placeholder="Designation"
                value={designation}
                onChange={e => onChange(`${prefix}_by_designation`, e.target.value)}
                className="h-8 text-xs"
            />

            <div
                className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden"
                onClick={() => setIsSigning(true)}
            >
                {signatureUrl ? (
                    <img src={signatureUrl} className="h-full w-auto object-contain" />
                ) : (
                    <span className="text-xs text-slate-400">Click to Sign</span>
                )}
            </div>

            <Dialog open={isSigning} onOpenChange={setIsSigning}>
                <DialogContent>
                    <div className="h-[300px] w-full">
                        <SignaturePad
                            onSave={(url) => {
                                onChange(`${prefix}_signature_url`, url)
                                setIsSigning(false)
                            }}
                            onCancel={() => setIsSigning(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

const SignatureDisplay = ({ title, name, designation, url }: any) => (
    <div className="flex flex-col items-center">
        <p className="font-bold mb-4">{title}</p>
        <div className="h-16 flex items-end justify-center mb-1 w-full">
            {url && <img src={url} className="h-full w-auto object-contain" />}
        </div>
        <div className="w-full border-b border-black mb-1"></div>
        <p className="font-bold uppercase">{name || '........................'}</p>
        <p>{designation || 'Jawatan'}</p>
    </div>
)
