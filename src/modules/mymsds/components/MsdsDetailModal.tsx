import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical,
  X,
  Printer,
  Download,
  ShieldAlert,
  Building2,
  Calendar,
  AlertTriangle,
  Shield,
  FileText,
  Thermometer,
  CheckCircle2,
  Info,
  Flame,
  Droplets,
  Activity,
  Award,
  Layers,
  HeartPulse,
  PackageCheck
} from 'lucide-react'
import { MSDSEntry } from '../data/msdsData'
import { GhsPictogram } from './GhsPictogram'

interface MsdsDetailModalProps {
  item: MSDSEntry | null
  onClose: () => void
  onEmergencyClick: () => void
}

export const MsdsDetailModal: React.FC<MsdsDetailModalProps> = ({ item, onClose, onEmergencyClick }) => {
  const [activeTab, setActiveTab] = useState<'seksyen1_3' | 'seksyen4_6' | 'seksyen7_8' | 'seksyen9_16'>('seksyen1_3')

  if (!item) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    alert(`Memuat turun Helaian Data Keselamatan Bahan (HKDB/MSDS) rasmi bagi ${item.name} (${item.casNumber}).\n\nPiawaian: CLASS Regulations 2013 / USECHH 2000 KKM.`)
  }

  const tabs = [
    {
      id: 'seksyen1_3' as const,
      num: '1',
      range: 'Seksyen 1–3',
      title: 'Identiti & GHS',
      icon: Shield
    },
    {
      id: 'seksyen4_6' as const,
      num: '2',
      range: 'Seksyen 4–6',
      title: 'Pertolongan Cemas',
      icon: HeartPulse
    },
    {
      id: 'seksyen7_8' as const,
      num: '3',
      range: 'Seksyen 7–8',
      title: 'Simpanan & PPE',
      icon: Thermometer
    },
    {
      id: 'seksyen9_16' as const,
      num: '4',
      range: 'Seksyen 9–16',
      title: 'Sifat & Pelupusan',
      icon: PackageCheck
    }
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
        {/* Backdrop overlay trigger close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Right Side Sliding Sheet Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="relative z-10 w-full max-w-4xl h-full flex flex-col bg-slate-900 border-l border-slate-800 shadow-2xl overflow-hidden text-slate-200"
        >
          {/* Header Bar */}
          <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {item.id}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  CAS: {item.casNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {item.category}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{item.name}</h2>
              <p className="text-xs font-mono text-emerald-400 font-medium">{item.malayName}</p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Status Semakan</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {item.status}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Formula Kimia</span>
              <span className="text-white font-bold mt-0.5 block">{item.chemicalFormula}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Had PEL (Malaysia)</span>
              <span className="text-amber-300 font-semibold mt-0.5 block truncate">{item.pelMalaysia}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Kod Sisa (JAS)</span>
              <span className="text-cyan-400 font-bold mt-0.5 block">{item.scheduledWasteCode}</span>
            </div>
          </div>

          {/* High Visibility Segmented Tab Navigation */}
          <div className="p-3 bg-slate-950 border-b border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all border text-left ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.num}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold truncate">
                        {tab.range}
                      </div>
                      <div className="text-xs font-bold truncate">{tab.title}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Modal Body Scroll Area */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto text-xs">
            {activeTab === 'seksyen1_3' && (
              <div className="space-y-6">
                {/* GHS Pictograms & Signal Word */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Klasifikasi Piktogram GHS (CLASS 2013)
                    </span>
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase ${
                        item.ghsSignalWord === 'Bahaya'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      KATA ISYARAT: {item.ghsSignalWord}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {item.ghsCodes.map((code) => (
                      <GhsPictogram key={code} code={code} size="lg" showLabel />
                    ))}
                  </div>
                </div>

                {/* Hazard Statements H-Codes */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Pernyataan Bahaya (H-Statements)
                  </h3>
                  <div className="space-y-1.5">
                    {item.hazardStatements.map((h, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-rose-300 font-mono">
                        {h}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Precautionary Statements P-Codes */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    Pernyataan Jaga-Jaga (P-Statements)
                  </h3>
                  <div className="space-y-1.5">
                    {item.precautionaryStatements.map((p, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono">
                        {p}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hospital Departments Usage */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    Penggunaan Jabatan Hospital & Stesen Simpanan
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {item.departments.map((dept, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium">
                          {dept}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 pt-1">
                      <strong className="text-white">Lokasi Stesen Utama:</strong> {item.location}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seksyen4_6' && (
              <div className="space-y-6">
                {/* Section 4 First Aid */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <ShieldAlert className="w-4 h-4" />
                    Seksyen 4: Langkah Pertolongan Cemas Kecemasan
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="font-bold text-white block">Penyedutan Udara:</span>
                      <p className="text-slate-300 leading-relaxed">{item.firstAid.inhalation}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="font-bold text-white block">Pajanan Mata:</span>
                      <p className="text-slate-300 leading-relaxed">{item.firstAid.eyeContact}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="font-bold text-white block">Pajanan Kulit:</span>
                      <p className="text-slate-300 leading-relaxed">{item.firstAid.skinContact}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="font-bold text-white block">Tertelan:</span>
                      <p className="text-slate-300 leading-relaxed">{item.firstAid.ingestion}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/20 text-xs space-y-1.5">
                    <div><strong className="text-rose-400">Nota Gejala:</strong> <span className="text-slate-300">{item.firstAid.symptomNote}</span></div>
                    <div><strong className="text-rose-400">Nota Rawatan Doktor:</strong> <span className="text-slate-300">{item.firstAid.doctorNote}</span></div>
                  </div>
                </div>

                {/* Section 5 & 6 Fire & Spill */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Flame className="w-4 h-4" />
                    Seksyen 5 & 6: Pemadam Kebakaran & Prosedur Tumpahan
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div>
                      <strong className="text-white block">Sifat Pemadam Kebakaran:</strong>
                      <p className="text-slate-300">Takat Kilat: {item.flashPoint} | Takat Didih: {item.boilingPoint}</p>
                    </div>
                    <div className="pt-2">
                      <strong className="text-white block">Tindakan Tumpahan Kimia:</strong>
                      <p className="text-slate-300 leading-relaxed">
                        Kosongkan kawasan, gunakan kit tumpahan kimia (spill kit), tabur serbuk neutraliser, dan kumpulkan sisa ke dalam tong Scheduled Waste bertanda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seksyen7_8' && (
              <div className="space-y-6">
                {/* Section 7 Storage */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Thermometer className="w-4 h-4" />
                    Seksyen 7: Syarat Pengendalian & Penyimpanan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div><strong className="text-white">Suhu Penyimpanan:</strong> <span className="text-slate-300">{item.storage.temperature}</span></div>
                      <div><strong className="text-white">Keperluan Pengudaraan:</strong> <span className="text-slate-300">{item.storage.ventilation}</span></div>
                      <div><strong className="text-white">Lokasi Kabinet:</strong> <span className="text-slate-300">{item.storage.location}</span></div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <strong className="text-rose-400 block font-bold">Bahan Tak Serasi (Incompatibles):</strong>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.storage.incompatibles.map((inc, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[11px]">
                            ❌ {inc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 8 PPE Matrix */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Shield className="w-4 h-4" />
                    Seksyen 8: Matriks Peralatan Perlindungan Diri (PPE)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block font-semibold text-[10px] uppercase">Respirator / Pernafasan</span>
                      <span className="text-white font-medium">{item.ppeRequired.respirator}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block font-semibold text-[10px] uppercase">Sarung Tangan</span>
                      <span className="text-white font-medium">{item.ppeRequired.gloves}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block font-semibold text-[10px] uppercase">Perlindungan Mata & Muka</span>
                      <span className="text-white font-medium">{item.ppeRequired.eyeProtection}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block font-semibold text-[10px] uppercase">Perlindungan Badan</span>
                      <span className="text-white font-medium">{item.ppeRequired.bodyProtection}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seksyen9_16' && (
              <div className="space-y-6 text-xs">
                {/* Physical & Chemical Properties */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    Seksyen 9: Sifat Fizikal & Kimia
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div><span className="text-slate-500 block text-[10px] uppercase">Keadaan Fizikal</span><span className="text-white font-semibold">{item.physicalState}</span></div>
                    <div><span className="text-slate-500 block text-[10px] uppercase">Rupa & Warna</span><span className="text-white font-semibold">{item.appearance}</span></div>
                    <div><span className="text-slate-500 block text-[10px] uppercase">Nilai pH</span><span className="text-white font-semibold">{item.ph}</span></div>
                    <div><span className="text-slate-500 block text-[10px] uppercase">Takat Kilat</span><span className="text-white font-semibold">{item.flashPoint}</span></div>
                    <div><span className="text-slate-500 block text-[10px] uppercase">Takat Didih</span><span className="text-white font-semibold">{item.boilingPoint}</span></div>
                    <div><span className="text-slate-500 block text-[10px] uppercase">Had PEL Malaysia</span><span className="text-amber-300 font-semibold">{item.pelMalaysia}</span></div>
                  </div>
                </div>

                {/* Disposal & Regulatory */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Seksyen 13–15: Kaedah Pelupusan & Kawal Selia Undang-Undang
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div>
                      <strong className="text-white block">Kaedah Pelupusan Sisa Terjadual:</strong>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">{item.disposalMethod}</p>
                    </div>
                    <div>
                      <strong className="text-white block">Rujukan Perundangan Malaysia:</strong>
                      <p className="text-emerald-400 font-mono mt-0.5">{item.regulatoryRef}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onEmergencyClick}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              Talian Kecemasan HAZMAT
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-all border border-slate-700"
              >
                <Printer className="w-4 h-4" />
                Cetak (Print)
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Muat Turun MSDS (PDF)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default MsdsDetailModal
