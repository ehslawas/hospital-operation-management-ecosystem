// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingDown, DollarSign, Clock, Sparkles, Filter, RefreshCw, ShieldCheck, Package } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui'
import { getSlowMovingItems } from '@/services/pharmacy/inventoryService'
import type { SlowMovingItem } from '@/types/pharmacy'
import { cn, formatCurrency } from '@/lib/utils'

export const SlowMovingPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [items, setItems] = useState<SlowMovingItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [daysSinceMovement, setDaysSinceMovement] = useState(90)

  const loadData = async () => {
    if (!hospitalId) return
    setIsLoading(true)
    setError(null)

    const res = await getSlowMovingItems(hospitalId, daysSinceMovement)

    if (res.error) {
      setError(res.error)
      setItems([])
    } else {
      setItems(res.data || [])
    }

    setIsLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [hospitalId, daysSinceMovement])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const totalValue = items.reduce((sum, item) => sum + (item.total_value || 0), 0)
  const avgAge = items.length > 0
    ? Math.round(items.reduce((sum, i) => sum + (i.days_since_movement || 0), 0) / items.length)
    : 0

  const renderAgeBadge = (days: number) => {
    if (days >= 180) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.15)] tabular-nums">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 animate-pulse" />
          {days} hari
        </span>
      )
    }
    if (days >= 120) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)] tabular-nums">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
          {days} hari
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_10px_rgba(56,189,248,0.15)] tabular-nums">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5" />
        {days} hari
      </span>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-slate-950 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] flex-shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                Barangan Lambat Bergerak
              </h1>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                Analisis Stok
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Kenalpasti item tanpa pergerakan untuk mengoptimumkan paras stok dan mengurangkan kos pegangan.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 self-start sm:self-center relative z-10">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 shadow-inner">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Tempoh Tiada Pergerakan:</span>
            <select
              value={daysSinceMovement.toString()}
              onChange={(e) => setDaysSinceMovement(Number(e.target.value))}
              className="bg-transparent font-bold text-xs text-amber-300 focus:outline-none cursor-pointer"
            >
              <option value="30" className="bg-slate-900 text-white">30 hari +</option>
              <option value="60" className="bg-slate-900 text-white">60 hari +</option>
              <option value="90" className="bg-slate-900 text-white">90 hari +</option>
              <option value="120" className="bg-slate-900 text-white">120 hari +</option>
              <option value="180" className="bg-slate-900 text-white">180 hari +</option>
            </select>
          </div>

          <button
            onClick={() => void loadData()}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-200 shadow-md"
            title="Muat Semula Data"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-amber-400")} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Slow Moving Count */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-orange-500/20 hover:border-orange-500/40 rounded-2xl p-5 shadow-xl transition-all group"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Jumlah Item Lambat Bergerak
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.15)]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tabular-nums">
              {items.length}
            </span>
            <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
              &ge; {daysSinceMovement} Hari
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Item tanpa transaksi rekod terkini</p>
        </motion.div>

        {/* Card 2: Total Value at Risk */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition-all group"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Nilai Berisiko (Total Risk)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-300 tabular-nums">
              {formatCurrency(totalValue)}
            </span>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              MYR
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Jumlah peruntukan terikat dalam item pasif</p>
        </motion.div>

        {/* Card 3: Average Idle Age */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-sky-500/20 hover:border-sky-500/40 rounded-2xl p-5 shadow-xl transition-all group"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Purata Umur Pasif
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.15)]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-sky-300 tabular-nums">
              {avgAge} <span className="text-lg font-bold text-slate-500">hari</span>
            </span>
            <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
              Purata
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Masa purata sejak pergerakan keluar/masuk terakhir</p>
        </motion.div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl">
          <Spinner size="lg" className="text-amber-400 mb-3" />
          <p className="text-sm font-semibold text-slate-300">Memuatkan data barangan lambat bergerak...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300 shadow-xl">
          <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold">Gagal memuatkan rekod stok lambat bergerak</p>
            <p className="mt-1 text-xs text-rose-400">{error}</p>
          </div>
        </div>
      )}

      {/* Table Section */}
      {!isLoading && !error && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                Senarai Item Pasif ({items.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Disaring mengikut tempoh &ge; {daysSinceMovement} Hari
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-3.5 px-4 pl-6">Kod Item</th>
                  <th className="py-3.5 px-4">Nama Item</th>
                  <th className="py-3.5 px-4">Jenis</th>
                  <th className="py-3.5 px-4 text-right">Stok Semasa</th>
                  <th className="py-3.5 px-4 text-right">Nilai Unit</th>
                  <th className="py-3.5 px-4 text-right">Jumlah Nilai</th>
                  <th className="py-3.5 px-4">Transaksi Terakhir</th>
                  <th className="py-3.5 px-4 pr-6 text-center">Tempoh Pasif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 px-4 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight">
                            Tiada Item Lambat Bergerak Dikesan
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Semua item inventori mempunyai pergerakan stok aktif dalam tempoh {daysSinceMovement} hari lepas. Tahap perputaran stok berada dalam keadaan optimum.
                          </p>
                        </div>
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => setDaysSinceMovement(30)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                          >
                            Semak Tempoh 30 Hari
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr 
                      key={item.item_id} 
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-4 px-4 pl-6 font-mono text-xs font-bold text-slate-300">
                        {item.item_code}
                      </td>
                      <td className="py-4 px-4 font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {item.item_name}
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider",
                          item.item_type === 'drug'
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        )}>
                          {item.item_type === 'drug' ? 'Ubat' : 'Bukan Ubat'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-white tabular-nums">
                        {item.current_stock?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-slate-400 tabular-nums text-xs">
                        {formatCurrency(item.unit_value)}
                      </td>
                      <td className="py-4 px-4 text-right font-extrabold text-amber-400 tabular-nums">
                        {formatCurrency(item.total_value)}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400 font-medium">
                        {formatDate(item.last_movement_date)}
                      </td>
                      <td className="py-4 px-4 pr-6 text-center">
                        {renderAgeBadge(item.days_since_movement)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations Panel */}
      {!isLoading && !error && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Cadangan Tindakan Pengurusan Stok
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Langkah pengurusan inventori proaktif mengikut standard KKM:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
                <div className="flex items-start gap-2 bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  <span className="text-slate-300">
                    <strong className="text-white">Pinjaman Inter-Fasiliti:</strong> Pindahkan item pasif 180+ hari ke hospital/klinik daerah yang mempunyai kadar penggunaan lebih tinggi.
                  </span>
                </div>
                <div className="flex items-start gap-2 bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0 shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
                  <span className="text-slate-300">
                    <strong className="text-white">Pelarasan Reorder Level:</strong> Semak semula tahap stok minimum dan kuantiti Pesanan Pembelian (PO) akan datang.
                  </span>
                </div>
                <div className="flex items-start gap-2 bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0 shadow-[0_0_6px_rgba(192,132,252,0.8)]" />
                  <span className="text-slate-300">
                    <strong className="text-white">Kerjasama Klinikal:</strong> Maklumkan kepada pakar perubatan & wad untuk mengutamakan preskripsi stok sedia ada.
                  </span>
                </div>
                <div className="flex items-start gap-2 bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0 shadow-[0_0_6px_rgba(251,113,133,0.8)]" />
                  <span className="text-slate-300">
                    <strong className="text-white">Semakan Pelupusan/Pulangan:</strong> Sediakan dokumentasi KEW.PS bagi stok terjejas sebelum melepasi tarikh luput.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SlowMovingPage
