// src/modules/myperolehan/pages/tabs/PembangunanBudgetTab.tsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HardHat,
  Plus,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { BudgetProgressBar } from '../../components/BudgetProgressBar'
import type {
  BudgetHierarchySummary,
  AdminPembangunan
} from '@/shared/types/myperolehan'
import { Button } from '@/components/ui'

interface PembangunanBudgetTabProps {
  hierarchy: BudgetHierarchySummary[]
  pembangunan: AdminPembangunan[]
  onOpenAddWarrant: () => void
  onOpenCreatePO: (programCode?: string) => void
}

export const PembangunanBudgetTab: React.FC<PembangunanBudgetTabProps> = ({
  hierarchy,
  pembangunan,
  onOpenAddWarrant,
  onOpenCreatePO
}) => {
  const [expandedObjek, setExpandedObjek] = useState<Record<string, boolean>>({
    '01100 117 4002': true,
    '01200 117 1002': true,
    '00105 106 1105': true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const toggleExpand = (objekCode: string) => {
    setExpandedObjek((prev) => ({ ...prev, [objekCode]: !prev[objekCode] }))
  }

  const p42Program = hierarchy.find((h) => h.programCode === 'P42' || h.budgetType === 'pembangunan')

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Bajet Pembangunan (P42)</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                DEVELOPMENT & LEASING
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan Sewaan Peralatan Perubatan (Leasing 3.0), Konsesi PSH & LDP
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={onOpenAddWarrant}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1.5 shadow-sm text-xs rounded-xl px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Peruntukan P42</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenCreatePO('P42')}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl px-4 py-2 shadow-sm"
          >
            + Cipta PO P42
          </Button>
        </div>
      </div>

      {/* 2. Main P42 Executive Overview Card */}
      {p42Program && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] bg-white border-2 border-slate-100 p-6 shadow-sm space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-black font-mono rounded-lg border border-amber-200">
                  PROGRAM P42
                </span>
                <h3 className="text-lg font-black text-slate-900">Program Pembangunan Hospital</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Peruntukan Projek Pembangunan, Perjanjian Sewaan Mesin & Konsesi Sokongan
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="px-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Peruntukan</span>
                <span className="text-sm font-black text-slate-900 font-mono">{formatCurrency(p42Program.totalAllocated)}</span>
              </div>
              <div className="px-3 border-x border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Komitmen & Belanja</span>
                <span className="text-sm font-black text-amber-600 font-mono">
                  {formatCurrency(p42Program.committedAmount + p42Program.actualSpent)}
                </span>
              </div>
              <div className="px-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Baki Bersih</span>
                <span className="text-sm font-black text-emerald-600 font-mono">
                  {formatCurrency(p42Program.remainingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <BudgetProgressBar
            utilizationRate={p42Program.utilizationRate}
            spentAmount={p42Program.committedAmount + p42Program.actualSpent}
            totalAmount={p42Program.totalAllocated}
            height="h-2.5"
          />

          {/* Breakdown of the 3 Key Pembangunan Objek */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Pecahan Komponen P42 (Sewaan Peralatan, Konsesi PSH & Latihan)
            </h4>

            <div className="space-y-3">
              {p42Program.objekSummaries.map((obj) => {
                const isExpanded = expandedObjek[obj.objekCode] ?? true
                return (
                  <div
                    key={obj.objekCode}
                    className="rounded-2xl bg-slate-50/70 border border-slate-200/80 overflow-hidden transition-all"
                  >
                    {/* Head bar */}
                    <div
                      onClick={() => toggleExpand(obj.objekCode)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white text-amber-700 rounded-xl font-mono text-xs font-bold border border-slate-200 shadow-xs">
                          {obj.objekCode}
                        </div>
                        <div>
                          <h5 className="text-xs sm:text-sm font-black text-slate-900">{obj.objekLabel}</h5>
                          <span className="text-[10px] text-slate-500">
                            {obj.kategoriSummaries.length} Kategori Di bawah Objek Ini
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] text-slate-500 block font-mono">
                            Baki: <strong className="text-emerald-600">{formatCurrency(obj.remainingBalance)}</strong>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Peruntukan: {formatCurrency(obj.totalAllocated)}
                          </span>
                        </div>

                        <div className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Table of Sub-categories */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-white p-4 space-y-2.5">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                              <th className="py-2.5 px-3">Kod Kategori</th>
                              <th className="py-2.5 px-3">Keterangan / Butiran Peralatan</th>
                              <th className="py-2.5 px-3 text-right">Peruntukan</th>
                              <th className="py-2.5 px-3 text-right">Komitmen / Belanja</th>
                              <th className="py-2.5 px-3 text-right">Baki Bersih</th>
                              <th className="py-2.5 px-3 text-center w-28">% Guna</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {obj.kategoriSummaries.map((kat) => (
                              <tr key={kat.kategoriCode} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 font-mono font-bold text-amber-700">
                                  {kat.kategoriCode}
                                </td>
                                <td className="py-2.5 px-3 text-slate-800 font-semibold">
                                  {kat.kategoriLabel}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-semibold">
                                  {formatCurrency(kat.totalAllocated)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-amber-600 font-semibold">
                                  {formatCurrency(kat.committedAmount + kat.actualSpent)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                                  {formatCurrency(kat.remainingBalance)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="font-mono text-[11px] font-bold text-slate-700">
                                    {kat.utilizationRate}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Live Pembangunan Transaction Records (admin_pembangunan) */}
      <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Rekod Waran Pembangunan P42 (Pembangunan Ledger)
              </h3>
              <p className="text-[11px] text-slate-500">
                Senarai kemasukan peruntukan pembangunan & perjanjian sewaan
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-500 font-bold">{pembangunan.length} Rekod Pembangunan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-y border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">No. Dokumen Waran</th>
                <th className="py-2.5 px-3">Tarikh</th>
                <th className="py-2.5 px-3">Kod Objek</th>
                <th className="py-2.5 px-3">Kod Kategori</th>
                <th className="py-2.5 px-3">Keterangan / Butiran Projek</th>
                <th className="py-2.5 px-3 text-right">Jumlah Peruntukan (RM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pembangunan.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.document_no}</td>
                  <td className="py-2.5 px-3 text-slate-500">{p.pembangunan_date}</td>
                  <td className="py-2.5 px-3 font-mono text-amber-700 font-semibold">{p.objek_code}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">{p.kategori_code}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">{p.description || '-'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600">
                    {formatCurrency(Number(p.amount) || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
