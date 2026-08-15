import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical,
  Search,
  Filter,
  AlertTriangle,
  ShieldAlert,
  Download,
  CheckCircle2,
  Grid,
  List,
  Eye,
  Sparkles,
  AlertOctagon,
  X,
  PhoneCall,
  Activity,
  Layers,
  Building2,
  FileCheck2,
  ShieldCheck,
  RotateCcw
} from 'lucide-react'
import { MSDS_DATABASE, MSDSEntry, ChemicalCategory, HazardClass } from '../data/msdsData'
import { MsdsChemicalCard } from '../components/MsdsChemicalCard'
import { MsdsTableRow } from '../components/MsdsTableRow'
import { MsdsDetailModal } from '../components/MsdsDetailModal'
import { GhsPictogram } from '../components/GhsPictogram'

export default function MyMsdsDashboardPage() {
  const [selectedItem, setSelectedItem] = useState<MSDSEntry | null>(null)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedHazard, setSelectedHazard] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [quickFilter, setQuickFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Categories list
  const categories: ChemicalCategory[] = [
    'Disinfectants & Sterilants',
    'Lab & Diagnostic Reagents',
    'Medical Gases',
    'Pharmaceutical Solvents',
    'Cleaning & Decontamination',
    'Staining & Histology',
    'Radiological Chemistry'
  ]

  // Hazard classes list
  const hazardClasses: HazardClass[] = [
    'Hakisan (Corrosive)',
    'Mudah Terbakar (Flammable)',
    'Toksik (Toxic)',
    'Biobahaya (Biohazard)',
    'Bahaya Kesihatan (Health Hazard)',
    'Pengoksida (Oxidizer)',
    'Gas Tertekanan (Compressed Gas)',
    'Kerengsaan (Irritant)'
  ]

  // Filtered entries
  const filteredData = useMemo(() => {
    return MSDS_DATABASE.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.malayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.casNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.chemicalFormula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory
      const matchesHazard = selectedHazard === 'ALL' || item.hazardClass === selectedHazard
      const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus

      let matchesQuick = true
      if (quickFilter === 'HAKISAN') matchesQuick = item.hazardClass.includes('Hakisan')
      if (quickFilter === 'TOKSIK') matchesQuick = item.hazardClass.includes('Toksik')
      if (quickFilter === 'SEMAKAN') matchesQuick = item.status === 'Perlu Semakan' || item.status === 'Kritikal'
      if (quickFilter === 'SW411') matchesQuick = item.scheduledWasteCode === 'SW 411'

      return matchesSearch && matchesCategory && matchesHazard && matchesStatus && matchesQuick
    })
  }, [searchTerm, selectedCategory, selectedHazard, selectedStatus, quickFilter])

  // Statistics
  const stats = useMemo(() => {
    const total = MSDS_DATABASE.length
    const toxicOrCorrosive = MSDS_DATABASE.filter(
      (i) => i.hazardClass.includes('Toksik') || i.hazardClass.includes('Hakisan')
    ).length
    const reviewNeeded = MSDS_DATABASE.filter(
      (i) => i.status === 'Perlu Semakan' || i.status === 'Kritikal'
    ).length
    const scheduledWasteCount = new Set(MSDS_DATABASE.map((i) => i.scheduledWasteCode)).size

    return { total, toxicOrCorrosive, reviewNeeded, scheduledWasteCount }
  }, [])

  const resetAllFilters = () => {
    setSearchTerm('')
    setSelectedCategory('ALL')
    setSelectedHazard('ALL')
    setSelectedStatus('ALL')
    setQuickFilter('ALL')
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 md:p-8 font-sans antialiased">
      {/* Top Header Bar */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono font-medium">
              KKM Hospital Standard
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-medium">
              OSHA 1994 / CLASS 2013
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <FlaskConical className="w-7 h-7 text-emerald-400 shrink-0" />
            Direktori & Data Keselamatan Bahan Kimia (MyMSDS)
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-3xl">
            Sistem kawal selia inventori bahan kimia hospital, pengelasan GHS 16 seksyen, serta panduan tindak balas kecemasan tumpahan HAZMAT.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-medium text-xs shadow-sm transition-all border border-rose-500/50"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            Prosedur Tumpahan & Kecemasan
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-all border border-slate-700"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Eksport Laporan
          </button>
        </div>
      </div>

      {/* Modern Integrated Horizontal Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-3 pr-4 border-r border-slate-800/60">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Jumlah Bahan Kimia</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{stats.total}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 pr-4 border-r border-slate-800/60">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Toksik & Hakisan</div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">{stats.toxicOrCorrosive}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 pr-4 border-r border-slate-800/60">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Perlu Semakan MSDS</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">{stats.reviewNeeded}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Kod Buangan SW</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{stats.scheduledWasteCount} Kategori</div>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-6 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari bahan kimia, CAS Number, formula (CH₂O), ID atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 text-xs transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'HAKISAN', label: 'Hakisan' },
              { id: 'TOKSIK', label: 'Toksik' },
              { id: 'SEMAKAN', label: 'Perlu Semakan' },
              { id: 'SW411', label: 'SW 411' }
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setQuickFilter(chip.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all border ${
                  quickFilter === chip.id
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 self-end lg:self-auto shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Jadual
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Kad
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/60">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Kategori Bahan
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="ALL">Semua Kategori ({MSDS_DATABASE.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Kelas Bahaya (Hazard Class)
            </label>
            <select
              value={selectedHazard}
              onChange={(e) => setSelectedHazard(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="ALL">Semua Bahaya</option>
              {hazardClasses.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Status MSDS
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="ALL">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Perlu Semakan">Perlu Semakan</option>
              <option value="Kritikal">Kritikal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredData.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800/80">
          <FlaskConical className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">Tiada bahan kimia dijumpai</h3>
          <p className="text-xs text-slate-500 mt-1">Cuba ubah kata kunci carian atau tetapan penapis anda.</p>
          <button
            onClick={resetAllFilters}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium hover:bg-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset Penapis
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Enterprise Master Data Table View */
        <div className="overflow-x-auto rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">ID / CAS</th>
                <th className="py-3 px-4 font-semibold">Nama Bahan Kimia & Formula</th>
                <th className="py-3 px-4 font-semibold">Kategori & Jabatan</th>
                <th className="py-3 px-4 font-semibold">Kelas Bahaya & GHS</th>
                <th className="py-3 px-4 font-semibold">Kod SW & Lokasi</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredData.map((item) => (
                <MsdsTableRow key={item.id} item={item} onViewClick={(i) => setSelectedItem(i)} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid / Compact Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((item) => (
            <MsdsChemicalCard key={item.id} item={item} onViewClick={(i) => setSelectedItem(i)} />
          ))}
        </div>
      )}

      {/* MSDS Detail Modal */}
      {selectedItem && (
        <MsdsDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onEmergencyClick={() => {
            setSelectedItem(null)
            setShowEmergencyModal(true)
          }}
        />
      )}

      {/* Emergency Spill Kit Protocol Modal */}
      <AnimatePresence>
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-slate-100"
            >
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Protokol Kecemasan & Tumpahan Kimia Hospital</h2>
                  <p className="text-xs text-rose-400 font-medium">Panduan Maklum Balas Pantas Tumpahan HAZMAT & Pertolongan Cemas</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Emergency Contact Bar */}
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <PhoneCall className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Talian Kecemasan KKM / Pasukan HAZMAT</h4>
                      <p className="text-[11px] text-rose-300">Hubungi Bilik Gerakan Kecemasan Hospital Segera</p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-rose-600 font-mono font-bold text-white text-sm shrink-0">
                    Ext: 999 / 112
                  </span>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px]">1</span>
                      EVAKUASI & ISOLASI
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Arahkan kakitangan dan pesakit keluar dari kawasan terjejas. Tutup pintu kawasan tumpahan dan pasang pita amaran HAZMAT.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px]">2</span>
                      PAKAI PPE KHAS (SPILL KIT)
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Gunakan apron kalis air, sarung tangan Nitrile/Neoprene, respirator muka penuh N95/P100, dan gogal perlindungan mata.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px]">3</span>
                      PENYERAPAN & NEUTRALISASI
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Tabur bahan penyerap (Spill Pillow/Absorbent Granules) dari lingkaran luar ke dalam tumpahan. Elakkan cecair mengalir ke longkang.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px]">4</span>
                      PELUPUSAN SW (SCHEDULED WASTE)
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Kutip sisa tumpahan ke dalam beg Kuning/Biohazard khas berserta label Kod SW (e.g. SW 411) mengikut Akta Kualiti Alam Sekitar 1974.
                    </p>
                  </div>
                </div>

                {/* Eyewash & Emergency Shower */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-start gap-3">
                  <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-400 text-xs">Pertolongan Cemas Pendedahan Kulit / Mata</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Gunakan stesen <span className="font-bold text-white">Emergency Eyewash & Safety Shower</span> berdekatan secara berterusan sekurang-kurangnya <span className="font-bold text-emerald-400">15 minit</span>. Tanggalkan sebarang pakaian yang tercemar dan dapatkan rawatan pegawai perubatan segera.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                >
                  Tutup Panduan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}