
import { useState, useRef, ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { UploadCloud, FileText, Loader2, X } from 'lucide-react'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { lpoDocumentExtractionService } from '@/services/pharmacy/lpoDocumentExtractionService'
import { PurchaseOrderWithRelations } from '@/types/pharmacy'
import { LPOMatchResult } from '@/types/pharmacy/procurementNew'
import { LPOMatchingReview } from '@/components/pharmacy/procurement/modals/LPOMatchingReview'
import { lpoService } from '@/services/pharmacy/lpoService'

interface BulkLPOUploadProps {
    pendingPOs: PurchaseOrderWithRelations[]
    onComplete: () => void
    onClose: () => void
}

interface UploadedFile {
    id: string
    file: File
    status: 'pending' | 'processing' | 'review_needed' | 'completed' | 'error'
    progress: number
    result?: LPOMatchResult
    error?: string
}

export function BulkLPOUpload({ pendingPOs, onComplete, onClose }: BulkLPOUploadProps) {
    const { error: toastError } = useToast()
    const { user } = useAuthStore()
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [reviewItem, setReviewItem] = useState<{ fileId: string, result: LPOMatchResult, pdfUrl?: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                status: 'pending' as const,
                progress: 0
            }))
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const processQueue = async () => {
        setIsProcessing(true)

        // Find the first pending file
        const pendingFiles = files.filter(f => f.status === 'pending')

        for (const fileItem of pendingFiles) {
            // Update status to processing
            updateFileStatus(fileItem.id, 'processing', 10)

            try {
                // 1. Extract Data
                updateFileStatus(fileItem.id, 'processing', 30)
                const extraction = await lpoDocumentExtractionService.extractLPOFromPDF(fileItem.file)



                // 2. Quick Check: Global Duplicate (Fast exit)
                if (extraction.documentNumber) {
                    const isGlobalDuplicate = await lpoService.checkDuplicateLPO(extraction.documentNumber)
                    if (isGlobalDuplicate) {
                        updateFileStatus(fileItem.id, 'completed', 100, 'Already Processed (Approved)')
                        continue
                    }
                }

                // 3. Match with POs
                updateFileStatus(fileItem.id, 'processing', 60)
                const matchResult = await lpoDocumentExtractionService.matchLPOToPurchaseOrders(extraction, pendingPOs)

                // 4. Determine Action based on Confidence
                updateFileStatus(fileItem.id, 'processing', 80)

                // AUTO-MATCH conditions:
                // a) Confidence is very high (>= 95%)
                // b) LPO Number explicitly matched an existing draft LPO for this PO (Tier 0 match)
                const isExplicitLpoMatch = matchResult.matchReasons.some(r => r.includes('Existing LPO Number Match'))

                if ((matchResult.confidenceScore >= 95 || isExplicitLpoMatch) && matchResult.matchedPO) {
                    // Context-Aware Duplicate Check (Already linked to this specific PO)
                    if (extraction.documentNumber) {
                        const isDuplicate = await lpoService.checkDuplicateLPO(extraction.documentNumber, matchResult.matchedPO.id)
                        if (isDuplicate) {
                            updateFileStatus(fileItem.id, 'completed', 100, 'Already Linked')
                            continue
                        }
                    }

                    // Auto-link
                    await linkAndSave(fileItem.file, matchResult.matchedPO.id, extraction.documentNumber, extraction.documentDate)
                    updateFileStatus(fileItem.id, 'completed', 100, isExplicitLpoMatch ? 'Matched via LPO #' : 'Successfully Matched')
                } else {
                    // Manual Review Needed
                    setFiles(prev => prev.map(f => f.id === fileItem.id ? {
                        ...f,
                        status: 'review_needed',
                        progress: 100,
                        result: matchResult
                    } : f))

                    // Create blob URL for preview
                    const pdfUrl = URL.createObjectURL(fileItem.file)

                    // Pause processing queue to show review view
                    setReviewItem({ fileId: fileItem.id, result: matchResult, pdfUrl })
                    setIsProcessing(false) // Stop processing state while reviewing
                    return // Exit loop to wait for user
                }

            } catch (err: any) {
                console.error('Processing failed:', err)
                setFiles(prev => prev.map(f => f.id === fileItem.id ? {
                    ...f,
                    status: 'error',
                    error: err.message
                } : f))
            }
        }

        setIsProcessing(false)

        // Check if everything is done
        const hasUnprocessed = files.some(f => f.status === 'pending')
        const hasReviewNeeded = files.some(f => f.status === 'review_needed')

        if (!hasUnprocessed && !hasReviewNeeded && files.length > 0) {
            onComplete()
        }
    }

    const linkAndSave = async (file: File, poId: string, lpoNumber: string, documentDate?: string) => {
        // 1. Create LPO record
        const lpo = await lpoService.upsertLPODraft({
            hospital_id: user?.hospital_id || '',
            po_id: poId,
            lpo_number: lpoNumber || `LPO-PENDING-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Unique fallback
            document_date: documentDate || new Date().toISOString().split('T')[0], // Use extracted date or default to today
        })

        // 2. Upload Document
        await lpoService.uploadLPODocument(lpo.id, file)
    }

    const handleReviewConfirm = async (poId: string) => {
        if (!reviewItem) return

        try {
            const fileItem = files.find(f => f.id === reviewItem.fileId)
            if (fileItem) {
                await linkAndSave(fileItem.file, poId, reviewItem.result.extractedData.documentNumber, reviewItem.result.extractedData.documentDate)
                updateFileStatus(reviewItem.fileId, 'completed', 100)
            }
            if (reviewItem.pdfUrl) {
                URL.revokeObjectURL(reviewItem.pdfUrl)
            }
            setReviewItem(null)

            // Resume processing for other files
            setTimeout(() => {
                processQueue()
            }, 500)
        } catch (err: any) {
            toastError('Failed to save LPO: ' + err.message)
            setReviewItem(null)
            updateFileStatus(reviewItem.fileId, 'error', 0, 'Save failed manually')
        }
    }

    const handleReviewSkip = () => {
        if (reviewItem) {
            // Mark as skipped/error so we can continue
            updateFileStatus(reviewItem.fileId, 'error', 0, 'Skipped by user')
            if (reviewItem.pdfUrl) {
                URL.revokeObjectURL(reviewItem.pdfUrl)
            }
            setReviewItem(null)

            // Resume processing
            setTimeout(() => {
                processQueue()
            }, 500)
        }
    }

    const updateFileStatus = (id: string, status: UploadedFile['status'], progress: number, error?: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, status, progress, error } : f))
    }

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id))
    }

    const pendingCount = files.filter(f => f.status === 'pending').length
    const completedCount = files.filter(f => f.status === 'completed').length

    // IF REVIEW MODE: Show the full matching screen
    if (reviewItem) {
        return (
            <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
                <LPOMatchingReview
                    isOpen={true}
                    onClose={() => { }} // Managed via Skip/Confirm
                    matchResult={reviewItem.result}
                    pdfUrl={reviewItem.pdfUrl}
                    allPendingPOs={pendingPOs}
                    onConfirm={handleReviewConfirm}
                    onSkip={handleReviewSkip}
                    isFullScreen={true}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-500">
                        <X className="w-4 h-4 mr-2" />
                        Back to List
                    </Button>
                </div>
                {completedCount > 0 && (
                    <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        {completedCount} files processed successfully
                    </div>
                )}
            </div>

            <Card className="p-12 border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="bg-blue-50 p-6 rounded-full mb-4 ring-8 ring-blue-50/50">
                        <UploadCloud className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Bulk LPO Document Upload</h3>
                    <p className="text-slate-500 mb-8 max-w-md">
                        Drag & drop multiple LPO PDF documents. Our system will extract metadata and match them to your pending POs automatically.
                    </p>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        accept=".pdf"
                        onChange={handleFileSelect}
                    />

                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            size="lg"
                            className="px-8 border-slate-200"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Select Files
                        </Button>
                        {pendingCount > 0 && (
                            <Button
                                size="lg"
                                className="px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                                onClick={processQueue}
                                disabled={isProcessing}
                            >
                                {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Start Matching Process
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {files.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            Upload Queue
                            <Badge variant="gray" className="bg-slate-100 text-slate-600 border-none">
                                {files.length}
                            </Badge>
                        </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {files.map(file => (
                            <Card key={file.id} className="p-4 flex items-center gap-4 bg-white border-slate-200 shadow-sm">
                                <div className={`p-3 rounded-lg ${file.status === 'completed' ? 'bg-emerald-50 text-emerald-500' :
                                    file.status === 'review_needed' ? 'bg-amber-50 text-amber-500' :
                                        'bg-slate-50 text-slate-400'
                                    }`}>
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between mb-1">
                                        <div className="font-bold text-slate-900 text-sm truncate">{file.file.name}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider">
                                            {file.status === 'completed' && <span className="text-emerald-600">Matched</span>}
                                            {file.status === 'error' && <span className="text-rose-600">Failed</span>}
                                            {file.status === 'review_needed' && <span className="text-amber-600">Review Needed</span>}
                                            {file.status === 'processing' && <span className="text-blue-600">Processing...</span>}
                                            {file.status === 'pending' && <span className="text-slate-400">Waiting</span>}
                                        </div>
                                    </div>
                                    <ProgressBar
                                        progress={file.progress}
                                        className="h-1.5 bg-slate-100"
                                        indicatorClassName={
                                            file.status === 'completed' ? 'bg-emerald-500' :
                                                file.status === 'review_needed' ? 'bg-amber-500' :
                                                    'bg-blue-500'
                                        }
                                    />
                                    {file.error && (
                                        <div className="text-[10px] text-rose-500 mt-1 font-medium">{file.error}</div>
                                    )}
                                </div>
                                {file.status !== 'processing' && (
                                    <button onClick={() => removeFile(file.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                        <X size={16} />
                                    </button>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
