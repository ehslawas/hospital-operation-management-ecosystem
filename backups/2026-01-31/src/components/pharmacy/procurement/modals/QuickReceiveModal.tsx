import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogFooter, Button, Input, Label, Badge } from '@/components/ui'
import { LPOWithRelations, ReceivingItem } from '@/types/pharmacy/procurementNew'
import { receivingService } from '@/services/pharmacy/receivingService'
import { useToast } from '@/stores/toastStore'
import { AlertTriangle, PackageCheck, MapPin } from 'lucide-react'

interface QuickReceiveModalProps {
    isOpen: boolean
    onClose: () => void
    lpo: LPOWithRelations | null
    onSuccess: () => void
}

export function QuickReceiveModal({ isOpen, onClose, lpo, onSuccess }: QuickReceiveModalProps) {
    const { success, error } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [items, setItems] = useState<Partial<ReceivingItem>[]>([])
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (lpo && isOpen) {
            const initialItems = lpo.purchase_order?.items?.map(item => ({
                lpo_item_id: item.id,
                item_id: item.item_id,
                item_type: (item.item_type === 'drug' ? 'drug' : 'non_drug') as 'drug' | 'non_drug',
                ordered_quantity: item.quantity_ordered,
                received_quantity: item.quantity_ordered,
                outstanding_quantity: 0,
                is_fully_received: true,
                batch_number: '',
                expiry_date: '',
                storage_location: ''
            })) || []
            setItems(initialItems)
        }
    }, [lpo, isOpen])

    const handleItemChange = (index: number, field: keyof ReceivingItem, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const validate = () => {
        for (const item of items) {
            if (item.item_type === 'drug') {
                if (!item.batch_number?.trim()) return `Batch number is required for drug items`
                if (!item.expiry_date) return `Expiry date is required for drug items`
            }
            if (!item.storage_location?.trim()) return `Storage location is required for all items`
        }
        return null
    }

    const handleSubmit = async () => {
        if (!lpo) return
        const validationError = validate()
        if (validationError) {
            error(validationError)
            return
        }

        setIsLoading(true)
        try {
            await receivingService.createReceiving(
                lpo.id,
                items,
                {},
                `Quick Receive: ${notes}`
            )
            success('Items received successfully')
            onSuccess()
            onClose()
        } catch (err) {
            console.error(err)
            error('Failed to submit receiving')
        } finally {
            setIsLoading(false)
        }
    }

    if (!lpo) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white border-0 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <PackageCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                            Quick Receive
                        </DialogTitle>
                        <p className="text-sm text-slate-500 mt-1 ml-12">
                            LPO: <span className="font-medium text-slate-700">{lpo.lpo_number}</span>
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-6 shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold text-blue-800 text-sm">Full Delivery Mode</p>
                            <p className="text-sm text-blue-700 mt-1">
                                All items will be marked as <span className="font-semibold">fully received</span>.
                                Please ensure physical quantities match the Order Quantities below.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border boundary-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700 text-sm">Items to Receive</h3>
                            <Badge variant="info" className="bg-white border-slate-200 text-slate-500 font-mono text-xs">
                                {items.length} ITEMS
                            </Badge>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider font-semibold text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left w-[25%] pl-6">Item</th>
                                    <th className="px-4 py-3 text-center w-[10%]">Qty</th>
                                    <th className="px-4 py-3 text-left w-[20%]">Batch No <span className="text-rose-500">*</span></th>
                                    <th className="px-4 py-3 text-left w-[20%]">Expiry <span className="text-rose-500">*</span></th>
                                    <th className="px-4 py-3 text-left w-[25%] pr-6">Location <span className="text-rose-500">*</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-slate-900 truncate max-w-[180px]" title={item.item_id}>
                                                Item #{idx + 1}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono border">
                                                    {item.item_id?.substring(0, 8)}
                                                </code>
                                                <Badge variant={item.item_type === 'drug' ? 'primary' : 'gray'} size="sm" className="text-[10px] h-5 px-1.5">
                                                    {item.item_type === 'drug' ? 'DRUG' : 'NON-DRUG'}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="inline-flex flex-col items-center justify-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md border border-emerald-100 min-w-[3rem]">
                                                <span className="font-bold text-sm">{item.received_quantity}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                value={item.batch_number || ''}
                                                onChange={(e) => handleItemChange(idx, 'batch_number', e.target.value.toUpperCase())}
                                                placeholder={item.item_type === 'drug' ? "Required" : "Optional"}
                                                className={`h-9 text-xs transition-all uppercase placeholder:normal-case ${item.item_type === 'drug' && !item.batch_number
                                                    ? 'border-rose-200 bg-rose-50/30 focus:border-rose-400'
                                                    : 'border-slate-200 focus:border-emerald-500'
                                                    }`}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                type="date"
                                                value={item.expiry_date || ''}
                                                onChange={(e) => handleItemChange(idx, 'expiry_date', e.target.value)}
                                                className={`h-9 text-xs transition-all ${item.item_type === 'drug' && !item.expiry_date
                                                    ? 'border-rose-200 bg-rose-50/30 focus:border-rose-400'
                                                    : 'border-slate-200 focus:border-emerald-500'
                                                    }`}
                                            />
                                        </td>
                                        <td className="px-4 py-3 pr-6">
                                            <div className="relative">
                                                <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    value={item.storage_location || ''}
                                                    onChange={(e) => handleItemChange(idx, 'storage_location', e.target.value)}
                                                    placeholder="Store/Rack..."
                                                    className="h-9 text-xs pl-8 border-slate-200 focus:border-emerald-500"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Quick Remarks (Optional)</Label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add a note about this receipt..."
                            className="bg-white border-slate-200 h-10"
                        />
                    </div>
                </div>

                <DialogFooter className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="border-slate-200 hover:bg-slate-50 text-slate-600">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] min-w-[140px]"
                    >
                        {isLoading ? 'Processing...' : 'Confirm Full Receipt'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
