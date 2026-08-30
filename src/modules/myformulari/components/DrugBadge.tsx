import React from 'react'
import { AlertTriangle, ShieldAlert, Sparkles, Droplets, Info, Lock, Flame } from 'lucide-react'
import { PrescriberCategory, PoisonCategory, HAMRiskLevel } from '../types/formulariTypes'

interface PrescriberBadgeProps {
  category: PrescriberCategory
  size?: 'sm' | 'md'
}

export const PrescriberBadge: React.FC<PrescriberBadgeProps> = ({ category, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'
  
  const getStyle = (cat: PrescriberCategory) => {
    switch (cat) {
      case 'A*':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
      case 'A':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold'
      case 'A/KK':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-medium'
      case 'B':
        return 'bg-teal-100 text-teal-800 border-teal-300 font-medium'
      case 'C':
      case 'C+':
        return 'bg-slate-100 text-slate-700 border-slate-300 font-normal'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getLabel = (cat: PrescriberCategory) => {
    switch (cat) {
      case 'A*':
        return 'Kategori A* (Pakar Sahaja)'
      case 'A':
        return 'Kategori A (Pegawai Perubatan Hospital)'
      case 'A/KK':
        return 'Kategori A/KK (Hospital & Klinik Kesihatan)'
      case 'B':
        return 'Kategori B (Semua Pegawai Perubatan)'
      case 'C':
      case 'C+':
        return `Kategori ${cat} (Komuniti / Paramedik)`
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border shadow-sm ${sizeClasses} ${getStyle(category)}`}
      title={getLabel(category)}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      <span>Kat {category}</span>
    </span>
  )
}

interface HAMBadgeProps {
  riskLevel?: HAMRiskLevel
  category?: string
  showText?: boolean
  size?: 'sm' | 'md'
}

export const HAMBadge: React.FC<HAMBadgeProps> = ({
  riskLevel = 'HIGH',
  category,
  showText = true,
  size = 'md'
}) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'
  
  const getRiskStyle = () => {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'bg-rose-600 text-white border-rose-700 animate-pulse'
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-300'
      default:
        return 'bg-orange-100 text-orange-800 border-orange-300'
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold border shadow-sm ${sizeClasses} ${getRiskStyle()}`}
      title={`High Alert Medication (HAM) - ${category || 'Kategori Risiko Tinggi KKM'}`}
    >
      <Flame className="w-3.5 h-3.5" />
      {showText && <span>HAM {riskLevel === 'CRITICAL' ? 'KRITIKAL' : 'HIGH ALERT'}</span>}
    </span>
  )
}

interface LASABadgeProps {
  size?: 'sm' | 'md'
  pairCount?: number
}

export const LASABadge: React.FC<LASABadgeProps> = ({ size = 'md', pairCount }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm ${sizeClasses}`}
      title="Look-Alike Sound-Alike (LASA) - Amalkan TALL-Man Lettering dan Semakan Berganda"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      <span>LASA{pairCount && pairCount > 1 ? ` (${pairCount})` : ''}</span>
    </span>
  )
}

interface PoisonBadgeProps {
  poison: PoisonCategory
  size?: 'sm' | 'md'
}

export const PoisonBadge: React.FC<PoisonBadgeProps> = ({ poison, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'

  const getStyle = () => {
    switch (poison) {
      case 'Dangerous Drug (DD)':
        return 'bg-red-950 text-red-200 border-red-800 font-bold'
      case 'Psychotropic (PS)':
        return 'bg-pink-900 text-pink-100 border-pink-700 font-bold'
      case 'Group B':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Group C':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border text-center ${sizeClasses} ${getStyle()}`}>
      {(poison === 'Dangerous Drug (DD)' || poison === 'Psychotropic (PS)') && <Lock className="w-3 h-3" />}
      <span>{poison}</span>
    </span>
  )
}

interface NAGBadgeProps {
  tier?: 'Free (F)' | 'Restricted (R)' | 'Reserve (Rsv)'
  size?: 'sm' | 'md'
}

export const NAGBadge: React.FC<NAGBadgeProps> = ({ tier, size = 'md' }) => {
  if (!tier) return null
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'

  const getStyle = () => {
    switch (tier) {
      case 'Reserve (Rsv)':
        return 'bg-red-100 text-red-800 border-red-300 font-bold'
      case 'Restricted (R)':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold'
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium'
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border shadow-sm ${sizeClasses} ${getStyle()}`}
      title="National Antimicrobial Guideline (NAG 2024) Restriction Tier"
    >
      <ShieldAlert className="w-3.5 h-3.5" />
      <span>NAG: {tier}</span>
    </span>
  )
}

interface PregnancyBadgeProps {
  category?: 'A' | 'B' | 'C' | 'D' | 'X' | 'N/A'
  isContraindicated?: boolean
  size?: 'sm' | 'md'
}

export const PregnancyBadge: React.FC<PregnancyBadgeProps> = ({ category = 'C', isContraindicated, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'

  const getStyle = () => {
    if (isContraindicated || category === 'X') {
      return 'bg-rose-900 text-rose-100 border-rose-700 font-black ring-1 ring-rose-500'
    }
    switch (category) {
      case 'A':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
      case 'B':
        return 'bg-teal-100 text-teal-900 border-teal-300 font-bold'
      case 'C':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
      case 'D':
        return 'bg-orange-100 text-orange-950 border-orange-300 font-bold'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 font-medium'
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border shadow-2xs ${sizeClasses} ${getStyle()}`}
      title={`Kategori Keselamatan Kehamilan (FDA Category ${category})${isContraindicated ? ' - KONTRAINDIKASI SEMASA KEHAMILAN' : ''}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      <span>Hamil: Kat {category}</span>
      {isContraindicated && <span className="text-[9px] bg-rose-700 text-white px-1 rounded uppercase font-extrabold ml-0.5">Bahaya</span>}
    </span>
  )
}

interface LactationBadgeProps {
  isContraindicated?: boolean
  size?: 'sm' | 'md'
}

export const LactationBadge: React.FC<LactationBadgeProps> = ({ isContraindicated, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'

  if (isContraindicated) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs ${sizeClasses}`}
        title="Penyusuan: KONTRAINDIKASI / Tidak Disyorkan semasa menyusukan bayi"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
        <span>Susu Ibu: Dilarang</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs ${sizeClasses}`}
      title="Penyusuan: Serasi / Boleh digunakan dengan pemantauan klinikal"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
      <span>Susu Ibu: Serasi</span>
    </span>
  )
}

