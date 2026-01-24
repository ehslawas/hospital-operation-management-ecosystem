import { useState, useEffect } from 'react'
import { FinancialFilterBar } from '@/components/pharmacy/financial/FinancialFilterBar'
import { Pagination } from '@/components/ui/Pagination'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import {
    FileText,
    Upload,
    Download,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Truck,
    FileCheck,
    CheckCircle,
    Trash2,
    Pencil,
    Loader2
} from 'lucide-react'
import { lpoService } from '@/services/pharmacy/lpoService'
import { orderTrackingService } from '@/services/pharmacy/orderTrackingService'
import { extractLPODeliveryDate } from '@/utils/lpoDateExtractor'
import { extractLPODataFromPDF } from '@/utils/pdfExtractor'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { PurchaseOrderWithRelations } from '@/types/pharmacy'
import { LPOWithRelations } from '@/types/pharmacy/procurementNew'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LPOComparisonModal } from '@/components/pharmacy/procurement/modals/LPOComparisonModal'
import { BulkLPOUpload } from '@/components/pharmacy/procurement/BulkLPOUpload'
import { POItemsModal } from '@/components/pharmacy/procurement/modals/POItemsModal'


// Mock ConfirmationDialog prop fix for custom content
// Since ConfirmationDialog content is typically text, we might need a custom modal or utilize 'children' if supported.
// Looking at ConfirmationDialog.tsx, it supports 'children'.

const VerificationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    lpoNumber,
    isLoading,
    initialDate,
    confidence = 0,
    isValidDate = false
}: {
    isOpen: boolean
    onClose: () => void
    onConfirm: (date: string) => void
    lpoNumber: string
    isLoading: boolean
    initialDate?: string
    confidence?: number
    isValidDate?: boolean
}) => {
    const [date, setDate] = useState(initialDate || '')

    // Update local state if initialDate changes (e.g. after OCR finishes if dialog already open context)
    useEffect(() => {
        if (initialDate) setDate(initialDate)
    }, [initialDate])

    const handleSubmit = () => {
        if (date) onConfirm(date)
    }

    // Determine confidence display
    const getConfidenceDisplay = () => {
        if (!initialDate || !isValidDate) {
            return {
                text: 'Not Detected',
                className: 'text-red-600 bg-red-50 border-red-200',
                icon: <AlertTriangle className="w-3 h-3" />
            }
        }
        if (confidence >= 70) {
            return {
                text: 'Auto-Detected',
                className: 'text-green-600 bg-green-50 border-green-200',
                icon: <CheckCircle2 className="w-3 h-3" />
            }
        }
        return {
            text: 'Low Confidence',
            className: 'text-amber-600 bg-amber-50 border-amber-200',
            icon: <AlertTriangle className="w-3 h-3" />
        }
    }

    const confidenceDisplay = getConfidenceDisplay()

    return (
        <ConfirmationDialog
            isOpen={isOpen}
            onConfirm={handleSubmit}
            onClose={onClose}
            title="Verify LPO & Start Tracking"
            message={`Please confirm the 'Tarikh Serahan' (Delivery Date) for LPO #${lpoNumber}.`}
            variant="info"
            confirmText="Verify & Start Tracking"
            isLoading={isLoading}
        >
            <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tarikh Serahan (On or Before)
                </label>
                <div className="relative">
                    <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                        <span className={`text-xs px-1.5 py-0.5 rounded border flex items-center gap-1 ${confidenceDisplay.className}`}>
                            {confidenceDisplay.icon} {confidenceDisplay.text}
                        </span>
                    </div>
                </div>
                {!initialDate || !isValidDate ? (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Could not reliably detect date from document. Please enter manually.
                    </p>
                ) : confidence < 70 ? (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Low OCR confidence ({Math.round(confidence)}%). Please verify the date is correct.
                    </p>
                ) : (
                    <p className="text-xs text-slate-500 mt-2">
                        We automatically scanned the document for this date. Please verify it is correct.
                    </p>
                )}
            </div>
        </ConfirmationDialog>
    )
}

