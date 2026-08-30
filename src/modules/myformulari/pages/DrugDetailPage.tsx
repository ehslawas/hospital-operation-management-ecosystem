import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Flame,
  AlertTriangle,
  Droplets,
  Clock,
  ShieldCheck,
  TrendingDown,
  Layers,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Pill,
  Printer,
  Sparkles,
  ExternalLink,
  Lock,
  BookmarkCheck,
  Thermometer,
  Info,
  ChevronRight,
  AlertOctagon,
  Stethoscope,
  Building2,
  Syringe,
  Package,
  BookOpen,
  Calculator,
  Baby,
  Scale,
  RotateCcw,
  HeartPulse
} from 'lucide-react'
import { getDrugById, getAllFormulariDrugs } from '../services/formulariService'
import { getGuidelinesForDrug, NAG_GUIDELINES } from '../data/antimicrobialData'
import { PrescriberBadge, HAMBadge, LASABadge, PoisonBadge, NAGBadge, PregnancyBadge, LactationBadge } from '../components/DrugBadge'
import { TallManLettering } from '../components/TallManLettering'
import { HamPrecautionsPanel } from '../components/HamPrecautionsPanel'
import { DilutionCard } from '../components/DilutionCard'
import { ShelfLifeWidget } from '../components/ShelfLifeWidget'
import { QuotaProgressBar } from '../components/QuotaProgressBar'
import { DrugInteractionModal } from '../components/DrugInteractionModal'

