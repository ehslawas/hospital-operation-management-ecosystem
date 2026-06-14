import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Badge } from '@/components/ui'
import { ReminderLetterTemplate } from '../pdf/ReminderLetterTemplate'
import { orderTrackingService } from '@/services/pharmacy/orderTrackingService'
import { useToast } from '@/stores/toastStore'
import { generateLpoPdf } from '@/utils/lpoPdfGenerator'
import { Send, Loader2, ArrowRight, History } from 'lucide-react'
import { format } from 'date-fns'

interface ReminderModalProps {
    isOpen: boolean
    onClose: () => void
    lpo: any
    onSuccess: () => void
}

export const ReminderModal = ({ isOpen, onClose, lpo, onSuccess }: ReminderModalProps) => {
    const { success, error } = useToast()
    const [isGenerating, setIsGenerating] = useState(false)
    const [step, setStep] = useState<'form' | 'preview'>('form')
    const letterRef = useRef<HTMLDivElement>(null)

    // Form State
    const [recipientName, setRecipientName] = useState('')
    const [recipientEmail, setRecipientEmail] = useState('')

    useEffect(() => {
        if (isOpen) {
            setStep('form') // Reset to form on open
        }
        if (lpo) {
            const po = Array.isArray(lpo.purchase_order) ? lpo.purchase_order[0] : lpo.purchase_order
            setRecipientName(po?.supplier?.company_name || po?.manual_supplier_name || '')
            setRecipientEmail(po?.supplier?.email || '')
        }
    }, [lpo, isOpen])

    if (!lpo) return null

    const po = Array.isArray(lpo.purchase_order) ? lpo.purchase_order[0] : lpo.purchase_order
    const items = lpo.tracking_items?.filter((i: any) => i.is_overdue || (i.status !== 'delivered' && new Date(i.expected_delivery_date) < new Date())) || []

    // Calculate reminder count based on existing history
    const history = lpo.reminders?.sort((a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()) || []
    const nextReminderNumber = history.length + 1

    const handleSendReminder = async () => {
        try {
            setIsGenerating(true)

            if (!letterRef.current) throw new Error("Template not loaded")

            // 1. Generate PDF
            const pdfBlob = await generateLpoPdf(letterRef.current, `REMINDER_${lpo.lpo_number}`)

            // 2. Upload and Log
            await orderTrackingService.logReminder(lpo.id, pdfBlob, nextReminderNumber)

            success("Reminder sent and logged successfully")
            onSuccess()
            onClose()
        } catch (err) {
            console.error(err)
            error("Failed to send reminder")
        } finally {
            setIsGenerating(false)
        }
    }

    // Mapping items for template
    const templateItems = items.map((i: any) => {
        const poItem = po?.items?.find((pi: any) => pi.item_id === i.item_id || pi.id === i.item_id)
        return {
            code: poItem?.item_code || i.item_code || '-',
            name: poItem?.item_name || 'Item Name Not Found',
            quantity: poItem?.quantity_ordered || 0,
            expectedDate: i.expected_delivery_date,
            daysOverdue: i.days_overdue > 0 ? i.days_overdue : Math.ceil((new Date().getTime() - new Date(i.expected_delivery_date).getTime()) / (1000 * 60 * 60 * 24))
        }
    })

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* Fixed Sidebar Layout: max-w-[90vw] to ensure main panel has enough space, h-[85vh] fixed height */}
            {/* Modern 50/50 Layout: balanced split, clean aesthetics */}
            <DialogContent className="w-[95vw] max-w-[1700px] h-[90vh] p-0 overflow-hidden bg-slate-50 shadow-2xl border-0 rounded-3xl gap-0 flex flex-col font-sans">

                {/* 1. COMPACT HEADER */}
                <DialogHeader className="px-8 py-5 border-b border-slate-200 bg-white shrink-0 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-4">
                        <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                            Send Delivery Reminder
                        </DialogTitle>
                        {/* Status Badge moved to header */}
                        {items.length > 0 && Math.max(...items.map((i: any) => i.days_overdue || 0)) > 0 && (
                            <Badge className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full font-bold shadow-sm">
                                {Math.max(...items.map((i: any) => i.days_overdue || 0))} Days Overdue
                            </Badge>
                        )}
                    </div>
                    <Badge className="bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1 rounded-full font-medium">
                        Reminder #{nextReminderNumber}
                    </Badge>
                </DialogHeader>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_300px] overflow-hidden relative">
                    {/* Hidden div strictly for PDF capture */}
                    <div className="fixed opacity-0 pointer-events-none -left-[5000px] bg-white">
                        <div id="reminder-pdf-capture" ref={letterRef}>
                            <ReminderLetterTemplate
                                poNumber={po?.po_number || '-'}
                                lpoNumber={lpo.lpo_number}
                                lpoDate={lpo.document_date || lpo.created_at}
                                supplierName={recipientName}
                                supplierAddress={po?.supplier?.address}
                                items={templateItems}
                                reminderCount={nextReminderNumber}
                            />
                        </div>
                    </div>

                    {step === 'form' ? (
                        <>
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-slate-50/50 relative">
                                {/* LEFT PANEL: Pending Items (Modern Card) */}
                                <div className="p-6 lg:p-10 overflow-auto flex flex-col">
                                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex-1 flex flex-col relative">
                                        {/* Inner Header with Gradient Accent */}
                                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                                                    Pending Items
                                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{items.length}</span>
                                                </h3>
                                                <p className="text-slate-400 text-xs mt-1 font-medium">Items awaiting delivery from this order</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-auto p-0">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50/80 sticky top-0 z-10 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-8 py-4 pl-8">Item Details</th>
                                                        <th className="px-6 py-4 text-center">Qty</th>
                                                        <th className="px-6 py-4 text-right pr-8">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {templateItems.map((item: any, idx: number) => (
                                                        <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <div className="font-bold text-slate-800 text-[16px] group-hover:text-blue-700 transition-colors">{item.name}</div>
                                                                <div className="text-xs text-slate-400 font-medium mt-1.5 flex items-center gap-3">
                                                                    <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-500 border border-slate-200 font-mono tracking-tight">{item.code}</span>
                                                                    <span className="text-slate-300">|</span>
                                                                    <span className="text-slate-500">Exp: {format(new Date(item.expectedDate), 'dd MMM yyyy')}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-center">
                                                                <div className="inline-flex items-center justify-center font-bold text-lg text-slate-700 bg-slate-100 border border-slate-200 h-10 w-14 rounded-xl">
                                                                    {item.quantity}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 pr-8 text-right">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-bold shadow-sm">
                                                                    <span className="relative flex h-2 w-2">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                                    </span>
                                                                    {item.daysOverdue} Days Late
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT PANEL: Context (Modern Card) */}
                                <div className="p-6 lg:p-10 overflow-auto flex flex-col h-[40vh] lg:h-auto border-t lg:border-t-0 border-slate-200/50">
                                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 h-full flex flex-col gap-8 relative">
                                        {/* Decorative background blob */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[100px] pointer-events-none" />

                                        {/* Section A: Recipient */}
                                        <div className="space-y-4">
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Recipient Info</h3>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-500 pl-1">Company Name</label>
                                                    <Input
                                                        value={recipientName}
                                                        onChange={(e) => setRecipientName(e.target.value)}
                                                        className="bg-white border-slate-200 focus:border-blue-500 transition-all rounded-lg text-sm h-10 shadow-sm"
                                                        placeholder="Supplier Name"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-500 pl-1">Email Address</label>
                                                    <Input
                                                        value={recipientEmail}
                                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                                        className="bg-white border-slate-200 focus:border-blue-500 transition-all rounded-lg text-sm h-10 shadow-sm"
                                                        placeholder="supplier@email.com"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section B: History (Timeline) */}
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center justify-between pl-1">
                                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">History</h3>
                                                {history.length > 0 && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">{history.length}</span>}
                                            </div>

                                            {history.length === 0 ? (
                                                <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                                                    <History className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                                    <p className="text-xs text-slate-400">No reminders sent yet.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-0 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                                    {history.map((record: any, idx: number) => (
                                                        <div key={idx} className="relative pl-8 pb-6 last:pb-0 group">
                                                            <div className="absolute left-[9px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-500 transition-colors z-10" />
                                                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md group-hover:border-blue-200 transition-all">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Reminder #{record.reminder_number}</span>
                                                                    <span className="text-[10px] text-slate-400">{format(new Date(record.sent_at), 'dd MMM')}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between mt-2">
                                                                    <span className="text-xs font-medium text-slate-700">Sent via Email</span>
                                                                    {record.pdf_url && (
                                                                        <a href={record.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors">
                                                                            <ArrowRight className="w-3.5 h-3.5 -rotate-45" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* PREVIEW MODE CONTAINER */
                        <div className="w-full bg-slate-100 overflow-y-auto p-10 flex justify-center">
                            <div className="origin-top scale-[0.8] w-fit h-fit shadow-2xl ring-1 ring-slate-900/5 bg-white p-[40px] rounded-sm">
                                <ReminderLetterTemplate
                                    poNumber={po?.po_number || '-'}
                                    lpoNumber={lpo.lpo_number}
                                    lpoDate={lpo.document_date || lpo.created_at}
                                    supplierName={recipientName}
                                    supplierAddress={po?.supplier?.address}
                                    items={templateItems}
                                    reminderCount={nextReminderNumber}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-8 py-4 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between relative z-20">
                    <div className="text-xs text-slate-400 font-medium">
                        {step === 'form' ? 'Ready to review and send.' : 'Previewing document before sending.'}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={step === 'form' ? onClose : () => setStep('form')} className="border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full h-10 px-6">
                            {step === 'form' ? 'Cancel' : 'Back to Edit'}
                        </Button>

                        {step === 'form' ? (
                            <Button onClick={() => setStep('preview')} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 rounded-full h-10 px-6">
                                Update & Preview
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleSendReminder} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-full h-10 px-8">
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                Confirm & Send Reminder
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
