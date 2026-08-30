// src/modules/myporter/pages/PorterMyRequestsPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  XCircle, 
  Phone, 
  Shield, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { Button, Input, Modal, Badge } from '@/components/ui'
import { getPorterJobs, cancelPorterJob } from '../services/porterService'
import type { PorterJobRequest, PorterJobStatus } from '@/shared/types/myporter'
import { JobStatusBadge, UrgencyBadge } from '../components/PorterStatusBadge'
import { PorterJobTrackerStepper } from '../components/PorterJobTrackerStepper'

export const PorterMyRequestsPage: React.FC = () => {
  const navigate = useNavigate()
  const loggedUser = useAuthStore((state) => state.user)
  const toast = useToast()

  const [jobs, setJobs] = useState<PorterJobRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active')
  const [searchQuery, setSearchQuery] = useState('')

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res = await getPorterJobs()
      if (res.data) setJobs(res.data)
    } catch (err: any) {
      toast.error('Ralat Memuatkan Pesanan', err.message || 'Gagal memuatkan rekod pesanan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleCancel = async () => {
    if (!cancellingJobId) return
    try {
      await cancelPorterJob(cancellingJobId, cancelReason || 'Dibatalkan oleh pemohon.')
      toast.success('Pesanan Dibatalkan', 'Permohonan telah dibatalkan.')
      setIsCancelModalOpen(false)
      setCancelReason('')
      fetchJobs()
    } catch (err: any) {
      toast.error('Ralat Membatalkan Pesanan', err.message)
    }
  }

  const filteredJobs = jobs.filter((j) => {
    if (activeTab === 'active') {
      if (j.status === 'completed' || j.status === 'cancelled') return false
    } else if (activeTab === 'completed') {
      if (j.status !== 'completed' && j.status !== 'cancelled') return false
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        j.no_rujukan.toLowerCase().includes(q) ||
        j.origin_department_name.toLowerCase().includes(q) ||
        j.destination_department_name.toLowerCase().includes(q) ||
        (j.assigned_porter_name && j.assigned_porter_name.toLowerCase().includes(q))
      )
    }
    return true
  })
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-sky-400" />
            <span>Pesanan Saya & Jejak Terkini</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Pantau status perjalanan PPK dan bukti penyerahan secara langsung</p>
        </div>

        <Button
          onClick={() => navigate('/porter/requests/new')}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold shadow-lg shadow-sky-500/20 rounded-xl px-5 py-2.5"
        >
          <Plus className="w-4 h-4" />
          <span>Pesanan Baharu</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'active' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Aktif ({jobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'completed' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Selesai / Batal ({jobs.filter(j => j.status === 'completed' || j.status === 'cancelled').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({jobs.length})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari No Rujukan, Wad, PPK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Orders List / Cards */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800/80">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-bold text-slate-400">Tiada rekod pesanan dijumpai.</p>
            <p className="text-xs text-slate-500 mt-1">Buat pesanan baharu untuk memulakan perkhidmatan dispatch.</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isCompleted = job.status === 'completed'
            const isCancelled = job.status === 'cancelled'
            const isPendingPpk = job.status === 'broadcasting'

            return (
              <div
                key={job.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 shadow-xl transition-all space-y-5"
              >
                {/* Card Top: Ref + Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-sky-400">{job.no_rujukan}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-xs font-extrabold text-white uppercase">{job.sub_category || job.category}</span>
                    <UrgencyBadge urgency={job.urgency} />
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>

                {/* Locations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      A
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Lokasi Ambil (Asal):</p>
                      <p className="text-sm font-extrabold text-slate-200">{job.origin_department_name}</p>
                      <p className="text-xs text-slate-400">{job.origin_location_details}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      B
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Lokasi Hantar (Destinasi):</p>
                      <p className="text-sm font-extrabold text-slate-200">{job.destination_department_name}</p>
                      <p className="text-xs text-slate-400">{job.destination_location_details}</p>
                    </div>
                  </div>
                </div>

                {/* Grab-Style Live Stepper */}
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                  <PorterJobTrackerStepper job={job} />
                </div>

                {/* Footer details: Assigned PPK & Cancel CTA */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-3">
                    {job.assigned_porter_name ? (
                      <div className="flex items-center gap-2 text-slate-300">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                          P
                        </div>
                        <span>PPK Bertugas: <strong className="text-white">{job.assigned_porter_name}</strong></span>
                        {job.assigned_porter_phone && (
                          <span className="text-slate-500 font-mono">({job.assigned_porter_phone})</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-amber-400 font-medium animate-pulse flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Sedang mencari PPK berdekatan melalui radar...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCompleted && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancellingJobId(job.id)
                          setIsCancelModalOpen(true)
                        }}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl border border-rose-500/30 transition-all text-xs"
                      >
                        Batalkan Pesanan
                      </button>
                    )}

                    {isCompleted && job.handover_proof && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Disahkan oleh: {job.handover_proof.recipient_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Pengesahan Pembatalan Pesanan"
      >
        <div className="space-y-4 p-2">
          <p className="text-xs text-slate-400">
            Adakah anda pasti untuk membatalkan pesanan ini? Tindakan ini akan menghentikan siaran radar kepada PPK.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Sebab Pembatalan *</label>
            <textarea
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="cth: Pesakit discaj awal / Pesanan tersilap wad..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsCancelModalOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Kembali
            </Button>
            <Button
              onClick={handleCancel}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Sahkan Batal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PorterMyRequestsPage
