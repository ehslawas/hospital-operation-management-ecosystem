/**
 * CC Penalty Form Component (New Design)
 * 
 * Vote Code: 080702
 * Features:
 * - Modern Screen UI with Real-time Calculation
 * - Official Surat Rasmi Print Layout (Strict Portal Method)
 * - Calculation Sheet Print Layout
 * - Digital Signatures
 */

import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import {
    Printer, Save, Calculator, CheckCircle2,
    Building2, FileText, Calendar,
    FileSpreadsheet, CreditCard, Trash2, Plus
} from 'lucide-react'
import {
    Dialog, DialogContent, Button, Input,
    Card, CardHeader, CardTitle, CardContent,
    Separator, Select
} from '@/components/ui'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { OfficialJataNegara } from '@/components/ui/OfficialJataNegara'
import { toast } from 'sonner'
import { SignatureModal } from '@/components/ui/SignatureModal'
import { Penalty as PenaltyRecord, LPOWithRelations, OrderTracking } from '@/types/pharmacy/procurementNew'
import { penaltyService } from '@/services/pharmacy/penaltyService'

interface PenaltyWithRelations extends PenaltyRecord {
    lpo?: LPOWithRelations
    order_tracking?: OrderTracking
}

// Extend PenaltyWithRelations for local state management
interface PenaltyItem extends PenaltyWithRelations {
    current_quantity: number
    current_days_late: number
    selected_type: 'calculated' | 'minimum'
    calc_amount?: number
    min_amount?: number
    final_amount?: number
}

interface CCPenaltyFormProps {
    penalty: PenaltyWithRelations // The primary penalty record
    availablePenalties?: PenaltyWithRelations[] // Other penalties for the same LPO
    isOpen: boolean
    onClose: () => void
    onSave?: () => void
}

