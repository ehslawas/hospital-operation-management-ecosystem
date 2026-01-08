import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, ShoppingCart, Edit2, Trash2, Send, CheckCircle, FileCheck, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Spinner, Badge, ConfirmationDialog, Modal, Input } from '@/components/ui'
import { getPurchaseOrderById, rejectPurchaseOrder, deletePurchaseOrder, submitPurchaseOrder, approvePurchaseOrder, sendPurchaseOrder } from '@/services/pharmacy/procurementService'
import { supabase } from '@/services/supabase'
import { getWarrants } from '@/services/pharmacy/warrantService'
import { getPharmacyPOSignatures, updatePharmacyPOSignatures, type PharmacyPOSignatures } from '@/services/pharmacy/pharmacySettingsService'
import { mergePOWithSupplierDocs, openPdfForPrint, cleanupPdfUrl } from '@/services/pharmacy/pdfMergeService'
import type { PurchaseOrderWithRelations, PurchaseOrderItem } from '@/types/pharmacy'
import { ROUTES } from '@/lib/constants'

export const PurchaseOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  const hospitalId = user?.hospital_id

  const [order, setOrder] = useState<PurchaseOrderWithRelations | null>(null)
  const [items, setItems] = useState<Array<PurchaseOrderItem & { item_name?: string; item_code?: string }>>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
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

  useEffect(() => {
    if (!id || !hospitalId) return

    const loadOrder = async () => {
      setIsLoading(true)
      try {
        const result = await getPurchaseOrderById(id)
        if (result.error) {
          showError('Error', result.error)
          navigate(ROUTES.PHARMACY_PO)
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
                // Calculate balance: allocation minus this PO amount
                const poAmount = result.data!.total_amount || 0
                const calculatedBalance = totalAllocation - Number(poAmount)
                setBalance(Math.max(0, calculatedBalance))
              }
            } catch (error) {
              console.error('Error loading balance:', error)
            }
          }
          
          // Load item details from Supabase
          const itemsWithDetails = await Promise.all(
            (result.data.items || []).map(async (item: PurchaseOrderItem) => {
              try {
                if (item.item_type === 'drug') {
                  const { data: drug, error } = await supabase
                    .from('drugs')
                    .select('drug_name, drug_code')
                    .eq('id', item.item_id)
                    .single()
                  
                  if (error) throw error
                  
                  return {
                    ...item,
                    item_name: drug?.drug_name || 'Unknown Drug',
                    item_code: drug?.drug_code || item.item_id,
                  }
                } else {
                  const { data: nonDrug, error } = await supabase
                    .from('non_drugs')
                    .select('item_name, item_code')
                    .eq('id', item.item_id)
                    .single()
                  
                  if (error) throw error
                  
                  return {
                    ...item,
                    item_name: nonDrug?.item_name || 'Unknown Item',
                    item_code: nonDrug?.item_code || item.item_id,
                  }
                }
              } catch (error) {
                console.error('Error loading item details:', error)
                return {
                  ...item,
                  item_name: 'Unknown Item',
                  item_code: item.item_id,
                }
              }
            })
          )
          setItems(itemsWithDetails)
        }
      } catch (error) {
        console.error('Error loading purchase order:', error)
        showError('Error', 'Failed to load purchase order')
      } finally {
        setIsLoading(false)
      }
    }

    void loadOrder()
  }, [id, hospitalId, navigate, showError])

  const handlePrint = async () => {
    if (!order || !printContentRef.current) {
      showError('Error', 'Unable to print. Please try again.')
      return
    }

    // Check if supplier has documents to merge
    const hasSupplierDocs = order.supplier?.account_document_url || order.supplier?.mof_certificate_url

    if (!hasSupplierDocs) {
      // No supplier documents, use simple print
      window.print()
      return
    }

    // Merge PO with supplier documents
    setIsPrinting(true)
    
    try {
      const printForm = printContentRef.current
      
      if (!printForm) {
        throw new Error('Print form element not found')
      }
      
      // The pdfMergeService will handle rendering in a temporary container
      // No need to modify the original element
      const result = await mergePOWithSupplierDocs({
        poElement: printForm,
        accountDocumentUrl: order.supplier?.account_document_url,
        mofCertificateUrl: order.supplier?.mof_certificate_url,
        poNumber: order.po_number,
      })

      if (result.success && result.pdfUrl) {
        // Open merged PDF for printing
        openPdfForPrint(result.pdfUrl)
        
        // Cleanup URL after a delay
        setTimeout(() => {
          if (result.pdfUrl) {
            cleanupPdfUrl(result.pdfUrl)
          }
        }, 60000) // Cleanup after 1 minute
        
        showSuccess('PDF Generated', 'Merged PDF opened in new window. Use browser print to print.')
      } else {
        showError('Print Error', result.error || 'Failed to generate merged PDF')
        // Fallback to simple print
        window.print()
      }
    } catch (error) {
      console.error('Error generating merged PDF:', error)
      showError('Print Error', 'Failed to generate merged PDF. Using simple print.')
      // Fallback to simple print
      window.print()
    } finally {
      setIsPrinting(false)
    }
  }

  const handleEdit = () => {
    if (!order) return
    // Navigate to the PO creation page; future enhancement can support true edit using this state
    navigate(ROUTES.PHARMACY_PO_CREATE, {
      state: { mode: 'edit', poId: order.id },
    })
  }

  const handleConfirmCancel = async () => {
    if (!order) return
    if (!cancelReason.trim()) {
      showError('Validation Error', 'Please provide a reason for cancelling this purchase order.')
      return
    }

    try {
      setIsCancelling(true)

      const result = await rejectPurchaseOrder(order.id, user?.id || 'system', cancelReason.trim())

      if (result.error || !result.data) {
        showError('Error', result.error || 'Failed to cancel purchase order')
        return
      }

      // Update local order state so UI reflects the cancelled status and notes
      setOrder((prev) =>
        prev
          ? ({
              ...prev,
              ...result.data,
            } as PurchaseOrderWithRelations)
          : prev
      )

      showSuccess('Purchase Order Cancelled', 'The purchase order has been cancelled.')
      setShowCancelDialog(false)
      setCancelReason('')
    } catch (error) {
      console.error('Error cancelling purchase order:', error)
      showError('Error', 'Failed to cancel purchase order')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!order) return
    if (!deleteReason.trim()) {
      showError('Validation Error', 'Please provide a reason for deleting this purchase order.')
      return
    }

    try {
      setIsDeleting(true)

      const result = await deletePurchaseOrder(order.id, user?.id || 'system')

      if (result.error || !result.data) {
        showError('Error', result.error || 'Failed to delete purchase order')
        return
      }

      showSuccess('Purchase Order Deleted', 'The purchase order has been deleted successfully.')
      setShowDeleteDialog(false)
      setDeleteReason('')
      navigate(ROUTES.PHARMACY_PO)
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      showError('Error', 'Failed to delete purchase order')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!order) return

    try {
      setIsSubmitting(true)

      const result = await submitPurchaseOrder(order.id)

      if (result.error || !result.data) {
        showError('Error', result.error || 'Failed to submit purchase order for approval')
        return
      }

      // Update local order state
      setOrder((prev) =>
        prev
          ? ({
              ...prev,
              ...result.data,
            } as PurchaseOrderWithRelations)
          : prev
      )

      showSuccess('Purchase Order Submitted', 'The purchase order has been submitted for approval.')
      setShowSubmitDialog(false)
    } catch (error) {
      console.error('Error submitting purchase order:', error)
      showError('Error', 'Failed to submit purchase order for approval')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!order) return

    try {
      setIsApproving(true)

      const result = await approvePurchaseOrder(order.id, user?.id || 'system')

      if (result.error || !result.data) {
        showError('Error', result.error || 'Failed to approve purchase order')
        return
      }

      // Update local order state
      setOrder((prev) =>
        prev
          ? ({
              ...prev,
              ...result.data,
            } as PurchaseOrderWithRelations)
          : prev
      )

      showSuccess('Purchase Order Approved', 'The purchase order has been approved successfully.')
      setShowApproveDialog(false)
    } catch (error) {
      console.error('Error approving purchase order:', error)
      showError('Error', 'Failed to approve purchase order')
    } finally {
      setIsApproving(false)
    }
  }

  const handleSendToSupplier = async () => {
    if (!order) return

    try {
      setIsSending(true)

      const result = await sendPurchaseOrder(order.id)

      if (result.error || !result.data) {
        showError('Error', result.error || 'Failed to send purchase order to supplier')
        return
      }

      // Update local order state
      setOrder((prev) =>
        prev
          ? ({
              ...prev,
              ...result.data,
            } as PurchaseOrderWithRelations)
          : prev
      )

      showSuccess('Purchase Order Sent', 'The purchase order has been sent to the supplier.')
      setShowSendDialog(false)
    } catch (error) {
      console.error('Error sending purchase order:', error)
      showError('Error', 'Failed to send purchase order to supplier')
    } finally {
      setIsSending(false)
    }
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
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateMalay = (dateStr: string) => {
    const date = new Date(dateStr)
    const months = ['JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN', 'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER']
    const day = String(date.getDate()).padStart(2, '0')
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const formatCurrencyMalay = (amount: number) => {
    return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">Purchase order not found</p>
          <Button onClick={() => navigate(ROUTES.PHARMACY_PO)} className="mt-4">
            Back to List
          </Button>
        </div>
      </div>
    )
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0)
  const total = subtotal

  return (
    <>
      {/* Professional Print Styles - Includes PO Form and Supplier Documents */}
      <style>{`
        /* A4 Size for Screen View */
        @media screen {
          .no-print[style*="width: 210mm"] {
            width: 210mm !important;
            max-width: 100% !important;
            margin: 0 auto 24px auto !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          }
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm;
            height: auto;
            background: white;
            overflow: visible;
          }
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Times New Roman', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.3;
            color: #000;
          }
          .print-content > * {
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-form.hidden {
            display: block !important;
          }
          .print-form {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative;
            width: 210mm;
            background: white;
            box-sizing: border-box;
          }
          .print-form > * {
            margin: 0 !important;
          }
          .page {
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0 !important;
            margin-bottom: 0 !important;
            position: relative;
            page-break-after: always;
            page-break-before: auto;
            page-break-inside: avoid;
            overflow: hidden;
            box-sizing: border-box;
            display: block;
            background: white;
            break-after: page;
            break-inside: avoid;
          }
          .page::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            height: 400px;
            background-image: url('/512px-Jata_MalaysiaV2.svg.png');
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            opacity: 0.08;
            z-index: 0;
            pointer-events: none;
          }
          .page > * {
            position: relative;
            z-index: 1;
          }
          .page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .print-table {
            border-collapse: collapse;
            width: 100%;
            margin: 0;
            font-size: 11pt;
            border: 2px solid #000;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #000;
            padding: 6px 4px;
            text-align: left;
            font-size: 11pt;
            line-height: 1.4;
            vertical-align: top;
          }
          .print-table th {
            font-weight: bold;
            text-align: center;
            background-color: #f0f0f0;
          }
        }
        @media screen {
          .print-form.hidden {
            display: none !important;
          }
          .print-form {
            display: none !important;
          }
        }
      `}</style>
      <div className="p-4 space-y-4 max-w-7xl mx-auto print-content bg-gray-100 min-h-screen">
      {/* Header - Action Bar */}
      <div className="flex items-center justify-between no-print mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.PHARMACY_PO)}
            className="flex items-center gap-2 border-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali / Back
          </Button>
          <div className="h-8 w-px bg-gray-400"></div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide" style={{ fontFamily: "'Times New Roman', serif" }}>
            <ShoppingCart className="w-5 h-5 text-blue-700" />
            Butiran Pesanan Kerajaan / Purchase Order Details
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Submit for Approval - Only for draft status */}
          {order.status === 'draft' && (
            <Button
              onClick={() => setShowSubmitDialog(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : <FileCheck className="w-4 h-4" />}
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          )}

          {/* Approve - Only for pending_approval status */}
          {order.status === 'pending_approval' && (
            <Button
              onClick={() => setShowApproveDialog(true)}
              size="sm"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              disabled={isApproving}
            >
              {isApproving ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
              {isApproving ? 'Approving...' : 'Approve'}
            </Button>
          )}

          {/* Send to Supplier - Only for approved status */}
          {order.status === 'approved' && (
            <Button
              onClick={() => setShowSendDialog(true)}
              size="sm"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSending}
            >
              {isSending ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
              {isSending ? 'Sending...' : 'Send to Supplier'}
            </Button>
          )}

          <Button
            onClick={handleEdit}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={order.status === 'cancelled' || order.status === 'completed' || order.status === 'sent' || order.status === 'partial_received'}
          >
            <Edit2 className="w-4 h-4" />
            Edit / Cancel
          </Button>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600"
            disabled={order.status !== 'draft'}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          {/* Print - Only for approved and sent status */}
          {(order.status === 'approved' || order.status === 'sent') && (
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              disabled={isPrinting}
            >
              {isPrinting ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  Print
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleOpenSettings}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            title="Configure PO Signatures"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Professional Government Document View - Screen */}
      <div className="bg-white border-2 border-gray-800 shadow-lg no-print" style={{ fontFamily: "'Times New Roman', serif", width: '210mm', height: '297mm', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box', overflow: 'hidden' }}>
        {/* Government Document Header */}
        <div className="border-b-2 border-gray-800 bg-gradient-to-r from-blue-50 to-white py-3 px-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img
              src="/512px-Jata_MalaysiaV2.svg.png"
              alt="Jata Negara Malaysia"
              className="w-16 h-16 object-contain"
            />
            <div className="text-center border-l-2 border-r-2 border-gray-800 px-4">
              <h1 className="text-lg font-bold text-gray-900 tracking-wide uppercase mb-0.5">
                Kementerian Kesihatan Malaysia
              </h1>
              <h2 className="text-base font-bold text-gray-800 uppercase">
                Ministry of Health Malaysia
              </h2>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">
                Hospital Daerah Lawas
              </p>
            </div>
          </div>
          <div className="text-center border-t-2 border-gray-800 pt-2">
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">
              Borang Permohonan Untuk Pengeluaran Pesanan Kerajaan
            </h3>
            <p className="text-xs font-semibold text-gray-700 mt-0.5 italic">
              Application Form for Government Purchase Order
            </p>
          </div>
        </div>

        {/* Document Information Section */}
        <div className="px-8 py-3 border-b-2 border-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="border-b border-gray-400 pb-1">
                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">No. Pesanan / PO Number</label>
                <p className="text-sm font-bold text-gray-900">{order.po_number}</p>
              </div>
              <div className="border-b border-gray-400 pb-1">
                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Kod Undi / Vote Code</label>
                <p className="text-sm font-semibold text-gray-900">{order.vote_code || '—'}</p>
              </div>
              <div className="border-b border-gray-400 pb-1">
                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Aktiviti Undi / Vote Activity</label>
                <p className="text-sm font-semibold text-gray-900">{order.vote_activity || '—'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="border-b border-gray-400 pb-1">
                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Jabatan / Department</label>
                <p className="text-sm font-semibold text-gray-900 uppercase">{order.department || '—'}</p>
              </div>
              <div className="border-b border-gray-400 pb-1">
                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Tarikh Pesanan / Order Date</label>
                <p className="text-sm font-semibold text-gray-900">{formatDate(order.order_date)}</p>
              </div>
              <div className="border-b border-gray-400 pb-1">
                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Kategori / Category</label>
                <p className="text-sm font-semibold text-gray-900 uppercase">{order.category?.replace('_', ' ') || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Information */}
        <div className="px-8 py-3 border-b-2 border-gray-800 bg-gray-50">
          <h4 className="text-xs font-bold text-gray-900 uppercase mb-2">Maklumat Pembekal / Supplier Information</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="border border-gray-600 p-2 bg-white">
              <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Nama Syarikat / Company Name</label>
              <p className="text-sm font-semibold text-gray-900 uppercase">{order.supplier?.company_name || '—'}</p>
            </div>
            {order.supplier?.address && (
              <div className="border border-gray-600 p-2 bg-white">
                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Alamat / Address</label>
                <p className="text-xs text-gray-900">{order.supplier.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table - Government Document Style */}
        <div className="px-8 py-4 border-b-2 border-gray-800">
          <h4 className="text-xs font-bold text-gray-900 uppercase mb-3">Butir-butir Barang / Items Purchased</h4>
          
          {items.length === 0 ? (
            <div className="border-2 border-gray-600 p-8 text-center bg-gray-50">
              <p className="text-sm font-semibold text-gray-600">Tiada item dijumpai / No items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-gray-800" style={{ fontFamily: "'Times New Roman', serif" }}>
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-800 px-2 py-1.5 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '5%' }}>Bil</th>
                    <th className="border border-gray-800 px-2 py-1.5 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '43%' }}>Nama Item / Item Name</th>
                    <th className="border border-gray-800 px-2 py-1.5 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '12%' }}>Kod Item / Item Code</th>
                    <th className="border border-gray-800 px-2 py-1.5 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '10%' }}>Kuantiti / Quantity</th>
                    <th className="border border-gray-800 px-2 py-1.5 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '12%' }}>Harga Unit / Unit Price</th>
                    <th className="border border-gray-800 px-2 py-1.5 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '12%' }}>Jumlah / Total</th>
                    <th className="border border-gray-800 px-2 py-1.5 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '6%' }}>Pembungkusan / Packaging</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-900 text-center font-semibold">{index + 1}</td>
                      <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-900">{item.item_name || '—'}</td>
                      <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-700 font-mono">{item.item_code || '—'}</td>
                      <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-900 text-center font-semibold">{item.quantity_ordered}</td>
                      <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-900 text-right font-semibold">{formatCurrency(item.unit_price)}</td>
                      <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-900 text-right font-bold">
                        {formatCurrency(item.quantity_ordered * item.unit_price)}
                      </td>
                      <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-700">{item.packaging_description || '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-200 font-bold">
                    <td colSpan={5} className="border border-gray-800 px-2 py-2 text-xs text-gray-900 uppercase text-right">
                      Jumlah Keseluruhan / Total Amount:
                    </td>
                    <td className="border border-gray-800 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(total)}
                    </td>
                    <td className="border border-gray-800"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Financial Summary and Signature */}
        <div className="px-8 py-3 bg-gray-50 border-b-2 border-gray-800">
          <div className="flex gap-4">
            {/* Left - Signature (no box) */}
            <div className="w-full md:w-96 flex items-end">
              <div className="text-center w-full pb-2">
                <p className="text-xs mb-1" style={{ fontFamily: "'Times New Roman', serif" }}>...........................................................................</p>
                <p className="text-xs font-bold text-gray-900 mb-0.5" style={{ fontFamily: "'Times New Roman', serif" }}>(Tandatangan)</p>
                <p className="text-xs font-bold text-gray-900 mb-0.5" style={{ fontFamily: "'Times New Roman', serif" }}>Pegawai Yang Mengesahkan Peruntukan</p>
                <p className="text-xs font-bold text-gray-900" style={{ fontFamily: "'Times New Roman', serif" }}>Pengarah Hospital Lawas</p>
              </div>
            </div>
            {/* Right Box - Financial Summary */}
            <div className="w-full md:w-96 space-y-1.5 border-2 border-gray-600 p-2.5 bg-white ml-auto">
              <div className="flex justify-between items-center border-b border-gray-400 pb-1">
                <span className="text-xs font-bold text-gray-700 uppercase">Baki Sebelum / Balance Before:</span>
                <span className="text-sm font-bold text-gray-900">
                  {balance !== null ? formatCurrency(balance + total) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-400 pb-1 pt-1">
                <span className="text-sm font-bold text-gray-900 uppercase">Jumlah Keseluruhan / Total Amount:</span>
                <span className="text-base font-bold text-gray-900">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold text-gray-900 uppercase">Baki Selepas / Balance After:</span>
                <span className="text-base font-bold text-gray-900">
                  {balance !== null ? formatCurrency(balance) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Footer */}
        <div className="px-8 py-4 bg-gray-100 border-t-2 border-gray-800">
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-700">
              Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Dikeluarkan oleh Sistem Pengurusan Operasi Hospital / Issued by Hospital Operation Management System
            </p>
          </div>
        </div>
      </div>

      {/* PAGE 2 - Screen View - Approval Sections - Professional Government Document */}
      <div className="bg-white border-2 border-gray-800 shadow-lg no-print mt-6" style={{ fontFamily: "'Times New Roman', serif", width: '210mm', height: '297mm', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box', overflow: 'hidden' }}>
        {/* Section 3: Supplier Details */}
        <div className="px-8 py-1 border-b-2 border-gray-800">
          <div className="flex justify-center">
            <table className="w-full max-w-4xl border-collapse border-2 border-gray-800">
              <tbody>
                <tr>
                  <td className="border border-gray-800 px-3 py-1.5 font-bold bg-gray-200 text-sm" style={{ width: '30%', verticalAlign: 'top' }}>Nama Pembekal :</td>
                  <td className="border border-gray-800 px-3 py-1.5 font-bold text-sm uppercase" style={{ lineHeight: '1.3' }}>
                    {order.supplier?.company_name || '—'}
                    <br />
                    <span className="font-normal text-xs normal-case">{order.supplier?.address || ''}</span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 px-3 py-1.5 font-bold bg-gray-200 text-sm">No. Telefon :</td>
                  <td className="border border-gray-800 px-3 py-1.5 font-bold text-sm">{order.supplier?.phone || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Federal Treasury Registration */}
        <div className="px-8 py-1 border-b-2 border-gray-800 bg-gray-50">
          <p className="text-sm mb-1" style={{ lineHeight: '1.3' }}>Berdaftar dengan Pejabat Kewangan Persekutuan Sarawak ( Ya / Tidak )</p>
          <div className="border-b-2 border-dotted border-gray-800 inline-block min-w-[350px] mb-1"></div>
          <p className="text-sm mb-1" style={{ lineHeight: '1.3' }}>No. Rujukan Pendaftaran :</p>
          <div className="border-b-2 border-dotted border-gray-800 inline-block min-w-[350px]"></div>
        </div>

        {/* Section 4: Purchase Order Details */}
        <div className="px-8 py-1 border-b-2 border-gray-800">
          <p className="text-sm font-bold text-gray-900 mb-1" style={{ lineHeight: '1.3' }}>Bersama-sama ini dinyatakan (Penuhkan mana yang sesuai).</p>
          <div className="ml-4 space-y-1">
            <p className="text-sm" style={{ lineHeight: '1.4' }}>
              (i) No. rujukan surat mampu : 
              <span className="border-b-2 border-dotted border-gray-800 inline-block min-w-[350px] ml-2"></span>
            </p>
            <p className="text-sm" style={{ lineHeight: '1.4' }}>
              (ii) No. rujukan kontrak : 
              <span className="border-b-2 border-dotted border-gray-800 inline-block min-w-[350px] ml-2"></span>
            </p>
            <p className="text-sm" style={{ lineHeight: '1.4' }}>
              (iii) Salinan surat kelulusan Pejabat Kewangan Persekutuan Bil.:
              <span className="border-b-2 border-dotted border-gray-800 inline-block min-w-[200px] ml-2"></span>
            </p>
          </div>
        </div>

        {/* Section 4 Signature */}
        <div className="px-8 py-1 border-b-2 border-gray-800 bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="pt-8">
              <div className="flex gap-2">
                <span className="text-sm font-bold">Tarikh :</span>
                <span className="text-sm font-bold">{formatDateMalay(order.order_date)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm mb-0.5" style={{ lineHeight: '1.3' }}>...........................................................................</p>
              <p className="text-sm font-bold mb-1" style={{ lineHeight: '1.2' }}>(Tandatangan Pegawai yang Memohon.)</p>
              <div className="text-left inline-block">
                <table className="border-collapse">
                  <tbody>
                    <tr>
                      <td className="pr-2 text-right" style={{ whiteSpace: 'nowrap' }}>
                        <span className="text-sm font-bold">Nama :</span>
                      </td>
                      <td>
                        <span className="text-sm font-bold">{signatures.applicantName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="pr-2 text-right pt-1" style={{ whiteSpace: 'nowrap' }}>
                        <span className="text-sm font-bold">Jawatan :</span>
                      </td>
                      <td className="pt-1">
                        <span className="text-sm font-bold">{signatures.applicantPosition}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Head of Department Account */}
        <div className="px-8 py-1 border-b-2 border-gray-800">
          <p className="text-sm font-bold text-gray-900 mb-1" style={{ lineHeight: '1.3' }}>Akaun Ketua Bahagian.</p>
          <div className="ml-8 mb-2 space-y-1">
            <p className="text-sm" style={{ lineHeight: '1.3' }}>(i) Adalah disahkan pembelian ini telah dimasukan dalam cadangan anggaran Belanjawan tahunan.</p>
            <p className="text-sm" style={{ lineHeight: '1.3' }}>(ii) Pembelian ini adalah diperlukan.</p>
          </div>
          <div className="flex justify-between items-start gap-10">
            <div className="pt-8">
              <div className="flex gap-2">
                <span className="text-sm font-bold">Tarikh :</span>
                <span className="text-sm font-bold">{formatDateMalay(order.order_date)}</span>
              </div>
            </div>
            <div className="text-right flex-1">
              <p className="text-sm mb-0.5" style={{ lineHeight: '1.3' }}>....................................................</p>
              <p className="text-sm font-bold mb-1" style={{ lineHeight: '1.2' }}>(Tandatangan Ketua Bahagian)</p>
              <div className="text-left inline-block">
                <table className="border-collapse">
                  <tbody>
                    <tr>
                      <td className="pr-2 text-right" style={{ whiteSpace: 'nowrap' }}>
                        <span className="text-sm font-bold">Nama :</span>
                      </td>
                      <td>
                        <span className="text-sm font-bold">{signatures.headName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="pr-2 text-right pt-1" style={{ whiteSpace: 'nowrap' }}>
                        <span className="text-sm font-bold">Jawatan :</span>
                      </td>
                      <td className="pt-1">
                        <span className="text-sm font-bold">{signatures.headPosition}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Section */}
        <div className="px-8 py-2 border-b-2 border-gray-800 bg-gray-50">
          <div className="flex justify-between items-start">
            <div style={{ width: '45%' }}>
              <div className="pt-8">
                <p className="text-sm font-bold italic mb-4" style={{ lineHeight: '1.3' }}>Permohonan diluluskan/ tidak diluluskan.</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">Tarikh :</span>
                  <span className="border-b-2 border-dotted border-gray-800 flex-1"></span>
                </div>
              </div>
            </div>
            <div className="text-right" style={{ width: '50%' }}>
              <div className="pt-8">
                <div className="mb-2">
                  <span className="text-sm font-bold">Nama :</span>
                  <span className="border-b-2 border-dotted border-gray-800 inline-block min-w-[250px] ml-2"></span>
                </div>
                <p className="text-sm mb-1.5" style={{ lineHeight: '1.3' }}>...........................................................................</p>
                <p className="text-sm font-bold mb-1" style={{ lineHeight: '1.3' }}>(Tandatangan Pegawai Yang Meluluskan)</p>
                <p className="text-sm font-bold" style={{ lineHeight: '1.3' }}>Pengarah Hospital Daerah, Lawas.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Financial Department Use */}
        <div className="px-8 py-1 border-t-2 border-dotted border-gray-800">
          <p className="text-sm font-bold text-center mb-2" style={{ lineHeight: '1.3' }}>UNTUK KEGUNAAN BAHAGIAN KEWANGAN</p>
          <div className="mb-2">
            <p className="text-sm font-bold mb-1" style={{ lineHeight: '1.3' }}>Kerani Kewangan</p>
            <div className="flex justify-between items-start">
              <div className="ml-8 space-y-1">
                <p className="text-sm" style={{ lineHeight: '1.3' }}>(iii) Sila Keluarkan Pesanan Kerajaan</p>
                <p className="text-sm" style={{ lineHeight: '1.3' }}>(iv) Sila dapatkan Sebut harga.</p>
              </div>
              <div className="text-right">
                <p className="text-sm mb-1" style={{ lineHeight: '1.2' }}>---------------------------------------------------</p>
                <p className="text-sm font-bold mb-0.5" style={{ lineHeight: '1.2' }}>(Bahagian Kewangan)</p>
                <p className="text-sm font-bold mb-0.5" style={{ lineHeight: '1.2' }}>B.P. Pengarah Hospital Daerah,</p>
                <p className="text-sm font-bold" style={{ lineHeight: '1.2' }}>Lawas.</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold mb-1" style={{ lineHeight: '1.3' }}>Catatan :</p>
            <p className="text-sm font-bold mb-1" style={{ lineHeight: '1.3' }}>No. Rujukan Pesanan Kerajaan:</p>
            <div className="border-b-2 border-dotted border-gray-800 w-1/2 mb-1"></div>
            <div className="border-b-2 border-dotted border-gray-800 w-1/2 mb-1"></div>
            <p className="text-sm font-bold mb-1" style={{ lineHeight: '1.3' }}>Tarikh :</p>
            <div className="border-b-2 border-dotted border-gray-800 w-1/2"></div>
          </div>
        </div>

        {/* Document Footer */}
        <div className="px-8 py-4 bg-gray-100 border-t-2 border-gray-800">
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-700">
              Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Dikeluarkan oleh Sistem Pengurusan Operasi Hospital / Issued by Hospital Operation Management System
            </p>
          </div>
        </div>
      </div>

      {/* Government Form Print Layout - Professional 2-Page Design */}
      <div ref={printContentRef} className="print-form hidden print:block bg-white" style={{ width: '210mm' }}>
        {/* PAGE 1 - Professional Government Document Layout */}
        <div className="page" style={{ fontFamily: "'Times New Roman', serif", fontSize: '11pt', padding: '20mm', width: '210mm', height: '297mm' }}>
          <div className="text-center" style={{ marginBottom: '10px' }}>
            <h1 style={{ fontSize: '13pt', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '3px', lineHeight: '1.2' }}>BORANG PERMOHONAN UNTUK PENGELUARAN</h1>
            <h1 style={{ fontSize: '13pt', fontWeight: 'bold', letterSpacing: '0.5px', lineHeight: '1.2' }}>PESANAN KERAJAAN</h1>
          </div>

          <div style={{ marginBottom: '8px', fontSize: '11pt' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '2px', lineHeight: '1.3' }}>Pengarah Hospital Daerah Lawas,</p>
            <p style={{ fontWeight: 'bold', marginBottom: '2px', lineHeight: '1.3' }}>Lawas.</p>
            <p style={{ fontWeight: 'bold', lineHeight: '1.3' }}>(U/P : Bahagian Kewangan)</p>
          </div>

          <div style={{ marginBottom: '8px', fontSize: '11pt' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '3px', lineHeight: '1.3' }}>Tuan,</p>
            <p style={{ lineHeight: '1.4', marginBottom: '0' }}>
              Sukacita sekiranya tuan dapat mengeluarkan Pesanan kerajaan untuk <strong>No Pesanan: {order.po_number}</strong>
              <br />
              Pembelian/Perkhidmatan/Percetakan/Penyewaan perkara-perkara seperti berikut : -
            </p>
          </div>

          <table className="print-table" style={{ marginBottom: '8px', border: '2px solid #000', borderCollapse: 'collapse', width: '100%', marginTop: '6px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', width: '5%', textAlign: 'center', fontSize: '11pt', padding: '5px 4px', fontWeight: 'bold' }}>Bil</th>
                <th style={{ border: '1px solid #000', width: '45%', textAlign: 'center', fontSize: '11pt', padding: '5px 4px', fontWeight: 'bold' }}>Butir-butir Barang/Perkhidmatan yang diperlukan</th>
                <th style={{ border: '1px solid #000', width: '10%', textAlign: 'center', fontSize: '11pt', padding: '5px 4px', fontWeight: 'bold' }}>Jumlah<br/>(Unit)</th>
                <th style={{ border: '1px solid #000', width: '12.5%', textAlign: 'center', fontSize: '11pt', padding: '5px 4px', fontWeight: 'bold' }}>Satu Unit (RM)</th>
                <th style={{ border: '1px solid #000', width: '12.5%', textAlign: 'center', fontSize: '11pt', padding: '5px 4px', fontWeight: 'bold' }}>Jumlah (RM)</th>
                <th style={{ border: '1px solid #000', width: '15%', textAlign: 'center', fontSize: '11pt', padding: '5px 4px', fontWeight: 'bold' }}>Justifikasi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} style={{ verticalAlign: 'top' }}>
                  <td style={{ border: '1px solid #000', textAlign: 'center', padding: '6px 4px', fontSize: '11pt', verticalAlign: 'top' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '6px 4px', fontSize: '11pt', verticalAlign: 'top', lineHeight: '1.4' }}>
                    {index === 0 && (
                      <p style={{ marginBottom: '4px', lineHeight: '1.4' }}>Sila bekalkan butiran berikut :</p>
                    )}
                    <div style={{ marginTop: index === 0 ? '4px' : '0' }}>
                      <div style={{ fontSize: '11pt', lineHeight: '1.4' }}>
                        - {item.item_name} {item.packaging_description ? `(${item.packaging_description})` : ''}
                      </div>
                    </div>
                  </td>
                  <td style={{ border: '1px solid #000', textAlign: 'center', padding: '6px 4px', fontSize: '11pt', verticalAlign: 'middle' }}>
                    {item.quantity_ordered || '-'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', fontSize: '11pt', verticalAlign: 'middle' }}>
                    {item.unit_price ? formatCurrencyMalay(item.unit_price) : '-'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', fontSize: '11pt', verticalAlign: 'middle' }}>
                    {item.quantity_ordered && item.unit_price ? formatCurrencyMalay(item.quantity_ordered * item.unit_price) : '-'}
                  </td>
                  {index === 0 && (
                    <td rowSpan={items.length} style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11pt', lineHeight: '1.4' }}>
                      <p style={{ marginBottom: '3px' }}>Bekalan</p>
                      <p style={{ fontWeight: 'bold', marginBottom: '3px' }}>{order.category === 'drug' ? 'UBAT' : 'BUKAN UBAT'}</p>
                      <p style={{ marginBottom: '3px' }}>Hospital</p>
                      <p>Lawas.</p>
                    </td>
                  )}
                </tr>
              ))}
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <td colSpan={4} style={{ border: '1px solid #000', textAlign: 'left', fontWeight: 'bold', padding: '6px 4px', fontSize: '11pt' }}>Jumlah Keseluruhan</td>
                <td style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '11pt' }}>
                  {formatCurrencyMalay(total)}
                </td>
                <td style={{ border: '1px solid #000', backgroundColor: '#f0f0f0', padding: '6px 4px' }}></td>
              </tr>
            </tbody>
          </table>

          {/* Section 2 - Financial Allocation */}
          <div style={{ marginBottom: '8px', fontSize: '11pt', marginTop: '6px' }}>
            <p style={{ marginBottom: '4px', lineHeight: '1.4' }}>2. Sila tuan tanggungkan pembelian ini kepada :</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <table style={{ width: '70%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11pt' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '4px 6px', width: '8%', textAlign: 'center', fontSize: '11pt' }}>(i)</td>
                    <td style={{ border: '1px solid #000', padding: '4px 6px', width: '42%', fontSize: '11pt' }}>Aktiviti No. :</td>
                    <td style={{ border: '1px solid #000', padding: '4px 6px', width: '50%', textAlign: 'center', fontSize: '11pt' }}>{order.vote_code || '990102'}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontSize: '11pt' }}>(ii)</td>
                    <td style={{ border: '1px solid #000', padding: '4px 6px', fontSize: '11pt', lineHeight: '1.4' }}>
                      Pecahan kepala :
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontSize: '11pt' }}>
                      {order.vote_activity || '27401'}<br/>
                      <span style={{ fontWeight: 'bold' }}>{order.department ? order.department.toUpperCase() : (order.category === 'drug' ? 'PHARMACY' : 'BUKAN UBAT')}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontSize: '11pt' }}>(iii)</td>
                    <td style={{ border: '1px solid #000', padding: '4px 6px', fontSize: '11pt' }}>Baki peruntukan :</td>
                    <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11pt' }}>
                      {balance !== null ? formatCurrencyMalay(balance) : 'RM 404,709.99'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Section - Signature and Balance Summary */}
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11pt' }}>
            {/* Left - Signature */}
            <div style={{ width: '45%', textAlign: 'left' }}>
              <p style={{ marginBottom: '4px', lineHeight: '1.4' }}>...........................................................................</p>
              <p style={{ fontWeight: 'bold', marginBottom: '3px', lineHeight: '1.4' }}>(Tandatangan)</p>
              <p style={{ fontWeight: 'bold', marginBottom: '3px', lineHeight: '1.4' }}>Pegawai Yang Mengesahkan Peruntukan</p>
              <p style={{ fontWeight: 'bold', lineHeight: '1.4' }}>Pengarah Hospital Lawas</p>
            </div>
            {/* Right - Balance Summary */}
            <div style={{ width: '45%', textAlign: 'right' }}>
              <div style={{ marginBottom: '4px', lineHeight: '1.4' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11pt' }}>Baki Sebelum / Balance Before: </span>
                <span style={{ fontWeight: 'bold', fontSize: '11pt' }}>
                  {balance !== null ? formatCurrencyMalay(balance + total) : 'RM 0.00'}
                </span>
              </div>
              <div style={{ marginBottom: '4px', lineHeight: '1.4' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11pt' }}>Jumlah Keseluruhan / Total Amount: </span>
                <span style={{ fontWeight: 'bold', fontSize: '12pt' }}>{formatCurrencyMalay(total)}</span>
              </div>
              <div style={{ lineHeight: '1.4' }}>
                <span style={{ fontWeight: 'bold', fontSize: '12pt' }}>Baki Selepas / Balance After: </span>
                <span style={{ fontWeight: 'bold', fontSize: '12pt' }}>
                  {balance !== null ? formatCurrencyMalay(balance) : 'RM 0.00'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* PAGE 2 - Professional Government Document Layout */}
        <div className="page" style={{ fontFamily: "'Times New Roman', serif", fontSize: '11pt', padding: '20mm', width: '210mm', height: '297mm' }}>
          <div style={{ marginBottom: '10px', fontSize: '11pt' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <table style={{ width: '80%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '11pt' }}>
                <tbody>
                  <tr style={{ height: '55px' }}>
                    <td style={{ border: '1px solid #000', padding: '5px', width: '30%', fontWeight: 'bold', verticalAlign: 'top', fontSize: '11pt' }}>Nama Pembekal :</td>
                    <td style={{ border: '1px solid #000', padding: '5px', width: '70%', fontWeight: 'bold', verticalAlign: 'top', textTransform: 'uppercase', fontSize: '11pt', lineHeight: '1.3' }}>
                      {order.supplier?.company_name || 'PHARMANIAGA LOGISTICS SDN BHD'}
                      <br />
                      <span style={{ fontWeight: 'normal', fontSize: '10pt', textTransform: 'none' }}>{order.supplier?.address || 'NO 7, LORONG KELULI 1B, KAWASAN PERINDUSTRIAN BUKIT RAJA SELATAN, SEKSYEN 7, 40000 SHAH ALAM SELANGOR'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', fontSize: '11pt' }}>No. Telefon :</td>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', fontSize: '11pt' }}>{order.supplier?.phone || '03-33429999'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginBottom: '10px', fontSize: '11pt' }}>
            <p style={{ marginBottom: '4px', lineHeight: '1.3' }}>Berdaftar dengan Pejabat Kewangan Persekutuan Sarawak ( Ya / Tidak )</p>
            <div style={{ borderBottom: '1px dotted #000', width: '200px', display: 'inline-block', marginBottom: '4px' }}></div>
            <p style={{ marginTop: '6px', lineHeight: '1.3' }}>No. Rujukan Pendaftaran :</p>
            <div style={{ borderBottom: '1px dotted #000', width: '200px', display: 'inline-block' }}></div>
          </div>

          <div style={{ marginBottom: '12px', fontSize: '11pt' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4px', lineHeight: '1.3' }}>Bersama-sama ini dinyatakan (Penuhkan mana yang sesuai).</p>
            <div style={{ marginLeft: '16px' }}>
              <p style={{ marginBottom: '4px', fontSize: '11pt', lineHeight: '1.3' }}>
                (i) No. rujukan surat mampu : 
                <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '250px', marginLeft: '8px' }}></span>
              </p>
              <p style={{ marginBottom: '4px', fontSize: '11pt', lineHeight: '1.3' }}>
                (ii) No. rujukan kontrak : 
                <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '250px', marginLeft: '8px' }}></span>
              </p>
              <p style={{ fontSize: '11pt', lineHeight: '1.3' }}>
                (iii) Salinan surat kelulusan Pejabat Kewangan Persekutuan Bil.:
                <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '150px', marginLeft: '8px' }}></span>
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '12px', fontSize: '11pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: '1' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Tarikh :</span>
                  <span style={{ fontWeight: 'bold' }}>{formatDateMalay(order.order_date)}</span>
                </div>
              </div>
              <div style={{ flex: '1', textAlign: 'right' }}>
                <p style={{ marginBottom: '4px', lineHeight: '1.4' }}>...........................................................................</p>
                <p style={{ fontWeight: 'bold', marginBottom: '8px', lineHeight: '1.3' }}>(Tandatangan Pegawai yang Memohon.)</p>
                <div style={{ textAlign: 'left', display: 'inline-block' }}>
                  <table style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
                    <colgroup>
                      <col style={{ width: '70px' }} />
                      <col />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td style={{ padding: 0, paddingRight: '8px', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 'bold' }}>Nama :</span>
                        </td>
                        <td style={{ padding: 0, textAlign: 'left', verticalAlign: 'top' }}>
                          <span style={{ fontWeight: 'bold' }}>{signatures.applicantName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 0, paddingRight: '8px', paddingTop: '4px', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 'bold' }}>Jawatan :</span>
                        </td>
                        <td style={{ padding: 0, paddingTop: '4px', textAlign: 'left', verticalAlign: 'top' }}>
                          <span style={{ fontWeight: 'bold' }}>{signatures.applicantPosition}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '12px', fontSize: '11pt' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4px', lineHeight: '1.3' }}>Akaun Ketua Bahagian.</p>
            <div style={{ marginLeft: '32px', marginBottom: '8px' }}>
              <p style={{ marginBottom: '4px', fontSize: '11pt', lineHeight: '1.3' }}>(i) Adalah disahkan pembelian ini telah dimasukan dalam cadangan anggaran Belanjawan tahunan.</p>
              <p style={{ fontSize: '11pt', lineHeight: '1.3' }}>(ii) Pembelian ini adalah diperlukan.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '40px' }}>
              <div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Tarikh :</span>
                  <span style={{ fontWeight: 'bold' }}>{formatDateMalay(order.order_date)}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flex: '1' }}>
                <p style={{ marginBottom: '3px', lineHeight: '1.3' }}>....................................................</p>
                <p style={{ fontWeight: 'bold', marginBottom: '4px', lineHeight: '1.3' }}>(Tandatangan Ketua Bahagian)</p>
                <div style={{ display: 'inline-block', textAlign: 'left' }}>
                  <table style={{ borderCollapse: 'collapse', borderSpacing: 0, margin: '0 auto' }}>
                    <colgroup>
                      <col style={{ width: '70px' }} />
                      <col />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td style={{ padding: 0, paddingRight: '8px', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 'bold' }}>Nama :</span>
                        </td>
                        <td style={{ padding: 0, textAlign: 'left', verticalAlign: 'top' }}>
                          <span style={{ fontWeight: 'bold' }}>{signatures.headName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 0, paddingRight: '8px', paddingTop: '4px', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 'bold' }}>Jawatan :</span>
                        </td>
                        <td style={{ padding: 0, paddingTop: '4px', textAlign: 'left', verticalAlign: 'top' }}>
                          <span style={{ fontWeight: 'bold' }}>{signatures.headPosition}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '12px', fontSize: '11pt' }}>
            <p style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '8px', lineHeight: '1.3', textAlign: 'center' }}>Permohonan diluluskan/ tidak diluluskan.</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '40px' }}>
              <div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Tarikh :</span>
                  <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '200px' }}></span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flex: '1' }}>
                <div style={{ marginBottom: '3px' }}>
                  <span style={{ fontWeight: 'bold' }}>Nama :</span>
                  <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '200px', marginLeft: '8px' }}></span>
                </div>
                <p style={{ marginBottom: '3px', lineHeight: '1.3' }}>...........................................................................</p>
                <p style={{ fontWeight: 'bold', marginBottom: '3px', lineHeight: '1.3' }}>(Tandatangan Pegawai Yang Meluluskan)</p>
                <p style={{ fontWeight: 'bold', lineHeight: '1.3' }}>Pengarah Hospital Daerah, Lawas.</p>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '2px dotted #000', paddingTop: '6px', fontSize: '11pt', marginTop: '12px' }}>
            <p style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '6px', lineHeight: '1.3' }}>UNTUK KEGUNAAN BAHAGIAN KEWANGAN</p>
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '4px', lineHeight: '1.3' }}>Kerani Kewangan</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ marginLeft: '32px' }}>
                  <p style={{ marginBottom: '4px', fontSize: '11pt', lineHeight: '1.3' }}>(iii) Sila Keluarkan Pesanan Kerajaan</p>
                  <p style={{ fontSize: '11pt', lineHeight: '1.3' }}>(iv) Sila dapatkan Sebut harga.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ marginBottom: '4px', lineHeight: '1.3' }}>---------------------------------------------------</p>
                  <p style={{ fontWeight: 'bold', marginBottom: '2px', lineHeight: '1.3' }}>(Bahagian Kewangan)</p>
                  <p style={{ fontWeight: 'bold', marginBottom: '2px', lineHeight: '1.3' }}>B.P. Pengarah Hospital Daerah,</p>
                  <p style={{ fontWeight: 'bold', lineHeight: '1.3' }}>Lawas.</p>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11pt' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '4px', lineHeight: '1.3' }}>Catatan :</p>
              <p style={{ fontWeight: 'bold', marginBottom: '4px', lineHeight: '1.3' }}>No. Rujukan Pesanan Kerajaan:</p>
              <div style={{ borderBottom: '1px dotted #000', width: '50%', marginBottom: '4px' }}></div>
              <div style={{ borderBottom: '1px dotted #000', width: '50%', marginBottom: '4px' }}></div>
              <p style={{ fontWeight: 'bold', marginBottom: '4px', lineHeight: '1.3' }}>Tarikh :</p>
              <div style={{ borderBottom: '1px dotted #000', width: '50%' }}></div>
            </div>
          </div>
        </div>

        {/* Supplier Account Document and MOF Certificate are merged programmatically via pdfMergeService */}
      </div>

      {/* Cancel PO dialog */}
      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => {
          if (isCancelling) return
          setShowCancelDialog(false)
          setCancelReason('')
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel Purchase Order"
        message={`Are you sure you want to cancel purchase order ${order.po_number}? This action cannot be undone.`}
        variant="danger"
        confirmText="Cancel PO"
        cancelText="Close"
        isLoading={isCancelling}
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Cancellation Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={4}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Explain why this purchase order is being cancelled"
          />
          <p className="text-xs text-gray-500">
            The reason will be recorded together with this purchase order.
          </p>
        </div>
      </ConfirmationDialog>

      {/* Submit for Approval dialog */}
      <ConfirmationDialog
        isOpen={showSubmitDialog}
        onClose={() => {
          if (isSubmitting) return
          setShowSubmitDialog(false)
        }}
        onConfirm={handleSubmitForApproval}
        title="Submit for Approval"
        message={`Are you sure you want to submit purchase order ${order.po_number} for approval? Once submitted, you will not be able to edit it until it is approved or rejected.`}
        variant="info"
        confirmText="Submit"
        cancelText="Cancel"
        isLoading={isSubmitting}
      />

      {/* Approve PO dialog */}
      <ConfirmationDialog
        isOpen={showApproveDialog}
        onClose={() => {
          if (isApproving) return
          setShowApproveDialog(false)
        }}
        onConfirm={handleApprove}
        title="Approve Purchase Order"
        message={`Are you sure you want to approve purchase order ${order.po_number}? This will allow it to be sent to the supplier.`}
        variant="success"
        confirmText="Approve"
        cancelText="Cancel"
        isLoading={isApproving}
      />

      {/* Send to Supplier dialog */}
      <ConfirmationDialog
        isOpen={showSendDialog}
        onClose={() => {
          if (isSending) return
          setShowSendDialog(false)
        }}
        onConfirm={handleSendToSupplier}
        title="Send to Supplier"
        message={`Are you sure you want to send purchase order ${order.po_number} to ${order.supplier?.company_name || 'the supplier'}? This action will mark the order as sent.`}
        variant="info"
        confirmText="Send"
        cancelText="Cancel"
        isLoading={isSending}
      />

      {/* Delete PO dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          if (isDeleting) return
          setShowDeleteDialog(false)
          setDeleteReason('')
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase Order"
        message={`Are you sure you want to delete purchase order ${order.po_number}? This action cannot be undone and all associated data will be permanently removed.`}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Deletion Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={4}
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Explain why this purchase order is being deleted"
          />
          <p className="text-xs text-gray-500">
            The reason will be logged for audit purposes.
          </p>
        </div>
      </ConfirmationDialog>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="PO Signature Settings"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Pegawai yang Memohon (Applicant Officer)</h3>
              <div className="space-y-3">
                <Input
                  label="Nama (Name)"
                  value={tempSignatures.applicantName}
                  onChange={(e) => setTempSignatures({ ...tempSignatures, applicantName: e.target.value })}
                />
                <Input
                  label="Jawatan (Position)"
                  value={tempSignatures.applicantPosition}
                  onChange={(e) => setTempSignatures({ ...tempSignatures, applicantPosition: e.target.value })}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Ketua Bahagian (Head of Department)</h3>
              <div className="space-y-3">
                <Input
                  label="Nama (Name)"
                  value={tempSignatures.headName}
                  onChange={(e) => setTempSignatures({ ...tempSignatures, headName: e.target.value })}
                />
                <Input
                  label="Jawatan (Position)"
                  value={tempSignatures.headPosition}
                  onChange={(e) => setTempSignatures({ ...tempSignatures, headPosition: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowSettingsModal(false)} disabled={isSavingSettings}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSettings} isLoading={isSavingSettings}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </>
  )
}

export default PurchaseOrderDetailPage

