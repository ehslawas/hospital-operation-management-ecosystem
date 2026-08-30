import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Search,
  ArrowLeft,
  Filter,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Building2
} from 'lucide-react'
import { getAllFormulariDrugs } from '../services/formulariService'
import { DrugEntry } from '../types/formulariTypes'
import { PrescriberBadge, PoisonBadge } from '../components/DrugBadge'
import { ROUTES } from '@/lib/constants'

export const DrugAlternativesPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const allDrugs = useMemo(() => getAllFormulariDrugs(), [])
  const drugsWithAlternatives = useMemo(() => {
    return allDrugs.filter(d => d.alternativeDrugs && d.alternativeDrugs.length > 0)
  }, [allDrugs])

  const filtered = useMemo(() => {
    return drugsWithAlternatives.filter(drug => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const matchMain = drug.genericName.toLowerCase().includes(q)
        const matchAlt = drug.alternativeDrugs.some(a => a.drugName.toLowerCase().includes(q) || a.reasonForChoice.toLowerCase().includes(q))
        if (!matchMain && !matchAlt) return false
      }
      return true
    })
  }, [drugsWithAlternatives, searchTerm])

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600" />
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl shadow-md flex-shrink-0">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <span>Matriks Ubat Alternatif & Penggantian Terapi</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Matriks Penggantian Ubat Berdaftar KKM Semasa Gangguan Bekalan, Kehabisan Kuota atau Isu Pembekal
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Matriks Alternatif</span>
        </button>
      </div>

      {/* Guidance Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Protokol Penggantian Terapi Farmasi Klinikal</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold leading-snug">
          Hirarki Pemilihan Ubat Pengganti (Therapeutic Substitution Hierarchy):
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <strong className="block text-purple-200 mb-1">1. Exact Substitute (Pengganti Tepat)</strong>
            <p className="text-slate-300 text-[11px]">Molekul generik sama dengan kekuatan atau formulasi berbeza (cth: vial 500mg x 2 vs 1g).</p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <strong className="block text-purple-200 mb-1">2. Class Equivalent (Setara Kelas)</strong>
            <p className="text-slate-300 text-[11px]">Ubat daripada kelas farmakologi yang sama dengan spektrum & profil efikasi serupa.</p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <strong className="block text-purple-200 mb-1">3. Alternative Second-Line (Lini Kedua)</strong>
            <p className="text-slate-300 text-[11px]">Pilihan kedua mengikut garis panduan rawatan klinikal (CPG / NAG 2024).</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ubat asal atau ubat pengganti (cth: Dobutamine, Morphine, Meropenem)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-purple-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Alternatives Matrix */}
      <div className="space-y-6">
        {filtered.map(drug => (
          <div
            key={drug.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5"
          >
            {/* Primary Drug Info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <PrescriberBadge category={drug.prescriberCategory} size="sm" />
                  <PoisonBadge poison={drug.poisonCategory} size="sm" />
                  <span className="text-xs text-slate-500 font-mono">ATC: {drug.atcCode}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{drug.genericName}</h3>
                <p className="text-xs text-slate-500">{drug.brandNames.join(' • ')} — Kelas: {drug.therapeuticClass}</p>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  drug.quota.isLowStock || drug.quota.isCriticalShortage
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Stok Semasa: {drug.quota.quotaRemaining} {drug.quota.unit} ({drug.quota.isLowStock ? 'STOK RENDAH' : 'STOK ADA'})
                </span>
              </div>
            </div>

            {/* Alternatives Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pilihan Penggantian Terapi ({drug.alternativeDrugs.length}):
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drug.alternativeDrugs.map((alt, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const target = allDrugs.find(d => d.id === alt.drugId)
                      if (target) navigate(`/formulari/drug/${target.id}`)
                    }}
                    className="p-4 bg-purple-50/50 hover:bg-purple-50 rounded-2xl border border-purple-200 hover:border-purple-400 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-bold text-slate-900">{alt.drugName}</strong>
                      <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-bold">
                        Kat {alt.prescriberCategory}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-purple-700 block">
                      {alt.therapeuticEquivalence}
                    </span>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Rasional Pemilihan: </strong>{alt.reasonForChoice}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-purple-100 text-xs">
                      <span className="text-emerald-700 font-bold">Status: {alt.stockStatus}</span>
                      <span className="text-purple-700 font-semibold">Buka Rekod Ubat &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 text-xs">
            Tiada ubat alternatif ditemui bagi kriteria carian.
          </div>
        )}
      </div>
    </div>
  )
}

export default DrugAlternativesPage
