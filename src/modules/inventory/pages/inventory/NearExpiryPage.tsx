// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react'
import {
  Clock,
  AlertTriangle,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Search,
  Filter,
  Download,
  RefreshCw,
  Copy,
  Check,
  Package,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  X,
  Trash2,
  Send,
  Eye,
  Info,
  CheckCircle2,
  ArrowRightLeft,
  FileSpreadsheet,
  Flame,
  ChevronDown,
  ChevronRight,
  Layers,
  Boxes,
  LayoutList,
  ChevronsUpDown,
  FolderTree
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Badge, Select } from '@/components/ui'
import { getNearExpiryItems, getStockLocations, createStockTransaction } from '@/services/pharmacy/inventoryService'
import type { ExpiryItem } from '@/types/pharmacy'

export interface GroupedExpiryItem {
  item_id: string
  item_code: string
  item_name: string
  item_type: 'drug' | 'non_drug'
  packaging?: string
  location_name: string
  unit_cost: number
  total_quantity: number
  batch_count: number
  earliest_expiry_date: string
  min_days_to_expiry: number
  worst_status: 'valid' | 'near_expiry' | 'expired'
  batches: ExpiryItem[]
}

export const NearExpiryPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || '85bb6adc-b868-428b-83f4-e5af2f5cf904'

  // State Management
  const [rawItems, setRawItems] = useState<ExpiryItem[]>([])
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [daysThreshold, setDaysThreshold] = useState<number>(9999)
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped')
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({})

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'drug' | 'non_drug'>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'expired' | 'critical' | 'warning' | 'safe'>('all')

  // Selection & Modals
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [activeModalItem, setActiveModalItem] = useState<ExpiryItem | null>(null)
  const [transferModalItem, setTransferModalItem] = useState<ExpiryItem | null>(null)
  const [disposalModalItem, setDisposalModalItem] = useState<ExpiryItem | null>(null)

  // Interactive Form State
  const [transferQty, setTransferQty] = useState<number>(1)
  const [targetLocation, setTargetLocation] = useState<string>('Decanting')
  const [disposalReason, setDisposalReason] = useState<string>('Telah Luput Tarikh (Expired)')
  const [disposalRefNo, setDisposalRefNo] = useState<string>('')
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)
  const [copiedBatchId, setCopiedBatchId] = useState<string | null>(null)

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Load Real Data
  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getNearExpiryItems(hospitalId)
      if (res.error) {
        setError(res.error)
        setRawItems([])
      } else {
        let items = res.data || []
        try {
          const itemOverrides = JSON.parse(localStorage.getItem('kewps4_item_overrides') || '{}')
          if (Object.keys(itemOverrides).length > 0) {
            items = items.map((item) => {
              const override = itemOverrides[item.item_id]
              if (override && override.location) {
                const cleanedLoc = override.location
                  .replace(/^\[[^\]]+\]\s*/, '')
                  .replace(/\[.*?\]\s*/g, '')
                  .replace(/\((Drug|drug)\)/gi, '(Ubat)')
                  .replace(/\((Non-Drug|non-drug|nondrug)\)/gi, '(Bukan Ubat)')
                  .trim()
                return {
                  ...item,
                  location_name: cleanedLoc,
                }
              }
              return item
            })
          }
        } catch {}
        setRawItems(items)
      }

      const locRes = await getStockLocations(hospitalId)
      if (locRes.data && locRes.data.length > 0) {
        const locNames = locRes.data.map((l: any) => l.location_name).filter(Boolean)
        setAvailableLocations(locNames)
        if (locNames.length > 0) {
          setTargetLocation(locNames[0])
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuatkan maklumat stok hampir luput')
      setRawItems([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [hospitalId])

  // Calculate Expiry Status Buckets with Real Costs
  const stats = useMemo(() => {
    const expired = rawItems.filter((i) => i.status === 'expired' || i.days_to_expiry <= 0)
    const critical = rawItems.filter((i) => i.days_to_expiry > 0 && i.days_to_expiry <= 7)
    const warning = rawItems.filter((i) => i.days_to_expiry > 7 && i.days_to_expiry <= 30)
    const safe = rawItems.filter((i) => i.days_to_expiry > 30)

    const totalExpiredValue = expired.reduce((acc, i) => acc + i.quantity * (i.unit_cost || 0), 0)
    const totalCriticalValue = critical.reduce((acc, i) => acc + i.quantity * (i.unit_cost || 0), 0)

    return {
      expiredCount: expired.length,
      criticalCount: critical.length,
      warningCount: warning.length,
      safeCount: safe.length,
      totalCount: rawItems.length,
      totalExpiredValue,
      totalCriticalValue,
    }
  }, [rawItems])

  // Unique Locations for filter dropdown from real data
  const uniqueLocations = useMemo(() => {
    const locs = new Set([...rawItems.map((i) => i.location_name), ...availableLocations])
    return Array.from(locs).filter(Boolean).sort()
  }, [rawItems, availableLocations])

  // Filtered Items List
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      // Threshold filter
      if (item.days_to_expiry > daysThreshold) return false

      // Status bucket filter (from clicking KPI card or status tab)
      if (statusFilter === 'expired' && !(item.status === 'expired' || item.days_to_expiry <= 0)) return false
      if (statusFilter === 'critical' && !(item.days_to_expiry > 0 && item.days_to_expiry <= 7)) return false
      if (statusFilter === 'warning' && !(item.days_to_expiry > 7 && item.days_to_expiry <= 30)) return false
      if (statusFilter === 'safe' && !(item.days_to_expiry > 30)) return false

      // Item Type Filter
      if (selectedType !== 'all' && item.item_type !== selectedType) return false

      // Location Filter
      if (selectedLocation !== 'all' && item.location_name !== selectedLocation) return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchCode = item.item_code.toLowerCase().includes(q)
        const matchName = item.item_name.toLowerCase().includes(q)
        const matchBatch = item.batch_number.toLowerCase().includes(q)
        const matchLoc = item.location_name.toLowerCase().includes(q)
        if (!matchCode && !matchName && !matchBatch && !matchLoc) return false
      }

      return true
    })
  }, [rawItems, daysThreshold, statusFilter, selectedType, selectedLocation, searchQuery])

  // Grouped items by item_id / item_code
  const groupedItems = useMemo<GroupedExpiryItem[]>(() => {
    const map = new Map<string, GroupedExpiryItem>()

    filteredItems.forEach((item) => {
      const key = item.item_id || item.item_code
      if (!map.has(key)) {
        map.set(key, {
          item_id: item.item_id,
          item_code: item.item_code,
          item_name: item.item_name,
          item_type: item.item_type,
          packaging: item.packaging || '-',
          location_name: item.location_name,
          unit_cost: item.unit_cost || 0,
          total_quantity: 0,
          batch_count: 0,
          earliest_expiry_date: item.expiry_date,
          min_days_to_expiry: item.days_to_expiry,
          worst_status: item.status,
          batches: [],
        })
      }

      const group = map.get(key)!
      group.batches.push(item)
      group.total_quantity += item.quantity
      group.batch_count += 1

      // Track earliest expiry (FEFO)
      if (item.days_to_expiry < group.min_days_to_expiry) {
        group.min_days_to_expiry = item.days_to_expiry
        group.earliest_expiry_date = item.expiry_date
      }

      if (item.status === 'expired' || item.days_to_expiry <= 0) {
        group.worst_status = 'expired'
      } else if (item.status === 'near_expiry' && group.worst_status !== 'expired') {
        group.worst_status = 'near_expiry'
      }
    })

    // Sort batches within each group by days_to_expiry ascending (FEFO)
    map.forEach((group) => {
      group.batches.sort((a, b) => a.days_to_expiry - b.days_to_expiry)
    })

    // Sort groups by min_days_to_expiry ascending (most urgent items on top)
    return Array.from(map.values()).sort((a, b) => a.min_days_to_expiry - b.min_days_to_expiry)
  }, [filteredItems])

  // Toggle single item accordion
  const toggleExpand = (itemId: string) => {
    setExpandedItemIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  // Toggle all accordions
  const toggleExpandAll = () => {
    const allExpanded = groupedItems.length > 0 && groupedItems.every((g) => expandedItemIds[g.item_id])
    if (allExpanded) {
      setExpandedItemIds({})
    } else {
      const all: Record<string, boolean> = {}
      groupedItems.forEach((g) => {
        all[g.item_id] = true
      })
      setExpandedItemIds(all)
    }
  }

  // Multi-select handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemIds(filteredItems.map((i) => i.batch_id))
    } else {
      setSelectedItemIds([])
    }
  }

  const handleToggleSelect = (batchId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    )
  }

  const handleToggleSelectGroup = (group: GroupedExpiryItem) => {
    const batchIds = group.batches.map((b) => b.batch_id)
    const allSelected = batchIds.every((id) => selectedItemIds.includes(id))
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !batchIds.includes(id)))
    } else {
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...batchIds])))
    }
  }

  // Copy batch number helper
  const handleCopyBatch = (batchNo: string, batchId: string) => {
    navigator.clipboard.writeText(batchNo)
    setCopiedBatchId(batchId)
    showToast(`No. Batch "${batchNo}" telah disalin`, 'info')
    setTimeout(() => setCopiedBatchId(null), 2000)
  }

  // Export CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      showToast('Tiada rekod untuk dieksport', 'error')
      return
    }

    const headers = ['Kod Item', 'Nama Item', 'Jenis', 'Pembungkusan', 'No Batch', 'Lokasi', 'Kuantiti', 'Tarikh Luput', 'Baki Hari', 'Status']
    const rows = filteredItems.map((item) => [
      `"${item.item_code}"`,
      `"${item.item_name.replace(/"/g, '""')}"`,
      item.item_type === 'drug' ? 'Ubat' : 'Bukan Ubat',
      `"${(item.packaging || '-').replace(/"/g, '""')}"`,
      `"${item.batch_number}"`,
      `"${item.location_name}"`,
      item.quantity,
      item.expiry_date,
      item.days_to_expiry,
      item.status === 'expired' || item.days_to_expiry <= 0 ? 'LUPUT' : `${item.days_to_expiry} hari`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Rekod_Near_Expiry_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`Berjaya mengeksport ${filteredItems.length} rekod ke CSV`, 'success')
  }

  // Format Date Helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Badge Renderer
  const renderExpiryPill = (daysToExpiry: number, status: string) => {
    if (status === 'expired' || daysToExpiry <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          Telah Luput ({Math.abs(daysToExpiry)} hari)
        </span>
      )
    }
    if (daysToExpiry <= 7) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          {daysToExpiry} Hari Lagi (Kritikal)
        </span>
      )
    }
    if (daysToExpiry <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
          {daysToExpiry} Hari Lagi
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        {daysToExpiry} Hari Lagi
      </span>
    )
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800/80">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              INVENTORY SAFETY & ROTATION
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Clock className="w-7 h-7 text-amber-400" />
              Kawalan & Pemantauan Stok Hampir Luput
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau item farmasi dan perubatan yang mendekati tarikh luput untuk mengelakkan pembaziran, mempercepatkan agihan stok, dan memastikan keselamatan pesakit.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void loadData()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Muat Semula
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-900/30 transition-all active:scale-95 border border-indigo-400/30"
            >
              <Download className="w-4 h-4" />
              Eksport Laporan CSV
            </button>
          </div>
        </div>
      </div>

      {/* Interactive KPI Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Expired */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
          className={`cursor-pointer group relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 shadow-sm ${
            statusFilter === 'expired'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/40 shadow-md'
              : 'bg-white hover:bg-rose-50/50 border-slate-200/80 hover:border-rose-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-md">
              Telah Luput
            </span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {stats.expiredCount}
            </span>
            <span className="text-xs font-semibold text-rose-600">
              {stats.expiredCount > 0 ? 'Tindakan Segera Required' : 'Stok Bekerja Good'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Anggaran Kerugian:</span>
            <span className="font-semibold font-mono text-slate-700">RM {stats.totalExpiredValue.toFixed(2)}</span>
          </p>
        </div>

        {/* Stat 2: Critical (<= 7 Days) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
          className={`cursor-pointer group relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 shadow-sm ${
            statusFilter === 'critical'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
              : 'bg-white hover:bg-amber-50/50 border-slate-200/80 hover:border-amber-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
              &le; 7 Hari (Kritikal)
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {stats.criticalCount}
            </span>
            <span className="text-xs font-semibold text-amber-700">Agihan Keutamaan Tinggi</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Nilai Stok Terlibat:</span>
            <span className="font-semibold font-mono text-slate-700">RM {stats.totalCriticalValue.toFixed(2)}</span>
          </p>
        </div>

        {/* Stat 3: Warning (8 - 30 Days) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')}
          className={`cursor-pointer group relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 shadow-sm ${
            statusFilter === 'warning'
              ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-400/40 shadow-md'
              : 'bg-white hover:bg-yellow-50/50 border-slate-200/80 hover:border-yellow-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-800 bg-yellow-100 px-2.5 py-1 rounded-md">
              8 - 30 Hari
            </span>
            <div className="p-2 rounded-xl bg-yellow-100 text-yellow-700 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {stats.warningCount}
            </span>
            <span className="text-xs font-medium text-yellow-800">Amaran Luput</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">
            Sedia untuk FEFO (First Expired, First Out)
          </p>
        </div>

        {/* Stat 4: Safe (> 30 Days) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'safe' ? 'all' : 'safe')}
          className={`cursor-pointer group relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 shadow-sm ${
            statusFilter === 'safe'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/40 shadow-md'
              : 'bg-white hover:bg-blue-50/50 border-slate-200/80 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2.5 py-1 rounded-md">
              31+ Hari
            </span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {stats.safeCount}
            </span>
            <span className="text-xs font-medium text-blue-700">Status Selamat</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">
            Tempoh hayat mencukupi
          </p>
        </div>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mengikut kod item, nama ubat, no. batch atau lokasi..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Threshold Selector */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                Tempoh Luput:
              </span>
              <select
                value={daysThreshold.toString()}
                onChange={(e) => setDaysThreshold(Number(e.target.value))}
                className="bg-transparent text-sm font-semibold text-indigo-700 focus:outline-none cursor-pointer"
              >
                <option value="7">7 Hari</option>
                <option value="14">14 Hari</option>
                <option value="30">30 Hari</option>
                <option value="60">60 Hari</option>
                <option value="90">90 Hari</option>
                <option value="180">180 Hari</option>
                <option value="365">1 Tahun (365 Hari)</option>
                <option value="9999">Semua Tempoh</option>
              </select>
            </div>

            {/* Item Type Pill Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedType === 'all'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setSelectedType('drug')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedType === 'drug'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ubat
              </button>
              <button
                onClick={() => setSelectedType('non_drug')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedType === 'non_drug'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bukan Ubat
              </button>
            </div>

            {/* Location Selector */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Lokasi ({uniqueLocations.length})</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setViewMode('grouped')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'grouped'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Kelompokkan mengikut item dengan pecahan batch"
              >
                <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kelompok Item ({groupedItems.length})</span>
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'flat'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Papar semua batch secara berasingan"
              >
                <LayoutList className="w-3.5 h-3.5 text-slate-500" />
                <span>Semua Batch ({filteredItems.length})</span>
              </button>
            </div>

            {/* Reset Filters button if any active filter */}
            {(statusFilter !== 'all' || selectedType !== 'all' || selectedLocation !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setSelectedType('all')
                  setSelectedLocation('all')
                  setSearchQuery('')
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
              >
                Set Semula Penapis
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tab Pills */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 overflow-x-auto">
          <span className="text-xs font-medium text-slate-400 mr-1 flex-shrink-0">Status Penapis:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Rekod ({stats.totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'expired'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            Telah Luput ({stats.expiredCount})
          </button>
          <button
            onClick={() => setStatusFilter('critical')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'critical'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            &le; 7 Hari ({stats.criticalCount})
          </button>
          <button
            onClick={() => setStatusFilter('warning')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'warning'
                ? 'bg-yellow-500 text-white shadow-sm'
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100'
            }`}
          >
            8 - 30 Hari ({stats.warningCount})
          </button>
          <button
            onClick={() => setStatusFilter('safe')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'safe'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            31+ Hari ({stats.safeCount})
          </button>
        </div>
      </div>

      {/* Batch Action Toolbar when items are selected */}
      {selectedItemIds.length > 0 && (
        <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-lg border border-indigo-700 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/30 border border-indigo-400/30 text-xs font-extrabold font-mono text-indigo-200">
              {selectedItemIds.length} DILIHAT
            </span>
            <span className="text-sm font-semibold">Item Dipilih Untuk Tindakan Berkelompok</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const first = rawItems.find((i) => selectedItemIds.includes(i.batch_id))
                if (first) setTransferModalItem(first)
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold transition-all shadow-sm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Mohon Pemindahan Stok
            </button>
            <button
              onClick={() => {
                const first = rawItems.find((i) => selectedItemIds.includes(i.batch_id))
                if (first) setDisposalModalItem(first)
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Rekod Pelupusan (KEW.PS)
            </button>
            <button
              onClick={() => setSelectedItemIds([])}
              className="px-3 py-2 text-xs font-medium text-indigo-200 hover:text-white"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Spinner size="lg" className="text-indigo-600" />
            <p className="text-sm text-slate-500 font-medium">Memuatkan data stok hampir luput...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-800">Gagal Memuatkan Rekod</p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => void loadData()}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-500"
            >
              Cuba Lagi
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {viewMode === 'grouped' ? (
              /* GROUPED VIEW TABLE */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredItems.length > 0 &&
                          filteredItems.every((i) => selectedItemIds.includes(i.batch_id))
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                        title="Pilih Semua Item"
                      />
                    </th>
                    <th className="py-3.5 px-2 w-8 text-center">
                      <button
                        onClick={toggleExpandAll}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 transition-colors"
                        title="Buka / Tutup Semua Pecahan Batch"
                      >
                        <ChevronsUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Item & Spesifikasi</th>
                    <th className="py-3.5 px-4">Jenis</th>
                    <th className="py-3.5 px-4">Pembungkusan</th>
                    <th className="py-3.5 px-4">Lokasi Depot / Wad</th>
                    <th className="py-3.5 px-4 text-right">Jumlah Stok</th>
                    <th className="py-3.5 px-4 text-center">Pecahan Batch</th>
                    <th className="py-3.5 px-4">Luput Terdekat (FEFO)</th>
                    <th className="py-3.5 px-4 text-center">Tindakan</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {groupedItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 px-4 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                            <ShieldCheck className="w-8 h-8" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800">
                            Tiada Item Hampir Luput Dikesan
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Tiada rekod item luput atau mendekati tarikh luput dalam tempoh {daysThreshold} hari mengikut kriteria penapis anda.
                          </p>
                          {(statusFilter !== 'all' || selectedType !== 'all' || selectedLocation !== 'all' || searchQuery) && (
                            <button
                              onClick={() => {
                                setStatusFilter('all')
                                setSelectedType('all')
                                setSelectedLocation('all')
                                setSearchQuery('')
                              }}
                              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                            >
                              Kosongkan Penapis
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    groupedItems.map((group) => {
                      const isExpanded = Boolean(expandedItemIds[group.item_id])
                      const isAllGroupSelected = group.batches.every((b) => selectedItemIds.includes(b.batch_id))
                      const isSomeGroupSelected = group.batches.some((b) => selectedItemIds.includes(b.batch_id)) && !isAllGroupSelected
                      const isExpired = group.worst_status === 'expired' || group.min_days_to_expiry <= 0
                      const earliestBatch = group.batches[0]

                      return (
                        <React.Fragment key={group.item_id}>
                          {/* Parent Item Master Row */}
                          <tr
                            className={`transition-colors duration-150 ${
                              isAllGroupSelected
                                ? 'bg-indigo-50/70'
                                : isExpired
                                ? 'bg-rose-50/40 hover:bg-rose-50/70'
                                : isExpanded
                                ? 'bg-slate-50/80 hover:bg-slate-50'
                                : 'hover:bg-slate-50/60'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isAllGroupSelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = isSomeGroupSelected
                                }}
                                onChange={() => handleToggleSelectGroup(group)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                              />
                            </td>

                            {/* Accordion Expand Button */}
                            <td className="py-3.5 px-2 text-center">
                              <button
                                onClick={() => toggleExpand(group.item_id)}
                                className={`p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all ${
                                  isExpanded ? 'bg-indigo-50 text-indigo-600' : ''
                                }`}
                                title={isExpanded ? 'Tutup Pecahan Batch' : 'Buka Pecahan Batch'}
                              >
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180 text-indigo-600' : ''
                                  }`}
                                />
                              </button>
                            </td>

                            {/* Item Code & Name */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors">
                                  {group.item_name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
                                    {group.item_code}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Type */}
                            <td className="py-3.5 px-4">
                              {group.item_type === 'drug' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  Ubat
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  Bukan Ubat
                                </span>
                              )}
                            </td>

                            {/* Packaging */}
                            <td className="py-3.5 px-4">
                              <span className="text-xs font-semibold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/80">
                                {group.packaging || '-'}
                              </span>
                            </td>

                            {/* Location */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium max-w-xs">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="truncate" title={group.location_name}>{group.location_name}</span>
                              </div>
                            </td>

                            {/* Total Quantity */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-mono font-extrabold text-slate-900 text-sm">
                                  {group.total_quantity.toLocaleString('ms-MY')}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {group.batch_count} Batch
                                </span>
                              </div>
                            </td>

                            {/* Batch Pill Count */}
                            <td className="py-3.5 px-4 text-center">
                              {group.batch_count === 1 ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                  <span>{group.batches[0].batch_number}</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => toggleExpand(group.item_id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-xs"
                                >
                                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>{group.batch_count} Batch</span>
                                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </td>

                            {/* Earliest Expiry (FEFO) */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-slate-800">
                                  {formatDate(group.earliest_expiry_date)}
                                </span>
                                <div>
                                  {renderExpiryPill(group.min_days_to_expiry, group.worst_status)}
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setActiveModalItem(earliestBatch)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Lihat Perincian Item"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setTransferModalItem(earliestBatch)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Mohon Pemindahan Stok (FEFO Prioriti)"
                                >
                                  <ArrowRightLeft className="w-4 h-4" />
                                </button>
                                {isExpired && (
                                  <button
                                    onClick={() => setDisposalModalItem(earliestBatch)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Rekod Pelupusan KEW.PS-11"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Nested Batch Drawer */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90 border-b border-slate-200/80">
                              <td colSpan={10} className="p-3 sm:p-4">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ml-4 sm:ml-8">
                                  <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Layers className="w-4 h-4 text-indigo-600" />
                                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                        Pecahan Batch & Giliran Pengagihan (FEFO - First Expired, First Out)
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-500">
                                      {group.batches.length} Batch Aktif
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                                          <th className="py-2.5 px-3 w-8 text-center">Pilih</th>
                                          <th className="py-2.5 px-3">Keutamaan FEFO</th>
                                          <th className="py-2.5 px-3">No. Batch</th>
                                          <th className="py-2.5 px-3">Lokasi Simpanan</th>
                                          <th className="py-2.5 px-3 text-right">Kuantiti Batch</th>
                                          <th className="py-2.5 px-3">Tarikh Luput</th>
                                          <th className="py-2.5 px-3 text-center">Status Risiko</th>
                                          <th className="py-2.5 px-3 text-center">Tindakan Batch</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {group.batches.map((batch, idx) => {
                                          const isBatchSelected = selectedItemIds.includes(batch.batch_id)
                                          const isBatchExpired = batch.status === 'expired' || batch.days_to_expiry <= 0

                                          return (
                                            <tr
                                              key={batch.batch_id}
                                              className={`transition-colors ${
                                                isBatchSelected
                                                  ? 'bg-indigo-50/80'
                                                  : idx === 0
                                                  ? 'bg-amber-50/30 hover:bg-amber-50/60'
                                                  : 'hover:bg-slate-50/80'
                                              }`}
                                            >
                                              {/* Batch Select Checkbox */}
                                              <td className="py-2.5 px-3 text-center">
                                                <input
                                                  type="checkbox"
                                                  checked={isBatchSelected}
                                                  onChange={() => handleToggleSelect(batch.batch_id)}
                                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                                                />
                                              </td>

                                              {/* Priority Tag */}
                                              <td className="py-2.5 px-3">
                                                {idx === 0 ? (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                                                    #1 Terawal Luput (FEFO)
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                    #{idx + 1} Seterusnya
                                                  </span>
                                                )}
                                              </td>

                                              {/* Batch Number */}
                                              <td className="py-2.5 px-3">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                    {batch.batch_number}
                                                  </span>
                                                  <button
                                                    onClick={() => handleCopyBatch(batch.batch_number, batch.batch_id)}
                                                    className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-200 transition-colors"
                                                    title="Salin No Batch"
                                                  >
                                                    {copiedBatchId === batch.batch_id ? (
                                                      <Check className="w-3 h-3 text-emerald-600" />
                                                    ) : (
                                                      <Copy className="w-3 h-3" />
                                                    )}
                                                  </button>
                                                </div>
                                              </td>

                                              {/* Batch Location */}
                                              <td className="py-2.5 px-3">
                                                <span className="text-slate-600 font-medium">
                                                  {batch.location_name}
                                                </span>
                                              </td>

                                              {/* Batch Quantity */}
                                              <td className="py-2.5 px-3 text-right">
                                                <span className="font-mono font-bold text-slate-900">
                                                  {batch.quantity.toLocaleString('ms-MY')} Unit
                                                </span>
                                              </td>

                                              {/* Batch Expiry Date */}
                                              <td className="py-2.5 px-3">
                                                <span className="font-semibold text-slate-800">
                                                  {formatDate(batch.expiry_date)}
                                                </span>
                                              </td>

                                              {/* Batch Status Risk Pill */}
                                              <td className="py-2.5 px-3 text-center">
                                                {renderExpiryPill(batch.days_to_expiry, batch.status)}
                                              </td>

                                              {/* Batch Actions */}
                                              <td className="py-2.5 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                  <button
                                                    onClick={() => setActiveModalItem(batch)}
                                                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                    title="Lihat Perincian Batch Ini"
                                                  >
                                                    <Eye className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                    onClick={() => setTransferModalItem(batch)}
                                                    className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                                                    title="Pindah / Agih Batch Ini"
                                                  >
                                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                                  </button>
                                                  {isBatchExpired && (
                                                    <button
                                                      onClick={() => setDisposalModalItem(batch)}
                                                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                                      title="Pelupusan Batch Ini"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* FLAT LIST TABLE VIEW */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredItems.length > 0 &&
                          filteredItems.every((i) => selectedItemIds.includes(i.batch_id))
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-4">Item & Spesifikasi</th>
                    <th className="py-3.5 px-4">Jenis</th>
                    <th className="py-3.5 px-4">Pembungkusan</th>
                    <th className="py-3.5 px-4">No. Batch</th>
                    <th className="py-3.5 px-4">Lokasi Depot / Wad</th>
                    <th className="py-3.5 px-4 text-right">Baki Kuantiti</th>
                    <th className="py-3.5 px-4">Tarikh Luput</th>
                    <th className="py-3.5 px-4 text-center">Status Risk</th>
                    <th className="py-3.5 px-4 text-center">Tindakan</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 px-4 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                            <ShieldCheck className="w-8 h-8" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800">
                            Tiada Item Hampir Luput Dikesan
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Tiada rekod item luput atau mendekati tarikh luput dalam tempoh {daysThreshold} hari mengikut kriteria penapis anda.
                          </p>
                          {(statusFilter !== 'all' || selectedType !== 'all' || selectedLocation !== 'all' || searchQuery) && (
                            <button
                              onClick={() => {
                                setStatusFilter('all')
                                setSelectedType('all')
                                setSelectedLocation('all')
                                setSearchQuery('')
                              }}
                              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                            >
                              Kosongkan Penapis
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isSelected = selectedItemIds.includes(item.batch_id)
                      const isExpired = item.status === 'expired' || item.days_to_expiry <= 0

                      return (
                        <tr
                          key={item.batch_id}
                          className={`transition-colors duration-150 ${
                            isSelected
                              ? 'bg-indigo-50/60'
                              : isExpired
                              ? 'bg-rose-50/40 hover:bg-rose-50/80'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(item.batch_id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </td>

                          {/* Item Code & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-sm">
                                {item.item_name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
                                  {item.item_code}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-4">
                            {item.item_type === 'drug' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Ubat
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Bukan Ubat
                              </span>
                            )}
                          </td>

                          {/* Packaging */}
                          <td className="py-3.5 px-4">
                            <span className="text-xs font-semibold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/80">
                              {item.packaging || '-'}
                            </span>
                          </td>

                          {/* Batch Number */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                {item.batch_number}
                              </span>
                              <button
                                onClick={() => handleCopyBatch(item.batch_number, item.batch_id)}
                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-slate-100"
                                title="Salin No Batch"
                              >
                                {copiedBatchId === item.batch_id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>{item.location_name}</span>
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {item.quantity.toLocaleString('ms-MY')}
                            </span>
                          </td>

                          {/* Expiry Date */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-800">
                                {formatDate(item.expiry_date)}
                              </span>
                            </div>
                          </td>

                          {/* Status Risk Pill */}
                          <td className="py-3.5 px-4 text-center">
                            {renderExpiryPill(item.days_to_expiry, item.status)}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setActiveModalItem(item)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Lihat Perincian"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setTransferModalItem(item)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Mohon Pemindahan"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              {isExpired && (
                                <button
                                  onClick={() => setDisposalModalItem(item)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Rekod Pelupusan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 space-y-0">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Perincian Item & Batch</h3>
                  <p className="text-xs text-slate-400">Maklumat penuh inventori farmasi</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 text-sm text-slate-700">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Item</div>
                <div className="font-bold text-slate-900 text-base">{activeModalItem.item_name}</div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-white border border-slate-300 text-indigo-700">
                    {activeModalItem.item_code}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                    {activeModalItem.item_type === 'drug' ? 'Ubat Farmasi' : 'Item Bukan Ubat'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="text-xs text-slate-400">No. Batch</div>
                  <div className="font-mono font-bold text-slate-800 mt-1">{activeModalItem.batch_number}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="text-xs text-slate-400">Baki Kuantiti</div>
                  <div className="font-mono font-extrabold text-slate-900 mt-1">
                    {activeModalItem.quantity.toLocaleString('ms-MY')} unit
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="text-xs text-slate-400">Tarikh Luput</div>
                  <div className="font-bold text-slate-800 mt-1">{formatDate(activeModalItem.expiry_date)}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="text-xs text-slate-400">Baki Tempoh</div>
                  <div className="mt-1">{renderExpiryPill(activeModalItem.days_to_expiry, activeModalItem.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="text-xs text-slate-400">Pembungkusan (Packaging)</div>
                  <div className="font-semibold text-slate-800 mt-1">{activeModalItem.packaging || '-'}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="text-xs text-slate-400">Lokasi Simpanan / Depo</div>
                  <div className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span className="truncate">{activeModalItem.location_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  const item = activeModalItem
                  setActiveModalItem(null)
                  setTransferModalItem(item)
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-sm"
              >
                Mohon Pemindahan
              </button>
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {transferModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 space-y-0">
            <div className="bg-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Permohonan Pemindahan Stok (FEFO)</h3>
              </div>
              <button onClick={() => setTransferModalItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Memindahkan item hampir luput ke wad/kaunter berkesusah tinggi mempercepatkan penggunaan stok sebelum luput.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Item & Batch</label>
                <div className="font-semibold text-slate-900">{transferModalItem.item_name}</div>
                <div className="text-xs text-slate-500 font-mono">Batch: {transferModalItem.batch_number} (Baki: {transferModalItem.quantity})</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Lokasi Sasaran Pemindahan</label>
                <select
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                  {uniqueLocations.length === 0 && (
                    <>
                      <option value="Decanting">Decanting</option>
                      <option value="Main Store">Main Store</option>
                      <option value="Pharmacy Logistic">Pharmacy Logistic</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Kuantiti Dipindahkan</label>
                <input
                  type="number"
                  min={1}
                  max={transferModalItem.quantity}
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setTransferModalItem(null)
                  showToast(`Permohonan pemindahan ${transferQty} unit "${transferModalItem.item_name}" ke ${targetLocation} telah dihantar!`, 'success')
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
              >
                Hantar Permohonan
              </button>
              <button
                onClick={() => setTransferModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disposal Modal */}
      {disposalModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 space-y-0">
            <div className="bg-rose-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-base">Rekod Pelupusan Stok (KEW.PS-11)</h3>
              </div>
              <button onClick={() => setDisposalModalItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-700">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                Peringatan: Item yang telah luput mesti dilupuskan mengikut Tatacara Pengurusan Stor Kerajaan.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Item Dipilih</label>
                <div className="font-bold text-slate-900">{disposalModalItem.item_name}</div>
                <div className="text-xs text-slate-500 font-mono">No Batch: {disposalModalItem.batch_number}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Sebab Pelupusan</label>
                <select
                  value={disposalReason}
                  onChange={(e) => setDisposalReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                >
                  <option value="Telah Luput Tarikh (Expired)">Telah Luput Tarikh (Expired)</option>
                  <option value="Rosak / Kontaminasi">Rosak / Kontaminasi</option>
                  <option value="Perubahan Karakteristik Ubat">Perubahan Karakteristik Ubat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">No. Rujukan Borang KEW.PS-11</label>
                <input
                  type="text"
                  placeholder="Cth: KEW.PS11-2025-0041"
                  value={disposalRefNo}
                  onChange={(e) => setDisposalRefNo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setDisposalModalItem(null)
                  showToast(`Rekod pelupusan KEW.PS-11 untuk "${disposalModalItem.item_name}" berjaya disimpan!`, 'success')
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 shadow-sm"
              >
                Sahkan Pelupusan
              </button>
              <button
                onClick={() => setDisposalModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NearExpiryPage


