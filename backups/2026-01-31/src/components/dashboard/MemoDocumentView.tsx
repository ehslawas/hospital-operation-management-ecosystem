import React, { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Printer, Download, FileText, Mail } from 'lucide-react'
import { Button } from '@/components/ui'
import { MemoWithRelations } from '@/types'
import { formatDate } from '@/lib/utils'
import { generateMemoPDF } from '@/services/memoExportService'

interface MemoDocumentViewProps {
    isOpen: boolean
    onClose: () => void
    memo: MemoWithRelations
}

export const MemoDocumentView: React.FC<MemoDocumentViewProps> = ({ isOpen, onClose, memo }) => {
    const componentRef = useRef<HTMLDivElement>(null)

    if (!isOpen) return null

    const handlePrint = () => {
        window.print()
    }

    const handleDownload = () => {
        generateMemoPDF(memo)
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header Toolbar */}
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                                {memo.is_letter ? <Mail className="w-6 h-6 text-white" /> : <FileText className="w-6 h-6 text-white" />}
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900">{memo.is_letter ? 'Official Letter View' : 'Official Memo View'}</h2>
                                <p className="text-xs text-gray-500">Government Standard Format</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full w-8 h-8 p-0">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Document Scroll Area */}
                    <div className="flex-1 p-8 md:p-16 overflow-y-auto bg-slate-100/50">
                        <div className="mx-auto bg-white shadow-lg border border-gray-200 w-full min-h-[1056px] p-[2cm] relative text-slate-900 font-serif">

                            {/* Header Section */}
                            <div className="flex items-start justify-center mb-8 relative">
                                <div className="absolute left-0 top-0 w-24 h-24">
                                    <img src="/512px-Jata_MalaysiaV2.svg.png" alt="Jata Negara" className="w-full h-full object-contain" />
                                </div>
                                <div className="text-center flex-1">
                                    {memo.is_letter ? (
                                        <div className="font-serif text-gray-900 space-y-1">
                                            <h1 className="text-xl font-bold tracking-wide uppercase">JABATAN KESIHATAN NEGERI SARAWAK</h1>
                                            <h2 className="text-lg font-bold uppercase">HOSPITAL LAWAS</h2>
                                            <p className="text-xs">Jalan Hospital, 98850 Lawas, Sarawak</p>
                                            <div className="flex justify-center gap-4 text-[10px] mt-1">
                                                <span>Tel: 085-285464</span>
                                                <span>Faks: 085-285555</span>
                                            </div>
                                            <div className="w-full h-[1px] bg-gray-800 mt-2"></div>
                                        </div>
                                    ) : (
                                        <div className="font-serif text-gray-900 space-y-1 pt-2">
                                            <h2 className="text-lg font-bold uppercase">UNIT {memo.created_by_user?.department?.name || 'FARMASI'}</h2>
                                            <h1 className="text-xl font-bold tracking-wider uppercase">HOSPITAL LAWAS</h1>
                                            <p className="text-sm font-semibold uppercase">KEMENTERIAN KESIHATAN MALAYSIA</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="font-serif text-sm relative mb-8">
                                {memo.is_letter ? (
                                    <div className="flex justify-between items-start">
                                        <div className="max-w-[50%] space-y-4 mt-8">
                                            <div>
                                                <p className="font-bold">{memo.recipient_name || 'Kepada Pihak Berkenaan'}</p>
                                                <p className="whitespace-pre-wrap">{memo.recipient_address || 'Alamat Penerima'}</p>
                                            </div>
                                            <p className="mt-4">Tuan/Puan,</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p><span className="font-bold">Ruj. Kami:</span> {memo.ref_number || `(  ) dlm.HLWS/600-15/1/2`}</p>
                                            <p><span className="font-bold">Tarikh:</span> {formatDate(memo.created_at)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-1 border-2 border-gray-900 p-4">
                                        <div className="font-bold">RUJ. KAMI</div>
                                        <div>: {memo.ref_number || `(  ) dlm.HLWS/600-15/1/2`}</div>

                                        <div className="font-bold">TARIKH</div>
                                        <div>: {formatDate(memo.created_at)}</div>

                                        <div className="font-bold">KEPADA</div>
                                        <div className="uppercase">: {memo.target_departments?.includes('all') ? 'SEMUA KETUA JABATAN / UNIT' : 'KETUA JABATAN BERKENAAN'}</div>

                                        <div className="font-bold">DARIPADA</div>
                                        <div className="uppercase">: KETUA UNIT {memo.created_by_user?.department?.name || 'FARMASI'}</div>
                                    </div>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="mb-12 min-h-[200px] text-justify font-serif text-base leading-relaxed">
                                {!memo.is_letter && (
                                    <div className="font-bold uppercase mb-4 underline decoration-1 underline-offset-4">
                                        PERKARA: {memo.title}
                                    </div>
                                )}
                                {memo.is_letter && (
                                    <div className="font-bold uppercase mb-4 text-justify">
                                        {memo.title}
                                    </div>
                                )}

                                <div className="space-y-4 whitespace-pre-wrap">
                                    {memo.is_letter && <p>Dengan segala hormatnya perkara di atas adalah dirujuk.</p>}
                                    {memo.content}
                                    {memo.is_letter && <p>Sekian, terima kasih.</p>}
                                </div>
                            </div>

                            {/* Signature Section */}
                            {!memo.is_letter && <div className="mt-16 mb-8 font-serif">
                                <p className="font-bold mb-0">"BERKHIDMAT UNTUK NEGARA"</p>
                                <p className="italic mb-6">Saya yang menjalankan amanah,</p>

                                <div className="mt-12">
                                    <p className="font-bold uppercase">({memo.created_by_user?.full_name})</p>
                                    <p className="">{memo.created_by_user?.jawatan || 'Pegawai Farmasi'}</p>
                                    <p className="">Unit {memo.created_by_user?.department?.name || 'Farmasi'}</p>
                                    <p className="">Hospital Lawas</p>
                                </div>
                            </div>}

                            {memo.is_letter && <div className="mt-16 mb-8 font-serif">
                                <p className="font-bold mb-0">"BERKHIDMAT UNTUK NEGARA"</p>
                                <p className="italic mb-6">Saya yang menjalankan amanah,</p>

                                <div className="mt-12">
                                    <p className="font-bold uppercase">({memo.created_by_user?.full_name})</p>
                                    <p className="">{memo.created_by_user?.jawatan || 'Pengarah Hospital'}</p>
                                    <p className="">Hospital Lawas</p>
                                </div>
                            </div>}

                            {/* Digital Stamp / Watermark */}
                            <div className="absolute bottom-10 right-10 opacity-10 rotate-[-15deg] pointer-events-none">
                                <img src="/512px-Jata_MalaysiaV2.svg.png" alt="Jata Negara" className="w-32 h-32 text-primary-900" />
                                <p className="text-center font-bold text-xs">OFFICIAL DOCUMENT</p>
                            </div>

                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
