import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  IconShoppingCart, 
  IconPlus, 
  IconCheck, 
  IconFileSearch, 
  IconFilePen,
  IconX,
  IconPrinter,
  IconSave,
  IconAlertCircle,
  IconCalculator,
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconSend,
  IconCheckCircle,
  IconSettings
} from '@/components/ui/Icons'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Spinner, Badge, ConfirmationDialog, Modal, Input } from '@/components/ui'
import { 
  getPurchaseOrderById, 
  rejectPurchaseOrder, 
  deletePurchaseOrder, 
  submitPurchaseOrder, 
  approvePurchaseOrder, 
  sendPurchaseOrder 
} from '@/services/pharmacy/procurementService'
import { supabase } from '@/services/supabase'
import { getWarrants } from '@/services/pharmacy/warrantService'
import { getPharmacyPOSignatures, updatePharmacyPOSignatures, type PharmacyPOSignatures } from '@/services/pharmacy/pharmacySettingsService'
import { mergePOWithSupplierDocs, openPdfForPrint, cleanupPdfUrl } from '@/services/pharmacy/pdfMergeService'
import type { PurchaseOrderWithRelations, PurchaseOrderItem } from '@/types/pharmacy'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface PurchaseOrderDetailViewProps {
  id?: string
  onClose?: () => void
  isSlideOver?: boolean
}

