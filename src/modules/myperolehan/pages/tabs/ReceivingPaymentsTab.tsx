// src/modules/myperolehan/pages/tabs/ReceivingPaymentsTab.tsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Truck,
  CheckCircle2,
  DollarSign
} from 'lucide-react'
import type {
  AdminLPO,
  AdminReceivingRecord,
  AdminPayment
} from '@/shared/types/myperolehan'
import { Button } from '@/components/ui'

interface ReceivingPaymentsTabProps {
  lpos: AdminLPO[]
  receivingRecords: AdminReceivingRecord[]
  payments: AdminPayment[]
  onOpenRecordPayment: (lpo: AdminLPO) => void
  onRefresh: () => void
}

export const ReceivingPaymentsTab: React.FC<ReceivingPaymentsTabProps> = ({
  lpos,
  receivingRecords,
  payments,
  onOpenRecordPayment,
  onRefresh
}) => {
  const [subTab, setSubTab] = useState<'payments' | 'receiving'>('payments')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Eligible LPOs for payment (approved LPOs that do not have full payments yet)
  const payableLPOs = lpos.filter((l) => l.status !== 'cancelled')

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Terimaan Barangan & Baucar Bayaran (EFT)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekod pengesahan nota hantaran (DO) dan kemasukan baucar bayaran ke atas waran
            </p>
          </div>
        </div>
      </div>

      {/* Sub Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            subTab === 'payments'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 bg-white border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Lejar Baucar Bayaran EFT ({payments.length})</span>
        </button>

        <button
          onClick={() => setSubTab('receiving')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            subTab === 'receiving'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 bg-white border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Rekod Terimaan DO ({receivingRecords.length})</span>
        </button>
      </div>

      {/* PAYMENTS SUBTAB */}
      {subTab === 'payments' && (
        <div className="space-y-6">
          {/* Active LPOs awaiting payment recording */}
          <div className="rounded-[2rem] bg-white border-2 border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
              Senarai Pesanan Tempatan (LPO) Bersedia Untuk Bayaran
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-y border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">No. LPO</th>
                    <th className="py-3 px-3">No. PO</th>
                    <th className="py-3 px-3">Pembekal</th>
                    <th className="py-3 px-3">Program / Objek</th>
                    <th className="py-3 px-3 text-right">Jumlah Nilai (RM)</th>
                    <th className="py-3 px-3 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payableLPOs.length > 0 ? (
                    payableLPOs.map((lpo) => {
                      const isPaid = payments.some((p) => p.lpo_id === lpo.id)
                      return (
                        <tr key={lpo.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{lpo.lpo_number}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{lpo.purchase_order?.order_number}</td>
                          <td className="py-3 px-3 text-slate-800 font-medium">
                            {lpo.purchase_order?.supplier?.company_name || 'Pembekal'}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700 font-semibold">
                            {lpo.purchase_order?.program_code} - {lpo.purchase_order?.objek_code}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600">
                            {formatCurrency(Number(lpo.purchase_order?.total_amount) || 0)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isPaid ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Telah Dibayar
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => onOpenRecordPayment(lpo)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 text-xs rounded-xl shadow-xs"
                              >
                                Rekod Bayaran EFT
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        Tiada LPO aktif yang memerlukan bayaran.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History Ledger */}
          <div className="rounded-[2rem] bg-white border-2 border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
              Lejar Transaksi Bayaran Selesai (EFT / Baucar)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-y border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">No. Rujukan EFT</th>
                    <th className="py-3 px-3">Tarikh Bayaran</th>
                    <th className="py-3 px-3">No. LPO</th>
                    <th className="py-3 px-3">Pembekal Penerima</th>
                    <th className="py-3 px-3 text-right">Jumlah Dibayar (RM)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length > 0 ? (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-emerald-600">{p.payment_reference}</td>
                        <td className="py-3 px-3 text-slate-500">{p.payment_date}</td>
                        <td className="py-3 px-3 font-mono text-slate-700 font-semibold">{p.lpo?.lpo_number || '-'}</td>
                        <td className="py-3 px-3 text-slate-800">
                          {p.lpo?.purchase_order?.supplier?.company_name || 'Pembekal'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(Number(p.amount) || 0)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            SELESAI
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        Tiada rekod bayaran EFT lagi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVING SUBTAB */}
      {subTab === 'receiving' && (
        <div className="rounded-[2rem] bg-white border-2 border-slate-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
            Log Terimaan Barangan & Nota Hantaran (DO)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">No. DO (Delivery Order)</th>
                  <th className="py-3 px-3">Tarikh Terima</th>
                  <th className="py-3 px-3">No. LPO</th>
                  <th className="py-3 px-3">Pembekal</th>
                  <th className="py-3 px-3">Catatan</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivingRecords.length > 0 ? (
                  receivingRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600">{r.do_number}</td>
                      <td className="py-3 px-3 text-slate-500">{r.received_date}</td>
                      <td className="py-3 px-3 font-mono text-slate-700 font-semibold">{r.lpo?.lpo_number || '-'}</td>
                      <td className="py-3 px-3 text-slate-800 font-medium">
                        {r.lpo?.purchase_order?.supplier?.company_name || 'Pembekal'}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{r.notes || '-'}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Diterima Lengkap
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Tiada rekod penerimaan barangan DO lagi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
