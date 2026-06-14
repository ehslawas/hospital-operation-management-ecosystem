import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, RefreshCw, AlertTriangle, X } from 'lucide-react'
import { Button, Spinner } from '@/components/ui'
import { PurchaseOrderTemplate } from '@/components/pharmacy/procurement/PurchaseOrderTemplate'
import { getPurchaseOrderById } from '@/services/pharmacy/procurementService'
import { findContractByNumber } from '@/services/pharmacy/contractCatalogService'
import { getPharmacyPOSignatures, PharmacyPOSignatures } from '@/services/pharmacy/pharmacySettingsService'
import { PurchaseOrderWithRelations, ContractWithRelations } from '@/types/pharmacy'
import { useAuthStore } from '@/stores/authStore'

interface LPOComparisonModalProps {
    isOpen: boolean
    onClose: () => void
    lpoDocumentUrl: string
    poId: string
    lpoNumber: string
}

export const LPOComparisonModal: React.FC<LPOComparisonModalProps> = ({
    isOpen,
    onClose,
    lpoDocumentUrl,
    poId,
    lpoNumber
}) => {
    const { user } = useAuthStore()
    const hospitalId = user?.hospital_id

    const [focusedPane, setFocusedPane] = useState<'left' | 'right' | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [poData, setPoData] = useState<PurchaseOrderWithRelations | null>(null)
    const [contract, setContract] = useState<ContractWithRelations | null>(null)
    // Default signatures
    const [signatures, setSignatures] = useState<PharmacyPOSignatures>({
        applicantName: 'KAMRIAH BINTI MAIL',
        applicantPosition: 'PEN. PEGAWAI FARMASI U 6',
        headName: 'TAN YUAN ZHANG',
        headPosition: 'PEGAWAI FARMASI UF 32',
    })

    useEffect(() => {
        if (!isOpen || !poId || !hospitalId) return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                // 1. Fetch PO Details
                const { data: po } = await getPurchaseOrderById(poId)
                setPoData(po)

                // 2. Fetch Signatures
                const sigRes = await getPharmacyPOSignatures(hospitalId)
                if (sigRes.data) {
                    setSignatures(sigRes.data)
                }

                // 3. Fetch Contract if applicable
                if (po && po.kkm_contract_number && po.vote_code === '080702') {
                    const contractRes = await findContractByNumber(hospitalId, po.kkm_contract_number)
                    if (contractRes.data) {
                        setContract(contractRes.data)
                    }
                }
            } catch (error) {
                console.error('Failed to load comparison data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [isOpen, poId, hospitalId])

    if (!isOpen) return null

    const transformedItems = poData?.items || []

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-900 overflow-hidden font-serif">
            {/* Top Ribbon - Formal Government Style */}
            <div className="bg-slate-950 text-white px-6 py-3 flex items-center justify-between z-50 border-b-2 border-slate-800 shrink-0">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white p-1 rounded-sm shadow-inner flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-slate-900" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white leading-none mb-1">
                                SISTEM PENGESAHAN PESANAN KERAJAAN
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                GOVERNMENT PURCHASE ORDER VERIFICATION SYSTEM
                            </p>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-white/10" />

                    {/* Meta Data */}
                    <div className="flex items-center gap-16">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-600 uppercase leading-none mb-1">Current Session LPO</span>
                            <span className="text-xs font-black text-slate-300 tracking-wider">
                                {lpoNumber}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-600 uppercase leading-none mb-1">System Audit Ledger</span>
                            <span className="text-xs font-black text-blue-400 tracking-wider">
                                PO-{poData?.po_number || 'PENDING'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFocusedPane(null)}
                        className={`text-slate-500 hover:text-white hover:bg-white/5 border border-slate-800 h-9 px-4 rounded-sm text-[10px] font-black uppercase tracking-widest ${!focusedPane ? 'hidden' : 'flex'}`}
                    >
                        Standard View
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(lpoDocumentUrl, '_blank')}
                        className="text-slate-400 hover:text-white hover:bg-white/5 border border-slate-800 h-9 px-4 rounded-sm text-[10px] font-black uppercase tracking-widest"
                    >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        Formal Print
                    </Button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-rose-900 text-white rounded-sm transition-all border border-slate-700 ml-4 font-sans font-bold text-sm"
                    >
                        EXIT SYSTEM
                    </button>
                </div>
            </div>

            {/* Content - Audit Workspace */}
            <div className="flex-1 flex overflow-hidden bg-slate-900">
                {/* Left: Source Capture - Finalized 65/35 Split (65% Default) */}
                <div
                    className={`transition-all duration-700 flex flex-col border-r-2 border-slate-700 relative ${focusedPane === 'left' ? 'w-[85%]' : focusedPane === 'right' ? 'w-[15%]' : 'w-[65%]'
                        }`}
                >
                    <div className="px-4 py-1.5 bg-slate-800 border-b border-black flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-white">PESANAN KERAJAAN (SOURCE)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setFocusedPane(focusedPane === 'left' ? null : 'left')}
                                className={`flex items-center gap-2 text-[9px] font-black px-3 py-1 rounded-sm border transition-all ${focusedPane === 'left'
                                    ? 'bg-rose-900 border-rose-700 text-white'
                                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600'
                                    }`}
                            >
                                {focusedPane === 'left' ? 'RESTORE VIEW' : 'EXPAND'}
                            </button>
                            <button
                                onClick={onClose}
                                className="text-[9px] font-black bg-white hover:bg-rose-600 text-slate-900 hover:text-white px-3 py-1 rounded-sm transition-all border border-slate-300"
                            >
                                EXIT PREVIEW
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 bg-white relative">
                        {/* Fit Horizontal and move significantly closer (65/35 split) */}
                        <iframe
                            key={`${lpoDocumentUrl}-${focusedPane}-right-shift-65`}
                            src={`${lpoDocumentUrl}#view=FitH&zoom=page-width&toolbar=1&navpanes=0&statusbar=0&messages=0`}
                            className="w-full h-full border-none shadow-2xl"
                            title="Uploaded LPO"
                        />

                        {focusedPane === 'right' && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center cursor-pointer" onClick={() => setFocusedPane(null)}>
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.5em] -rotate-90">Condensed View</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Master Ledger - Reference (35% Default) */}
                <div
                    className={`transition-all duration-700 flex flex-col relative bg-white ${focusedPane === 'right' ? 'w-[85%]' : focusedPane === 'left' ? 'w-[15%]' : 'w-[35%]'
                        }`}
                >
                    <div className="px-4 py-1.5 bg-slate-200 border-b border-slate-300 flex justify-between items-center shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">SYSTEM LEDGER (PO ENTRY)</span>
                        <button
                            onClick={() => setFocusedPane(focusedPane === 'right' ? null : 'right')}
                            className="text-[9px] font-black text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 px-3 py-1 rounded-sm uppercase transition-all"
                        >
                            {focusedPane === 'right' ? 'RESTORE' : 'EXPAND'}
                        </button>
                    </div>
                    {/* Centered Container - Scaled to fill 40% pane completely */}
                    <div className="flex-1 overflow-hidden bg-white flex flex-col items-center justify-start pt-2">
                        {isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-10">
                                <Spinner size="lg" className="mb-4 text-slate-900" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">Syncing Cryptographic Ledger...</p>
                            </div>
                        ) : poData ? (
                            <div className={`transition-all duration-700 origin-top flex justify-center transform ${focusedPane === 'left'
                                ? 'scale-[0.4] opacity-50 blur-[1px]'
                                : focusedPane === 'right'
                                    ? 'scale-[0.95]'
                                    : 'scale-[0.82]'
                                }`}>
                                <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-300 w-[210mm] min-h-[297mm] overflow-hidden">
                                    <PurchaseOrderTemplate
                                        order={poData}
                                        items={transformedItems}
                                        contract={contract}
                                        signatures={signatures}
                                        balance={(poData as any).budget?.balance}
                                        compact={false}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10 px-8 text-center">
                                <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-[9px] font-black uppercase tracking-widest leading-loose">
                                    Secure Connection Failure:<br />
                                    Missing Ledger Entry
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .customized-scrollbar::-webkit-scrollbar {
                    width: 10px;
                }
                .customized-scrollbar::-webkit-scrollbar-track {
                    background: #cbd5e1;
                }
                .customized-scrollbar::-webkit-scrollbar-thumb {
                    background: #475569;
                    border: 2px solid #cbd5e1;
                }
                .customized-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #1e293b;
                }
            `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
}
