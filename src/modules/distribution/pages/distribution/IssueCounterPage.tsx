// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react'
import {
  Package,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  Send,
  AlertCircle,
  QrCode,
  Calendar,
  Layers,
  ShieldCheck,
  Lock,
  Edit3,
  History,
  CheckSquare,
  Square,
  FileText,
  ArrowRight,
  UserCheck,
  Sparkles,
  Filter,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertTriangle,
  ClipboardList,
  Tag,
  Hash,
  Activity,
  MapPin
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Spinner, Input, Badge, Modal } from '@/components/ui'
import {
  getIndentRequests,
  issueIndentRequest,
  getIndentItemsStockAvailability,
} from '@/modules/distribution/services/indentService'
import type { IndentRequestWithRelations, ItemStoreStockInfo } from '@/types/pharmacy'

interface AuditLogEntry {
  id: string
  itemId: string
  itemName: string
  timestamp: string
  officer: string
  previousValues: {
    qty: number
    batch: string
    expiry: string
  }
  newValues: {
    qty: number
    batch: string
    expiry: string
  }
  reason: string
}

const formatLocationDisplay = (locStr?: string, isDrug: boolean = true) => {
  if (!locStr || ['decanting', 'default', 'n/a', '—'].includes(locStr.trim().toLowerCase())) {
    return isDrug ? 'Stor Logistik (Ubat) > Rack M > Level 3' : 'Stor Logistik (Bukan Ubat) > Rack A > Level 1'
  }
  return locStr
    .replace(/^\[[^\]]+\]\s*/, '') // Remove code like [LOG-SL-001]
    .replace(/\((Drug|drug)\)/gi, '(Ubat)') // Translate (Drug) to (Ubat)
    .replace(/\((Non-Drug|non-drug|nondrug)\)/gi, '(Bukan Ubat)') // Translate (Non-Drug) to (Bukan Ubat)
}

