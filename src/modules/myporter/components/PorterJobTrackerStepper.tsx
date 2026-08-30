// src/modules/myporter/components/PorterJobTrackerStepper.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Truck, 
  PackageCheck, 
  UserCheck,
  AlertCircle
} from 'lucide-react'
import type { PorterJobStatus, PorterJobRequest } from '@/shared/types/myporter'

interface StepConfig {
  key: string
  label: string
  desc: string
  icon: React.ElementType
}

const STEPS: StepConfig[] = [
  { key: 'broadcasting', label: 'Pesanan Dibuat', desc: 'Mencari PPK berdekatan', icon: Clock },
  { key: 'accepted', label: 'PPK Ditugaskan', desc: 'PPK menuju ke lokasi ambil', icon: UserCheck },
  { key: 'at_pickup', label: 'Tiba di Asal', desc: 'Pengesahan kargo/pesakit', icon: MapPin },
  { key: 'in_transit', label: 'Dalam Perjalanan', desc: 'Sedang menuju ke destinasi', icon: Truck },
  { key: 'pending_receiver_confirmation', label: 'Tiba di Destinasi', desc: 'Menunggu pengesahan penerima', icon: PackageCheck },
  { key: 'completed', label: 'Selesai', desc: 'Penyerahan disahkan', icon: CheckCircle }
]

const getStepIndex = (status: PorterJobStatus): number => {
  switch (status) {
    case 'draft':
    case 'broadcasting':
      return 0
    case 'accepted':
      return 1
    case 'at_pickup':
      return 2
    case 'in_transit':
      return 3
    case 'at_destination':
    case 'pending_receiver_confirmation':
      return 4
    case 'completed':
      return 5
    case 'cancelled':
    case 'disputed':
    default:
      return 0
  }
}

interface Props {
  job: PorterJobRequest
  compact?: boolean
}

export const PorterJobTrackerStepper: React.FC<Props> = ({ job, compact = false }) => {
  const currentStepIdx = getStepIndex(job.status)
  const isCancelled = job.status === 'cancelled'
  const isDisputed = job.status === 'disputed'

  if (isCancelled) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <div className="text-sm">
          <p className="font-bold">Permohonan Ini Telah Dibatalkan</p>
          {job.cancellation_reason && <p className="text-xs text-rose-600 mt-0.5">Sebab: {job.cancellation_reason}</p>}
        </div>
      </div>
    )
  }

  if (isDisputed) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="text-sm">
          <p className="font-bold">Tugasan Dalam Status Pertikaian (Dispute)</p>
          <p className="text-xs text-amber-700 mt-0.5">Penyelia sedang menyemak ketidakpadanan kargo/lokasi.</p>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700">{STEPS[currentStepIdx]?.label}</span>
          <span className="text-slate-400 font-mono">Fasa {currentStepIdx + 1} / {STEPS.length}</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentStepIdx + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${currentStepIdx === 5 ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-500 to-blue-600'}`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4">
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
        
        {/* Progress Fill Line */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-sky-500 to-blue-600 -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIdx
          const isCurrent = idx === currentStepIdx
          const Icon = step.icon

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 group">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDone 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : isCurrent 
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg scale-110' 
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="text-center mt-2 max-w-[110px]">
                <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-blue-600' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="md:hidden space-y-4">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIdx
          const isCurrent = idx === currentStepIdx
          const Icon = step.icon

          return (
            <div key={step.key} className="flex items-start gap-3 relative">
              {idx < STEPS.length - 1 && (
                <div 
                  className={`absolute left-4 top-8 bottom-0 w-0.5 -translate-x-1/2 ${
                    isDone ? 'bg-emerald-400' : 'bg-slate-200'
                  }`} 
                />
              )}
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                  isDone 
                    ? 'bg-emerald-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                      : 'bg-slate-100 border border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-bold ${isCurrent ? 'text-blue-600 font-extrabold' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full animate-pulse">
                      Semasa
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
