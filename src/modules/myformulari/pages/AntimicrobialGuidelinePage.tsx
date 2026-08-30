import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Search,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  Layers,
  FileCheck,
  AlertCircle,
  Activity
} from 'lucide-react'
import { NAG_GUIDELINES } from '../data/antimicrobialData'
import { AntimicrobialTable } from '../components/AntimicrobialTable'
import { ROUTES } from '@/lib/constants'

export const AntimicrobialGuidelinePage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedSystem, setSelectedSystem] = useState<string>('ALL')
  const [selectedSetting, setSelectedSetting] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const bodySystems = [
    'Respiratory',
    'Urinary',
    'Skin & Soft Tissue',
    'Central Nervous System (CNS)',
    'Intra-abdominal',
    'Surgical Prophylaxis (SAP)'
  ]

  const settings = [
    'Community-Acquired',
    'Hospital-Acquired (HAP/VAP)',
    'Surgical Prophylaxis'
  ]

  const filteredGuidelines = useMemo(() => {
    return NAG_GUIDELINES.filter(item => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const matchCond = item.conditionName.toLowerCase().includes(q)
        const matchPath = item.primaryPathogens.some(p => p.toLowerCase().includes(q))
        const matchReg = item.firstLineTherapy.regimen.toLowerCase().includes(q)
        if (!matchCond && !matchPath && !matchReg) return false
      }
      if (selectedSystem !== 'ALL' && item.bodySystem !== selectedSystem) return false
      if (selectedSetting !== 'ALL' && item.setting !== selectedSetting) return false
      return true
    })
  }, [searchTerm, selectedSystem, selectedSetting])

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600" />
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md flex-shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <span>Garis Panduan Antimikrobial Kebangsaan (NAG 2024)</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              National Antimicrobial Guideline Malaysia (Edisi Ke-4) & Protokol Antimicrobial Stewardship (AMS)
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Panduan NAG</span>
        </button>
      </div>

      {/* AMS Policy Ribbon */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <FileCheck className="w-4 h-4" />
          <span>Protokol Antimicrobial Stewardship (AMS) Hospital Lawas</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold leading-snug">
          Prinsip Penggunaan Antibiotik Secara Rasional Bagi Membendung Rintangan Antimikrob (AMR):
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-1">
            <Clock className="w-5 h-5 text-emerald-300 mb-2" />
            <h3 className="text-xs font-bold">Semakan Mandatori 48-72 Jam</h3>
            <p className="text-[11px] text-emerald-100/80 leading-relaxed">
              Semua preskripsi antibiotik empirik wajib disemak semula selepas 72 jam berdasarkan keputusan kultur mikrobiologi.
            </p>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-1">
            <Activity className="w-5 h-5 text-emerald-300 mb-2" />
            <h3 className="text-xs font-bold">Pertukaran Awal IV ke Oral</h3>
            <p className="text-[11px] text-emerald-100/80 leading-relaxed">
              Tukar kepada ubat makan serta-merta apabila pesakit stabil, tiada demam 48j, dan saluran pemakanan berfungsi.
            </p>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-1">
            <ShieldCheck className="w-5 h-5 text-emerald-300 mb-2" />
            <h3 className="text-xs font-bold">Kawalan Antibiotik Terhad (Tier R/Rsv)</h3>
            <p className="text-[11px] text-emerald-100/80 leading-relaxed">
              Antibiotik seperti Meropenem, Vancomycin, dan Colistin memerlukan kelulusan Pakar ID / Pegawai AMS.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari indikasi klinikal, patogen atau rejimen antibiotik (cth: Pneumonia, Meningitis, Ceftriaxone)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedSystem}
            onChange={e => setSelectedSystem(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Semua Sistem Badan</option>
            {bodySystems.map(sys => (
              <option key={sys} value={sys}>{sys}</option>
            ))}
          </select>

          <select
            value={selectedSetting}
            onChange={e => setSelectedSetting(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Semua Persekitaran Rawatan</option>
            {settings.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Guidelines Table Component */}
      <AntimicrobialTable
        guidelines={filteredGuidelines}
        filterSystem={selectedSystem}
        filterSetting={selectedSetting}
      />
    </div>
  )
}

export default AntimicrobialGuidelinePage
