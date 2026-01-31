
import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LPOMatchResult } from '@/types/pharmacy/procurementNew'
import { PurchaseOrderWithRelations } from '@/types/pharmacy'
import { FileText, Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'

interface LPOMatchingReviewProps {
    isOpen: boolean
    onClose: () => void
    matchResult: LPOMatchResult
    pdfUrl?: string
    allPendingPOs: PurchaseOrderWithRelations[]
    onConfirm: (poId: string) => void
    onSkip: () => void
    isFullScreen?: boolean
}

export function LPOMatchingReview({
    isOpen,
    onClose,
    matchResult,
    pdfUrl,
    allPendingPOs,
    onConfirm,
    onSkip,
    isFullScreen = false
}: LPOMatchingReviewProps) {
    const { extractedData, matchedPO } = matchResult
    const [selectedPoId, setSelectedPoId] = useState<string>(matchedPO?.id || '')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        setSelectedPoId(matchedPO?.id || '')
    }, [matchResult, matchedPO])

    const filteredPOs = allPendingPOs.filter(po =>
        po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplier?.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.items?.some(item =>
            item.item_name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    )

    const handleConfirm = () => {
        if (selectedPoId) {
            onConfirm(selectedPoId)
        }
    }

    const Content = (
        <div className={`flex flex-col p-0 gap-0 overflow-hidden bg-slate-50/50 ${isFullScreen ? 'h-screen w-screen' : 'w-full h-full'}`}>
            {/* 1. Header Bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 z-30">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 leading-none mb-1">Manual LPO Matching</h2>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span>Procurement</span>
                            <span className="text-slate-200">/</span>
                            <span>Matching Review</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-slate-900 h-8 w-8 p-0 rounded-full">
                        ✕
                    </Button>
                </div>
            </div>

            {/* 2. Extracted Data Ribbon (Sticky Comparison Target) */}
            <div className="bg-slate-900 text-white px-6 py-2.5 flex items-center gap-12 z-20 shadow-lg">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest leading-none mb-1">Target Doc #</span>
                    <span className="text-sm font-black text-blue-400 font-mono tracking-wider">{extractedData.documentNumber || '—'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest leading-none mb-1">Extracted Total</span>
                    <span className="text-sm font-black text-emerald-400">RM {extractedData.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest leading-none mb-1">Contract REF</span>
                    <span className="text-sm font-black text-slate-200">{extractedData.contractNumber || '—'}</span>
                </div>
                <div className="flex flex-col flex-1 truncate">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest leading-none mb-1">Detected Supplier</span>
                    <span className="text-sm font-bold text-slate-300 truncate italic">"{extractedData.supplierName || '—'}"</span>
                </div>
            </div>

            {/* 3. Main Content Area - Split View */}
            <div className="flex-1 overflow-hidden flex bg-slate-100">

                {/* LEFT: PDF Viewer (Maximized) */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-white shadow-inner m-2 rounded-xl border border-slate-200">
                    {pdfUrl ? (
                        <iframe
                            src={`${pdfUrl}#view=FitW&toolbar=1&navpanes=0`}
                            className="w-full h-full border-none"
                            title="LPO Preview"
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                            <FileText size={64} strokeWidth={1} className="mb-4 opacity-20" />
                            <p className="font-bold">Original PDF Preview Unavailable</p>
                        </div>
                    )}
                </div>

                {/* RIGHT: System Candidates (Thinner Sidebar) */}
                <div className="w-[420px] flex flex-col bg-white overflow-hidden border-l border-slate-200 z-20">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Search size={18} className="text-blue-600" />
                                Candidate Check
                            </h3>
                            <span className="text-xs font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                {filteredPOs.length} POs
                            </span>
                        </div>
                        <Input
                            placeholder="Search by PO#, Supplier, Item..."
                            className="h-12 text-sm bg-white border-slate-200 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-5">
                            {filteredPOs.map((po) => {
                                const isSelected = selectedPoId === po.id;
                                const isBestMatch = matchedPO?.id === po.id;

                                return (
                                    <div
                                        key={po.id}
                                        onClick={() => setSelectedPoId(po.id)}
                                        className={`
                                            group p-5 rounded-2xl border-2 transition-all cursor-pointer relative
                                            ${isSelected
                                                ? 'bg-blue-50 border-blue-600 shadow-lg translate-x-1'
                                                : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`font-black text-base ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>{po.po_number}</span>
                                                {isBestMatch && (
                                                    <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase leading-none shadow-sm">High Match</span>
                                                )}
                                            </div>
                                            <div className="font-mono text-sm font-black text-slate-900">
                                                RM {po.total_amount?.toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-500 font-bold mb-4 truncate block border-b border-slate-100 pb-3">
                                            {po.supplier?.company_name}
                                        </div>

                                        <div className="space-y-2.5">
                                            {po.items?.slice(0, 5).map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-start text-xs text-slate-700 font-medium">
                                                    <span className="flex-1 pr-4 leading-tight">{item.item_name}</span>
                                                    <span className="font-black text-blue-600 whitespace-nowrap bg-blue-100/50 px-2 py-0.5 rounded ml-2">x{item.quantity_ordered}</span>
                                                </div>
                                            ))}
                                            {(po.items?.length || 0) > 5 && (
                                                <div className="text-[10px] text-slate-400 font-bold italic pt-1">
                                                    + {(po.items?.length || 0) - 5} more items...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredPOs.length === 0 && (
                                <div className="py-20 text-center text-slate-400">
                                    <FileText size={48} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-bold">No candidates found</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Action Bar */}
                    <div className="p-6 bg-slate-50 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-5 px-1">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Link Selected</span>
                            <span className="text-sm font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                                {selectedPoId ? allPendingPOs.find(p => p.id === selectedPoId)?.po_number : 'None'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={onSkip} className="h-14 text-sm font-black uppercase tracking-widest text-slate-500 bg-white border-slate-200 rounded-2xl hover:bg-slate-50">
                                Skip
                            </Button>
                            <Button
                                disabled={!selectedPoId}
                                onClick={handleConfirm}
                                className="h-14 text-sm font-black uppercase tracking-widest rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200"
                            >
                                Link PO
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isFullScreen) {
        return Content;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[98vw] max-w-[1600px] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50/50">
                {Content}
            </DialogContent>
        </Dialog>
    );
}
