// src/modules/hub/pages/modules/StaffSubMenu.tsx
// Luxury sub-menu hub for MyStaff module

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  LayoutDashboard,
  Calendar,
  Briefcase,
  CalendarDays,
  Clock,
  Bell,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Network
} from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { Badge } from '@/components/ui'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { getStaffDashboardStats } from '@/modules/mystaff/services/staffService'
import type { StaffDashboardStats } from '@/shared/types/mystaff'

export const StaffSubMenu: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()

  const [stats, setStats] = useState<StaffDashboardStats>({
    totalStaff: 30,
    presentToday: 26,
    onLeaveToday: 2,
    onCourseToday: 1,
    onMeetingToday: 1,
    onMovementToday: 2,
    pendingLeaveApprovals: 1,
    pendingMovementApprovals: 0,
    activeDeadlinesCount: 3,
    upcomingRemindersCount: 2
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await getStaffDashboardStats()
        if (res.data) setStats(res.data)
      } catch (e) {
        console.error('Failed to load MyStaff submenu stats', e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const menuItems = [
    {
      title: language === 'ms' ? 'Dashboard Utama MyStaff' : 'MyStaff Main Dashboard',
      description:
        language === 'ms'
          ? 'Paparan ringkasan kehadiran masa nyata, statistik ketiadaan, tindakan pantas, dan pemantauan menyeluruh.'
          : 'Live presence summary, absence metrics, quick actions, and holistic ward workforce visibility.',
      icon: LayoutDashboard,
      path: ROUTES.STAFF_DASHBOARD,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: `${stats.presentToday}/${stats.totalStaff} Hadir`,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    },
    {
      title: language === 'ms' ? 'Log Pergerakan Staf (Keluar Pejabat)' : 'Staff Movement Registry',
      description:
        language === 'ms'
          ? 'Borang Pergerakan Pegawai rasmi: mesyuarat, kursus latihan, lawatan tapak, pembentangan dan tugas luar.'
          : 'Official out-of-office logs for meetings, training, site visits, presentations, and duty trips.',
      icon: Briefcase,
      path: ROUTES.STAFF_MOVEMENT,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      badge: stats.onMovementToday > 0 ? `${stats.onMovementToday} di Luar` : null,
      badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40'
    },
    {
      title: language === 'ms' ? 'Log Event' : 'Event Log & CME Alerts',
      description:
        language === 'ms'
          ? 'Peringatan automatik bagi jadual CME / CPD hospital, mesyuarat jawatankuasa, dan arahan tugas.'
          : 'Automated reminders for hospital CME/CPD sessions, meetings, and upcoming duties.',
      icon: Bell,
      path: ROUTES.STAFF_REMINDERS,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      badge: stats.upcomingRemindersCount > 0 ? `${stats.upcomingRemindersCount} Event` : null,
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40'
    },
    {
      title: language === 'ms' ? 'Kalendar & Jadual Jabatan' : 'Department Staff Calendar',
      description:
        language === 'ms'
          ? 'Visualisasi kalendar bulanan & mingguan bagi semua mesyuarat, kursus, lawatan dan acara staf mengikut warna.'
          : 'Interactive monthly & weekly calendar of all staff meetings, training, visits, and events.',
      icon: Calendar,
      path: ROUTES.STAFF_CALENDAR,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: null
    },
    {
      title: language === 'ms' ? 'Carta Organisasi Jabatan' : 'Department Organizational Chart',
      description:
        language === 'ms'
          ? 'Hierarki kepimpinan jabatan, peranan seksyen unit, gred jawatan dan pemantauan status kehadiran masa nyata.'
          : 'Official leadership hierarchy, sectional units, staff roles, grades, and live presence status.',
      icon: Network,
      path: ROUTES.STAFF_ORG_CHART,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      badge: `${stats.totalStaff} Anggota`,
      badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/40'
    }
  ]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen text-slate-100">
      {/* Back navigation */}
      <div className="mb-8">
        <button
          onClick={() => navigate(ROUTES.HUB)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6 group text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>{language === 'ms' ? 'Kembali ke Hub Utama' : 'Back to Main Hub'}</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl shadow-inner">
              <Users className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">MyStaff</h1>
                <Badge className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                  {language === 'ms' ? 'Ekosistem Pengurusan Staf' : 'Staff Operations Ecosystem'}
                </Badge>
              </div>
              <p className="text-slate-400 mt-1">
                {language === 'ms'
                  ? 'Sistem Pemantauan Pergerakan Staf, Log Event & Kalendar Jabatan'
                  : 'Staff Movement Tracking, Event Log & Department Calendar'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">{language === 'ms' ? 'Jumlah Anggota Staf' : 'Total Staff'}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-white">
            {loading ? '...' : stats.totalStaff}
          </p>
          <p className="text-xs text-slate-500 mt-1">{language === 'ms' ? 'Berdaftar di jabatan' : 'In department'}</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">{language === 'ms' ? 'Hadir Bertugas' : 'On Duty'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-emerald-400">
            {loading ? '...' : stats.presentToday}
          </p>
          <p className="text-xs text-slate-500 mt-1">{language === 'ms' ? 'Di wad / stesen' : 'At station'}</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">{language === 'ms' ? 'Luar Stesen / Tugas' : 'Out of Office'}</span>
            <Briefcase className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-sky-400">
            {loading ? '...' : stats.onMovementToday + stats.onCourseToday}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ms' ? 'Mesyuarat & Kursus' : 'Meetings & Courses'}
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">{language === 'ms' ? 'Tarikh Akhir Aktif' : 'Active Deadlines'}</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-rose-400">
            {loading ? '...' : stats.activeDeadlinesCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">{language === 'ms' ? 'Laporan & unjuran' : 'Reports & estimates'}</p>
        </div>
      </div>

      {/* Action choices list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white tracking-wide">PILIHAN SUB-MODUL MYSTAFF</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className="group text-left bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 hover:bg-slate-800/40 hover:border-slate-700/80 transition-all duration-300 shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className={`p-3 rounded-xl border ${item.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {item.badge && (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                          item.badgeColor || 'border-slate-800 text-slate-400 bg-slate-950'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{item.description}</p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500/80 group-hover:text-emerald-400 transition-colors mt-auto">
                  <span>Masuk Menu</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StaffSubMenu
