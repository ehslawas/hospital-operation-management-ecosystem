// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  AlertTriangle, 
  Package, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  ShoppingBag, 
  ArrowRight, 
  Clock, 
  Layers, 
  Info,
  Calendar,
  AlertOctagon,
  FileText,
  QrCode,
  Database
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Button } from '@/components/ui'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { 
  getStockLevelSummary, 
  getNearExpiryItems, 
  getSlowMovingItems, 
  getStockTransactions,
  getFastMovingItems
} from '../../services/inventoryService'
import type { StockLevelSummary, ExpiryItem, SlowMovingItem, StockTransaction } from '@/types/pharmacy'

export const InventoryOverviewPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { language, t } = useLanguage()
  const hospitalId = user?.hospital_id

  // State lists
  const [items, setItems] = useState<StockLevelSummary[]>([])
  const [nearExpiry, setNearExpiry] = useState<ExpiryItem[]>([])
  const [slowMoving, setSlowMoving] = useState<SlowMovingItem[]>([])
  const [fastMoving, setFastMoving] = useState<any[]>([])
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  
  // UI States
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'drug' | 'non_drug' | 'low_stock' | 'near_expiry' | 'slow_moving' | 'fast_moving'>('low_stock')

  // Rollup Metrics
  const [metrics, setMetrics] = useState({
    totalItems: 0,
    lowStockCount: 0,
    nearExpiryCount: 0,
    slowMovingCount: 0,
    fastMovingCount: 0,
  })

  // Rolling Average Monthly Consumption (AMC) map
  const [amcMap, setAmcMap] = useState<Map<string, number>>(new Map())

  // Load dashboard data
  useEffect(() => {
    if (!hospitalId) return

    const loadDashboardData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [summaryRes, expiryRes, slowRes, fastRes, txnRes] = await Promise.all([
          getStockLevelSummary(hospitalId),
          getNearExpiryItems(hospitalId, 180), // near expiry within 180 days (less than 6 months)
          getSlowMovingItems(hospitalId, 90),
          getFastMovingItems(hospitalId, 90),
          getStockTransactions(hospitalId, { transaction_type: 'issue' })
        ])

        const summaryData = summaryRes.data || []
        const expiryData = expiryRes.data || []
        const slowData = slowRes.data || []
        const fastData = fastRes.data || []
        const txnData = txnRes.data || []

        setItems(summaryData)
        setNearExpiry(expiryData)
        setSlowMoving(slowData)
        setFastMoving(fastData)
        setTransactions(txnData)

        // Calculate rolling AMC for each item based on last 90 days of issue transactions
        const localAmcMap = new Map<string, number>()
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        txnData.forEach((t: any) => {
          const txnDate = new Date(t.transaction_date || t.created_at)
          if (txnDate >= ninetyDaysAgo && t.transaction_type === 'issue') {
            const key = t.item_id
            const currentQty = localAmcMap.get(key) || 0
            localAmcMap.set(key, currentQty + (t.quantity || 0))
          }
        })

        // Divide by 3 to get monthly average
        const amcDividedMap = new Map<string, number>()
        localAmcMap.forEach((totalQty, itemId) => {
          amcDividedMap.set(itemId, parseFloat((totalQty / 3).toFixed(1)))
        })
        setAmcMap(amcDividedMap)

        // Calculate item-focused unique counts
        const total = summaryData.length
        
        // Low stock: items below min_stock, or status is low_stock/critical/out_of_stock
        const low = summaryData.filter(i => 
          i.status === 'low_stock' || 
          i.status === 'critical' || 
          i.status === 'out_of_stock' || 
          i.current_stock <= (i.min_stock || 0)
        ).length

        // Near Expiry: count of unique items expiring in < 180 days
        const nearExpiryUniqueCount = new Set(expiryData.map(e => e.item_id)).size

        // Slow Moving: count of unique items matching slowMoving list
        const slowCount = slowData.length

        // Fast Moving: count of unique items matching fastMoving list
        const fastCount = fastData.length

        setMetrics({
          totalItems: total,
          lowStockCount: low,
          nearExpiryCount: nearExpiryUniqueCount,
          slowMovingCount: slowCount,
          fastMovingCount: fastCount
        })

      } catch (err) {
        console.error('Error loading dashboard stats:', err)
        setError('Gagal memuatkan data ringkasan inventori.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboardData()
  }, [hospitalId])

  const renderStatusBadge = (status: StockLevelSummary['status']) => {
    const map: Record<
      StockLevelSummary['status'],
      { color: 'success' | 'warning' | 'error' | 'secondary'; labelEn: string; labelMs: string }
    > = {
      in_stock: { color: 'success', labelEn: 'In Stock', labelMs: 'Dalam Stok' },
      low_stock: { color: 'warning', labelEn: 'Low Stock', labelMs: 'Kekurangan' },
      critical: { color: 'error', labelEn: 'Critical', labelMs: 'Kritikal' },
      out_of_stock: { color: 'secondary', labelEn: 'Out of Stock', labelMs: 'Tiada Stok' },
    }
    const cfg = map[status] || { color: 'secondary', labelEn: status, labelMs: status }
    return <Badge variant={cfg.color}>{language === 'ms' ? cfg.labelMs : cfg.labelEn}</Badge>
  }

  // Filter items based on active tab and search query
  const getFilteredItems = () => {
    let filtered = [...items]

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(i => 
        i.item_code.toLowerCase().includes(q) || 
        i.item_name.toLowerCase().includes(q)
      )
    }

    if (activeTab === 'drug') {
      filtered = filtered.filter(i => i.item_type === 'drug')
    } else if (activeTab === 'non_drug') {
      filtered = filtered.filter(i => i.item_type === 'non_drug')
    } else if (activeTab === 'low_stock') {
      filtered = filtered.filter(i => 
        i.status === 'low_stock' || 
        i.status === 'critical' || 
        i.status === 'out_of_stock' || 
        i.current_stock <= (i.min_stock || 0)
      )
    } else if (activeTab === 'near_expiry') {
      const expiringItemIds = new Set(nearExpiry.map(e => e.item_id))
      filtered = filtered.filter(i => expiringItemIds.has(i.item_id))
    } else if (activeTab === 'slow_moving') {
      const slowItemIds = new Set(slowMoving.map(s => s.item_id))
      filtered = filtered.filter(i => slowItemIds.has(i.item_id))
    } else if (activeTab === 'fast_moving') {
      const fastItemIds = new Set(fastMoving.map(f => f.item_id))
      filtered = filtered.filter(i => fastItemIds.has(i.item_id))
    }

    return filtered
  }

  // Calculate recommended purchases based on Min/Max levels
  const getRecommendedPurchases = () => {
    return items
      .filter(i => i.status === 'low_stock' || i.status === 'critical' || i.current_stock <= i.min_stock)
      .map(i => {
        const minVal = i.min_stock || 0
        const currentVal = i.current_stock || 0
        const maxVal = i.max_stock || (minVal * 3) // estimate max if undefined
        const suggestedQty = Math.max(0, maxVal - currentVal)
        
        // Find if this item has near expiry batches
        const nearExpiryBatch = nearExpiry.find(e => e.item_id === i.item_id)
        
        // Find if this item is fast moving
        const fastMovingItem = fastMoving.find(f => f.item_id === i.item_id)

        // Formulate reason
        let reason = ''
        if (currentVal === 0) {
          reason = language === 'ms' ? 'Tiada baki stok dalam simpanan' : 'No stock in storage'
        } else {
          reason = language === 'ms'
            ? `Baki stok semasa (${currentVal}) di bawah paras minimum (${minVal})`
            : `Current stock balance (${currentVal}) is below minimum level (${minVal})`
        }

        if (nearExpiryBatch) {
          reason += language === 'ms'
            ? ` • Batch (${nearExpiryBatch.batch_number}) hampir luput (${nearExpiryBatch.days_to_expiry} hari)`
            : ` • Batch (${nearExpiryBatch.batch_number}) near expiry (${nearExpiryBatch.days_to_expiry} days)`
        }
        if (fastMovingItem) {
          reason += language === 'ms'
            ? ` • Penggunaan tinggi (${fastMovingItem.usage_per_month} unit/bulan)`
            : ` • High consumption (${fastMovingItem.usage_per_month} units/month)`
        }
        
        return {
          ...i,
          suggestedQty,
          reason,
          isCritical: currentVal === 0 || i.status === 'critical',
          isNearExpiry: !!nearExpiryBatch,
          isFastMoving: !!fastMovingItem
        }
      })
      .filter(i => i.suggestedQty > 0)
      .sort((a, b) => {
        // Sort critical first
        if (a.isCritical && !b.isCritical) return -1
        if (!a.isCritical && b.isCritical) return 1
        // Then sort near expiry
        if (a.isNearExpiry && !b.isNearExpiry) return -1
        if (!a.isNearExpiry && b.isNearExpiry) return 1
        // Then sort suggestedQty descending
        return b.suggestedQty - a.suggestedQty
      })
      .slice(0, 5) // Show top 5 urgent purchases
  }

  const filteredItemsList = getFilteredItems()
  const recommendedPurchases = getRecommendedPurchases()

  return (
    <div className="p-6 md:p-8 space-y-8 text-slate-800">
      
      {/* LUXURY EXECUTIVE HEADER BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px] uppercase tracking-wider font-bold">
                  MyInventory Ecosystem Portal
                </Badge>
                <span className="text-xs text-slate-400 font-mono">{language === 'ms' ? 'Fasiliti Kesihatan KKM' : 'MOH Health Facility'}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <Package className="w-7 h-7 text-teal-400" />
                <span>{language === 'ms' ? 'Inventori Stor Farmasi (MyInventory)' : 'Pharmacy Store Inventory (MyInventory)'}</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                {language === 'ms' 
                  ? 'Paparan ekosistem inventori masa-nyata bagi bekalan ubat dan bukan ubat mengikut standard Tatacara Pengurusan Stor KKM.'
                  : 'Real-time inventory ecosystem view for drug and non-drug supplies following MOH Store Management Procedures standards.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                onClick={() => navigate('/pharmacy/inventory/ledger?openScan=true')}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-2xl font-bold text-xs gap-1.5 px-4 py-2.5 shadow-lg"
              >
                <QrCode className="w-4 h-4" />
                {language === 'ms' ? 'Imbas & Transaksi QR' : 'QR Scan & Transaction'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/pharmacy/inventory/drugs')}
                className="rounded-2xl border-slate-700 text-slate-200 hover:bg-slate-800 font-bold text-xs px-3.5 py-2.5"
              >
                {language === 'ms' ? 'Katalog Ubat' : 'Drug Catalog'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/pharmacy/inventory/non-drugs')}
                className="rounded-2xl border-slate-700 text-slate-200 hover:bg-slate-800 font-bold text-xs px-3.5 py-2.5"
              >
                {language === 'ms' ? 'Bukan Ubat' : 'Non-Drug'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid Layout (Luxury theme with colored left borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Items */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm border-l-4 border-l-slate-500 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'ms' ? 'JUMLAH ITEM' : 'TOTAL ITEMS'}</span>
            <span className="text-2xl font-black text-slate-800">{metrics.totalItems}</span>
          </div>
          <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Near Expiry */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm border-l-4 border-l-orange-500 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'ms' ? 'HAMPIR LUPUT (< 6B)' : 'NEAR EXPIRY (< 6M)'}</span>
            <span className="text-2xl font-black text-orange-600">{metrics.nearExpiryCount}</span>
          </div>
          <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm border-l-4 border-l-amber-500 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'ms' ? 'KURANG STOK' : 'LOW STOCK'}</span>
            <span className="text-2xl font-black text-amber-600">{metrics.lowStockCount}</span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Slow Moving */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm border-l-4 border-l-indigo-500 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'ms' ? 'LAMBAT BERGERAK' : 'SLOW MOVING'}</span>
            <span className="text-2xl font-black text-indigo-600">{metrics.slowMovingCount}</span>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="w-5 h-5 rotate-180" />
          </div>
        </div>

        {/* Fast Moving */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm border-l-4 border-l-teal-500 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'ms' ? 'CEPAT BERGERAK' : 'FAST MOVING'}</span>
            <span className="text-2xl font-black text-teal-600">{metrics.fastMovingCount}</span>
          </div>
          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Content Sections: List & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Ledger & Filters (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-soft p-6 space-y-6">
            
            {/* Header + Tabs + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-5">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-400" />
                <span>{language === 'ms' ? 'Kedudukan Stok Semasa' : 'Current Stock Position'}</span>
              </h3>
              
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder={language === 'ms' ? 'Cari kod atau nama...' : 'Search code or name...'}
                  className="pl-9 rounded-xl text-xs py-1.5"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'low_stock', labelEn: 'Low Stock', labelMs: 'Kurang Stok' },
                { id: 'near_expiry', labelEn: 'Near Expiry', labelMs: 'Hampir Luput' },
                { id: 'slow_moving', labelEn: 'Slow Moving', labelMs: 'Lambat Bergerak' },
                { id: 'fast_moving', labelEn: 'Fast Moving', labelMs: 'Cepat Bergerak' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                    activeTab === tab.id 
                      ? 'bg-slate-800 border-slate-800 text-white shadow-sm' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-100'
                  }`}
                >
                  {language === 'ms' ? tab.labelMs : tab.labelEn}
                </button>
              ))}
            </div>

            {/* Loading / Error States */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            )}

            {!isLoading && error && (
              <div className="p-6 text-center text-rose-600 text-xs font-bold bg-rose-50 rounded-2xl border border-rose-100">
                {error}
              </div>
            )}

            {/* Table Listing */}
            {!isLoading && !error && (
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <Table>
                  <Table.Header>
                    <Table.Row className="bg-slate-50/50">
                      <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5">{language === 'ms' ? 'KOD' : 'CODE'}</Table.Cell>
                      <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5">{language === 'ms' ? 'NAMA ITEM' : 'ITEM NAME'}</Table.Cell>
                      <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5 text-right">{language === 'ms' ? 'BAKI SEMASA' : 'CURRENT BALANCE'}</Table.Cell>
                      <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5 text-right font-mono">AMC</Table.Cell>
                      <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5 text-right font-mono">MOS</Table.Cell>
                      <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5 text-center">STATUS</Table.Cell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body className="divide-y divide-slate-100">
                    {filteredItemsList.length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={6} className="text-center text-slate-400 py-12 text-sm font-medium">
                          {language === 'ms' 
                            ? 'Tiada item inventori ditemui sepadan dengan tapisan anda.'
                            : 'No inventory items found matching your filters.'}
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      filteredItemsList.map(item => {
                        const amcVal = amcMap.get(item.item_id) || 0
                        const mosVal = amcVal > 0 ? parseFloat((item.current_stock / amcVal).toFixed(1)) : null
                        
                        return (
                          <Table.Row key={`${item.item_type}-${item.item_id}`} className="hover:bg-slate-50/30 transition-colors">
                            <Table.Cell className="font-mono text-xs font-bold text-slate-500">{item.item_code}</Table.Cell>
                            <Table.Cell className="py-3 text-sm font-black text-slate-800">
                              <div className="flex flex-col">
                                <span>{item.item_name}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                                  {item.item_type} • {item.unit_of_measure}
                                </span>
                              </div>
                            </Table.Cell>
                            <Table.Cell className="text-right font-mono font-black text-sm text-slate-700">
                              {item.current_stock}
                            </Table.Cell>
                            <Table.Cell className="text-right font-mono text-xs text-slate-500 font-bold">
                              {amcVal > 0 ? `${amcVal}/${language === 'ms' ? 'bln' : 'mo'}` : `0/${language === 'ms' ? 'bln' : 'mo'}`}
                            </Table.Cell>
                            <Table.Cell className="text-right font-mono text-xs font-black">
                              {mosVal !== null ? (
                                <span className={mosVal < 1.0 ? 'text-rose-600' : mosVal < 2.0 ? 'text-amber-600' : 'text-emerald-600'}>
                                  {mosVal} {language === 'ms' ? 'bln' : 'mo'}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </Table.Cell>
                            <Table.Cell className="text-center">
                              {renderStatusBadge(item.status)}
                            </Table.Cell>
                          </Table.Row>
                        )
                      })
                    )}
                  </Table.Body>
                </Table>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Alert Lists & Procurement suggestions (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          

          {/* Recommended Purchases (Pembelian Disyorkan) */}
          <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-150 rounded-3xl shadow-md p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" />
            
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShoppingBag className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>{language === 'ms' ? 'Saranan Pembelian' : 'Purchase Suggestions'}</span>
              <Badge variant="danger" className="ml-auto text-[9px] font-black uppercase">
                {language === 'ms' ? 'Tindakan Segera' : 'Urgent Action'}
              </Badge>
            </h4>
            
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              {language === 'ms' 
                ? 'Senarai item di bawah paras keselamatan minimum. Segera mulakan perolehan pembekal untuk menjamin kesinambungan penjagaan pesakit.'
                : 'List of items below minimum safety stock. Initiate supplier procurement immediately to ensure patient care continuity.'}
            </p>
            
            {recommendedPurchases.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                {language === 'ms' 
                  ? 'Stok mencukupi. Tiada saranan pembelian baru buat masa ini.'
                  : 'Sufficient stock. No purchase suggestions at this time.'}
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {recommendedPurchases.map(p => (
                  <div key={`${p.item_type}-${p.item_id}`} className="bg-white border border-slate-100 rounded-2xl p-3.5 space-y-2 shadow-soft hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 max-w-[70%]">
                        <span className="font-black text-slate-800 text-[11px] block leading-tight">{p.item_name}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.isCritical ? (
                            <Badge variant="danger" className="text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-wide">
                              {language === 'ms' ? 'Kritikal' : 'Critical'}
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-wide">
                              {language === 'ms' ? 'Stok Rendah' : 'Low Stock'}
                            </Badge>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {language === 'ms' ? 'Baki' : 'Bal'}: {p.current_stock} / Min: {p.min_stock}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">
                          {language === 'ms' ? 'Saran Beli' : 'Suggested Buy'}
                        </span>
                        <span className="font-mono font-black text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg block mt-0.5">+{p.suggestedQty} unit</span>
                      </div>
                    </div>
                    
                    <div className="text-[9.5px] text-slate-500 bg-slate-50 p-2 rounded-xl font-medium leading-normal border border-slate-100/50 flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{p.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}

export default InventoryOverviewPage
