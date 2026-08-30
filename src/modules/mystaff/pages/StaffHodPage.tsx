// src/modules/mystaff/pages/StaffHodPage.tsx
// Standardized HOD Approval Portal & Staffing Reports

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Calendar,
  UserCheck,
  Printer,
  FileText,
  Users,
  AlertCircle,
  Building
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { ROUTES } from '@/lib/constants'
import {
  getLeaveApplications,
  updateLeaveStatus,
  getStaffDashboardStats
} from '@/modules/mystaff/services/staffService'
import type { StaffLeaveApplication, StaffDashboardStats } from '@/shared/types/mystaff'
import { Button, Badge, Modal } from '@/components/ui'

export const StaffHodPage: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const toast = useToast()
  const user = useAuthStore(state => state.user)

  const [pendingLeaves, setPendingLeaves] = useState<StaffLeaveApplication[]>([])
  const [stats, setStats] = useState<StaffDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [activeLeaveToReject, setActiveLeaveToReject] = useState<StaffLeaveApplication | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [leavesRes, statsRes] = await Promise.all([
        getLeaveApplications({
          hospitalId: user?.hospital_id,
          departmentId: user?.department_id,
          status: 'pending'
        }),
        getStaffDashboardStats(user?.hospital_id, user?.department_id)
      ])

      if (leavesRes.data) setPendingLeaves(leavesRes.data)
      if (statsRes.data) setStats(statsRes.data)
    } catch (e) {
      console.error(e)
      toast.error('Ralat memuatkan portal kelulusan HOD')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.hospital_id, user?.department_id])

  const handleApprove = async (leave: StaffLeaveApplication) => {
    try {
      setProcessing(true)
      const res = await updateLeaveStatus(leave.id, 'approved', user?.id || 'hod-user-id', 'Diluluskan oleh Ketua Jabatan')
      if (res.error) throw new Error(res.error)

      toast.success(`Permohonan cuti ${leave.user?.full_name || 'pegawai'} berjaya diluluskan!`)
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal meluluskan permohonan cuti')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeLeaveToReject || !rejectionReason.trim()) return

    try {
      setProcessing(true)
      const res = await updateLeaveStatus(activeLeaveToReject.id, 'rejected', user?.id || 'hod-user-id', rejectionReason)
      if (res.error) throw new Error(res.error)

      toast.success('Permohonan cuti telah ditolak.')
      setRejectModalOpen(false)
      setActiveLeaveToReject(null)
      setRejectionReason('')
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menolak permohonan')
    } finally {
      setProcessing(false)
    }
  }

  const handlePrintReport = () => {
    window.print()
  }

  return (
    <div className="p-6 md:p-8 w-full space-y-8 text-slate-800">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-400 via-purple-600 to-indigo-600" />
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(ROUTES.STAFF_DASHBOARD)}
            className="p-3 hover:bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              Portal Kelulusan HOD & Ringkasan Jabatan
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Kelulusan Permohonan Cuti, Pengesahan Pergerakan & Cetakan Penyata Kehadiran Staf
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handlePrintReport}
            className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl border shadow-sm font-bold flex items-center gap-2 px-5 py-2.5 transition-all text-sm bg-white"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Ringkasan</span>
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase">Menunggu Tindakan HOD</span>
          <p className="text-3xl font-black font-mono text-purple-600 mt-2">
            {pendingLeaves.length} Permohonan
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Cuti Rehat & Tugas Luar</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase">Kekuatan Anggota Hari Ini</span>
          <p className="text-3xl font-black font-mono text-emerald-600 mt-2">
            {stats ? `${stats.presentToday} / ${stats.totalStaff}` : '26 / 30'}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {stats ? Math.round((stats.presentToday / stats.totalStaff) * 100) : 87}% Hadir Bertugas
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase">Ketiadaan Bertugas</span>
          <p className="text-3xl font-black font-mono text-rose-600 mt-2">
            {stats ? stats.onLeaveToday + stats.onCourseToday : 3} Orang
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Cuti / Kursus Luar</p>
        </div>
      </div>

      {/* Pending Leave Approvals Section */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-slate-800">
              Senarai Permohonan Cuti Menunggu Kelulusan
            </h2>
          </div>
          <span className="text-xs font-bold font-mono text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            {pendingLeaves.length} Permohonan
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingLeaves.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <p className="font-bold text-slate-700 text-base">Tiada permohonan yang menunggu kelulusan.</p>
              <p className="text-xs text-slate-400 mt-1">Semua permohonan staf telah diselesaikan.</p>
            </div>
          ) : (
            pendingLeaves.map(leave => (
              <div
                key={leave.id}
                className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-black text-sm shrink-0">
                    {leave.user?.full_name?.charAt(0) || 'U'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base">{leave.user?.full_name || 'Muhammad Farhan'}</h3>
                      <span className="text-xs text-slate-500 font-medium">({leave.user?.jawatan || 'Pegawai Farmasi U41'})</span>
                      <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {leave.leave_type?.nama_cuti || 'Cuti Rehat'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      Tarikh: <strong className="text-slate-800 font-mono">{leave.tarikh_mula}</strong> hingga{' '}
                      <strong className="text-slate-800 font-mono">{leave.tarikh_tamat}</strong> (
                      <span className="text-emerald-700 font-bold">{leave.jumlah_hari} Hari</span>)
                    </p>

                    <p className="text-xs text-slate-500 italic mt-1">Sebab: {leave.sebab}</p>

                    {leave.replacement_user && (
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        Pegawai Pengganti: <strong className="text-slate-800">{leave.replacement_user.full_name}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* HOD Approval Actions */}
                <div className="flex items-center gap-3 self-end lg:self-center">
                  <Button
                    onClick={() => {
                      setActiveLeaveToReject(leave)
                      setRejectModalOpen(true)
                    }}
                    disabled={processing}
                    className="border-rose-300 hover:bg-rose-50 text-rose-700 rounded-2xl border shadow-sm font-bold flex items-center gap-2 px-4 py-2 text-xs bg-white"
                  >
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>Tolak</span>
                  </Button>

                  <Button
                    onClick={() => handleApprove(leave)}
                    disabled={processing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-md font-bold flex items-center gap-2 px-5 py-2 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Luluskan Cuti</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Tolak Permohonan Cuti Staf"
        size="md"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sebab / Justifikasi Penolakan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Sila nyatakan sebab permohonan tidak diluluskan (cth. kekurangan tenaga kerja di wad)..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={processing}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 shadow-md"
            >
              {processing ? 'Menolak...' : 'Sahkan Penolakan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default StaffHodPage
