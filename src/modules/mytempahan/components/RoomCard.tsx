// src/modules/mytempahan/components/RoomCard.tsx
// Professional Hospital Facility Room Card with Dark/Light Support & Real KKM Spec Badges

import React from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  MapPin,
  Calendar,
  Clock,
  Tv,
  Projector,
  Mic,
  Video,
  Wifi,
  Wind,
  Layers,
  ChevronRight,
  ShieldAlert,
  Building2
} from 'lucide-react'
import { Room } from '@/shared/types/mytempahan'
import { cn } from '@/lib/utils'

export interface RoomCardProps {
  room: Room
  isCurrentlyOccupied?: boolean
  currentEventName?: string
  currentEventEnd?: string
  onBook: (roomId: string) => void
  onViewSchedule: (roomId: string) => void
}

const AMENITY_LABEL_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  projector: { label: 'Projektor HD', icon: Projector },
  smart_tv: { label: 'Smart TV', icon: Tv },
  video_conferencing: { label: 'Zoom / VC', icon: Video },
  pa_sound_system: { label: 'Sistem PA', icon: Mic },
  wireless_mic: { label: 'Mic Wireless', icon: Mic },
  wifi_kkm: { label: 'WiFi KKM', icon: Wifi },
  aircond: { label: 'Aircond', icon: Wind },
  podium: { label: 'Podium', icon: Layers }
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isCurrentlyOccupied = false,
  currentEventName,
  currentEventEnd,
  onBook,
  onViewSchedule
}) => {
  const isMaintenance = room.status === 'maintenance'
  const isInactive = room.status === 'inactive'

  // Refined Enterprise Status Badges
  let statusBadgeStyle = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  let statusText = 'Tersedia'
  let dotColor = 'bg-emerald-500'

  if (isMaintenance) {
    statusBadgeStyle = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    statusText = 'Penyelenggaraan'
    dotColor = 'bg-amber-500'
  } else if (isInactive) {
    statusBadgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    statusText = 'Tidak Aktif'
    dotColor = 'bg-slate-400'
  } else if (isCurrentlyOccupied) {
    statusBadgeStyle = 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
    statusText = 'Sedang Digunakan'
    dotColor = 'bg-rose-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all flex flex-col justify-between overflow-hidden text-slate-900 dark:text-slate-100"
    >
      <div className="p-5 space-y-3.5">
        {/* Top Header: Code, Floor & Live Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              {room.room_code}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {room.floor_level}
            </span>
          </div>

          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
              statusBadgeStyle
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', dotColor, !isMaintenance && !isInactive ? 'animate-pulse' : '')} />
            {statusText}
          </span>
        </div>

        {/* Room Title & Location */}
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug">
            {room.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{room.location}</span>
          </p>
        </div>

        {/* In-Session Notice (if occupied) */}
        {isCurrentlyOccupied && currentEventName && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300">
            <div className="font-semibold truncate">{currentEventName}</div>
            {currentEventEnd && (
              <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Selesai pada {currentEventEnd}
              </div>
            )}
          </div>
        )}

        {/* Capacity & Turnaround Buffer */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Kapasiti</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {room.capacity} Pax Maks
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Buffer Setup</div>
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                {room.setup_buffer_minutes || 15}m / {room.cleanup_buffer_minutes || 15}m
              </div>
            </div>
          </div>
        </div>

        {/* Equipment & Amenity Chips */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
            Peralatan & Fasiliti
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(room.amenities || []).slice(0, 4).map(amenity => {
              const info = AMENITY_LABEL_MAP[amenity]
              const Icon = info?.icon || Tv
              const label = info?.label || amenity.replace(/_/g, ' ')

              return (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200/60 dark:border-slate-700/60"
                >
                  <Icon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  {label}
                </span>
              )
            })}
            {(room.amenities || []).length > 4 && (
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                +{room.amenities.length - 4} lagi
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <button
          onClick={() => onViewSchedule(room.id)}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Semak Jadual
        </button>

        <button
          onClick={() => onBook(room.id)}
          disabled={isMaintenance || isInactive}
          className={cn(
            'flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs',
            isMaintenance || isInactive
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-transparent'
              : 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold active:scale-[0.98]'
          )}
        >
          Tempah Ruang
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
