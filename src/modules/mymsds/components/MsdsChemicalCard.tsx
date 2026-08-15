import React from 'react'
import { Eye, Building2, Layers, FlaskConical } from 'lucide-react'
import { MSDSEntry } from '../data/msdsData'
import { GhsPictogram } from './GhsPictogram'

interface MsdsChemicalCardProps {
  item: MSDSEntry
  onViewClick: (item: MSDSEntry) => void
}

export const MsdsChemicalCard: React.FC<MsdsChemicalCardProps> = ({ item, onViewClick }) => {
  const getHazardBadgeColor = (hazard: string) => {
    if (hazard.includes('Hakisan')) return 'bg-rose-500/10 text-rose-300 border-rose-500/20'
    if (hazard.includes('Mudah Terbakar')) return 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    if (hazard.includes('Toksik')) return 'bg-purple-500/10 text-purple-300 border-purple-500/20'
    if (hazard.includes('Pengoksida')) return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
    if (hazard.includes('Gas Tertekanan')) return 'bg-sky-500/10 text-sky-300 border-sky-500/20'
    return 'bg-slate-800 text-slate-300 border-slate-700'
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Aktif') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
    if (status === 'Perlu Semakan') return 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    return 'bg-rose-500/10 text-rose-300 border-rose-500/20'
  }

  return (
    <div className="group relative flex flex-col justify-between p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all shadow-sm">
      <div className="space-y-3">
        {/* Top Header: ID & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
            {item.id}
          </span>
          <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border ${getStatusBadge(item.status)}`}>
            {item.status}
          </span>
        </div>

        {/* Chemical Title & Formula */}
        <div>
          <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
            {item.name}
          </h3>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
            <span>{item.malayName}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-semibold">{item.chemicalFormula}</span>
          </div>
        </div>

        {/* Details snippet */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-800/60 text-slate-400">
          <div>
            CAS: <span className="text-slate-200 font-bold">{item.casNumber}</span>
          </div>
          <div>
            Kod SW: <span className="text-cyan-400 font-bold">{item.scheduledWasteCode}</span>
          </div>
        </div>

        {/* Hazard Class & GHS Icons */}
        <div className="space-y-2 pt-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${getHazardBadgeColor(item.hazardClass)}`}>
            <FlaskConical className="w-3 h-3" />
            {item.hazardClass}
          </span>

          <div className="flex items-center gap-1 pt-0.5">
            {item.ghsCodes.map((code) => (
              <GhsPictogram key={code} code={code} size="sm" />
            ))}
          </div>
        </div>

        {/* Department */}
        <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{item.departments[0]}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 font-mono truncate">{item.location}</span>
        <button
          onClick={() => onViewClick(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 text-slate-200 hover:text-slate-950 font-semibold text-xs transition-all border border-slate-700 hover:border-emerald-400"
        >
          <Eye className="w-3.5 h-3.5" />
          Lihat MSDS
        </button>
      </div>
    </div>
  )
}

export default MsdsChemicalCard