const RenameLPODialog = ({
    isOpen,
    onClose,
    onConfirm,
    lpoNumber,
    isLoading
}: {
    isOpen: boolean
    onClose: () => void
    onConfirm: (newNumber: string) => void
    lpoNumber: string
    isLoading: boolean
}) => {
    const [newNumber, setNewNumber] = useState(lpoNumber)

    useEffect(() => {
        setNewNumber(lpoNumber)
    }, [lpoNumber, isOpen])

    return (
        <ConfirmationDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={() => onConfirm(newNumber)}
            title="Rename LPO"
            message="Enter the correct LPO number below."
            variant="info"
            confirmText="Save Changes"
            isLoading={isLoading}
        >
            <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    LPO Number
                </label>
                <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    placeholder="e.g. LPO-123456"
                />
                <p className="text-xs text-slate-500 mt-2">
                    This will update the LPO record.
                </p>
            </div>
        </ConfirmationDialog>
    )
}

export default function LPOManagementPage() {
    const { user } = useAuthStore()
    const { success, error: toastError } = useToast()

    // State
    const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending')
    const [isLoading, setIsLoading] = useState(true)
    const [pendingPOs, setPendingPOs] = useState<PurchaseOrderWithRelations[]>([])
    const [allPendingPOs, setAllPendingPOs] = useState<PurchaseOrderWithRelations[]>([])
    const [totalPending, setTotalPending] = useState(0)

    // Approved LPO State
    const [approvedLPOs, setApprovedLPOs] = useState<LPOWithRelations[]>([])
    const [totalApproved, setTotalApproved] = useState(0)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [pendingPage, setPendingPage] = useState(1)
    const [pendingPageSize, setPendingPageSize] = useState(10)
    const [approvedFilterStatus, setApprovedFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPOForItems, setSelectedPOForItems] = useState<PurchaseOrderWithRelations | null>(null)

    // Order Tracking Modal State
    const [selectedLpoForSend, setSelectedLpoForSend] = useState<LPOWithRelations | null>(null)
    const [isSending, setIsSending] = useState(false)
    const [showSendDialog, setShowSendDialog] = useState(false)

    // Verification Modal State
    const [selectedLpoForVerify, setSelectedLpoForVerify] = useState<LPOWithRelations | null>(null)
    const [showVerifyDialog, setShowVerifyDialog] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Rename State
    const [selectedLpoForRename, setSelectedLpoForRename] = useState<LPOWithRelations | null>(null)
    const [showRenameDialog, setShowRenameDialog] = useState(false)
    const [isRenaming, setIsRenaming] = useState(false)


    const [detectedDate, setDetectedDate] = useState<string>('')
    const [detectedConfidence, setDetectedConfidence] = useState<number>(0)
    const [detectedIsValid, setDetectedIsValid] = useState<boolean>(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const [isFixingDates, setIsFixingDates] = useState(false)

    // Deletion State
    const [selectedLpoForDelete, setSelectedLpoForDelete] = useState<LPOWithRelations | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    // Comparison Modal State
    const [comparisonData, setComparisonData] = useState<{ url: string; poId: string; lpoNumber: string } | null>(null)
    const [showBulkUpload, setShowBulkUpload] = useState(false)

    // Initial Data Fetch
    useEffect(() => {
        fetchData()
    }, [user?.hospital_id, activeTab, page, pageSize, pendingPage, pendingPageSize, approvedFilterStatus])

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData()
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const fetchData = async () => {
        if (!user?.hospital_id) return

        setIsLoading(true)
        try {
            // Fetch based on active tab to optimize
            if (activeTab === 'pending') {
                const pendingRes = await lpoService.getPendingLPOs(user.hospital_id, pendingPage, pendingPageSize, searchQuery)
                setPendingPOs(pendingRes.data)
                setTotalPending(pendingRes.total)

                // For bulk upload matching, we need a larger set of pending POs
                const allPendingRes = await lpoService.getPendingLPOs(user.hospital_id, 1, 2000)
                setAllPendingPOs(allPendingRes.data)

                // Also update approved count for KPI correctness (light fetch)
                const approvedRes = await lpoService.getApprovedLPOs(user.hospital_id, 1, 1)
                setTotalApproved(approvedRes.total)
            } else {
                const approvedRes = await lpoService.getApprovedLPOs(
                    user.hospital_id,
                    page,
                    pageSize,
                    approvedFilterStatus,
                    searchQuery
                )
                setApprovedLPOs(approvedRes.data)
                setTotalApproved(approvedRes.total)

                // Update pending count for KPI
                const pendingRes = await lpoService.getPendingLPOs(user.hospital_id, 1, 1000)
                setTotalPending(pendingRes.total)
            }
        } catch (err) {
            console.error('Error fetching LPO data:', err)
            toastError('Failed to load LPO data')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearchChange = (val: string) => {
        setSearchQuery(val)
        setPage(1) // Reset page on search
        setPendingPage(1)
    }

    const handleFilterChange = (val: string) => {
        setApprovedFilterStatus(val as any)
        setPage(1)
        setPendingPage(1)
    }

    // Handle LPO Verification (Trigger Tracking)
    const handleVerifyClick = async (lpo: LPOWithRelations) => {
        // Automatic Verification if date exists
        if (lpo.document_url && (lpo.document_date || lpo.created_at)) {
            // Use existing date (prioritize document_date, else created_at as fallback/safety though logic uses doc_date usually)
            // Actually, if we have document_date, we just send. The service will pick it up.

            if (confirm(`Verify LPO ${lpo.lpo_number} and start tracking? \n(Using Document Date: ${lpo.document_date || 'Today'})`)) {
                setIsVerifying(true)
                try {
                    await lpoService.sendLPO(lpo.id)
                    success('LPO verified successfully. Order tracking started.')
                    fetchData()
                } catch (err) {
                    console.error('Error verifying LPO:', err)
                    toastError('Failed to verify LPO')
                } finally {
                    setIsVerifying(false)
                }
            }
            return
        }

        // Fallback to manual dialog if something is weird
        setSelectedLpoForVerify(lpo)
        setDetectedDate('') // Reset
        setDetectedConfidence(0)
        setDetectedIsValid(false)

        // Start Analysis
        if (lpo.document_url) {
            setIsAnalyzing(true)
            success('Scanning LPO document for delivery date...')

            try {
                const result = await extractLPODeliveryDate(lpo.document_url)
                if (result.date && result.isValid) {
                    setDetectedDate(result.date)
                    setDetectedConfidence(result.confidence)
                    setDetectedIsValid(result.isValid)
                    success(`Date detected with ${Math.round(result.confidence)}% confidence`)
                } else {
                    // No valid date found - will show warning in dialog
                    setDetectedConfidence(result.confidence)
                    setDetectedIsValid(false)
                }
            } catch (e) {
                console.error("OCR Failed", e)
            } finally {
                setIsAnalyzing(false)
            }
        }

        setShowVerifyDialog(true)
    }

    const handleConfirmVerify = async (date: string) => {
        if (!selectedLpoForVerify) return

        setIsVerifying(true)
        try {
            await lpoService.sendLPO(selectedLpoForVerify.id, date)
            success('LPO verified successfully. Order tracking started.')
            setShowVerifyDialog(false)
            fetchData()
        } catch (err) {
            console.error('Error verifying LPO:', err)
            toastError('Failed to verify LPO')
        } finally {
            setIsVerifying(false)
            setSelectedLpoForVerify(null)
        }
    }

    const handleRenameClick = (lpo: LPOWithRelations) => {
        setSelectedLpoForRename(lpo)
        setShowRenameDialog(true)
    }

    const handleConfirmRename = async (newNumber: string) => {
        if (!selectedLpoForRename) return
        if (!newNumber.trim()) {
            toastError("LPO Number cannot be empty")
            return
        }

        setIsRenaming(true)
        try {
            await lpoService.renameLPO(selectedLpoForRename.id, newNumber.trim())
            success('LPO renamed successfully')
            setShowRenameDialog(false)
            fetchData()
        } catch (err: any) {
            console.error('Error renaming LPO:', err)
            toastError(err.message || 'Failed to rename LPO')
        } finally {
            setIsRenaming(false)
            setSelectedLpoForRename(null)
        }
    }

    // Initialize send (not used in new flow but kept for manual triggering if needed)
    const handleSendToSupplier = async () => {
        if (!selectedLpoForSend) return
        setIsSending(true)
        try {
            await lpoService.sendLPO(selectedLpoForSend.id)
            success('LPO sent to supplier successfully')
            setShowSendDialog(false)
            fetchData()
        } catch (err) {
            console.error('Error sending LPO:', err)
            toastError('Failed to send LPO')
        } finally {
            setIsSending(false)
            setSelectedLpoForSend(null)
        }
    }

    // Handle LPO Deletion (Reset)
    const handleDeleteLPO = async () => {
        if (!selectedLpoForDelete) return
        setIsDeleting(true)
        try {
            await lpoService.deleteLPO(selectedLpoForDelete.id)
            success('LPO removed successfully. PO is now pending again.')
            setShowDeleteDialog(false)
            fetchData()
            fetchData()
        } catch (err: any) {
            console.error('Error deleting LPO:', err)
            toastError(`Failed to remove LPO: ${err.message || 'Unknown error'}`)

        }
    }

    // Batch Date Sync for Existing LPOs
    const handleSyncDates = async () => {
        if (!confirm('This will scan all verified LPOs and update their "Est. Delivery" date based on the document. Continue?')) return

        setIsSyncing(true)
        let updatedCount = 0

        try {
            for (const lpo of approvedLPOs) {
                if (lpo.document_url) {
                    try {
                        const { date, rawText } = await extractLPODeliveryDate(lpo.document_url)
                        if (date) {
                            await orderTrackingService.updateDeliveryDate(lpo.id, date)
                            updatedCount++
                            console.log(`Synced LPO ${lpo.lpo_number}: ${date}`)
                        } else {
                            console.log(`No date found for LPO ${lpo.lpo_number}. Raw text snapshot: ${rawText.substring(0, 50)}...`)
                        }
                    } catch (e) {
                        console.error(`Failed to sync date for LPO ${lpo.lpo_number}`, e)
                    }
                }
            }

            if (updatedCount > 0) {
                success(`Successfully synced dates for ${updatedCount} LPOs.`)
            } else {
                toastError('No dates could be extracted. Please check the console for details.')
            }

            fetchData()
        } catch (e) {
            console.error('Batch sync failed', e)
            toastError('Failed to complete batch sync')
        } finally {
            setIsSyncing(false)
        }
    }

    // Fix Document Dates - Extracts "Tarikh Dokumen" from PDFs and updates database
    const handleFixDocumentDates = async () => {
        if (!confirm('This will scan ALL LPO documents and update the "LPO Date" (Tarikh Dokumen) field based on the actual PDF content. This may take a while. Continue?')) return

        setIsFixingDates(true)
        let updatedCount = 0
        let failedCount = 0
        let processedCount = 0

        try {
            success('Fetching all verified LPOs...')
            // Fetch ALL approved LPOs for processing (limit 2000 to be safe)
            const allLPOsResponse = await lpoService.getApprovedLPOs(
                user?.hospital_id || '',
                1,
                2000,
                'all'
            )
            const paramsLPOs = allLPOsResponse.data

            const totalToProcess = paramsLPOs.length
            console.log(`Starting batch fix for ${totalToProcess} LPOs...`)

            for (const lpo of paramsLPOs) {
                processedCount++

                if (!lpo.document_url) {
                    console.log(`Skipping LPO ${lpo.lpo_number}: No document URL`)
                    continue
                }

                try {
                    // Download PDF and extract data
                    const response = await fetch(lpo.document_url)
                    const blob = await response.blob()
                    const file = new File([blob], `${lpo.lpo_number}.pdf`, { type: 'application/pdf' })

                    const extractedData = await extractLPODataFromPDF(file)

                    if (extractedData.lpoDate) {
                        // Update document_date in database
                        await lpoService.updateLPO(lpo.id, { document_date: extractedData.lpoDate })
                        updatedCount++
                        console.log(`[${processedCount}/${totalToProcess}] ✓ Fixed LPO ${lpo.lpo_number}: ${lpo.document_date || 'N/A'} → ${extractedData.lpoDate}`)
                    } else {
                        failedCount++
                        console.warn(`[${processedCount}/${totalToProcess}] ✗ No "Tarikh Dokumen" found in LPO ${lpo.lpo_number}`)
                    }
                } catch (e) {
                    failedCount++
                    console.error(`[${processedCount}/${totalToProcess}] ✗ Failed to process LPO ${lpo.lpo_number}:`, e)
                }
            }

            if (updatedCount > 0) {
                success(`Successfully fixed dates for ${updatedCount} LPOs. ${failedCount > 0 ? `${failedCount} failed.` : ''}`)
            } else {
                toastError(`No dates could be extracted. ${failedCount} LPOs failed.`)
            }

            fetchData() // Refresh view
        } catch (e) {
            console.error('Batch date fix failed:', e)
            toastError('Failed to complete batch date fix')
        } finally {
            setIsFixingDates(false)
        }
    }

    // Handle View Comparison


    const handleViewComparison = (lpo: LPOWithRelations) => {
        if (!lpo.document_url) {
            toastError('Document URL is missing')
            return
        }
        setComparisonData({
            url: lpo.document_url,
            poId: lpo.po_id,
            lpoNumber: lpo.lpo_number
        })
    }

    // Filter Logic
    const filteredPending = pendingPOs

    // Approved LPOs are filtered on server-side now
    const filteredApproved = approvedLPOs

    if (showBulkUpload) {
        return (
            <FinancialPageLayout
                title="Bulk LPO Upload"
                description="Process multiple LPO documents and match them to purchase orders."
                breadcrumbs={[
                    { label: 'Procurement', href: '/pharmacy/procurement' },
                    { label: 'LPO Management', onClick: () => setShowBulkUpload(false) },
                    { label: 'Bulk Upload' }
                ]}
            >
                <BulkLPOUpload
                    pendingPOs={allPendingPOs}
                    onComplete={() => {
                        setShowBulkUpload(false)
                        fetchData()
                        success('Bulk upload processing complete')
                    }}
                    onClose={() => setShowBulkUpload(false)}
                />
            </FinancialPageLayout>
        )
    }

    return (
        <FinancialPageLayout
            title="Letter of Purchase Order (LPO)"
            description="Manage and track government LPO documents and supplier issuances."
            breadcrumbs={[
                { label: 'Procurement', href: '/pharmacy/procurement' },
                { label: 'LPO Management' }
            ]}
        >
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg relative overflow-hidden group">
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                            <FileText size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-blue-100 font-medium mb-1">Total Regular POs</p>
                            <h3 className="text-4xl font-bold">{totalApproved + totalPending}</h3>
                            <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                                <FileText className="w-4 h-4" />
                                <span>Excl. Stock Quotations</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-none shadow-lg relative overflow-hidden group">
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                            <Clock size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-amber-100 font-medium mb-1">Pending LPO</p>
                            <h3 className="text-4xl font-bold">{totalPending}</h3>
                            <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Awaiting Upload</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-violet-500 to-violet-600 text-white border-none shadow-lg relative overflow-hidden group">
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                            <Truck size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-violet-100 font-medium mb-1">Approved & Sent</p>
                            <h3 className="text-4xl font-bold">{totalApproved}</h3>
                            <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>In Progress</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    {/* Comparison Modal */}
                    <LPOComparisonModal
                        isOpen={!!comparisonData}
                        onClose={() => setComparisonData(null)}
                        lpoDocumentUrl={comparisonData?.url || ''}
                        poId={comparisonData?.poId || ''}
                        lpoNumber={comparisonData?.lpoNumber || ''}
                    />

                    <POItemsModal
                        isOpen={!!selectedPOForItems}
                        onClose={() => setSelectedPOForItems(null)}
                        po={selectedPOForItems}
                    />

                    <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                        <div className="flex justify-between items-center mb-6">
                            <TabsList className="bg-white/50 backdrop-blur-md p-1 border border-slate-200/60 rounded-xl">
                                <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm rounded-lg px-4 py-2 transition-all">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Pending LPO
                                    <Badge variant="warning" size="sm" className="ml-2 bg-amber-100 text-amber-700 border-none">
                                        {totalPending}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="approved" className="data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm rounded-lg px-4 py-2 transition-all">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Approved LPO
                                </TabsTrigger>
                            </TabsList>
                        </div>


                        {/* Search & Actions Bar */}
                        <div className="mb-6">
                            <FinancialFilterBar
                                searchValue={searchQuery}
                                onSearchChange={handleSearchChange}
                                searchPlaceholder={activeTab === 'pending' ? "Search Pending POs..." : "Search Approved LPOs..."}
                                selectedYear={new Date().getFullYear()}
                                onYearChange={() => { }} // Placeholder if needed
                                years={[new Date().getFullYear()]} // Placeholder
                                filters={activeTab === 'approved' ? [{
                                    key: 'status',
                                    label: 'Status',
                                    value: approvedFilterStatus,
                                    options: [
                                        { label: 'Verified', value: 'verified' },
                                        { label: 'Not Verified', value: 'unverified' }
                                    ],
                                    onChange: handleFilterChange
                                }] : []}
                                actions={
                                    <>
                                        <Button
                                            onClick={() => setShowBulkUpload(true)}
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm gap-2"
                                        >
                                            <div className="bg-white/20 p-1 rounded">
                                                <Upload className="w-4 h-4 text-white" />
                                            </div>
                                            Bulk Upload LPOs
                                        </Button>
                                        {activeTab === 'approved' && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleFixDocumentDates}
                                                    disabled={isFixingDates}
                                                    className="border-amber-300 text-amber-600 hover:bg-amber-50"
                                                >
                                                    <FileCheck className={`w-4 h-4 mr-2 ${isFixingDates ? 'animate-spin' : ''}`} />
                                                    {isFixingDates ? 'Fixing...' : 'Fix LPO Dates'}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleSyncDates}
                                                    disabled={isSyncing}
                                                    className="border-slate-300 text-slate-600 hover:bg-slate-50"
                                                >
                                                    <Clock className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                                    {isSyncing ? 'Syncing...' : 'Sync Dates'}
                                                </Button>
                                            </>
                                        )}
                                    </>
                                }
                            />
                        </div>

                        {/* PENDING LPOS CONTENT */}
                        <TabsContent value="pending" className="mt-0 focus-visible:outline-none">
                            <div className="glass-card rounded-xl overflow-hidden shadow-sm border border-slate-200/60 bg-white/60 backdrop-blur-md">
                                {isLoading ? (
                                    <div className="flex items-center justify-center p-12">
                                        <Spinner size="lg" className="text-amber-500" />
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow>
                                                <TableHead className="font-semibold text-slate-600 pl-6">PO Number</TableHead>
                                                <TableHead className="font-semibold text-slate-600">Supplier</TableHead>
                                                <TableHead className="font-semibold text-slate-600">LPO Number (Draft)</TableHead>
                                                <TableHead className="font-semibold text-slate-600">LPO Date</TableHead>
                                                <TableHead className="font-semibold text-slate-600 text-right pr-6">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredPending.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-40 text-center text-slate-400">
                                                        No pending LPOs found. All approved POs have LPOs uploaded.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredPending.map((po) => (
                                                    <TableRow key={po.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="font-medium text-slate-900 pl-6">
                                                            <div
                                                                className="cursor-pointer hover:text-blue-600 hover:underline transition-all"
                                                                onClick={() => setSelectedPOForItems(po)}
                                                            >
                                                                {po.po_number}
                                                                <div className="text-xs text-slate-500 mt-0.5 font-normal">
                                                                    {new Date(po.created_at).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-medium text-slate-700">{po.supplier?.company_name}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-slate-400 italic text-sm">Draft LPO #</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-slate-400 italic text-sm">dd/mm/yyyy</span>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <span className="text-slate-400 text-xs italic">Upload Disabled</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                            {/* Pagination */}
                            <div className="mt-4">
                                <Pagination
                                    currentPage={pendingPage}
                                    totalPages={Math.ceil(totalPending / pendingPageSize)}
                                    pageSize={pendingPageSize}
                                    total={totalPending}
                                    onPageChange={setPendingPage}
                                    onPageSizeChange={(size) => {
                                        setPendingPageSize(size)
                                        setPendingPage(1)
                                    }}
                                />
                            </div>
                        </TabsContent>


                        {/* APPROVED LPOS CONTENT */}
                        <TabsContent value="approved" className="mt-0 focus-visible:outline-none">
                            <div className="glass-card rounded-xl overflow-hidden shadow-sm border border-slate-200/60 bg-white/60 backdrop-blur-md">
                                {isLoading ? (
                                    <div className="flex items-center justify-center p-12">
                                        <Spinner size="lg" className="text-violet-500" />
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow>
                                                <TableHead className="font-semibold text-slate-600 pl-6">LPO Number</TableHead>
                                                <TableHead className="font-semibold text-slate-600">LPO Date</TableHead>
                                                <TableHead className="font-semibold text-slate-600">PO Number</TableHead>
                                                <TableHead className="font-semibold text-slate-600">Supplier</TableHead>
                                                <TableHead className="font-semibold text-slate-600 text-right pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredApproved.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-40 text-center text-slate-400">
                                                        No approved LPOs found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredApproved.map((lpo) => (
                                                    <TableRow key={lpo.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="font-medium text-slate-900 pl-6">
                                                            <div className="flex items-center gap-2">
                                                                <FileCheck className="w-4 h-4 text-emerald-500" />
                                                                {lpo.lpo_number}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleRenameClick(lpo)
                                                                    }}
                                                                    className="text-slate-400 hover:text-blue-500 transition-colors ml-1 p-1 rounded-full hover:bg-slate-100"
                                                                    title="Rename LPO"
                                                                >
                                                                    <Pencil className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-slate-600">
                                                            {new Date(lpo.document_date || lpo.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs text-slate-500">
                                                            {lpo.purchase_order?.po_number}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-medium text-slate-700">{lpo.purchase_order?.supplier?.company_name}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {lpo.document_url && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                        onClick={() => handleViewComparison(lpo)}
                                                                    >
                                                                        <Download className="w-3.5 h-3.5 mr-1.5" />
                                                                        View PDF
                                                                    </Button>
                                                                )}

                                                                {/* Verification Button or Status indicator */}
                                                                {(() => {
                                                                    const statusVerified = (lpo.status === 'sent' || lpo.status === 'verified')
                                                                    const dbVerified = (lpo as any).verify_tracking === true

                                                                    // Check for tracking items
                                                                    const items = lpo.tracking_items as any[] || []
                                                                    const hasTracking = items.length > 0 && (items[0].count > 0 || !!items[0].id)

                                                                    const isFullyVerified = dbVerified || (statusVerified && hasTracking)

                                                                    // Check if this specific LPO is being analyzed
                                                                    const isScanningThis = isAnalyzing && selectedLpoForVerify?.id === lpo.id

                                                                    if (statusVerified && !isFullyVerified) {
                                                                        return (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                disabled={isAnalyzing}
                                                                                className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 border border-amber-200 mr-2"
                                                                                onClick={() => handleVerifyClick(lpo)}
                                                                            >
                                                                                {isScanningThis ? (
                                                                                    <>
                                                                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                                                                        Scanning...
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                                                                                        Retry Verify
                                                                                    </>
                                                                                )}
                                                                            </Button>
                                                                        )
                                                                    }

                                                                    if (isFullyVerified) {
                                                                        return (
                                                                            <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 mr-2">
                                                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                                                                            </div>
                                                                        )
                                                                    }

                                                                    return (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            disabled={isAnalyzing}
                                                                            className="h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                            onClick={() => handleVerifyClick(lpo)}
                                                                        >
                                                                            {isScanningThis ? (
                                                                                <>
                                                                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                                                                    Scanning...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                                                    Verify
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    )
                                                                })()}

                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                                    onClick={() => {
                                                                        setSelectedLpoForDelete(lpo)
                                                                        setShowDeleteDialog(true)
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                                                    Remove
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                            {/* Pagination */}
                            <div className="mt-4">
                                <Pagination
                                    currentPage={page}
                                    totalPages={Math.ceil(totalApproved / pageSize)}
                                    pageSize={pageSize}
                                    total={totalApproved}
                                    onPageChange={setPage}
                                    onPageSizeChange={(size) => {
                                        setPageSize(size)
                                        setPage(1)
                                    }}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <ConfirmationDialog
                    isOpen={showSendDialog}
                    onClose={() => !isSending && setShowSendDialog(false)}
                    onConfirm={handleSendToSupplier}
                    title="Send LPO to Supplier"
                    message={`Are you sure you want to send LPO #${selectedLpoForSend?.lpo_number} to the supplier? This will initialize the order tracking process.`}
                    variant="info"
                    confirmText="Send LPO"
                    isLoading={isSending}
                />

                <ConfirmationDialog
                    isOpen={showDeleteDialog}
                    onClose={() => !isDeleting && setShowDeleteDialog(false)}
                    onConfirm={handleDeleteLPO}
                    title="Remove LPO Record"
                    message={`Are you sure you want to remove LPO #${selectedLpoForDelete?.lpo_number}? This will delete the document and return the PO to pending status.`}
                    variant="danger"
                    confirmText="Remove LPO"
                    isLoading={isDeleting}
                />

                {/* Verification Dialog */}
                {
                    selectedLpoForVerify && (
                        <VerificationDialog
                            isOpen={showVerifyDialog}
                            onClose={() => !isVerifying && setShowVerifyDialog(false)}
                            onConfirm={handleConfirmVerify}
                            lpoNumber={selectedLpoForVerify.lpo_number}
                            isLoading={isVerifying}
                            initialDate={detectedDate}
                            confidence={detectedConfidence}
                            isValidDate={detectedIsValid}
                        />
                    )
                }

                {/* Rename Dialog */}
                {selectedLpoForRename && (
                    <RenameLPODialog
                        isOpen={showRenameDialog}
                        onClose={() => !isRenaming && setShowRenameDialog(false)}
                        onConfirm={handleConfirmRename}
                        lpoNumber={selectedLpoForRename.lpo_number}
                        isLoading={isRenaming}
                    />
                )}
            </div >
        </FinancialPageLayout >
    )
}
