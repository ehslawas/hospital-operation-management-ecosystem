// @ts-nocheck
import React, { useState, useRef } from 'react'
import { Modal, Spinner, Badge } from '@/components/ui'
import { 
  parseSupplierExcel, 
  matchExcelToDatabase, 
  ParsedExcelResult, 
  MatchedPOGroup 
} from '../../services/excelUploadService'
import { useAuthStore } from '@/stores/authStore'
import { 
  IconUpload, 
  IconCheckCircle, 
  IconAlertCircle, 
  IconFileText, 
  IconArrowRight, 
  IconPlus, 
  IconX,
  IconSearch,
  IconPackage
} from '@/components/ui/Icons'
import GoodsReceivingForm from './GoodsReceivingForm'
import { cn } from '@/lib/utils'

interface ExcelUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ExcelUploadModal({
  isOpen,
  onClose,
  onSuccess
}: ExcelUploadModalProps) {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const userId = user?.id

  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<ParsedExcelResult | null>(null)
  const [matchedGroups, setMatchedGroups] = useState<MatchedPOGroup[]>([])
  const [progressStatus, setProgressStatus] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  
  // Stepper State
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null)
  const [approvedGroups, setApprovedGroups] = useState<string[]>([]) // Array of LPO numbers
  const [skippedGroups, setSkippedGroups] = useState<string[]>([]) // Array of LPO numbers

  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'approved' | 'skipped'>('all')
  const pageSize = 10

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void handleFile(e.target.files[0])
    }
  }

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload a valid Excel file (.xlsx or .xls)')
      return
    }

    setFile(selectedFile)
    setError(null)
    setIsLoading(true)
    setProgressStatus('Initializing parser...')
    setProgressPercent(5)

    try {
      // 1. Parse Excel
      const parsed = await parseSupplierExcel(selectedFile, (status, percent) => {
        setProgressStatus(status)
        setProgressPercent(Math.floor(percent * 0.4))
      })
      setParseResult(parsed)

      if (parsed.rows.length === 0 && parsed.errors.length > 0) {
        setError(parsed.errors[0].message)
        setIsLoading(false)
        return
      }

      // 2. Match to DB
      if (hospitalId) {
        const groups = await matchExcelToDatabase(parsed, hospitalId, (status, percent) => {
          setProgressStatus(status)
          setProgressPercent(40 + Math.floor(percent * 0.6))
        })
        setMatchedGroups(groups)
        setStep('review')
        
        // Auto-select first ready matched PO
        const firstReadyIdx = groups.findIndex(g => g.poId && !g.alreadyProcessed)
        if (firstReadyIdx !== -1) {
          setActiveGroupIndex(firstReadyIdx)
        } else {
          // Fallback to first matched PO if none are ready
          const firstMatchedIdx = groups.findIndex(g => g.poId)
          if (firstMatchedIdx !== -1) {
            setActiveGroupIndex(firstMatchedIdx)
          }
        }
      } else {
        setError('Hospital ID not found. Please re-login.')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to process Excel file.')
    } finally {
      setIsLoading(false)
      setProgressPercent(0)
      setProgressStatus('')
    }
  }

  const handleReviewPO = (index: number) => {
    setActiveGroupIndex(index)
  }

  const handleSkipPO = (lpoNumber: string) => {
    setSkippedGroups(prev => [...prev, lpoNumber])
    
    // Auto-select next ready group after skipping
    const currentIndex = matchedGroups.findIndex(g => g.lpoNumber === lpoNumber)
    selectNextReadyGroup(currentIndex, [lpoNumber])
  }

  const selectNextReadyGroup = (currentIndex: number, currentSkips: string[] = []) => {
    const nextReadyIdx = matchedGroups.findIndex((g, i) => 
      i > currentIndex && 
      g.poId && 
      !approvedGroups.includes(g.lpoNumber) && 
      !skippedGroups.includes(g.lpoNumber) &&
      !currentSkips.includes(g.lpoNumber) &&
      !g.alreadyProcessed
    )
    
    if (nextReadyIdx !== -1) {
      setActiveGroupIndex(nextReadyIdx)
    } else {
      // Look from beginning
      const firstReadyIdx = matchedGroups.findIndex((g) => 
        g.poId && 
        !approvedGroups.includes(g.lpoNumber) && 
        !skippedGroups.includes(g.lpoNumber) &&
        !currentSkips.includes(g.lpoNumber) &&
        !g.alreadyProcessed
      )
      if (firstReadyIdx !== -1) {
        setActiveGroupIndex(firstReadyIdx)
      } else {
        setActiveGroupIndex(null)
      }
    }
  }

  const handleFormSuccess = () => {
    if (activeGroupIndex !== null) {
      const activeGroup = matchedGroups[activeGroupIndex]
      setApprovedGroups(prev => [...prev, activeGroup.lpoNumber])
      onSuccess() // Refresh the main page list
      
      // Auto-select next ready group
      selectNextReadyGroup(activeGroupIndex, [activeGroup.lpoNumber])
    }
  }

  const handleClose = () => {
    // Reset state
    setFile(null)
    setError(null)
    setParseResult(null)
    setMatchedGroups([])
    setApprovedGroups([])
    setSkippedGroups([])
    setStep('upload')
    setCurrentPage(1)
    setSearchQuery('')
    setStatusFilter('all')
    setActiveGroupIndex(null)
    onClose()
  }

  const unmatchedGroups = matchedGroups.filter(g => !g.poId)
  const matchedGroupsOnly = matchedGroups.filter(g => g.poId)

  // Filter groups based on search query and status tab filter
  const filteredGroups = matchedGroupsOnly.filter(group => {
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = !query || 
      group.lpoNumber.toLowerCase().includes(query) ||
      group.poNumber.toLowerCase().includes(query) ||
      group.supplierName.toLowerCase().includes(query)

    const isApproved = approvedGroups.includes(group.lpoNumber)
    const isSkipped = skippedGroups.includes(group.lpoNumber)
    
    if (statusFilter === 'approved') return matchesSearch && isApproved
    if (statusFilter === 'skipped') return matchesSearch && isSkipped
    if (statusFilter === 'ready') return matchesSearch && !isApproved && !isSkipped && !group.alreadyProcessed
    
    return matchesSearch
  })

  // Paginated matched groups
  const totalPages = Math.ceil(filteredGroups.length / pageSize)
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="IMPORT SUPPLIER DELIVERY SHEET"
      size={step === 'review' ? 'full' : '4xl'}
      className={cn("font-sans bg-[#F8FAFC]", step === 'review' ? "max-w-[96vw] w-full" : "")}
    >
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-6 max-w-md mx-auto">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
            <span className="absolute text-xs font-black text-slate-800">{progressPercent}%</span>
          </div>
          <div className="text-center space-y-3 w-full">
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-800 uppercase tracking-widest">{progressStatus || 'Parsing Excel & Matching records...'}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Cross-referencing LPO numbers & codes with pharmacy registry</p>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 shadow-inner">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      ) : step === 'upload' ? (
        <div className="space-y-6">
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
              <IconAlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-rose-800 uppercase tracking-widest">Upload Error</h4>
                <p className="text-xs text-rose-600 mt-1 font-bold">{error}</p>
              </div>
            </div>
          )}

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 select-none min-h-[300px]",
              dragActive 
                ? "border-indigo-500 bg-indigo-50/50 scale-98 shadow-inner" 
                : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <IconUpload className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">Drag & Drop Supplier Excel</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">or click to browse local files</p>
            </div>
            <Badge variant="gray" className="font-mono text-[9px] tracking-widest px-3 py-1 mt-2 border">
              SUPPORTED FORMATS: .XLSX, .XLS
            </Badge>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expected Columns in Excel File</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                'LPO NO.',
                'Delivery Note',
                'Item Code',
                'Quantity',
                'Batch No.',
                'Expiry Date',
                'Supplier Name',
                'Receipt No.'
              ].map((col, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-slate-700 tracking-tight uppercase">{col}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Info Banner */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black tracking-tight uppercase italic leading-none">Review Excel Sync Queue</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                Parsed <span className="text-white">{parseResult?.rows.length || 0} rows</span> • Found <span className="text-emerald-400">{matchedGroupsOnly.length} matching POs</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-center min-w-[100px]">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">APPROVED</p>
                <p className="text-sm font-black text-emerald-400">{approvedGroups.length} / {matchedGroupsOnly.length}</p>
              </div>
              {skippedGroups.length > 0 && (
                <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-center min-w-[100px]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">SKIPPED</p>
                  <p className="text-sm font-black text-amber-400">{skippedGroups.length}</p>
                </div>
              )}
            </div>
          </div>

          {/* Side-by-Side Review Workspace */}
          <div className="flex gap-6 h-[70vh] overflow-hidden items-stretch">
            {/* Left Column: Compact Queue List */}
            <div className="w-[360px] shrink-0 flex flex-col gap-4 border-r border-slate-200 pr-5 overflow-y-auto h-full">
              {/* Search Bar */}
              <div className="relative w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconSearch className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search queue..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              {/* Status Tab Filters */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                {(['all', 'ready', 'approved', 'skipped'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setStatusFilter(tab)
                      setCurrentPage(1)
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                      statusFilter === tab
                        ? 'bg-white text-slate-900 shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'all' ? 'All' : tab}
                  </button>
                ))}
              </div>

              {/* Stepper Card List */}
              {paginatedGroups.length === 0 ? (
                <div className="py-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <IconFileText className="w-10 h-10 mx-auto text-slate-350 opacity-40 mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matched records</p>
                </div>
              ) : (
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                  {paginatedGroups.map((group) => {
                    const isApproved = approvedGroups.includes(group.lpoNumber)
                    const isSkipped = skippedGroups.includes(group.lpoNumber)
                    const isSelected = activeGroupIndex !== null && matchedGroups[activeGroupIndex]?.lpoNumber === group.lpoNumber
                    
                    const originalIdx = matchedGroups.findIndex(g => g.lpoNumber === group.lpoNumber)
                    
                    return (
                      <div 
                        key={group.lpoNumber} 
                        onClick={() => group.poId && handleReviewPO(originalIdx)}
                        className={cn(
                          "bg-white border p-4 rounded-xl hover:shadow-md cursor-pointer transition-all flex flex-col gap-2.5 relative overflow-hidden select-none",
                          isSelected 
                            ? "border-slate-900 ring-1 ring-slate-900" 
                            : "border-slate-200 hover:border-slate-300",
                          (isApproved || isSkipped) && "bg-slate-50/50 opacity-60"
                        )}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-mono font-black text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            LPO: {group.lpoNumber}
                          </span>
                          <div className="shrink-0">
                            {isApproved ? (
                              <Badge variant="success" className="text-[8px] px-1.5 py-0.5">APPROVED</Badge>
                            ) : isSkipped ? (
                              <Badge variant="warning" className="text-[8px] px-1.5 py-0.5">SKIPPED</Badge>
                            ) : group.isDuplicate ? (
                              <Badge variant="error" className="text-[8px] px-1.5 py-0.5">DUPLICATE</Badge>
                            ) : group.alreadyProcessed ? (
                              <Badge variant="success" className="text-[8px] px-1.5 py-0.5">COMPLETED</Badge>
                            ) : (
                              <Badge variant="info" className="text-[8px] px-1.5 py-0.5">READY</Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase truncate" title={group.supplierName}>
                            {group.supplierName}
                          </h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            DO: {group.deliveryNote || 'N/A'} • {group.items.length} items
                          </p>
                        </div>

                        {!isApproved && !isSkipped && !group.alreadyProcessed && (
                          <div className="flex justify-end gap-2 mt-1 border-t border-slate-100 pt-2" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleSkipPO(group.lpoNumber)}
                              className="px-2.5 py-1 border border-slate-200 hover:border-slate-350 text-slate-650 hover:bg-slate-50 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all"
                            >
                              Skip
                            </button>
                            <button
                              onClick={() => handleReviewPO(originalIdx)}
                              className="px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 shadow-sm active:scale-95"
                            >
                              Review <IconArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Stepper Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase">
                    Pg {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-[9px] font-black uppercase disabled:opacity-20 hover:border-slate-800"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase disabled:opacity-20 hover:bg-slate-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Embedded Review Form Workspace */}
            <div className="flex-1 bg-white border border-slate-250 rounded-2xl overflow-y-auto shadow-inner relative h-full">
              {activeGroupIndex !== null ? (
                <GoodsReceivingForm
                  key={matchedGroups[activeGroupIndex].poId}
                  poId={matchedGroups[activeGroupIndex].poId}
                  isOpen={true}
                  isEmbedded={true}
                  onClose={() => setActiveGroupIndex(null)}
                  onSuccess={handleFormSuccess}
                  prefillData={{
                    receiptDate: matchedGroups[activeGroupIndex].receiptDate,
                    deliveryNote: matchedGroups[activeGroupIndex].deliveryNote,
                    invoiceNumber: matchedGroups[activeGroupIndex].invoiceNumber,
                    debugIndices: matchedGroups[activeGroupIndex].debugIndices,
                    items: matchedGroups[activeGroupIndex].items
                  }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 p-8">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-350 shadow-sm">
                    <IconPackage className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Select PO to Review</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Click review on any LPO in the queue on the left side</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unmatched LPOs Section */}
          {unmatchedGroups.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <IconAlertCircle className="w-4 h-4 text-amber-600" />
                <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em]">Unmatched LPOs in Excel ({unmatchedGroups.length})</h4>
              </div>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight pl-6">
                The LPO numbers below were found in the uploaded file but do not exist in the database.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pl-6 mt-2">
                {unmatchedGroups.map((group, idx) => (
                  <div key={idx} className="bg-white border border-amber-100 p-2.5 rounded-xl shadow-xs flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black text-slate-850">
                      {group.lpoNumber}
                    </span>
                    <Badge variant="warning" className="font-mono text-[8px] px-1.5">UNMATCHED</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
