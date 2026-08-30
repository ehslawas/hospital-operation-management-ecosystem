import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Pill, 
  Droplets, 
  ShieldAlert, 
  AlertTriangle, 
  ChevronRight, 
  Activity, 
  Layers, 
  ArrowRight,
  TrendingDown,
  Building2,
  Clock
} from 'lucide-react'
import { DrugEntry } from '../types/formulariTypes'
import { PrescriberBadge, HAMBadge, LASABadge, PoisonBadge, NAGBadge } from './DrugBadge'
import { TallManLettering } from './TallManLettering'
import { QuotaProgressBar } from './QuotaProgressBar'

interface DrugCardProps {
  drug: DrugEntry
  onSelect?: (drug: DrugEntry) => void
}

export const DrugCard: React.FC<DrugCardProps> = ({ drug, onSelect }) => {
  const navigate = useNavigate()

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(drug)
    } else {
      navigate(`/formulari/drug/${drug.id}`)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col justify-between overflow-hidden relative ${
        drug.isHAM 
          ? 'border-rose-200 hover:border-rose-400' 
          : drug.isLASA
          ? 'border-amber-200 hover:border-amber-400'
          : 'border-slate-200 hover:border-violet-400'
      }`}
    >
      {/* Top Color Accent Line */}
      <div className={`h-1.5 w-full ${
        drug.isHAM 
          ? 'bg-gradient-to-r from-rose-500 to-red-600' 
          : drug.isLASA
          ? 'bg-gradient-to-r from-amber-400 to-orange-500'
          : 'bg-gradient-to-r from-violet-500 to-indigo-600'
      }`} />

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <PrescriberBadge category={drug.prescriberCategory} size="sm" />
            {drug.isHAM && <HAMBadge riskLevel={drug.hamRiskLevel} size="sm" />}
            {drug.isLASA && <LASABadge size="sm" pairCount={drug.lasaPairs?.length} />}
            {drug.antimicrobial?.isAntimicrobial && <NAGBadge tier={drug.antimicrobial.nagRestrictionTier} size="sm" />}
            <PoisonBadge poison={drug.poisonCategory} size="sm" />
          </div>

          {/* Drug Title */}
          <div className="mb-1">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-violet-600 transition-colors leading-snug">
              {drug.isLASA && drug.tallManName ? (
                <TallManLettering name={drug.tallManName} />
              ) : (
                drug.genericName
              )}
            </h3>
            
            {drug.brandNames && drug.brandNames.length > 0 && (
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {drug.brandNames.join(' • ')}
              </p>
            )}
          </div>

          {/* Therapeutic Class & Strengths */}
          <div className="mt-2 text-xs space-y-1">
            <div className="flex items-center gap-1 text-slate-600">
              <span className="font-medium text-slate-400">Kelas:</span>
              <span className="text-slate-700 font-medium truncate">{drug.therapeuticClass}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500 pt-1">
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                ATC: {drug.atcCode}
              </span>
              {drug.strengths.slice(0, 2).map((st, idx) => (
                <span key={idx} className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-medium">
                  {st}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Protocols Quick Indicators */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          {/* Quota Bar (Compact) */}
          <QuotaProgressBar
            monthlyQuota={drug.quota.monthlyQuota}
            quotaUsed={drug.quota.quotaUsed}
            quotaRemaining={drug.quota.quotaRemaining}
            unit={drug.quota.unit}
            lowStockThreshold={drug.quota.lowStockThreshold}
            isLowStock={drug.quota.isLowStock}
            compact={true}
          />

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-2">
              {drug.dilution?.isApplicable && (
                <span className="flex items-center gap-1 text-teal-700 font-medium text-[11px]" title="Ada protokol pelarutan IV">
                  <Droplets className="w-3.5 h-3.5 text-teal-600" />
                  <span>IV Dilusi</span>
                </span>
              )}
              {drug.reconstitution?.isApplicable && (
                <span className="flex items-center gap-1 text-indigo-700 font-medium text-[11px]" title="Ada protokol rekonstitusi vial">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Rekonstitusi</span>
                </span>
              )}
            </div>

            <span className="text-violet-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold text-xs">
              <span>Perincian</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
