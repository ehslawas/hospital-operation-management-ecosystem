// src/modules/hub/pages/modules/FormulariSubMenu.tsx
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  Flame,
  AlertTriangle,
  Droplets,
  ShieldCheck,
  TrendingDown,
  Layers,
  Activity,
  Pill
} from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { getFormulariSummaryStats } from '@/modules/myformulari/services/formulariService'
import { Badge } from '@/components/ui'

export const FormulariSubMenu: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()

  const stats = useMemo(() => getFormulariSummaryStats(), [])

  const menuItems = [
    {
      title: language === 'ms' ? 'Carian & Pengkatalogan Formulari' : 'Formulary Search & Catalog',
      description: language === 'ms'
        ? 'Carian ubat lengkap mengikut nama generik (INN), jenama dagang, kod ATC, indikasi, kontraindikasi dan kategori preskriber FUKKM.'
        : 'Comprehensive drug search by generic name, brand, ATC classification, clinical indications, and MOH prescriber categories.',
      icon: Search,
      path: ROUTES.FORMULARI_DASHBOARD,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      badge: `${stats.totalDrugs} Ubat`,
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30'
    },
    {
      title: language === 'ms' ? 'Senarai Ubat Berisiko Tinggi (HAM)' : 'High Alert Medications (HAM)',
      description: language === 'ms'
        ? 'Daftar ubat berisiko tinggi KKM — elektrolit pekat, insulin, inotrop, antikoagulan, opioid, NMBA — beserta SOP semakan berganda mandatori (IDC).'
        : 'KKM High Alert Medication registry: concentrated electrolytes, insulin, inotropes, anticoagulants, opioids, NMBAs, and mandatory IDC double-check SOP.',
      icon: Flame,
      path: ROUTES.FORMULARI_HAM,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      badge: `${stats.hamCount} HAM`,
      badgeColor: 'bg-rose-500 text-white border-transparent'
    },
    {
      title: language === 'ms' ? 'Daftar Ubat LASA & TALL-Man Lettering' : 'LASA Registry & TALL-Man Lettering',
      description: language === 'ms'
        ? 'Senarai pasangan ubat rupa serupa / bunyi serupa dengan penonjolan huruf TALL-man dan panduan pengasingan simpanan stor / troli kecemasan.'
        : 'Look-Alike Sound-Alike drug pairs with TALL-man lettering highlighting and storage separation guidance.',
      icon: AlertTriangle,
      path: ROUTES.FORMULARI_LASA,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: `${stats.lasaCount} Pasangan`,
      badgeColor: 'bg-amber-500 text-slate-900 border-transparent'
    },
    {
      title: language === 'ms' ? 'Pusat Protokol Rekonstitusi & Pelarutan IV' : 'IV Dilution & Reconstitution Protocols',
      description: language === 'ms'
        ? 'Panduan bancuhan aseptik, pelarut yang sesuai, kepekatan maksima sekatan cecair, keserasian sambungan Y-Site, dan had laju infusi.'
        : 'Aseptic reconstitution guide, compatible diluents, fluid restriction concentrations, Y-site compatibility, and infusion rate limits.',
      icon: Droplets,
      path: ROUTES.FORMULARI_DILUTION,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      badge: `${stats.ivDilutionCount} Protokol`,
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    },
    {
      title: language === 'ms' ? 'Garis Panduan Antimikrobial Kebangsaan (NAG 2024)' : 'National Antimicrobial Guidelines (NAG 2024)',
      description: language === 'ms'
        ? 'Rejimen empirik lini pertama & kedua mengikut sistem badan, profilaksis surgeri (SAP), kriteria tukar IV ke oral, dan semakan 72 jam AMS.'
        : 'First and second line empiric regimens by body system, surgical prophylaxis (SAP), IV-to-oral switch criteria, and 72h AMS reviews.',
      icon: ShieldCheck,
      path: ROUTES.FORMULARI_ANTIMICROBIAL,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: 'NAG 4th Ed.',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      title: language === 'ms' ? 'Pemantauan Kuota & Amaran Stok Rendah' : 'Drug Quota & Low-Stock Alerts',
      description: language === 'ms'
        ? 'Pengesanan baki kuota bulanan fasiliti, amaran stok rendah / kritikal habis, anggaran baki hari penggunaan ubat, dan ubat alternatif tersedia.'
        : 'Facility monthly quota tracking, low-stock / critical shortage threshold alerts, estimated run-out forecasting, and available drug alternatives.',
      icon: TrendingDown,
      path: ROUTES.FORMULARI_QUOTA,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      badge: stats.lowStockCount > 0 ? `${stats.lowStockCount} Amaran` : 'Stok OK',
      badgeColor: stats.lowStockCount > 0 ? 'bg-rose-500 text-white border-transparent' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      title: language === 'ms' ? 'Matriks Ubat Alternatif & Penggantian Terapi' : 'Drug Alternatives & Substitution Matrix',
      description: language === 'ms'
        ? 'Senarai ubat pengganti setara kelas atau lini kedua yang diluluskan KKM semasa berlaku gangguan bekalan atau kehabisan kuota.'
        : 'MOH approved therapeutic substitutes and class equivalent alternatives during stock shortages or supply disruptions.',
      icon: Layers,
      path: ROUTES.FORMULARI_ALTERNATIVES,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      badge: language === 'ms' ? 'Alternatif Terapi' : 'Therapeutic Alt.',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    }
  ]

  return (
    <div className="p-6 md:p-8 w-full min-h-screen text-slate-100">
      {/* Back navigation */}
      <div className="mb-8">
        <button
          onClick={() => navigate(ROUTES.HUB)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6 group text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>{language === 'ms' ? 'Kembali ke Hub Utama' : 'Back to Main Hub'}</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-2xl shadow-inner">
              <Pill className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">MyFormulari</h1>
                <Badge className="border-violet-500/30 text-violet-400 bg-violet-500/5">
                  {language === 'ms' ? 'Formulari Klinikal KKM' : 'KKM Clinical Formulary'}
                </Badge>
              </div>
              <p className="text-slate-400 mt-1">
                {language === 'ms'
                  ? 'Pusat Sehenti Formulari Ubat, Keselamatan HAM/LASA, Protokol IV & Garis Panduan Antimikrobial'
                  : 'Drug Formulary One-Stop Centre, HAM/LASA Safety, IV Protocols & Antimicrobial Guidelines'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">{language === 'ms' ? 'Jumlah Ubat' : 'Total Drugs'}</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-white">{stats.totalDrugs}</p>
          <p className="text-xs text-slate-500 mt-1">Formulari FUKKM 2025</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">{language === 'ms' ? 'Ubat HAM' : 'HAM Items'}</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-rose-400">{stats.hamCount}</p>
          <p className="text-xs text-slate-500 mt-1">High Alert Risk</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">{language === 'ms' ? 'Pasangan LASA' : 'LASA Pairs'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-amber-400">{stats.lasaCount}</p>
          <p className="text-xs text-slate-500 mt-1">TALL-Man Lettering</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">{language === 'ms' ? 'Amaran Stok' : 'Stock Alerts'}</span>
            <TrendingDown className={`w-4 h-4 ${stats.lowStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <p className={`text-3xl font-bold font-mono mt-2 ${stats.lowStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {stats.lowStockCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">{language === 'ms' ? 'Stok rendah / habis' : 'Low / out of stock'}</p>
        </div>
      </div>

      {/* Action choices list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white tracking-wide">
          {language === 'ms' ? 'PILIHAN MODUL KLINIKAL' : 'CLINICAL MODULE CHOICES'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className="group text-left bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 hover:bg-slate-800/40 hover:border-slate-700/80 transition-all duration-300 shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className={`p-3 rounded-xl border ${item.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {item.badge && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-violet-400 transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-500/80 group-hover:text-violet-400 transition-colors mt-auto">
                  <span>{language === 'ms' ? 'Masuk Modul' : 'Open Module'}</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default FormulariSubMenu
