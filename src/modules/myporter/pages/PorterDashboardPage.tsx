// src/modules/myporter/pages/PorterDashboardPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Truck, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Activity, 
  AlertTriangle, 
  Users, 
  ArrowRight, 
  ClipboardList, 
  Shield, 
  MapPin, 
  ChevronRight,
  TrendingUp,
  FlaskConical,
  Droplets,
  Pill,
  Bed,
  AirVent,
  Radio,
  FileText
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { 
  getPorterStats, 
  getPorterJobs, 
  getPorterProfiles, 
  getPorterRoles 
} from '../services/porterService'
import type { 
  PorterAggregateStats, 
  PorterJobRequest, 
  PorterProfile 
} from '@/shared/types/myporter'
import { JobStatusBadge, UrgencyBadge, StaffStatusBadge } from '../components/PorterStatusBadge'
import { PorterJobTrackerStepper } from '../components/PorterJobTrackerStepper'

export const PorterDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const loggedUser = useAuthStore((state) => state.user)
  const toast = useToast()

  const [stats, setStats] = useState<PorterAggregateStats | null>(null)
  const [recentJobs, setRecentJobs] = useState<PorterJobRequest[]>([])
  const [porters, setPorters] = useState<PorterProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('ward_requester')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, jobsRes, profilesRes, rolesRes] = await Promise.all([
        getPorterStats(),
        getPorterJobs(),
        getPorterProfiles(),
        getPorterRoles()
      ])

      if (statsRes.data) setStats(statsRes.data)
      if (jobsRes.data) setRecentJobs(jobsRes.data.slice(0, 6))
      if (profilesRes.data) setPorters(profilesRes.data)

      if (loggedUser?.id && rolesRes.data) {
        const assignedRole = rolesRes.data[loggedUser.id]
        if (assignedRole) {
          setUserRole(assignedRole)
        } else if (loggedUser.role?.role_code === 'system_admin' || loggedUser.role?.role_code === 'hospital_admin') {
          setUserRole('porter_manager')
        }
      }
    } catch (err: any) {
      toast.error('Ralat Memuat Data', err.message || 'Gagal memuatkan data papan pemuka.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [loggedUser?.id])

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium animate-pulse">Memuatkan Papan Pemuka MyPorter...</p>
      </div>
    )
  }
  return (
    <div className="w-full space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 p-6 md:p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-2xl backdrop-blur-md">
              <Truck className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">MyPorter</h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                Sistem Logistik, Pemindahan Pesakit & Dispatch Bersepadu Hospital
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={() => navigate('/porter/requests/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold shadow-lg shadow-sky-500/25 border-0 rounded-xl px-5 py-2.5 transition-all duration-200 active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Pesan Porter Sekarang</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/porter/panel')}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 rounded-xl px-4 py-2.5 text-sm"
          >
            <Radio className="w-4 h-4 text-sky-400" />
            <span>Panel PPK Rider</span>
          </Button>

          {userRole === 'porter_manager' && (
            <Button
              variant="outline"
              onClick={() => navigate('/porter/manager')}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 rounded-xl px-4 py-2.5 text-sm"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Pusat Dispatch</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-slate-900/70 border-slate-800 shadow-lg hover:border-sky-500/50 transition-all rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Permohonan Hari Ini</p>
              <h3 className="text-3xl font-black text-white tabular-nums">{stats?.totalJobsToday || 0}</h3>
              <p className="text-[11px] text-sky-400 font-medium">{stats?.activeBroadcasting || 0} sedang mencari PPK</p>
            </div>
            <div className="p-3 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-2xl">
              <ClipboardList className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800 shadow-lg hover:border-blue-500/50 transition-all rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sedang Dalam Perjalanan</p>
              <h3 className="text-3xl font-black text-blue-400 tabular-nums">{stats?.inTransit || 0}</h3>
              <p className="text-[11px] text-slate-400">{stats?.pendingReceiverConfirmation || 0} tiba di destinasi</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl">
              <Truck className="w-7 h-7 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800 shadow-lg hover:border-emerald-500/50 transition-all rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">PPK Bersedia (Online)</p>
              <h3 className="text-3xl font-black text-emerald-400 tabular-nums">
                {stats?.availablePortersCount || 0} <span className="text-sm font-normal text-slate-500">/ {stats?.totalPortersOnDuty || 0}</span>
              </h3>
              <p className="text-[11px] text-emerald-400 font-medium">Kadar sedia ada mencukupi</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
              <Users className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800 shadow-lg hover:border-amber-500/50 transition-all rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purata Masa TAT (SLA)</p>
              <h3 className="text-3xl font-black text-amber-400 tabular-nums">
                {stats?.averageTATMinutes || 14} <span className="text-sm font-normal text-slate-500">min</span>
              </h3>
              <p className="text-[11px] text-amber-400 font-medium">{stats?.slaCompliancePercentage || 96.8}% patuh SLA</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl">
              <TrendingUp className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grab-Style Quick 1-Click Order Categories */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>Kategori Pantas Pesanan (Quick Request)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { cat: 'patient_transfer', label: 'Pesakit', icon: Bed, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
            { cat: 'lab_specimen', label: 'Spesimen', icon: FlaskConical, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
            { cat: 'blood_bank', label: 'Tabung Darah', icon: Droplets, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
            { cat: 'pharmacy_run', label: 'Ubat Farmasi', icon: Pill, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
            { cat: 'gas_equipment', label: 'Oksigen / Alat', icon: AirVent, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
            { cat: 'mortuary', label: 'Jenazah', icon: Shield, color: 'text-slate-300 bg-slate-500/10 border-slate-500/30' },
            { cat: 'medical_records', label: 'Rekod BHT', icon: FileText, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
            { cat: 'cssd_linen', label: 'CSSD & Linen', icon: Activity, color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.cat}
                onClick={() => navigate(`/porter/requests/new?category=${item.cat}`)}
                className={`p-4 rounded-2xl border ${item.color} flex flex-col items-center justify-center gap-2 hover:scale-105 hover:bg-slate-800/80 transition-all duration-200 active:scale-95 shadow-sm text-center`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-bold text-slate-200">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Split: Recent Jobs Feed + PPK Status Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Jobs Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" />
              <span>Status Pergerakan Langsung (Live Jobs)</span>
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/porter/requests/my')}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 p-0 flex items-center gap-1"
            >
              <span>Lihat Semua Pesanan</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {recentJobs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                Tiada permohonan aktif pada masa ini.
              </div>
            ) : (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-400">{job.no_rujukan}</span>
                      <UrgencyBadge urgency={job.urgency} />
                    </div>
                    <JobStatusBadge status={job.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-semibold">Dari (Asal):</p>
                        <p className="font-bold text-slate-200">{job.origin_department_name}</p>
                        <p className="text-slate-500">{job.origin_location_details}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-semibold">Ke (Destinasi):</p>
                        <p className="font-bold text-slate-200">{job.destination_department_name}</p>
                        <p className="text-slate-500">{job.destination_location_details}</p>
                      </div>
                    </div>
                  </div>

                  {/* Step Progress Bar */}
                  <PorterJobTrackerStepper job={job} compact />

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                    <div className="text-slate-400">
                      PPK: <span className="font-semibold text-slate-200">{job.assigned_porter_name || 'Menunggu tugasan'}</span>
                    </div>
                    <button
                      onClick={() => navigate('/porter/requests/my')}
                      className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                    >
                      <span>Jejak Pesanan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available PPK Fleet Status (1 col) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Status Petugas PPK</span>
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/porter/roster')}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 p-0 flex items-center gap-1"
            >
              <span>Jadual Syif</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800/80 space-y-3">
            {porters.map((p) => (
              <div key={p.id} className="pt-3 first:pt-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                      alt={p.full_name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-800"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                        p.current_status === 'available'
                          ? 'bg-emerald-500'
                          : p.current_status === 'in_job'
                            ? 'bg-blue-500'
                            : p.current_status === 'on_break'
                              ? 'bg-amber-500'
                              : 'bg-slate-500'
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{p.full_name}</h4>
                    <p className="text-[10px] text-slate-400">{p.assigned_zone}</p>
                    <p className="text-[10px] text-slate-500">{p.current_location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StaffStatusBadge status={p.current_status} />
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{p.total_completed_today} selesai</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PorterDashboardPage
