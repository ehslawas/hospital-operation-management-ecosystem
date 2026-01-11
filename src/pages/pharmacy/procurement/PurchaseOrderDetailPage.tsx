import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, ShoppingCart, Edit2, Trash2, Send, CheckCircle, FileCheck, Settings, XCircle, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Spinner, Badge, ConfirmationDialog, Modal, Input } from '@/components/ui'
import { getPurchaseOrderById, rejectPurchaseOrder, deletePurchaseOrder, submitPurchaseOrder, approvePurchaseOrder, sendPurchaseOrder } from '@/services/pharmacy/procurementService'
import { findContractByNumber } from '@/services/pharmacy/contractCatalogService'
import { supabase } from '@/services/supabase'
import { getWarrants, getWarrantSummary } from '@/services/pharmacy/warrantService'
import { getPharmacyPOSignatures, updatePharmacyPOSignatures, type PharmacyPOSignatures } from '@/services/pharmacy/pharmacySettingsService'
import { mergePOWithSupplierDocs, openPdfForPrint, cleanupPdfUrl } from '@/services/pharmacy/pdfMergeService'
import type { PurchaseOrderWithRelations, PurchaseOrderItem, ContractWithRelations } from '@/types/pharmacy'
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
  const isPharmacyLogistic = user?.department?.department_name === 'Pharmacy Logistic' || user?.role?.role_name === 'Pharmacy Logistic'
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

  const [contract, setContract] = useState<ContractWithRelations | null>(null)

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

  // Load contract details if KKM contract
  useEffect(() => {
    if (!order || !hospitalId || order.vote_code !== '080702' || !order.kkm_contract_number) return

    const loadContract = async () => {
      console.log('Fetching contract for:', order.kkm_contract_number, 'Hospital:', hospitalId)
      const res = await findContractByNumber(hospitalId, order.kkm_contract_number!)
      console.log('Contract fetch result:', res)
      if (res.data) {
        setContract(res.data)
      }
    }
    void loadContract()
  }, [order?.id, order?.vote_code, order?.kkm_contract_number, hospitalId])

  console.log('Current state - Order:', order?.po_number, 'KKM:', order?.kkm_contract_number, 'Contract:', contract)

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
          if (result.data.vote_code && result.data.vote_activity && result.data.department) {
            try {
              const currentYear = new Date().getFullYear()
              const summary = await getWarrantSummary(hospitalId, currentYear, {
                voteCode: result.data.vote_code as any,
                department: (result.data.department.toLowerCase().replace(/\s+/g, '_')) as any, // unexpected format handling
                category: result.data.category as any
              })

              if (summary.data) {
                // balance before this PO = remaining balance + current PO amount (since remaining already deducts it if synced, or if we assume pending deducts)
                // Wait, if pending_approval does NOT deduct in backend yet? The user wants "Balance Before" (budget available) and "Balance After" (budget - PO).
                // getWarrantSummary remaining_balance is (allocation - expenses).
                // If this PO is pending, it might NOT be in expenses yet.
                // So remaining_balance is "Balance Before".
                // Balance After = remaining_balance - poAmount.

                // However, we need to be careful.
                // Let's assume remaining_balance is the ACTUAL available balance right now.
                // If the PO is already submitted/sync'd, it affects the balance.

                // User request: "baki sebelum, baki selepas"

                setBalance(summary.data.total_balance)
              }
            } catch (error) {
              console.error('Error loading balance:', error)
            }
          }

          // Load item details from Supabase
          const itemsWithDetails = await Promise.all(
            (result.data.items || []).map(async (item: PurchaseOrderItem) => {
              try {
                if (item.item_type === 'manual') {
                  return item
                }
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

    // Always generate PDF for professional quality and to avoid layout issues
    setIsPrinting(true)

    try {
      const printForm = printContentRef.current

      if (!printForm) {
        throw new Error('Print form element not found')
      }

      // Temporarily show the print form so pdfMergeService can access it
      // Store original classes and styles to restore later
      const originalClasses = printForm.className
      const originalDisplay = (printForm as HTMLElement).style.display
      const originalVisibility = (printForm as HTMLElement).style.visibility
      const originalPosition = (printForm as HTMLElement).style.position

      // Make element visible for PDF conversion - Force all styles
      printForm.className = printForm.className.replace(/hidden/g, '').trim()
      const printFormEl = printForm as HTMLElement

      // Force visibility with !important-equivalent inline styles
      // Position it off-screen but ensure it's still in the layout flow
      printFormEl.style.setProperty('display', 'block', 'important')
      printFormEl.style.setProperty('visibility', 'visible', 'important')
      printFormEl.style.setProperty('position', 'fixed', 'important')
      printFormEl.style.setProperty('left', '0', 'important')
      printFormEl.style.setProperty('top', '0', 'important')
      printFormEl.style.setProperty('width', '210mm', 'important')
      printFormEl.style.setProperty('height', 'auto', 'important')
      printFormEl.style.setProperty('opacity', '0.01', 'important') // Nearly invisible but still rendered
      printFormEl.style.setProperty('z-index', '9999', 'important')
      printFormEl.style.setProperty('pointer-events', 'none', 'important') // Don't block interactions

      // Also ensure all child .page elements are visible
      let allPages = printFormEl.querySelectorAll('.page')
      allPages.forEach((page) => {
        const pageEl = page as HTMLElement
        pageEl.style.setProperty('display', 'block', 'important')
        pageEl.style.setProperty('visibility', 'visible', 'important')
        pageEl.style.setProperty('opacity', '1', 'important')
      })

      // Wait for element to render and verify .page elements exist
      // Force a reflow to ensure React has rendered
      void printFormEl.offsetHeight
      await new Promise(resolve => setTimeout(resolve, 200))

      // Double-check .page elements exist - re-query to ensure we have the latest
      // Force multiple reflows to ensure React has fully rendered
      void printFormEl.offsetHeight
      void printFormEl.scrollHeight
      await new Promise(resolve => requestAnimationFrame(resolve))
      await new Promise(resolve => requestAnimationFrame(resolve))

      allPages = printFormEl.querySelectorAll('.page')
      console.log(`After rendering: Found ${allPages.length} .page element(s)`)
      console.log('Print form computed display:', window.getComputedStyle(printFormEl).display)
      console.log('Print form isConnected:', printFormEl.isConnected)
      console.log('Print form has childNodes:', printFormEl.childNodes.length)

      if (allPages.length === 0) {
        // Try to find any elements with 'page' in className as fallback
        const allDivs = printFormEl.querySelectorAll('div')
        const potentialPages = Array.from(allDivs).filter(div =>
          div.className && (div.className.includes('page') || div.className.includes('bg-white'))
        )
        console.error('Print form structure (first 1000 chars):', printFormEl.innerHTML.substring(0, 1000))
        console.error('Print form classes:', printFormEl.className)
        console.error('Found potential page elements:', potentialPages.length)
        console.error('All div classes:', Array.from(allDivs).slice(0, 5).map(d => d.className))

        throw new Error(`No .page elements found in print form. Found ${potentialPages.length} potential page elements. Element may not be rendered yet.`)
      }

      console.log(`✓ Successfully found ${allPages.length} .page element(s) for PDF conversion`)

      try {
        // Verify element is still visible before passing to pdfMergeService
        const finalCheck = printFormEl.querySelectorAll('.page')
        if (finalCheck.length === 0) {
          throw new Error('Page elements disappeared before PDF conversion. This should not happen.')
        }

        // The pdfMergeService will handle rendering in a temporary container
        const result = await mergePOWithSupplierDocs({
          poElement: printForm,
          accountDocumentUrl: order.supplier?.account_document_url,
          mofCertificateUrl: order.supplier?.mof_certificate_url,
          poNumber: order.po_number,
        })

        // Restore original classes and styles
        printFormEl.className = originalClasses

        // Clear all forced styles
        printFormEl.style.removeProperty('display')
        printFormEl.style.removeProperty('visibility')
        printFormEl.style.removeProperty('position')
        printFormEl.style.removeProperty('left')
        printFormEl.style.removeProperty('top')
        printFormEl.style.removeProperty('opacity')
        printFormEl.style.removeProperty('z-index')
        printFormEl.style.removeProperty('width')
        printFormEl.style.removeProperty('height')
        printFormEl.style.removeProperty('pointer-events')

        // Restore original styles if they existed
        if (originalDisplay) printFormEl.style.display = originalDisplay
        if (originalVisibility) printFormEl.style.visibility = originalVisibility
        if (originalPosition) printFormEl.style.position = originalPosition

        // Clear forced styles from .page elements
        allPages.forEach((page) => {
          const pageEl = page as HTMLElement
          pageEl.style.removeProperty('display')
          pageEl.style.removeProperty('visibility')
          pageEl.style.removeProperty('opacity')
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
      } catch (innerError) {
        // Restore original classes and styles on error
        printFormEl.className = originalClasses

        // Clear all forced styles
        printFormEl.style.removeProperty('display')
        printFormEl.style.removeProperty('visibility')
        printFormEl.style.removeProperty('position')
        printFormEl.style.removeProperty('left')
        printFormEl.style.removeProperty('top')
        printFormEl.style.removeProperty('opacity')
        printFormEl.style.removeProperty('z-index')
        printFormEl.style.removeProperty('width')
        printFormEl.style.removeProperty('height')
        printFormEl.style.removeProperty('pointer-events')

        // Restore original styles if they existed
        if (originalDisplay) printFormEl.style.display = originalDisplay
        if (originalVisibility) printFormEl.style.visibility = originalVisibility
        if (originalPosition) printFormEl.style.position = originalPosition

        // Clear forced styles from .page elements - re-query to get all pages
        const allPagesInError = printFormEl.querySelectorAll('.page')
        allPagesInError.forEach((page) => {
          const pageEl = page as HTMLElement
          pageEl.style.removeProperty('display')
          pageEl.style.removeProperty('visibility')
          pageEl.style.removeProperty('opacity')
        })

        throw innerError
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

    let path: string = ROUTES.PHARMACY_PO_CREATE
    if (order.po_type === 'sq') {
      path = ROUTES.PHARMACY_SQ_CREATE
    } else if (order.po_type === 'manual') {
      path = ROUTES.PHARMACY_MANUAL_CREATE
    }

    navigate(path, {
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

  const formatPosition = (position: string) => {
    if (!position) return ''

    // Format position text to match Malaysian government document standards
    let formatted = position.trim().toUpperCase()

    // Step 1: Normalize all whitespace to single spaces
    formatted = formatted.replace(/\s+/g, ' ')

    // Step 2: Fix grade codes - remove spaces between grade letters and numbers
    // "U 7" -> "U7", "UF 32" -> "UF32"
    formatted = formatted.replace(/\b(U|UF)\s+(\d+)\b/g, '$1$2')

    // Step 3: Fix TBK codes - remove spaces between TBK and number
    // "TBK 2" -> "TBK2", but keep standalone "TBK" as is
    formatted = formatted.replace(/\bTBK\s+(\d+)\b/g, 'TBK$1')

    // Step 4: Standardize PEN abbreviation with proper spacing
    // "PEN." or "PEN" -> "PEN."
    formatted = formatted.replace(/\bPEN\s*\.?\s*/g, 'PEN. ')

    // Step 5: Ensure consistent spacing after periods
    formatted = formatted.replace(/\.\s*([A-Z])/g, '. $1')

    // Step 6: Final cleanup - ensure single spaces between all words
    formatted = formatted.replace(/\s+/g, ' ').trim()

    return formatted
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

  const renderWatermark = () => (
    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0 overflow-hidden print:opacity-[0.05]">
      <img
        src="/512px-Jata_MalaysiaV2.svg.png"
        alt="Watermark"
        style={{ width: '450px', height: '450px', objectFit: 'contain' }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/jata-logo.png';
        }}
      />
    </div>
  )

  const renderPage1Content = () => (
    <div className="page bg-white border-2 border-gray-800 shadow-lg relative" style={{ fontFamily: "'Times New Roman', serif", width: '210mm', height: '297mm', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box', overflow: 'hidden' }}>
      {renderWatermark()}
      {/* Government Document Header */}
      <div className="border-b-2 border-gray-800 bg-white py-3 px-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <img
            src="/512px-Jata_MalaysiaV2.svg.png"
            alt="Jata Negara Malaysia"
            style={{
              width: '64px',
              height: '64px',
              objectFit: 'contain',
              display: 'block'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/jata-logo.png';
            }}
          />
          <div className="text-center border-l-2 border-r-2 border-gray-800 px-4" style={{
            textShadow: 'none',
            letterSpacing: 'normal',
            lineHeight: '1.2'
          }}>
            <h1 className="text-lg font-bold text-gray-900 uppercase mb-0.5" style={{
              textShadow: 'none',
              letterSpacing: '0.05em',
              fontWeight: 'bold',
              lineHeight: '1.2'
            }}>
              KEMENTERIAN KESIHATAN
            </h1>
            <h2 className="text-base font-bold text-gray-800 uppercase" style={{
              textShadow: 'none',
              letterSpacing: '0.03em',
              fontWeight: 'bold',
              lineHeight: '1.2',
              marginTop: '2px'
            }}>
              MINISTRY OF HEALTH MALAYSIA
            </h2>
            <p className="text-xs font-semibold text-gray-700 mt-0.5" style={{
              textShadow: 'none',
              letterSpacing: 'normal',
              lineHeight: '1.3'
            }}>
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

      <div className="px-8 py-3 border-b-2 border-gray-800 bg-gray-50">
        <h4 className="text-xs font-bold text-gray-900 uppercase mb-2">Maklumat Pembekal / Supplier Information</h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="border border-gray-600 p-2 bg-white">
            <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Nama Syarikat / Company Name</label>
            {order.po_type === 'sq' && order.sq_suppliers && order.sq_suppliers.length > 0 ? (
              <div className="space-y-1">
                {order.sq_suppliers.map((supplierName, idx) => (
                  <p key={idx} className="text-sm font-semibold text-gray-900 uppercase">{idx + 1}. {supplierName}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-gray-900 uppercase">{order.supplier?.company_name || '—'}</p>
            )}
          </div>
          {order.po_type !== 'sq' && order.supplier?.address && (
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
                    <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-900">
                      <span className="font-bold">{item.item_name || '—'}</span>
                      {/* SQ Details */}
                      {order.po_type === 'sq' && (
                        <div className="mt-1 text-[10px] font-normal leading-tight text-gray-700">
                          <div className="font-semibold text-blue-700">INV SQ no : </div>
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-700 font-mono">{item.item_code || '—'}</td>
                    <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-900 text-center font-semibold">{item.quantity_ordered}</td>
                    <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-900 text-right font-semibold">{formatCurrency(item.unit_price)}</td>
                    <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-900 text-right font-bold">
                      {formatCurrency(item.quantity_ordered * item.unit_price)}
                    </td>
                    <td className="border border-gray-600 px-2 py-1.5 text-xs text-gray-700">{item.packaging_description || '—'}</td>
                  </tr>
                ))}
                <tr className="bg-gray-200 font-bold border-t-2 border-gray-800">
                  <td colSpan={5} className="border border-gray-800 px-2 py-2 text-xs text-gray-900 uppercase text-right">
                    JUMLAH KESELURUHAN / TOTAL AMOUNT:
                  </td>
                  <td className="border border-gray-800 px-2 py-2 text-xs text-black text-right">
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
              <span className="sig-line min-w-[300px] mb-1"></span>
              <p className="text-[10pt] font-bold text-gray-900 mb-0.5">(Tandatangan)</p>
              <p className="text-[10pt] font-bold text-gray-900 mb-0.5">Pegawai Yang Mengesahkan Peruntukan</p>
              <p className="text-[10pt] font-bold text-gray-900">Pengarah Hospital Lawas</p>
            </div>
          </div>
          {/* Right Box - Financial Summary */}
          <div className="w-full md:w-96 space-y-0.5 border-2 border-black p-0 bg-white ml-auto overflow-hidden">
            <div className="flex justify-between items-center border-b border-black px-2 py-1">
              <span className="text-[9pt] font-bold uppercase">BAKI SEBELUM / BALANCE BEFORE:</span>
              <span className="text-[10pt] font-bold">

                {balance !== null ? formatCurrencyMalay(balance) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-black px-2 py-1 bg-gray-50">
              <span className="text-[10pt] font-bold uppercase">JUMLAH KESELURUHAN / TOTAL AMOUNT:</span>
              <span className="text-[11pt] font-black">{formatCurrencyMalay(total)}</span>
            </div>
            <div className="flex justify-between items-center px-2 py-1">
              <span className="text-[10pt] font-bold uppercase">BAKI SELEPAS / BALANCE AFTER:</span>
              <span className="text-[11pt] font-black">
                {balance !== null ? formatCurrencyMalay(balance - total) : '—'}
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
    </div >
  );

  const renderPage2Content = () => (
    <div className="page bg-white border-2 border-gray-800 shadow-lg relative" style={{ fontFamily: "'Times New Roman', serif", width: '210mm', minHeight: '297mm', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box', overflow: 'hidden' }}>
      {renderWatermark()}
      {/* Section 3: Supplier Details */}
      <div className="px-8 py-1 border-b-2 border-gray-800">
        <div className="flex justify-center">
          <table className="w-full max-w-4xl border-collapse border-2 border-gray-800">
            <tbody>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-bold bg-gray-200 text-sm" style={{ width: '30%', verticalAlign: 'top' }}>Nama Pembekal :</td>
                <td className="border border-gray-800 px-3 py-1.5 font-bold text-sm uppercase" style={{ lineHeight: '1.3' }}>
                  {order.po_type === 'sq' && order.sq_suppliers && order.sq_suppliers.length > 0 ? (
                    order.sq_suppliers.join(', ')
                  ) : (
                    <>
                      {order.supplier?.company_name || '—'}
                      <br />
                      <span className="font-normal text-xs normal-case">{order.supplier?.address || ''}</span>
                    </>
                  )}
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
      <div className="px-8 py-1 border-b-2 border-gray-800">
        <p className="text-sm mb-1" style={{ lineHeight: '1.3' }}>Berdaftar dengan Pejabat Kewangan Persekutuan Sarawak ( Ya / Tidak )</p>
        <div className="sig-line min-w-[350px] mb-1"></div>
        <p className="text-sm mb-1" style={{ lineHeight: '1.3' }}>No. Rujukan Pendaftaran :</p>
        <div className="sig-line min-w-[350px]"></div>
      </div>

      {/* Section 4: Purchase Order Details */}
      <div className="px-8 py-1 border-b-2 border-gray-800">
        <p className="text-sm font-bold text-gray-900 mb-1" style={{ lineHeight: '1.3' }}>Bersama-sama ini dinyatakan (Penuhkan mana yang sesuai).</p>
        <div className="ml-4 space-y-1">
          <p className="text-sm" style={{ lineHeight: '1.4' }}>
            (i) No. rujukan surat mampu :
            <span className="sig-line min-w-[350px] ml-2"></span>
          </p>
          <p className="text-sm" style={{ lineHeight: '1.4' }}>
            (ii) No. rujukan kontrak :
            <span className="sig-line min-w-[350px] ml-2 font-bold pl-2"></span>
          </p>
          <p className="text-sm" style={{ lineHeight: '1.4' }}>
            (iii) Salinan surat kelulusan Pejabat Kewangan Persekutuan Bil.:
            <span className="sig-line min-w-[200px] ml-2"></span>
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
            <span className="sig-line min-w-[250px] mb-1"></span>
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
                      <span className="text-sm font-bold">{formatPosition(signatures.applicantPosition)}</span>
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
            <span className="sig-line min-w-[200px] mb-1"></span>
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Section */}
      <div className="px-8 py-2 border-b-2 border-gray-800">
        <div className="flex justify-between items-start">
          <div style={{ width: '45%' }}>
            <div className="pt-8">
              <p className="text-sm font-bold italic mb-4" style={{ lineHeight: '1.3' }}>Permohonan diluluskan/ tidak diluluskan.</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Tarikh :</span>
                <span className="sig-line flex-1"></span>
              </div>
            </div>
          </div>
          <div className="text-right" style={{ width: '50%' }}>
            <div className="pt-8">
              <div className="mb-2">
                <span className="text-sm font-bold">Nama :</span>
                <span className="sig-line min-w-[250px] ml-2"></span>
              </div>
              <p className="text-sm font-bold mb-1" style={{ lineHeight: '1.3' }}>(Tandatangan Pegawai Yang Meluluskan)</p>
              <p className="text-sm font-bold" style={{ lineHeight: '1.3' }}>Pengarah Hospital Daerah, Lawas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 bg-gray-100 border-t-2 border-gray-800">
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700">
            Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia
          </p>
        </div>
      </div>
    </div>
  );

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
            margin: 0mm !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Only hide the main content area, letting the print-form take over */
          .print-content > *:not(.print-form) {
            display: none !important;
          }

          .print-form {
            display: block !important;
            visibility: visible !important;
            width: 210mm !important;
            margin: 0 auto !important;
          }

          .no-print {
            display: none !important;
          }

          .page {
            width: 210mm !important;
            height: 297mm !important;
            padding: 10mm !important;
            margin: 0 !important;
            position: relative;
            box-sizing: border-box;
            background: white !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex;
            flex-direction: column;
            border: 2px solid #000 !important;
          }
          .page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          /* Professional Typography */
          .print-form, .print-form * {
             font-family: 'Times New Roman', serif !important;
             color: #000 !important;
          }
          /* Precise Table Styling */
          .print-form table {
            border-collapse: collapse !important;
            width: 100% !important;
            border: 1px solid #000 !important;
          }
          .print-form th, .print-form td {
            border: 1px solid #000 !important;
            padding: 4px 6px !important;
            font-size: 10pt !important;
          }
          .print-form th {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
          }
          /* Signature lines */
          .sig-line {
            border-bottom: 1px solid #000 !important;
            display: inline-block;
            min-width: 200px;
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
              <div className="ml-2">
                {renderStatusBadge(order.status)}
              </div>
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

            {/* Approve - Only for pending_approval status and Pharmacy Logistic role */}
            {order.status === 'pending_approval' && isPharmacyLogistic && (
              <Button
                onClick={() => setShowApproveDialog(true)}
                size="sm"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md"
                disabled={isApproving}
              >
                {isApproving ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                {isApproving ? 'Approving...' : 'Approve PO'}
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

            {/* Edit Button - Draft only (lock once submitted) */}
            {order.status === 'draft' && (
              <Button
                onClick={handleEdit}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}

            {/* Cancel/Reject Button - Draft, Pending & Approved */}
            {['draft', 'pending_approval', 'approved'].includes(order.status) && (
              <Button
                onClick={() => setShowCancelDialog(true)}
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 ${order.status === 'pending_approval' && isPharmacyLogistic
                  ? 'border-red-500 text-red-600 hover:bg-red-50'
                  : 'border-red-200 text-red-600 hover:bg-red-50'
                  }`}
              >
                <XCircle className="w-4 h-4" />
                {order.status === 'pending_approval' && isPharmacyLogistic ? 'Reject PO' : 'Cancel'}
              </Button>
            )}
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

            {/* Print Button - restricted for non-logistics unless approved */}
            {(order.status === 'approved' || order.status === 'sent' || isPharmacyLogistic) && (
              <Button
                onClick={handlePrint}
                variant="primary"
                size="sm"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 shadow-sm"
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
                    Cetak / Print
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

        {/* Cancellation Notice - Only for cancelled status */}
        {order.status === 'cancelled' && (
          <div className="bg-red-50 border-2 border-red-600 rounded-lg p-5 no-print mb-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-2 rounded-full ring-2 ring-red-200">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800">PESANAN INI TELAH DIBATALKAN / THIS ORDER HAS BEEN CANCELLED</h3>
                <div className="mt-2 p-3 bg-white border border-red-200 rounded-md">
                  <p className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wider">Sebab Pembatalan / Cancellation Reason:</p>
                  <p className="text-red-700 font-medium text-base">
                    {order.notes?.replace('Cancelled: ', '') || 'No reason provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Professional Government Document View - Screen */}
        <div className="space-y-8 no-print">
          {renderPage1Content()}
          {renderPage2Content()}
        </div>
      </div>

      {/* Government Form Print Layout - HIDDEN ON SCREEN */}
      <div ref={printContentRef} className="print-form hidden print:block">
        <div className="space-y-0 text-black">
          {renderPage1Content()}
          <div className="page-break" style={{ height: '1px', pageBreakAfter: 'always' }}></div>
          {renderPage2Content()}
        </div>
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
        title={order.status === 'pending_approval' && isPharmacyLogistic ? 'Reject Purchase Order' : 'Cancel Purchase Order'}
        message={
          order.status === 'pending_approval' && isPharmacyLogistic
            ? `Are you sure you want to reject purchase order ${order.po_number}? You must provide a reason for the rejection.`
            : `Are you sure you want to cancel purchase order ${order.po_number}? This action cannot be undone.`
        }
        variant="danger"
        confirmText={order.status === 'pending_approval' && isPharmacyLogistic ? 'Reject PO' : 'Cancel PO'}
        cancelText="Close"
        isLoading={isCancelling}
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Cancellation Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Please provide a reason for cancellation..."
            required
          />
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
    </>
  )
}

export default PurchaseOrderDetailPage