export const CCPenaltyFormNew: React.FC<CCPenaltyFormProps> = ({
    penalty,
    availablePenalties = [],
    isOpen,
    onClose,
    onSave
}) => {
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
    const [currentSignatureField, setCurrentSignatureField] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<'potongan' | 'cek'>('potongan')

    // Add Item State
    const [isAddItemOpen, setIsAddItemOpen] = useState(false)
    const [availableLPOItems, setAvailableLPOItems] = useState<OrderTracking[]>([])
    const [isLoadingItems, setIsLoadingItems] = useState(false)

    // Initialize items with available penalties or just the current one
    const initialItems = useMemo(() => {
        const itemsToProcess = availablePenalties.length > 0 ? availablePenalties : [penalty]
        return itemsToProcess.map(p => ({
            ...p,
            current_quantity: p.quantity || 0,
            current_days_late: p.days_overdue || 0,
            selected_type: 'calculated' as 'calculated' | 'minimum' // Default to calculated
        }))
    }, [availablePenalties, penalty])

    const [items, setItems] = useState<PenaltyItem[]>(initialItems)

    // Form data for signatures
    const [formData, setFormData] = useState({
        prepared_by_name: 'Amri Amit',
        prepared_by_designation: 'Penolong Pegawai Farmasi U5',
        prepared_at: new Date().toISOString(),
        prepared_signature_url: '',

        checked_by_name: 'Kamriah Bt Haji Mail',
        checked_by_designation: 'Ketua Penolong Pegawai Farmasi U42',
        checked_at: new Date().toISOString(),
        checked_signature_url: '',

        verified_by_name: 'Tan Yuan Zhang',
        verified_by_designation: 'Pegawai Farmasi UF52',
        verified_at: new Date().toISOString(),
        verified_signature_url: '',
    })

    // Derived calculations
    const itemCalculations = useMemo(() => {
        return items.map(item => {
            const calculated = ((item.unit_price || 0) * item.current_quantity * (item.current_days_late / 30) * 0.10)
            const minimum = 200 // Minimum penalty rule usually implies a floor? Or is it fixed? Assuming floor logic if chosen.
            // Logic: If user selects 'minimum', we force 200. If 'calculated', we use formula.
            // WARNING: Some logic says Minimum Penalty is ONLY if calculated < X. But here we let user choose.
            const final = item.selected_type === 'minimum' ? minimum : calculated
            return {
                ...item,
                calc_amount: calculated,
                min_amount: minimum,
                final_amount: final
            }
        })
    }, [items])

    const totals = useMemo(() => {
        const lpo = itemCalculations.reduce((sum, i) => sum + ((i.unit_price || 0) * i.current_quantity), 0)
        const penalty = itemCalculations.reduce((sum, i) => sum + (i.final_amount || 0), 0) // Ensure final_amount is treated as number
        const netBefore = lpo - penalty
        const cdc = netBefore * 0.004
        const net = netBefore - cdc
        return { lpo, penalty, netBefore, cdc, net }
    }, [itemCalculations])

    // Actions
    const handleUpdateItem = (index: number, field: keyof PenaltyItem, value: any) => {
        const newItems = [...items]
        // @ts-ignore
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const handleDeleteItem = (index: number) => {
        if (items.length <= 1) {
            toast.error("At least one item is required")
            return
        }
        setItems(items.filter((_, i) => i !== index))
    }

    const handlePrint = () => window.print()

    const handleSaveLocal = async () => {
        if (onSave) onSave()
    }

    const handleAddItemClick = async () => {
        if (!penalty.lpo_id) {
            toast.error("LPO ID missing")
            return
        }
        setIsLoadingItems(true)
        try {
            const fetchedItems = await penaltyService.getLPOItems(penalty.lpo_id)

            setAvailableLPOItems(fetchedItems)
            setIsAddItemOpen(true)
        } catch (error) {
            console.error("Failed to fetch LPO items", error)
            toast.error("Failed to load LPO items")
        } finally {
            setIsLoadingItems(false)
        }
    }

    const confirmAddItem = (trackingItem: OrderTracking) => {
        const newItem: PenaltyItem = {
            ...penalty, // Copy base penalty props
            id: `temp_${Date.now()}`, // Temp ID
            order_tracking: trackingItem,
            order_tracking_id: trackingItem.id,
            // Defaults
            current_quantity: 0,
            current_days_late: 0,
            selected_type: 'calculated',
            item_name: trackingItem.item_name || 'Unknown Item',
            item_code: trackingItem.item_code || '',
            // Try to find unit price from original if possible, else 0
            unit_price: 0 // Ideally this should come from LPO item details
        }
        setItems([...items, newItem])
        setIsAddItemOpen(false)
        toast.success("Item added")
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(val)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[1280px] w-[98vw] h-[96vh] p-0 overflow-hidden flex flex-col bg-slate-50 border-0 shadow-2xl">
                {/* Header */}
                <div className="bg-slate-900 border-b border-slate-800 px-8 py-5 flex justify-between items-center print:hidden relative overflow-hidden shrink-0">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-inner">
                            <Calculator className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Penalty Management</h2>
                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                                <span className="uppercase tracking-wider font-bold">LPO: {penalty.lpo?.lpo_number}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span className="uppercase tracking-wider">CC Penalty</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                        <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 gap-2">
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={() => handlePrint()} className="border-slate-700 hover:bg-slate-800 text-slate-300 gap-2">
                            <Printer className="w-4 h-4" /> Print Document
                        </Button>
                        <Button onClick={handleSaveLocal} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 gap-2">
                            <Save className="w-4 h-4" />
                            Save Record
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-slate-50/50 p-8 print:hidden">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Column */}
                            <div className="lg:col-span-8 flex flex-col gap-6">
                                {/* Details Card */}
                                <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
                                    <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/50">
                                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-indigo-500" />
                                            Order Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Building2 className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold uppercase">Supplier</span>
                                            </div>
                                            <div className="font-medium text-slate-700 truncate">{penalty.lpo?.purchase_order?.supplier?.company_name || '-'}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold uppercase">Contract No</span>
                                            </div>
                                            <div className="font-medium text-slate-700 font-mono">{penalty.order_tracking?.kkm_contract_number || '-'}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <FileText className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold uppercase">LPO No</span>
                                            </div>
                                            <div className="font-medium text-slate-700 font-mono">{penalty.lpo?.lpo_number || '-'}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <FileText className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold uppercase">DO No</span>
                                            </div>
                                            <div className="font-medium text-slate-700 font-mono">{penalty.lpo?.receiving_records?.[0]?.documents?.[0]?.do_number || '-'}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold uppercase">Date Ordered</span>
                                            </div>
                                            <div className="font-medium text-slate-700 font-mono">{penalty.lpo?.document_date ? format(new Date(penalty.lpo.document_date), 'dd/MM/yyyy') : '-'}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold uppercase">Date Arrived</span>
                                            </div>
                                            <div className="font-medium text-slate-700 font-mono">{penalty.order_tracking?.actual_delivery_date ? format(new Date(penalty.order_tracking.actual_delivery_date), 'dd/MM/yyyy') : '-'}</div>
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <CreditCard className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold uppercase">Total Item Value</span>
                                            </div>
                                            <div className="font-medium text-slate-700 font-mono">{formatCurrency(penalty.total_order_value || 0)}</div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Items Table Card */}
                                <Card className="border-indigo-100 shadow-sm overflow-hidden bg-white">
                                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 py-4 px-6">
                                        <CardTitle className="text-indigo-900 flex items-center gap-2 text-base">
                                            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                            Penalty Items
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                    <TableHead className="font-bold">Item / SKU</TableHead>
                                                    <TableHead className="font-bold text-right">Price</TableHead>
                                                    <TableHead className="font-bold text-center w-[90px]">Qty Late</TableHead>
                                                    <TableHead className="font-bold text-center w-[90px]">Days Late</TableHead>
                                                    <TableHead className="font-bold text-center w-[110px]">Type</TableHead>
                                                    <TableHead className="font-bold text-right">Penalty</TableHead>
                                                    <TableHead className="text-center w-[50px]">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {itemCalculations.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <div className="font-medium text-slate-800">{item.item_name}</div>
                                                            <div className="text-xs text-slate-500 font-mono mt-1">{item.item_code}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right">{formatCurrency(item.unit_price || 0)}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                value={item.current_quantity}
                                                                onChange={(e) => handleUpdateItem(index, 'current_quantity', parseFloat(e.target.value) || 0)}
                                                                className="h-10 text-center min-w-[70px] border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                value={item.current_days_late}
                                                                onChange={(e) => handleUpdateItem(index, 'current_days_late', parseFloat(e.target.value) || 0)}
                                                                className="h-10 text-center min-w-[70px] border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select
                                                                value={item.selected_type}
                                                                onChange={(e: any) => handleUpdateItem(index, 'selected_type', e.target.value)}
                                                                className="h-10 min-w-[100px] border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
                                                            >
                                                                <option value="calculated">Calculated</option>
                                                                <option value="minimum">Minimum</option>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">{formatCurrency(item.final_amount || 0)}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDeleteItem(index)}>
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell colSpan={7} className="p-2">
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 h-10 text-sm font-medium"
                                                            onClick={handleAddItemClick}
                                                            disabled={isLoadingItems}
                                                        >
                                                            {isLoadingItems ? <span className="animate-spin mr-2">⏳</span> : <Plus className="w-4 h-4 mr-2" />}
                                                            Add Item from LPO
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                                    <TableCell colSpan={5} className="text-right uppercase text-xs tracking-wider">Total Penalty</TableCell>
                                                    <TableCell className="text-right text-indigo-700">{formatCurrency(totals.penalty)}</TableCell>
                                                    <TableCell>&nbsp;</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                {/* Signatures Card */}
                                <Card className="border-indigo-100 shadow-sm overflow-hidden bg-white">
                                    <CardHeader className="py-4 border-b border-indigo-50 bg-slate-50/50">
                                        <CardTitle className="text-sm font-bold text-indigo-900">Digital Signatures & Approvals</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {/* Prepared By */}
                                        <div className="cursor-pointer group" onClick={() => { setCurrentSignatureField('prepared'); setIsSignatureModalOpen(true) }}>
                                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] bg-slate-50 group-hover:bg-indigo-50/50 group-hover:border-indigo-300 transition-all">
                                                {formData.prepared_signature_url ? (
                                                    <img src={formData.prepared_signature_url} alt="Signature" className="h-24 object-contain mb-2" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 group-hover:bg-indigo-100 group-hover:text-indigo-500">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="text-center w-full">
                                                    <div className="font-bold text-slate-900 uppercase text-xs mb-1">Disediakan Oleh</div>
                                                    <div className="text-sm font-bold text-slate-700">{formData.prepared_by_name}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase">{formData.prepared_by_designation}</div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Checked By */}
                                        <div className="cursor-pointer group" onClick={() => { setCurrentSignatureField('checked'); setIsSignatureModalOpen(true) }}>
                                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] bg-slate-50 group-hover:bg-amber-50/50 group-hover:border-amber-300 transition-all">
                                                {formData.checked_signature_url ? (
                                                    <img src={formData.checked_signature_url} alt="Signature" className="h-24 object-contain mb-2" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 group-hover:bg-amber-100 group-hover:text-amber-500">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="text-center w-full">
                                                    <div className="font-bold text-slate-900 uppercase text-xs mb-1">Disemak Oleh</div>
                                                    <div className="text-sm font-bold text-slate-700">{formData.checked_by_name}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase">{formData.checked_by_designation}</div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Verified By */}
                                        <div className="cursor-pointer group" onClick={() => { setCurrentSignatureField('verified'); setIsSignatureModalOpen(true) }}>
                                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] bg-slate-50 group-hover:bg-emerald-50/50 group-hover:border-emerald-300 transition-all">
                                                {formData.verified_signature_url ? (
                                                    <img src={formData.verified_signature_url} alt="Signature" className="h-24 object-contain mb-2" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 group-hover:bg-emerald-100 group-hover:text-emerald-500">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="text-center w-full">
                                                    <div className="font-bold text-slate-900 uppercase text-xs mb-1">Disahkan Oleh</div>
                                                    <div className="text-sm font-bold text-slate-700">{formData.verified_by_name}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase">{formData.verified_by_designation}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: Financial Summary */}
                            <div className="lg:col-span-4 space-y-6">
                                <Card className="bg-white text-slate-900 border border-slate-200 shadow-lg rounded-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

                                    <CardHeader className="relative pb-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                                <CreditCard className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-indigo-900">Financial Summary</CardTitle>
                                        </div>
                                        <Separator className="bg-slate-100" />
                                    </CardHeader>

                                    <CardContent className="relative flex-1 flex flex-col gap-6">
                                        {/* Screen Summary */}
                                        <div>
                                            {/* LPO Amount */}
                                            <div className="space-y-1 mb-6">
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Order Value</p>
                                                <div className="text-2xl font-bold text-slate-900 font-mono">
                                                    {formatCurrency(totals.lpo)}
                                                </div>
                                            </div>

                                            {/* Payment Method Selection */}
                                            <div className="space-y-1 mb-6">
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Payment Method</p>
                                                <Select
                                                    value={paymentMethod}
                                                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                                                    className="w-full bg-slate-50 border-slate-200"
                                                >
                                                    <option value="potongan">Potongan Baucer Bayaran</option>
                                                    <option value="cek">Bayaran Melalui Cek</option>
                                                </Select>
                                            </div>

                                            {/* Deductions */}
                                            <div className="space-y-4 bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                                                <div className="flex justify-between items-center group/item">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                        <span className="text-sm text-slate-600">Less: Penalty</span>
                                                    </div>
                                                    <span className="font-mono text-slate-900 font-bold">-{formatCurrency(totals.penalty)}</span>
                                                </div>
                                                <div className="flex justify-between items-center group/item">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                                        <span className="text-sm text-slate-600">Less: CDC Fee (0.4%)</span>
                                                    </div>
                                                    <span className="font-mono text-slate-900 font-bold">-{formatCurrency(totals.cdc)}</span>
                                                </div>
                                                <Separator className="bg-slate-200" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500 uppercase">Total Deductions</span>
                                                    <span className="font-mono text-red-600 font-bold">-{formatCurrency(totals.penalty + totals.cdc)}</span>
                                                </div>
                                            </div>

                                            {/* Net Payable */}
                                            <div className="mt-auto pt-6 border-t border-slate-100">
                                                <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mb-1">Net Payable Amount</p>
                                                <div className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                                                    <span className="text-2xl font-bold text-indigo-600 mr-1">RM</span>
                                                    {totals.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>

                <SignatureModal
                    isOpen={isSignatureModalOpen}
                    onClose={() => setIsSignatureModalOpen(false)}
                    title="Digital Signature"
                    onSave={(url) => {
                        setFormData({ ...formData, [`${currentSignatureField}_signature_url`]: url })
                        setIsSignatureModalOpen(false)
                    }}
                />

                {/* --- STRICT PRINT PORTAL (Surat Rasmi) --- */}
                {createPortal(
                    <div id="print-root-cc" className="hidden print:block absolute top-0 left-0 w-full h-full bg-white text-black z-[99999]">
                        <style>
                            {`
                            @media print {
                                @page { 
                                    size: A4; 
                                    margin: 0; 
                                }
                                html, body { 
                                    margin: 0; 
                                    padding: 0; 
                                    background: white; 
                                    -webkit-print-color-adjust: exact; 
                                    print-color-adjust: exact; 
                                }
                                #root, [role="dialog"], .print-hidden { 
                                    display: none !important; 
                                }
                                #print-root-cc {
                                    display: block !important;
                                    position: absolute !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    background: white !important;
                                }
                                .official-page {
                                    width: 210mm;
                                    min-height: 297mm;
                                    padding: 25mm 20mm 20mm 25mm; /* Official Margins */
                                    background: white;
                                    margin: 0 auto;
                                    box-sizing: border-box;
                                    font-family: "Times New Roman", Times, serif;
                                    font-size: 12pt;
                                    line-height: 1.5;
                                    page-break-after: always;
                                }
                                .official-page:last-child {
                                    page-break-after: auto;
                                }
                                table { border-collapse: collapse; width: 100%; }
                                th, td { border: 1px solid black; padding: 4px 8px; font-size: 10pt; }
                            }
                            `}
                        </style>

                        {/* Page 1: Official Letter */}
                        <div className="official-page">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start gap-4">
                                    <img src="/jata-logo.png" alt="Jata Negara" className="w-[20mm] h-auto" />
                                    <div className="uppercase font-bold text-[11pt] leading-tight">
                                        Jabatan Kesihatan Negeri Sarawak,<br />
                                        Hospital Lawas,<br />
                                        98850 Lawas.
                                    </div>
                                </div>
                                <div className="text-[10pt] text-right">
                                    Telefon : 085 – 283781 (Ext 206)
                                </div>
                            </div>

                            <div className="w-full h-[2px] bg-black mb-6"></div>

                            {/* Reference */}
                            <div className="flex justify-end mb-8 text-[11pt]">
                                <table className="w-[80mm] border-none !border-0" style={{ border: 'none' }}>
                                    <tbody>
                                        <tr>
                                            <td className="!border-0 p-0 w-[20mm] align-top">Ruj. Tuan</td>
                                            <td className="!border-0 p-0 w-[3mm] align-top">:</td>
                                            <td className="!border-0 p-0 align-top"></td>
                                        </tr>
                                        <tr>
                                            <td className="!border-0 p-0 align-top">Ruj. Kami</td>
                                            <td className="!border-0 p-0 align-top">:</td>
                                            <td className="!border-0 p-0 align-top">PENALTI/CC/{new Date().getFullYear()}-{penalty.id?.slice(0, 4) || '00'}</td>
                                        </tr>
                                        <tr>
                                            <td className="!border-0 p-0 align-top">Tarikh</td>
                                            <td className="!border-0 p-0 align-top">:</td>
                                            <td className="!border-0 p-0 align-top">{format(new Date(), 'dd MMMM yyyy')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Recipient */}
                            <div className="mb-6 text-[11pt]">
                                <div className="mb-1">Pengarah Urusan,</div>
                                <div className="font-bold uppercase mb-1">{penalty.lpo?.purchase_order?.supplier?.company_name || 'NAMA SYARIKAT'}</div>
                                <div className="uppercase whitespace-pre-line w-[80%]">
                                    {penalty.lpo?.purchase_order?.supplier?.address || 'ALAMAT PEMBEKAL'}
                                </div>
                            </div>

                            <div className="mb-4">Tuan/Puan,</div>

                            <div className="font-bold underline mb-6 uppercase">TUNTUTAN BAYARAN DENDA</div>

                            {/* Details Table (No Borders) */}
                            <div className="mb-6 text-[11pt]">
                                <table className="w-full !border-0" style={{ border: 'none' }}>
                                    <tbody>
                                        <tr>
                                            <td className="!border-0 p-0 w-[40mm] font-bold align-top py-1">NO. KONTRAK</td>
                                            <td className="!border-0 p-0 w-[3mm] align-top py-1">:</td>
                                            <td className="!border-0 p-0 align-top py-1 uppercase">{penalty.order_tracking?.kkm_contract_number || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="!border-0 p-0 font-bold align-top py-1">NAMA ITEM</td>
                                            <td className="!border-0 p-0 align-top py-1">:</td>
                                            <td className="!border-0 p-0 align-top py-1 uppercase">{items.length > 1 ? `${items[0]?.item_name} + ${items.length - 1} LAIN` : items[0]?.item_name}</td>
                                        </tr>
                                        <tr>
                                            <td className="!border-0 p-0 font-bold align-top py-1">NO. PESANAN</td>
                                            <td className="!border-0 p-0 align-top py-1">:</td>
                                            <td className="!border-0 p-0 align-top py-1 uppercase">{penalty.lpo?.lpo_number}</td>
                                        </tr>
                                        <tr>
                                            <td className="!border-0 p-0 font-bold align-top py-1">TARIKH PESANAN</td>
                                            <td className="!border-0 p-0 align-top py-1">:</td>
                                            <td className="!border-0 p-0 align-top py-1">{penalty.lpo?.document_date ? format(new Date(penalty.lpo.document_date), 'dd.MM.yyyy') : '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Body Paragraphs */}
                            <div className="text-justify space-y-4 mb-6">
                                <p className="indent-[12mm]">
                                    Dengan segala hormatnya, saya merujuk kepada perkara di atas.
                                </p>
                                <div className="flex items-start">
                                    <span className="w-[12mm] flex-shrink-0">2.</span>
                                    <div>
                                        Adalah dimaklumkan bahawa, syarikat tuan/puan telah lewat menyempurnakan bekalan mengikut <span className="font-bold underline">tempoh serahan di Jadual A – Perjanjian iaitu DUA PULUH SATU HARI (21) tarikh pesanan.</span>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="w-[12mm] flex-shrink-0">3.</span>
                                    <div>
                                        Oleh yang demikian, selaras dengan perjanjian Kontrak Fasal 14.1.3.1 yang telah ditandatangani, syarikat tuan/puan <span className="font-bold underline">dikehendaki membayar denda sebanyak RM {totals.penalty.toFixed(2)}</span> seperti pada pengiraan di bawah.
                                    </div>
                                </div>
                            </div>

                            {/* Calculation Table */}
                            <table className="mb-4 text-center">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th>Bil</th>
                                        <th>Tarikh Bekalan<br />Diterima</th>
                                        <th>Kuantiti Bekalan<br />Diterima (A)</th>
                                        <th>Harga Seunit<br />(B) (RM)</th>
                                        <th>Bilangan Hari<br />Lewat* (C)</th>
                                        <th>PENALTI<br />MINIMA (RM)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemCalculations.map((item, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}.</td>
                                            <td>{item.order_tracking?.actual_delivery_date ? format(new Date(item.order_tracking.actual_delivery_date), 'dd.MM.yyyy') : '-'}</td>
                                            <td>{item.current_quantity}</td>
                                            <td>{item.unit_price?.toFixed(2)}</td>
                                            <td>{item.current_days_late}</td>
                                            <td className="font-bold">{item.final_amount?.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan={5} className="text-right font-bold uppercase p-2 bg-slate-50">Jumlah Keseluruhan (RM)</td>
                                        <td className="font-bold">{totals.penalty.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Footnote */}
                            <div className="text-[10pt] mb-8 italic">
                                * Bilangan hari lewat adalah bermula setelah tempoh serahan tamat.
                            </div>
                        </div>

                        {/* Page 2: Continuation */}
                        <div className="official-page">
                            {/* Body Continued */}
                            <div className="text-justify space-y-4 mb-8">
                                <div className="flex items-start">
                                    <span className="w-[12mm] flex-shrink-0">4.</span>
                                    <div>
                                        Mohon pihak tuan/puan memberi maklumbalas dan pengesahan secara bertulis berkenaan dengan jumlah denda tersebut. <span className="font-bold">Sila berhubung dengan pegawai kami iaitu {formData.prepared_by_name} di talian 085-284384</span> untuk keterangan lanjut. <span className="italic">{paymentMethod === 'potongan' ? 'Untuk makluman tuan/puan amaun potongan denda seperti di atas akan diproses atau dipotong terus melalui baucar bayaran jabatan ini.' : 'Sila jelaskan bayaran denda melalui Cek/Wang Pos atas nama PENGARAH HOSPITAL LAWAS.'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                Sekian, terima kasih dan harap maklum.
                            </div>

                            <div className="font-bold mb-12 uppercase">
                                "MALAYSIA MADANI"<br />
                                "BERKHIDMAT UNTUK NEGARA"
                            </div>

                            <div className="mb-4">
                                Saya yang menurut perintah,
                            </div>

                            {/* Signature Block */}
                            <div className="w-[300px]">
                                {formData.verified_signature_url && (
                                    <img src={formData.verified_signature_url} alt="Signature" className="h-[25mm] object-contain mb-1" />
                                )}
                                <div className="border-b border-black w-full mb-1"></div>
                                <div className="font-bold uppercase">({formData.verified_by_name})</div>
                                <div className="uppercase">{formData.verified_by_designation}</div>
                                <div>Hospital Lawas</div>
                            </div>
                        </div>

                        {/* Page 3: Detailed Calculation Sheet */}
                        <div className="official-page">
                            <div className="font-bold uppercase text-[12pt] border border-black p-4 mb-6 bg-slate-50">
                                LPO NO.: {penalty.lpo?.lpo_number}<br />
                                TARIKH SEBENAR LPO: {penalty.lpo?.document_date ? format(new Date(penalty.lpo.document_date), 'dd/MM/yyyy') : '-'}<br />
                                ITEM: {items.map(i => i.item_name).join(' + ')}
                            </div>

                            <table className="mb-4 text-center">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="w-[15%]">SKU / ITEM</th>
                                        <th className="w-[15%]">TARIKH AKHIR<br />PENGHANTARAN</th>
                                        <th className="w-[15%]">TARIKH<br />DITERIMA</th>
                                        <th className="w-[10%]">KUANTITI</th>
                                        <th className="w-[15%]">HARGA SEUNIT<br />(RM)</th>
                                        <th className="w-[15%]">JUMLAH (RM)</th>
                                        <th className="w-[5%]">HARI LEWAT</th>
                                        <th className="w-[10%]">PENALTI (RM)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemCalculations.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.item_code}</td>
                                            <td>{item.order_tracking?.tarikh_serahan ? format(new Date(item.order_tracking.tarikh_serahan), 'dd.MM.yyyy') : '-'}</td>
                                            <td>{item.order_tracking?.actual_delivery_date ? format(new Date(item.order_tracking.actual_delivery_date), 'dd.MM.yyyy') : '-'}</td>
                                            <td>{item.current_quantity}</td>
                                            <td>{item.unit_price?.toFixed(2)}</td>
                                            <td>{((item.current_quantity || 0) * (item.unit_price || 0)).toFixed(2)}</td>
                                            <td>{item.current_days_late}</td>
                                            <td className="font-bold">{item.final_amount?.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan={7} className="text-right font-bold uppercase p-2">Total Penalty</td>
                                        <td className="font-bold">{totals.penalty.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="text-[10pt] italic">
                                Format Pengiraan: Harga Seunit x Kuantiti Lewat x (Bilangan Hari Lewat / 30) x 10% = Denda/Penalti
                            </div>

                            {/* Signatures Row */}
                            <div className="mt-12 grid grid-cols-3 gap-4 text-[10pt]">
                                <div className="text-center">
                                    <div className="mb-1 font-bold underline">Disediakan Oleh:</div>
                                    <div className="h-[20mm] flex items-center justify-center">
                                        {formData.prepared_signature_url && <img src={formData.prepared_signature_url} className="h-full object-contain" />}
                                    </div>
                                    <div className="border-t border-black pt-1 uppercase font-bold">{formData.prepared_by_name}</div>
                                    <div className="uppercase text-[8pt]">{formData.prepared_by_designation}</div>
                                    <div className="text-[9pt]">{format(new Date(), 'dd/MM/yyyy')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="mb-1 font-bold underline">Disemak Oleh:</div>
                                    <div className="h-[20mm] flex items-center justify-center">
                                        {formData.checked_signature_url && <img src={formData.checked_signature_url} className="h-full object-contain" />}
                                    </div>
                                    <div className="border-t border-black pt-1 uppercase font-bold">{formData.checked_by_name}</div>
                                    <div className="uppercase text-[8pt]">{formData.checked_by_designation}</div>
                                    <div className="text-[9pt]">{format(new Date(), 'dd/MM/yyyy')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="mb-1 font-bold underline">Disahkan Oleh:</div>
                                    <div className="h-[20mm] flex items-center justify-center">
                                        {formData.verified_signature_url && <img src={formData.verified_signature_url} className="h-full object-contain" />}
                                    </div>
                                    <div className="border-t border-black pt-1 uppercase font-bold">{formData.verified_by_name}</div>
                                    <div className="uppercase text-[8pt]">{formData.verified_by_designation}</div>
                                    <div className="text-[9pt]">{format(new Date(), 'dd/MM/yyyy')}</div>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </DialogContent>
        </Dialog>
    )
}
