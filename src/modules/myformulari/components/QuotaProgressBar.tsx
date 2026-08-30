import React from 'react'
import { AlertCircle, CheckCircle2, TrendingDown, Clock } from 'lucide-react'

interface QuotaProgressBarProps {
  monthlyQuota: number
  quotaUsed: number
  quotaRemaining: number
  unit: string
  lowStockThreshold: number
  isLowStock: boolean
  isCriticalShortage?: boolean
  estimatedRunOutDays?: number
  compact?: boolean
}

export const QuotaProgressBar: React.FC<QuotaProgressBarProps> = ({
  monthlyQuota,
  quotaUsed,
  quotaRemaining,
  unit,
  lowStockThreshold,
  isLowStock,
  isCriticalShortage,
  estimatedRunOutDays,
  compact = false
}) => {
  const percentUsed = Math.min(100, Math.round((quotaUsed / Math.max(1, monthlyQuota)) * 100))
  const percentRemaining = Math.max(0, 100 - percentUsed)

  const getStatusColor = () => {
    if (isCriticalShortage || percentRemaining <= 10) {
      return {
        bg: 'bg-rose-500',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-800'
      }
    }
    if (isLowStock || percentRemaining <= 25) {
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800'
      }
    }
    return {
      bg: 'bg-emerald-500',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800'
    }
  }

  const status = getStatusColor()

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500">Baki Kuota:</span>
          <span className={`font-bold ${status.text}`}>
            {quotaRemaining} / {monthlyQuota} {unit} ({percentRemaining}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${status.bg} transition-all duration-500 rounded-full`}
            style={{ width: `${percentRemaining}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-xl border ${status.border} bg-white shadow-xs`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
            Status Kuota Bulanan
          </div>
          <div className="text-xl font-bold text-slate-900 flex items-baseline gap-2">
            <span>{quotaRemaining.toLocaleString()} {unit}</span>
            <span className="text-xs text-slate-500 font-normal">
              tinggal daripada kuota {monthlyQuota.toLocaleString()} {unit}
            </span>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${status.badge}`}>
          {isCriticalShortage ? (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>KRITIKAL HABIS</span>
            </>
          ) : isLowStock ? (
            <>
              <TrendingDown className="w-3.5 h-3.5" />
              <span>STOK RENDAH</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>KUOTA STABIL</span>
            </>
          )}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
        <div
          className={`h-full ${status.bg} transition-all duration-500 rounded-full`}
          style={{ width: `${percentRemaining}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span>Digunakan:</span>
          <strong className="text-slate-700">{quotaUsed.toLocaleString()} ({percentUsed}%)</strong>
        </span>
        
        {estimatedRunOutDays !== undefined && (
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Anggaran Habis: ~{estimatedRunOutDays} Hari</span>
          </span>
        )}
      </div>

      {isLowStock && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-amber-700 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Di bawah ambang paras rendah ({lowStockThreshold} {unit})</span>
          </span>
          <span className="text-slate-500">Sila semak ubat alternatif</span>
        </div>
      )}
    </div>
  )
}
