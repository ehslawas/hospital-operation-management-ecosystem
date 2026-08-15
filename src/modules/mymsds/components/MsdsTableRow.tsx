import React from 'react'
import { Eye, Building2, Layers } from 'lucide-react'
import { MSDSEntry } from '../data/msdsData'
import { GhsPictogram } from './GhsPictogram'

interface MsdsTableRowProps {
  item: MSDSEntry
  onViewClick: (item: MSDSEntry) => void
}

export const MsdsTableRow: React.FC<MsdsTableRowProps> = ({ item, onViewClick }) => {
  const getHazardBadge = (hazard: string) => {
    if (hazard.includes('Hakisan')) {
      return 'bg-rose-500/10 text-rose-300 border-rose-500/20'
    }
    if (hazard.includes('Mudah Terbakar')) {
      return 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    }
    if (hazard.includes('Toksik')) {
      return 'bg-purple-500/10 text-purple-300 border-purple-500/20'
    }
    if (hazard.includes('Pengoksida')) {
      return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
    }
    if (hazard.includes('Gas Tertekanan')) {
      return 'bg-sky-500/10 text-sky-300 border-sky-500/20'
    }
    return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Aktif') {
      return {
        dot: 'bg-emerald-400',
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
      }
    }
    if (status === 'Perlu Semakan') {
      return {
        dot: 'bg-amber-400 animate-pulse',
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
      }
    }
    return {
      dot: 'bg-rose-400 animate-ping',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20'
    }
  }

  const statusStyle = getStatusBadge(item.status)

  return (
    <tr className="group hover:bg-slate-800/50 transition-colors border-b border-slate-800/60 text-xs">
      {/* ID & CAS */}
      <td className="py-3 px-4 align-middle whitespace-nowrap">
        <div className="font-mono text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">
          {item.id}
        </div>
        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
          CAS: <span className="text-slate-300">{item.casNumber}</span>
        </div>
      </td>

      {/* Name & Malay Name */}
      <td className="py-3 px-4 align-middle min-w-[220px]">
        <div className="font-semibold text-slate-100 group-hover:text-white text-sm">
          {item.name}
        </div>
        <div className="text-slate-400 text-xs font-mono mt-0.5 flex items-center gap-2">
          <span>{item.malayName}</span>
          <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
          <span className="text-slate-400 font-semibold">{item.chemicalFormula}</span>
        </div>
      </td>

      {/* Category */}
      <td className="py-3 px-4 align-middle whitespace-nowrap">
        <div className="text-slate-300 text-xs font-medium">{item.category}</div>
        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
          <Building2 className="w-3 h-3 text-slate-500" />
          <span className="truncate max-w-[140px]">{item.departments[0]}</span>
        </div>
      </td>

      {/* Hazard Class & GHS */}
      <td className="py-3 px-4 align-middle">
        <div className="flex flex-col gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border w-fit ${getHazardBadge(
              item.hazardClass
            )}`}
          >
            {item.hazardClass}
          </span>
          <div className="flex items-center gap-1">
            {item.ghsCodes.map((code) => (
              <GhsPictogram key={code} code={code} size="sm" />
            ))}
          </div>
        </div>
      </td>

      {/* Scheduled Waste & Location */}
      <td className="py-3 px-4 align-middle whitespace-nowrap font-mono text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-300 font-bold">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{item.scheduledWasteCode}</span>
        </div>
        <div className="text-slate-400 text-[11px] mt-0.5 truncate max-w-[150px] font-sans">
          {item.location}
        </div>
      </td>

      {/* Status Badge */}
      <td className="py-3 px-4 align-middle whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusStyle.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {item.status}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
        <button
          onClick={() => onViewClick(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 text-slate-200 hover:text-slate-950 font-semibold text-xs transition-all border border-slate-700 hover:border-emerald-400 shadow-sm"
        >
          <Eye className="w-3.5 h-3.5" />
          Semak MSDS
        </button>
      </td>
    </tr>
  )
}

export default MsdsTableRow