export const PurchaseOrderDetailView: React.FC<PurchaseOrderDetailViewProps> = ({ id, onClose, isSlideOver }) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  const hospitalId = user?.hospital_id

  const [order, setOrder] = useState<PurchaseOrderWithRelations | null>(null)
  const [items, setItems] = useState<Array<PurchaseOrderItem & { item_name?: string; item_code?: string; packaging_description?: string }>>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Action Dialog States
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  
  const [isPrinting, setIsPrinting] = useState(false)
  const printContentRef = useRef<HTMLDivElement>(null)
  
  const [signatures, setSignatures] = useState<PharmacyPOSignatures>({
    applicantName: 'KAMRIAH BINTI MAIL',
    applicantPosition: 'PEN. PEGAWAI FARMASI U 6',
    headName: 'TAN YUAN ZHANG',
    headPosition: 'PEGAWAI FARMASI UF 32',
  })
  const [tempSignatures, setTempSignatures] = useState<PharmacyPOSignatures>(signatures)

  // Load signature settings
  useEffect(() => {
    if (!hospitalId) return

    const loadSignatures = async () => {
      const result = await getPharmacyPOSignatures(hospitalId)
      if (result.data) {
        setSignatures(result.data)
        setTempSignatures(result.data)
      }
    }

    void loadSignatures()
  }, [hospitalId])

  const loadOrder = async () => {
    if (!id || !hospitalId) return
    setIsLoading(true)
    try {
      const result = await getPurchaseOrderById(id)
      if (result.error) {
        showError('Error', result.error)
        if (!isSlideOver) {
          navigate(ROUTES.PHARMACY_PO)
        } else if (onClose) {
          onClose()
        }
        return
      }

      if (result.data) {
        setOrder(result.data)
        
        // Load balance from warrants
        if (result.data.vote_code && result.data.vote_activity) {
          try {
            const currentYear = new Date().getFullYear()
            const warrantsResult = await getWarrants(hospitalId, {
              startDate: `${currentYear}-01-01`,
              endDate: `${currentYear}-12-31`,
              voteCode: result.data.vote_code as any,
            })
            
            if (warrantsResult.data) {
              const matchingWarrants = warrantsResult.data.filter(
                (w) => w.vote_activity === result.data!.vote_activity
              )
              const totalAllocation = matchingWarrants.reduce((sum, w) => sum + Number(w.amount), 0)
              const poAmount = result.data!.total_amount || 0
              const calculatedBalance = totalAllocation - Number(poAmount)
              setBalance(Math.max(0, calculatedBalance))
            }
          } catch (error) {
            console.error('Error loading balance:', error)
          }
        }
        
        setItems(result.data.items || [])
      }
    } catch (error) {
      console.error('Error loading purchase order:', error)
      showError('Error', 'Failed to load purchase order')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadOrder()
  }, [id, hospitalId])

  const handleOpenSettings = () => {
    setTempSignatures(signatures)
    setShowSettingsModal(true)
  }

  const handleSaveSettings = async () => {
    if (!hospitalId || !user?.id) return

    setIsSavingSettings(true)
    try {
      const result = await updatePharmacyPOSignatures(tempSignatures, hospitalId, user.id)
      if (result.data) {
        setSignatures(result.data)
        setShowSettingsModal(false)
        showSuccess('Settings Updated', 'Signature settings have been saved successfully.')
      } else {
        showError('Error', result.error || 'Failed to save settings')
      }
    } catch (error) {
      showError('Error', 'Failed to save settings')
      console.error('Error saving settings:', error)
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Action Handlers
  const handleConfirmCancel = async () => {
    if (!order || !user?.id) return
    setIsCancelling(true)
    try {
      const res = await rejectPurchaseOrder(order.id, user.id, cancelReason)
      if (res.error) throw new Error(res.error)
      showSuccess('PO Cancelled', 'The purchase order has been cancelled.')
      setShowCancelDialog(false)
      void loadOrder()
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to cancel PO')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!order || !user?.id) return
    setIsDeleting(true)
    try {
      const res = await deletePurchaseOrder(order.id, user.id)
      if (res.error) throw new Error(res.error)
      showSuccess('PO Deleted', 'The purchase order has been deleted.')
      setShowDeleteDialog(false)
      if (isSlideOver && onClose) {
        onClose()
      } else {
        navigate(ROUTES.PHARMACY_PO)
      }
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to delete PO')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleConfirmSubmit = async () => {
    if (!order) return
    setIsSubmitting(true)
    try {
      const res = await submitPurchaseOrder(order.id)
      if (res.error) throw new Error(res.error)
      showSuccess('PO Submitted', 'The purchase order has been submitted for approval.')
      setShowSubmitDialog(false)
      void loadOrder()
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to submit PO')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmApprove = async () => {
    if (!order || !user?.id) return
    setIsApproving(true)
    try {
      const res = await approvePurchaseOrder(order.id, user.id)
      if (res.error) throw new Error(res.error)
      showSuccess('PO Approved', 'The purchase order has been approved.')
      setShowApproveDialog(false)
      void loadOrder()
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to approve PO')
    } finally {
      setIsApproving(false)
    }
  }

  const handleConfirmSend = async () => {
    if (!order) return
    setIsSending(true)
    try {
      const res = await sendPurchaseOrder(order.id)
      if (res.error) throw new Error(res.error)
      showSuccess('PO Sent', 'The purchase order has been sent to the supplier.')
      setShowSendDialog(false)
      void loadOrder()
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to send PO')
    } finally {
      setIsSending(false)
    }
  }

  const handlePrint = async () => {
    if (!order || !printContentRef.current) {
      showError('Error', 'Unable to print. Please try again.')
      return
    }

    const hasSupplierDocs = order.supplier?.account_document_url || order.supplier?.mof_certificate_url

    if (!hasSupplierDocs) {
      window.print()
      return
    }

    setIsPrinting(true)
    try {
      const printForm = printContentRef.current
      const result = await mergePOWithSupplierDocs({
        poElement: printForm,
        accountDocumentUrl: order.supplier?.account_document_url,
        mofCertificateUrl: order.supplier?.mof_certificate_url,
        poNumber: order.po_number,
      })

      if (result.success && result.pdfUrl) {
        openPdfForPrint(result.pdfUrl)
        setTimeout(() => {
          if (result.pdfUrl) {
            cleanupPdfUrl(result.pdfUrl)
          }
        }, 60000)
        showSuccess('PDF Generated', 'Merged PDF opened in new window.')
      } else {
        showError('Print Error', result.error || 'Failed to generate merged PDF')
        window.print()
      }
    } catch (error) {
      console.error('Error generating merged PDF:', error)
      showError('Print Error', 'Failed to generate merged PDF. Using simple print.')
      window.print()
    } finally {
      setIsPrinting(false)
    }
  }

  const handleEdit = () => {
    if (!order) return
    navigate(ROUTES.PHARMACY_PO_CREATE, {
      state: { mode: 'edit', poId: order.id },
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).toUpperCase()
  }

  const renderStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'gray' | 'primary'; label: string }> = {
      draft: { color: 'gray', label: 'Draft' },
      pending_approval: { color: 'warning', label: 'Pending Approval' },
      approved: { color: 'success', label: 'Approved' },
      sent: { color: 'info', label: 'Sent' },
      partial_received: { color: 'warning', label: 'Partial Received' },
      completed: { color: 'success', label: 'Completed' },
      cancelled: { color: 'error', label: 'Cancelled' },
    }
    const statusInfo = statusMap[status] || { color: 'gray', label: status }
    return <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>
  }

  // --- High-Fidelity Render Helpers ---

  const renderWatermark = () => (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] overflow-hidden">
      <img
        src="/512px-Jata_MalaysiaV2.svg.png"
        alt="Watermark"
        className="w-[450px] h-[450px] object-contain rotate-[-15deg]"
      />
    </div>
  )

  const renderPage1Content = () => (
    <div className="page bg-white border-2 border-gray-800 relative" style={{ fontFamily: "'Times New Roman', serif", width: '210mm', minHeight: '297mm', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box', padding: '0 0 270px 0' }}>
      {renderWatermark()}
      {/* Government Document Header */}
      <div className="border-b-2 border-gray-800 bg-white py-2 px-8">
        <div className="flex items-center justify-between gap-6 mb-2">
          <div className="flex-shrink-0">
            <img
              src="/512px-Jata_MalaysiaV2.svg.png"
              alt="Jata Negara"
              className="w-[100px] h-[100px] object-contain"
            />
          </div>

          <div className="w-1 h-24 bg-gray-800 flex-shrink-0"></div>

          <div className="flex-1 text-center flex flex-col justify-center py-1">
            <h1 className="text-[17pt] font-bold text-gray-900 uppercase m-0 p-0 leading-tight tracking-tight">
              KEMENTERIAN KESIHATAN
            </h1>
            <h2 className="text-[15pt] font-bold text-gray-800 uppercase m-0 p-0 leading-tight tracking-tight">
              MINISTRY OF HEALTH
            </h2>
            <h2 className="text-[15pt] font-bold text-gray-800 uppercase m-0 p-0 leading-tight tracking-tight">
              MALAYSIA
            </h2>
            <p className="text-[12pt] font-bold text-gray-700 m-0 p-0 leading-normal mt-2">
              Hospital Daerah Lawas
            </p>
          </div>

          <div className="w-1 h-24 bg-gray-800 flex-shrink-0"></div>
        </div>
        <div className="text-center border-t-2 border-gray-800 pt-2 pb-1">
          <h3 className="text-[13.5pt] font-bold text-gray-900 uppercase tracking-wide">
            Borang Permohonan Untuk Pengeluaran Pesanan Kerajaan
          </h3>
          <p className="text-[11pt] font-semibold text-gray-700 mt-0.5 italic">
            Application Form for Government Purchase Order
          </p>
        </div>
      </div>

      {/* Document Information Section */}
      <div className="px-8 py-2 border-b-2 border-gray-800">
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr>
              <td className="w-1/2 align-top pr-4">
                <div className="space-y-1">
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8.5pt] font-bold text-gray-600 uppercase block">No. Pesanan / PO Number</label>
                    <p className="text-[11.5pt] font-bold text-gray-900">{order?.po_number}</p>
                  </div>
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8.5pt] font-bold text-gray-600 uppercase block">Kod Undi / Vote Code</label>
                    <p className="text-[11.5pt] font-bold text-gray-900">{order?.vote_code || '—'}</p>
                  </div>
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8.5pt] font-bold text-gray-600 uppercase block">Aktiviti Undi / Vote Activity</label>
                    <p className="text-[11.5pt] font-bold text-gray-900">{order?.vote_activity || '—'}</p>
                  </div>
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8.5pt] font-bold text-gray-600 uppercase block">No. Kontrak / Contract No.</label>
                    <p className="text-[11.5pt] font-bold text-gray-900">{order?.vote_code === '990102' ? '—' : (order?.kkm_contract_number || order?.supplier?.contract_number || '—')}</p>
                  </div>
                </div>
              </td>
              <td className="w-1/2 align-top pl-4">
                <div className="space-y-1">
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8.5pt] font-bold text-gray-600 uppercase block">Jabatan / Department</label>
                    <p className="text-[11.5pt] font-bold text-gray-900 uppercase">{order?.department || '—'}</p>
                  </div>
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8.5pt] font-bold text-gray-600 uppercase block">Tarikh Pesanan / Order Date</label>
                    <p className="text-[11.5pt] font-bold text-gray-900">{order?.order_date ? formatDate(order.order_date) : '—'}</p>
                  </div>
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8.5pt] font-bold text-gray-600 uppercase block">Kategori / Category</label>
                    <p className="text-[11.5pt] font-bold text-gray-900 uppercase">{order?.category?.replace('_', ' ') || '—'}</p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Supplier Section */}
      <div className="px-8 py-2 border-b-2 border-gray-800 bg-gray-50/50">
        <h4 className="text-[10pt] font-bold text-gray-900 uppercase mb-2">Maklumat Pembekal / Supplier Information</h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="border border-gray-500 p-2 bg-white">
            <label className="text-[8pt] font-bold text-gray-600 uppercase block mb-0.5">Nama Syarikat / Company Name</label>
            <p className="text-[12pt] font-bold text-gray-900 uppercase">{order?.supplier?.company_name}</p>
          </div>
          <div className="border border-gray-500 p-2 bg-white min-h-[60px]">
            <label className="text-[8pt] font-bold text-gray-600 uppercase block mb-0.5">Alamat / Address</label>
            <p className="text-[10pt] text-gray-900 whitespace-pre-line leading-tight">{order?.supplier?.address || '—'}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="px-8 py-3 flex-1">
        <h4 className="text-[11pt] font-bold text-gray-900 uppercase mb-3">Butir-butir Barang / Items Purchased</h4>
        <table className="w-full border-collapse border-2 border-gray-800">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[4%]">Bil</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[37%]">Nama Item / Item Name</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[12%]">Kod Item / Item Code</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[9%]">Kuantiti / Quantity</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[11%]">Harga Unit / Unit Price</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[11%]">Jumlah / Total</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[16%]">Pembungkusan / Packaging</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="align-top">
                <td className="border border-gray-800 px-1 py-1.5 text-center font-bold text-[10pt]">{index + 1}</td>
                <td className="border border-gray-800 px-2 py-1.5">
                  <div className="font-bold text-[10.5pt] mb-1">{item.item_name}</div>
                  {order?.vote_code !== '990102' && (
                    <div className="space-y-0.5 text-[8pt] leading-tight text-gray-700 italic">
                      <p><span className="font-bold not-italic">No. Kontrak:</span> {order?.kkm_contract_number || order?.supplier?.contract_number || '—'}</p>
                      <p><span className="font-bold not-italic">Tempoh Serahan:</span> {order?.supplier?.delivery_period || 'Tidak melebihi 30 hari...'}</p>
                      <p><span className="font-bold not-italic">Tamat Kontrak:</span> {order?.supplier?.contract_end_date ? formatDate(order.supplier.contract_end_date) : '—'}</p>
                    </div>
                  )}
                </td>
                <td className="border border-gray-800 px-2 py-1.5 text-center text-[9pt] font-medium">{item.item_code}</td>
                <td className="border border-gray-800 px-2 py-1.5 text-center font-bold text-[10.5pt]">{item.quantity_ordered}</td>
                <td className="border border-gray-800 px-2 py-1.5 text-right font-medium text-[10pt]">RM {item.unit_price.toFixed(2)}</td>
                <td className="border border-gray-800 px-2 py-1.5 text-right font-bold text-[10.5pt]">RM {(item.quantity_ordered * item.unit_price).toFixed(2)}</td>
                <td className="border border-gray-800 px-2 py-1.5 text-center text-[9pt]">{item.packaging_description}</td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-800">
              <td colSpan={5} className="border border-gray-800 px-2 py-2 text-[10pt] uppercase text-right">
                JUMLAH KESELURUHAN / TOTAL AMOUNT:
              </td>
              <td className="border border-gray-800 px-2 py-2 text-[11pt] text-right">
                RM {items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </td>
              <td className="border border-gray-800"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Financial Summary and Signature - Positioned at bottom of Page 1 */}
      <div className="absolute px-8 py-4 bg-white border-t-2 border-gray-800" style={{ bottom: '95px', left: 0, width: '100%', height: '175px' }}>
        <div className="flex gap-6 h-full items-end">
          <div className="w-[55%] flex flex-col justify-end items-center pb-2">
            <div className="text-center w-full">
              <div className="border-b-2 border-gray-800 w-[80%] mx-auto mb-2"></div>
              <p className="text-[11pt] font-bold text-gray-900 mb-1 leading-tight">(Tandatangan)</p>
              <p className="text-[10pt] font-bold text-gray-800 mb-1 leading-tight">Pegawai Yang Mengesahkan Peruntukan</p>
              <p className="text-[10pt] font-bold text-gray-800 leading-tight">Pengarah Hospital Lawas</p>
            </div>
          </div>
          <div className="w-[45%] flex flex-col justify-end">
            <table className="w-full border-collapse border-2 border-gray-800 bg-white" style={{ tableLayout: 'fixed' }}>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="px-2 py-1.5 text-[9pt] font-bold uppercase border-r border-gray-800 leading-tight">BAKI SEBELUM /<br />BALANCE BEFORE:</td>
                  <td className="px-2 py-1.5 text-[10.5pt] font-bold text-right">
                    {balance !== null ? `RM ${(balance + items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '—'}
                  </td>
                </tr>
                <tr className="border-b border-gray-800 bg-gray-50">
                  <td className="px-2 py-1.5 text-[9pt] font-bold uppercase border-r border-gray-800 leading-tight">JUMLAH /<br />TOTAL AMOUNT:</td>
                  <td className="px-2 py-1.5 text-[11.5pt] font-black text-right">
                    RM {items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </td>
                </tr>
                <tr>
                  <td className="px-2 py-1.5 text-[9pt] font-bold uppercase border-r border-gray-800 leading-tight">BAKI SELEPAS /<br />BALANCE AFTER:</td>
                  <td className="px-2 py-1.5 text-[11.5pt] font-black text-right">
                    {balance !== null ? `RM ${balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute px-8 py-3 bg-gray-100 border-t-2 border-gray-800" style={{ bottom: '30px', left: 0, width: '100%' }}>
        <div className="text-center">
          <p className="text-[8.5pt] font-semibold text-gray-700">Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia</p>
          <p className="text-[8.5pt] text-gray-600 mt-1">Dikeluarkan oleh Sistem Pengurusan Operasi Hospital / Issued by Hospital Operation Management System</p>
        </div>
      </div>
    </div>
  )

  const renderPage2Content = () => (
    <div className="page bg-white border-2 border-gray-800 relative" style={{ fontFamily: "'Times New Roman', serif", width: '210mm', minHeight: '297mm', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box', padding: '0 0 95px 0' }}>
      {renderWatermark()}
      {/* Section 3: Supplier Details */}
      <div className="px-8 pt-24 pb-4 border-b-2 border-gray-800">
        <h4 className="text-[11pt] font-bold text-gray-900 uppercase mb-4 text-center underline">MAKLUMAT PEMBEKAL (SAMBUNGAN)</h4>
        <div className="flex justify-center">
          <table className="w-full max-w-2xl border-collapse border-2 border-gray-800">
            <tbody>
              <tr>
                <td className="border border-gray-800 px-4 py-3 font-bold bg-gray-100 text-[10pt] w-[30%]">Nama Pembekal :</td>
                <td className="border border-gray-800 px-4 py-3 font-bold text-[11pt] uppercase">
                  {order?.supplier?.company_name}
                  <br />
                  <span className="font-normal text-[9pt] normal-case">{order?.supplier?.address}</span>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-4 py-3 font-bold bg-gray-100 text-[10pt]">No. Telefon :</td>
                <td className="border border-gray-800 px-4 py-3 font-bold text-[11pt]">{order?.supplier?.phone || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Federal Treasury Registration */}
      <div className="px-8 py-4 border-b-2 border-gray-800">
        <p className="text-[11pt] mb-3">Berdaftar dengan Pejabat Kewangan Persekutuan Sarawak ( Ya / Tidak )</p>
        <div className="border-b border-black w-full h-4 mb-4"></div>
        <p className="text-[11pt] mb-3">No. Rujukan Pendaftaran :</p>
        <div className="border-b border-black w-full h-4"></div>
      </div>

      {/* Section 4: Purchase Order Details */}
      <div className="px-8 py-4 border-b-2 border-gray-800">
        <p className="text-[11pt] font-bold text-gray-900 mb-4">Bersama-sama ini dinyatakan (Penuhkan mana yang sesuai).</p>
        <div className="ml-6 space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="text-[11pt] w-8">(i)</span>
            <div className="flex-1 text-[11pt]">
              No. rujukan surat mampu : <span className="border-b border-dotted border-black px-12 ml-2"></span>
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11pt] w-8">(ii)</span>
            <div className="flex-1 text-[11pt]">
              No. rujukan kontrak : <span className="font-bold underline decoration-dotted underline-offset-4 ml-2">{order?.kkm_contract_number || '...................................................'}</span>
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11pt] w-8">(iii)</span>
            <div className="flex-1 text-[11pt]">
              Salinan surat kelulusan Pejabat Kewangan Persekutuan Bil.: <span className="border-b border-dotted border-black px-20 ml-2"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4 Signature */}
      <div className="px-8 py-6 border-b-2 border-gray-800 bg-gray-50/30">
        <div className="flex justify-between items-end">
          <div className="pb-4">
            <p className="text-[11pt] font-bold">Tarikh : <span className="font-serif ml-2 underline decoration-dotted">{order?.order_date ? formatDate(order.order_date) : '—'}</span></p>
          </div>
          <div className="text-center">
            <div className="w-64 border-b border-dotted border-black mb-2 mx-auto"></div>
            <p className="text-[10pt] font-bold mb-3">(Tandatangan Pegawai yang Memohon)</p>
            <div className="text-left space-y-1">
              <p className="text-[10pt] font-bold">Nama : {signatures.applicantName}</p>
              <p className="text-[10pt] font-bold">Jawatan : {signatures.applicantPosition}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Approval */}
      <div className="px-8 py-6 border-b-2 border-gray-800">
        <h4 className="text-[11pt] font-bold mb-4 uppercase">5. PERAKUAN KETUA JABATAN / APPROVAL BY HEAD OF DEPARTMENT</h4>
        <p className="text-[11pt] mb-8 leading-relaxed">Saya dengan ini meluluskan pengeluaran Pesanan Kerajaan ini mengikut peraturan kewangan yang sedang berkuatkuasa.</p>
        <div className="flex justify-between items-end">
          <div className="pb-4">
            <p className="text-[11pt] font-bold">Tarikh : <span className="border-b border-dotted border-black px-12 ml-2"></span></p>
          </div>
          <div className="text-center">
            <div className="w-64 border-b border-dotted border-black mb-2 mx-auto"></div>
            <p className="text-[10pt] font-bold mb-3">(Tandatangan Ketua Jabatan)</p>
            <div className="text-left space-y-1">
              <p className="text-[10pt] font-bold">Nama : {signatures.headName}</p>
              <p className="text-[10pt] font-bold">Jawatan : {signatures.headPosition}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-10 left-0 w-full text-center px-8">
        <p className="text-[9pt] text-gray-500 italic">Sila lampirkan salinan Pesanan Kerajaan ini semasa membuat tuntutan pembayaran.</p>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Loading Procurement Data...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-10 text-center">
        <div className="bg-white border border-gray-200 rounded-[2rem] p-12 shadow-sm">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Purchase order not found</p>
          <Button onClick={() => isSlideOver ? onClose?.() : navigate(ROUTES.PHARMACY_PO)} className="mt-6 rounded-xl font-black uppercase text-xs tracking-widest">
            {isSlideOver ? 'Close Panel' : 'Back to List'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={isSlideOver ? 'p-0' : 'relative w-full p-6 lg:p-8 space-y-8 bg-slate-50 min-h-full'}>
      {/* Professional Print Styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body { margin: 0 !important; padding: 0 !important; width: 210mm; height: auto; background: white; overflow: visible; }
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 210mm; margin: 0 !important; padding: 0 !important; font-family: 'Times New Roman', serif; color: #000; }
          .no-print { display: none !important; }
          .page { width: 210mm; height: 297mm; padding: 0; margin: 0 !important; page-break-after: always; position: relative; overflow: hidden; display: block; background: white; border: none !important; box-shadow: none !important; }
          .page-break { page-break-after: always; height: 0; }
        }
        @media screen {
          .page-shadow { box-shadow: 0 0 20px rgba(0,0,0,0.15); border: 2px solid #1f2937 !important; }
        }
      `}</style>

      {!isSlideOver && (
        <nav className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase no-print">
          <button onClick={() => navigate('/financial')} className="hover:text-blue-600 transition-colors uppercase">Financial</button>
          <span>/</span>
          <button onClick={() => navigate('/procurement')} className="hover:text-blue-600 transition-colors uppercase">Procurement</button>
          <span>/</span>
          <button onClick={() => navigate(ROUTES.PHARMACY_PO)} className="hover:text-blue-600 transition-colors uppercase">Purchase Orders</button>
          <span>/</span>
          <span className="text-slate-900">Details</span>
        </nav>
      )}

      <div className={cn("flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-20 no-print", isSlideOver && "p-6 bg-white border-b border-slate-100 sticky top-0")}>
        <div className="flex items-center gap-6">
          {!isSlideOver && (
            <div 
              onClick={() => navigate(ROUTES.PHARMACY_PO)}
              className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group"
            >
              <IconArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{order.po_number}</h1>
              {renderStatusBadge(order.status)}
            </div>
            <p className="text-slate-500 font-bold mt-1 text-[11px] uppercase tracking-wider opacity-60">
              Pesanan Kerajaan • <span className="text-blue-600">{order.supplier?.company_name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.status === 'approved' && (
            <Button onClick={handlePrint} variant="outline" className="bg-white border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider h-9 px-3 flex items-center gap-1.5" disabled={isPrinting}>
              {isPrinting ? <Spinner className="w-3.5 h-3.5" /> : <IconPrinter className="w-3.5 h-3.5" />}
              Print
            </Button>
          )}
          {order.status === 'draft' && (
            <>
              <Button onClick={handleEdit} variant="outline" className="bg-white border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider h-9 px-3 flex items-center gap-1.5">
                <IconEdit className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button onClick={() => setShowSubmitDialog(true)} className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider h-9 px-4 flex items-center gap-1.5">
                <IconCheck className="w-3.5 h-3.5" /> Submit
              </Button>
              <Button onClick={() => setShowDeleteDialog(true)} variant="outline" className="bg-white border-red-200 text-red-600 font-black text-[10px] uppercase tracking-wider h-9 px-3 flex items-center gap-1.5 hover:bg-red-50">
                <IconTrash className="w-3.5 h-3.5" /> Delete
              </Button>
            </>
          )}
          {order.status === 'pending_approval' && (
            <>
              <Button onClick={() => setShowApproveDialog(true)} className="bg-green-600 text-white font-black text-[10px] uppercase tracking-wider h-9 px-4 flex items-center gap-1.5">
                <IconCheckCircle className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button onClick={() => setShowCancelDialog(true)} variant="outline" className="bg-white border-red-200 text-red-600 font-black text-[10px] uppercase tracking-wider h-9 px-3 flex items-center gap-1.5 hover:bg-red-50">
                <IconX className="w-3.5 h-3.5" /> Reject
              </Button>
            </>
          )}
          {order.status === 'approved' && (
            <Button onClick={() => setShowSendDialog(true)} className="bg-indigo-600 text-white font-black text-[10px] uppercase tracking-wider h-9 px-4 flex items-center gap-1.5">
              <IconSend className="w-3.5 h-3.5" /> Send to Supplier
            </Button>
          )}
          <Button onClick={handleOpenSettings} variant="outline" className="bg-white border-slate-200 text-slate-700 p-2 h-9 w-9 shadow-sm" title="Configure PO Signatures">
            <IconSettings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {order.status === 'cancelled' && order.notes && (
        <div className="bg-red-50 border border-red-200 rounded-[1.5rem] p-5 flex items-start gap-4 no-print animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <IconAlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-red-900 font-black text-[10px] uppercase tracking-[0.15em] mb-1">Cancellation Reason</p>
            <p className="text-red-700 text-sm font-medium leading-relaxed">
              {order.notes.replace(/^(Cancelled|Rejected):\s*/i, '') || 'No reason provided'}
            </p>
          </div>
        </div>
      )}

      {/* Screen View Container */}
      <div className="flex flex-col items-center gap-12 no-print pb-20">
        <div className="page-shadow">
          {renderPage1Content()}
        </div>
        <div className="page-shadow">
          {renderPage2Content()}
        </div>
      </div>

      {/* Print View Container */}
      <div ref={printContentRef} className="print-content hidden print:block">
        {renderPage1Content()}
        <div className="page-break"></div>
        {renderPage2Content()}
      </div>

      {/* Action Dialogs */}
      <ConfirmationDialog isOpen={showCancelDialog} onClose={() => !isCancelling && setShowCancelDialog(false)} onConfirm={handleConfirmCancel} title="Cancel PO" variant="danger" isLoading={isCancelling}>
        <div className="space-y-4 p-4">
          <p className="text-sm font-bold uppercase">Are you sure you want to cancel this PO?</p>
          <textarea className="w-full border rounded p-2" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason..." />
        </div>
      </ConfirmationDialog>
      <ConfirmationDialog isOpen={showDeleteDialog} onClose={() => !isDeleting && setShowDeleteDialog(false)} onConfirm={handleConfirmDelete} title="Delete PO" variant="danger" isLoading={isDeleting}>
        <p className="p-4">Permanently delete this draft PO?</p>
      </ConfirmationDialog>
      <ConfirmationDialog isOpen={showSubmitDialog} onClose={() => !isSubmitting && setShowSubmitDialog(false)} onConfirm={handleConfirmSubmit} title="Submit PO" variant="info" isLoading={isSubmitting}>
        <p className="p-4">Submit for approval?</p>
      </ConfirmationDialog>
      <ConfirmationDialog isOpen={showApproveDialog} onClose={() => !isApproving && setShowApproveDialog(false)} onConfirm={handleConfirmApprove} title="Approve PO" variant="success" isLoading={isApproving}>
        <p className="p-4">Confirm financial approval?</p>
      </ConfirmationDialog>
      <ConfirmationDialog isOpen={showSendDialog} onClose={() => !isSending && setShowSendDialog(false)} onConfirm={handleConfirmSend} title="Send PO" variant="info" isLoading={isSending}>
        <p className="p-4">Send to supplier?</p>
      </ConfirmationDialog>

      {/* Settings Modal */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="PO Signature Settings" size="md">
        <div className="space-y-6 p-4">
          <div className="space-y-4">
            <h4 className="font-bold border-b pb-2">Applicant</h4>
            <Input label="Name" value={tempSignatures.applicantName} onChange={(e) => setTempSignatures({ ...tempSignatures, applicantName: e.target.value })} />
            <Input label="Position" value={tempSignatures.applicantPosition} onChange={(e) => setTempSignatures({ ...tempSignatures, applicantPosition: e.target.value })} />
          </div>
          <div className="space-y-4">
            <h4 className="font-bold border-b pb-2">Head of Dept</h4>
            <Input label="Name" value={tempSignatures.headName} onChange={(e) => setTempSignatures({ ...tempSignatures, headName: e.target.value })} />
            <Input label="Position" value={tempSignatures.headPosition} onChange={(e) => setTempSignatures({ ...tempSignatures, headPosition: e.target.value })} />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} isLoading={isSavingSettings}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PurchaseOrderDetailView;
