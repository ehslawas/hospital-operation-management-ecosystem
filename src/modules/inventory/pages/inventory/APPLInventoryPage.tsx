// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Database, Search, Filter, RefreshCw, Layers, CheckCircle2, ChevronRight, X, Clock, HelpCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Select, Modal, Button } from '@/components/ui'
import { getApplItems, getApplSuppliers, getApplSyncStatus, triggerApplSync, getDrugCategories } from '../../services/inventoryService'
import type { DrugWithRelations, DrugCategory, InventoryFilter } from '@/types/pharmacy'

export const APPLInventoryPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [items, setItems] = useState<DrugWithRelations[]>([])
  const [categories, setCategories] = useState<DrugCategory[]>([])
  const [syncStatus, setSyncStatus] = useState<any>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  // Selected Item for Detail Drawer
  const [selectedItem, setSelectedItem] = useState<DrugWithRelations | null>(null)
  const [approvedSuppliers, setApprovedSuppliers] = useState<any[]>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)

  // Load drug categories
  useEffect(() => {
    const loadCategories = async () => {
      const res = await getDrugCategories()
      if (res.data) {
        setCategories(res.data)
      }
    }
    void loadCategories()
  }, [])

  // Load sync status
  const loadSyncStatus = useCallback(async () => {
    if (!hospitalId) return
    const res = await getApplSyncStatus(hospitalId)
    if (res.data) {
      setSyncStatus(res.data)
    }
  }, [hospitalId])

  useEffect(() => {
    void loadSyncStatus()
  }, [loadSyncStatus])

  // Load APPL Items
  const loadItems = useCallback(async () => {
    if (!hospitalId) return

    setIsLoading(true)
    setError(null)

    const filter: InventoryFilter = {
      search: search || undefined,
      category_id: categoryId || undefined,
      status: status === 'all' ? undefined : status,
    }

    const res = await getApplItems(hospitalId, filter, page, pageSize)

    if (res.error) {
      setError(res.error)
      setItems([])
    } else if (res.data) {
      setItems(res.data.data)
      setTotalPages(res.data.totalPages)
      setTotal(res.data.total)
    }

    setIsLoading(false)
  }, [hospitalId, search, categoryId, status, page])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  // Reset page when filters change
  useEffect(() => {
    setPage(page => (page === 1 ? page : 1))
  }, [search, categoryId, status])

  // Load suppliers when item is selected
  useEffect(() => {
    if (!hospitalId || !selectedItem) {
      setApprovedSuppliers([])
      return
    }

    const loadSuppliers = async () => {
      setIsLoadingSuppliers(true)
      const res = await getApplSuppliers(hospitalId, selectedItem.drug_code)
      if (res.data) {
        setApprovedSuppliers(res.data)
      }
      setIsLoadingSuppliers(false)
    }

    void loadSuppliers()
  }, [hospitalId, selectedItem])

  // Sync manual trigger handler
  const handleTriggerSync = async () => {
    if (!hospitalId) return
    
    setIsSyncing(true)
    setSyncResult(null)

    const res = await triggerApplSync(hospitalId)

    if (res.error) {
      setSyncResult({ success: false, error: res.error })
    } else {
      setSyncResult({ success: true, data: res.data })
      void loadSyncStatus()
      void loadItems()
    }
    
    setIsSyncing(false)
  }

  // Format relative time helper
  const getRelativeTimeString = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Sekejap tadi'
    if (diffMins < 60) return `${diffMins} minit lepas`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} jam lepas`
    return date.toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 md:p-8 w-full space-y-8 text-slate-800">
      {/* Header Panel */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <Database className="w-6 h-6 text-teal-600 animate-pulse" />
              <span>APPL Drug Catalog (Lampiran B)</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Urus dan selaraskan inventori APPL secara automatik terus daripada jadual Kementerian Kesihatan Malaysia
            </p>
          </div>
          <div className="flex items-center gap-4 self-start sm:self-auto">
            {syncStatus && (
              <div className="hidden lg:flex flex-col items-end text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Kemas Kini Terakhir</span>
                <span className="text-slate-700 font-bold flex items-center gap-1 mt-0.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {getRelativeTimeString(syncStatus.synced_at)}
                </span>
              </div>
            )}
            <Button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold transition-all shadow-md gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyelaras...' : 'Selaras Sekarang'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Sync Log Alert Banner */}
      {syncResult && (
        <div className={`p-5 rounded-2xl border text-sm flex items-start gap-3 shadow-sm transition-all animate-fade-in ${
          syncResult.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {syncResult.success ? (
            <>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-emerald-900">Penyelarasan APPL Berjaya!</p>
                <p className="mt-1 text-emerald-700 leading-relaxed font-medium">
                  Berjaya membaca dan memproses baris jadual Lampiran B. 
                  <span className="font-mono ml-1 font-bold">
                    {syncResult.data?.drugs_upserted || 0} ubat dikemaskini
                  </span>, 
                  <span className="font-mono ml-1 font-bold">
                    {syncResult.data?.suppliers_upserted || 0} pembekal diluluskan
                  </span> dimasukkan.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900">Penyelarasan APPL Gagal</p>
                <p className="mt-0.5 text-rose-700 font-medium">{syncResult.error || 'Ralat tidak diketahui berlaku.'}</p>
              </div>
            </>
          )}
          <button onClick={() => setSyncResult(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft border-l-4 border-l-teal-500">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Jumlah Ubat APPL</span>
          <span className="block text-2xl font-black font-mono text-slate-800 mt-1">{total}</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft border-l-4 border-l-indigo-500">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Pembekal APPL Aktif</span>
          <span className="block text-2xl font-black font-mono text-slate-800 mt-1">
            {syncStatus?.suppliers_upserted || 98}
          </span>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft border-l-4 border-l-amber-500">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Penyelarasan Terakhir</span>
          <span className="block text-sm font-bold text-slate-800 mt-2 font-mono truncate">
            {syncStatus ? new Date(syncStatus.synced_at).toLocaleDateString('ms-MY') : 'Belum Pernah'}
          </span>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft border-l-4 border-l-emerald-500">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Sumber Tab</span>
          <span className="block text-sm font-bold text-slate-800 mt-2 font-mono">
            {syncStatus?.sheet_tab || 'Lampiran B'}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-soft">
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Carian</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              placeholder="Kod APPL, kod ubat atau nama ubat..."
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
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Status</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as any)} className="rounded-xl">
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </Select>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold font-mono py-3">
          <Filter className="w-3.5 h-3.5" />
          <span>{total} KOD APPL</span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
          <div>
            <p className="font-bold">Gagal memuatkan jadual APPL</p>
            <p className="mt-0.5 text-xs font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* APPL Item Table */}
      {!isLoading && !error && (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden">
          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50 border-b border-slate-100">
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Kod APPL</Table.Cell>
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Nama Ubat</Table.Cell>
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Bentuk</Table.Cell>
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">Pembungkusan</Table.Cell>
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500">MOQ</Table.Cell>
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-right">Harga (RM)</Table.Cell>
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-center">Status</Table.Cell>
                <Table.Cell as="th" className="py-4 font-bold text-xs uppercase text-slate-500 text-right">Tindakan</Table.Cell>
              </Table.Row>
            </Table.Header>
            <Table.Body className="divide-y divide-slate-100">
              {items.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={8} className="text-center text-sm text-slate-400 py-16 font-medium">
                    Tiada item APPL dijumpai. Klik 'Selaras Sekarang' untuk memuatkan dari Google Sheets.
                  </Table.Cell>
                </Table.Row>
              )}

              {items.map((item) => (
                <Table.Row key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <Table.Cell className="font-mono text-xs font-bold text-slate-700">
                    {item.drug_code}
                  </Table.Cell>
                  <Table.Cell className="text-sm font-black text-slate-800">
                    <div>{item.drug_name}</div>
                    {item.generic_name && item.generic_name !== item.drug_name && (
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{item.generic_name}</div>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-xs font-bold uppercase text-slate-400">
                    {item.dosage_form}
                  </Table.Cell>
                  <Table.Cell className="text-xs font-semibold text-slate-500">
                    {item.packaging_description || '—'}
                  </Table.Cell>
                  <Table.Cell className="text-xs font-bold text-slate-500 font-mono">
                    {item.moq || '1 Unit'}
                  </Table.Cell>
                  <Table.Cell className="text-sm text-slate-850 font-black text-right font-mono">
                    {item.price ? `RM ${item.price.toFixed(2)}` : '—'}
                  </Table.Cell>
                  <Table.Cell className="text-center">
                    <Badge variant={item.status === 'active' ? 'success' : 'secondary'}>
                      {item.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right py-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setSelectedItem(item)}
                      className="rounded-xl border-slate-200 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-all font-bold gap-1 px-3"
                    >
                      <span>Lihat Perincian</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-400">
                Menunjukkan halaman {page} dari {totalPages} ({total} item)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="rounded-xl border-slate-200"
                >
                  Sebelumnya
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="rounded-xl border-slate-200"
                >
                  Seterusnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item Detail Side-Drawer Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Perincian Katalog APPL & Pembekal Diluluskan"
        size="xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Summary Info */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Kod APPL</span>
                  <span className="text-sm font-bold text-slate-800 font-mono">{selectedItem.drug_code}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Bentuk Dos</span>
                  <span className="text-sm font-bold text-slate-800 uppercase">{selectedItem.dosage_form}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Harga Kontrak</span>
                  <span className="text-sm font-bold text-teal-600 font-mono">
                    {selectedItem.price ? `RM ${selectedItem.price.toFixed(2)}` : '—'}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Nama Ubat Penuh</span>
                  <span className="text-sm font-black text-slate-800">{selectedItem.drug_name}</span>
                </div>
                <div className="col-span-2 md:col-span-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Keterangan Pembungkusan</span>
                  <span className="text-sm font-bold text-slate-700">{selectedItem.packaging_description || '—'}</span>
                </div>
              </div>
            </div>

            {/* Approved Suppliers Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Senarai Pembekal Diluluskan (MOH Approved)</span>
                </h3>
                <Badge variant="info" className="font-mono">{approvedSuppliers.length} Approved</Badge>
              </div>

              {isLoadingSuppliers ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="sm" />
                </div>
              ) : approvedSuppliers.length === 0 ? (
                <div className="text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold">
                  Tiada pembekal kontrak diluluskan untuk kod ini.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {approvedSuppliers.map((supp) => (
                    <div key={supp.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-soft space-y-2.5 hover:border-slate-200 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase">Kontraktor / Pembekal</div>
                          <div className="text-sm font-black text-slate-800 mt-0.5">{supp.supplier_name}</div>
                        </div>
                        <Badge variant="success" className="font-mono uppercase text-[10px]">
                          {supp.procurement_scheme || 'SPPB'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-slate-50 text-xs">
                        <div>
                          <span className="text-slate-400 font-bold block">Jenama:</span>
                          <span className="text-slate-700 font-bold">{supp.brand_name || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">No. Pendaftaran (MAL):</span>
                          <span className="text-slate-750 font-bold font-mono">{supp.mal_mda_number || '—'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 font-bold block">Pengilang:</span>
                          <span className="text-slate-700 font-semibold">
                            {supp.manufacturer_name} ({supp.country_of_origin || 'Tempatan'})
                          </span>
                        </div>
                        {supp.notes && (
                          <div className="col-span-2 bg-slate-50 p-2 rounded text-[11px] text-slate-500 font-medium italic">
                            Catatan: {supp.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedItem(null)} className="rounded-xl border-slate-200 font-bold">
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default APPLInventoryPage

