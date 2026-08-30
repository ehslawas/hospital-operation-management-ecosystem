// src/modules/myperolehan/components/BudgetSummaryCards.tsx
import React from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  Clock,
  CheckCircle2,
  PieChart,
  ArrowRight,
  Building,
  HardHat,
  ChevronRight
} from 'lucide-react'
import type { OverallPerolehanKPIs } from '@/shared/types/myperolehan'

interface BudgetSummaryCardsProps {
  kpis: OverallPerolehanKPIs
  onSelectType?: (type: 'pengurusan' | 'pembangunan' | 'all') => void
}

export const BudgetSummaryCards: React.FC<BudgetSummaryCardsProps> = ({
  kpis,
  onSelectType
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const cards = [
    {
      id: 'allocation',
      title: 'Jumlah Peruntukan',
      subtitle: `Tahun ${kpis.fiscalYear}`,
      amount: formatCurrency(kpis.totalAllocatedGrand),
      secondaryInfo: `Pengurusan: ${formatCurrency(kpis.totalAllocatedPengurusan)}`,
      icon: Wallet,
      tag: 'FINANCIAL',
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white',
      borderColor: 'border-2 border-slate-100 hover:border-blue-200 hover:shadow-blue-100/20',
      actionText: 'RINGKASAN'
    },
    {
      id: 'committed',
      title: 'Komitmen Pesanan (PO)',
      subtitle: `${kpis.activePOCount} Pesanan Aktif`,
      amount: formatCurrency(kpis.totalCommitted),
      secondaryInfo: `${kpis.pendingApprovalCount} Menunggu Kelulusan`,
      icon: Clock,
      tag: 'COMMITTED',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white',
      borderColor: 'border-2 border-slate-100 hover:border-amber-200 hover:shadow-amber-100/20',
      actionText: 'PESANAN'
    },
    {
      id: 'spent',
      title: 'Perbelanjaan Sebenar',
      subtitle: 'Selesai Dibayar / Baucar',
      amount: formatCurrency(kpis.totalActualSpent),
      secondaryInfo: `Kadar Guna: ${kpis.overallUtilizationRate}%`,
      icon: CheckCircle2,
      tag: 'ACTUAL SPENT',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white',
      borderColor: 'border-2 border-slate-100 hover:border-emerald-200 hover:shadow-emerald-100/20',
      actionText: 'LEJAR'
    },
    {
      id: 'balance',
      title: 'Baki Bersih Semasa',
      subtitle: 'Peruntukan Bebas',
      amount: formatCurrency(kpis.totalNetBalance),
      secondaryInfo: `${(100 - kpis.overallUtilizationRate).toFixed(1)}% Baki Tersedia`,
      icon: PieChart,
      tag: 'BALANCE',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white',
      borderColor: 'border-2 border-slate-100 hover:border-indigo-200 hover:shadow-indigo-100/20',
      actionText: 'BAKI'
    }
  ]

  return (
    <div className="space-y-6">
      {/* 4 Main Summary Cards matching MyWarrant operations style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`group bg-white ${card.borderColor} p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[200px] shadow-sm`}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 ${card.iconBg}`}>
                  <Icon className="w-5.5 h-5.5" />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                  {card.tag}
                </span>
              </div>

              <div className="space-y-1 mt-4 relative z-10">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight group-hover:text-indigo-600 transition-colors">
                  {card.amount}
                </h3>
                <p className="text-slate-500 font-medium text-xs truncate">
                  {card.secondaryInfo}
                </p>
              </div>

              <div className="flex items-center text-slate-400 group-hover:text-indigo-600 text-[10px] font-black tracking-widest gap-1 pt-3 border-t border-slate-100 mt-4 relative z-10 transition-colors">
                {card.subtitle.toUpperCase()}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Dual Category Mini-Banners (Pengurusan vs Pembangunan) matching MyWarrant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => onSelectType && onSelectType('pengurusan')}
          className="group cursor-pointer rounded-[2rem] bg-white border-2 border-slate-100 hover:border-blue-200 p-6 hover:shadow-xl hover:shadow-blue-100/10 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Bajet Pengurusan
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold border border-blue-200">
                  020200 & 022300
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pengurusan Hospital & Dietetik / Sajian Pesakit
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peruntukan</p>
            <p className="text-lg font-black text-slate-900 font-mono">
              {formatCurrency(kpis.totalAllocatedPengurusan)}
            </p>
            <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 justify-end mt-1">
              PERINCIAN <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => onSelectType && onSelectType('pembangunan')}
          className="group cursor-pointer rounded-[2rem] bg-white border-2 border-slate-100 hover:border-amber-200 p-6 hover:shadow-xl hover:shadow-amber-100/10 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Bajet Pembangunan
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-bold border border-amber-200">
                  P42
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sewaan Peralatan (Leasing 3.0), Konsesi PSH & LDP
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peruntukan</p>
            <p className="text-lg font-black text-slate-900 font-mono">
              {formatCurrency(kpis.totalAllocatedPembangunan)}
            </p>
            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 justify-end mt-1">
              PERINCIAN <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
