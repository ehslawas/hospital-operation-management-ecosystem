// src/modules/mystaff/pages/StaffDashboardPage.tsx
// Standardized MyStaff Dashboard Page

import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  Clock,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  ChevronRight,
  Building2,
  FileText,
  Bell,
  Stethoscope,
  MapPin,
  TrendingUp,
  Activity,
  ArrowLeft,
  Network
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { ROUTES } from '@/lib/constants'
import {
  getStaffDashboardStats,
  getStaffMovements,
  getStaffReminders
} from '@/modules/mystaff/services/staffService'
import type {
  StaffDashboardStats,
  StaffMovement,
  StaffReminder
} from '@/shared/types/mystaff'
import { Badge, Button } from '@/components/ui'

export const StaffDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const toast = useToast()
  const user = useAuthStore(state => state.user)

  const [stats, setStats] = useState<StaffDashboardStats>({
    totalStaff: 30,
    presentToday: 26,
    onLeaveToday: 0,
    onCourseToday: 1,
    onMeetingToday: 2,
    onMovementToday: 3,
    pendingLeaveApprovals: 0,
    pendingMovementApprovals: 0,
    activeDeadlinesCount: 3,
    upcomingRemindersCount: 2
  })
  const [movements, setMovements] = useState<StaffMovement[]>([])
  const [reminders, setReminders] = useState<StaffReminder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadAllData = async () => {
    try {
      setIsLoading(true)
      const hospitalId = user?.hospital_id
      const deptId = user?.department_id

      const [statsRes, movRes, remRes] = await Promise.all([
        getStaffDashboardStats(hospitalId, deptId),
        getStaffMovements({ hospitalId, departmentId: deptId }),
        getStaffReminders({ hospitalId, departmentId: deptId })
      ])

      if (statsRes.data) setStats(statsRes.data)
      if (movRes.data) setMovements(movRes.data)
      if (remRes.data) setReminders(remRes.data)
    } catch (err: any) {
      console.error('Error loading staff dashboard data', err)
      toast.error('Gagal memuatkan data papan pemuka')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [user?.hospital_id, user?.department_id])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  return (
    <div className="p-6 md:p-8 w-full space-y-8 text-slate-800">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
        
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-800">
                Papan Pemuka MyStaff
              </h1>
              <Badge variant="gray" className="font-mono text-[10px] font-bold py-0.5 px-2 text-emerald-700 bg-emerald-50 border-emerald-200">
                WFM ECOSYSTEM
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Sistem Pemantauan Pergerakan Staf, Log Event & Kalendar Jabatan
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => navigate(ROUTES.STAFF_MOVEMENT)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl shadow-md hover:shadow-lg font-bold flex items-center gap-2 px-5 py-2.5 transition-all text-sm"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Catat Pergerakan</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.STAFF_REMINDERS)}
            className="border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl shadow-sm font-bold flex items-center gap-2 px-4 py-2.5 transition-all text-sm"
          >
            <Bell className="w-4 h-4 text-purple-600" />
            <span>Log Event</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.STAFF_CALENDAR)}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl shadow-sm font-bold flex items-center gap-2 px-4 py-2.5 transition-all text-sm bg-white"
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Kalendar Jabatan</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.STAFF_ORG_CHART)}
            className="border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-2xl shadow-sm font-bold flex items-center gap-2 px-4 py-2.5 transition-all text-sm"
          >
            <Network className="w-4 h-4 text-teal-600" />
            <span>Carta Organisasi</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Present Today */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-emerald-500 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Hadir di Stesen
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black font-mono mt-2 text-emerald-600">
            {isLoading ? '...' : stats.presentToday}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Daripada {stats.totalStaff} orang staf
          </p>
        </div>

        {/* Out of Office / Movement */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-sky-500 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Luar Stesen / Tugas
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black font-mono mt-2 text-sky-600">
            {isLoading ? '...' : stats.onMovementToday}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Mesyuarat & Tugas Rasmi
          </p>
        </div>

        {/* Courses & Training */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-purple-500 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Kursus & Bengkel
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black font-mono mt-2 text-purple-600">
            {isLoading ? '...' : stats.onCourseToday}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Latihan & Pembentangan
          </p>
        </div>

        {/* CME & Department Events */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-purple-600 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Log Event / CME
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black font-mono mt-2 text-purple-600">
            {isLoading ? '...' : stats.upcomingRemindersCount}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Sesi & Peringatan Aktif
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Today's Movement & Department Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Out of Office Summary */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    Status Pergerakan Hari Ini
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Pegawai yang bertugas di luar wad / premis hospital
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(ROUTES.STAFF_MOVEMENT)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold p-0 h-auto"
              >
                <span>Lihat Semua Log</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {/* List of active movements today */}
            {movements.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-slate-600">Semua staf berada di lokasi stesen bertugas.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tiada rekod keluar tugas rasmi atau mesyuarat luar hari ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {movements.slice(0, 4).map(mov => {
                  const staffName = mov.user?.full_name || mov.tajuk || 'Pegawai Bertugas'
                  return (
                    <div
                      key={mov.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all gap-3"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                          {staffName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-slate-900">{staffName}</h4>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 uppercase">
                              {mov.jenis_pergerakan}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{mov.destination || mov.tujuan || 'Lokasi tidak dinyatakan'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:text-right text-xs text-slate-600 font-mono">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans uppercase">Masa Keluar - Balik</span>
                          <span className="font-bold text-slate-800">
                            {mov.masa_keluar?.slice(0, 5) || '08:00'} — {mov.masa_balik?.slice(0, 5) || '17:00'}
                          </span>
                        </div>
                        <Badge variant="success" className="text-[10px] font-bold uppercase py-0.5 px-2">
                          {mov.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate(ROUTES.STAFF_MOVEMENT)}
              className="text-left p-6 rounded-3xl bg-white border border-slate-100 shadow-lg hover:shadow-xl hover:border-emerald-400 transition-all group"
            >
              <div className="p-3.5 w-fit rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">
                Borang Keluar Stesen
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Daftar borang kebenaran keluar pejabat & tugasan luar stesen.
              </p>
            </button>

            <button
              onClick={() => navigate(ROUTES.STAFF_REMINDERS)}
              className="text-left p-6 rounded-3xl bg-white border border-slate-100 shadow-lg hover:shadow-xl hover:border-purple-400 transition-all group"
            >
              <div className="p-3.5 w-fit rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 group-hover:text-purple-700 transition-colors">
                Log Event Jabatan
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Jadual CME, CPD points, mesyuarat berkala & hebahan tugas.
              </p>
            </button>

            <button
              onClick={() => navigate(ROUTES.STAFF_CALENDAR)}
              className="text-left p-6 rounded-3xl bg-white border border-slate-100 shadow-lg hover:shadow-xl hover:border-amber-400 transition-all group"
            >
              <div className="p-3.5 w-fit rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 mb-4 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 group-hover:text-amber-700 transition-colors">
                Kalendar Jabatan
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Paparan jadual ketiadaan pegawai dan aktiviti bulanan wad.
              </p>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Log Event & CME Reminders */}
        <div className="space-y-6">
          {/* CME & Event Reminders Widget */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Log Event & CME
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Acara & peringatan tugas aktif
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(ROUTES.STAFF_REMINDERS)}
                className="text-xs text-purple-600 hover:text-purple-700 font-bold p-0 h-auto"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            <div className="space-y-3">
              {reminders.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                  <Bell className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-500">Tiada log event dijadualkan.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sesi CME dan mesyuarat akan tersenarai di sini.</p>
                </div>
              ) : (
                reminders.slice(0, 5).map(rem => {
                  const remDate = new Date(rem.tarikh_peringatan)
                  return (
                    <div
                      key={rem.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase font-mono">
                          {rem.jenis_peringatan}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {remDate.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{rem.tajuk}</h4>
                      {rem.penerangan && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{rem.penerangan}</p>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-purple-500" />
                          <span>{remDate.toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        </span>
                        <span className="text-purple-600 font-bold">Jabatan</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboardPage
