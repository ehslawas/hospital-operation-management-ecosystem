import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, Button, Input, Label, Badge } from '@/components/ui'
import { LPOWithRelations, ReceivingItem } from '@/types/pharmacy/procurementNew'
import { receivingService } from '@/services/pharmacy/receivingService'
import { useToast } from '@/stores/toastStore'
import { ShieldCheck, FileText, Building, ClipboardCheck, ArrowRight, Loader2, Info, Package, ChevronRight, AlertTriangle } from 'lucide-react'

interface DetailedReceivePanelProps {
    isOpen: boolean
    onClose: () => void
    lpo: LPOWithRelations | null
    onSuccess: () => void
}

interface UIReceivingItem extends Partial<ReceivingItem> {
    ui_id: string
    item_name_display: string
    item_code_display: string
}

export function DetailedReceivePanel({ isOpen, onClose, lpo: initialLpo, onSuccess }: DetailedReceivePanelProps) {
    const { success, error } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [fullLpo, setFullLpo] = useState<LPOWithRelations | null>(null)
    const [items, setItems] = useState<UIReceivingItem[]>([])
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (initialLpo && isOpen) {
            loadFullLpoData()
        } else {
            setFullLpo(null)
            setItems([])
        }
    }, [initialLpo, isOpen])

    const loadFullLpoData = async () => {
        if (!initialLpo) return
        setIsLoading(true)
        try {
            // Re-fetch the full LPO with all items and relations to ensure nothing is missing
            const data = await receivingService.getLPOForReceiving(initialLpo.id)
            if (data) {
                setFullLpo(data)

                // Map items from the Purchase Order
                const poItems = data.purchase_order?.items || []
                const trackingItems = data.tracking_items as any[] || []

                const initialItems = poItems.map((item, idx) => {
                    const displayName = item.item_name || (item as any).drug?.drug_name || (item as any).non_drug?.item_name || item.item_code || item.item_id || 'Unknown Item'

                    return {
                        ui_id: `v12-${item.id}-${idx}`,
                        lpo_item_id: item.id,
                        item_id: item.item_id,
                        item_name_display: displayName,
                        item_code_display: item.item_code || item.item_id || '-',
                        item_type: (item.item_type === 'drug' ? 'drug' : 'non_drug') as 'drug' | 'non_drug',
                        ordered_quantity: item.quantity_ordered,
                        received_quantity: item.quantity_ordered, // Default to full receive
                        outstanding_quantity: 0,
                        is_fully_received: true
                    }
                })
                setItems(initialItems)
            }
        } catch (err) {
            console.error('Failed to load full Lpo data:', err)
            error('Failed to load shipment details')
        } finally {
            setIsLoading(false)
        }
    }

    const handleItemChange = (ui_id: string, field: keyof ReceivingItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.ui_id === ui_id) {
                const updated = { ...item, [field]: value }
                if (field === 'received_quantity') {
                    const ordered = item.ordered_quantity || 0
                    const received = parseInt(value) || 0
                    updated.received_quantity = received
                    updated.outstanding_quantity = Math.max(0, ordered - received)
                    updated.is_fully_received = received >= ordered
                }
                return updated
            }
            return item
        }))
    }

    const handleSubmit = async () => {
        if (!fullLpo) return
        setIsLoading(true)
        try {
            const itemsToSend = items.filter(i => (i.received_quantity || 0) > 0)
            if (itemsToSend.length === 0) {
                error('No items entered for receipt')
                setIsLoading(false)
                return
            }
            await receivingService.createReceiving(fullLpo.id, itemsToSend, {}, notes)
            success('Inventory Receipt Voucher Authorized')
            onSuccess()
            onClose()
        } catch (err) {
            console.error(err)
            error('Verification Authorization Failed')
        } finally {
            setIsLoading(false)
        }
    }

    if (!initialLpo) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[1400px] w-[95vw] h-[90vh] p-0 flex flex-col bg-white overflow-hidden rounded-xl shadow-2xl border border-slate-200">

                {/* Header */}
                <div className="bg-slate-900 px-8 py-6 shrink-0 flex items-center justify-between text-white relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-64 h-full bg-slate-800/50 skew-x-[-20deg] translate-x-16"></div>

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Inventory Receipt Voucher</h2>
                            <div className="flex items-center gap-3 text-emerald-100/80 text-xs font-medium uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                    <Building className="w-3.5 h-3.5" />
                                    Ministry of Health Malaysia
                                </span>
                                <span className="w-1 h-1 rounded-full bg-emerald-500/50"></span>
                                <span>Procurement Division</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right relative z-10">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Voucher Reference</div>
                        <div className="font-mono text-2xl font-bold text-emerald-400">{initialLpo.lpo_number}</div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
                        <div className="p-6 space-y-8">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Document Details
                                </h3>

                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400/50 transition-colors">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Purchase Order</label>
                                        <div className="font-mono font-bold text-slate-700 text-lg">{initialLpo.purchase_order?.po_number}</div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-400/50 transition-colors">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">LPO Reference</label>
                                        <div className="font-mono font-bold text-slate-700 text-lg break-all">{initialLpo.lpo_number}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Building className="w-4 h-4" />
                                    Supplier Information
                                </h3>
                                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="font-bold text-slate-800 leading-snug">
                                        {initialLpo.purchase_order?.supplier?.company_name}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Status
                                </h3>
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-center gap-3 text-amber-900">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                    <span className="text-sm font-bold uppercase tracking-wide">Pending Verification</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto p-6 bg-slate-100 border-t border-slate-200">
                            <p className="text-[10px] text-slate-400 leading-relaxed text-justify">
                                This document serves as an official receipt record. Ensure all physical items are verified against the packing list before confirmation.
                            </p>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-5xl mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">Receiving Items</h3>
                                        <p className="text-slate-500 text-sm">Verify quantity received for each line item below.</p>
                                    </div>
                                    <div className="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600 border border-slate-200">
                                        {items.length} Line Items
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                                <th className="px-6 py-4 font-bold w-[45%]">Item Description</th>
                                                <th className="px-6 py-4 text-center w-32 border-l border-slate-200">Ordered</th>
                                                <th className="px-6 py-4 text-center w-48 border-l border-slate-200 bg-emerald-50/50 text-emerald-700">Received Qty</th>
                                                <th className="px-6 py-4 text-center w-24 border-l border-slate-200">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {isLoading ? (
                                                <tr><td colSpan={4} className="p-12 text-center text-slate-400">Loading items...</td></tr>
                                            ) : (
                                                items.map((item) => (
                                                    <tr key={item.ui_id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-900 mb-1 leading-snug">{item.item_name_display}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-500 border border-slate-200">
                                                                    {item.item_code_display}
                                                                </span>
                                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{item.item_type}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center border-l border-slate-100">
                                                            <span className="text-lg font-mono font-bold text-slate-700">{item.ordered_quantity}</span>
                                                        </td>
                                                        <td className="px-6 py-3 border-l border-slate-100 bg-emerald-50/30 group-hover:bg-emerald-50/50 transition-colors">
                                                            <div className="relative max-w-[100px] mx-auto">
                                                                <Input
                                                                    type="number"
                                                                    value={item.received_quantity}
                                                                    onChange={(e) => handleItemChange(item.ui_id, 'received_quantity', e.target.value)}
                                                                    className={`text-center font-bold text-lg h-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 ${item.is_fully_received ? 'text-emerald-700 bg-white' : 'text-amber-600 bg-amber-50'}`}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center border-l border-slate-100">
                                                            {item.is_fully_received ? (
                                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600">
                                                                    <ClipboardCheck className="w-4 h-4" />
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600">
                                                                    <AlertTriangle className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Remarks */}
                                <div className="mt-8">
                                    <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        Authorization Remarks
                                    </label>
                                    <textarea
                                        placeholder="Enter any notes regarding this receipt (e.g., damaged goods, discrepancy implementation)..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full min-h-[80px] p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 resize-y bg-slate-50 focus:bg-white transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                            <Button variant="ghost" onClick={onClose} className="text-slate-500 hover:text-slate-700 font-medium">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading || items.length === 0}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 shadow-lg shadow-slate-900/10"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Processing...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Confirm Receipt</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
