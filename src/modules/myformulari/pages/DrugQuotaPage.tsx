import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingDown,
  Search,
  ArrowLeft,
  Filter,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  Building2,
  PackageCheck
} from 'lucide-react'
import { getAllFormulariDrugs } from '../services/formulariService'
import { QuotaProgressBar } from '../components/QuotaProgressBar'
import { PrescriberBadge, PoisonBadge } from '../components/DrugBadge'
import { ROUTES } from '@/lib/constants'

export const DrugQuotaPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'low' | 'stable'>('ALL')

  const allDrugs = useMemo(() => getAllFormulariDrugs(), [])

  const filteredDrugs = useMemo(() => {
    return allDrugs.filter(drug => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const matchName = drug.genericName.toLowerCase().includes(q)
        const matchBrand = drug.brandNames.some(b => b.toLowerCase().includes(q))
        if (!matchName && !matchBrand) return false
      }

      if (statusFilter === 'low' && !drug.quota.isLowStock && !drug.quota.isCriticalShortage) return false
      if (statusFilter === 'stable' && (drug.quota.isLowStock || drug.quota.isCriticalShortage)) return false

      return true
    })
  }, [allDrugs, searchTerm, statusFilter])

  const lowStockCount = allDrugs.filter(d => d.quota.isLowStock || d.quota.isCriticalShortage).length
  const totalMonthlyQuota = allDrugs.reduce((acc, curr) => acc + curr.quota.monthlyQuota, 0)
  const totalUsedQuota = allDrugs.reduce((acc, curr) => acc + curr.quota.quotaUsed, 0)
  const overallUsedPct = Math.round((totalUsedQuota / Math.max(1, totalMonthlyQuota)) * 100)

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600" />
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl shadow-md flex-shrink-0">
            <TrendingDown className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <span>Pemantauan Kuota & Amaran Stok Ubat</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Pengesanan Baki Kuota Bulanan, Amaran Stok Rendah & Cadangan Ubat Pengganti
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Laporan Kuota</span>
        </button>
      </div>

      {/* Quota Summary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kadar Penggunaan Kuota Hospital</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{overallUsedPct}%</div>
          <span className="text-xs text-slate-500">
            {totalUsedQuota.toLocaleString()} unit digunakan daripada kuota {totalMonthlyQuota.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Ubat Di Bawah Paras Ambang</span>
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-700">{lowStockCount} Item</div>
          <span className="text-xs text-rose-600">Perlu tindakan perolehan segera / ubat alternatif</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Bekalan Keseluruhan</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">Terkawal</div>
          <span className="text-xs text-slate-500">Buffer stock wad & stor utama mencukupi</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari status kuota mengikut nama ubat..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Semua Status Kuota</option>
            <option value="low">Stok Rendah / Habis Sahaja</option>
            <option value="stable">Kuota Stabil Sahaja</option>
          </select>
        </div>
      </div>

      {/* Quota Drug Cards Listing */}
      <div className="space-y-4">
        {filteredDrugs.map(drug => (
          <div
            key={drug.id}
            className={`bg-white rounded-3xl border p-6 transition-all shadow-xs hover:shadow-md space-y-4 ${
              drug.quota.isLowStock || drug.quota.isCriticalShortage
                ? 'border-rose-300 bg-rose-50/20'
                : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <PrescriberBadge category={drug.prescriberCategory} size="sm" />
                  <PoisonBadge poison={drug.poisonCategory} size="sm" />
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                    Skim: {drug.skimPerolehan}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {drug.genericName}
                </h3>
                <p className="text-xs text-slate-500">
                  {drug.brandNames.join(' • ')} — Kekuatan: {drug.strengths.join(', ')}
                </p>
              </div>

              {/* Quota Bar */}
              <div className="lg:w-96">
                <QuotaProgressBar
                  monthlyQuota={drug.quota.monthlyQuota}
                  quotaUsed={drug.quota.quotaUsed}
                  quotaRemaining={drug.quota.quotaRemaining}
                  unit={drug.quota.unit}
                  lowStockThreshold={drug.quota.lowStockThreshold}
                  isLowStock={drug.quota.isLowStock}
                  isCriticalShortage={drug.quota.isCriticalShortage}
                  estimatedRunOutDays={drug.quota.estimatedRunOutDays}
                />
              </div>
            </div>

            {/* Alternatives recommendations if low stock */}
            {(drug.quota.isLowStock || drug.quota.isCriticalShortage) && drug.alternativeDrugs.length > 0 && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Cadangan Ubat Alternatif yang Berdaftar & Ada Stok:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {drug.alternativeDrugs.map((alt, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(`/formulari/drug/${alt.drugId}`)}
                      className="p-2.5 bg-white rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <strong className="text-slate-900 block">{alt.drugName}</strong>
                        <span className="text-[10px] text-slate-500">{alt.therapeuticEquivalence}</span>
                      </div>
                      <span className="text-violet-600 font-bold text-[11px] flex items-center gap-0.5">
                        Pilih &rarr;
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Tarikh Tambah Stok Terakhir: <strong className="text-slate-700">{drug.quota.lastRestockedDate}</strong></span>
              <button
                onClick={() => navigate(`/formulari/drug/${drug.id}`)}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
              >
                <span>Lihat Maklumat Ubat Penuh</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DrugQuotaPage
