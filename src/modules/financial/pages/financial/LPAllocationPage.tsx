// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  Package,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Calendar,
  AlertTriangle,
  FileText,
  BadgeAlert,
  HelpCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Spinner, Button, Input, Select, Badge, Table } from '@/components/ui'
import { getLpItems, getLpAllocationSummary } from '@/services/pharmacy/lpAllocationService'
import { triggerLpSync, getLpSyncLogs } from '@/services/pharmacy/inventoryService'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

export const LPAllocationPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  const hospitalId = user?.hospital_id

  const [activeTab, setActiveTab] = useState<'sebut_harga_lq' | 'cfln' | 'non_drug'>('sebut_harga_lq')
  const [summary, setSummary] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  const [lastSyncLog, setLastSyncLog] = useState<any>(null)

  // Load summary and items
  const loadData = async () => {
    if (!hospitalId) return
    setIsLoading(true)
    setError(null)
    try {
      const [summaryResult, itemsResult, logsResult] = await Promise.all([
        getLpAllocationSummary(hospitalId),
        getLpItems(hospitalId, {
          type: activeTab,
          search: searchQuery || undefined,
          page: currentPage,
          pageSize
        }),
        getLpSyncLogs(hospitalId)
      ])

      if (summaryResult.error) {
        setError(summaryResult.error)
      } else {
        setSummary(summaryResult.data)
      }

      if (itemsResult.error) {
        setError(itemsResult.error)
      } else if (itemsResult.data) {
        setItems(itemsResult.data.data)
        setTotal(itemsResult.data.total)
        setTotalPages(itemsResult.data.totalPages)
      }

      if (logsResult.data && logsResult.data.length > 0) {
        setLastSyncLog(logsResult.data[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuatkan data LP')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [hospitalId, activeTab, currentPage, searchQuery])

  // Sync Google Sheets catalog
  const handleSync = async () => {
    if (!hospitalId) return
    setIsSyncing(true)
    try {
      const res = await triggerLpSync(hospitalId)
      if (res.error) {
        showError('Sync Gagal', res.error)
      } else if (res.data) {
        showSuccess(
          'Sync Berjaya',
          `Memproses ${res.data.total_rows_processed} baris (${res.data.drugs_upserted} ubat & ${res.data.non_drugs_upserted} bukan ubat dikemaskini).`
        )
        // Reload page data
        loadData()
      }
    } catch (err) {
      showError('Sync Gagal', err instanceof Error ? err.message : 'Gagal menyelaraskan catalog LP')
    } finally {
      setIsSyncing(false)
    }
  }

  // Calculate top stats
  const stats = useMemo(() => {
    if (!summary) return []
    return [
      {
        label: 'Jumlah Barangan LP',
        value: summary.total_items,
        subtext: 'Ubat & Bukan Ubat',
        icon: Package,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
      },
      {
        label: 'Jumlah Kuota Diagihkan',
        value: summary.total_quota.toLocaleString(),
        subtext: 'Unit yang diperuntukkan',
        icon: TrendingUp,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
      },
      {
        label: 'Baki Kuota LP',
        value: summary.total_balance.toLocaleString(),
        subtext: 'Unit yang masih ada',
        icon: TrendingDown,
        color: 'text-sky-600 bg-sky-50 border-sky-100'
      },
      {
        label: 'Anggaran Nilai Perolehan',
        value: formatCurrency(summary.total_value),
        subtext: 'Berdasarkan harga sebut harga',
        icon: DollarSign,
        color: 'text-amber-600 bg-amber-50 border-amber-100'
      }
    ]
  }, [summary])

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">LP Allocation (Pembelian Tempatan)</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Urusan peruntukan kuota dan baki barangan LP yang dikemaskini dari Google Sheets.
          </p>
        </div>

        {/* Sync Button */}
        <div className="flex items-center gap-2.5">
          {lastSyncLog && (
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terakhir Diselaras</p>
              <p className="text-xs text-slate-600 font-bold">
                {formatDate(lastSyncLog.synced_at)} ({lastSyncLog.rows_fetched} baris)
              </p>
            </div>
          )}
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="rounded-2xl gap-2 font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            {isSyncing ? 'Menyelaras...' : 'Penyelarasan LP'}
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                <span className="text-2xl font-black text-slate-800 block">{stat.value}</span>
                <span className="text-xs text-slate-500 font-medium block">{stat.subtext}</span>
              </div>
              <div className={cn("p-3 rounded-2xl border", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-100 gap-1 bg-slate-50/50 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'sebut_harga_lq', label: 'Ubat Sebut Harga (LQ)' },
          { id: 'cfln', label: 'Ubat CFLN' },
          { id: 'non_drug', label: 'Non-Drug' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any)
              setCurrentPage(1)
            }}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition-all",
              activeTab === tab.id
                ? "bg-white text-indigo-600 shadow-soft"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item code or name..."
            className="pl-11 pr-4 py-2.5 rounded-2xl border-slate-100 bg-white"
          />
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner size="lg" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading LP data...</span>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-5 m-6 text-rose-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <div>
              <p className="font-bold">Failed to load LP data</p>
              <p className="text-xs font-medium mt-0.5">{error}</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No records found</p>
            <p className="text-xs text-slate-400 mt-1">
              No LP items matching your search or filters. Please adjust catalog or re-filter.
            </p>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50 border-b border-slate-100">
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Kod PHIS</Table.Cell>
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Nama Barangan</Table.Cell>
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Pembungkusan</Table.Cell>
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">UOM</Table.Cell>
                {activeTab !== 'cfln' && (
                  <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-right">Harga (RM)</Table.Cell>
                )}
                {activeTab !== 'cfln' && (
                  <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-center">Kuota</Table.Cell>
                )}
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-center">Baki</Table.Cell>
                {activeTab === 'cfln' && (
                  <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Sub-Kelas</Table.Cell>
                )}
                {activeTab !== 'cfln' && (
                  <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-center">Tempoh Kontrak</Table.Cell>
                )}
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Catatan</Table.Cell>
              </Table.Row>
            </Table.Header>
            <Table.Body className="divide-y divide-slate-100">
              {items.map((item) => (
                <Table.Row key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* PHIS Code */}
                  <Table.Cell className="font-mono text-xs font-bold text-slate-700">
                    {activeTab === 'non_drug' ? item.item_code : item.drug_code}
                  </Table.Cell>

                  {/* Name */}
                  <Table.Cell className="text-sm font-black text-slate-800">
                    {activeTab === 'non_drug' ? item.item_name : item.drug_name}
                  </Table.Cell>

                  {/* Packaging */}
                  <Table.Cell className="text-xs font-semibold text-slate-500">
                    {item.packaging_description || '—'}
                  </Table.Cell>

                  {/* UOM */}
                  <Table.Cell className="text-xs font-bold uppercase text-slate-400">
                    {item.unit_of_measure}
                  </Table.Cell>

                  {/* Price */}
                  {activeTab !== 'cfln' && (
                    <Table.Cell className="text-sm text-slate-700 font-mono font-bold text-right">
                      {item.price !== null && item.price !== undefined ? `RM ${Number(item.price).toFixed(2)}` : '—'}
                    </Table.Cell>
                  )}

                  {/* Quota */}
                  {activeTab !== 'cfln' && (
                    <Table.Cell className="text-sm text-slate-600 font-mono font-bold text-center">
                      {item.lp_quota !== null && item.lp_quota !== undefined ? item.lp_quota : '—'}
                    </Table.Cell>
                  )}

                  {/* Balance */}
                  <Table.Cell className="text-center">
                    <Badge
                      variant={item.lp_balance > 0 ? 'success' : 'danger'}
                      className="rounded-xl font-bold font-mono px-2.5 py-0.5 text-[11px]"
                    >
                      {item.lp_balance}
                    </Badge>
                  </Table.Cell>

                  {/* Sub-class (CFLN Only) */}
                  {activeTab === 'cfln' && (
                    <Table.Cell className="text-xs font-bold text-slate-500">
                      {item.item_sub_class || '—'}
                    </Table.Cell>
                  )}

                  {/* Contract Dates (LQ and Non-Drug) */}
                  {activeTab !== 'cfln' && (
                    <Table.Cell className="text-center text-[10px] text-slate-500 font-bold font-mono">
                      {item.lp_start_date && item.lp_end_date ? (
                        <span>{item.lp_start_date} hingga {item.lp_end_date}</span>
                      ) : '—'}
                    </Table.Cell>
                  )}

                  {/* Remarks */}
                  <Table.Cell className="text-xs font-medium text-slate-400 max-w-[200px] truncate">
                    {item.lp_remarks || '—'}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold font-mono px-2">
          <span>
            HALAMAN {currentPage} DARI {totalPages} ({total} baris)
          </span>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="rounded-xl p-2 min-w-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="rounded-xl p-2 min-w-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LPAllocationPage
