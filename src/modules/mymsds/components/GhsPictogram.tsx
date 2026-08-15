import React from 'react'
import {
  Flame,
  Skull,
  Biohazard,
  AlertTriangle,
  Activity,
  Wind,
  Droplet,
  Zap,
  Globe,
  Sparkles,
  ShieldAlert
} from 'lucide-react'

interface GhsPictogramProps {
  code: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export const GHS_INFO: Record<string, { label: string; malayLabel: string; icon: React.ElementType; color: string }> = {
  GHS01: {
    label: 'Explosive',
    malayLabel: 'Bahan Meletup',
    icon: Sparkles,
    color: 'text-amber-500 border-amber-500/40 bg-amber-500/10'
  },
  GHS02: {
    label: 'Flammable',
    malayLabel: 'Mudah Terbakar',
    icon: Flame,
    color: 'text-red-500 border-red-500/40 bg-red-500/10'
  },
  GHS03: {
    label: 'Oxidizing',
    malayLabel: 'Pengoksida',
    icon: Zap,
    color: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10'
  },
  GHS04: {
    label: 'Gas Under Pressure',
    malayLabel: 'Gas Tertekanan',
    icon: Wind,
    color: 'text-sky-400 border-sky-400/40 bg-sky-400/10'
  },
  GHS05: {
    label: 'Corrosive',
    malayLabel: 'Hakisan Tisu',
    icon: Droplet,
    color: 'text-rose-400 border-rose-400/40 bg-rose-400/10'
  },
  GHS06: {
    label: 'Toxic / Fatal',
    malayLabel: 'Toksik / Membawa Maut',
    icon: Skull,
    color: 'text-purple-400 border-purple-400/40 bg-purple-400/10'
  },
  GHS07: {
    label: 'Harmful / Irritant',
    malayLabel: 'Bahaya / Kerengsaan',
    icon: AlertTriangle,
    color: 'text-amber-400 border-amber-400/40 bg-amber-400/10'
  },
  GHS08: {
    label: 'Health Hazard / Carcinogen',
    malayLabel: 'Bahaya Kesihatan / Karsinogen',
    icon: Activity,
    color: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10'
  },
  GHS09: {
    label: 'Environmental Hazard',
    malayLabel: 'Bahaya Persekitaran',
    icon: Globe,
    color: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10'
  }
}

export const GhsPictogram: React.FC<GhsPictogramProps> = ({ code, size = 'md', showLabel = false }) => {
  const info = GHS_INFO[code] || {
    label: 'Hazard',
    malayLabel: 'Bahaya',
    icon: ShieldAlert,
    color: 'text-slate-400 border-slate-700 bg-slate-800'
  }

  const IconComp = info.icon

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs p-1',
    md: 'w-8 h-8 text-sm p-1.5',
    lg: 'w-11 h-11 text-base p-2'
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={`relative flex items-center justify-center rounded-lg border shadow-sm transition-transform hover:scale-105 ${sizeClasses[size]} ${info.color}`}
        title={`${code}: ${info.label} (${info.malayLabel})`}
      >
        <IconComp className={iconSizes[size]} />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-300">
          {info.malayLabel} <span className="text-[10px] text-slate-500 font-mono">({code})</span>
        </span>
      )}
    </div>
  )
}

export default GhsPictogram
