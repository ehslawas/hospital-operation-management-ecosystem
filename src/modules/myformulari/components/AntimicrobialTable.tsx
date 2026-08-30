import React from 'react'
import { ShieldCheck, AlertCircle, Clock, FileText, CheckCircle2 } from 'lucide-react'
import { NAGInfectionGuideline } from '../types/formulariTypes'

interface AntimicrobialTableProps {
  guidelines: NAGInfectionGuideline[]
  filterSystem?: string
  filterSetting?: string
}

export const AntimicrobialTable: React.FC<AntimicrobialTableProps> = ({
  guidelines,
  filterSystem,
  filterSetting
}) => {
  const filtered = guidelines.filter(g => {
    if (filterSystem && filterSystem !== 'ALL' && g.bodySystem !== filterSystem) return false
    if (filterSetting && filterSetting !== 'ALL' && g.setting !== filterSetting) return false
    return true
  })

  if (filtered.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
        <p className="font-medium text-slate-700">Tiada panduan ditemui untuk kriteria pilihan</p>
        <p className="text-xs text-slate-500 mt-1">Sila tukar penapis sistem badan atau persekitaran jangkitan.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {filtered.map(item => (
        <div
          key={item.id}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 transition-all"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  {item.bodySystem}
                </span>
                <span className="text-[10px] font-semibold bg-emerald-900/60 px-2 py-0.5 rounded-md text-emerald-200">
                  {item.setting}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                {item.conditionName}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs bg-emerald-500/30 text-emerald-100 px-2.5 py-1 rounded-full font-medium border border-emerald-400/30">
                {item.evidenceLevel}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Common Pathogens */}
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-1.5">
              <strong className="text-slate-900">Patogen Utama:</strong>
              {item.primaryPathogens.map((p, idx) => (
                <span key={idx} className="italic text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {p}
                </span>
              ))}
            </div>

            {/* Treatment Protocols Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 1. First Line */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Rawatan Lini Pertama (First-Line)
                  </h4>
                </div>
                <div className="text-sm font-bold text-emerald-950 mb-1.5">
                  {item.firstLineTherapy.regimen}
                </div>
                <p className="text-xs text-emerald-800 mb-2 leading-relaxed">
                  {item.firstLineTherapy.routeAndDose}
                </p>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-900 border-t border-emerald-200/60 pt-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tempoh: {item.firstLineTherapy.durationDays}</span>
                </div>
                {item.firstLineTherapy.remarks && (
                  <p className="text-[11px] text-emerald-700 mt-1 italic">
                    {item.firstLineTherapy.remarks}
                  </p>
                )}
              </div>

              {/* 2. Second Line */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Rawatan Lini Kedua (Alternative)
                  </h4>
                </div>
                <div className="text-sm font-bold text-blue-950 mb-1.5">
                  {item.secondLineTherapy.regimen}
                </div>
                <p className="text-xs text-blue-800 mb-2 leading-relaxed">
                  {item.secondLineTherapy.routeAndDose}
                </p>
                <div className="flex items-center gap-1 text-xs font-semibold text-blue-900 border-t border-blue-200/60 pt-2">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tempoh: {item.secondLineTherapy.durationDays}</span>
                </div>
                {item.secondLineTherapy.remarks && (
                  <p className="text-[11px] text-blue-700 mt-1 italic">
                    {item.secondLineTherapy.remarks}
                  </p>
                )}
              </div>

              {/* 3. Penicillin Allergy */}
              {item.penicillinAllergyOption ? (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Jika Alahan Penisilin (Penicillin Allergy)
                    </h4>
                  </div>
                  <div className="text-sm font-bold text-amber-950 mb-1.5">
                    {item.penicillinAllergyOption.regimen}
                  </div>
                  <p className="text-xs text-amber-800 mb-2 leading-relaxed">
                    {item.penicillinAllergyOption.routeAndDose}
                  </p>
                  {item.penicillinAllergyOption.remarks && (
                    <p className="text-[11px] text-amber-700 border-t border-amber-200/60 pt-2 italic">
                      {item.penicillinAllergyOption.remarks}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  Rujuk Pakar ID untuk kes alahan penisilin teruk.
                </div>
              )}
            </div>

            {/* AMS Clinical Stewardship Notes */}
            {item.amsNotes && item.amsNotes.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
                <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Nota Antimicrobial Stewardship (AMS) KKM:</span>
                </h5>
                <ul className="space-y-1 list-disc list-inside text-slate-600">
                  {item.amsNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