export const DrugDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'dosing' | 'pregnancy' | 'safety' | 'dilution' | 'shelflife' | 'antimicrobial' | 'alternatives'>('overview')
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false)

  // Cockcroft-Gault CrCl Calculator State
  const [calcAge, setCalcAge] = useState<string>('')
  const [calcGender, setCalcGender] = useState<'MALE' | 'FEMALE'>('MALE')
  const [calcWeight, setCalcWeight] = useState<string>('')
  const [calcSerumCr, setCalcSerumCr] = useState<string>('')
  const [showCrClCalculator, setShowCrClCalculator] = useState(false)

  // Paediatric Quick Weight Estimator
  const [paedWeight, setPaedWeight] = useState<string>('')

  const drug = id ? getDrugById(id) : undefined
  const allDrugs = getAllFormulariDrugs()

  // Calculate Cockcroft-Gault CrCl
  const calculateCrCl = (): { crcl: number; bracket: string; color: string } | null => {
    const age = parseFloat(calcAge)
    const weight = parseFloat(calcWeight)
    const scr = parseFloat(calcSerumCr)
    if (!age || !weight || !scr || age <= 0 || weight <= 0 || scr <= 0) return null

    // CrCl (mL/min) = [((140 - Age) * Weight_kg) / (0.814 * SerumCr_umol_L)] * (0.85 if Female)
    const raw = ((140 - age) * weight) / (0.814 * scr)
    const crcl = Math.round((calcGender === 'FEMALE' ? raw * 0.85 : raw) * 10) / 10

    let bracket = 'Fungsi Ginjal Normal / Gangguan Ringan (CrCl > 50 mL/min)'
    let color = 'bg-emerald-50 text-emerald-800 border-emerald-200'
    if (crcl < 10) {
      bracket = 'Penyakit Buah Pinggang Peringkat Akhir / ESRD (CrCl < 10 mL/min)'
      color = 'bg-rose-50 text-rose-900 border-rose-200'
    } else if (crcl < 30) {
      bracket = 'Gangguan Renal Teruk (CrCl 10 - 30 mL/min)'
      color = 'bg-orange-50 text-orange-900 border-orange-200'
    } else if (crcl <= 50) {
      bracket = 'Gangguan Renal Sederhana (CrCl 30 - 50 mL/min)'
      color = 'bg-amber-50 text-amber-900 border-amber-200'
    }

    return { crcl, bracket, color }
  }

  const crclResult = calculateCrCl()

  if (!drug) {
    return (
      <div className="p-8 w-full max-w-2xl mx-auto text-center space-y-5 bg-white rounded-3xl border border-slate-200 shadow-sm mt-10">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Ubat Tidak Dijumpai</h2>
          <p className="text-sm text-slate-500">
            Rekod ubat ID <code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">{id}</code> tidak wujud dalam pangkalan data Formulari Hospital.
          </p>
        </div>
        <button
          onClick={() => navigate('/formulari/dashboard')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          Kembali ke Senarai Formulari
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Ringkasan & Indikasi', icon: BookOpen },
    { id: 'dosing', label: 'Dos & Pentadbiran', icon: Activity },
    { id: 'pregnancy', label: 'Kehamilan & Penyusuan', icon: HeartPulse, badge: drug.pregnancyAndLactation?.fdaCategory ? `Kat ${drug.pregnancyAndLactation.fdaCategory}` : undefined },
    { id: 'safety', label: 'Amaran & Keselamatan', icon: ShieldCheck, badge: drug.isHAM ? 'HAM' : drug.isLASA ? 'LASA' : undefined },
    { id: 'dilution', label: 'Pelarutan IV & Bancuhan', icon: Droplets, disabled: !drug.dilution?.isApplicable && !drug.reconstitution?.isApplicable },
    { id: 'shelflife', label: 'Jangka Hayat & Storan', icon: Clock },
    { id: 'antimicrobial', label: 'Panduan NAG (Antimikrobial)', icon: Stethoscope, disabled: !drug.antimicrobial?.isAntimicrobial },
    { id: 'alternatives', label: 'Ubat Alternatif', icon: Layers, count: drug.alternativeDrugs?.length }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 max-w-full">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <button
          onClick={() => navigate('/formulari/dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-violet-700 transition-colors text-xs font-bold w-fit group"
        >
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-violet-300 group-hover:bg-violet-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-violet-700" />
          </div>
          <span>Kembali ke Senarai Formulari (FUKKM)</span>
        </button>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://myformulary.pharmacy.gov.my/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            title="Buka Laman Rasmi KKM MyFormulary"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Portal KKM</span>
          </a>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Cetak Monograf</span>
          </button>
          
          <button
            onClick={() => setIsInteractionModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Semak Interaksi Ubat</span>
          </button>
        </div>
      </div>

      {/* Main Clinical Drug Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 absolute top-0 left-0"></div>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-4 flex-1">
            {/* Category & Governance Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <PrescriberBadge category={drug.prescriberCategory} size="md" />
              <PoisonBadge poison={drug.poisonCategory} />
              
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold border border-slate-200">
                Skim: {drug.skimPerolehan}
              </span>

              {drug.pregnancyAndLactation && (
                <>
                  <PregnancyBadge
                    category={drug.pregnancyAndLactation.fdaCategory}
                    isContraindicated={drug.pregnancyAndLactation.isContraindicatedInPregnancy}
                  />
                  <LactationBadge
                    isContraindicated={drug.pregnancyAndLactation.isContraindicatedInLactation}
                  />
                </>
              )}

              {drug.neml === 'Y' && (
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-bold border border-emerald-200 flex items-center gap-1">
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>NEML (Ubat Penting)</span>
                </span>
              )}

              {drug.isHAM && (
                <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg font-bold border border-rose-200 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  <span>High Alert ({drug.hamRiskLevel})</span>
                </span>
              )}

              {drug.isLASA && (
                <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg font-bold border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>LASA (Keliru Bunyi/Rupa)</span>
                </span>
              )}

              {drug.antimicrobial?.isAntimicrobial && (
                <span className="text-xs bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg font-bold border border-teal-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>NAG {drug.antimicrobial.nagRestrictionTier}</span>
                </span>
              )}
            </div>

            {/* Drug Title & Brands */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {drug.isLASA && drug.tallManName ? (
                  <TallManLettering name={drug.tallManName} className="text-2xl sm:text-3xl lg:text-4xl" />
                ) : (
                  drug.genericName
                )}
              </h1>
              
              {drug.brandNames && drug.brandNames.length > 0 && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
                  <Pill className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  <span>Jenama / Nama Dagang: <strong className="text-slate-700 font-semibold">{drug.brandNames.join(' • ')}</strong></span>
                </div>
              )}
            </div>

            {/* Metadata Inset Metric Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kod ATC</span>
                <span className="text-xs font-mono font-bold text-slate-800">{drug.atcCode}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kod Ubat KKM (MDC)</span>
                <span className="text-xs font-mono font-bold text-slate-800 truncate block" title={drug.mohDrugCode}>
                  {drug.mohDrugCode || 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kelas Terapi (Therapeutic Class)</span>
                <span className="text-xs font-semibold text-slate-800 truncate block" title={drug.therapeuticClass}>
                  {drug.therapeuticClass}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Specialist Prescriber Restriction Alert (If applicable) */}
        {drug.psxRestrictions && (
          <div className="mt-6 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <strong className="font-bold text-amber-950 block uppercase tracking-wider text-[11px]">
                Sekatan Preskripsi & Kriteria Khas (KKM FUKKM):
              </strong>
              <p className="leading-relaxed whitespace-pre-line font-medium text-amber-900">
                {drug.psxRestrictions}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto border border-slate-200 shadow-2xs">
        {tabs.map(tab => {
          if (tab.disabled) return null
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-violet-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-md font-black">
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-violet-100 text-violet-700 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ================= TAB 1: OVERVIEW & INDICATIONS ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Approved Indications & Contraindications Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Approved Indications Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Indikasi Klinikal Diluluskan (FUKKM Ed. 4)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Kegunaan terapeutik berdaftar Kementerian Kesihatan Malaysia</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                {drug.indications.map((ind, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 leading-relaxed font-medium">
                    <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800">{ind}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contraindications Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Kontraindikasi (Contraindications)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Keadaan klinikal di mana ubat ini dilarang diberikan</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {drug.contraindications.map((con, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100 leading-relaxed font-medium text-rose-950">
                    <span className="w-5 h-5 rounded-lg bg-rose-200 text-rose-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✕
                    </span>
                    <span>{con}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formulations & Strengths in Facility */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Bentuk Sediaan & Kekuatan di Hospital / Klinik KKM
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Spesifikasi formulasi sediaan farmaseutikal</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Bentuk Dos (Dosage Form)</span>
                <strong className="text-sm text-slate-800 block">{drug.dosageForms.join(', ')}</strong>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Kekuatan Sediaan (Strengths)</span>
                <strong className="text-sm text-slate-800 block">{drug.strengths.join(', ')}</strong>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Laluan Pentadbiran (Routes)</span>
                <strong className="text-sm text-slate-800 block">{drug.administrationRoutes.join(', ')}</strong>
              </div>
            </div>
          </div>

          {/* Precautions & Adverse Drug Reactions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Precautions & Warnings */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Amaran & Langkah Berjaga-Jaga (Precautions)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Pemantauan klinikal dan amaran keselamatan pesakit</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {drug.cautionsAndWarnings.map((warn, idx) => (
                  <div key={idx} className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 text-amber-900 leading-relaxed font-medium">
                    • {warn}
                  </div>
                ))}
              </div>
            </div>

            {/* Adverse Reactions */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Kesan Sampingan Utama (Adverse Effects)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Reaksi ubat yang berpotensi berlaku</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {drug.sideEffects.map((side, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed font-medium">
                    • {side}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DOSING & ADMINISTRATION ================= */}
      {activeTab === 'dosing' && (() => {
        const elderlyOrRenalVal = drug.standardDosage?.elderlyOrRenal || ''
        const hasSplitRenalElderly = elderlyOrRenalVal.includes('[PELARASAN GANGGUAN BUAH PINGGANG')
        let renalText = ''
        let elderlyText = ''
        if (hasSplitRenalElderly) {
          const parts = elderlyOrRenalVal.split('[WARGA EMAS & GANGGUAN HATI (GERIATRIC & HEPATIC)]:')
          renalText = parts[0].replace('[PELARASAN GANGGUAN BUAH PINGGANG (RENAL DOSING)]:', '').trim()
          elderlyText = (parts[1] || '').trim()
        } else {
          renalText = elderlyOrRenalVal
        }

        return (
          <div className="space-y-6">
            {/* Adult Dosing Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Dos Dewasa Standard (Adult Clinical Regimen)
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">Rejimen terapeutik standard diluluskan Formulari Ubat KKM</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-violet-50 text-violet-700 px-3 py-1 rounded-xl border border-violet-200/60 hidden sm:inline-block">
                  Laluan: {drug.administrationRoutes.join(', ') || 'Oral'}
                </span>
              </div>
              <div className="p-4 sm:p-5 bg-violet-50/50 rounded-2xl border border-violet-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                {drug.standardDosage.adult}
              </div>
            </div>

            {/* Administration & Patient Intake Instructions Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Arahan Kaedah Pentadbiran & Pengambilan Ubat (Administration Guide)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Panduan praktikal cara pengambilan, masa dos, dan laluan pemberian</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="font-bold text-slate-900 block">Laluan & Cara Pengambilan:</span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {drug.administrationRoutes?.includes('Oral')
                      ? 'Ambil bersama segelas air penuh. Boleh diambil bersama atau selepas makan bagi mengurangkan ketidakselesaan perut/loya. Telan utuh tanpa menghancurkan tablet jika bersalut filem.'
                      : drug.administrationRoutes?.includes('Intravenous')
                      ? 'Diberikan secara suntikan IV bolus perlahan (>10-15 min) atau infusi titisan berterusan (30-60 min). Rujuk Tab Pelarutan & Bancuhan untuk protokol lengkap.'
                      : drug.administrationRoutes?.includes('Inhalation')
                      ? 'Gunakan mengikut teknik sedutan yang betul. Kumur mulut dengan air selepas sedutan ubat kortikosteroid.'
                      : 'Gunakan mengikut teknik pentadbiran klinikal yang disyorkan oleh pakar farmasi / perubatan.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="font-bold text-slate-900 block">Jadual & Ketepatan Masa Dos:</span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    Kekalkan selang masa yang sekata antara dos (cth: setiap 12 jam untuk dos 2 kali sehari / BD; setiap 8 jam untuk dos 3 kali sehari / TDS). Jangan gandakan dos jika terlupa.
                  </p>
                </div>
              </div>
            </div>

            {/* Paediatric Dosing Card */}
            {drug.standardDosage.pediatric && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Baby className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Dos Pediatrik, Bayi & Kanak-Kanak (Protokol Pediatrik KKM)
                      </h3>
                      <span className="text-[11px] text-blue-600 font-medium">Paediatric Protocols for Malaysian Hospitals (Ed. 4 & 5)</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl border border-blue-200 w-fit">
                    Pengiraan Berat Badan (mg/kg)
                  </span>
                </div>

                <div className="p-4 sm:p-5 bg-blue-50/40 rounded-2xl border border-blue-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                  {drug.standardDosage.pediatric}
                </div>
              </div>
            )}

            {/* Renal Clearance & Dose Adjustment Card */}
            {renalText && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-200/80 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Pelarasan Dos Gangguan Buah Pinggang (Renal Dosing Tiers)
                      </h3>
                      <span className="text-[11px] text-amber-700 font-medium">Berdasarkan Pelepasan Kreatinin (CrCl / eGFR mL/min) & Dialisis</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCrClCalculator(!showCrClCalculator)}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs w-fit"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{showCrClCalculator ? 'Tutup Kalkulator CrCl' : 'Kalkulator CrCl Cockcroft-Gault'}</span>
                  </button>
                </div>

                {/* Built-in Interactive Cockcroft-Gault CrCl Calculator */}
                {showCrClCalculator && (
                  <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-amber-700" />
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                          Kalkulator Pelepasan Kreatinin (Cockcroft-Gault Equation)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCalcAge('')
                          setCalcWeight('')
                          setCalcSerumCr('')
                        }}
                        className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                          Umur (Tahun)
                        </label>
                        <input
                          type="number"
                          placeholder="cth: 65"
                          value={calcAge}
                          onChange={e => setCalcAge(e.target.value)}
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                          Jantina
                        </label>
                        <select
                          value={calcGender}
                          onChange={e => setCalcGender(e.target.value as 'MALE' | 'FEMALE')}
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="MALE">Lelaki (x 1.0)</option>
                          <option value="FEMALE">Perempuan (x 0.85)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                          Berat Badan (kg)
                        </label>
                        <input
                          type="number"
                          placeholder="cth: 60"
                          value={calcWeight}
                          onChange={e => setCalcWeight(e.target.value)}
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                          Kreatinin Serum (µmol/L)
                        </label>
                        <input
                          type="number"
                          placeholder="cth: 150"
                          value={calcSerumCr}
                          onChange={e => setCalcSerumCr(e.target.value)}
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {crclResult && (
                      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${crclResult.color}`}>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                            Hasil Pelepasan Kreatinin Anggaran (eCrCl):
                          </span>
                          <span className="text-lg sm:text-xl font-extrabold block">
                            {crclResult.crcl} <span className="text-xs font-semibold">mL/min</span>
                          </span>
                        </div>
                        <div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/80 border border-current">
                          {crclResult.bracket}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 sm:p-5 bg-amber-50/40 rounded-2xl border border-amber-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                  {renalText}
                </div>
              </div>
            )}

            {/* Geriatric & Hepatic Impairment Card */}
            {elderlyText && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Panduan Warga Emas (Geriatrik) & Gangguan Fungsi Hati
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">Langkah keselamatan Beers Criteria & Klasifikasi Child-Pugh</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-orange-50/40 rounded-2xl border border-orange-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                  {elderlyText}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ================= TAB 3: PREGNANCY & LACTATION ================= */}
      {activeTab === 'pregnancy' && (
        <div className="space-y-6">
          {/* Main Pregnancy & Lactation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pregnancy Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Keselamatan Semasa Kehamilan (Pregnancy Safety)
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">Klasifikasi KKM & Garis Panduan Klinikal</span>
                  </div>
                </div>

                {drug.pregnancyAndLactation?.fdaCategory && (
                  <PregnancyBadge
                    category={drug.pregnancyAndLactation.fdaCategory}
                    isContraindicated={drug.pregnancyAndLactation.isContraindicatedInPregnancy}
                  />
                )}
              </div>

              {/* Definitive Verdict Banner */}
              {(() => {
                const status = drug.pregnancyAndLactation?.pregnancyStatus || (drug.pregnancyAndLactation?.isContraindicatedInPregnancy ? 'DILARANG' : 'WASPADA')
                const verdict = drug.pregnancyAndLactation?.pregnancyVerdict || (status === 'BOLEH' ? 'BOLEH DIGUNAKAN SEMASA HAMIL' : status === 'DILARANG' ? 'DILARANG / KONTRAINDIKASI' : 'PENGGUNAAN BERSYARAT (FAEDAH > RISIKO)')
                
                if (status === 'BOLEH') {
                  return (
                    <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-start gap-3 text-emerald-950">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <strong className="text-sm font-black uppercase tracking-wide block text-emerald-900">
                          {verdict}
                        </strong>
                        <p className="font-semibold text-emerald-800 leading-relaxed">
                          Status: Selamat digunakan mengikut dos klinikal yang disyorkan.
                        </p>
                      </div>
                    </div>
                  )
                } else if (status === 'DILARANG') {
                  return (
                    <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-start gap-3 text-rose-950">
                      <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <strong className="text-sm font-black uppercase tracking-wide block text-rose-900">
                          {verdict}
                        </strong>
                        <p className="font-semibold text-rose-800 leading-relaxed">
                          Status: Bahaya / Teratogenik. Elakkan penggunaan dan gunakan alternatif selamat.
                        </p>
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-start gap-3 text-amber-950">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <strong className="text-sm font-black uppercase tracking-wide block text-amber-900">
                          {verdict}
                        </strong>
                        <p className="font-semibold text-amber-800 leading-relaxed">
                          Status: Gunakan hanya jika tiada pilihan ubat lain dan faedah melebihi risiko.
                        </p>
                      </div>
                    </div>
                  )
                }
              })()}

              {/* Exact Clinical Reason */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Sebab Klinikal / Rasional Penggunaan Semasa Hamil:
                </span>
                <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                  {drug.pregnancyAndLactation?.pregnancyReason || drug.pregnancyAndLactation?.pregnancySummary}
                </p>
              </div>

              {/* Trimester 1 vs Trimester 2 & 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-1">
                  <span className="text-[10px] text-pink-700 font-bold uppercase tracking-wider block">
                    Trimester Pertama (1 - 12 Minggu)
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {drug.pregnancyAndLactation?.trimester1}
                  </p>
                </div>

                <div className="p-3.5 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-1">
                  <span className="text-[10px] text-pink-700 font-bold uppercase tracking-wider block">
                    Trimester Ke-2 & Ke-3 (13 - 40 Minggu)
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {drug.pregnancyAndLactation?.trimester2_3}
                  </p>
                </div>
              </div>

              {/* Concrete Safe Alternatives */}
              {drug.pregnancyAndLactation?.safeAlternativesInPregnancy && drug.pregnancyAndLactation.safeAlternativesInPregnancy.length > 0 && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Ubat Alternatif Selamat Semasa Mengandung:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {drug.pregnancyAndLactation.safeAlternativesInPregnancy.map((alt, idx) => (
                      <span key={idx} className="text-xs font-bold bg-white text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lactation & Breastfeeding Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <Baby className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Penyusuan Susu Ibu (Lactation & Breastfeeding)
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">Perkumuhan Susu & Keselamatan Bayi</span>
                  </div>
                </div>

                <LactationBadge
                  isContraindicated={drug.pregnancyAndLactation?.isContraindicatedInLactation}
                />
              </div>

              {/* Definitive Lactation Verdict Banner */}
              {(() => {
                const status = drug.pregnancyAndLactation?.lactationStatus || (drug.pregnancyAndLactation?.isContraindicatedInLactation ? 'DILARANG' : 'BOLEH')
                const verdict = drug.pregnancyAndLactation?.lactationVerdict || (status === 'BOLEH' ? 'BOLEH MENYUSU (SERASI)' : status === 'DILARANG' ? 'DILARANG MENYUSU' : 'WASPADA & PANTAU BAYI')
                
                if (status === 'BOLEH') {
                  return (
                    <div className="p-4 rounded-2xl bg-teal-50 border-2 border-teal-200 flex items-start gap-3 text-teal-950">
                      <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <strong className="text-sm font-black uppercase tracking-wide block text-teal-900">
                          {verdict}
                        </strong>
                        <p className="font-semibold text-teal-800 leading-relaxed">
                          Status: Serasi dengan penyusuan susu ibu.
                        </p>
                      </div>
                    </div>
                  )
                } else if (status === 'DILARANG') {
                  return (
                    <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-start gap-3 text-rose-950">
                      <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <strong className="text-sm font-black uppercase tracking-wide block text-rose-900">
                          {verdict}
                        </strong>
                        <p className="font-semibold text-rose-800 leading-relaxed">
                          Status: Dilarang menyusu. Gunakan susu formula gantian mengikut Garis Panduan KKM.
                        </p>
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-start gap-3 text-amber-950">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <strong className="text-sm font-black uppercase tracking-wide block text-amber-900">
                          {verdict}
                        </strong>
                        <p className="font-semibold text-amber-800 leading-relaxed">
                          Status: Ambil dos sejurus selepas menyusu dan pantau bayi dengan teliti.
                        </p>
                      </div>
                    </div>
                  )
                }
              })()}

              {/* Exact Lactation Reason */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Sebab Klinikal / Rasional Penyusuan:
                </span>
                <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                  {drug.pregnancyAndLactation?.lactationReason || drug.pregnancyAndLactation?.lactationSummary}
                </p>
              </div>

              {/* Infant Monitoring Advice */}
              <div className="p-4 bg-teal-50/40 rounded-2xl border border-teal-100 space-y-2 text-xs">
                <strong className="font-bold text-teal-950 block uppercase tracking-wider text-[10px]">
                  Panduan Pemantauan Bayi Menyusu:
                </strong>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {drug.pregnancyAndLactation?.infantMonitoringAdvice || 'Pantau tanda-tanda sedasi, perubahan corak penyusuan, atau kesukaran bangun untuk menyusu.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: SAFETY & INTERACTIONS ================= */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* HAM Precautions Panel */}
          {drug.isHAM && drug.hamCategory && drug.hamRiskLevel && (
            <HamPrecautionsPanel
              hamCategory={drug.hamCategory}
              riskLevel={drug.hamRiskLevel}
              precautions={drug.hamPrecautions}
              drugName={drug.genericName}
            />
          )}

          {/* LASA Information */}
          {drug.isLASA && drug.lasaPairs && drug.lasaPairs.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pasangan Ubat LASA (Look-Alike Sound-Alike) Berisiko Kekeliruan:
                </h3>
              </div>

              <div className="space-y-3">
                {drug.lasaPairs.map((pair, idx) => (
                  <div key={idx} className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-bold">Ubat Ini: <TallManLettering name={pair.tallManThis} /></span>
                      <span className="text-slate-400 font-bold">KELIRU DENGAN</span>
                      <span className="font-bold">Ubat Lain: <TallManLettering name={pair.tallManOther} /></span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900">Risiko Klinikal: </strong>{pair.clinicalRiskWarning}
                    </p>

                    <div className="text-xs text-amber-900 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                      <strong>Strategi Pengasingan Wad: </strong>{pair.separationStrategy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drug-Drug Interactions */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Interaksi Ubat Utama ({drug.interactions.length}):
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Kesan tindak balas farmakodinamik / farmakokinetik</span>
              </div>
              <button
                onClick={() => setIsInteractionModalOpen(true)}
                className="px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
              >
                <span>+ Buka Pemeriksa Interaksi</span>
              </button>
            </div>

            <div className="space-y-3">
              {drug.interactions.map((inter, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-slate-900">Interaksi dengan: {inter.interactingDrug}</strong>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      inter.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : inter.severity === 'MAJOR' ? 'bg-amber-600 text-white' : 'bg-slate-600 text-white'
                    }`}>
                      {inter.severity}
                    </span>
                  </div>
                  <p className="text-slate-700"><strong>Kesan: </strong>{inter.effect}</p>
                  <p className="text-violet-900 bg-violet-50 p-2.5 rounded-xl border border-violet-100">
                    <strong>Tindakan Pengurusan: </strong>{inter.management}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: DILUTION PROTOCOL ================= */}
      {activeTab === 'dilution' && (
        <DilutionCard
          reconstitution={drug.reconstitution}
          dilution={drug.dilution}
          drugName={drug.genericName}
        />
      )}

      {/* ================= TAB 5: SHELF LIFE & STABILITY ================= */}
      {activeTab === 'shelflife' && (
        <ShelfLifeWidget shelfLife={drug.shelfLife} dosageForms={drug.dosageForms} />
      )}

      {/* ================= TAB 6: ANTIMICROBIAL (NAG 2024) ================= */}
      {activeTab === 'antimicrobial' && drug.antimicrobial && (() => {
        const relevantGuidelines = getGuidelinesForDrug(drug.genericName, drug.antimicrobial.antimicrobialClass)
        const guidelinesToDisplay = relevantGuidelines.length > 0 ? relevantGuidelines : NAG_GUIDELINES.slice(0, 3)

        return (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            {/* Tab Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Garis Panduan Antimikrobial Kebangsaan (NAG 2024 Edisi Ke-4)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelas Farmakologi: <strong className="text-slate-800">{drug.antimicrobial.antimicrobialClass}</strong>
                </p>
              </div>
              <NAGBadge tier={drug.antimicrobial.nagRestrictionTier} size="md" />
            </div>

            {/* CLINICAL INDICATION TREATMENT PLANS (PELAN RAWATAN MENGIKUT INDIKASI) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Pelan Rawatan Klinikal Mengikut Indikasi NAG 2024</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {guidelinesToDisplay.length} Indikasi Disyorkan
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Rejimen dos tepat, tempoh terapi, dan kriteria penukaran oral (*Step-down*) berasaskan bukti KKM
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {guidelinesToDisplay.map((gl) => (
                  <div key={gl.id} className="bg-slate-50/80 rounded-2xl border-2 border-slate-200/80 p-5 space-y-4 shadow-2xs">
                    {/* Header: Body system and Condition Name */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-200">
                          {gl.bodySystem}
                        </span>
                        <h5 className="text-sm font-black text-slate-900">
                          {gl.conditionName}
                        </h5>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {gl.evidenceLevel}
                      </span>
                    </div>

                    {/* First Line & Second Line Regimens */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 text-xs">
                      {/* First-line therapy */}
                      <div className="bg-emerald-50/70 border-2 border-emerald-200/80 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                            ★ Rawatan Barisan Pertama (1st-Line)
                          </span>
                          <span className="font-bold text-emerald-900 text-[11px]">
                            Tempoh: {gl.firstLineTherapy.durationDays}
                          </span>
                        </div>
                        <div className="text-sm font-black text-emerald-950">
                          {gl.firstLineTherapy.regimen}
                        </div>
                        <p className="text-emerald-900 font-medium leading-relaxed bg-white/70 p-2 rounded border border-emerald-100">
                          <strong>Dos & Cara Pemberian: </strong>{gl.firstLineTherapy.routeAndDose}
                        </p>
                        {gl.firstLineTherapy.remarks && (
                          <p className="text-[11px] text-emerald-800 italic">
                            * {gl.firstLineTherapy.remarks}
                          </p>
                        )}
                      </div>

                      {/* Second-line */}
                      {gl.secondLineTherapy && (
                        <div className="bg-amber-50/60 border-2 border-amber-200/80 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-amber-600 text-white">
                              Rawatan Barisan Kedua (2nd-Line)
                            </span>
                            <span className="font-bold text-amber-900 text-[11px]">
                              Tempoh: {gl.secondLineTherapy.durationDays}
                            </span>
                          </div>
                          <div className="text-sm font-black text-amber-950">
                            {gl.secondLineTherapy.regimen}
                          </div>
                          <p className="text-amber-900 font-medium leading-relaxed bg-white/70 p-2 rounded border border-amber-100">
                            <strong>Dos & Cara Pemberian: </strong>{gl.secondLineTherapy.routeAndDose}
                          </p>
                          {gl.secondLineTherapy.remarks && (
                            <p className="text-[11px] text-amber-800 italic">
                              * {gl.secondLineTherapy.remarks}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Penicillin Allergy Option if present */}
                    {gl.penicillinAllergyOption && (
                      <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Pilihan Sekiranya Alahan Penicillin (Penicillin Allergy Option):</span>
                        </div>
                        <p className="text-rose-950 font-bold">{gl.penicillinAllergyOption.regimen}</p>
                        <p className="text-rose-800 text-[11px]">{gl.penicillinAllergyOption.routeAndDose}</p>
                      </div>
                    )}

                    {/* Oral Step-Down Option (KKM AMS Step-down Protocol) */}
                    {gl.oralStepDownOption && (
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-950 flex items-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                            Protokol Penukaran Rawatan Oral KKM (Oral Step-Down):
                          </span>
                          <span className="text-[10px] bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded font-bold">
                            Klinikal Stabil & Afebrile
                          </span>
                        </div>
                        <p className="text-blue-950 font-black text-xs">
                          {gl.oralStepDownOption.regimen}
                        </p>
                        <p className="text-blue-800 text-[11px] leading-relaxed">
                          <strong>Kriteria Penukaran: </strong>{gl.oralStepDownOption.criteria}
                        </p>
                      </div>
                    )}

                    {/* Pathogens & AMS Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                          Patogen Utama Sasaran:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {gl.primaryPathogens.map((pathogen, pIdx) => (
                            <span key={pIdx} className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                              {pathogen}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                          Nota Kawalan Antimikrobial (AMS):
                        </span>
                        <ul className="space-y-1 text-[11px] text-slate-600 font-medium">
                          {gl.amsNotes.map((note, nIdx) => (
                            <li key={nIdx}>• {note}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SPECTRUM & STEP-DOWN CRITERIA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">
                  Spektrum Aktiviti Utama:
                </h4>
                <ul className="space-y-1 text-xs text-emerald-800 font-medium">
                  {drug.antimicrobial.spectrumOfActivity?.map((sp, idx) => (
                    <li key={idx}>• {sp}</li>
                  )) || <li>• Sesuai mengikut ujian sensitiviti kultur (C&S)</li>}
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Syarat Pertukaran IV ke Oral (IV to Oral Switch):
                </h4>
                <ul className="space-y-1 text-xs text-slate-700 font-medium">
                  {drug.antimicrobial.ivToOralSwitchCriteria?.map((sw, idx) => (
                    <li key={idx}>• {sw}</li>
                  )) || <li>• Pesakit tiada demam &gt; 24 jam & toleran oral</li>}
                </ul>
              </div>
            </div>

            {/* Renal Dose Adjustment Table */}
            {drug.antimicrobial.renalDoseAdjustment && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Jadual Pelarasan Dos Mengikut Fungsi Buah Pinggang (Renal Adjustment):
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3">CrCl Normal (&gt;50 mL/min)</th>
                        <th className="p-3">CrCl 30-50 mL/min</th>
                        <th className="p-3">CrCl 10-30 mL/min</th>
                        <th className="p-3">CrCl &lt; 10 mL/min</th>
                        <th className="p-3">Hemodialisis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-slate-50">
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">{drug.antimicrobial.renalDoseAdjustment.normalCrCl}</td>
                        <td className="p-3 text-slate-700">{drug.antimicrobial.renalDoseAdjustment.crCl30_50}</td>
                        <td className="p-3 text-slate-700">{drug.antimicrobial.renalDoseAdjustment.crCl10_30}</td>
                        <td className="p-3 text-slate-700">{drug.antimicrobial.renalDoseAdjustment.crClLess10}</td>
                        <td className="p-3 text-indigo-700 font-semibold">{drug.antimicrobial.renalDoseAdjustment.hemodialysis}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {drug.antimicrobial.specialistApprovalRequired && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                <strong>Keperluan Kelulusan Pakar: </strong>{drug.antimicrobial.specialistApprovalRequired}
              </div>
            )}
          </div>
        )
      })()}

      {/* ================= TAB 7: ALTERNATIVE THERAPIES ================= */}
      {activeTab === 'alternatives' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Ubat Alternatif Terapeutik & Pilihan Gantian FUKKM ({drug.alternativeDrugs.length})
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilihan penggantian sekunder sekiranya kehabisan stok, isu rantaian bekalan, atau rintangan klinikal
              </p>
            </div>
            <span className="text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1 rounded-full">
              Piawaian Terapi KKM
            </span>
          </div>

          {drug.alternativeDrugs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              Tiada ubat alternatif khusus didaftarkan untuk ubat ini. Sila rujuk Pegawai Farmasi Klinikal atau Pakar Perubatan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drug.alternativeDrugs.map((alt, idx) => {
                const target = allDrugs.find(d => d.id === alt.drugId) || allDrugs.find(d => alt.drugName.toLowerCase().includes(d.genericName.toLowerCase()))
                
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (target) {
                        navigate(`/formulari/drug/${target.id}`)
                      }
                    }}
                    className="p-5 bg-slate-50/90 hover:bg-violet-50/50 rounded-2xl border border-slate-200/90 hover:border-violet-300 transition-all cursor-pointer space-y-3 group shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <strong className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors block">
                          {alt.drugName}
                        </strong>
                        <span className="inline-block mt-1 text-[11px] font-black tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                          {alt.therapeuticEquivalence}
                        </span>
                      </div>
                      <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold shrink-0">
                        Kat {alt.prescriberCategory}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/70 text-xs text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900 font-semibold block mb-0.5">Rasional Klinikal & Padanan:</strong>
                      {alt.reasonForChoice}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Status: {alt.stockStatus}</span>
                      </div>
                      <span className="text-violet-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                        Buka Monograf <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Interaction Modal */}
      <DrugInteractionModal
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        allDrugs={allDrugs}
        initialDrug={drug}
      />
    </div>
  )
}

export default DrugDetailPage

