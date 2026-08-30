import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flame,
  ShieldAlert,
  Search,
  ArrowLeft,
  Filter,
  AlertOctagon,
  Users,
  Lock,
  Activity,
  Printer,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { getAllFormulariDrugs } from '../services/formulariService'
import { HAMCategory, HAMRiskLevel, DrugEntry } from '../types/formulariTypes'
import { PrescriberBadge, HAMBadge, PoisonBadge } from '../components/DrugBadge'
import { TallManLettering } from '../components/TallManLettering'
import { ROUTES } from '@/lib/constants'

export const HamListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<HAMCategory | 'ALL'>('ALL')
  const [selectedRisk, setSelectedRisk] = useState<HAMRiskLevel | 'ALL'>('ALL')

  const allDrugs = useMemo(() => getAllFormulariDrugs(), [])
  const hamDrugs = useMemo(() => allDrugs.filter(d => d.isHAM), [allDrugs])

  const categories: HAMCategory[] = [
    'Concentrated Electrolyte',
    'Insulin & Hypoglycaemics',
    'Anticoagulant & Antithrombotic',
    'IV Adrenergic Agonist / Inotrope',
    'Antiarrhythmic IV',
    'Neuromuscular Blocking Agent (NMBA)',
    'Chemotherapy / Cytotoxic',
    'Opioid & Sedative IV'
  ]

  const filteredDrugs = useMemo(() => {
    return hamDrugs.filter(drug => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const matchName = drug.genericName.toLowerCase().includes(q)
        const matchBrand = drug.brandNames.some(b => b.toLowerCase().includes(q))
        const matchClass = drug.therapeuticClass.toLowerCase().includes(q)
        if (!matchName && !matchBrand && !matchClass) return false
      }

      if (selectedCategory !== 'ALL' && drug.hamCategory !== selectedCategory) return false
      if (selectedRisk !== 'ALL' && drug.hamRiskLevel !== selectedRisk) return false

      return true
    })
  }, [hamDrugs, searchTerm, selectedCategory, selectedRisk])

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600" />
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-rose-600 to-red-700 text-white rounded-2xl shadow-md flex-shrink-0">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <span>Senarai Ubat Berisiko Tinggi (HAM)</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Pematuhan Garis Panduan Penggunaan Selamat Ubat Berisiko Tinggi KKM (Edisi Ke-2) Hospital Lawas
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Senarai HAM Wad</span>
        </button>
      </div>

      {/* Mandatory KKM Policy Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
          <AlertOctagon className="w-4 h-4" />
          <span>Dasar Keselamatan Ubat KKM (Patient Safety Standard)</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold leading-snug">
          4 Prinsip Wajib Pengendalian High Alert Medication (HAM) di Semua Wad & Unit:
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-1">
            <Users className="w-5 h-5 text-rose-300 mb-2" />
            <h3 className="text-xs font-bold">Independent Double-Check (IDC)</h3>
            <p className="text-[11px] text-rose-100/80 leading-relaxed">
              Dua staf berasingan wajib mengira dos, kadar pam, dan identiti pesakit sebelum pemberian ubat.
            </p>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-1">
            <ShieldAlert className="w-5 h-5 text-rose-300 mb-2" />
            <h3 className="text-xs font-bold">Pelekat Amaran Merah</h3>
            <p className="text-[11px] text-rose-100/80 leading-relaxed">
              Semua vial, picagari, dan beg infusi HAM wajib dilekatkan pelekat merah "HIGH ALERT".
            </p>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-1">
            <Lock className="w-5 h-5 text-rose-300 mb-2" />
            <h3 className="text-xs font-bold">Penyimpanan Berasingan</h3>
            <p className="text-[11px] text-rose-100/80 leading-relaxed">
              Hadkan stok wad. Kalium Klorida pekat dilarang sama sekali berada di stok lantai wad am.
            </p>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-1">
            <Activity className="w-5 h-5 text-rose-300 mb-2" />
            <h3 className="text-xs font-bold">Pam Infusi Elektronik</h3>
            <p className="text-[11px] text-rose-100/80 leading-relaxed">
              Wajib guna pam infusi bersensor volumetrik / picagari dengan had kadar terhad.
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
              placeholder="Cari ubat HAM mengikut nama generik, jenama, atau kelas terapi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-rose-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as any)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Semua Kategori HAM</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedRisk}
            onChange={e => setSelectedRisk(e.target.value as any)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Semua Tahap Risiko</option>
            <option value="CRITICAL">Risiko KRITIKAL Sahaja</option>
            <option value="HIGH">Risiko HIGH Sahaja</option>
            <option value="MODERATE">Risiko MODERATE Sahaja</option>
          </select>
        </div>
      </div>

      {/* HAM Drug Cards Listing */}
      <div className="space-y-4">
        {filteredDrugs.map(drug => {
          const isCritical = drug.hamRiskLevel === 'CRITICAL'

          return (
            <div
              key={drug.id}
              onClick={() => navigate(`/formulari/drug/${drug.id}`)}
              className={`bg-white rounded-3xl border transition-all duration-300 p-6 hover:shadow-lg cursor-pointer space-y-4 ${
                isCritical ? 'border-rose-300 hover:border-rose-500' : 'border-amber-200 hover:border-amber-400'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <HAMBadge riskLevel={drug.hamRiskLevel} category={drug.hamCategory} />
                    <PrescriberBadge category={drug.prescriberCategory} size="sm" />
                    <PoisonBadge poison={drug.poisonCategory} size="sm" />
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-mono">
                      {drug.atcCode}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {drug.isLASA && drug.tallManName ? (
                      <TallManLettering name={drug.tallManName} />
                    ) : (
                      drug.genericName
                    )}
                  </h3>

                  <p className="text-xs text-slate-500">
                    Kekuatan & Bentuk: <strong className="text-slate-700">{drug.strengths.join(', ')} ({drug.dosageForms.join(', ')})</strong>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                    Kategori HAM: {drug.hamCategory}
                  </span>
                </div>
              </div>

              {/* Specific Precautions */}
              {drug.hamPrecautions && drug.hamPrecautions.length > 0 && (
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-xs space-y-1.5">
                  <strong className="text-rose-950 font-bold block uppercase tracking-wider text-[11px]">
                    Langkah Keselamatan Mandatori KKM:
                  </strong>
                  <ul className="space-y-1 text-slate-700">
                    {drug.hamPrecautions.map((pre, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                        <span>{pre}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Laluan: <strong className="text-slate-700">{drug.administrationRoutes.join(', ')}</strong></span>
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <span>Lihat Panduan Penuh & Protokol</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          )
        })}

        {filteredDrugs.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 text-xs">
            Tiada ubat HAM ditemui bagi kriteria pilihan.
          </div>
        )}
      </div>
    </div>
  )
}

export default HamListPage
