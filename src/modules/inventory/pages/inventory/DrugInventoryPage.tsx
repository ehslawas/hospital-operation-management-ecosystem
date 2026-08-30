// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, Pill, Search, Filter, ChevronLeft, ChevronRight, QrCode, Printer, RefreshCw, Edit, CheckCircle, XCircle, CheckSquare, Square, ArrowRightLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Table, Spinner, Input, Badge, Select, Modal, Button, SlideOver } from '@/components/ui'
import { getDrugs, getDrugCategories, triggerApplSync, triggerLpSync, triggerCcSync, importCcSyncCsv, moveDrugToNonDrug, updateDrug, batchUpdateDrugStatus } from '@/services/pharmacy/inventoryService'
import { getSuppliers } from '@/services/pharmacy/procurementService'
import type { DrugWithRelations, DrugCategory, Supplier } from '@/types/pharmacy'
import { parseAndNormalizeDate, getFallbackContractDates } from '@/lib/utils'
import QRCode from 'qrcode'

export const DrugInventoryPage: React.FC = () => {
  const location = useLocation()
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const { success: showSuccess, error: showError } = useToastStore()

  const [drugs, setDrugs] = useState<DrugWithRelations[]>([])
  const [categories, setCategories] = useState<DrugCategory[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [procurementVote, setProcurementVote] = useState<string>('all')

  useEffect(() => {
    const incoming = (location.state as any)?.filter
    if (incoming === 'appl' || incoming === 'cc' || incoming === 'lp') {
      setProcurementVote(incoming)
    }
  }, [location.state])

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  // Edit & Multi-Select State
  const [selectedDrugForEdit, setSelectedDrugForEdit] = useState<DrugWithRelations | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editSkim, setEditSkim] = useState<string>('appl')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  // QR Modal State
  const [selectedItemForQr, setSelectedItemForQr] = useState<DrugWithRelations | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  // Syncing states
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLpSyncing, setIsLpSyncing] = useState(false)
  const [isCcSyncing, setIsCcSyncing] = useState(false)
  const [isCcModalOpen, setIsCcModalOpen] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null)

  const handleSync = async () => {
    if (!hospitalId) return
    setIsSyncing(true)
    setSyncError(null)
    setSyncSuccessMessage(null)

    try {
      const res = await triggerApplSync(hospitalId)
      if (res.error) throw new Error(res.error)

      if (res.data) {
        setSyncSuccessMessage(
          `Penyelarasan APPL Berjaya! Memproses ${res.data.rows_processed} baris jadual Lampiran B. ${res.data.drugs_upserted} ubat dikemaskini, ${res.data.suppliers_upserted} pembekal diluluskan dimasukkan.`
        )
        void loadDrugs()
      }
    } catch (err: any) {
      console.error(err)
      setSyncError(err.message || 'Gagal menyelaraskan katalog ubat APPL')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleLpSync = async () => {
    if (!hospitalId) return
    setIsLpSyncing(true)
    setSyncError(null)
    setSyncSuccessMessage(null)

    try {
      const res = await triggerLpSync(hospitalId)
      if (res.error) throw new Error(res.error)

      if (res.data) {
        setSyncSuccessMessage(
          `Penyelarasan LP Berjaya! Memproses ${res.data.total_rows_processed} baris dari Google Docs. ${res.data.drugs_upserted} ubat & ${res.data.non_drugs_upserted} bukan ubat dikemaskini.`
        )
        setProcurementVote('lp')
        void loadDrugs()
      }
    } catch (err: any) {
      console.error(err)
      setSyncError(err.message || 'Gagal menyelaraskan katalog ubat LP')
    } finally {
      setIsLpSyncing(false)
    }
  }

  const handleCcSync = async () => {
    if (!hospitalId) return
    setIsCcSyncing(true)
    setSyncError(null)
    setSyncSuccessMessage(null)

    try {
      const res = await triggerCcSync(hospitalId)
      if (res.error) throw new Error(res.error)

      if (res.data) {
        setSyncSuccessMessage(
          `Penyelarasan CC Berjaya! Memproses ${res.data.total_rows_processed} baris dari Google Docs. ${res.data.drugs_upserted} ubat dikemaskini.`
        )
        setProcurementVote('cc')
        void loadDrugs()
      }
    } catch (err: any) {
      console.error(err)
      setSyncError(err.message || 'Gagal menyelaraskan katalog ubat CC')
    } finally {
      setIsCcSyncing(false)
    }
  }

  // Load categories once
  useEffect(() => {
    const loadCategories = async () => {
      const res = await getDrugCategories()
      if (res.data) {
        setCategories(res.data)
      }
    }
    const loadSuppliersData = async () => {
      try {
        const res = await getSuppliers(undefined, 1, 1000)
        if (res.data?.data) {
          setSuppliers(res.data.data)
        }
      } catch (err) {
        console.error('Error loading suppliers:', err)
      }
    }
    void loadCategories()
    void loadSuppliersData()
  }, [])

  // Multi-Selection & Bulk Actions
  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === drugs.length && drugs.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(drugs.map((d) => d.id))
    }
  }, [drugs, selectedIds])

  const handleSelectRow = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  const handleToggleSingleStatus = async (drug: DrugWithRelations) => {
    const nextStatus = drug.status === 'active' ? 'inactive' : 'active'
    try {
      const result = await updateDrug(drug.id, { status: nextStatus })
      if (result.error) {
        showError('Ralat', result.error)
        return
      }
      showSuccess('Berjaya', `Status ubat dikemaskini kepada ${nextStatus}`)
      void loadDrugs()
    } catch (error) {
      showError('Ralat', 'Gagal mengemaskini status ubat')
    }
  }

  const handleBulkStatusChange = async (targetStatus: 'active' | 'inactive') => {
    if (selectedIds.length === 0) return
    setIsBulkUpdating(true)
    try {
      const result = await batchUpdateDrugStatus(selectedIds, targetStatus)
      if (result.error) {
        showError('Ralat', result.error)
        return
      }
      showSuccess(
        'Berjaya',
        `Berjaya ${targetStatus === 'active' ? 'mengaktifkan' : 'Nyahaktifkan'} ${result.data?.successCount || selectedIds.length} ubat`
      )
      setSelectedIds([])
      void loadDrugs()
    } catch (error) {
      showError('Ralat', 'Gagal mengemaskini status pukal')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const handleSaveDrug = async (updatedData: Partial<DrugWithRelations>) => {
    if (!selectedDrugForEdit) return
    try {
      const res = await updateDrug(selectedDrugForEdit.id, updatedData)
      if (res.error) {
        showError('Ralat', res.error)
        return
      }
      showSuccess('Berjaya', 'Maklumat ubat berjaya dikemaskini!')
      setIsEditModalOpen(false)
      setSelectedDrugForEdit(null)
      void loadDrugs()
    } catch (err: any) {
      showError('Ralat', err.message || 'Gagal menyimpan maklumat ubat')
    }
  }

  // Load drugs with filters
  const loadDrugs = useCallback(async () => {
    if (!hospitalId) return

    setIsLoading(true)
    setError(null)

    const filter: InventoryFilter = {
      search: search || undefined,
      category_id: categoryId || undefined,
      status: status === 'all' ? undefined : status,
      procurement_vote: procurementVote === 'all' ? undefined : procurementVote,
    }

    const res = await getDrugs(hospitalId, filter, page, pageSize)

    if (res.error) {
      setError(res.error)
      setDrugs([])
    } else if (res.data) {
      setDrugs(res.data.data)
      setTotalPages(res.data.totalPages)
      setTotal(res.data.total)
    }

    setIsLoading(false)
  }, [hospitalId, search, categoryId, status, procurementVote, page])

  useEffect(() => {
    void loadDrugs()
  }, [loadDrugs])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, categoryId, status, procurementVote])

  // Generate QR Code URL
  useEffect(() => {
    if (selectedItemForQr) {
      const payload = `MYINV:DRUG:${selectedItemForQr.id}:${selectedItemForQr.drug_code}`
      QRCode.toDataURL(payload, { width: 256, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Failed to generate QR data URL', err))
    } else {
      setQrCodeUrl('')
    }
  }, [selectedItemForQr])

  const renderStatusBadge = (itemStatus: 'active' | 'inactive') => {
    return itemStatus === 'active' ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === '-') return '—'
    const normalized = parseAndNormalizeDate(dateStr)
    if (!normalized) return dateStr
    try {
      const d = new Date(normalized)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const computeContractStatus = (startDateStr?: string, endDateStr?: string, existingStatus?: string) => {
    if (existingStatus && existingStatus !== '-' && existingStatus !== '—') return existingStatus
    const normStart = parseAndNormalizeDate(startDateStr)
    const normEnd = parseAndNormalizeDate(endDateStr)
    if (!normStart || !normEnd) return '-'
    const start = new Date(normStart)
    const end = new Date(normEnd)
    const today = new Date()
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-'
    if (today >= start && today <= end) return 'Aktif'
    if (today > end) return 'Tamat'
    if (today < start) return 'Belum Mula'
    return '-'
  }

  const renderContractStatusBadge = (contractStatus?: string) => {
    if (!contractStatus || contractStatus === '-') return <Badge variant="secondary">—</Badge>
    const statusLower = contractStatus.toLowerCase()
    if (statusLower.includes('aktif') || statusLower.includes('active')) {
      return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono text-[10px] uppercase">{contractStatus}</Badge>
    }
    if (statusLower.includes('tamat') || statusLower.includes('expired')) {
      return <Badge className="bg-rose-50 text-rose-700 border border-rose-200 font-bold font-mono text-[10px] uppercase">{contractStatus}</Badge>
    }
    return <Badge className="bg-sky-50 text-sky-700 border border-sky-200 font-bold font-mono text-[10px] uppercase">{contractStatus}</Badge>
  }

  const renderVoteBadge = (vote?: string) => {
    if (!vote) return <Badge variant="secondary">—</Badge>
    const v = vote.toUpperCase()
    if (v === 'APPL') return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono text-[10px]">APPL</Badge>
    if (v === 'LP') return <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-bold font-mono text-[10px]">LP</Badge>
    if (v === 'CC') return <Badge className="bg-sky-50 text-sky-700 border border-sky-200 font-bold font-mono text-[10px]">CC</Badge>
    if (v === 'DP') return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-bold font-mono text-[10px]">DP</Badge>
    return <Badge variant="secondary">{v}</Badge>
  }

  const renderStockBadge = (stockStatus?: string) => {
    if (!stockStatus) return <Badge variant="secondary">—</Badge>
    const map: Record<string, { color: 'success' | 'warning' | 'error' | 'secondary'; label: string }> = {
      in_stock: { color: 'success', label: 'In Stock' },
      low_stock: { color: 'warning', label: 'Low' },
      critical: { color: 'error', label: 'Critical' },
      out_of_stock: { color: 'secondary', label: 'Out' },
    }
    const cfg = map[stockStatus] || { color: 'secondary', label: stockStatus }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  const handlePrintLabel = () => {
    if (!selectedItemForQr || !qrCodeUrl) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const itemCode = selectedItemForQr.drug_code
    const itemName = selectedItemForQr.drug_name
    const details = `${selectedItemForQr.dosage_form || ''} - ${selectedItemForQr.strength || ''}`

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${itemCode}</title>
          <style>
            @page { size: 50mm 30mm; margin: 0; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              box-sizing: border-box;
              background: white;
            }
            .label-container {
              display: flex;
              align-items: center;
              gap: 8px;
              width: 100%;
              height: 100%;
            }
            .qr-img {
              width: 85px;
              height: 85px;
              flex-shrink: 0;
            }
            .info {
              display: flex;
              flex-direction: column;
              justify-content: center;
              min-width: 0;
            }
            .code {
              font-family: monospace;
              font-size: 10px;
              font-weight: bold;
              color: #111;
            }
            .name {
              font-size: 11px;
              font-weight: 800;
              margin: 2px 0;
              line-height: 1.2;
              word-break: break-all;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .details {
              font-size: 8px;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <img class="qr-img" src="${qrCodeUrl}" />
            <div class="info">
              <div class="code">${itemCode}</div>
              <div class="name">${itemName}</div>
              <div class="details">${details}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="p-6 md:p-8 w-full space-y-8 text-slate-800">
      {/* Header (Premium Layout matching HOME guidelines) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <Pill className="w-6 h-6 text-teal-600 animate-pulse" />
              <span>Drug Catalog / Inventori Ubat</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Urus katalog ubat-ubatan hospital dan jana tag label kod QR
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSync}
              disabled={isSyncing || isLpSyncing || isCcSyncing}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl font-bold text-xs gap-2 px-4 shadow-md transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Menyelaras...' : 'Selaras APPL'}
            </Button>
            <Button
              onClick={handleLpSync}
              disabled={isSyncing || isLpSyncing || isCcSyncing}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-xs gap-2 px-4 shadow-md transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLpSyncing ? 'animate-spin' : ''}`} />
              {isLpSyncing ? 'Menyelaras...' : 'Selaras LP'}
            </Button>
            <Button
              onClick={() => setIsCcModalOpen(true)}
              disabled={isSyncing || isLpSyncing || isCcSyncing}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-xs gap-2 px-4 shadow-md transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isCcSyncing ? 'animate-spin' : ''}`} />
              {isCcSyncing ? 'Menyelaras...' : 'Selaras CC'}
            </Button>
          </div>
        </div>
      </div>

      {/* Sync Alerts */}
      {syncSuccessMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs font-semibold text-emerald-800 shadow-sm relative pr-10">
          <Badge variant="success">Berjaya</Badge>
          <span className="leading-relaxed">{syncSuccessMessage}</span>
          <button 
            onClick={() => setSyncSuccessMessage(null)}
            className="absolute top-3.5 right-4 text-emerald-600 hover:text-emerald-800 text-lg font-black"
          >
            ×
          </button>
        </div>
      )}

      {syncError && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-xs font-semibold text-rose-800 shadow-sm relative pr-10">
          <Badge variant="error">Ralat</Badge>
          <span className="leading-relaxed">{syncError}</span>
          <button 
            onClick={() => setSyncError(null)}
            className="absolute top-3.5 right-4 text-rose-600 hover:text-rose-800 text-lg font-black"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-soft">
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Carian</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              placeholder="Kod ubat, nama atau generic..."
              className="pl-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-56">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Kategori</label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-xl">
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-44">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Skim Perolehan</label>
          <Select value={procurementVote} onChange={(e) => setProcurementVote(e.target.value)} className="rounded-xl">
            <option value="all">Semua Skim</option>
            <option value="appl">APPL</option>
            <option value="cc">CC</option>
            <option value="dp">DP</option>
            <option value="lp">LP</option>
          </Select>
        </div>

        <div className="w-full md:w-44">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Status</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'inactive')} className="rounded-xl">
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </Select>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold font-mono py-3">
          <Filter className="w-3.5 h-3.5" />
          <span>{total} UBAT</span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
          <div>
            <p className="font-bold">Gagal memuatkan katalog ubat</p>
            <p className="mt-0.5 text-xs font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 mb-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-extrabold tracking-wide">
              {selectedIds.length} Dipilih
            </span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Pilih tindakan pukal untuk mengaktifkan atau me-nyahaktifkan ubat
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange('active')}
              disabled={isBulkUpdating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Aktifkan Dipilih ({selectedIds.length})
            </button>
            <button
              onClick={() => handleBulkStatusChange('inactive')}
              disabled={isBulkUpdating}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Nyahaktifkan Dipilih ({selectedIds.length})
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              Batal Pilihan
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <>
          <div className="bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden">
            <Table>
              <Table.Header>
                {procurementVote === 'cc' ? (
                  <Table.Row className="bg-slate-50 border-b border-slate-100">
                    <Table.Cell as="th" className="py-4 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={drugs.length > 0 && selectedIds.length === drugs.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Nama Ubat / Kod</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Pembungkusan</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Pembekal</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">No. Kontrak</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-center">Tarikh Mula</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-center">Tarikh Tamat</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-center">Status Kontrak</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-right">Harga (RM)</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-center">Status</Table.Cell>
                  </Table.Row>
                ) : (
                  <Table.Row className="bg-slate-50 border-b border-slate-100">
                    <Table.Cell as="th" className="py-4 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={drugs.length > 0 && selectedIds.length === drugs.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Kod</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Nama Ubat</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Bentuk</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Pembungkusan</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-center">Skim</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-right">Harga (RM)</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Kategori</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-center">Stok</Table.Cell>
                    <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-center">Status</Table.Cell>
                  </Table.Row>
                )}
              </Table.Header>
              <Table.Body className="divide-y divide-slate-100">
                {drugs.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={procurementVote === 'cc' ? 10 : 10} className="text-center text-sm text-slate-400 py-12 font-medium">
                      Tiada ubat dijumpai sepadan dengan tapisan anda.
                    </Table.Cell>
                  </Table.Row>
                )}

                {drugs.map((drug) => (
                  <Table.Row
                    key={drug.id}
                    onClick={() => {
                      setSelectedDrugForEdit(drug)
                      setEditSkim(drug.procurement_vote || 'appl')
                      setIsEditModalOpen(true)
                    }}
                    className="hover:bg-teal-50/50 cursor-pointer transition-colors group"
                  >
                    <Table.Cell className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(drug.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleSelectRow(drug.id)
                        }}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </Table.Cell>
                    {procurementVote === 'cc' ? (
                      <>
                        <Table.Cell className="py-3 max-w-[260px]">
                          <div className="text-sm font-black text-slate-800 group-hover:text-teal-700 transition-colors leading-tight">
                            {drug.drug_name}
                          </div>
                          <div className="text-[11px] font-mono font-bold text-slate-400 mt-1 tracking-tight">
                            {drug.drug_code}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="text-sm text-slate-500 font-medium">
                          {drug.packaging_description || '—'}
                        </Table.Cell>
                        <Table.Cell className="text-xs text-slate-600 font-semibold max-w-[180px] truncate" title={drug.cc_supplier_name || drug.supplier?.company_name}>
                          {drug.cc_supplier_name || drug.supplier?.company_name || '—'}
                        </Table.Cell>
                        <Table.Cell className="text-xs font-bold text-sky-700 font-mono">
                          {drug.cc_contract_number ? (
                            <span className="bg-sky-50 px-2 py-1 rounded-md border border-sky-100 inline-block">
                              {drug.cc_contract_number}
                            </span>
                          ) : (
                            '—'
                          )}
                        </Table.Cell>
                        {(() => {
                          const { startDate, endDate } = getFallbackContractDates(drug)
                          const contractStatus = (drug as any).cc_contract_status || (drug as any).contract_status || computeContractStatus(startDate, endDate)
                          return (
                            <>
                              <Table.Cell className="text-xs font-mono font-medium text-slate-600 text-center">
                                {formatDate(startDate)}
                              </Table.Cell>
                              <Table.Cell className="text-xs font-mono font-medium text-slate-600 text-center">
                                {formatDate(endDate)}
                              </Table.Cell>
                              <Table.Cell className="text-center">
                                {renderContractStatusBadge(contractStatus)}
                              </Table.Cell>
                            </>
                          )
                        })()}
                      </>
                    ) : (
                      <>
                        <Table.Cell className="font-mono text-xs font-bold text-slate-700">
                          {drug.drug_code}
                        </Table.Cell>
                        <Table.Cell className="text-sm font-black text-slate-800 group-hover:text-teal-700 transition-colors">
                          {drug.drug_name}
                        </Table.Cell>
                        <Table.Cell className="text-xs font-bold uppercase text-slate-400">
                          {drug.dosage_form}
                        </Table.Cell>
                        <Table.Cell className="text-sm text-slate-500 font-medium">
                          {drug.packaging_description || '—'}
                        </Table.Cell>
                        <Table.Cell className="text-center">
                          {renderVoteBadge(drug.procurement_vote)}
                        </Table.Cell>
                      </>
                    )}
                    <Table.Cell className="text-sm text-slate-700 font-mono font-bold text-right">
                      {drug.price !== null && drug.price !== undefined && Number(drug.price) > 0 ? `RM ${Number(drug.price).toFixed(2)}` : '—'}
                    </Table.Cell>
                    {procurementVote !== 'cc' && (
                      <Table.Cell className="text-xs text-slate-500 font-medium">
                        {drug.category?.category_name || '—'}
                      </Table.Cell>
                    )}
                    {procurementVote !== 'cc' && (
                      <Table.Cell className="text-center">
                        {renderStockBadge(drug.stock_status)}
                      </Table.Cell>
                    )}
                    <Table.Cell className="text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleSingleStatus(drug)
                        }}
                        title={drug.status === 'active' ? 'Klik untuk nyahaktifkan' : 'Klik untuk aktifkan'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-sm ${
                          drug.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${drug.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        {drug.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold font-mono px-2">
              <span>
                HALAMAN {page} DARI {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                  className="rounded-xl p-2 min-w-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                  className="rounded-xl p-2 min-w-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* QR Label Print Modal */}
      <Modal isOpen={!!selectedItemForQr} onClose={() => setSelectedItemForQr(null)} size="sm">
        {selectedItemForQr && (
          <div className="p-6 text-center space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-800">Jana Label QR Kod</h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">Imbasan label untuk transaksi stor automatik</p>
            </div>

            {/* Simulated Printed Tag */}
            <div className="border border-slate-200 bg-white rounded-2xl p-5 max-w-[280px] mx-auto shadow-inner flex items-center gap-4 text-left">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 flex-shrink-0" />
              ) : (
                <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                  Loading...
                </div>
              )}
              <div className="min-w-0">
                <span className="font-mono text-[10px] font-black text-slate-400 block">{selectedItemForQr.drug_code}</span>
                <h4 className="text-sm font-black text-slate-800 leading-tight mt-1 truncate">{selectedItemForQr.drug_name}</h4>
                <p className="text-[10px] text-slate-500 mt-1 font-medium truncate">{selectedItemForQr.generic_name || '—'}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{selectedItemForQr.dosage_form} - {selectedItemForQr.strength || '—'}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <Button
                variant="outline"
                className="rounded-xl font-bold flex-1"
                onClick={() => setSelectedItemForQr(null)}
              >
                Tutup
              </Button>
              <Button
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-bold flex-1 gap-1.5"
                onClick={handlePrintLabel}
                disabled={!qrCodeUrl}
              >
                <Printer className="w-4 h-4" />
                Cetak Label
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CC Sync Option Modal */}
      <Modal isOpen={isCcModalOpen} onClose={() => setIsCcModalOpen(false)} size="md">
        <div className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              <span>Penyelarasan Kontrak CC</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Ubah suai kaedah untuk menyelaraskan data kontrak Cost Center
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kaedah 1: Selaras Automatik</h4>
              <p className="text-xs text-slate-500 font-medium">
                Penyelarasan automatik terus dari Google Docs. Ini memerlukan fail Google Sheet dikongsi secara awam ("Anyone with the link can view").
              </p>
              <Button
                size="sm"
                onClick={async () => {
                  setIsCcModalOpen(false)
                  await handleCcSync()
                }}
                disabled={isSyncing || isLpSyncing || isCcSyncing}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-bold text-xs gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCcSyncing ? 'animate-spin' : ''}`} />
                Selaras Automatik
              </Button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kaedah 2: Muat Naik Fail CSV Manual</h4>
              <p className="text-xs text-slate-500 font-medium">
                Jika Google Sheet adalah sulit (private), buka Google Sheet, klik <b>File &gt; Download &gt; Comma Separated Values (.csv)</b> (Tab semasa: <i>Kontrak Aktif</i>), dan muat naik di bawah:
              </p>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors relative cursor-pointer bg-white">
                <input
                  type="file"
                  accept=".csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file || !hospitalId) return
                    
                    setIsCcModalOpen(false)
                    setIsCcSyncing(true)
                    setSyncError(null)
                    setSyncSuccessMessage(null)

                    try {
                      const reader = new FileReader()
                      reader.onload = async (evt) => {
                        const csvText = evt.target?.result as string
                        if (!csvText) {
                          setSyncError('Fail CSV kosong atau gagal dibaca.')
                          setIsCcSyncing(false)
                          return
                        }
                        
                        const res = await importCcSyncCsv(hospitalId, csvText)
                        if (res.error) throw new Error(res.error)
                        
                        if (res.data) {
                          setSyncSuccessMessage(
                            `Penyelarasan CC Manual Berjaya! Memproses ${res.data.total_rows_processed} baris dari fail CSV. ${res.data.drugs_upserted} ubat dikemaskini.`
                          )
                          setProcurementVote('cc')
                          void loadDrugs()
                        }
                        setIsCcSyncing(false)
                      }
                      reader.readAsText(file)
                    } catch (err: any) {
                      console.error(err)
                      setSyncError(err.message || 'Gagal mengimport fail CSV CC')
                      setIsCcSyncing(false)
                    }
                  }}
                />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-indigo-600 block">Pilih Fail CSV Kontrak Aktif</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Klik atau heret fail di sini (.csv sahaja)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold px-5"
              onClick={() => setIsCcModalOpen(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Drug SlideOver */}
      {selectedDrugForEdit && (
        <SlideOver
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setSelectedDrugForEdit(null); }}
          title="Sunting Maklumat Ubat"
          description={`${selectedDrugForEdit.drug_code || ''} • ${selectedDrugForEdit.drug_name || ''}`}
          size="3xl"
        >
          <form onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const supplierId = fd.get('supplier_id') as string
            const matchedSupplier = suppliers.find(s => s.id === supplierId)
            const rawFields: Record<string, any> = {
              drug_code: fd.get('drug_code'),
              drug_name: fd.get('drug_name'),
              generic_name: fd.get('generic_name'),
              brand_name: fd.get('brand_name'),
              dosage_form: fd.get('dosage_form'),
              strength: fd.get('strength'),
              unit_of_measure: fd.get('unit_of_measure'),
              category_id: fd.get('category_id'),
              supplier_id: supplierId,
              cc_supplier_name: matchedSupplier ? matchedSupplier.company_name : (supplierId ? undefined : null),
              procurement_vote: fd.get('procurement_vote'),
              price: fd.get('price') ? parseFloat(fd.get('price') as string) : undefined,
              status: fd.get('status'),
              packaging_description: fd.get('packaging_description'),
              cc_contract_number: fd.get('cc_contract_number'),
              cc_contract_status: fd.get('cc_contract_status'),
              cc_contract_start_date: fd.get('cc_contract_start_date'),
              cc_contract_end_date: fd.get('cc_contract_end_date'),
            }
            const updated: Record<string, any> = {}
            Object.entries(rawFields).forEach(([k, v]) => {
              if (v !== null && v !== undefined && v !== '') {
                updated[k] = typeof v === 'string' ? v.trim() : v
              } else if (k === 'category_id' || k === 'supplier_id' || k === 'cc_supplier_name' || k.endsWith('_date')) {
                updated[k] = null
              }
            })
            await handleSaveDrug(updated)
          }} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-indigo-600 tracking-wider">Maklumat Asas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kod Ubat *</label>
                  <Input name="drug_code" defaultValue={selectedDrugForEdit.drug_code || ''} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Ubat *</label>
                  <Input name="drug_name" defaultValue={selectedDrugForEdit.drug_name || ''} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Generik</label>
                  <Input name="generic_name" defaultValue={selectedDrugForEdit.generic_name || ''} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Jenama</label>
                  <Input name="brand_name" defaultValue={selectedDrugForEdit.brand_name || ''} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bentuk Dos (Dosage Form)</label>
                  <Input name="dosage_form" defaultValue={selectedDrugForEdit.dosage_form || ''} placeholder="Tablet / Syrup / Injection" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kekuatan (Strength)</label>
                  <Input name="strength" defaultValue={selectedDrugForEdit.strength || ''} placeholder="500mg" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Ukuran (UOM) *</label>
                  <Input name="unit_of_measure" defaultValue={selectedDrugForEdit.unit_of_measure || 'tablet'} required />
                </div>
              </div>
            </div>

            {/* Price & Contract */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-indigo-600 tracking-wider">Harga & Kontrak</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Unit (RM)</label>
                  <Input name="price" type="number" step="0.01" defaultValue={selectedDrugForEdit.price || 0} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pembekal (Supplier)</label>
                  <Select
                    name="supplier_id"
                    defaultValue={
                      selectedDrugForEdit.supplier_id ||
                      selectedDrugForEdit.supplier?.id ||
                      suppliers.find(
                        (s) =>
                          s.company_name?.toLowerCase().trim() ===
                            (selectedDrugForEdit.cc_supplier_name || selectedDrugForEdit.supplier?.company_name || '').toLowerCase().trim()
                      )?.id ||
                      ''
                    }
                  >
                    <option value="">-- Pilih Pembekal Dalam Sistem --</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.company_name || (sup as any).supplier_name || 'Pembekal'} {sup.supplier_code ? `(${sup.supplier_code})` : ''}
                      </option>
                    ))}
                  </Select>
                  {selectedDrugForEdit.cc_supplier_name && !suppliers.some(s => s.company_name?.toLowerCase().trim() === selectedDrugForEdit.cc_supplier_name?.toLowerCase().trim() || s.id === selectedDrugForEdit.supplier_id) && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1">
                      Rekod asal pembekal: <span className="font-bold">{selectedDrugForEdit.cc_supplier_name}</span> (belum dipadankan dalam senarai pembekal berdaftar)
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Kontrak (CC)</label>
                  <Input name="cc_contract_number" defaultValue={selectedDrugForEdit.cc_contract_number || ''} placeholder="e.g. KK/SUM/2024/001" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Kontrak</label>
                  <Select name="cc_contract_status" defaultValue={selectedDrugForEdit.cc_contract_status || 'active'}>
                    <option value="active">Aktif</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Tamat Tempoh</option>
                    <option value="terminated">Dibatalkan</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarikh Mula Kontrak</label>
                  <Input name="cc_contract_start_date" type="date" defaultValue={parseAndNormalizeDate(selectedDrugForEdit.cc_contract_start_date || getFallbackContractDates(selectedDrugForEdit).startDate)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarikh Tamat Kontrak</label>
                  <Input name="cc_contract_end_date" type="date" defaultValue={parseAndNormalizeDate(selectedDrugForEdit.cc_contract_end_date || getFallbackContractDates(selectedDrugForEdit).endDate)} />
                </div>
              </div>
            </div>

            {/* Skim Perolehan Switcher */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-teal-600 tracking-wider">Tukar Skim Perolehan</h3>
              <input type="hidden" name="procurement_vote" value={editSkim} />
              {editSkim !== (selectedDrugForEdit.procurement_vote || 'appl') && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  <span className="text-amber-600 font-black text-sm">⚠</span>
                  <span className="text-xs font-bold text-amber-800">
                    Skim akan ditukar daripada{' '}
                    <span className="uppercase font-black">{(selectedDrugForEdit.procurement_vote || 'appl').toUpperCase()}</span>{' '}
                    kepada{' '}
                    <span className="uppercase font-black text-teal-700">{editSkim.toUpperCase()}</span>
                  </span>
                </div>
              )}
              <div className="grid grid-cols-4 gap-3">
                {(['appl', 'cc', 'lp', 'dp'] as const).map((skim) => {
                  const isCurrentSkim = skim === (selectedDrugForEdit.procurement_vote || 'appl')
                  const isSelected = skim === editSkim
                  const skimMeta = {
                    appl: { label: 'APPL', desc: 'Lampiran B', color: isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50' },
                    cc: { label: 'CC', desc: 'Cost Center', color: isSelected ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:bg-sky-50' },
                    lp: { label: 'LP', desc: 'Local Purchase', color: isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50' },
                    dp: { label: 'DP', desc: 'Direct Purchase', color: isSelected ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:bg-rose-50' },
                  }[skim]
                  return (
                    <button
                      key={skim}
                      type="button"
                      onClick={() => setEditSkim(skim)}
                      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all duration-200 font-bold shadow-sm ${skimMeta.color}`}
                    >
                      {isCurrentSkim && (
                        <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">Kini</span>
                      )}
                      <span className="text-lg font-black">{skimMeta.label}</span>
                      <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{skimMeta.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Specifications & Category */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-indigo-600 tracking-wider">Kategori & Pembungkusan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Ubat</label>
                  <Select name="category_id" defaultValue={selectedDrugForEdit.category_id || ''}>
                    <option value="">Pilih Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.category_name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pembungkusan</label>
                  <Input name="packaging_description" defaultValue={selectedDrugForEdit.packaging_description || ''} placeholder="Bottle of 100 Tablets" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Item</label>
                  <Select name="status" defaultValue={selectedDrugForEdit.status || 'active'}>
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!hospitalId || !selectedDrugForEdit) return
                  if (window.confirm(`Adakah anda pasti untuk memindahkan "${selectedDrugForEdit.drug_name}" ke Inventori Non-Drug?`)) {
                    const res = await moveDrugToNonDrug(selectedDrugForEdit.id, hospitalId)
                    if (res.error) {
                      showError(res.error)
                    } else {
                      showSuccess(`"${selectedDrugForEdit.drug_name}" telah dipindahkan ke Inventori Non-Drug!`)
                      setIsEditModalOpen(false)
                      setSelectedDrugForEdit(null)
                      void loadDrugs()
                    }
                  }
                }}
                className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Pindah ke Inventori Non-Drug
              </Button>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => { setIsEditModalOpen(false); setSelectedDrugForEdit(null); }}>Batal</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Simpan Perubahan</Button>
              </div>
            </div>
          </form>
        </SlideOver>
      )}
    </div>
  )
}

export default DrugInventoryPage
