import React, { useState, useEffect } from 'react'
import {
  IconX,
  IconPackage,
  IconAlertCircle,
  IconFileText,
  IconPlus,
  IconCheckCircle,
  IconTrash,
  IconHistory,
  IconClock,
  IconUpload,
  IconEdit,
  IconCreditCard,
  IconShieldCheck
} from '@/components/ui/Icons'
import { 
  getReceivingDetail, 
  createGoodsReceipt, 
  getGoodsReceiptHistory, 
  deleteGoodsReceipt, 
  updateGoodsReceipt 
} from '@/services/pharmacy/receivingService'
import type { GoodsReceiptItemCreate } from '@/services/pharmacy/receivingService'
import { updateLPOPaymentStatus, createSupplierAssessment } from '@/services/pharmacy/lpoService'
import { Star } from 'lucide-react'
import { uploadFile, supabase } from '@/services/supabase'
import type { GoodsReceipt } from '@/types/pharmacy'
import { useAuthStore } from '@/stores/authStore'
import { Spinner, Input, Badge, Modal, Textarea } from '@/components/ui'
import { cn, formatCurrency } from '@/lib/utils'

interface GoodsReceivingFormProps {
  poId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  isEmbedded?: boolean
}

export default function GoodsReceivingForm({
  poId,
  isOpen,
  onClose,
  onSuccess,
  isEmbedded = false
}: GoodsReceivingFormProps) {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentUrls, setDocumentUrls] = useState<string[]>([])

  // Modification State
  const [selectedGrForMod, setSelectedGrForMod] = useState<any | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false)
  const [selectedGrForAssessment, setSelectedGrForAssessment] = useState<any | null>(null)
  const [assessments, setAssessments] = useState<any[]>([])

  const [po, setPo] = useState<any>(null)
  
  // Form State
  const [deliveryNote, setDeliveryNote] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  
  const [items, setItems] = useState<GoodsReceiptItemCreate[]>([])
  
  const [history, setHistory] = useState<(GoodsReceipt & { items: any[], received_by_user?: { full_name: string } })[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (isOpen && poId) {
      void loadPo()
    } else {
      // Reset state
      setPo(null)
      setItems([])
      setDeliveryNote('')
      setNotes('')
      setError(null)
      setScheduledDate('')
      setAssessments([])
      setSelectedGrForAssessment(null)
    }
  }, [isOpen, poId])

  const initializeItems = (poData: any) => {
    const initialItems: GoodsReceiptItemCreate[] = poData.items.map((item: any) => {
      const qtyOrdered = item.quantity_ordered || 0
      const qtyPrevReceived = item.quantity_received || 0
      const qtyRemaining = Math.max(0, qtyOrdered - qtyPrevReceived)

      return {
        po_item_id: item.id,
        item_id: item.item_id,
        item_name: item.item_name || item.packaging_description || 'Unknown Item',
        quantity_ordered: qtyOrdered,
        quantity_previously_received: qtyPrevReceived,
        quantity_received: qtyRemaining,
        quantity_accepted: qtyRemaining,
        quantity_rejected: 0,
        disposition: 'accepted',
        rejection_reason: '',
        notes: '',
        batches: [{ batch_number: '', manufacturing_date: '', expiry_date: '', quantity: qtyRemaining }],
        credit_note_quantity: 0,
        mark_remaining_as_credit_note: false,
        credit_note_reason: '',
        arrived: qtyRemaining > 0
      }
    })
    setItems(initialItems)
  }

  const loadPo = async () => {
    setIsLoading(true)
    setError(null)
    
    const [res, historyRes] = await Promise.all([
      getReceivingDetail(poId),
      getGoodsReceiptHistory(poId)
    ])

    if (historyRes.data) {
      setHistory(historyRes.data as any)
      if (res.data?.status === 'completed') {
        setShowHistory(true)
      }
    }

    if (res.error) {
      setError(res.error)
    } else if (res.data) {
      setPo(res.data)
      initializeItems(res.data)
      
      // Auto-populate Delivery Order No. from LPO if available
      if (res.data?.lpo?.[0]?.lpo_number) {
        setDeliveryNote(res.data.lpo[0].lpo_number)
      }

      // Fetch supplier assessments for this LPO
      const lpoId = res.data?.lpo?.[0]?.id
      if (lpoId) {
        const { data: assessData } = await supabase
          .from('pharmacy_supplier_assessments')
          .select('*')
          .eq('lpo_id', lpoId)
        if (assessData) {
          setAssessments(assessData)
        }
      }

      // Initialize scheduled date
      const lpos = res.data?.lpo
      let initialExpectedDate = null
      if (Array.isArray(lpos)) {
        for (const lpo of lpos) {
          if (lpo.expected_delivery_date) {
            initialExpectedDate = lpo.expected_delivery_date
            break
          }
          if (Array.isArray(lpo.tracking) && lpo.tracking.length > 0) {
            const track = lpo.tracking.find((t: any) => t.expected_delivery_date)
            if (track) {
              initialExpectedDate = track.expected_delivery_date
              break
            }
          }
        }
      }
      if (!initialExpectedDate && res.data?.expected_delivery_date) {
        initialExpectedDate = res.data.expected_delivery_date
      }
      setScheduledDate(initialExpectedDate ? initialExpectedDate.split('T')[0] : '')
    }
    setIsLoading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      const newUrls = [...documentUrls]
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const path = `delivery-orders/${hospitalId}/${Date.now()}_${file.name}`
        const { url, error: uploadError } = await uploadFile('lpo-documents', path, file)

        if (uploadError) throw new Error(uploadError)
        if (url) newUrls.push(url)
      }
      setDocumentUrls(newUrls)
    } catch (err: any) {
      setError(err.message || 'Failed to upload document')
    } finally {
      setIsUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const removeDocument = (index: number) => {
    const newUrls = [...documentUrls]
    newUrls.splice(index, 1)
    setDocumentUrls(newUrls)
  }

  const getExpectedDate = () => {
    const lpos = po?.lpo
    if (Array.isArray(lpos)) {
      for (const lpo of lpos) {
        if (lpo.expected_delivery_date) return lpo.expected_delivery_date
        if (Array.isArray(lpo.tracking) && lpo.tracking.length > 0) {
          const track = lpo.tracking.find((t: any) => t.expected_delivery_date)
          if (track) return track.expected_delivery_date
        }
      }
    }
    if (po?.expected_delivery_date) return po.expected_delivery_date
    return null
  }

  const isLate = (date: string) => {
    const expectedDate = scheduledDate || getExpectedDate()
    if (!expectedDate) return false
    const expected = new Date(expectedDate)
    const actual = new Date(date)
    expected.setHours(0, 0, 0, 0)
    actual.setHours(0, 0, 0, 0)
    return actual > expected
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: '—', time: '' }
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const handleItemChange = (index: number, field: keyof GoodsReceiptItemCreate, value: any) => {
    const newItems = [...items]
    const item = newItems[index]
    
    // @ts-ignore
    item[field] = value

    if (field === 'arrived') {
      if (!value) {
        // Toggle Off: set quantities to 0
        item.quantity_received = 0
        item.quantity_accepted = 0
        item.quantity_rejected = 0
        item.batches.forEach(b => { b.quantity = 0 })
      } else {
        // Toggle On: restore remaining quantity
        const remaining = Math.max(0, item.quantity_ordered - item.quantity_previously_received)
        item.quantity_received = remaining
        item.quantity_accepted = remaining
        item.quantity_rejected = 0
        if (item.batches.length > 0) {
          item.batches[0].quantity = remaining
          item.batches = [item.batches[0]]
        } else {
          item.batches = [{ batch_number: '', manufacturing_date: '', expiry_date: '', quantity: remaining }]
        }
      }
    }

    if (field === 'quantity_received') {
      const numValue = parseInt(value, 10) || 0
      item.quantity_accepted = Math.max(0, numValue - item.quantity_rejected)
      item.arrived = numValue > 0
    } else if (field === 'quantity_rejected') {
      const numValue = parseInt(value, 10) || 0
      item.quantity_accepted = Math.max(0, item.quantity_received - numValue)
    }

    if (field === 'quantity_received' || field === 'quantity_rejected') {
      let currentTotal = 0
      item.batches.forEach((batch) => {
        if (currentTotal + (batch.quantity || 0) > item.quantity_accepted) {
          batch.quantity = Math.max(0, item.quantity_accepted - currentTotal)
        }
        currentTotal += (batch.quantity || 0)
      })
    }

    if (item.mark_remaining_as_credit_note) {
      const remaining = Math.max(0, item.quantity_ordered - item.quantity_previously_received - item.quantity_accepted)
      item.credit_note_quantity = remaining
    } else if (field === 'mark_remaining_as_credit_note' && !value) {
      item.credit_note_quantity = 0
    }

    setItems(newItems)
  }

  const handleBatchChange = (itemIndex: number, batchIndex: number, field: keyof GoodsReceiptItemCreate['batches'][0], value: any) => {
    const newItems = [...items]
    const batch = newItems[itemIndex].batches[batchIndex]
    
    if (field === 'quantity') {
      const numValue = parseInt(value, 10) || 0
      const otherBatchesSum = newItems[itemIndex].batches
        .filter((_, i) => i !== batchIndex)
        .reduce((sum, b) => sum + (b.quantity || 0), 0)
      
      const maxAllowed = Math.max(0, newItems[itemIndex].quantity_accepted - otherBatchesSum)
      batch.quantity = Math.min(numValue, maxAllowed)
    } else {
      // @ts-ignore
      batch[field] = value
    }
    
    setItems(newItems)
  }

  const handleAddBatch = (itemIndex: number) => {
    const newItems = [...items]
    newItems[itemIndex].batches.push({ batch_number: '', manufacturing_date: '', expiry_date: '', quantity: 0 })
    setItems(newItems)
  }

  const handleRemoveBatch = (itemIndex: number, batchIndex: number) => {
    const newItems = [...items]
    if (newItems[itemIndex].batches.length > 1) {
      newItems[itemIndex].batches.splice(batchIndex, 1)
      setItems(newItems)
    }
  }

  const handleSubmit = async () => {
    if (!hospitalId || !user?.id) return
    
    const receivedItems = items.filter(i => i.quantity_received > 0 || (i.credit_note_quantity && i.credit_note_quantity > 0) || i.disposition === 'credit_note')
    
    if (receivedItems.length === 0) {
      setError("Please enter received quantities for at least one item, or request a Credit Note.")
      return
    }

    if (!deliveryNote.trim()) {
      setError("Delivery Order No. (DO) is required. Please provide a valid DO Number.")
      return
    }

    for (const item of receivedItems) {
      if (item.disposition !== 'credit_note' && item.quantity_accepted > 0) {
        const totalBatchQty = item.batches.reduce((sum, b) => sum + (b.quantity || 0), 0)
        if (totalBatchQty !== item.quantity_accepted) {
          setError(`Batch quantities (${totalBatchQty}) must equal accepted quantity (${item.quantity_accepted}) for ${item.item_name}`)
          return
        }
        
        for (const batch of item.batches) {
          if (batch.quantity > 0) {
            if (!batch.batch_number) {
              setError(`Batch number required for accepted items: ${item.item_name}`)
              return
            }
            if (!batch.expiry_date) {
              setError(`Expiry date required for accepted items: ${item.item_name}`)
              return
            }
          }
        }
      }
    }

    setIsSubmitting(true)
    setError(null)

    const payload = {
      hospital_id: hospitalId,
      po_id: poId,
      lpo_id: po.lpo?.[0]?.id,
      receipt_date: receiptDate,
      delivery_note_number: deliveryNote,
      invoice_number: invoiceNumber,
      received_by: user.id,
      notes: notes,
      document_urls: documentUrls,
      items: receivedItems
    }

    // Save the updated scheduled date to Supabase if it was changed BEFORE calling createGoodsReceipt
    // so that the backend penalty service evaluates the penalty using the correct/updated scheduled date.
    if (po.lpo?.[0]?.id && scheduledDate) {
      try {
        await supabase
          .from('pharmacy_lpo')
          .update({ expected_delivery_date: scheduledDate })
          .eq('id', po.lpo[0].id)

        await supabase
          .from('pharmacy_order_tracking')
          .update({ expected_delivery_date: scheduledDate })
          .eq('lpo_id', po.lpo[0].id)
      } catch (dbErr) {
        console.error('Failed to update scheduled date in database:', dbErr)
      }
    }

    const res = await createGoodsReceipt(payload)

    if (res.error) {
      setError(res.error)
      setIsSubmitting(false)
    } else {
      onSuccess()
    }
  }

  const handleDeleteHistory = async (grId: string) => {
    if (!window.confirm('Are you sure you want to delete this receiving record?')) {
      return
    }

    try {
      setIsLoading(true)
      const res = await deleteGoodsReceipt(grId, poId)
      if (res.error) throw new Error(res.error)
      
      const [poRes, historyRes] = await Promise.all([
        getReceivingDetail(poId),
        getGoodsReceiptHistory(poId)
      ])

      if (poRes.data) {
        setPo(poRes.data)
        initializeItems(poRes.data)
      }
      if (historyRes.data) {
        setHistory(historyRes.data as any)
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to delete record')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProceedToPayment = async () => {
    const lpoId = po?.lpo?.[0]?.id
    if (!lpoId) return
    
    const allAssessed = history.length > 0 && history.every(gr => assessments.some(a => a.goods_receipt_id === gr.id));

    if (allAssessed) {
      setIsUpdating(true)
      try {
        const paymentRes = await updateLPOPaymentStatus(lpoId, 'sent_for_payment')
        if (paymentRes.error) throw new Error(paymentRes.error)
        void loadPo()
      } catch (err: any) {
        setError(err.message || 'Failed to proceed to payment')
      } finally {
        setIsUpdating(false)
      }
    } else {
      // Find the first unassessed goods receipt (DO)
      const unassessedGr = history.find(gr => !assessments.some(a => a.goods_receipt_id === gr.id));
      if (unassessedGr) {
        setSelectedGrForAssessment(unassessedGr);
      } else if (history.length > 0) {
        setSelectedGrForAssessment(history[0]);
      } else {
        setSelectedGrForAssessment(null);
      }
      setIsAssessmentOpen(true)
    }
  }



  if (!isOpen) return null

  const formContent = (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-30">
        <div className="flex items-center gap-5">
          <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-blue-400 shadow-xl">
            <IconPackage className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tighter uppercase italic leading-none">GOODS RECEIPT REGISTRY</h2>
              <div className="px-2 py-0.5 bg-blue-500 text-slate-900 text-[9px] font-black uppercase tracking-tighter rounded">SECURE</div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                REFERENCE: <span className="text-slate-200">{po?.po_number || 'LOADING...'}</span>
              </span>
              {po?.lpo?.[0]?.lpo_number && (
                <>
                  <div className="w-1 h-1 bg-slate-700 rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    LPO: <span className="text-blue-400">{po.lpo[0].lpo_number}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {!isEmbedded && (
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-300"
          >
            <IconX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]">
        {isLoading ? (
          <div className="py-40 flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">Accessing Supply Chain Data...</p>
          </div>
        ) : po ? (
          <>
            {po.status === 'completed' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col md:flex-row items-center p-8 gap-10 shadow-sm">
                <div className="flex items-center gap-6 px-8 py-5 bg-white border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <IconCheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Fulfillment Complete</h3>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Officially Verified</p>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-8 w-full">
                  {po?.lpo?.[0]?.payment_status === 'pending' || !po?.lpo?.[0]?.payment_status ? (
                    <>
                      <p className="text-slate-500 text-[12px] font-medium leading-relaxed max-w-sm">
                        Inventory intake has been finalized and authorized. You may now initiate the financial reconciliation workflow.
                      </p>
                      {(() => {
                        const allAssessed = history.length > 0 && history.every(gr => assessments.some(a => a.goods_receipt_id === gr.id));
                        return (
                          <button
                            onClick={handleProceedToPayment}
                            disabled={isUpdating || !allAssessed}
                            className={cn(
                              "h-12 px-10 rounded-xl font-bold text-[13px] transition-all flex items-center gap-3 whitespace-nowrap active:scale-95 disabled:scale-100",
                              allAssessed 
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 cursor-pointer"
                                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                            )}
                            title={!allAssessed ? "Sila lengkapkan Penilaian Prestasi Pembekal bagi setiap DO dahulu" : ""}
                          >
                            {isUpdating ? <Spinner size="sm" /> : <IconCreditCard className="w-4 h-4" />}
                            {allAssessed ? 'Proceed to payment' : 'Lengkapkan Penilaian Prestasi DO'}
                          </button>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="px-6 py-3 bg-white border border-slate-200 rounded-xl flex items-center gap-4 shadow-sm">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                        <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">
                          STATUS: {po?.lpo?.[0]?.payment_status === 'sent_for_payment' ? 'SENT FOR PAYMENT' : 'SETTLED'}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] italic">SECURE ARCHIVE RECORD • {po.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
            {error && (
              <div className="bg-rose-900 border-l-4 border-rose-500 p-6 flex items-start gap-4">
                <IconAlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Registry Error</h4>
                  <p className="text-sm text-rose-200 mt-1 font-bold">{error}</p>
                </div>
              </div>
            )}

            {/* Delivery Info */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                <IconFileText className="w-4 h-4 text-slate-900" />
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">OFFICIAL INTAKE MANIFEST</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date *</label>
                  <Input 
                    type="date" 
                    value={receiptDate} 
                    onChange={(e) => setReceiptDate(e.target.value)} 
                    className={cn(
                      "rounded-lg border-slate-200 h-10 font-bold text-xs",
                      isLate(receiptDate) ? "border-rose-300 bg-rose-50 focus:ring-rose-100" : ""
                    )}
                  />
                  {isLate(receiptDate) && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg">
                      <IconAlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">
                        LATE DELIVERY LOGGED
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Order No. (DO) *</label>
                  <Input 
                    type="text" 
                    placeholder="MANDATORY FOR REGISTRY"
                    value={deliveryNote} 
                    onChange={(e) => setDeliveryNote(e.target.value)} 
                    className="rounded-lg border-slate-200 h-10 font-bold text-xs placeholder:text-rose-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Date</label>
                  <Input 
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="rounded-lg border-slate-200 h-10 font-bold text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Order Documents (DO)</label>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="do-upload"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="do-upload"
                        className={cn(
                          "flex items-center gap-3 w-full h-10 px-4 border-2 border-dashed rounded-lg text-[10px] font-black transition-all cursor-pointer uppercase tracking-widest",
                          "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-400 hover:bg-slate-100",
                          isUploading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isUploading ? (
                          <Spinner size="sm" />
                        ) : (
                          <IconPlus className="w-4 h-4" />
                        )}
                        <span>{isUploading ? 'UPLOADING...' : 'ADD DELIVERY ORDERS'}</span>
                      </label>
                    </div>

                    {documentUrls.length > 0 && (
                      <div className="space-y-2">
                        {documentUrls.map((url, index) => {
                          const fileName = url.split('/').pop()?.split('_').slice(1).join('_') || 'DO-Document'
                          return (
                            <div key={index} className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg group animate-in fade-in slide-in-from-left-1 duration-200">
                              <div className="flex items-center gap-2 min-w-0">
                                <IconCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight truncate">{fileName}</span>
                              </div>
                              <button 
                                onClick={() => removeDocument(index)}
                                className="w-6 h-6 flex items-center justify-center text-emerald-400 hover:text-rose-500 transition-colors"
                              >
                                <IconTrash className="w-3 h-3" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Identifier</label>
                  <Input 
                    type="text" 
                    placeholder="REQUIRED FOR FINANCE"
                    value={invoiceNumber} 
                    onChange={(e) => setInvoiceNumber(e.target.value)} 
                    className="rounded-lg border-slate-200 h-10 font-bold text-xs placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Registry */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-blue-400">
                    <IconPackage className="w-4 h-4" />
                  </div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">ITEMIZED SUPPLY LOG</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      const newItems = items.map(item => {
                        const remaining = Math.max(0, item.quantity_ordered - item.quantity_previously_received)
                        return {
                          ...item,
                          quantity_received: remaining,
                          quantity_accepted: remaining,
                          quantity_rejected: 0,
                          batches: item.batches.length > 0 ? [{ ...item.batches[0], quantity: remaining }] : [{ batch_number: '', manufacturing_date: '', expiry_date: '', quantity: remaining }],
                          arrived: true
                        }
                      })
                      setItems(newItems)
                    }}
                    className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-[9px] font-black text-slate-350 hover:text-white rounded uppercase tracking-tighter hover:bg-slate-700 transition-all active:scale-95"
                  >
                    Select All
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const newItems = items.map(item => ({
                        ...item,
                        quantity_received: 0,
                        quantity_accepted: 0,
                        quantity_rejected: 0,
                        batches: item.batches.map(b => ({ ...b, quantity: 0 })),
                        arrived: false
                      }))
                      setItems(newItems)
                    }}
                    className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-[9px] font-black text-slate-350 hover:text-white rounded uppercase tracking-tighter hover:bg-slate-700 transition-all active:scale-95"
                  >
                    Clear All
                  </button>
                  <div className="px-3 py-1 bg-slate-800 text-[9px] font-black text-slate-400 rounded uppercase tracking-widest">
                    {items.length} LINE ENTRIES
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const remaining = Math.max(0, item.quantity_ordered - item.quantity_previously_received)
                  const isArrived = item.arrived !== false
                  
                  return (
                    <div 
                      key={item.po_item_id} 
                      className={cn(
                        "p-6 hover:bg-slate-50/50 transition-all duration-300",
                        !isArrived && "bg-slate-50/70 opacity-60 hover:bg-slate-50/70"
                      )}
                    >
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-1/3 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="pt-0.5">
                              <input 
                                type="checkbox"
                                id={`arrived-${item.po_item_id}`}
                                checked={isArrived && remaining > 0}
                                disabled={remaining === 0}
                                onChange={(e) => handleItemChange(idx, 'arrived', e.target.checked)}
                                className="disabled:opacity-40 disabled:cursor-not-allowed w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer accent-indigo-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">SKU DESCRIPTION</p>
                                <span className={cn(
                                  "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider leading-none border transition-all",
                                  remaining === 0
                                    ? "bg-slate-100 text-slate-400 border-slate-200"
                                    : isArrived 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : "bg-slate-200 text-slate-500 border-slate-300"
                                )}>
                                  {remaining === 0 ? "Fully Received" : isArrived ? "Arrived" : "Not Arrived"}
                                </span>
                              </div>
                              <h4 
                                className={cn(
                                  "text-sm font-black text-slate-900 leading-tight uppercase italic select-none",
                                  remaining > 0 ? "cursor-pointer" : "cursor-default opacity-50"
                                )}
                                onClick={() => remaining > 0 && handleItemChange(idx, 'arrived', !isArrived)}
                              >
                                {item.item_name}
                              </h4>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pl-9">
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">TOTAL ORDER</p>
                              <p className="text-sm font-black text-slate-900">{item.quantity_ordered}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                              <p className="text-[9px] font-black text-blue-400 uppercase mb-1">PENDING</p>
                              <p className="text-sm font-black text-blue-700">{remaining}</p>
                            </div>
                          </div>
                        </div>

                        {isArrived && remaining > 0 ? (
                          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Rec. Qty</label>
                              <Input 
                                type="number" 
                                min="0"
                                value={item.quantity_received} 
                                onChange={(e) => handleItemChange(idx, 'quantity_received', parseInt(e.target.value, 10))} 
                                className="rounded-lg h-10 font-black text-center text-base"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-rose-500">Rej. Qty</label>
                              <Input 
                                type="number" 
                                min="0"
                                value={item.quantity_rejected} 
                                onChange={(e) => handleItemChange(idx, 'quantity_rejected', parseInt(e.target.value, 10))} 
                                className="rounded-lg h-10 font-black text-center text-base text-rose-600 border-rose-200 bg-rose-50/30"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-500">Accepted</label>
                              <div className="h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-base font-black shadow-lg shadow-emerald-500/20">
                                {item.quantity_accepted}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="lg:w-2/3 flex items-center justify-center bg-slate-100/50 border border-dashed border-slate-200 rounded-xl p-6 select-none animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-center space-y-1">
                              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                {remaining === 0 ? "Fulfillment Complete" : "Item Excluded"}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                {remaining === 0 
                                  ? "This item has already been fully received in a previous shipment." 
                                  : 'This item is marked as "Not Arrived" and will not be recorded in this goods receipt.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Batches & Expiry (Desktop Registry Layout) */}
                      {isArrived && (
                        <div className="mt-8 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-3 bg-slate-900 rounded-full" />
                              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">BATCH VERIFICATION LOG</p>
                            </div>
                            <button onClick={() => handleAddBatch(idx)} className="text-[9px] font-black text-white bg-slate-900 px-3 py-1 rounded uppercase tracking-tighter hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-sm animate-in fade-in">
                              <IconPlus className="w-3 h-3" /> ADD ENTRY
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {item.batches.map((batch, bIdx) => (
                              <div key={bIdx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-lg border border-slate-200/60 group hover:bg-white hover:border-slate-400 transition-all">
                                <div className="md:col-span-3">
                                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Batch Registry #</label>
                                  <Input value={batch.batch_number} onChange={(e) => handleBatchChange(idx, bIdx, 'batch_number', e.target.value)} className="h-9 text-xs font-bold uppercase rounded border-slate-200" />
                                </div>
                                <div className="md:col-span-3">
                                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Mfg Date</label>
                                  <Input type="date" value={batch.manufacturing_date || ''} onChange={(e) => handleBatchChange(idx, bIdx, 'manufacturing_date', e.target.value)} className="h-9 text-xs font-bold rounded border-slate-200" />
                                </div>
                                <div className="md:col-span-3">
                                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Expiry Date *</label>
                                  <Input type="date" value={batch.expiry_date} onChange={(e) => handleBatchChange(idx, bIdx, 'expiry_date', e.target.value)} className="h-9 text-xs font-bold rounded border-slate-200" />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Registry Qty</label>
                                  <Input type="number" value={batch.quantity || ''} onChange={(e) => handleBatchChange(idx, bIdx, 'quantity', e.target.value)} className="h-9 text-xs font-black text-center rounded border-slate-200" />
                                </div>
                                <div className="md:col-span-1 flex justify-center pb-1">
                                  <button onClick={() => handleRemoveBatch(idx, bIdx)} disabled={item.batches.length === 1} className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all">
                                    <IconTrash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Credit Note Registry */}
                          <div className={cn(
                            "mt-4 p-5 rounded-lg border transition-all",
                            item.mark_remaining_as_credit_note ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100"
                          )}>
                            <div className="flex items-center gap-4">
                              <input 
                                type="checkbox"
                                checked={item.mark_remaining_as_credit_note || false}
                                onChange={(e) => handleItemChange(idx, 'mark_remaining_as_credit_note', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                              />
                              <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic cursor-pointer">ISSUE CREDIT NOTE FOR REMAINING DEFICIT</label>
                            </div>
                            {item.mark_remaining_as_credit_note && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pl-8 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                  <label className="block text-[9px] font-black text-amber-600 uppercase tracking-widest">DEFICIT QUANTITY</label>
                                  <Input type="number" value={item.credit_note_quantity || ''} onChange={(e) => handleItemChange(idx, 'credit_note_quantity', parseInt(e.target.value, 10))} className="h-11 border-amber-200 bg-white font-black" />
                                </div>
                                <div className="space-y-2">
                                  <label className="block text-[9px] font-black text-amber-600 uppercase tracking-widest">FORMAL REASON</label>
                                  <Input type="text" placeholder="REQUIRED FOR CREDIT NOTE" value={item.credit_note_reason || ''} onChange={(e) => handleItemChange(idx, 'credit_note_reason', e.target.value)} className="h-11 border-amber-200 bg-white font-bold" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-4 bg-slate-900 rounded-full" />
                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest">AUDIT COMMENTS & REMARKS</label>
              </div>
              <textarea 
                className="w-full min-h-[120px] p-6 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold placeholder:text-slate-300 focus:bg-white focus:border-slate-900 transition-all outline-none"
                placeholder="ANY ADDITIONAL AUDIT INFORMATION SHOULD BE LOGGED HERE..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            </>
            )}

            {/* Registry History - Professional High Contrast Table Style */}
            {history.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconHistory className="w-4 h-4 text-white/50" />
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">FORMAL INTAKE REGISTRY</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest italic">SECURE AUDIT TRAIL ACTIVE</span>
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registry ID</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date Authorized</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Intake Description</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Authorized By</th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Value (RM)</th>
                        <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Penilaian Prestasi</th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((gr) => {
                        const totalValue = gr.items?.reduce((sum: number, item: any) => sum + ((item.quantity_accepted || 0) * (item.po_item?.unit_price || 0)), 0) || 0;
                        const assessment = assessments.find(a => a.goods_receipt_id === gr.id) || 
                          (history.length === 1 ? assessments[0] : null);
                        return (
                          <React.Fragment key={gr.id}>
                            <tr className="hover:bg-slate-50/50 transition-all border-b border-slate-100 last:border-0 group">
                              <td className="px-6 py-5 align-top">
                                <div className="space-y-1">
                                  <p className="text-[13px] font-bold text-indigo-600 leading-tight">{gr.gr_number}</p>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">DO NO: {gr.delivery_note_number || 'N/A'}</p>
                                  {(gr.document_urls && gr.document_urls.length > 0) || gr.document_url ? (
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                      {(gr.document_urls || (gr.document_url ? [gr.document_url] : [])).map((url, i) => (
                                        <a 
                                          key={i}
                                          href={url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-tighter"
                                        >
                                          <IconFileText className="w-2.5 h-2.5" />
                                          DO {i + 1}
                                        </a>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              </td>
                              <td className="px-6 py-5 align-top">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <IconClock className="w-3.5 h-3.5 text-slate-300" />
                                  <span className="text-[12px] font-medium">{formatDateTime(gr.receipt_date).date}</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 align-top">
                                <div className="flex flex-col divide-y divide-slate-100 min-w-[300px]">
                                  {gr.items?.map((item: any) => (
                                    <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                                      <div className="flex items-center justify-between gap-4">
                                        <p className="text-[12px] font-semibold text-slate-900 leading-tight">
                                          {item.po_item?.item_name}
                                        </p>
                                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded whitespace-nowrap">
                                          {item.quantity_accepted} {item.po_item?.packaging_description || 'Units'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-medium">
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] text-slate-300 uppercase font-bold tracking-tighter">BATCH</span>
                                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.batch_number || 'N/A'}</span>
                                        </div>
                                        <div className="w-px h-3 bg-slate-200" />
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] text-slate-300 uppercase font-bold tracking-tighter">EXP</span>
                                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase() : 'N/A'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-5 align-top">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 uppercase">
                                      {gr.received_by_user?.full_name?.charAt(0) || 'S'}
                                    </div>
                                    <span className="text-[12px] font-semibold text-slate-700">{gr.received_by_user?.full_name || 'System User'}</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-9">Authorized Officer</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 align-top text-right">
                                <div className="flex flex-col items-end">
                                  <span className="text-[14px] font-bold text-slate-900 tracking-tight">
                                    RM {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Audit Value</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 align-top text-center">
                                {assessment ? (
                                  <div className="flex flex-col items-center">
                                    <span className={cn(
                                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                                      assessment.percentage >= 80 ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                      assessment.percentage >= 60 ? "bg-amber-50 border-amber-200 text-amber-700" :
                                      "bg-rose-50 border-rose-200 text-rose-700"
                                    )}>
                                      {assessment.performance_level}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 mt-1">
                                      Skor: {assessment.total_score}/15 ({assessment.percentage}%)
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSelectedGrForAssessment(gr);
                                        setIsAssessmentOpen(true);
                                      }}
                                      className="text-[9px] font-black text-indigo-600 hover:text-indigo-900 uppercase tracking-widest mt-1.5 hover:underline"
                                    >
                                      Lihat Penilaian
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-center">
                                    <button
                                      onClick={() => {
                                        setSelectedGrForAssessment(gr);
                                        setIsAssessmentOpen(true);
                                      }}
                                      className="h-9 px-4 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5 uppercase tracking-wider"
                                    >
                                      <Star className="w-3.5 h-3.5 fill-indigo-200 stroke-indigo-600 group-hover:fill-white" />
                                      Nilai Prestasi
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-5 align-top">
                                <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedGrForMod(gr);
                                        setIsModifying(true);
                                      }}
                                      className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11px] font-bold hover:border-slate-900 hover:text-slate-900 transition-all flex items-center gap-2"
                                    >
                                      <IconEdit className="w-3.5 h-3.5" />
                                      Modify
                                    </button>
                                  <button
                                    onClick={() => handleDeleteHistory(gr.id)}
                                    className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  >
                                    <IconTrash className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* Modification Modal */}
        <ModificationModal 
          isOpen={isModifying}
          gr={selectedGrForMod}
          onClose={() => setIsModifying(false)}
          onSuccess={() => {
            setIsModifying(false);
            void loadPo();
          }}
        />

        {/* Supplier Assessment Modal */}
        <SupplierAssessmentModal 
          isOpen={isAssessmentOpen}
          po={po}
          goodsReceipt={selectedGrForAssessment}
          history={history}
          onClose={() => {
            setIsAssessmentOpen(false);
            setSelectedGrForAssessment(null);
          }}
          onSuccess={async () => {
            setIsAssessmentOpen(false);
            setSelectedGrForAssessment(null);
            void loadPo();
            onSuccess();
          }}
        />
      </div>

      {/* Footer Actions */}
      {po && po.status !== 'completed' && (
        <div className="px-10 py-8 border-t border-slate-200 bg-white sticky bottom-0 z-30 shadow-[0_-20px_40px_rgba(0,0,0,0.03)] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400">
              <IconShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">REGISTRY STATUS</p>
              <p className="text-xs font-black text-slate-900 uppercase italic mt-1.5">AWAITING AUTHORIZATION</p>
            </div>
          </div>
          <div className="flex gap-4">
            {!isEmbedded && (
              <button 
                onClick={onClose}
                className="px-8 py-4 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all"
              >
                DISCARD
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-12 py-4 bg-slate-900 text-white rounded-lg font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-3"
            >
              {isSubmitting ? <Spinner size="sm" className="border-t-white" /> : <IconShieldCheck className="w-4 h-4 text-emerald-400" />}
              AUTHORIZE INTAKE
            </button>
          </div>
        </div>
        )}
      </div>
    );

  if (isEmbedded) return formContent

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-7xl bg-white shadow-2xl z-50 border-l border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
        {formContent}
      </div>
    </>
  )
}

/**
 * Modification Modal for Goods Receipt Corrections
 */
function ModificationModal({ isOpen, gr, onClose, onSuccess }: { isOpen: boolean, gr: any, onClose: () => void, onSuccess: () => void }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [receiptDate, setReceiptDate] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [modifyingItems, setModifyingItems] = useState<any[]>([]);
  const [modificationReason, setModificationReason] = useState('');

  useEffect(() => {
    if (gr) {
      setReceiptDate(gr.receipt_date || new Date().toISOString().split('T')[0]);
      setDeliveryNote(gr.delivery_note_number || '');
      invoiceNumber === undefined && setInvoiceNumber(gr.invoice_number || '');
      setInvoiceNumber(gr.invoice_number || '');
      setNotes(gr.notes || '');
      setDocumentUrls(gr.document_urls || (gr.document_url ? [gr.document_url] : []));
      setModifyingItems(gr.items ? JSON.parse(JSON.stringify(gr.items)) : []);
      setModificationReason('');
    }
  }, [gr]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newUrls = [...documentUrls]
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const path = `delivery-orders/modification/${Date.now()}_${file.name}`
        const { url, error: uploadError } = await uploadFile('lpo-documents', path, file)

        if (uploadError) throw new Error(uploadError)
        if (url) newUrls.push(url)
      }
      setDocumentUrls(newUrls);
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err.message || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (index: number) => {
    setDocumentUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!modificationReason) {
      setError('Modification reason is mandatory for audit compliance');
      return;
    }

    if (!deliveryNote.trim()) {
      setError("Delivery Order No. (DO) is required.");
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const { error: updateError } = await updateGoodsReceipt(gr.id, {
        delivery_note_number: deliveryNote,
        invoice_number: invoiceNumber,
        notes,
        receipt_date: receiptDate,
        document_urls: documentUrls,
        modification_reason: modificationReason,
        items: modifyingItems
      });

      if (updateError) throw updateError;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update registry');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modify Goods Receipt Registry"
      size="5xl"
    >
      <div className="space-y-8 p-1">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            <IconAlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corrected Receipt Date</label>
            <Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} className="h-11 font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Order No. (DO) *</label>
            <Input placeholder="MANDATORY" value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} className="h-11 font-bold uppercase placeholder:text-rose-300" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</label>
            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="h-11 font-bold uppercase" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Order Documents</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="mod-file-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="mod-file-upload"
                className={cn(
                  "flex items-center gap-3 w-full h-12 px-4 border-2 border-dashed rounded-xl text-[11px] font-black transition-all cursor-pointer uppercase tracking-widest",
                  "border-slate-200 bg-slate-50 text-slate-500 hover:border-indigo-400 hover:bg-indigo-50",
                  isUploading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isUploading ? <Spinner size="sm" /> : <IconPlus className="w-4 h-4" />}
                <span>{isUploading ? 'UPLOADING...' : 'Add Documents'}</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {documentUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg group">
                  <IconFileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[9px] font-black text-indigo-700 uppercase truncate max-w-[120px]">
                    {url.split('/').pop()?.split('_').slice(1).join('_') || `DOC-${idx + 1}`}
                  </span>
                  <button onClick={() => removeDocument(idx)} className="text-indigo-300 hover:text-rose-500 transition-colors">
                    <IconTrash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <IconPackage className="w-4 h-4 text-indigo-500" />
            Registry Item Correction
          </h4>
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Detail</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Batch No</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {modifyingItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-[13px] font-bold text-slate-900 leading-tight">{item.po_item?.item_name}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-tighter">{item.po_item?.item_code}</p>
                    </td>
                    <td className="px-4 py-4 w-28">
                      <Input 
                        type="number" 
                        value={item.quantity_accepted} 
                        onChange={(e) => {
                          const newItems = [...modifyingItems];
                          newItems[idx].quantity_accepted = parseFloat(e.target.value);
                          setModifyingItems(newItems);
                        }}
                        className="h-9 text-sm font-black text-center"
                      />
                    </td>
                    <td className="px-4 py-4 w-40">
                      <Input 
                        value={item.batch_number} 
                        onChange={(e) => {
                          const newItems = [...modifyingItems];
                          newItems[idx].batch_number = e.target.value;
                          setModifyingItems(newItems);
                        }}
                        className="h-9 text-sm font-mono text-center uppercase"
                      />
                    </td>
                    <td className="px-6 py-4 w-48">
                      <Input 
                        type="date"
                        value={item.expiry_date} 
                        onChange={(e) => {
                          const newItems = [...modifyingItems];
                          newItems[idx].expiry_date = e.target.value;
                          setModifyingItems(newItems);
                        }}
                        className="h-9 text-sm font-medium"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Modification Justification</label>
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse">* Mandatory for Audit Compliance</span>
          </div>
          <Textarea 
            value={modificationReason}
            onChange={(e) => setModificationReason(e.target.value)}
            placeholder="Describe exactly why this change is being made (e.g., 'Corrected batch number typo from DO document verification')..."
            className="min-h-[100px] text-sm font-medium border-slate-200 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
        </div>

        <div className="flex gap-4 pt-6">
          <button
            onClick={onClose}
            className="flex-1 h-12 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating || !modificationReason}
            className="flex-[2] h-12 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.25em] shadow-xl shadow-slate-900/20 hover:bg-black hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 transition-all flex items-center justify-center gap-3"
          >
            {isUpdating ? <Spinner size="sm" className="border-t-white" /> : <IconShieldCheck className="w-4 h-4 text-emerald-400" />}
            Commit Modification
          </button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Supplier Performance Assessment Modal (Penilaian Prestasi Pembekal)
 */
function SupplierAssessmentModal({
  isOpen,
  po,
  goodsReceipt,
  history = [],
  onClose,
  onSuccess
}: {
  isOpen: boolean
  po: any
  goodsReceipt?: any
  history?: any[]
  onClose: () => void
  onSuccess: () => void
}) {
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Rating states
  const [quality, setQuality] = useState(0)
  const [support, setSupport] = useState(0)
  const [delivery, setDelivery] = useState(0)
  const [comments, setComments] = useState('')

  // Hover states for nice micro-interactions
  const [hoverQuality, setHoverQuality] = useState(0)
  const [hoverSupport, setHoverSupport] = useState(0)
  const [hoverDelivery, setHoverDelivery] = useState(0)

  // Auto-reset or load existing assessment when modal opens
  useEffect(() => {
    const loadExisting = async () => {
      if (isOpen) {
        setQuality(0)
        setSupport(0)
        setDelivery(0)
        setComments('')
        setError(null)

        if (goodsReceipt?.id) {
          const { data } = await supabase
            .from('pharmacy_supplier_assessments')
            .select('*')
            .eq('goods_receipt_id', goodsReceipt.id)
            .maybeSingle()
          if (data) {
            setQuality(data.ratings?.quality || 0)
            setSupport(data.ratings?.support || 0)
            setDelivery(data.ratings?.delivery || 0)
            setComments(data.comments || '')
          }
        }
      }
    }
    void loadExisting()
  }, [isOpen, goodsReceipt])

  const totalScore = quality + support + delivery
  const percentage = Math.round((totalScore / 15) * 100)

  // Performance level mapping
  let performanceLevel = 'Tidak Memuaskan'
  let badgeColor = 'bg-rose-50 border-rose-200 text-rose-700'
  
  if (percentage >= 80) {
    performanceLevel = 'Sangat Memuaskan'
    badgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-700'
  } else if (percentage >= 60) {
    performanceLevel = 'Memuaskan'
    badgeColor = 'bg-amber-50 border-amber-200 text-amber-700'
  }

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 1: return 'Sangat Lemah'
      case 2: return 'Lemah'
      case 3: return 'Sederhana'
      case 4: return 'Baik'
      case 5: return 'Cemerlang'
      default: return 'Belum Dinilai'
    }
  }

  const handleSaveAssessment = async () => {
    if (quality === 0 || support === 0 || delivery === 0) {
      setError('Sila lengkapkan semua kriteria penilaian sebelum menghantar.')
      return
    }

    const lpoId = po?.lpo?.[0]?.id
    if (!lpoId) {
      setError('LPO ID tidak dijumpai.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 1. Check if assessment already exists for this Goods Receipt
      let existingAssessment = null;
      if (goodsReceipt?.id) {
        const { data } = await supabase
          .from('pharmacy_supplier_assessments')
          .select('id')
          .eq('goods_receipt_id', goodsReceipt.id)
          .maybeSingle();
        existingAssessment = data;
      }

      let assessmentRes;
      if (existingAssessment?.id) {
        // Update existing assessment
        assessmentRes = await supabase
          .from('pharmacy_supplier_assessments')
          .update({
            ratings: { quality, support, delivery },
            total_score: totalScore,
            percentage,
            performance_level: performanceLevel,
            comments,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAssessment.id)
          .select();
      } else {
        // Create Supplier Assessment in DB
        assessmentRes = await createSupplierAssessment({
          lpo_id: lpoId,
          goods_receipt_id: goodsReceipt?.id,
          ratings: {
            quality,
            support,
            delivery
          },
          total_score: totalScore,
          percentage,
          performance_level: performanceLevel,
          comments,
          assessed_by: user?.id
        })
      }

      if (assessmentRes.error) {
        throw new Error(typeof assessmentRes.error === 'object' ? (assessmentRes.error as any).message : String(assessmentRes.error))
      }

      // The LPO status will be explicitly updated to 'sent_for_payment' when the user clicks the now-enabled 'Proceed to payment' button.

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan penilaian.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const supplierName = po?.manual_supplier_name || po?.supplier?.[0]?.company_name || po?.supplier?.company_name || 'Generic Supplier'
  const poNumber = po?.po_number || 'N/A'
  const lpoNumber = po?.lpo?.[0]?.lpo_number || 'N/A'
  
  const grValue = goodsReceipt?.items?.reduce((sum: number, item: any) => sum + ((item.quantity_accepted || 0) * (item.po_item?.unit_price || 0)), 0) || 0
  const orderValue = grValue > 0 ? grValue : (po?.total_amount || 0)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Penilaian Prestasi Pembekal"
      size="3xl"
    >
      <div className="space-y-6 p-1">
        {/* Intro Info Banner */}
        <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
          <div className="relative flex justify-between gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">PEMBEKAL YANG DINILAI</p>
              <h3 className="text-lg font-black text-white mt-1.5 leading-tight">{supplierName}</h3>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] font-medium text-slate-300">
                <span>Rujukan PO: <strong className="text-white font-bold">{poNumber}</strong></span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span>No LPO: <strong className="text-indigo-400 font-bold">{lpoNumber}</strong></span>
                {goodsReceipt && (
                  <>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span>No DO: <strong className="text-emerald-400 font-bold">{goodsReceipt.delivery_note_number || goodsReceipt.gr_number}</strong></span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {goodsReceipt ? 'NILAI HANTARAN (DO)' : 'NILAI PESANAN'}
              </p>
              <p className="text-xl font-black text-white mt-1.5">
                RM {orderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Rating Criteria */}
        <div className="space-y-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Kriteria Penilaian Prestasi</h4>
          
          {/* Criteria 1: Quality */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h5 className="text-[13px] font-bold text-slate-900 leading-tight">1. Kualiti Bekalan / Perkhidmatan</h5>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Ketepatan spesifikasi produk, pembungkusan berkualiti, tiada kerosakan.</p>
              </div>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded transition-all uppercase tracking-wider shrink-0",
                quality > 0 ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-400"
              )}>
                {getRatingLabel(quality)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 pt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setQuality(star)}
                  onMouseEnter={() => setHoverQuality(star)}
                  onMouseLeave={() => setHoverQuality(0)}
                  className="p-1 hover:scale-110 active:scale-95 transition-all text-slate-200"
                >
                  <Star
                    className={cn(
                      "w-7 h-7 stroke-2 transition-all",
                      (hoverQuality || quality) >= star
                        ? "fill-amber-400 stroke-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]"
                        : "stroke-slate-300"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Criteria 2: Support */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h5 className="text-[13px] font-bold text-slate-900 leading-tight">2. Sokongan Pelanggan</h5>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Responsif terhadap pertanyaan, khidmat selepas jualan, kelancaran dokumen.</p>
              </div>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded transition-all uppercase tracking-wider shrink-0",
                support > 0 ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-400"
              )}>
                {getRatingLabel(support)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 pt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSupport(star)}
                  onMouseEnter={() => setHoverSupport(star)}
                  onMouseLeave={() => setHoverSupport(0)}
                  className="p-1 hover:scale-110 active:scale-95 transition-all text-slate-200"
                >
                  <Star
                    className={cn(
                      "w-7 h-7 stroke-2 transition-all",
                      (hoverSupport || support) >= star
                        ? "fill-amber-400 stroke-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]"
                        : "stroke-slate-300"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Criteria 3: Delivery */}
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h5 className="text-[13px] font-bold text-slate-900 leading-tight">3. Tempoh Penghantaran</h5>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Ketepatan masa penghantaran berbanding tarikh jangkaan yang dipersetujui.</p>
              </div>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded transition-all uppercase tracking-wider shrink-0",
                delivery > 0 ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-400"
              )}>
                {getRatingLabel(delivery)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 pt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setDelivery(star)}
                  onMouseEnter={() => setHoverDelivery(star)}
                  onMouseLeave={() => setHoverDelivery(0)}
                  className="p-1 hover:scale-110 active:scale-95 transition-all text-slate-200"
                >
                  <Star
                    className={cn(
                      "w-7 h-7 stroke-2 transition-all",
                      (hoverDelivery || delivery) >= star
                        ? "fill-amber-400 stroke-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]"
                        : "stroke-slate-300"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-2">
            <h5 className="text-[13px] font-bold text-slate-900 leading-tight mb-2">Ulasan / Komen (Pilihan)</h5>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Sila masukkan sebarang ulasan mengenai pembekal ini jika ada..."
              className="w-full min-h-[80px] p-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>

        {/* Live Calculation Summary */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2.5 w-full md:w-auto">
            <div className="flex items-center justify-between md:justify-start gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">JUMLAH SKOR</span>
              <span className="text-base font-black text-slate-900">{totalScore} <span className="text-xs text-slate-400 font-normal">/ 15</span></span>
            </div>
            <div className="flex items-center justify-between md:justify-start gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PERATUSAN</span>
              <span className="text-base font-black text-slate-900">{percentage}%</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white px-5 py-4 border border-slate-200 rounded-xl w-full md:w-auto shadow-sm">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">TAHAP PRESTASI</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn(
                  "px-3 py-1 border rounded-lg text-xs font-black uppercase tracking-wider",
                  badgeColor
                )}>
                  {quality > 0 && support > 0 && delivery > 0 ? performanceLevel : 'Belum Dinilai'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveAssessment}
            disabled={isSubmitting || quality === 0 || support === 0 || delivery === 0}
            className="flex-[2] h-12 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.25em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 transition-all flex items-center justify-center gap-3"
          >
            {isSubmitting ? <Spinner size="sm" className="border-t-white" /> : <IconShieldCheck className="w-4 h-4 text-emerald-400" />}
            Hantar Penilaian & Proses Bayaran
          </button>
        </div>
      </div>
    </Modal>
  )
}

