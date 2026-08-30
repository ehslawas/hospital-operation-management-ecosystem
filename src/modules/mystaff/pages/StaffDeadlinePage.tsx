// src/modules/mystaff/pages/StaffDeadlinePage.tsx
// Standardized Department Deadline & Report Submission Countdown Tracker

import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  Plus,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  DollarSign,
  Shield,
  TrendingDown,
  Search,
  Filter
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { ROUTES } from '@/lib/constants'
import {
  getStaffDeadlines,
  createStaffDeadline,
  updateDeadlineStatus
} from '@/modules/mystaff/services/staffService'
import type { StaffDeadline, DeadlineCategory, DeadlinePriority } from '@/shared/types/mystaff'
import { Button, Modal, Badge } from '@/components/ui'

export const StaffDeadlinePage: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const toast = useToast()
  const user = useAuthStore(state => state.user)

  const [deadlines, setDeadlines] = useState<StaffDeadline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('ACTIVE')

  // Form State
  const [formCategory, setFormCategory] = useState<DeadlineCategory>('laporan')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formPriority, setFormPriority] = useState<DeadlinePriority>('high')

  const loadDeadlines = async () => {
    try {
      setIsLoading(true)
      const res = await getStaffDeadlines({
        hospitalId: user?.hospital_id,
        departmentId: user?.department_id
      })
      if (res.data) setDeadlines(res.data)
    } catch (e) {
      console.error(e)
      toast.error('Ralat memuatkan senarai tarikh akhir')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDeadlines()
  }, [user?.hospital_id, user?.department_id])

  const getDaysLeft = (targetDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const filteredDeadlines = useMemo(() => {
    return deadlines.filter(d => {
      const isDone = d.status === 'submitted'
      if (selectedFilter === 'ACTIVE') return !isDone
      if (selectedFilter === 'COMPLETED') return isDone
      return true
    })
  }, [deadlines, selectedFilter])

  const handleToggleComplete = async (dl: StaffDeadline) => {
    try {
      const newStatus = dl.status === 'submitted' ? 'pending' : 'submitted'
      await updateDeadlineStatus(dl.id, newStatus)
      toast.success(dl.status === 'submitted' ? 'Status ditukar ke belum selesai' : 'Tarikh akhir ditandakan selesai!')
      await loadDeadlines()
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengemaskini status')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formDate) {
      toast.error('Sila lengkapkan tajuk dan tarikh akhir.')
      return
    }

    try {
      setSubmitting(true)
      const res = await createStaffDeadline({
        created_by: user?.id || 'demo-user',
        hospital_id: user?.hospital_id || 'hosp-1',
        department_id: user?.department_id || 'dept-1',
        tajuk: formTitle,
        penerangan: formDesc,
        kategori: formCategory,
        tarikh_akhir: formDate,
        keutamaan: formPriority,
        status: 'pending',
        is_shared_dept: true
      })

      if (res.error) throw new Error(res.error)

      toast.success('Tarikh akhir serahan berjaya didaftarkan!')
      setIsModalOpen(false)
      // Reset
      setFormTitle('')
      setFormDesc('')
      setFormDate('')
      await loadDeadlines()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan tarikh akhir')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 w-full space-y-6 text-slate-800">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(ROUTES.STAFF_DASHBOARD)}
            className="p-3 hover:bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              Log Laporan & Serahan Tugasan
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Pemantauan Serahan Laporan Bulanan, Anggaran Belanja Mengurus (ABM), Unjuran APPL & Audit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl shadow-md font-bold flex items-center gap-2 px-5 py-2.5 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Log Laporan</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm w-fit">
        <button
          onClick={() => setSelectedFilter('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedFilter === 'ACTIVE'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Masih Aktif ({deadlines.filter(d => d.status !== 'submitted').length})
        </button>
        <button
          onClick={() => setSelectedFilter('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedFilter === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Telah Selesai ({deadlines.filter(d => d.status === 'submitted').length})
        </button>
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua ({deadlines.length})
        </button>
      </div>

      {/* Deadlines List Cards */}
      <div className="space-y-3">
        {filteredDeadlines.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-md text-slate-400">
            Tiada rekod tarikh akhir dalam senarai ini.
          </div>
        ) : (
          filteredDeadlines.map(dl => {
            const isDone = dl.status === 'submitted'
            const daysLeft = getDaysLeft(dl.tarikh_akhir)
            const isPast = daysLeft < 0
            const isUrgent = daysLeft <= 3 && !isPast && !isDone

            return (
              <div
                key={dl.id}
                className={`p-5 rounded-3xl bg-white border transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDone
                    ? 'border-slate-200 opacity-60'
                    : isPast
                    ? 'border-rose-200 bg-rose-50/20'
                    : isUrgent
                    ? 'border-amber-300 shadow-amber-500/5'
                    : 'border-slate-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleComplete(dl)}
                    className={`p-2.5 rounded-2xl border transition-all mt-0.5 ${
                      isDone
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white border-slate-300 hover:border-emerald-500 text-slate-300 hover:text-emerald-500'
                    }`}
                    title={isDone ? 'Tanda belum selesai' : 'Tanda telah selesai'}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-base font-extrabold ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {dl.tajuk}
                      </h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {dl.kategori}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium leading-relaxed">
                      {dl.penerangan}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
                      <span>Tarikh Serahan: <strong className="text-slate-700">{dl.tarikh_akhir}</strong></span>
                      {dl.creator?.full_name && (
                        <span>Pegawai: <strong className="text-slate-700">{dl.creator.full_name}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  {!isDone && (
                    <div
                      className={`text-center px-4 py-2 rounded-2xl border font-mono font-bold text-xs ${
                        isPast
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isUrgent
                          ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="text-lg font-black">{Math.abs(daysLeft)}</div>
                      <div className="text-[9px] uppercase tracking-wider">
                        {isPast ? 'Hari Lewat' : daysLeft === 0 ? 'Hari Ini' : 'Hari Lagi'}
                      </div>
                    </div>
                  )}

                  {isDone && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Selesai
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* New Deadline Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Daftar Log Laporan / Serahan Baharu"
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Laporan <span className="text-rose-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value as DeadlineCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
              >
                <option value="laporan">Laporan Bulanan Jabatan</option>
                <option value="anggaran">Unjuran & Pesanan APPL</option>
                <option value="penyerahan">Anggaran Belanja Mengurus (ABM / Bajet)</option>
                <option value="audit">Audit & Pematuhan KKM</option>
                <option value="lain">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tajuk Laporan / Serahan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="cth. Penyerahan Laporan Penggunaan Oksigen & Stok Q3"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tarikh Akhir (Deadline) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tahap Keutamaan</label>
              <select
                value={formPriority}
                onChange={e => setFormPriority(e.target.value as DeadlinePriority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
              >
                <option value="critical">Kritikal (Hukuman/Kesan Peruntukan)</option>
                <option value="high">Tinggi (Kewangan / KKM Deadline)</option>
                <option value="medium">Sederhana</option>
                <option value="low">Rendah</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Panduan Serahan</label>
            <textarea
              rows={3}
              placeholder="Format fail, pautan borang, atau arahan khusus HOD..."
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 shadow-md"
            >
              {submitting ? 'Menyimpan...' : 'Daftar Tarikh Akhir'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default StaffDeadlinePage
