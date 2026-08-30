// src/modules/myporter/pages/PorterManagerDispatchPage.tsx
import React, { useEffect, useState } from 'react'
import { 
  Shield, 
  Users, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Truck, 
  UserPlus, 
  ChevronRight, 
  RefreshCw,
  Search,
  Filter,
  Flame,
  Radio,
  ArrowRight
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { Button, Input, Modal, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { 
  getPorterStats, 
  getPorterJobs, 
  getPorterProfiles, 
  managerAssignJob 
} from '../services/porterService'
import type { 
  PorterAggregateStats, 
  PorterJobRequest, 
  PorterProfile 
} from '@/shared/types/myporter'
import { JobStatusBadge, UrgencyBadge, StaffStatusBadge } from '../components/PorterStatusBadge'
import { soundAlert } from '../components/PorterAudioAlert'

export const PorterManagerDispatchPage: React.FC = () => {
  const toast = useToast()

  const [stats, setStats] = useState<PorterAggregateStats | null>(null)
  const [jobs, setJobs] = useState<PorterJobRequest[]>([])
  const [porters, setPorters] = useState<PorterProfile[]>([])
  const [loading, setLoading] = useState(true)

  // Manual Dispatch Modal
  const [selectedJob, setSelectedJob] = useState<PorterJobRequest | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedPorterId, setSelectedPorterId] = useState('')

  const fetchManagerData = async () => {
    try {
      const [statsRes, jobsRes, profRes] = await Promise.all([
        getPorterStats(),
        getPorterJobs(),
        getPorterProfiles()
      ])
      if (statsRes.data) setStats(statsRes.data)
      if (jobsRes.data) setJobs(jobsRes.data)
      if (profRes.data) setPorters(profRes.data)
    } catch (err: any) {
      toast.error('Ralat Memuatkan Data Dispatch', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchManagerData()
    const interval = setInterval(fetchManagerData, 6000)
    return () => clearInterval(interval)
  }, [])

  const handleManualAssign = async () => {
    if (!selectedJob || !selectedPorterId) return
    try {
      const res = await managerAssignJob(selectedJob.id, selectedPorterId)
      if (res.data) {
        soundAlert.playSuccessTone()
        toast.success('Tugasan Berjaya Diagihkan', `PPK ${res.data.assigned_porter_name} telah ditugaskan untuk ${res.data.no_rujukan}.`)
        setIsAssignModalOpen(false)
        setSelectedJob(null)
        setSelectedPorterId('')
        fetchManagerData()
      }
    } catch (err: any) {
      toast.error('Gagal Mengagihkan Tugasan', err.message)
    }
  }

  // Kanban Columns
  const poolJobs = jobs.filter(j => j.status === 'broadcasting')
  const inProgressJobs = jobs.filter(j => j.status === 'accepted' || j.status === 'at_pickup' || j.status === 'in_transit' || j.status === 'at_destination')
  const pendingConfirmationJobs = jobs.filter(j => j.status === 'pending_receiver_confirmation')
  const completedJobs = jobs.filter(j => j.status === 'completed')

  // Available Porters for assignment
  const availablePorters = porters.filter(p => p.current_status === 'available')
  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-400" />
            <span>Pusat Kawalan Dispatch & Operasi PPK</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Papan pemantauan masa-nyata pergerakan logistik, pemindahan pesakit dan pengagihan manual PPK
          </p>
        </div>

        <Button
          onClick={fetchManagerData}
          variant="outline"
          className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white flex items-center gap-2 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Kemas Kini Langsung</span>
        </Button>
      </div>

      {/* SLA Alert Banner if there are STAT unaccepted jobs */}
      {poolJobs.some(j => j.urgency === 'stat') && (
        <div className="p-4 bg-rose-500/20 border-2 border-rose-500/80 rounded-2xl flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-black text-rose-200">AMARAN SLA: Terdapat Permohonan STAT Kritis Belum Diambil!</p>
              <p className="text-xs text-rose-300/80">Sila buat penugasan manual segera kepada mana-mana PPK yang tersedia.</p>
            </div>
          </div>
          <Button
            onClick={() => {
              const statJob = poolJobs.find(j => j.urgency === 'stat')
              if (statJob) {
                setSelectedJob(statJob)
                setIsAssignModalOpen(true)
              }
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4"
          >
            Tugaskan Segera
          </Button>
        </div>
      )}

      {/* KANBAN LIVE DISPATCH BOARD */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
          <span>Papan Pergerakan Langsung (Live Kanban Matrix)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Col 1: Broadcasting Pool */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-black text-sky-400 uppercase tracking-wider">Menunggu (Pool)</span>
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">
                {poolJobs.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {poolJobs.length === 0 ? (
                <div className="p-8 text-center text-slate-600 text-xs">Tiada permohonan dalam kolam</div>
              ) : (
                poolJobs.map((job) => (
                  <div key={job.id} className="p-4 bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-2xl space-y-3 shadow-md">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-sky-400">{job.no_rujukan}</span>
                      <UrgencyBadge urgency={job.urgency} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{job.sub_category || job.category}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Dari: {job.origin_department_name}</p>
                      <p className="text-[11px] text-slate-400">Ke: {job.destination_department_name}</p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedJob(job)
                        setIsAssignModalOpen(true)
                      }}
                      className="w-full py-2 bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Agih Manual</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 2: In Progress & In Transit */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-black text-blue-400 uppercase tracking-wider">Sedang Bergerak</span>
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                {inProgressJobs.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {inProgressJobs.length === 0 ? (
                <div className="p-8 text-center text-slate-600 text-xs">Tiada pergerakan aktif</div>
              ) : (
                inProgressJobs.map((job) => (
                  <div key={job.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5 shadow-md">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-sky-400">{job.no_rujukan}</span>
                      <JobStatusBadge status={job.status} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{job.sub_category || job.category}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">PPK: <strong className="text-slate-200">{job.assigned_porter_name}</strong></p>
                      <p className="text-[10px] text-slate-500">Laluan: {job.origin_department_name} ➔ {job.destination_department_name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 3: Pending Receiver Confirmation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Tiba & Pengesahan</span>
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                {pendingConfirmationJobs.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {pendingConfirmationJobs.length === 0 ? (
                <div className="p-8 text-center text-slate-600 text-xs">Tiada menunggu pengesahan</div>
              ) : (
                pendingConfirmationJobs.map((job) => (
                  <div key={job.id} className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-2 shadow-md">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-sky-400">{job.no_rujukan}</span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full animate-pulse">
                        Menunggu Wad
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-white">{job.sub_category || job.category}</h4>
                    <p className="text-[11px] text-slate-400">Destinasi: <strong className="text-white">{job.destination_department_name}</strong></p>
                    <p className="text-[10px] text-slate-500">PPK: {job.assigned_porter_name}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 4: Completed Today */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Selesai Hari Ini</span>
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                {completedJobs.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {completedJobs.slice(0, 8).map((job) => (
                <div key={job.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono font-bold text-slate-400">{job.no_rujukan}</span>
                    <span className="text-emerald-400 font-bold">✓ {job.actual_tat_minutes || 15}m TAT</span>
                  </div>
                  <p className="text-xs font-bold text-slate-300 truncate">{job.sub_category || job.category}</p>
                  <p className="text-[10px] text-slate-500">{job.assigned_porter_name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Porter Fleet Live Status & Ward Demand Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Porter Fleet List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Matriks Keberadaan Petugas PPK</span>
          </h2>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="divide-y divide-slate-800/80">
              {porters.map((p) => (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-800"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-white">{p.full_name}</h4>
                        <span className="font-mono text-[10px] text-slate-400">{p.staff_no} ({p.gred})</span>
                      </div>
                      <p className="text-slate-400">{p.assigned_zone} • {p.phone_number}</p>
                      <p className="text-slate-500 text-[10px]">Lokasi Terkini: {p.current_location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <StaffStatusBadge status={p.current_status} />
                    <span className="font-mono font-bold text-amber-400 text-xs">★ {p.average_rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ward Demand Heatmap (1 col) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <span>Kepadatan Permohonan Wad (Demand)</span>
          </h2>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl text-xs">
            <p className="text-slate-400">Kepekatan zon permohonan logistik tertinggi:</p>
            {[
              { zone: 'Jabatan Kecemasan (ED)', count: 18, pct: 85, color: 'bg-rose-500' },
              { zone: 'Dewan Bedah Utama (OT)', count: 14, pct: 68, color: 'bg-amber-500' },
              { zone: 'Wad Kenanga (Wad 4A)', count: 11, pct: 52, color: 'bg-blue-500' },
              { zone: 'Makmal Patologi & Tabung Darah', count: 9, pct: 44, color: 'bg-teal-500' },
              { zone: 'Unit Rawatan Rapi (ICU)', count: 7, pct: 35, color: 'bg-indigo-500' }
            ].map((z) => (
              <div key={z.zone} className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>{z.zone}</span>
                  <span className="font-mono">{z.count} Tugas</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${z.color} rounded-full`} style={{ width: `${z.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Dispatch Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Agihan Manual Tugasan PPK"
      >
        <div className="space-y-4 p-2">
          {selectedJob && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-sky-400">{selectedJob.no_rujukan}</span>
                <UrgencyBadge urgency={selectedJob.urgency} />
              </div>
              <p className="font-bold text-white">{selectedJob.sub_category || selectedJob.category}</p>
              <p className="text-slate-400">Dari: {selectedJob.origin_department_name} ➔ Ke: {selectedJob.destination_department_name}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Pilih PPK untuk Ditugaskan *</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200"
              value={selectedPorterId}
              onChange={(e) => setSelectedPorterId(e.target.value)}
            >
              <option value="">-- Pilih PPK --</option>
              {porters.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.staff_no}) - {p.current_status.toUpperCase()} ({p.assigned_zone})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Batal
            </Button>
            <Button
              disabled={!selectedPorterId}
              onClick={handleManualAssign}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              Sahkan Penugasan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PorterManagerDispatchPage
