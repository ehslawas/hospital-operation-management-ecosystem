import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Droplets,
  Search,
  ArrowLeft,
  Filter,
  Activity,
  Printer,
  ChevronRight,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react'
import { getAllFormulariDrugs } from '../services/formulariService'
import { DilutionCard } from '../components/DilutionCard'
import { ROUTES } from '@/lib/constants'

export const DilutionProtocolPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('ALL')
  const [selectedRoute, setSelectedRoute] = useState<string>('ALL')
  const [fluidRestrictedOnly, setFluidRestrictedOnly] = useState(false)

  const allDrugs = useMemo(() => getAllFormulariDrugs(), [])
  const ivDrugs = useMemo(() => {
    return allDrugs.filter(d => d.dilution?.isApplicable || d.reconstitution?.isApplicable)
  }, [allDrugs])

  const therapeuticClasses = useMemo(() => {
    const classes = new Set<string>()
    ivDrugs.forEach(d => {
      if (d.therapeuticClass) classes.add(d.therapeuticClass)
    })
    return Array.from(classes)
  }, [ivDrugs])

  const filteredDrugs = useMemo(() => {
    return ivDrugs.filter(drug => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const matchName = drug.genericName.toLowerCase().includes(q)
        const matchBrand = drug.brandNames.some(b => b.toLowerCase().includes(q))
        if (!matchName && !matchBrand) return false
      }

      if (selectedClass !== 'ALL' && drug.therapeuticClass !== selectedClass) return false

      if (selectedRoute !== 'ALL') {
        if (drug.dilution?.standardDilution.route !== selectedRoute) return false
      }

      if (fluidRestrictedOnly) {
        if (!drug.dilution?.standardDilution.maxConcentrationFluidRestricted) return false
      }

      return true
    })
  }, [ivDrugs, searchTerm, selectedClass, selectedRoute, fluidRestrictedOnly])

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-600" />
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-teal-600 to-cyan-700 text-white rounded-2xl shadow-md flex-shrink-0">
            <Droplets className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <span>Protokol Rekonstitusi & Pelarutan IV</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Garis Panduan Bancuhan Aseptik, Cecair Pembawa, Keserasian Y-Site & Tempoh Infusi Hospital Lawas
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Panduan IV Wad</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-cyan-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-teal-200 text-xs font-bold uppercase tracking-wider">
          <Activity className="w-4 h-4" />
          <span>Standard Amalan Farmasi Klinikal KKM</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold leading-snug">
          Semakan 7 'Rights' Pentadbiran Ubat Parenteral & Pencegahan Pemendakan IV:
        </h2>

        <p className="text-xs sm:text-sm text-teal-100 leading-relaxed max-w-4xl">
          Sentiasa pastikan keserasian larutan pembawa (0.9% NaCl vs 5% Dextrose) dan elakkan mencampur ubat tanpa rujukan Y-Site. Sediaan pekat seperti Kalium Klorida dilarang sama sekali diberi secara IV bolus terus.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ubat suntikan IV (cth: Meropenem, Vancomycin, Dobutamine, KCl)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Semua Kelas Terapi</option>
            {therapeuticClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <select
            value={selectedRoute}
            onChange={e => setSelectedRoute(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Semua Laluan Infusi</option>
            <option value="Continuous Infusion">Continuous Infusion (Infusi Berterusan)</option>
            <option value="IV Infusion">IV Infusion (Infusi Berkala)</option>
            <option value="IV Slow Push">IV Slow Push (Tolakan Perlahan)</option>
          </select>
        </div>

        {/* Checkbox Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setFluidRestrictedOnly(!fluidRestrictedOnly)}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              fluidRestrictedOnly ? 'bg-teal-600 text-white border-teal-700 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Pesakit Sekatan Cecair (Fluid-Restricted Protocols)</span>
          </button>
        </div>
      </div>

      {/* Protocols Listing */}
      <div className="space-y-8">
        {filteredDrugs.map(drug => (
          <div
            key={drug.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full font-mono">
                    ATC: {drug.atcCode}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{drug.therapeuticClass}</span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900">
                  {drug.genericName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {drug.brandNames.join(' • ')} — Kekuatan: {drug.strengths.join(', ')}
                </p>
              </div>

              <button
                onClick={() => navigate(`/formulari/drug/${drug.id}`)}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                Kad Penuh &rarr;
              </button>
            </div>

            {/* Render Dilution Card Component */}
            <DilutionCard
              reconstitution={drug.reconstitution}
              dilution={drug.dilution}
              drugName={drug.genericName}
            />
          </div>
        ))}

        {filteredDrugs.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 text-xs">
            Tiada protokol pelarutan parenteral ditemui bagi carian ini.
          </div>
        )}
      </div>
    </div>
  )
}

export default DilutionProtocolPage
