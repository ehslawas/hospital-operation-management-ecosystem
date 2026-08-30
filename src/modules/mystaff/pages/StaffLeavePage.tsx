// src/modules/mystaff/pages/StaffLeavePage.tsx
// Standardized Staff Leave Quota & Application History Page

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldAlert,
  UserCheck
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { ROUTES } from '@/lib/constants'
import { getLeaveQuotas, getLeaveApplications } from '@/modules/mystaff/services/staffService'
import type { StaffLeaveQuota, StaffLeaveApplication } from '@/shared/types/mystaff'
import { Button, Badge } from '@/components/ui'

export const StaffLeavePage: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const toast = useToast()
  const user = useAuthStore(state => state.user)

  const [quotas, setQuotas] = useState<StaffLeaveQuota[]>([])
  const [applications, setApplications] = useState<StaffLeaveApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [quotaRes, appRes] = await Promise.all([
        getLeaveQuotas(user?.id || 'demo-user-id', new Date().getFullYear()),
        getLeaveApplications({ userId: user?.id || 'demo-user-id' })
      ])
      if (quotaRes.data) setQuotas(quotaRes.data)
      if (appRes.data) setApplications(appRes.data)
    } catch (e) {
      console.error(e)
      toast.error('Ralat memuatkan data cuti')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  return (
    <div className="p-6 md:p-8 w-full space-y-8 text-slate-800">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 via-teal-500 to-emerald-500" />
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(ROUTES.STAFF_DASHBOARD)}
            className="p-3 hover:bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              Pengurusan & Rekod Cuti Staf
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Semakan Baki Kelayakan Cuti Mengikut Perintah Am Bab C & Sejarah Permohonan Cuti
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => navigate(ROUTES.STAFF_LEAVE_APPLY)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl shadow-md font-bold flex items-center gap-2 px-5 py-2.5 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Mohon Cuti Baharu</span>
          </Button>
        </div>
      </div>

      {/* Quota Balance KPI Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-800">
            Baki Kelayakan Cuti Tahun {new Date().getFullYear()}
          </h2>
          <span className="text-xs font-mono font-bold text-slate-400">
            Perintah Am Bab C (Cuti)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quotas.map(q => {
            const pct = q.hak_hari > 0 ? (q.baki_hari / q.hak_hari) * 100 : 100
            const isLow = pct < 20

            return (
              <div
                key={q.id}
                className="p-5 rounded-3xl bg-white border border-slate-100 shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {q.leave_type?.kod_cuti || 'CUTI'}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    Tahun {q.tahun}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm mb-1">{q.leave_type?.nama_cuti}</h3>
                
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black font-mono text-emerald-600">{q.baki_hari}</span>
                  <span className="text-xs text-slate-400 font-bold">/ {q.hak_hari} Hari Baki</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isLow ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
                  <span>Digunakan: {q.digunakan_hari} hari</span>
                  <span>Kelayakan: {q.hak_hari} hari</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Leave Application History Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-800">
              Sejarah Permohonan Cuti
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {applications.length} Rekod
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase font-black text-slate-500">
              <tr>
                <th className="px-6 py-4">Jenis Cuti</th>
                <th className="px-6 py-4">Tempoh & Jumlah Hari</th>
                <th className="px-6 py-4">Sebab & Catatan</th>
                <th className="px-6 py-4">Pegawai Pengambil Alih Tugas</th>
                <th className="px-6 py-4">Tarikh Mohon</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Tiada permohonan cuti direkodkan.
                  </td>
                </tr>
              ) : (
                applications.map(app => {
                  const isApproved = app.status === 'approved'
                  const isPending = app.status === 'pending'
                  const isRejected = app.status === 'rejected'

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{app.leave_type?.nama_cuti || 'Cuti Rehat'}</div>
                        <div className="text-xs font-mono text-slate-400">{app.leave_type?.kod_cuti}</div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs">
                        <div className="text-slate-800 font-bold">
                          {app.tarikh_mula} — {app.tarikh_tamat}
                        </div>
                        <div className="text-emerald-700 font-bold mt-0.5">{app.jumlah_hari} Hari</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-slate-700 text-xs max-w-xs line-clamp-2 leading-relaxed">{app.sebab}</div>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <div className="font-bold text-slate-800">{app.replacement_user?.full_name || 'Nurul Huda'}</div>
                        <div className="text-slate-400">{app.replacement_user?.jawatan || 'Pegawai Farmasi U44'}</div>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString('ms-MY') : '-'}
                      </td>

                      <td className="px-6 py-4">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Diluluskan
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Menunggu Kelulusan HOD
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="w-3 h-3" />
                            Ditolak
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StaffLeavePage
