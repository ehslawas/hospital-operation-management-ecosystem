// src/modules/myporter/components/PorterRadarAlertModal.tsx
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  MapPin, 
  ArrowRight, 
  Check, 
  X, 
  Clock, 
  AlertTriangle,
  Shield,
  Volume2
} from 'lucide-react'
import type { PorterJobRequest } from '@/shared/types/myporter'
import { UrgencyBadge } from './PorterStatusBadge'
import { soundAlert } from './PorterAudioAlert'

interface Props {
  job: PorterJobRequest | null
  isOpen: boolean
  onAccept: (jobId: string) => void
  onDecline: (jobId: string) => void
}

export const PorterRadarAlertModal: React.FC<Props> = ({
  job,
  isOpen,
  onAccept,
  onDecline
}) => {
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    if (isOpen && job) {
      if (job.urgency === 'stat') {
        soundAlert.playStatEmergencyAlert()
      } else {
        soundAlert.playNotificationChime()
      }
      setCountdown(30)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            onDecline(job.id)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isOpen, job?.id])

  if (!isOpen || !job) return null

  const isStat = job.urgency === 'stat'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
          className={`w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border-2 ${
            isStat ? 'border-rose-500 shadow-rose-500/20' : 'border-sky-500 shadow-sky-500/20'
          }`}
        >
          {/* Header with Radar Wave */}
          <div className={`p-6 text-white relative overflow-hidden ${
            isStat ? 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600' : 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700'
          }`}>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative">
                  <span className="absolute inset-0 rounded-2xl bg-white/30 animate-ping" />
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">TUGASAN RADAR BAHARU!</h3>
                  <p className="text-xs text-white/80">Sila respon dalam tempoh masa ditetapkan</p>
                </div>
              </div>

              {/* Countdown Circular Ring */}
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 font-mono font-extrabold text-xl">
                <span>{countdown}s</span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            {/* Urgency & Task Type */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori Tugas</span>
                <h4 className="text-base font-extrabold text-slate-800">{job.sub_category || job.category}</h4>
              </div>
              <UrgencyBadge urgency={job.urgency} />
            </div>

            {/* Origin & Destination Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  A
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Lokasi Ambil (Asal)</p>
                  <p className="text-sm font-extrabold text-slate-800">{job.origin_department_name}</p>
                  <p className="text-xs text-slate-500">{job.origin_location_details}</p>
                </div>
              </div>

              <div className="pl-3 border-l-2 border-dashed border-slate-300 ml-3 h-4" />

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  B
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-rose-600 uppercase">Lokasi Hantar (Destinasi)</p>
                  <p className="text-sm font-extrabold text-slate-800">{job.destination_department_name}</p>
                  <p className="text-xs text-slate-500">{job.destination_location_details}</p>
                </div>
              </div>
            </div>

            {/* Special Precautions / Patient Info */}
            {job.patient_data && (
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-1 text-slate-700">
                <p className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  Pesakit: {job.patient_data.patient_name} ({job.patient_data.patient_rn})
                </p>
                <p className="text-slate-600">
                  Mod: <span className="font-semibold uppercase">{job.patient_data.mobility_type}</span> | Oksigen: <span className="font-semibold">{job.patient_data.o2_dependent ? `Ya (${job.patient_data.o2_flow_rate_lpm} L/min)` : 'Tiada'}</span>
                </p>
              </div>
            )}

            {job.notes && (
              <p className="text-xs text-slate-500 bg-amber-50/60 border border-amber-200/60 rounded-xl p-3">
                <span className="font-bold text-amber-900">Nota Pemohon:</span> {job.notes}
              </p>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => onDecline(job.id)}
                className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Tolak Tugas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundAlert.playSuccessTone()
                  onAccept(job.id)
                }}
                className={`w-full py-3.5 px-4 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 text-sm ${
                  isStat 
                    ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 shadow-rose-500/30' 
                    : 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 shadow-blue-500/30'
                }`}
              >
                <Check className="w-5 h-5" />
                <span>TERIMA TUGAS</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
