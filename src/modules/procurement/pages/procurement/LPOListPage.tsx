// @ts-nocheck
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/services/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Spinner, SlideOver } from '@/components/ui'
import { getLPOList, getLPOStats, uploadLPO, updateLPOStatus, bulkVerifyLPOs, bulkUploadLPOs, getPendingPOsForLPO, checkDuplicateLPO, getExistingLPONumbers, getExistingPOIdsWithLPO, repairLPONumber, getAllLPOsForAudit, rebindLPO } from '@/services/pharmacy/lpoService'
import type { LPOAuditRecord } from '@/services/pharmacy/lpoService'
import { WARRANT_CATEGORIES, WARRANT_DEPARTMENTS } from '@/services/pharmacy/warrantService'
import { getPurchaseOrderById } from '@/services/pharmacy/procurementService'
import { useToast } from '@/stores/toastStore'
import * as XLSX from 'xlsx'
import { getProcurementMetadata } from '@/services/pharmacy/procurementService'
import type { LPOListItem, LPOStats, LPOUploadData, LPOStatus, LPOPaymentStatus, PurchaseOrderWithRelations } from '@/types/pharmacy'
import { PurchaseOrderDetailView } from './PurchaseOrderDetailView'
import { ROUTES } from '@/lib/constants'
import { 
  IconShoppingCart, 
  IconSearch, 
  IconReceipt, 
  IconMoney, 
  IconClock, 
  IconCheck, 
  IconArrowLeft,
  IconArrowRight,
  IconX,
  IconUpload,
  IconFileText,
  IconBuildingStore,
  IconCloud,
  IconRefresh,
  IconPlus,
  IconCheckCircle,
  IconChevronLeft,
  IconChevronRight,
  IconShield
} from '@/components/ui/Icons'
import { formatCurrency, calculateFileHash, cn } from '@/lib/utils'
import { extractLpoNumberFromPdf, extractTextFromPdf, extractDatesFromPdf } from '@/lib/pdfParser'
import { ChevronRight, Sparkles, ExternalLink } from 'lucide-react'

