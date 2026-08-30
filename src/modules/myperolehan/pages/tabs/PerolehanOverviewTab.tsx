// src/modules/myperolehan/pages/tabs/PerolehanOverviewTab.tsx
import React from 'react'
import { motion } from 'framer-motion'
import {
  Building,
  HardHat,
  Plus,
  ChevronRight,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { BudgetSummaryCards } from '../../components/BudgetSummaryCards'
import { BudgetProgressBar } from '../../components/BudgetProgressBar'
import type {
  OverallPerolehanKPIs,
  BudgetHierarchySummary,
  AdminPurchaseOrder
} from '@/shared/types/myperolehan'
import { Button, Badge } from '@/components/ui'

interface PerolehanOverviewTabProps {
  kpis: OverallPerolehanKPIs
  hierarchy: BudgetHierarchySummary[]
  recentOrders: AdminPurchaseOrder[]
  onOpenCreatePO: () => void
  onOpenAddWarrant: () => void
  onTabChange: (tab: string) => void
}

export const PerolehanOverviewTab: React.FC<PerolehanOverviewTabProps> = ({
  kpis,
  hierarchy,
  recentOrders,
  onOpenCreatePO,
  onOpenAddWarrant,
  onTabChange
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Draf</span>
      case 'pending_approval':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Menunggu Kelulusan</span>
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Diluluskan (LPO)</span>
      case 'ordered':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Dalam Pesanan</span>
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Selesai Dibayar</span>
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Dibatalkan</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{status}</span>
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Main KPI Cards */}
      <BudgetSummaryCards
        kpis={kpis}
        onSelectType={(type) => {
          if (type === 'pengurusan') onTabChange('pengurusan')
          else if (type === 'pembangunan') onTabChange('pembangunan')
        }}
      />

      {/* 2. Visual Budget Allocation & Progress by Program */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pengurusan Column (020200 & 022300) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] bg-white border-2 border-slate-100 p-6 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Prestasi Bajet Pengurusan</h3>
                <p className="text-xs text-slate-500 font-mono">020200 Pengurusan & 022300 Dietetik</p>
              </div>
            </div>
            <button
              onClick={() => onTabChange('pengurusan')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
            >
              <span>Perincian</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Program List under Pengurusan */}
          <div className="space-y-4">
            {hierarchy
              .filter((h) => h.budgetType === 'warrant')
              .map((prog) => (
                <div
                  key={prog.programCode}
                  className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4.5 space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black font-mono text-blue-700 uppercase tracking-widest px-2 py-0.5 bg-blue-100/60 rounded border border-blue-200">
                        KOD {prog.programCode}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 mt-1">{prog.programLabel}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Baki Bersih</span>
                      <span className="text-sm font-black text-emerald-600 font-mono">
                        {formatCurrency(prog.remainingBalance)}
                      </span>
                    </div>
                  </div>

                  <BudgetProgressBar
                    utilizationRate={prog.utilizationRate}
                    spentAmount={prog.committedAmount + prog.actualSpent}
                    totalAmount={prog.totalAllocated}
                  />

                  {/* Objek Quick Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60">
                    {prog.objekSummaries.map((obj) => (
                      <div key={obj.objekCode} className="text-[11px] bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                        <span className="text-slate-500 font-mono font-bold block text-[10px]">{obj.objekCode}</span>
                        <span className="text-slate-800 font-semibold truncate block">{obj.objekLabel}</span>
                        <span className="text-indigo-600 font-mono font-bold text-[10px]">{formatCurrency(obj.totalAllocated)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Pembangunan Column (P42) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] bg-white border-2 border-slate-100 p-6 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Prestasi Bajet Pembangunan</h3>
                <p className="text-xs text-slate-500 font-mono">P42 Projek Pembangunan & Sewaan Peralatan</p>
              </div>
            </div>
            <button
              onClick={() => onTabChange('pembangunan')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group"
            >
              <span>Perincian</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Program List under Pembangunan */}
          <div className="space-y-4">
            {hierarchy
              .filter((h) => h.budgetType === 'pembangunan')
              .map((prog) => (
                <div
                  key={prog.programCode}
                  className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4.5 space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black font-mono text-amber-700 uppercase tracking-widest px-2 py-0.5 bg-amber-100/60 rounded border border-amber-200">
                        KOD {prog.programCode}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 mt-1">{prog.programLabel}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Baki Bersih</span>
                      <span className="text-sm font-black text-emerald-600 font-mono">
                        {formatCurrency(prog.remainingBalance)}
                      </span>
                    </div>
                  </div>

                  <BudgetProgressBar
                    utilizationRate={prog.utilizationRate}
                    spentAmount={prog.committedAmount + prog.actualSpent}
                    totalAmount={prog.totalAllocated}
                  />

                  {/* Objek Quick Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60">
                    {prog.objekSummaries.map((obj) => (
                      <div key={obj.objekCode} className="text-[11px] bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                        <span className="text-slate-500 font-mono font-bold block text-[10px]">{obj.objekCode}</span>
                        <span className="text-slate-800 font-semibold truncate block">{obj.objekLabel}</span>
                        <span className="text-amber-700 font-mono font-bold text-[10px]">{formatCurrency(obj.totalAllocated)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* 3. Live Financial Feed & Recent Transactions */}
      <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Pesanan & Transaksi Terkini</h3>
              <p className="text-xs text-slate-500">Status pesanan tempatan & aliran perbelanjaan semasa</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={onOpenCreatePO}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-sm text-xs rounded-xl px-3.5 py-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cipta Pesanan (PO)</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTabChange('orders')}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl px-3.5 py-2"
            >
              Lihat Semua PO
            </Button>
          </div>
        </div>

        {/* Table of Recent Orders */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-y border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">No. Pesanan (PO)</th>
                <th className="py-3 px-3">Tarikh</th>
                <th className="py-3 px-3">Jenis Bajet</th>
                <th className="py-3 px-3">Kod Program / Objek</th>
                <th className="py-3 px-3">Pembekal</th>
                <th className="py-3 px-3 text-right">Jumlah (RM)</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{order.order_number}</td>
                    <td className="py-3.5 px-3 text-slate-500">{order.order_date}</td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        order.budget_type === 'pembangunan'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {order.budget_type === 'pembangunan' ? 'P42 Pembangunan' : 'Pengurusan'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-700 font-semibold">
                      {order.program_code} - {order.objek_code}
                    </td>
                    <td className="py-3.5 px-3 text-slate-800 font-medium">
                      {order.supplier?.company_name || 'Pembekal Terbuka'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-indigo-600">
                      {formatCurrency(Number(order.total_amount) || 0)}
                    </td>
                    <td className="py-3.5 px-3 text-center">{getStatusBadge(order.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Tiada rekod pesanan lagi. Klik butang "Cipta Pesanan (PO)" untuk memulakan transaksi baharu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