export const IssueCounterPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || 'hosp-1'
  const { success: showSuccess, error: showError } = useToastStore()

  const [queue, setQueue] = useState<IndentRequestWithRelations[]>([])
  const [selectedRequest, setSelectedRequest] = useState<IndentRequestWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tracking picked state for each line item (physical checklist)
  const [pickedItems, setPickedItems] = useState<Record<string, boolean>>({})

  // Form values (Read-Only by default on the UI)
  const [issueForm, setIssueForm] = useState<
    Record<
      string,
      {
        qty_issued: number
        batch_number: string
        expiry_date: string
        is_edited?: boolean
      }
    >
  >({})

  // Audit Logs Store
  const [auditLogs, setAuditLogs] = useState<Record<string, AuditLogEntry[]>>(() => {
    try {
      const saved = localStorage.getItem('hom_issue_counter_audit_logs')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Edit / Amendment Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [editQty, setEditQty] = useState<number>(1)
  const [editBatch, setEditBatch] = useState<string>('')
  const [editExpiry, setEditExpiry] = useState<string>('')
  const [editReason, setEditReason] = useState<string>('')
  const [editFormError, setEditFormError] = useState<string | null>(null)

  // Audit History Viewer Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyItem, setHistoryItem] = useState<any | null>(null)

  const officerName = useMemo(() => {
    return user?.full_name || (user as any)?.name || user?.email?.split('@')[0] || 'Pegawai Farmasi Bertugas'
  }, [user])

  // Real-time stock info & location cache
  const [stockInfoMap, setStockInfoMap] = useState<Record<string, ItemStoreStockInfo>>({})

  const loadQueue = async () => {
    setIsLoading(true)
    const res = await getIndentRequests(hospitalId, { status: 'approved' })
    if (res.data) {
      setQueue(res.data.data)
      if (res.data.data.length > 0) {
        void selectRequestForIssuing(res.data.data[0])
      } else {
        setSelectedRequest(null)
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    void loadQueue()
  }, [hospitalId])

  const selectRequestForIssuing = async (req: IndentRequestWithRelations) => {
    setSelectedRequest(req)
    const initialForm: Record<string, { qty_issued: number; batch_number: string; expiry_date: string; is_edited?: boolean }> = {}
    const initialPicked: Record<string, boolean> = {}

    req.items?.forEach((it) => {
      initialForm[it.id] = {
        qty_issued: it.qty_approved ?? it.qty_requested,
        batch_number: it.batch_number || `BN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        expiry_date: it.expiry_date || '2028-06-30',
        is_edited: false,
      }
      initialPicked[it.id] = false // Default to unpicked so user checks each as they pick
    })

    setIssueForm(initialForm)
    setPickedItems(initialPicked)

    // Load store stock & shelf location info
    if (req.items && req.items.length > 0) {
      try {
        const stockRes = await getIndentItemsStockAvailability(hospitalId, req.items)
        if (stockRes.data) {
          setStockInfoMap(stockRes.data)
        }
      } catch (err) {
        console.warn('Could not load stock location metadata:', err)
      }
    }
  }

  // Toggle single item picked check
  const togglePicked = (itemId: string) => {
    setPickedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  // Check all items
  const toggleAllPicked = (check: boolean) => {
    if (!selectedRequest?.items) return
    const updated: Record<string, boolean> = {}
    selectedRequest.items.forEach((it) => {
      updated[it.id] = check
    })
    setPickedItems(updated)
  }

  // Open Edit Modal
  const openEditModal = (item: any) => {
    const currentVal = issueForm[item.id] || {
      qty_issued: item.qty_approved ?? item.qty_requested,
      batch_number: item.batch_number || '',
      expiry_date: item.expiry_date || '2028-06-30',
    }

    setEditingItem(item)
    setEditQty(currentVal.qty_issued)
    setEditBatch(currentVal.batch_number)
    setEditExpiry(currentVal.expiry_date)
    setEditReason('')
    setEditFormError(null)
    setIsEditModalOpen(true)
  }

  // Save Edit & Log to Audit Trail
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    if (!editReason.trim()) {
      setEditFormError('Sila masukkan sebab / justifikasi pindaan (diperlukan untuk audit).')
      return
    }

    const maxApproved = editingItem.qty_approved ?? editingItem.qty_requested
    if (editQty <= 0 || isNaN(editQty)) {
      setEditFormError('Kuantiti dikeluarkan mestilah sekurang-kurangnya 1.')
      return
    }

    if (editQty > maxApproved) {
      setEditFormError(`Kuantiti dikeluarkan tidak boleh melebihi kuantiti diluluskan (${maxApproved} ${editingItem.unit}).`)
      return
    }

    if (!editBatch.trim()) {
      setEditFormError('No. Batch tidak boleh dibiarkan kosong.')
      return
    }

    const previousVal = issueForm[editingItem.id] || {
      qty_issued: maxApproved,
      batch_number: editingItem.batch_number || '',
      expiry_date: editingItem.expiry_date || '2028-06-30',
    }

    // Record Audit Entry
    const newLogEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: editingItem.id,
      itemName: editingItem.item_name,
      timestamp: new Date().toISOString(),
      officer: officerName,
      previousValues: {
        qty: previousVal.qty_issued,
        batch: previousVal.batch_number,
        expiry: previousVal.expiry_date,
      },
      newValues: {
        qty: editQty,
        batch: editBatch.trim(),
        expiry: editExpiry,
      },
      reason: editReason.trim(),
    }

    // Save to audit logs state & localStorage
    setAuditLogs((prev) => {
      const itemLogs = prev[editingItem.id] || []
      const updated = {
        ...prev,
        [editingItem.id]: [newLogEntry, ...itemLogs],
      }
      try {
        localStorage.setItem('hom_issue_counter_audit_logs', JSON.stringify(updated))
      } catch {}
      return updated
    })

    // Update issue form values
    setIssueForm((prev) => ({
      ...prev,
      [editingItem.id]: {
        qty_issued: editQty,
        batch_number: editBatch.trim(),
        expiry_date: editExpiry,
        is_edited: true,
      },
    }))

    setIsEditModalOpen(false)
    showSuccess(`Pindaan item "${editingItem.item_name}" berjaya disimpan & direkodkan dalam log audit.`)
  }

  // Open History Modal
  const openHistoryModal = (item: any) => {
    setHistoryItem(item)
    setIsHistoryModalOpen(true)
  }

  // Handle Dispatch Submission
  const handleIssueSubmit = async () => {
    if (!selectedRequest) return

    // Ensure all items are physically picked
    const allPicked = selectedRequest.items?.every((it) => pickedItems[it.id])
    if (!allPicked) {
      showError('Sila tandakan semua item fizikal telah diambil dari rak sebelum membuat pengeluaran.')
      return
    }

    setIsSubmitting(true)

    const issuedItemsPayload = Object.entries(issueForm).map(([itemId, val]) => {
      const lineItem = selectedRequest.items?.find((it) => it.id === itemId || it.item_id === itemId)
      return {
        item_id: itemId,
        actual_item_id: lineItem?.item_id,
        item_type: lineItem?.item_type || 'drug',
        item_code: lineItem?.item_code,
        item_name: lineItem?.item_name,
        unit: lineItem?.unit,
        qty_issued: val.qty_issued,
        batch_number: val.batch_number,
        expiry_date: val.expiry_date,
      }
    })

    const res = await issueIndentRequest(
      selectedRequest.id,
      user?.id || 'user-pharm-01',
      issuedItemsPayload,
      hospitalId
    )

    setIsSubmitting(false)

    if (res.error) {
      showError(res.error)
    } else {
      showSuccess(`Indent ${selectedRequest.indent_number} berjaya dikeluarkan & direkodkan secara automatik dalam Lejar KEW.PS-4!`)
      void loadQueue()
    }
  }

  const filteredQueue = queue.filter(
    (q) =>
      q.indent_number.toLowerCase().includes(search.toLowerCase()) ||
      q.requesting_department?.department_name.toLowerCase().includes(search.toLowerCase())
  )

  const allItemsPicked = selectedRequest?.items?.length
    ? selectedRequest.items.every((it) => pickedItems[it.id])
    : false

  const pickedCount = selectedRequest?.items?.filter((it) => pickedItems[it.id]).length || 0
  const totalItemsCount = selectedRequest?.items?.length || 0

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Top Executive Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border border-teal-500/20 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-inner">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-100">
                  Store Issue Counter
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 font-semibold">
                  Kaunter Pengeluaran Stok
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Semakan item indent diluluskan, panduan lokasi rak stor, pengesahan fizikal & pengeluaran automatik ke Lejar KEW.PS-4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>Pegawai: <strong className="text-slate-100">{officerName}</strong></span>
            </div>
            <button
              onClick={() => void loadQueue()}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              title="Muat Semula Senarai"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400 font-mono">Memuatkan senarai giliran pengeluaran...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Queue List (3.5 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Giliran Diluluskan ({queue.length})
                </h2>
                <Badge variant="success" className="text-[10px] uppercase font-bold tracking-wider">
                  Sedia Diagih
                </Badge>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <Input
                  placeholder="Cari no. indent / jabatan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-950 border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 rounded-xl"
                />
              </div>

              <div className="space-y-2.5 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
                {filteredQueue.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800/80 rounded-2xl p-6">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-400" />
                    <p className="font-medium text-slate-400">Tiada Indent Menunggu</p>
                    <p className="text-[11px] text-slate-600 mt-1">Semua pesanan indent yang diluluskan telah selesai dikeluarkan.</p>
                  </div>
                ) : (
                  filteredQueue.map((req) => {
                    const isSelected = selectedRequest?.id === req.id
                    return (
                      <div
                        key={req.id}
                        onClick={() => void selectRequestForIssuing(req)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-r from-teal-950/60 to-slate-900 border-teal-500/50 shadow-lg shadow-teal-950/50 ring-1 ring-teal-500/20'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 opacity-70" />
                            {req.indent_number}
                          </span>
                          {req.priority === 'urgent' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold uppercase tracking-wider animate-pulse">
                              ⚡ Urgent
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                          <p className="text-xs font-semibold text-slate-200 truncate">
                            {req.requesting_department?.department_name || 'Nephrology Department'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800/60">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-500" />
                            <strong className="text-slate-300">{req.items?.length || 0}</strong> baris item
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {new Date(req.request_date).toLocaleDateString('en-MY')}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Workstation (8.5 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {!selectedRequest ? (
              <div className="p-16 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-center text-slate-500 shadow-xl space-y-3">
                <Package className="w-12 h-12 mx-auto text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-400">Pilih Indent daripada Giliran</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Sila klik pada salah satu indent yang diluluskan di sebelah kiri untuk menyemak dan memulakan pengeluaran stok.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Executive Indent Summary Card */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-lg font-bold font-mono text-emerald-400 tracking-tight flex items-center gap-2">
                          <Tag className="w-4 h-4 text-emerald-500" />
                          {selectedRequest.indent_number}
                        </h2>
                        <Badge variant="success" className="text-[10px] uppercase font-bold tracking-wider">
                          Diluluskan
                        </Badge>
                        {selectedRequest.priority === 'urgent' && (
                          <Badge variant="danger" className="text-[10px] uppercase font-bold tracking-wider">
                            Keutamaan Tinggi
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-400" />
                        Jabatan Penerima:{' '}
                        <strong className="text-slate-100 font-semibold">
                          {selectedRequest.requesting_department?.department_name || 'Nephrology Department'}
                        </strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 sm:text-right">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Pemohon</span>
                        <span className="text-slate-200 font-medium">{selectedRequest.requester?.full_name || 'Staff Nurse'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Tarikh Diperlukan</span>
                        <span className="text-slate-200 font-medium font-mono">
                          {selectedRequest.required_date || 'Segera'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Checklist & Physical Progress Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-400" />
                      <span className="text-slate-300">
                        Status Pengambilan Fizikal:{' '}
                        <strong className="text-emerald-400 font-mono">
                          {pickedCount} / {totalItemsCount}
                        </strong>{' '}
                        item telah diambil & ditanda
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAllPicked(!allItemsPicked)}
                        className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1.5"
                      >
                        {allItemsPicked ? (
                          <>
                            <Square className="w-3.5 h-3.5" /> Nyahpilih Semua
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" /> Tandakan Semua Diambil
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Line Items Cards (Luxury Read-Only Presentation with Location & Picking Cross-Out) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-400" /> Senarai Item Pengeluaran ({totalItemsCount})
                    </h3>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" /> Mod Terpelihara (Read-Only)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedRequest.items?.map((item, idx) => {
                      const currentVal = issueForm[item.id] || {
                        qty_issued: item.qty_approved ?? item.qty_requested,
                        batch_number: item.batch_number || 'BN-2026-STORE',
                        expiry_date: item.expiry_date || '2028-06-30',
                        is_edited: false,
                      }

                      const isPicked = !!pickedItems[item.id]
                      const itemLogs = auditLogs[item.id] || []
                      const hasAuditLogs = itemLogs.length > 0

                      // Resolved storage location for item matching KEW.PS-4 Ledger
                      const isDrug = (item.item_type || 'drug').toLowerCase() === 'drug'
                      let rawLoc = stockInfoMap[item.id]?.location || item.location

                      if (!rawLoc || ['decanting', 'default', 'n/a', '—'].includes(rawLoc.trim().toLowerCase())) {
                        try {
                          const overrides = JSON.parse(localStorage.getItem('kewps4_item_overrides') || '{}')
                          const ov = overrides[item.item_id] || overrides[item.id]
                          if (ov?.location && !['decanting', 'default', 'n/a'].includes(ov.location.trim().toLowerCase())) {
                            rawLoc = ov.location
                          }
                        } catch {}
                      }

                      const itemLocation = formatLocationDisplay(rawLoc, isDrug)

                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                            isPicked
                              ? 'bg-slate-900/60 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-md'
                              : 'bg-slate-900/95 border-slate-800 hover:border-slate-700 shadow-sm'
                          }`}
                        >
                          {/* Picked Visual Watermark Strip */}
                          {isPicked && (
                            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
                          )}

                          {/* Item Header Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/70">
                            <div className="flex items-start gap-3">
                              {/* Physical Pick Checkbox Button */}
                              <button
                                onClick={() => togglePicked(item.id)}
                                className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                  isPicked
                                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                                    : 'bg-slate-950 border border-slate-700 text-transparent hover:border-teal-400 hover:text-teal-400/30'
                                }`}
                                title={isPicked ? 'Klik untuk batal tanda' : 'Klik setelah ambil dari rak'}
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </button>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-xs font-bold tracking-tight transition-all duration-200 ${
                                      isPicked ? 'line-through text-slate-400 opacity-75' : 'text-slate-100'
                                    }`}
                                  >
                                    {idx + 1}. {item.item_name}
                                  </span>

                                  {/* Picked Badge */}
                                  {isPicked && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" /> Telah Diambil
                                    </span>
                                  )}

                                  {/* Edited Badge */}
                                  {currentVal.is_edited && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold flex items-center gap-1">
                                      <Edit3 className="w-2.5 h-2.5" /> Dipinda
                                    </span>
                                  )}
                                </div>

                                <div
                                  className={`flex items-center gap-2 text-[11px] font-mono mt-1 flex-wrap transition-all duration-200 ${
                                    isPicked ? 'line-through opacity-60 text-slate-500' : 'text-slate-400'
                                  }`}
                                >
                                  <span className="text-teal-400 font-semibold">Kod: {item.item_code || 'N/A'}</span>
                                  <span>•</span>
                                  <span className="uppercase text-slate-500">{item.item_type || 'DRUG'}</span>
                                  <span>•</span>
                                  <span className="text-slate-300">{item.unit}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {hasAuditLogs && (
                                <button
                                  onClick={() => openHistoryModal(item)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors flex items-center gap-1"
                                  title="Lihat sejarah pindaan"
                                >
                                  <History className="w-3 h-3 text-amber-400" />
                                  Log ({itemLogs.length})
                                </button>
                              )}

                              <button
                                onClick={() => openEditModal(item)}
                                className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-[11px] font-semibold border border-teal-500/30 transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <Edit3 className="w-3 h-3" /> Pinda Butiran
                              </button>
                            </div>
                          </div>

                          {/* Read-Only Verified Data Grid (4 Columns: Qty, Location, Batch, Expiry) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
                            {/* Column 1: Qty Issued */}
                            <div
                              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                isPicked
                                  ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                                  : 'bg-slate-950/80 border-slate-800/80'
                              }`}
                            >
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                                  Kuantiti Keluar
                                </span>
                                <div className="text-sm font-bold text-slate-100 font-mono tabular-nums mt-0.5">
                                  {currentVal.qty_issued}{' '}
                                  <span className="text-[11px] font-normal text-slate-400 font-sans">{item.unit}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                                  Lulus: {item.qty_approved ?? item.qty_requested}
                                </span>
                              </div>
                            </div>

                            {/* Column 2: Storage Location (NEW) */}
                            <div
                              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                isPicked
                                  ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                                  : 'bg-slate-950/80 border-slate-800/80'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <span className="text-[10px] text-amber-400/90 uppercase tracking-wider block font-semibold">
                                  Lokasi / Rak Stor
                                </span>
                                <div className="text-xs font-semibold text-slate-200 truncate mt-0.5" title={itemLocation}>
                                  {itemLocation}
                                </div>
                              </div>
                              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            </div>

                            {/* Column 3: Batch Number */}
                            <div
                              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                isPicked
                                  ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                                  : 'bg-slate-950/80 border-slate-800/80'
                              }`}
                            >
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                                  No. Batch (Lot)
                                </span>
                                <div className="text-xs font-bold text-emerald-300 font-mono mt-0.5">
                                  {currentVal.batch_number}
                                </div>
                              </div>
                              <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
                            </div>

                            {/* Column 4: Expiry Date */}
                            <div
                              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                isPicked
                                  ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                                  : 'bg-slate-950/80 border-slate-800/80'
                              }`}
                            >
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                                  Tarikh Luput
                                </span>
                                <div className="text-xs font-bold text-slate-200 font-mono mt-0.5">
                                  {currentVal.expiry_date}
                                </div>
                              </div>
                              <Calendar className="w-4 h-4 text-teal-400/80" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Final Dispatch Action Bar */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800/90 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-bold text-slate-200">
                        Pengeluaran Automatik ke Lejar KEW.PS-4
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Menolak baki semasa stok, mengemas kini batch & mencatat rujukan ({selectedRequest.indent_number})
                    </p>
                  </div>

                  <Button
                    onClick={handleIssueSubmit}
                    disabled={isSubmitting || !allItemsPicked}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-7 py-3 rounded-xl shadow-xl shadow-emerald-600/25 transition-all duration-200 flex items-center justify-center gap-2 self-stretch sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" /> Memproses Lejar...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Sahkan Pengeluaran & Kemaskini KEW.PS-4
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit / Amendment Request Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Permohonan Pinda Butiran Pengeluaran"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-slate-100">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Perhatian Audit:</strong> Sebarang pindaan kuantiti, no. batch, atau tarikh luput akan direkodkan dalam log audit rasmi sistem.
            </div>
          </div>

          {editingItem && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs font-bold text-slate-100">{editingItem.item_name}</p>
              <p className="text-[11px] font-mono text-teal-400">
                Kod: {editingItem.item_code} | Kuantiti Diluluskan: {editingItem.qty_approved ?? editingItem.qty_requested} {editingItem.unit}
              </p>
            </div>
          )}

          {editFormError && (
            <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-medium">
              {editFormError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Kuantiti Dikeluarkan ({editingItem?.unit})
              </label>
              <Input
                type="number"
                min={1}
                max={editingItem?.qty_approved ?? editingItem?.qty_requested}
                value={editQty}
                onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                No. Batch (Lot)
              </label>
              <Input
                type="text"
                value={editBatch}
                onChange={(e) => setEditBatch(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Tarikh Luput
            </label>
            <Input
              type="date"
              value={editExpiry}
              onChange={(e) => setEditExpiry(e.target.value)}
              className="bg-slate-900 border-slate-700 text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Sebab / Justifikasi Pindaan <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Contoh: Stok fizikal batch berbeza di rak stor / Pelarasan kuantiti atas baki fizikal terhad..."
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-5"
            >
              Simpan & Rekod Log Audit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit History Viewer Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Sejarah Log Pindaan Item"
      >
        <div className="space-y-4 text-slate-100 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
          {historyItem && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs font-bold text-slate-100">{historyItem.item_name}</p>
              <p className="text-[11px] font-mono text-teal-400">Kod: {historyItem.item_code}</p>
            </div>
          )}

          {historyItem && (!auditLogs[historyItem.id] || auditLogs[historyItem.id].length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Tiada sejarah pindaan direkodkan untuk item ini.
            </div>
          ) : (
            <div className="space-y-3">
              {historyItem &&
                auditLogs[historyItem.id]?.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-2">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                        {log.officer}
                      </span>
                      <span className="font-mono text-slate-500 text-[10px]">
                        {new Date(log.timestamp).toLocaleString('en-MY')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                        <span className="text-[9px] text-slate-500 uppercase block">Sebelum</span>
                        <div className="font-mono text-slate-400 mt-0.5">
                          Qty: {log.previousValues.qty} | Batch: {log.previousValues.batch} | Exp: {log.previousValues.expiry}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                        <span className="text-[9px] text-emerald-400 uppercase block">Selepas Pindaan</span>
                        <div className="font-mono text-emerald-300 font-bold mt-0.5">
                          Qty: {log.newValues.qty} | Batch: {log.newValues.batch} | Exp: {log.newValues.expiry}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 pt-1">
                      <strong className="text-slate-400 text-[10px] uppercase tracking-wider">Justifikasi:</strong>{' '}
                      <span className="italic text-amber-200/90">"{log.reason}"</span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => setIsHistoryModalOpen(false)}
              className="text-xs"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default IssueCounterPage



