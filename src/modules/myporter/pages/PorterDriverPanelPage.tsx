// src/modules/myporter/pages/PorterDriverPanelPage.tsx
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, 
  Radio, 
  MapPin, 
  Check, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Shield, 
  AlertCircle, 
  Play, 
  Camera, 
  Star, 
  ChevronRight,
  Sparkles,
  Volume2
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { 
  getPorterJobs, 
  getPorterProfiles, 
  updatePorterProfileStatus, 
  porterAcceptJob, 
  porterUpdateStep 
} from '../services/porterService'
import type { 
  PorterJobRequest, 
  PorterProfile, 
  PorterStaffStatus 
} from '@/shared/types/myporter'
import { JobStatusBadge, UrgencyBadge, StaffStatusBadge } from '../components/PorterStatusBadge'
import { PorterRadarAlertModal } from '../components/PorterRadarAlertModal'
import { soundAlert } from '../components/PorterAudioAlert'

export const PorterDriverPanelPage: React.FC = () => {
  const loggedUser = useAuthStore((state) => state.user)
  const toast = useToast()

  const [currentPorter, setCurrentPorter] = useState<PorterProfile | null>(null)
  const [allJobs, setAllJobs] = useState<PorterJobRequest[]>([])
  const [activeJob, setActiveJob] = useState<PorterJobRequest | null>(null)
  const [radarJob, setRadarJob] = useState<PorterJobRequest | null>(null)
  const [isRadarOpen, setIsRadarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchDriverData = async () => {
    try {
      const [profRes, jobsRes] = await Promise.all([
        getPorterProfiles(),
        getPorterJobs()
      ])

      let profile: PorterProfile | null = null
      if (profRes.data && profRes.data.length > 0) {
        // Find by user id or default to first PPK (Muhammad Farhan)
        profile = profRes.data.find(p => p.user_id === loggedUser?.id) || profRes.data[0]
        setCurrentPorter(profile)
      }

      if (jobsRes.data) {
        setAllJobs(jobsRes.data)
        if (profile) {
          const myActive = jobsRes.data.find(
            j => j.assigned_porter_id === profile?.id && 
                 j.status !== 'completed' && 
                 j.status !== 'cancelled'
          )
          setActiveJob(myActive || null)

          // Check if there is an unassigned broadcasting job to show on radar
          if (!myActive && profile.current_status === 'available') {
            const broadcasted = jobsRes.data.find(j => j.status === 'broadcasting')
            if (broadcasted && broadcasted.id !== radarJob?.id) {
              setRadarJob(broadcasted)
              setIsRadarOpen(true)
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching driver panel data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDriverData()
    const interval = setInterval(fetchDriverData, 6000)
    return () => clearInterval(interval)
  }, [loggedUser?.id])
  const handleStatusToggle = async (newStatus: PorterStaffStatus) => {
    if (!currentPorter) return
    try {
      const res = await updatePorterProfileStatus(currentPorter.id, newStatus)
      if (res.data) {
        setCurrentPorter(res.data)
        toast.success('Status Dikemaskini', `Status PPK anda kini: ${newStatus.toUpperCase()}`)
      }
    } catch (err: any) {
      toast.error('Ralat Mengemaskini Status', err.message)
    }
  }

  const handleAcceptRadarJob = async (jobId: string) => {
    if (!currentPorter) return
    try {
      const res = await porterAcceptJob(jobId, currentPorter.id)
      if (res.data) {
        setIsRadarOpen(false)
        setActiveJob(res.data)
        toast.success('Tugasan Diterima!', 'Sila bergerak ke lokasi ambil.')
        fetchDriverData()
      }
    } catch (err: any) {
      toast.error('Gagal Menerima Tugasan', err.message)
    }
  }

  const handleDeclineRadarJob = (jobId: string) => {
    setIsRadarOpen(false)
    setRadarJob(null)
  }

  const handleStepProgression = async (nextStep: 'at_pickup' | 'in_transit' | 'at_destination' | 'delivered') => {
    if (!activeJob) return
    try {
      const res = await porterUpdateStep(activeJob.id, nextStep)
      if (res.data) {
        soundAlert.playSuccessTone()
        setActiveJob(res.data)
        toast.success('Fasa Dikemaskini', `Status tugasan: [${res.data.status.toUpperCase()}]`)
        fetchDriverData()
      }
    } catch (err: any) {
      toast.error('Ralat Mengemaskini Fasa', err.message)
    }
  }

  const poolJobs = allJobs.filter(j => j.status === 'broadcasting')
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Porter Status Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentPorter?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
              alt="PPK"
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-sky-500/50"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                currentPorter?.current_status === 'available'
                  ? 'bg-emerald-500'
                  : currentPorter?.current_status === 'in_job'
                    ? 'bg-blue-500'
                    : currentPorter?.current_status === 'on_break'
                      ? 'bg-amber-500'
                      : 'bg-slate-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{currentPorter?.full_name}</h2>
              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 font-mono text-[10px] font-bold rounded-lg">
                {currentPorter?.staff_no} ({currentPorter?.gred})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentPorter?.assigned_zone}</p>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {currentPorter?.average_rating}
              </span>
              <span>•</span>
              <span>{currentPorter?.total_completed_today} Selesai Hari Ini</span>
            </div>
          </div>
        </div>

        {/* Duty Status Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-stretch sm:self-auto justify-center">
          <button
            onClick={() => handleStatusToggle('available')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              currentPorter?.current_status === 'available'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bersedia (Online)
          </button>
          <button
            onClick={() => handleStatusToggle('on_break')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              currentPorter?.current_status === 'on_break'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rehat (Break)
          </button>
          <button
            onClick={() => handleStatusToggle('offline')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              currentPorter?.current_status === 'offline'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Luar Talian
          </button>
        </div>
      </div>

      {/* ACTIVE JOB SCREEN (Grab Rider Style) */}
      {activeJob ? (
        <div className="bg-slate-900 border-2 border-sky-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-sky-500 to-blue-600 animate-pulse" />

          {/* Active Job Header */}
          <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Tugasan Aktif Anda</span>
              <h3 className="text-xl font-black text-white">{activeJob.sub_category || activeJob.category}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">No Rujukan: {activeJob.no_rujukan}</p>
            </div>
            <UrgencyBadge urgency={activeJob.urgency} />
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">1. Ambil di (Asal):</span>
              <p className="text-sm font-extrabold text-white">{activeJob.origin_department_name}</p>
              <p className="text-xs text-slate-400">{activeJob.origin_location_details}</p>
              <p className="text-[11px] text-slate-500 mt-1">Pemohon: {activeJob.requester_name} ({activeJob.requester_phone})</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase">2. Hantar ke (Destinasi):</span>
              <p className="text-sm font-extrabold text-white">{activeJob.destination_department_name}</p>
              <p className="text-xs text-slate-400">{activeJob.destination_location_details}</p>
              {activeJob.recipient_name && (
                <p className="text-[11px] text-slate-500 mt-1">Penerima: {activeJob.recipient_name}</p>
              )}
            </div>
          </div>

          {/* Patient / Cargo Details */}
          {activeJob.patient_data && (
            <div className="p-4 bg-sky-950/30 border border-sky-800/50 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-sky-300">
                Pesakit: {activeJob.patient_data.patient_name} ({activeJob.patient_data.patient_rn})
              </p>
              <p className="text-slate-400">
                Mod: <strong className="text-white uppercase">{activeJob.patient_data.mobility_type}</strong> | Oksigen: <strong className="text-white">{activeJob.patient_data.o2_dependent ? 'Diperlukan' : 'Tidak'}</strong>
              </p>
            </div>
          )}

          {/* BIG TACTILE PROGRESSION BUTTONS */}
          <div className="pt-2">
            {activeJob.status === 'accepted' && (
              <Button
                onClick={() => handleStepProgression('at_pickup')}
                className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black rounded-2xl shadow-xl shadow-sky-500/25 text-base flex items-center justify-center gap-3"
              >
                <MapPin className="w-6 h-6" />
                <span>1. SAYA SUDAH TIBA DI LOKASI AMBIL</span>
              </Button>
            )}

            {activeJob.status === 'at_pickup' && (
              <Button
                onClick={() => handleStepProgression('in_transit')}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/25 text-base flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6" />
                <span>2. SAHKAN AMBILAN & MULA PERJALANAN</span>
              </Button>
            )}

            {activeJob.status === 'in_transit' && (
              <Button
                onClick={() => handleStepProgression('at_destination')}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/25 text-base flex items-center justify-center gap-3"
              >
                <MapPin className="w-6 h-6" />
                <span>3. SAYA SUDAH TIBA DI DESTINASI</span>
              </Button>
            )}

            {activeJob.status === 'at_destination' && (
              <Button
                onClick={() => handleStepProgression('delivered')}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/25 text-base flex items-center justify-center gap-3"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>4. SELESAI HANTAR & MINTA PENGESAHAN PENERIMA</span>
              </Button>
            )}

            {activeJob.status === 'pending_receiver_confirmation' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-400 mx-auto animate-spin" />
                <h4 className="text-sm font-extrabold text-white">Menunggu Pengesahan Kakitangan Penerima</h4>
                <p className="text-xs text-slate-400">
                  Sila maklumkan kepada jururawat/pegawai wad penerima untuk mengesahkan penyerahan pada portal mereka.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* IDLE POOL QUEUE */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
              <span>Kolam Tugasan Baharu (Hospital Pool Queue)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">{poolJobs.length} Permohonan Tersedia</span>
          </div>

          <div className="space-y-3">
            {poolJobs.length === 0 ? (
              <div className="p-16 text-center text-slate-500 bg-slate-900/60 rounded-3xl border border-slate-800">
                <Truck className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                <p className="font-bold text-slate-400">Tiada tugasan baharu dalam kolam.</p>
                <p className="text-xs text-slate-500 mt-1">Radar sedang aktif mendengar siaran permohonan wad.</p>
              </div>
            ) : (
              poolJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-5 rounded-2xl shadow-lg transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400">{job.no_rujukan}</span>
                      <UrgencyBadge urgency={job.urgency} />
                      <span className="text-xs font-extrabold text-white">{job.sub_category || job.category}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Dari: <strong className="text-slate-200">{job.origin_department_name}</strong> ➔ Ke: <strong className="text-slate-200">{job.destination_department_name}</strong>
                    </p>
                  </div>

                  <Button
                    onClick={() => handleAcceptRadarJob(job.id)}
                    className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 text-xs shrink-0"
                  >
                    Terima Tugasan
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Radar Modal */}
      <PorterRadarAlertModal
        job={radarJob}
        isOpen={isRadarOpen}
        onAccept={handleAcceptRadarJob}
        onDecline={handleDeclineRadarJob}
      />
    </div>
  )
}

export default PorterDriverPanelPage