export const LPOListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending')
  const [orders, setOrders] = useState<LPOListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Stats & Metadata
  const [stats, setStats] = useState<LPOStats>({
    totalApproved: 0,
    pendingCount: 0,
    sentCount: 0,
    verifiedCount: 0,
    totalValue: 0
  })
  const [metadata, setMetadata] = useState<{ voteCodes: string[], categories: string[] }>({
    voteCodes: [],
    categories: []
  })

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [voteCodeFilter, setVoteCodeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const pageSize = 15

  // SlideOver / Detail View
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadTargetPO, setUploadTargetPO] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadData, setUploadData] = useState<LPOUploadData>({
    lpo_number: '',
    document_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: undefined
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkFileInputRef = useRef<HTMLInputElement>(null)

  // Bulk Upload State
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false)
  const [activeRowIndex, setActiveRowIndex] = useState(-1)
  const [bulkPdfRows, setBulkPdfRows] = useState<{
    file: File,
    selectedPoId: string,
    lpoNumber: string,
    status: 'pending' | 'matched' | 'error' | 'valid',
    objectUrl?: string,
    fileHash: string,
    inDocLpo?: string,
    matchReason?: string,
    matchScore?: number
  }[]>([])

  // Move PDF Preview to a separate component to manage Blob URLs properly
  const PDFPreview = ({ file, url: initialUrl }: { file?: File, url?: string }) => {
    const [url, setUrl] = useState<string>('')

    useEffect(() => {
      if (initialUrl) {
        setUrl(initialUrl)
        return
      }
      if (!file) return
      const newUrl = URL.createObjectURL(file)
      setUrl(newUrl)
      return () => {
        if (newUrl) URL.revokeObjectURL(newUrl)
      }
    }, [file, initialUrl])

    if (!url) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 italic gap-3">
          <Spinner className="w-6 h-6 text-blue-500" />
          <p className="text-[10px] font-black uppercase tracking-widest">Preparing Preview...</p>
        </div>
      )
    }

    return (
      <iframe 
        src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
        className="w-full h-full border-none bg-white"
        title="PDF Preview"
      />
    )
  }
  const [activePoDetails, setActivePoDetails] = useState<PurchaseOrderWithRelations | null>(null)
  const [isLoadingPoDetails, setIsLoadingPoDetails] = useState(false)
  const [poSearch, setPoSearch] = useState('')
  const [pendingPOs, setPendingPOs] = useState<{ 
    id: string, 
    po_number: string, 
    total_amount: number, 
    manual_supplier_name: string | null, 
    supplier_name?: string,
    order_date: string,
    items?: any[]
  }[]>([])
  const [bulkUploadErrors, setBulkUploadErrors] = useState<string[]>([])
  const [dbLinkedPoIds, setDbLinkedPoIds] = useState<Set<string>>(new Set())
  const [leftSidebarTab, setLeftSidebarTab] = useState<'queue' | 'dismissed'>('queue')
  const [skippedRows, setSkippedRows] = useState<{
    file: File,
    lpoNumber: string,
    reason: string,
    status: 'skipped' | 'duplicate'
  }[]>([])
  
  // Processing State for Progress Bar
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [bulkProcessingProgress, setBulkProcessingProgress] = useState(0)
  const [bulkProcessingMessage, setBulkProcessingMessage] = useState('')

  // ── Audit Modal State ─────────────────────────────────────────────────────
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditProgress, setAuditProgress] = useState({ current: 0, total: 0, label: '' })
  type AuditStatus = 'ok' | 'suspicious' | 'no_doc' | 'error'
  type AuditRow = LPOAuditRecord & {
    extracted_amount: number | null
    amount_diff_pct: number | null
    audit_status: AuditStatus
    issue: string
    rebind_po_id: string // selected PO for rebinding
    is_rebinding: boolean
    rebind_search?: string
  }
  const [auditRows, setAuditRows] = useState<AuditRow[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [expandedLpoPdfId, setExpandedLpoPdfId] = useState<string | null>(null)
  const [allApprovedPOs, setAllApprovedPOs] = useState<{ id: string; po_number: string; total_amount: number; supplier_name: string; items?: { item_name: string }[] }[]>([])

  // Fetch Stats & Metadata
  useEffect(() => {
    if (!hospitalId) return

    const loadInitialData = async () => {
      const [statsRes, metaRes] = await Promise.all([
        getLPOStats(hospitalId),
        getProcurementMetadata(hospitalId)
      ])

      if (!statsRes.error && statsRes.data) {
        setStats(statsRes.data)
      }
      
      if (!metaRes.error && metaRes.data) {
        setMetadata(metaRes.data)
      }
    }

    loadInitialData()
  }, [hospitalId])

  // Fetch List Data
  const loadData = useCallback(async () => {
    if (!hospitalId) return

    setIsLoading(true)
    setError(null)

    const filter = {
      search: search || undefined,
      vote_code: voteCodeFilter || undefined,
      category: categoryFilter || undefined,
      department: departmentFilter || undefined,
    }

    const { data, error: err } = await getLPOList(
      hospitalId,
      activeTab,
      filter,
      page,
      pageSize
    )

    if (err) {
      setError(err)
    } else if (data) {
      setOrders(data.data)
      setTotalRecords(data.total)
    }

    setIsLoading(false)
  }, [hospitalId, activeTab, search, voteCodeFilter, categoryFilter, departmentFilter, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleMutate = useCallback(() => {
    if (!hospitalId) return
    void getLPOStats(hospitalId).then((statsRes) => {
      if (statsRes.data) setStats(statsRes.data)
    })
    void loadData()
  }, [hospitalId, loadData])

  // Reset page when tab changes
  useEffect(() => {
    setPage(1)
  }, [activeTab])

  // Reset all filters
  const resetFilters = () => {
    setSearch('')
    setVoteCodeFilter('')
    setCategoryFilter('')
    setDepartmentFilter('')
    setPage(1)
  }

  // Handle Tab Switching
  const handleTabChange = (tab: 'pending' | 'approved') => {
    setActiveTab(tab)
  }

  // Handle Upload Submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !user?.id || !uploadTargetPO) return
    
    if (!uploadData.lpo_number || !uploadData.document_date || !uploadData.document_file) {
      toast.error('Required Fields Missing', 'Please fill in all required fields and select a PDF document')
      return
    }

    if (uploadData.document_file.type !== 'application/pdf' && !uploadData.document_file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Invalid Format', 'Only PDF files are allowed')
      return
    }

    setIsUploading(true)
    
    try {
      // Duplicate Check
      const dupRes = await checkDuplicateLPO(hospitalId, uploadData.lpo_number, uploadTargetPO)
      if (dupRes.data?.isDuplicate) {
        throw new Error(`Duplicate LPO: This number is already linked to ${dupRes.data.existingPoNumber}`)
      }

      const { error } = await uploadLPO(
        hospitalId,
        uploadTargetPO,
        user.id,
        uploadData
      )
      
      if (error) throw new Error(error)
      
      // Success
      setIsUploadModalOpen(false)
      setUploadTargetPO(null)
      setUploadData({ lpo_number: '', document_date: new Date().toISOString().split('T')[0], document_file: undefined, expected_delivery_date: undefined })
      
      // Refresh stats and lists
      const statsRes = await getLPOStats(hospitalId)
      if (statsRes.data) setStats(statsRes.data)
      loadData()
      
      // Auto switch to approved tab to see the new record
      setActiveTab('approved')
      
    } catch (err) {
      toast.error('Upload Failed', err instanceof Error ? err.message : String(err))
    } finally {
      setIsUploading(false)
    }
  }

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (!hospitalId) return

    const fileList = Array.from(files)
    const isAllPdf = fileList.every(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))

    if (!isAllPdf) {
      toast.error("Invalid Format", "Strictly PDF format only for bulk LPO uploads.")
      e.target.value = ''
      return
    }

    // Fetch pending POs and existing LPOs first
    setIsLoading(true)
    const [poRes, existingRes, linkedPoRes] = await Promise.all([
      getPendingPOsForLPO(hospitalId),
      getExistingLPONumbers(hospitalId),
      getExistingPOIdsWithLPO(hospitalId)
    ])
    setIsLoading(false)
    
    if (poRes.error) {
      toast.error("Error", "Failed to load pending POs. Please try again.")
      e.target.value = ''
      return
    }

    if (existingRes.error || !existingRes.data || linkedPoRes.error || !linkedPoRes.data) {
      toast.error("Error", "Failed to check for existing LPOs. Please try again.")
      e.target.value = ''
      return
    }

    const availablePos = poRes.data || []
    setPendingPOs(availablePos)
    const { lpoNumbers: normalizedExistingLPOs, filenames: existingFilenames, hashes: existingHashes } = existingRes.data
    const linkedIds = linkedPoRes.data // Set<string>
    setDbLinkedPoIds(linkedIds)

    // 2. Extract potential LPO numbers and CALCULATE HASHES
    setIsBulkProcessing(true)
    setBulkProcessingProgress(0)
    setBulkProcessingMessage(`Analyzing ${fileList.length} documents...`)
    
    let analyzedCount = 0
    const totalToAnalyze = fileList.length

    const fileDataMap = await Promise.all(fileList.map(async (file) => {
      const fileName = file.name.replace(/\.[^/.]+$/, "")
      
      // A. Calculate Hash (Bulletproof Duplicate Detection)
      const fileHash = await calculateFileHash(file)

      // B. Extract TRUE LPO number from PDF content (Industry Standard)
      // B. LPO Extraction Logic - Improved patterns for PO-2026-XXXX format
      let inDocLpo = ''
      let extractedPdfText = ''
      try {
        extractedPdfText = await extractTextFromPdf(file)
        // Robust patterns for various LPO formats (expanded for long Malaysian IDs up to 20 digits)
        const poPatterns = [
          /((?:LPO|PO|CO|DO|MOF|MOEF|KPLB|PKKM|KKM|SST|JPA)[-_\s/]?\d{2,6}[-_\s/]?\d{4,20})/gi,
          /(\d{4}[-_\s/]\d{2,20})/g,
          /\b(1\d{9,15})\b/g
        ]
        
        const normalize = (s: string) => s.toUpperCase().replace(/[\s\-_]/g, '')
        
        for (const pattern of poPatterns) {
          const matches = Array.from(extractedPdfText.matchAll(pattern))
          for (const match of matches) {
            const raw = match[1] || match[0]
            const cleaned = normalize(raw)
            if (cleaned.length >= 6) {
              inDocLpo = raw.toUpperCase().trim()
              break
            }
          }
          if (inDocLpo) break
        }
      } catch (e) { console.error("PDF Extraction failed", e) }

      // C. Extract expected delivery date and document date from PDF
      let extractedDates = { documentDate: null, expectedDeliveryDate: null }
      try {
        extractedDates = await extractDatesFromPdf(file)
      } catch (e) { console.error("PDF Date Extraction failed", e) }

      // D. Smart Filename Matcher
      let extractedLpo = ''
      
      analyzedCount++
      setBulkProcessingProgress(Math.round((analyzedCount / totalToAnalyze) * 100))
      setBulkProcessingMessage(`Analyzing: ${file.name}`)

      // Pass the raw text along for the scoring engine
      return { 
        file, 
        extractedLpo, 
        inDocLpo, 
        fileHash, 
        rawText: extractedPdfText || '',
        documentDate: extractedDates.documentDate,
        expectedDeliveryDate: extractedDates.expectedDeliveryDate
      }
    }))

    const finalRows: any[] = []
    const newSkipped: any[] = []

    fileDataMap.forEach(data => {
      let fileNameLower = data.file.name.toLowerCase()
      fileNameLower = fileNameLower.replace(/\s*\(\d+\)(\.[^.]+)$/, '$1')
      
      let isDuplicate = false
      let reason = ''

      const normalize = (s: string) => s.toUpperCase().replace(/[\s\-_]/g, '')
      const normalizedInDoc = data.inDocLpo ? normalize(data.inDocLpo) : ''
      const normalizedExtracted = data.extractedLpo ? normalize(data.extractedLpo) : ''

      // Check against existing LPO numbers (using Set.has and also substring match for robustness)
      const existingLpoArr = Array.from(normalizedExistingLPOs)
      const isLpoDup = (num: string) => {
        if (!num) return false
        if (normalizedExistingLPOs.has(num)) return true
        // Only do deeper check if number is substantial
        if (num.length < 6) return false
        
        return existingLpoArr.some(existing => 
          existing === num || (existing.length > 5 && (existing.includes(num) || num.includes(existing)))
        )
      }

      if (normalizedInDoc && isLpoDup(normalizedInDoc)) {
        isDuplicate = true
        reason = `LPO ${data.inDocLpo} exists`
      } else if (data.fileHash && existingHashes.has(data.fileHash)) {
        isDuplicate = true
        reason = `Duplicate Content`
      } else if (existingFilenames.has(fileNameLower)) {
        isDuplicate = true
        reason = `Duplicate Filename`
      } else if (normalizedExtracted && isLpoDup(normalizedExtracted)) {
        isDuplicate = true
        reason = `LPO Number Match`
      }

      if (isDuplicate) {
        newSkipped.push({
          file: data.file,
          lpoNumber: data.inDocLpo || data.extractedLpo || 'Unknown',
          reason,
          status: 'duplicate'
        })
      } else {
        finalRows.push(data)
      }
    })

    setSkippedRows(prev => [...prev, ...newSkipped])

    const validRows = finalRows.map(data => {
      const { file, extractedLpo, inDocLpo, fileHash, rawText } = data
      let selectedPoId = ''
      let finalLpo = inDocLpo || extractedLpo || ''
      let matchReason = ''
      let matchScore = 0

      const normalize = (s: string) => s.toUpperCase().replace(/[\s\-_/]/g, '')
      const normalizedText = normalize(rawText)
      const textNoCommas = rawText.replace(/,/g, '')
      const textLower = rawText.toLowerCase()

      // Multi-Factor Scoring Engine
      let bestMatch = null
      let highestScore = 0
      
      for (const po of availablePos) {
        let score = 0
        const normPoNumber = normalize(po.po_number)
        
        const normalizedFinal = finalLpo ? normalize(finalLpo) : ''
        
        if (normalizedFinal && normPoNumber === normalizedFinal) {
          score += 80 // High confidence if we found a structured PO number that matches exactly
        } else if (normPoNumber.length >= 8 && normalizedText.includes(normPoNumber)) {
          score += 60 // Lower confidence if we just found the number string in raw text
        }

        // 2. Amount Check (High Confidence: +45)
        let amountMatch = false
        if (po.total_amount > 0) {
          const amountStr1 = po.total_amount.toFixed(2)
          const amountStr2 = Math.floor(po.total_amount).toString()
          if (textNoCommas.includes(amountStr1) || textNoCommas.includes(amountStr2)) {
            score += 45
            amountMatch = true
          }
        }

        // 3. Supplier Name Check (Medium Confidence: +20)
        if (po.supplier_name && po.supplier_name.length > 3) {
            const cleanSupplier = po.supplier_name.toUpperCase()
              .replace(/\s+(SDN\s+BHD|BHD|ENTERPRISE|LIMITED|INC)\.?\b/gi, '')
              .trim()
            
            const supplierParts = cleanSupplier.split(' ').filter(p => p.length > 3)
            for (const part of supplierParts) {
              if (textLower.includes(part.toLowerCase())) {
                score += 25
                break
              }
            }
        }

        // 4. Item-Level Matching (Medium Confidence: +15 per item, max 45)
        if ((po as any).items && (po as any).items.length > 0) {
          let itemMatches = 0
          for (const item of (po as any).items) {
            const nameLower = (item.item_name || '').toLowerCase()
            const codeLower = (item.item_code || '').toLowerCase()
            
            // Match via item code or distinctive name parts
            if (codeLower && codeLower.length > 4 && textLower.includes(codeLower)) {
              itemMatches++
            } else {
              // Exclude generic pharmaceutical dosage-form & route words — these appear in almost
              // every drug name and must NOT be treated as distinctive identifiers.
              const PHARMA_STOP_WORDS = [
                'tablet', 'tablets', 'capsule', 'capsules', 'injection', 'injections',
                'solution', 'suspension', 'infusion', 'liquid', 'syrup', 'cream',
                'ointment', 'patch', 'drops', 'spray', 'powder', 'granule', 'granules',
                'sachet', 'sachets', 'vial', 'vials', 'ampoule', 'ampoules',
                'mega', 'unit', 'units'
              ]
              const distinctiveParts = nameLower.split(' ').filter(p => p.length > 4 && !PHARMA_STOP_WORDS.includes(p))
              if (distinctiveParts.length > 0 && distinctiveParts.some(p => textLower.includes(p))) {
                itemMatches++
              }
            }
          }
          if (itemMatches > 0) {
            score += Math.min(itemMatches * 15, 45)
          }
        }

        // 5. Filename Check (Bonus: +30)
        const fileNameLower = file.name.toLowerCase()
        if (normPoNumber.length > 5 && fileNameLower.includes(normPoNumber.toLowerCase())) {
          score += 30
        }

        if (score > highestScore) {
          highestScore = score
          bestMatch = po
        }
      }

      // Threshold evaluation: 80+ for Auto-Match, 60+ for Suggestion
      // NOTE: Threshold raised from 40→60 to avoid false positives where a shared supplier
      // name (+25) plus a generic word like 'injection' (+30) would incorrectly trigger a
      // suggested binding between unrelated drugs from the same distributor.
      if (bestMatch && highestScore >= 80) {
        selectedPoId = bestMatch.id
        finalLpo = bestMatch.po_number
        matchScore = highestScore
        
        if (highestScore >= 120) matchReason = 'Perfect Match: ID, Amount & Items'
        else if (highestScore >= 100) matchReason = 'Strong Match: ID & Amount'
        else if (highestScore >= 75) matchReason = 'Confident Match: Multiple Factors'
        else matchReason = 'Auto-Matched'
      } else if (bestMatch && highestScore >= 60) {
        selectedPoId = bestMatch.id
        finalLpo = bestMatch.po_number
        matchScore = highestScore
        matchReason = 'Suggested: Verify Match'
      }

      return {
        file,
        selectedPoId,
        lpoNumber: finalLpo,
        status: (selectedPoId && matchScore >= 80 ? 'matched' : 'pending') as any,
        objectUrl: URL.createObjectURL(file),
        fileHash,
        inDocLpo,
        matchReason,
        matchScore,
        documentDate: data.documentDate,
        expectedDeliveryDate: data.expectedDeliveryDate
      }
    })

    if (newSkipped.length > 0) {
      toast.info(
        "Duplicates Filtered", 
        `${newSkipped.length} file(s) already in the system were moved to the Dismissed column.`
      )
    }

    setBulkPdfRows(prev => [...prev, ...validRows])
    if (validRows.length > 0 && activeRowIndex === -1) {
      setActiveRowIndex(0)
    }

    setIsBulkProcessing(false)
    setBulkProcessingProgress(0)
    setBulkProcessingMessage('')
    
    e.target.value = ''
    setBulkUploadErrors([])
  }

  // Fetch PO Details for active row
  useEffect(() => {
    if (!isBulkUploadModalOpen) return
    
    const fetchPoDetails = async () => {
      const selectedPoId = bulkPdfRows[activeRowIndex]?.selectedPoId
      if (!selectedPoId) {
        setActivePoDetails(null)
        return
      }

      setIsLoadingPoDetails(true)
      try {
        const res = await getPurchaseOrderById(selectedPoId)
        if (res.data) setActivePoDetails(res.data)
      } finally {
        setIsLoadingPoDetails(false)
      }
    }
    fetchPoDetails()
  }, [activeRowIndex, bulkPdfRows, isBulkUploadModalOpen])

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      bulkPdfRows.forEach(row => {
        if (row.objectUrl) URL.revokeObjectURL(row.objectUrl)
      })
    }
  }, [bulkPdfRows])

  const handleBulkUploadSubmit = async () => {
    if (!hospitalId || !user?.id || bulkPdfRows.length === 0) return
    
    // 1. Identify rows that actually need processing (matched in this session)
    const rowsToProcess = bulkPdfRows.filter(r => r.status === 'matched' && r.selectedPoId)
    
    if (rowsToProcess.length === 0) {
      toast.info("Nothing to Process", "Please match documents to Purchase Orders before confirming.")
      return
    }

    setIsLoading(true)
    
    setIsBulkProcessing(true)
    setBulkProcessingProgress(0)
    setBulkProcessingMessage('Preparing documents...')
    
    const successfulRows: string[] = []

    try {
      let successCount = 0
      const errors: string[] = []
      const totalToProcess = rowsToProcess.length
      let processedCount = 0

      // Sequential Processing
      for (const row of rowsToProcess) {
        processedCount++
        setBulkProcessingProgress(Math.round((processedCount / totalToProcess) * 100))
        setBulkProcessingMessage(`Uploading: ${row.file.name}`)

        // Update status to processing
        setBulkPdfRows(prev => prev.map(r => r.file.name === row.file.name ? { ...r, status: 'processing' } : r))

        const { error } = await uploadLPO(hospitalId, row.selectedPoId, user.id, {
          lpo_number: row.lpoNumber,
          document_date: (row as any).documentDate || new Date().toISOString().split('T')[0],
          expected_delivery_date: (row as any).expectedDeliveryDate || undefined,
          document_file: row.file,
          file_hash: row.fileHash
        })

        if (error) {
          const isDuplicate = error.toLowerCase().includes('already exists') || error.toLowerCase().includes('conflict')
          errors.push(`${row.file.name}: ${error}`)
          setBulkPdfRows(prev => prev.map(r => r.file.name === row.file.name ? { 
            ...r, 
            status: isDuplicate ? 'duplicate' : 'error', 
            errorMsg: error 
          } : r))
        } else {
          successCount++
          successfulRows.push(row.file.name)
          setBulkPdfRows(prev => prev.map(r => r.file.name === row.file.name ? { ...r, status: 'valid' } : r))
        }
      }

      setBulkProcessingMessage('Finalizing batch...')

      if (errors.length > 0) {
        toast.error("Partial Success", `Successfully uploaded ${successCount} documents. ${errors.length} failed.`)
      } else if (successCount > 0) {
        toast.success("Batch Complete", `Successfully uploaded all ${successCount} matched documents.`)
        // Only close if everything succeeded? No, let's keep it open if there are unmatched ones.
        // Actually, let's remove the successful ones from the list
        setBulkPdfRows(prev => prev.filter(r => !successfulRows.includes(r.file.name)))
      } else {
        toast.info("No documents were processed")
      }
      
      loadData()
      const statsRes = await getLPOStats(hospitalId)
      if (statsRes.data) setStats(statsRes.data)
      
    } catch (err) {
      toast.error("Bulk Upload Failed", err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
      setIsBulkProcessing(false)
      setBulkProcessingProgress(0)
    }
  }

  const handleVerifyLPO = async (lpoId: string) => {
    if (!hospitalId || !lpoId) return
    
    if (window.confirm('Verify this LPO document? This marks the procurement cycle as audited.')) {
      try {
        const { error: err } = await updateLPOStatus(lpoId, 'verified')
        if (err) throw new Error(err)
        
        // Refresh
        const statsRes = await getLPOStats(hospitalId)
        if (statsRes.data) setStats(statsRes.data)
        loadData()
        
      } catch (err) {
        alert(`Verification failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  // Handle Bulk Verify LPOs
  const handleVerifyAll = async (isGlobal: boolean = false) => {
    if (!hospitalId) return
    
    let pendingVerificationIds: string[] = []

    if (isGlobal) {
      setIsLoading(true)
      try {
        // Fetch ALL IDs from database that meet criteria
        const { data, error: fetchErr } = await supabase
          .from('pharmacy_lpo')
          .select('id')
          .eq('hospital_id', hospitalId)
          .eq('status', 'sent')
          .not('document_url', 'is', null)
        
        if (fetchErr) throw fetchErr
        
        // We also need to filter out placeholders (lpo_number === po_number)
        // Since we can't do that easily in the query without a join, we'll fetch PO info too
        const lpoIds = data?.map(d => d.id) || []
        if (lpoIds.length === 0) {
          toast.info("No records found", "There are no LPOs ready for global verification.")
          return
        }

        // Fetch PO relations
        const { data: relations } = await supabase
          .from('pharmacy_lpo')
          .select('id, lpo_number, pharmacy_purchase_orders(po_number)')
          .in('id', lpoIds)

        pendingVerificationIds = relations
          ?.filter(r => r.lpo_number && (r.pharmacy_purchase_orders as any)?.po_number)
          .map(r => r.id) || []

      } catch (err) {
        toast.error("Fetch failed", "Could not retrieve all pending LPOs.")
        setIsLoading(false)
        return
      }
    } else {
      // Current page only
      pendingVerificationIds = orders
        .filter(order => order.lpo_status === 'sent' && order.lpo_id && order.document_url)
        .map(order => order.lpo_id!)
    }

    if (pendingVerificationIds.length === 0) {
      toast.info('Nothing to verify', 'No LPOs found that need verification.')
      setIsLoading(false)
      return
    }

    const message = isGlobal 
      ? `Verify ALL ${pendingVerificationIds.length} LPO documents across all pages?`
      : `Verify all ${pendingVerificationIds.length} LPO documents on this page?`

    if (window.confirm(message)) {
      setIsLoading(true)
      try {
        const { error: err } = await bulkVerifyLPOs(pendingVerificationIds)
        if (err) throw new Error(err)
        
        toast.success("Verification Complete", `Successfully verified ${pendingVerificationIds.length} LPOs.`)
        
        // Refresh
        const statsRes = await getLPOStats(hospitalId)
        if (statsRes.data) setStats(statsRes.data)
        loadData()
        
      } catch (err) {
        alert(`Bulk verification failed: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }

  const handleSyncLPONumbers = async () => {
    try {
      setIsSyncing(true)
      setError(null)
      
      // 1. Fetch ALL placeholders with documents from the database (not just current page)
      const { data: placeholders, error: fetchError } = await supabase
        .from('pharmacy_lpo')
        .select('id, lpo_number, document_url, po_id')
        .not('document_url', 'is', null)
        // This is a simplified check for placeholders: where lpo_number matches po_number format or is known placeholder
        // In the UI we compare with po_number, so we'll do that in the loop for accuracy
        
      if (fetchError) throw fetchError

      if (!placeholders || placeholders.length === 0) {
        toast.info("No documents found", "Could not find any LPOs with attached documents to sync.")
        setIsSyncing(false)
        return
      }

      // Get PO numbers to identify placeholders
      const { data: pos } = await supabase
        .from('pharmacy_purchase_orders')
        .select('id, po_number')
        .in('id', placeholders.map(p => p.po_id))
      
      const poMap = new Map(pos?.map(p => [p.id, p.po_number]) || [])
      
      // Filter for actual placeholders (where lpo_number === po_number) OR invalid text like 'Tarikh'
      const actualPlaceholders = placeholders.filter(p => {
        const poNum = poMap.get(p.po_id)
        return p.lpo_number === poNum || p.lpo_number === 'Tarikh' || p.lpo_number?.toUpperCase().includes('TARIKH')
      })

      if (actualPlaceholders.length === 0) {
        toast.info("No placeholders found", "All LPO numbers already seem to be updated.")
        setIsSyncing(false)
        return
      }

      setSyncProgress({ current: 0, total: actualPlaceholders.length })
      
      let fixCount = 0

      for (let i = 0; i < actualPlaceholders.length; i++) {
        const order = actualPlaceholders[i]
        setSyncProgress(prev => ({ ...prev, current: i + 1 }))

        try {
          // 1. Download the PDF
          const response = await fetch(order.document_url!)
          if (!response.ok) continue

          const blob = await response.blob()
          const file = new File([blob], 'lpo.pdf', { type: 'application/pdf' })

          // 2. Extract number
          const extracted = await extractLpoNumberFromPdf(file)

          if (extracted && extracted !== order.lpo_number) {
            // 3. Repair in DB
            const { error } = await repairLPONumber(order.id, extracted)
            if (!error) fixCount++
          }
        } catch (err) {
          console.error(`Failed to sync LPO ${order.lpo_number}:`, err)
        }
      }

      if (fixCount > 0) {
        toast.success("Sync Complete", `Successfully updated ${fixCount} LPO numbers across the system.`)
        loadData()
      } else {
        toast.info("Sync Finished", "No new LPO numbers were identified. Some documents might be scanned images or missing numbers.")
      }
    } catch (err: any) {
      console.error('Global sync failed:', err)
      toast.error('Sync failed', err.message || 'An error occurred during global sync.')
    } finally {
      setIsSyncing(false)
    }
  }

  // ── Amount extractor from PDF raw text (Malaysian LPO standard) ────────────
  const extractAmountFromPdfText = (text: string): number | null => {
    const noCommas = text.replace(/,/g, '')
    // Primary: look for "Jumlah Keseluruhan" (grand total label in Malaysian Kerajaan LPOs)
    const grandTotalRe = /jumlah\s+keseluruhan[^0-9]{0,50}?([0-9]{1,10}\.[0-9]{2})/gi
    let m = grandTotalRe.exec(noCommas)
    if (m) return parseFloat(m[1])
    // Secondary: "Total Amount" in English LPOs
    const totalAmountRe = /(?:total\s+amount|jumlah)[^0-9]{0,30}?([0-9]{3,10}\.[0-9]{2})/gi
    m = totalAmountRe.exec(noCommas)
    if (m) return parseFloat(m[1])
    // Fallback: find the largest RM figure in the document
    const allAmounts = [...noCommas.matchAll(/(?:rm\s*)?([0-9]{3,10}\.[0-9]{2})/gi)]
      .map(x => parseFloat(x[1]))
      .filter(n => n > 0)
    if (allAmounts.length > 0) return Math.max(...allAmounts)
    return null
  }

  // ── Main audit handler ───────────────────────────────────────────────────
  const handleAuditBindings = async () => {
    if (!hospitalId) return
    setIsAuditModalOpen(true)
    setIsAuditing(true)
    setAuditRows([])
    setAuditProgress({ current: 0, total: 0, label: 'Fetching records...' })

    try {
      // 1. Fetch all LPO-PO pairs + all approved POs for rebinding selector
      const [auditRes, poRes] = await Promise.all([
        getAllLPOsForAudit(hospitalId),
        getPendingPOsForLPO(hospitalId),
      ])

      // Also pull approved POs that already have an LPO (so user can rebind to any PO)
      const { data: approvedPOs } = await supabase
        .from('pharmacy_purchase_orders')
        .select(`
          id, 
          po_number, 
          total_amount, 
          manual_supplier_name, 
          supplier:suppliers(company_name),
          items:pharmacy_purchase_order_items(item_name)
        `)
        .eq('hospital_id', hospitalId)
        .in('status', ['approved', 'completed', 'partial_received'])
        .not('po_number', 'ilike', 'SQ-%')
        .not('po_number', 'ilike', 'INV-%')

      const allPOs = (approvedPOs || []).map((p: any) => ({
        id: p.id,
        po_number: p.po_number,
        total_amount: p.total_amount || 0,
        supplier_name: p.manual_supplier_name || p.supplier?.company_name || '',
        items: (p.items || []).map((i: any) => ({ item_name: i.item_name || '' }))
      }))
      setAllApprovedPOs(allPOs)

      if (auditRes.error || !auditRes.data) {
        toast.error('Audit Failed', auditRes.error || 'Could not fetch LPO records')
        setIsAuditing(false)
        return
      }

      const records = auditRes.data
      setAuditProgress({ current: 0, total: records.length, label: 'Starting scan...' })

      const results: AuditRow[] = []

      // 2. For each LPO, fetch PDF → extract amount → compare
      for (let i = 0; i < records.length; i++) {
        const rec = records[i]
        setAuditProgress({ current: i + 1, total: records.length, label: rec.lpo_number || rec.po_number })

        let extracted_amount: number | null = null
        let audit_status: AuditStatus = 'no_doc'
        let issue = 'No document uploaded'
        let amount_diff_pct: number | null = null

        if (rec.document_url) {
          try {
            const resp = await fetch(rec.document_url)
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
            const blob = await resp.blob()
            const file = new File([blob], `${rec.lpo_number}.pdf`, { type: 'application/pdf' })
            const text = await extractTextFromPdf(file)
            extracted_amount = extractAmountFromPdfText(text)

            if (extracted_amount === null) {
              audit_status = 'error'
              issue = 'Could not read amount from PDF'
            } else {
              const diff = Math.abs(extracted_amount - rec.po_amount)
              amount_diff_pct = rec.po_amount > 0 ? (diff / rec.po_amount) * 100 : 100

              if (amount_diff_pct <= 2) {
                audit_status = 'ok'
                issue = ''
              } else {
                audit_status = 'suspicious'
                issue = `Amount mismatch: LPO RM ${extracted_amount.toFixed(2)} vs PO RM ${rec.po_amount.toFixed(2)} (${amount_diff_pct.toFixed(1)}% diff)`
              }
            }
          } catch (fetchErr) {
            audit_status = 'error'
            issue = fetchErr instanceof Error ? fetchErr.message : 'Failed to fetch PDF'
          }
        }

        results.push({
          ...rec,
          extracted_amount,
          amount_diff_pct,
          audit_status,
          issue,
          rebind_po_id: '',
          is_rebinding: false,
        })
      }

      setAuditRows(results)
    } catch (err) {
      toast.error('Audit Error', err instanceof Error ? err.message : String(err))
    } finally {
      setIsAuditing(false)
      setAuditProgress(p => ({ ...p, label: 'Done' }))
    }
  }

  // ── Rebind a single LPO ──────────────────────────────────────────────────
  const handleRebind = async (lpoId: string) => {
    const row = auditRows.find(r => r.lpo_id === lpoId)
    if (!row || !row.rebind_po_id) {
      toast.error('Select a PO', 'Please choose the correct PO before rebinding.')
      return
    }
    setAuditRows(prev => prev.map(r => r.lpo_id === lpoId ? { ...r, is_rebinding: true } : r))
    const { error } = await rebindLPO(lpoId, row.rebind_po_id)
    if (error) {
      toast.error('Rebind Failed', error)
      setAuditRows(prev => prev.map(r => r.lpo_id === lpoId ? { ...r, is_rebinding: false } : r))
    } else {
      const newPO = allApprovedPOs.find(p => p.id === row.rebind_po_id)
      toast.success('Rebound', `LPO ${row.lpo_number} is now linked to ${newPO?.po_number ?? row.rebind_po_id}`)
      setAuditRows(prev => prev.map(r => r.lpo_id === lpoId
        ? { ...r, is_rebinding: false, audit_status: 'ok', issue: '', po_id: row.rebind_po_id, po_number: newPO?.po_number ?? r.po_number, po_amount: newPO?.total_amount ?? r.po_amount, rebind_po_id: '' }
        : r
      ))
      handleMutate()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 1. Strict PDF Validation
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast.error("Invalid Format", "Only PDF files are allowed for LPO documents")
        e.target.value = ''
        return
      }

      setUploadData(prev => ({ ...prev, document_file: file }))

      // 2. Identification Logic: Try to extract LPO number from filename
      const fileName = file.name.replace(/\.[^/.]+$/, "") // remove extension
      const lpoMatch = fileName.match(/(LPO[-_]?\d+)/i)
      let identifiedLPO = lpoMatch ? lpoMatch[1].toUpperCase() : ''

      // 3. Extract text details: LPO Number & Dates
      try {
        const textExtractedLpo = await extractLpoNumberFromPdf(file)
        if (textExtractedLpo) {
          identifiedLPO = textExtractedLpo
        }

        const extractedDates = await extractDatesFromPdf(file)
        
        setUploadData(prev => {
          const updated = { ...prev }
          if (identifiedLPO) updated.lpo_number = identifiedLPO
          if (extractedDates.documentDate) updated.document_date = extractedDates.documentDate
          if (extractedDates.expectedDeliveryDate) updated.expected_delivery_date = extractedDates.expectedDeliveryDate
          return updated
        })

        if (identifiedLPO || extractedDates.documentDate) {
          toast.success("Document Analyzed", "LPO number and dates automatically extracted from the PDF!")
        }
      } catch (err) {
        console.error("PDF metadata extraction failed:", err)
      }
    }
  }


  // Format Date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString))
  }

  // Status Badge formatting
  const getStatusBadge = (status: LPOStatus) => {
    const map: Record<LPOStatus, { label: string, classes: string }> = {
      draft: { label: 'Draft', classes: 'bg-gray-100 text-gray-800 border border-gray-200' },
      sent: { label: 'Sent', classes: 'bg-blue-100 text-blue-800 border border-blue-200' },
      verified: { label: 'Verified', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-200' }
    }
    const s = map[status] || map.draft
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.classes}`}>{s.label}</span>
  }

  const getPaymentStatusBadge = (status: LPOPaymentStatus) => {
    const map: Record<LPOPaymentStatus, { label: string, classes: string }> = {
      pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-800 border border-amber-200' },
      processing: { label: 'Processing', classes: 'bg-blue-100 text-blue-800 border border-blue-200' },
      paid: { label: 'Paid', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-200' }
    }
    const s = map[status] || map.pending
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.classes}`}>{s.label}</span>
  }
  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans overflow-x-hidden selection:bg-slate-900 selection:text-white">
      {/* Premium Ambient Radial Lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/[0.04] to-indigo-500/[0.02] rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/[0.02] to-teal-500/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-6">
        {/* Enhanced Breadcrumb navigation with mini icons */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          <span className="text-slate-400">Financial</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400">Procurement</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-extrabold tracking-wide">Local Purchase Orders (LPO)</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
              <IconShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                Local Purchase Orders (LPO)
              </h1>
              <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Manage and track LPO documents synced from ePerolehan/NGEP
              </p>
            </div>
          </div>
        </div>

        {/* Elevated Dashboard KPI Metrics Section wrapped in a luxurious white background card */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl mb-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Total Value */}
            <div className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <IconMoney className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All LPO Value</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums" title={formatCurrency(stats.totalValue).replace('MYR', 'RM')}>{formatCurrency(stats.totalValue).replace('MYR', 'RM')}</h3>
                  <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <IconFileText className="w-3 h-3 text-slate-400" /> {stats.totalApproved} Total Records
                  </p>
                </div>
              </div>
            </div>

            {/* Pending LPO */}
            <div className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <IconShoppingCart className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending LPO</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">{stats.pendingCount}</h3>
                  <p className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                    <IconClock className="w-3 h-3 text-amber-500" /> Awaiting upload
                  </p>
                </div>
              </div>
            </div>

            {/* Sent LPO */}
            <div className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <IconFileText className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sent LPOs</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">{stats.sentCount}</h3>
                  <p className="text-[11px] font-semibold text-sky-600 flex items-center gap-1">
                    <IconReceipt className="w-3 h-3 text-sky-500" /> Uploaded to system
                  </p>
                </div>
              </div>
            </div>

            {/* Verified LPO */}
            <div className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <IconCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified LPOs</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">{stats.verifiedCount}</h3>
                  <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <IconCheck className="w-3 h-3 text-emerald-500" /> Fully validated
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Tabs */}
      <div className="flex flex-wrap bg-slate-100/80 p-1 rounded-2xl w-fit max-w-full border border-slate-200">
        <button
          onClick={() => handleTabChange('pending')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
            activeTab === 'pending'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50 ring-1 ring-black/[0.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <div className="flex items-center justify-center sm:justify-start gap-2 whitespace-nowrap">
            <span className={activeTab === 'pending' ? 'animate-pulse text-amber-500' : ''}>●</span>
            Pending ({stats.pendingCount})
          </div>
        </button>
        <button
          onClick={() => handleTabChange('approved')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
            activeTab === 'approved'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50 ring-1 ring-black/[0.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <div className="flex items-center justify-center sm:justify-start gap-2 whitespace-nowrap">
            <span className={activeTab === 'approved' ? 'text-emerald-500' : ''}>●</span>
            Approved ({stats.sentCount + stats.verifiedCount})
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <IconSearch className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Search by PO, LPO, supplier, or item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <select
              value={voteCodeFilter}
              onChange={(e) => setVoteCodeFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
            >
              <option value="">All Vote Codes</option>
               {metadata.voteCodes
                .filter(code => code === '080702' || code === '990102')
                .map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
            >
              <option value="">All Categories</option>
              {metadata.categories.map(cat => {
                const label = WARRANT_CATEGORIES.find(c => c.value === cat)?.label || cat.replace('_', ' ');
                return (
                  <option key={cat} value={cat}>{label}</option>
                );
              })}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
            >
              <option value="">All Departments</option>
              {WARRANT_DEPARTMENTS.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
            
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm"
            >
              Reset
            </button>

            {(orders.some(o => (o.lpo_number === o.po_number && o.document_url) || o.lpo_number?.toUpperCase().includes('TARIKH'))) && (
              <button
                onClick={handleSyncLPONumbers}
                disabled={isSyncing}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm flex items-center gap-2",
                  isSyncing 
                    ? "bg-amber-50 text-amber-600 border border-amber-200 cursor-not-allowed"
                    : "bg-white text-amber-600 hover:bg-amber-50 border border-amber-200"
                )}
              >
                <IconRefresh className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                {isSyncing ? `Syncing (${syncProgress.current}/${syncProgress.total})...` : "Sync LPO Names"}
              </button>
            )}

            {activeTab === 'pending' && (
              <button
                onClick={() => setIsBulkUploadModalOpen(true)}
                className="px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <IconUpload className="w-4 h-4" />
                Bulk Upload
              </button>
            )}

            {activeTab === 'approved' && stats.sentCount > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 w-full lg:w-auto mt-2 lg:mt-0">
                <button
                  onClick={() => handleVerifyAll(false)}
                  disabled={isLoading || orders.filter(o => o.lpo_status === 'sent' && o.document_url).length === 0}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl sm:rounded-l-xl sm:rounded-r-none transition-all shadow-sm flex items-center justify-center gap-2 group relative overflow-hidden"
                  title="Verify only items on this page"
                >
                  <IconCheck className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 whitespace-nowrap">Verify Page ({orders.filter(o => o.lpo_status === 'sent' && o.document_url).length})</span>
                </button>
                <button
                  onClick={() => handleVerifyAll(true)}
                  disabled={isLoading}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl sm:rounded-r-xl sm:rounded-l-none border sm:border-l-0 border-emerald-200 transition-all shadow-sm flex items-center justify-center gap-2"
                  title="Verify ALL items across ALL pages"
                >
                  <IconShield className="w-4 h-4" />
                  <span className="whitespace-nowrap">Verify All Pages ({stats.sentCount})</span>
                </button>
              </div>
            )}

            {activeTab === 'approved' && (
              <button
                onClick={handleAuditBindings}
                disabled={isAuditing}
                className="px-4 py-2.5 text-xs sm:text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all shadow-sm flex items-center gap-2"
                title="Scan all LPO PDFs and check if amounts match the linked PO"
              >
                <IconShield className="w-4 h-4" />
                <span className="whitespace-nowrap">Audit Bindings</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 sm:p-8 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Spinner className="w-8 h-8 text-blue-500" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50">{error}</div>
        ) : (
          <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm">
            {/* Table Area - Desktop: Table, Mobile: Cards */}
            {/* Desktop Table View */}
            <table className="hidden lg:table w-full text-left text-sm whitespace-nowrap border-collapse">
              <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/10 border-b border-slate-200/80">
                <tr>
                  <th className="w-1.5 p-0" />
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PO Number</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Date</th>
                  {activeTab === 'approved' && <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">LPO Number</th>}
                  {activeTab === 'approved' && <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">LPO Date</th>}
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vote Code</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Department</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Supplier</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                  <th className="w-8 p-0" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-slate-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr 
                       key={order.po_id} 
                      className={`group transition-colors ${
                        activeTab === 'approved' 
                          ? order.lpo_status === 'sent'
                            ? 'bg-emerald-50/60 hover:bg-emerald-100/70 cursor-pointer'
                            : 'hover:bg-blue-50/30 cursor-pointer'
                          : 'hover:bg-slate-50 cursor-pointer'
                      }`}
                      onClick={() => activeTab === 'approved' && setSelectedOrderId(order.po_id)}
                    >
                      <td className="w-1.5 p-0 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-600 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center rounded-r" />
                      </td>
                      <td className="px-6 py-4 text-left">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(order.po_id);
                          }}
                          className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors text-left block"
                        >
                          {order.po_number}
                        </button>
                        <div className="text-xs text-slate-500 mt-0.5 capitalize">{order.po_type.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(order.order_date)}</td>
                      
                      {activeTab === 'approved' && (
                        <td className="px-6 py-4 font-medium">
                          {order.document_url ? (
                            <a 
                              href={order.document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconFileText className="w-3.5 h-3.5" />
                              {order.lpo_number}
                            </a>
                          ) : (
                            <span className="text-blue-600">
                              {order.lpo_number}
                            </span>
                          )}
                        </td>
                      )}
                      
                      {activeTab === 'approved' && (
                        <td className="px-6 py-4 text-slate-600">
                          {order.document_date ? formatDate(order.document_date) : '-'}
                        </td>
                      )}
                      
                      <td className="px-6 py-4 text-slate-600">
                        {order.vote_code || '-'}
                      </td>
                      
                      <td className="px-6 py-4 text-slate-600 capitalize">
                        {order.department ? (WARRANT_DEPARTMENTS.find(d => d.value === order.department)?.label || order.department.replace(/_/g, ' ')) : '-'}
                      </td>
                      
                      <td className="px-6 py-4 text-slate-900">
                        {order.supplier_name || '-'}
                      </td>
                      
                      <td className="px-6 py-4 font-medium text-slate-900 tabular-nums">
                        {formatCurrency(order.total_amount).replace('MYR', 'RM')}
                      </td>
                      
                      {activeTab === 'approved' && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {order.lpo_status === 'sent' ? (
                              <button
                                disabled={!order.document_url}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVerifyLPO(order.lpo_id!);
                                }}
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-sm rounded-lg transition-colors border shadow-sm",
                                  (!order.document_url)
                                    ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" 
                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200"
                                )}
                                title={!order.document_url ? "Missing LPO document" : "Verify LPO"}
                              >
                                <IconCheck className="w-4 h-4" />
                                Verify
                              </button>
                            ) : (
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Verified</span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadTargetPO(order.po_id);
                                setUploadData({
                                  lpo_number: order.lpo_number || '',
                                  document_date: order.document_date || new Date().toISOString().split('T')[0],
                                  document_file: undefined,
                                  expected_delivery_date: undefined
                                });
                                setIsUploadModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-lg border border-slate-200 transition-colors shadow-xs"
                              title="Upload new LPO PDF or change LPO document"
                            >
                              <IconUpload className="w-3.5 h-3.5" />
                              Change LPO
                            </button>
                          </div>
                        </td>
                      )}
                      
                      {activeTab === 'pending' && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadTargetPO(order.po_id);
                              setIsUploadModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-sm rounded-lg transition-colors border border-blue-200 animate-pulse-subtle"
                          >
                            <IconUpload className="w-4 h-4" />
                            Upload LPO
                          </button>
                        </td>
                      )}
                      <td className="w-8 p-0 text-center">
                        <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 inline" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {orders.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500">
                  No records found
                </div>
              ) : (
                orders.map((order) => (
                  <div 
                    key={order.po_id}
                    className="p-5 space-y-4 active:bg-slate-50 transition-colors"
                    onClick={() => activeTab === 'approved' && setSelectedOrderId(order.po_id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PO Number</span>
                        <h4 className="text-base font-bold text-blue-600">{order.po_number}</h4>
                        <div className="text-[10px] text-slate-500 capitalize">{order.po_type.replace('_', ' ')}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                        <p className="text-base font-black text-slate-900 tabular-nums">{formatCurrency(order.total_amount).replace('MYR', 'RM')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Date</span>
                        <p className="text-sm font-bold text-slate-700">{formatDate(order.order_date)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</span>
                        <p className="text-sm font-bold text-slate-700 truncate">{order.supplier_name || '-'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vote Code</span>
                        <p className="text-sm font-bold text-slate-700">{order.vote_code || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</span>
                        <p className="text-sm font-bold text-slate-700 capitalize truncate">
                          {order.department ? (WARRANT_DEPARTMENTS.find(d => d.value === order.department)?.label || order.department.replace(/_/g, ' ')) : '-'}
                        </p>
                      </div>
                    </div>

                    {activeTab === 'approved' && (
                      <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LPO Info</span>
                          {order.document_url ? (
                            <a 
                              href={order.document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconFileText className="w-3.5 h-3.5" />
                              {order.lpo_number}
                            </a>
                          ) : (
                            <p className="text-sm font-bold text-slate-600">{order.lpo_number}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {order.lpo_status === 'sent' ? (
                            <button
                              disabled={!order.document_url}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifyLPO(order.lpo_id!);
                              }}
                              className={cn(
                                "px-3 py-1.5 font-bold text-xs rounded-lg border",
                                (!order.document_url)
                                  ? "bg-gray-50 text-gray-300 border-gray-100" 
                                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
                              )}
                            >
                              Verify
                            </button>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'pending' && (
                      <div className="pt-3 border-t border-slate-50">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadTargetPO(order.po_id);
                            setIsUploadModalOpen(true);
                          }}
                          className="w-full py-2 bg-blue-50 text-blue-600 font-bold text-sm rounded-xl border border-blue-100 flex items-center justify-center gap-2"
                        >
                          <IconUpload className="w-4 h-4" />
                          Upload LPO
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalRecords > 0 && (
          <div className="mt-8 pt-6 pb-6 px-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-slate-900 rounded-full" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Showing <span className="text-slate-900">{(page - 1) * pageSize + 1}</span> to{' '}
                <span className="text-slate-900">
                  {Math.min(page * pageSize, totalRecords)}
                </span>{' '}
                of <span className="text-slate-900">{totalRecords}</span> entries
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-900 hover:text-slate-900 disabled:opacity-20 transition-all"
              >
                <IconChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * pageSize >= totalRecords}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-20 transition-all shadow-lg shadow-slate-900/10"
              >
                Next
                <IconChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SlideOver for PO Detail View */}
      <SlideOver
        isOpen={selectedOrderId !== null}
        onClose={() => setSelectedOrderId(null)}
        title="Purchase Order Details"
        size="5xl"
      >
        {selectedOrderId && (
          <PurchaseOrderDetailView 
            id={selectedOrderId} 
            onClose={() => setSelectedOrderId(null)} 
            isSlideOver={true}
            onMutate={handleMutate}
          />
        )}
      </SlideOver>

      {/* Upload LPO Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsUploadModalOpen(false)}></div>
          
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md relative z-10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Upload LPO Document</h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  LPO Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadData.lpo_number}
                  onChange={(e) => setUploadData({ ...uploadData, lpo_number: e.target.value })}
                  placeholder="e.g. PO26000000123"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Document Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={uploadData.document_date}
                  onChange={(e) => setUploadData({ ...uploadData, document_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Expected Delivery Date (ETA) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={uploadData.expected_delivery_date || ''}
                  onChange={(e) => setUploadData({ ...uploadData, expected_delivery_date: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  LPO Document PDF <span className="text-red-500">*</span>
                </label>
                <div 
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-1 text-center">
                    <IconUpload className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input 
                          ref={fileInputRef}
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only" 
                          accept=".pdf"
                          required
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Strictly PDF format only. Filenames containing "LPO-XXXXX" will be automatically identified.
                    </p>
                    <p className="text-xs text-slate-500">
                      {uploadData.document_file ? uploadData.document_file.name : 'PDF up to 10MB'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isUploading ? (
                    <>
                      <Spinner className="w-4 h-4 text-white" />
                      Uploading...
                    </>
                  ) : (
                    'Save & Link LPO'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal - Visual Matcher Overhaul */}
      {isBulkUploadModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isLoading && setIsBulkUploadModalOpen(false)} />
          <div className="relative bg-white w-full max-w-[95vw] h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-20">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsBulkUploadModalOpen(false)}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <IconX className="w-5 h-5" />
                  <span className="text-sm font-bold">Close Matcher</span>
                </button>
                <div className="w-px h-6 bg-slate-200" />
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Bulk LPO Matcher Workspace</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automatic Duplicate Filtering Enabled</p>
                </div>
              </div>

              {bulkPdfRows.length > 0 && (
                <div className="flex items-center gap-8">
                  <div className="w-64">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                        Queue Progress: {bulkPdfRows.filter(r => r.status === 'valid' || r.status === 'matched').length} / {bulkPdfRows.length}
                      </p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(bulkPdfRows.filter(r => r.status === 'valid' || r.status === 'matched').length / bulkPdfRows.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleBulkUploadSubmit}
                    disabled={isLoading || bulkPdfRows.length === 0 || !bulkPdfRows.some(r => r.status === 'matched')}
                    className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-200 flex items-center gap-2"
                  >
                    {isLoading ? <Spinner className="w-4 h-4 text-white" /> : <IconCheck className="w-5 h-5" />}
                    Confirm & Process Batch
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 flex overflow-hidden">
              {!bulkPdfRows.length ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/30">
                  <div 
                    className="w-full max-w-2xl bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center cursor-pointer hover:border-blue-400 transition-all group"
                    onClick={() => bulkFileInputRef.current?.click()}
                  >
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                      <IconCloud className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4">Upload LPO Documents</h3>
                    <p className="text-slate-500 mb-10 max-w-md mx-auto">
                      Drag & drop multiple LPO PDF documents. We'll automatically filter duplicates and match them to pending POs.
                    </p>
                    <button className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                      Select PDF Files
                    </button>
                  </div>
                  <input type="file" ref={bulkFileInputRef} multiple accept=".pdf" className="hidden" onChange={handleBulkFileChange} />
                </div>
              ) : (
                <>
                  {/* Left Sidebar: Queue & Dismissed Tabs */}
                  <div className="w-[320px] bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-2 bg-slate-100/50 flex gap-1 border-b border-slate-200">
                      <button 
                        onClick={() => setLeftSidebarTab('queue')}
                        className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          leftSidebarTab === 'queue' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Queue ({bulkPdfRows.length})
                      </button>
                      <button 
                        onClick={() => setLeftSidebarTab('dismissed')}
                        className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          leftSidebarTab === 'dismissed' ? 'bg-white text-red-500 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Skipped ({skippedRows.length})
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {leftSidebarTab === 'queue' ? (
                        bulkPdfRows.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-300 italic text-[10px]">
                            Queue is empty
                          </div>
                        ) : (
                          bulkPdfRows.map((row, idx) => (
                            <div 
                              key={idx}
                              onClick={() => setActiveRowIndex(idx)}
                              className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                                activeRowIndex === idx 
                                  ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500/10' 
                                  : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                  row.status === 'matched' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                  <IconFileText className="w-3 h-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold text-slate-900 truncate">{row.file.name}</p>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-[8px] font-black uppercase ${
                                      row.status === 'matched' ? 'text-emerald-500' : 'text-blue-500'
                                    }`}>
                                      {row.status.toUpperCase()}
                                    </span>
                                    {row.matchScore ? (
                                      <span className="text-[8px] font-bold text-slate-400">
                                        • {row.matchScore} pts
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )
                      ) : (
                        skippedRows.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-300 italic text-[10px]">
                            No dismissed files
                          </div>
                        ) : (
                          skippedRows.map((row, idx) => (
                            <div key={idx} className="p-3 bg-white/60 border border-slate-200 rounded-xl opacity-60">
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                                  row.status === 'duplicate' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'
                                }`}>
                                  <IconX className="w-3 h-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] font-bold text-slate-900 truncate">{row.file.name}</p>
                                  <p className="text-[8px] font-black text-red-500 uppercase">{row.reason}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )
                      )}
                    </div>
                    
                    {leftSidebarTab === 'queue' && (
                      <div className="p-4 border-t border-slate-200 bg-white">
                        <button 
                          onClick={() => bulkFileInputRef.current?.click()}
                          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                        >
                          <IconPlus className="w-3.5 h-3.5" />
                          Add Files
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Split View (PDF | Matcher) */}
                  <div className="flex-1 flex overflow-hidden">
                    {/* PDF Preview */}
                    <div className="flex-1 bg-slate-800 flex flex-col relative border-r border-slate-900 shadow-2xl z-10">
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
                        <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl border border-white/10">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                          Preview: {bulkPdfRows[activeRowIndex]?.file.name}
                        </div>
                      </div>
                      
                      <div className="flex-1 w-full overflow-hidden bg-white">
                        {bulkPdfRows[activeRowIndex] ? (
                          <PDFPreview file={bulkPdfRows[activeRowIndex].file} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 italic p-12 text-center">
                            <IconFileText className="w-12 h-12 text-slate-700 mb-4 opacity-20" />
                            <p className="text-sm font-bold text-slate-600">No document selected</p>
                            <p className="text-xs text-slate-400 mt-1">Select a file from the queue to preview it</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PO Matcher */}
                    <div className="w-[500px] bg-white flex flex-col overflow-hidden">
                      <div className="p-4 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Mapping</span>
                            </div>
                            <h4 className="text-base font-black text-slate-900">Match LPO to PO</h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              disabled={activeRowIndex === 0}
                              onClick={() => setActiveRowIndex(prev => prev - 1)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all"
                            >
                              <IconChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <button 
                              onClick={() => {
                                const rowToSkip = bulkPdfRows[activeRowIndex];
                                if (!rowToSkip) return;
                                const nextIdx = activeRowIndex === bulkPdfRows.length - 1 ? (activeRowIndex > 0 ? activeRowIndex - 1 : 0) : activeRowIndex;
                                const newRows = bulkPdfRows.filter((_, i) => i !== activeRowIndex);
                                setBulkPdfRows(newRows);
                                setSkippedRows(prev => [...prev, {
                                  file: rowToSkip.file,
                                  lpoNumber: rowToSkip.lpoNumber,
                                  reason: 'Manually skipped',
                                  status: 'skipped'
                                }]);
                                if (newRows.length > 0) setActiveRowIndex(nextIdx);
                                toast.info('Document skipped');
                              }}
                              className="px-2 py-1 text-[9px] font-black text-red-500 hover:bg-red-50 rounded-lg transition-all border border-red-100 uppercase tracking-widest"
                            >
                              Skip
                            </button>

                            <button 
                              disabled={activeRowIndex === bulkPdfRows.length - 1}
                              onClick={() => setActiveRowIndex(prev => prev + 1)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all"
                            >
                              <IconChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="relative group">
                          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          <input 
                            type="text"
                            placeholder="Search pending POs..."
                            value={poSearch}
                            onChange={(e) => setPoSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                        {bulkPdfRows.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white/50 rounded-[2.5rem] border border-slate-100 border-dashed">
                            <IconCheckCircle className="w-8 h-8 text-slate-200 mb-4" />
                            <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest">Done</h5>
                          </div>
                        ) : bulkPdfRows[activeRowIndex]?.status === 'matched' ? (() => {
                          const matchedPo = pendingPOs.find(p => p.id === bulkPdfRows[activeRowIndex].selectedPoId);
                          return (
                            <div className="h-full flex flex-col p-6 bg-emerald-50/20 rounded-[2.5rem] border border-emerald-100">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200">
                                  <IconCheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                  <h5 className="text-sm font-black text-slate-900">Auto-Matched!</h5>
                                  <p className="text-[10px] font-bold text-emerald-600">
                                    {bulkPdfRows[activeRowIndex].matchReason} ({bulkPdfRows[activeRowIndex].matchScore} pts)
                                  </p>
                                </div>
                              </div>

                              {matchedPo ? (
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                  {/* PO Summary Card */}
                                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matched PO</p>
                                        <h6 className="text-lg font-black text-blue-600">{matchedPo.po_number}</h6>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                                        <h6 className="text-lg font-black text-slate-900">{formatCurrency(matchedPo.total_amount)}</h6>
                                      </div>
                                    </div>
                                    
                                    <div className="pt-3 border-t border-slate-50">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Supplier</p>
                                      <p className="text-sm font-bold text-slate-700">{(matchedPo as any).supplier_name}</p>
                                    </div>
                                  </div>

                                  {/* Item List Preview */}
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PO Items ({ (matchedPo as any).items?.length || 0})</p>
                                    {((matchedPo as any).items || []).slice(0, 5).map((item: any) => (
                                      <div key={item.id} className="bg-white/50 p-3 rounded-xl border border-slate-100 flex justify-between items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[11px] font-bold text-slate-700 truncate">{item.item_name}</p>
                                          <p className="text-[9px] font-black text-slate-400 uppercase">{item.item_code}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <p className="text-[10px] font-black text-slate-900">x{item.quantity_ordered}</p>
                                        </div>
                                      </div>
                                    ))}
                                    {((matchedPo as any).items?.length || 0) > 5 && (
                                      <p className="text-center text-[9px] font-bold text-slate-400 italic">+{(matchedPo as any).items.length - 5} more items...</p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic">
                                  <p className="text-xs">Matched PO data not found</p>
                                </div>
                              )}

                              <div className="mt-6 pt-6 border-t border-emerald-100 flex items-center justify-between">
                                <button 
                                  onClick={() => {
                                    const newRows = [...bulkPdfRows];
                                    newRows[activeRowIndex].selectedPoId = '';
                                    newRows[activeRowIndex].status = 'pending' as any;
                                    setBulkPdfRows(newRows);
                                  }}
                                  className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                                >
                                  Unmatch / Change
                                </button>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 rounded-full">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  <span className="text-[9px] font-black text-emerald-600 uppercase">Verified Match</span>
                                </div>
                              </div>
                            </div>
                          );
                        })() : (
                          pendingPOs
                          .filter(po => {
                            // 1. Filter out if already linked to an LPO in the database
                            if (dbLinkedPoIds.has(po.id)) return false;

                            // 2. Filter out if already selected for another LPO in the current session
                            const isAlreadySelectedInSession = bulkPdfRows.some((row, idx) => 
                              idx !== activeRowIndex && row.selectedPoId === po.id
                            );
                            if (isAlreadySelectedInSession) return false;

                            if (!poSearch) return true;
                            const searchLower = poSearch.toLowerCase();
                            const matchesPo = po.po_number.toLowerCase().includes(searchLower);
                            const matchesSupplier = po.supplier_name?.toLowerCase().includes(searchLower);
                            const matchesItems = po.items?.some(item => 
                               (item.item_name || '').toLowerCase().includes(searchLower) || 
                               (item.item_code || '').toLowerCase().includes(searchLower)
                            );
                            return matchesPo || matchesSupplier || matchesItems;
                          })
                            .map((po) => {
                              const isSelected = bulkPdfRows[activeRowIndex]?.selectedPoId === po.id
                              return (
                                <div 
                                  key={po.id}
                                  onClick={() => {
                                    if (bulkPdfRows.some((r, idx) => idx !== activeRowIndex && r.selectedPoId === po.id)) {
                                      toast.error("PO Already Selected");
                                      return
                                    }
                                    if (dbLinkedPoIds.has(po.id)) {
                                      toast.error("Already Processed");
                                      return
                                    }
                                    const newRows = [...bulkPdfRows]
                                    newRows[activeRowIndex].selectedPoId = po.id
                                    newRows[activeRowIndex].status = 'matched'
                                    newRows[activeRowIndex].matchReason = 'Manual Match'
                                    newRows[activeRowIndex].matchScore = 100
                                    newRows[activeRowIndex].lpoNumber = po.po_number
                                    setBulkPdfRows(newRows)
                                    setPoSearch('') // Reset search after choosing
                                    if (activeRowIndex < bulkPdfRows.length - 1) {
                                      setTimeout(() => setActiveRowIndex(activeRowIndex + 1), 300)
                                    }
                                  }}
                                  className={`p-6 border rounded-[2rem] cursor-pointer transition-all ${
                                    isSelected ? 'bg-white border-blue-500 shadow-xl ring-2 ring-blue-500/5' : 'bg-white border-slate-100 hover:border-blue-400 hover:shadow-lg'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 min-w-0 pr-4">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className={`text-base font-black tracking-tight ${isSelected ? 'text-blue-600' : 'text-slate-900'}`}>{po.po_number}</h5>
                                        {isSelected && <IconCheckCircle className="w-4 h-4 text-blue-500" />}
                                      </div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <p className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-50 border border-slate-100 ${isSelected ? 'text-blue-600 border-blue-100' : 'text-slate-400'}`}>
                                          {formatDate(po.order_date)}
                                        </p>
                                      </div>
                                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-700/60' : 'text-slate-500'}`}>
                                        {po.manual_supplier_name || po.supplier_name || 'N/A'}
                                      </p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl text-sm font-black transition-all ${
                                      isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-900'
                                    }`}>
                                      {formatCurrency(po.total_amount)}
                                    </div>
                                  </div>

                                  <div className={`h-px w-full my-4 ${isSelected ? 'bg-blue-50' : 'bg-slate-50'}`} />

                                  <div className="space-y-3">
                                    {(po.items || []).slice(0, 5).map((item: any, i: number) => (
                                      <div key={i} className="flex justify-between items-start group/item">
                                        <div className="flex-1 min-w-0 pr-4">
                                          <p className={`text-[11px] font-black leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                                            {item.item_name}
                                          </p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{item.item_code}</p>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0 text-right">
                                          <div className="text-right">
                                            <p className={`text-[10px] font-black ${isSelected ? 'text-blue-600' : 'text-slate-900'}`}>x{item.quantity_ordered}</p>
                                            <p className="text-[9px] font-bold text-slate-400">{formatCurrency(item.unit_price)}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    {(po.items || []).length > 5 && (
                                      <div className="pt-2 border-t border-slate-50 text-[10px] font-black text-slate-300 italic">
                                        + {(po.items!.length - 5)} more items in this PO
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                        )}
                      </div>
                    </div>
                  </div>

                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Processing Progress Overlay */}
      {isBulkProcessing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border border-white/20">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
              <div 
                className="absolute inset-0 border-4 border-blue-500 rounded-full transition-all duration-300"
                style={{ 
                  clipPath: `polygon(50% 50%, -50% -50%, ${bulkProcessingProgress > 25 ? '150% -50%' : '50% -50%'}, ${bulkProcessingProgress > 50 ? '150% 150%' : '50% 50%'}, ${bulkProcessingProgress > 75 ? '-50% 150%' : '50% 50%'}, -50% -50%)`,
                  transform: 'rotate(-45deg)'
                }}
              />
              <IconCloud className="w-10 h-10 text-blue-500 animate-bounce" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">Processing Batch</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">
              {bulkProcessingProgress}% Complete
            </p>
            
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-6 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 shadow-lg"
                style={{ width: `${bulkProcessingProgress}%` }}
              />
            </div>
            
            <div className="text-xs font-bold text-slate-500 italic flex items-center justify-center gap-2">
              <Spinner className="w-3 h-3 text-blue-500" />
              {bulkProcessingMessage}
            </div>
            
            <p className="mt-8 text-[10px] text-slate-400 font-medium">
              Please do not close your browser or refresh the page until the process is complete.
            </p>
          </div>
        </div>
      )}

      {/* ── Audit Bindings Modal ────────────────────────────────────────────── */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isAuditing && setIsAuditModalOpen(false)} />
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[2rem] shadow-2xl relative z-10 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <IconShield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Binding Integrity Audit</h3>
                  <p className="text-sm text-slate-500">Scan PDFs and verify amounts match the linked Purchase Orders</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                disabled={isAuditing}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {isAuditing ? (
                <div className="flex flex-col items-center justify-center h-64 gap-6">
                  <div className="relative">
                    <Spinner className="w-12 h-12 text-orange-500" />
                    <IconFileText className="w-5 h-5 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" />
                  </div>
                  <div className="text-center space-y-2 w-full max-w-md">
                    <h4 className="font-bold text-slate-700">Auditing LPO Documents</h4>
                    <p className="text-sm text-slate-500">{auditProgress.label}</p>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                        style={{ width: `${Math.max(5, (auditProgress.current / (auditProgress.total || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{auditProgress.current} / {auditProgress.total}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 mb-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <IconCheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Verified OK</p>
                        <p className="text-2xl font-black text-slate-800">{auditRows.filter(r => r.audit_status === 'ok').length}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm flex-1 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <IconShield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-orange-600 uppercase font-bold tracking-wider">Suspicious</p>
                        <p className="text-2xl font-black text-orange-700">{auditRows.filter(r => r.audit_status === 'suspicious').length}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm flex-1 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <IconX className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-red-600 uppercase font-bold tracking-wider">Errors</p>
                        <p className="text-2xl font-black text-red-700">{auditRows.filter(r => r.audit_status === 'error' || r.audit_status === 'no_doc').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                        <tr>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">LPO Number</th>
                          <th className="px-4 py-3">Linked PO</th>
                          <th className="px-4 py-3">Extracted Amount</th>
                          <th className="px-4 py-3">PO Amount</th>
                          <th className="px-4 py-3">Fix Binding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditRows.map((row) => (
                          <React.Fragment key={row.lpo_id}>
                            <tr className={cn(row.audit_status === 'suspicious' ? 'bg-orange-50/50' : '')}>
                              <td className="px-4 py-3">
                                {row.audit_status === 'ok' && <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200"><IconCheckCircle className="w-3 h-3" /> OK</span>}
                                {row.audit_status === 'suspicious' && <span className="inline-flex items-center gap-1 text-orange-600 text-xs font-medium px-2 py-1 rounded-md bg-orange-50 border border-orange-200"><IconShield className="w-3 h-3" /> Suspicious</span>}
                                {(row.audit_status === 'error' || row.audit_status === 'no_doc') && <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium px-2 py-1 rounded-md bg-red-50 border border-red-200"><IconX className="w-3 h-3" /> {row.audit_status === 'no_doc' ? 'No PDF' : 'Error'}</span>}
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-700">
                                <div className="flex flex-col gap-1">
                                  {row.document_url ? (
                                    <>
                                      <a 
                                        href={row.document_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 w-fit font-semibold"
                                        title="Open LPO PDF in new tab"
                                      >
                                        {row.lpo_number}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedLpoPdfId(expandedLpoPdfId === row.lpo_id ? null : row.lpo_id)}
                                        className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold text-left mt-0.5"
                                      >
                                        {expandedLpoPdfId === row.lpo_id ? 'Hide PDF Preview' : 'Preview PDF inline'}
                                      </button>
                                    </>
                                  ) : (
                                    row.lpo_number
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-800">{row.po_number}</span>
                                  <span className="text-[10px] text-slate-400 truncate max-w-[150px]" title={row.supplier_name}>{row.supplier_name}</span>
                                  {row.items && row.items.length > 0 && (
                                    <div className="text-[10px] mt-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setExpandedRows(prev => {
                                          const next = new Set(prev)
                                          if (next.has(row.lpo_id)) {
                                            next.delete(row.lpo_id)
                                          } else {
                                            next.add(row.lpo_id)
                                          }
                                          return next
                                        })}
                                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                                      >
                                        {expandedRows.has(row.lpo_id) ? 'Hide Items' : 'View Items'} ({row.items.length})
                                      </button>
                                      {expandedRows.has(row.lpo_id) && (
                                        <div className="text-[10px] text-slate-500 mt-1 max-w-[280px] bg-slate-50 border border-slate-100 rounded p-1.5 whitespace-normal leading-relaxed">
                                          <span className="font-bold text-slate-600 block mb-0.5">PO Items: </span>
                                          <span className="italic">{row.items.map(i => i.item_name).join(', ')}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-700">
                                {row.extracted_amount !== null ? formatCurrency(row.extracted_amount) : '-'}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-700">
                                {formatCurrency(row.po_amount)}
                              </td>
                              <td className="px-4 py-3">
                                {row.audit_status === 'suspicious' ? (
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex flex-col gap-1">
                                      <input
                                        type="text"
                                        placeholder="Search correct PO..."
                                        value={row.rebind_search || ''}
                                        onChange={(e) => {
                                          const val = e.target.value
                                          setAuditRows(prev => prev.map(r => r.lpo_id === row.lpo_id ? { ...r, rebind_search: val } : r))
                                        }}
                                        className="text-[10px] border border-slate-200 rounded px-2 py-0.5 bg-white focus:ring-1 focus:ring-blue-500 w-48"
                                      />
                                      <div className="flex items-center gap-2">
                                        <select
                                          value={row.rebind_po_id}
                                          onChange={(e) => setAuditRows(prev => prev.map(r => r.lpo_id === row.lpo_id ? { ...r, rebind_po_id: e.target.value } : r))}
                                          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 w-48"
                                        >
                                          <option value="">Select Correct PO...</option>
                                          {allApprovedPOs
                                            .filter(po => {
                                              if (!row.rebind_search) return true
                                              const term = row.rebind_search.toLowerCase()
                                              return po.po_number.toLowerCase().includes(term) ||
                                                     po.supplier_name.toLowerCase().includes(term) ||
                                                     po.items?.some(i => i.item_name.toLowerCase().includes(term))
                                            })
                                            .map(po => (
                                              <option 
                                                key={po.id} 
                                                value={po.id}
                                                title={po.items ? `Items: ${po.items.map(i => i.item_name).join(', ')}` : undefined}
                                              >
                                                {po.po_number} (RM {po.total_amount.toFixed(2)}){po.items && po.items.length > 0 ? ` - ${po.items.map(i => i.item_name).slice(0, 3).join(', ')}${po.items.length > 3 ? '...' : ''}` : ''}
                                              </option>
                                            ))
                                          }
                                        </select>
                                        <button
                                          onClick={() => handleRebind(row.lpo_id)}
                                          disabled={row.is_rebinding || !row.rebind_po_id}
                                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0"
                                        >
                                          {row.is_rebinding ? 'Rebinding...' : 'Rebind'}
                                        </button>
                                      </div>
                                    </div>
                                    {row.rebind_po_id && (() => {
                                      const selectedPO = allApprovedPOs.find(p => p.id === row.rebind_po_id);
                                      return selectedPO?.items && selectedPO.items.length > 0 ? (
                                        <div className="text-[10px] text-slate-500 max-w-[280px] bg-slate-50 border border-slate-100 rounded p-1.5 whitespace-normal" title={selectedPO.items.map(i => i.item_name).join(', ')}>
                                          <span className="font-semibold text-slate-600 block mb-0.5">Selected PO Items:</span>
                                          <div className="line-clamp-2 leading-tight">{selectedPO.items.map(i => i.item_name).join(', ')}</div>
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">{row.issue}</span>
                                )}
                              </td>
                            </tr>
                            {expandedLpoPdfId === row.lpo_id && row.document_url && (
                              <tr className="bg-slate-50">
                                <td colSpan={6} className="px-6 py-4">
                                  <div className="w-full h-[500px] border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-white">
                                    <PDFPreview url={row.document_url} />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}

                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
)
}

export default LPOListPage
