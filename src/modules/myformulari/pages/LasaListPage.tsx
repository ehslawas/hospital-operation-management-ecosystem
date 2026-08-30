import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Search,
  ArrowLeft,
  ShieldCheck,
  Printer,
  ChevronRight,
  Sparkles,
  Layers,
  CheckCircle2,
  Info
} from 'lucide-react'
import { getAllFormulariDrugs } from '../services/formulariService'
import { TallManLettering } from '../components/TallManLettering'
import { LASABadge } from '../components/DrugBadge'
import { ROUTES } from '@/lib/constants'

export const LasaListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [confusionFilter, setConfusionFilter] = useState<'ALL' | 'look-alike' | 'sound-alike' | 'both'>('ALL')

  const allDrugs = useMemo(() => getAllFormulariDrugs(), [])
  const lasaDrugs = useMemo(() => allDrugs.filter(d => d.isLASA && d.lasaPairs && d.lasaPairs.length > 0), [allDrugs])

  // Extract all LASA pairs as flat list
  const allPairs = useMemo(() => {
    const list: {
      drugId: string
      genericName: string
      tallManThis: string
      tallManOther: string
      confusedWith: string
      confusionType: 'look-alike' | 'sound-alike' | 'both'
      clinicalRiskWarning: string
      separationStrategy: string
      therapeuticClass: string
    }[] = []

    lasaDrugs.forEach(drug => {
      drug.lasaPairs?.forEach(p => {
        list.push({
          drugId: drug.id,
          genericName: drug.genericName,
          tallManThis: p.tallManThis,
          tallManOther: p.tallManOther,
          confusedWith: p.confusedWith,
          confusionType: p.confusionType,
          clinicalRiskWarning: p.clinicalRiskWarning,
          separationStrategy: p.separationStrategy,
          therapeuticClass: drug.therapeuticClass
        })
      })
    })

    return list
  }, [lasaDrugs])

  const filteredPairs = useMemo(() => {
    return allPairs.filter(pair => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const matchThis = pair.tallManThis.toLowerCase().includes(q)
        const matchOther = pair.tallManOther.toLowerCase().includes(q)
        const matchWarning = pair.clinicalRiskWarning.toLowerCase().includes(q)
        if (!matchThis && !matchOther && !matchWarning) return false
      }

      if (confusionFilter !== 'ALL' && pair.confusionType !== confusionFilter) return false

      return true
    })
  }, [allPairs, searchTerm, confusionFilter])

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-md flex-shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <span>Daftar Ubat LASA & Panduan TALL-Man</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Pencegahan Ralat Pengubatan Look-Alike Sound-Alike Selaras Garis Panduan Keselamatan KKM
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Panduan LASA Wad</span>
        </button>
      </div>

      {/* Educational Banner on TALL-Man */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-amber-100 text-xs font-bold uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>Kaedah TALL-Man Lettering KKM</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold leading-snug">
          Mengapa Huruf Besar (TALL-Man) Diwajibkan untuk Ubat Serupa Nama?
        </h2>

        <p className="text-xs sm:text-sm text-amber-50 leading-relaxed max-w-4xl">
          TALL-Man Lettering menggunakan gabungan huruf besar dan kecil untuk menyerlahkan perbezaan ejaan antara ubat yang bunyinya hampir sama atau rupanya seakan-akan (cth: <strong>DOBUTamine</strong> vs <strong>DOPAmine</strong>). Kaedah ini dibuktikan mengurangkan kadar kesilapan mendispens dan mempreskripsi sehingga 70%.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
            <span className="text-[11px] font-bold block mb-0.5 text-amber-100">1. Label & Bekas Ubat</span>
            <span className="text-xs">Wajib dicetak dengan TALL-man pada stiker rak dan label wad.</span>
          </div>

          <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
            <span className="text-[11px] font-bold block mb-0.5 text-amber-100">2. Pengasingan Fizikal</span>
            <span className="text-xs">Pasangan LASA dilarang diletakkan bersebelahan di rak atau troli kecemasan.</span>
          </div>

          <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
            <span className="text-[11px] font-bold block mb-0.5 text-amber-100">3. Preskripsi Digital / Tulisan</span>
            <span className="text-xs">Nama generik penuh dengan kekuatan sediaan wajib dinyatakan dengan jelas.</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pasangan LASA mengikut nama ubat atau risiko klinikal..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:bg-white"
            />
          </div>

          <select
            value={confusionFilter}
            onChange={e => setConfusionFilter(e.target.value as any)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Semua Jenis Kekeliruan</option>
            <option value="both">Look-Alike & Sound-Alike (Keduanya)</option>
            <option value="look-alike">Look-Alike Sahaja (Rupa Serupa)</option>
            <option value="sound-alike">Sound-Alike Sahaja (Bunyi Serupa)</option>
          </select>
        </div>
      </div>

      {/* LASA Pairs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        {filteredPairs.map((pair, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl border border-amber-200 hover:border-amber-400 transition-all p-6 shadow-xs hover:shadow-md space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Pair Comparison Display */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                    Kekeliruan: {pair.confusionType}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">{pair.therapeuticClass}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                  <div className="p-3 bg-white rounded-xl border border-amber-300 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Ubat 1:</span>
                    <div className="text-base font-extrabold text-slate-900">
                      <TallManLettering name={pair.tallManThis} />
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-300 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Ubat 2:</span>
                    <div className="text-base font-extrabold text-slate-900">
                      <TallManLettering name={pair.tallManOther} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Risk Warning */}
              <div className="text-xs space-y-1">
                <strong className="text-slate-900 block font-bold">Risiko & Bahaya Klinikal:</strong>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {pair.clinicalRiskWarning}
                </p>
              </div>

              {/* Separation Strategy */}
              <div className="text-xs space-y-1">
                <strong className="text-amber-900 block font-bold">SOP Pengasingan Wad / Farmasi:</strong>
                <p className="text-amber-900 bg-amber-50/80 p-3 rounded-xl border border-amber-200 leading-relaxed font-medium">
                  {pair.separationStrategy}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Pangkalan Data Keselamatan Ubat Lawas</span>
              <button
                onClick={() => navigate(`/formulari/drug/${pair.drugId}`)}
                className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
              >
                <span>Buka Kad Ubat</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredPairs.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 text-xs">
            Tiada pasangan LASA ditemui bagi kriteria pilihan.
          </div>
        )}
      </div>
    </div>
  )
}

export default LasaListPage
