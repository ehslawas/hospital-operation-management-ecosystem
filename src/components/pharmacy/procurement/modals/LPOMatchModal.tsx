
import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Link, FileText, Building2 } from 'lucide-react'
import { PurchaseOrderWithRelations } from '@/types/pharmacy'
import { LPO } from '@/types/pharmacy/procurementNew'
import { lpoService } from '@/services/pharmacy/lpoService'
import { useToast } from '@/stores/toastStore'
import { Badge } from '@/components/ui/Badge'

interface LPOMatchModalProps {
    isOpen: boolean
    onClose: () => void
    lpo: LPO
    pendingPOs: PurchaseOrderWithRelations[]
    onSuccess: () => void
}

export function LPOMatchModal({ isOpen, onClose, lpo, pendingPOs, onSuccess }: LPOMatchModalProps) {
    const { success, error } = useToast()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPO, setSelectedPO] = useState<PurchaseOrderWithRelations | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Filter POs
    const filteredPOs = pendingPOs.filter(po => {
        const query = searchQuery.toLowerCase()
        return (
            po.po_number.toLowerCase().includes(query) ||
            po.supplier?.company_name.toLowerCase().includes(query) ||
            false
        )
    })

    const handleLink = async () => {
        if (!selectedPO) return

        setIsSaving(true)
        try {
            await lpoService.linkLPOToPO(lpo.id, selectedPO.id, selectedPO.po_number)
            success(`Successfully linked to PO #${selectedPO.po_number}`)
            onSuccess()
            onClose()
        } catch (err: any) {
            console.error('Failed to link LPO:', err)
            error(err.message || 'Failed to link LPO')
        } finally {
            setIsSaving(false)
        }
    }

    // Auto-select if extraction hints found (Bonus UX)
    // useEffect(() => { ... implementation for later ... }, [])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] bg-white/95 backdrop-blur-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link className="h-5 w-5 text-blue-600" />
                        Link Unmatched LPO
                    </DialogTitle>
                    <DialogDescription>
                        Select a Purchase Order to link with this uploaded document.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 py-4">
                    {/* LEFT: The Uploaded LPO */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Uploaded Document</h4>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-md border border-slate-100 shadow-sm">
                                    <FileText className="h-6 w-6 text-red-500" />
                                </div>
                                <div className="space-y-1">
                                    <div className="font-medium text-slate-900 break-all">{lpo.lpo_number}</div>
                                    <div className="text-xs text-slate-500">
                                        ID: {lpo.id.substring(0, 8)}...
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-slate-100">
                                <div>
                                    <div className="text-xs text-slate-400">Date</div>
                                    <div className="font-medium text-slate-700">
                                        {new Date(lpo.document_date || lpo.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400">View</div>
                                    <a
                                        href={lpo.document_url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-xs"
                                    >
                                        Open PDF
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Select PO */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Select Purchase Order</h4>

                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search PO # or Supplier..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="h-[250px] overflow-y-auto border rounded-lg border-slate-200 bg-slate-50/50 p-1 space-y-1 custom-scrollbar">
                            {filteredPOs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm p-4 text-center">
                                    <Search className="h-8 w-8 mb-2 opacity-50" />
                                    No matching purchase orders found.
                                </div>
                            ) : (
                                filteredPOs.map(po => (
                                    <div
                                        key={po.id}
                                        className={`
                                           p-3 rounded-md cursor-pointer border transition-all
                                           ${selectedPO?.id === po.id
                                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                                                : 'bg-white border-transparent hover:border-slate-200 hover:bg-white/80'
                                            }
                                       `}
                                        onClick={() => setSelectedPO(po)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-slate-900 text-sm">{po.po_number}</span>
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-100">
                                                {new Date(po.created_at).toLocaleDateString()}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                                            <Building2 className="h-3 w-3 text-slate-400" />
                                            <span className="truncate">{po.supplier?.company_name}</span>
                                        </div>
                                        {po.items && po.items.length > 0 && (
                                            <div className="text-[10px] text-slate-400 pl-4.5 border-l-2 border-slate-100 pl-2 ml-1">
                                                {po.items[0].item_name.substring(0, 30)}...
                                                {po.items.length > 1 && <span className="text-slate-500 font-medium"> +{po.items.length - 1} more</span>}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-100 pt-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button
                        disabled={!selectedPO || isSaving}
                        onClick={handleLink}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                    >
                        {isSaving ? 'Linking...' : 'Confirm Link'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
