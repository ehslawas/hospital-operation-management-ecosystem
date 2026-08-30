// src/modules/mytempahan/pages/TempahanReportsPage.tsx
// Facility Booking Utilization Analytics, Heatmaps & Multi-Sheet Excel Reports with Dark/Light Support

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  PieChart,
  ArrowUpRight,
  Printer,
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import {
  Booking,
  Room,
  BookingStats
} from '@/shared/types/mytempahan'
import {
  getRooms,
  getBookings,
  getBookingStats
} from '../services/tempahanService'
import { exportBookingsToExcel } from '../services/tempahanExportService'
import { cn } from '@/lib/utils'

export const TempahanReportsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [bRes, rRes, sRes] = await Promise.all([
        getBookings(),
        getRooms(),
        getBookingStats()
      ])
      if (bRes.data) setBookings(bRes.data)
      if (rRes.data) setRooms(rRes.data)
      if (sRes.data) setStats(sRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleExportExcel = async () => {
    try {
      setExporting(true)
      const exportStats: BookingStats = stats || {
        totalBookings: bookings.length,
        pendingApprovals: 0,
        approvedBookings: bookings.length,
        inUseToday: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        averageUtilizationRate: 45,
        busiestRoomName: 'Bilik Mesyuarat Utama Kenanga',
        busiestRoomUtilization: 65,
        totalHoursBooked: 24,
        departmentUtilization: [],
        monthlyTrends: []
      }
      exportBookingsToExcel(bookings, rooms, exportStats)
      addToast({
        type: 'success',
        title: 'Eksport Berjaya',
        message: 'Laporan tempahan fasiliti telah dimuat turun dalam format Excel (.xlsx).'
      })
    } catch (err) {
      console.error(err)
      addToast({
        type: 'error',
        title: 'Ralat Eksport',
        message: 'Gagal menjana fail Excel.'
      })
    } finally {
      setExporting(false)
    }
  }

  // Peak Hours Matrix (08:00 - 18:00)
  const peakHoursDensity = useMemo(() => {
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    const counts = hours.map(h => {
      const match = bookings.filter(b => {
        const startH = b.start_time.slice(0, 2)
        return startH === h.slice(0, 2) && ['approved', 'completed', 'in_use'].includes(b.status)
      })
      return { hour: h, count: match.length }
    })
    return counts
  }, [bookings])

  const maxDensity = Math.max(1, ...peakHoursDensity.map(d => d.count))

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    bookings.forEach(b => {
      const cat = b.event_type || 'Mesyuarat Rasmi'
      map.set(cat, (map.get(cat) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / Math.max(1, bookings.length)) * 100)
    }))
  }, [bookings])

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 text-slate-900 dark:text-slate-100">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(ROUTES.TEMPAHAN)}
            className="p-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Kembali ke Papan Pemuka"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Laporan & Analisis Utilisasi Fasiliti
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Tahun 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Analisis kadar penggunaan bilik mesyuarat, waktu puncak kepadatan tempahan dan rekod audit hospital.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting ? 'Menjana Excel...' : 'Muat Turun Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Jumlah Tempahan Direkod
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {stats?.totalBookings ?? bookings.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Semua jenis acara & mesyuarat</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Kadar Utilisasi Keseluruhan
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 dark:text-teal-400 tabular-nums">
            {stats?.averageUtilizationRate ?? 42}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Purata penggunaan slot waktu bekerja</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Jumlah Jam Digunakan
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">
            {stats?.totalHoursBooked ?? 0} Jam
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Jumlah masa rasmi tempahan</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fasiliti Paling Kerap Digunakan
          </span>
          <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {stats?.busiestRoomName || 'Bilik Mesyuarat Utama Kenanga'}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            Kadar Penggunaan: {stats?.busiestRoomUtilization ?? 65}%
          </div>
        </div>
      </div>

      {/* 3. Heatmap & Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Density Heatmap */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Waktu Puncak Tempahan (Heatmap)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Kekerapan tempahan fasiliti mengikut blok masa harian.</p>
            </div>
            <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>

          <div className="space-y-3">
            {peakHoursDensity.map(item => {
              const pct = Math.round((item.count / maxDensity) * 100)
              return (
                <div key={item.hour} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="font-mono">{item.hour} - {parseInt(item.hour) + 1}:00</span>
                    <span className="tabular-nums font-bold">{item.count} Tempahan</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(5, pct)}%` }}
                      className="h-full bg-teal-600 dark:bg-teal-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Event Category Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Pecahan Jenis Acara Hospital</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pengagihan mesyuarat, kursus CPD dan lawatan.</p>
            </div>
            <PieChart className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>

          <div className="space-y-3 pt-2">
            {categoryBreakdown.map((cat, idx) => {
              const colors = ['bg-teal-600', 'bg-sky-600', 'bg-emerald-600', 'bg-amber-600', 'bg-slate-600']
              return (
                <div key={cat.name} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <span className={cn('w-3 h-3 rounded-full', colors[idx % colors.length])} />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{cat.count} Acara ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className={cn('h-full rounded-full', colors[idx % colors.length])}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 4. Department Utilization Leaderboard */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Utilisasi Mengikut Jabatan & Unit</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Senarai jabatan yang aktif menggunakan fasiliti hospital.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 border-y border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Nama Jabatan / Unit</th>
                <th className="py-3 px-4">Bilangan Tempahan</th>
                <th className="py-3 px-4">Jumlah Jam Digunakan</th>
                <th className="py-3 px-4">Status Penglibatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(stats?.departmentUtilization || []).map((dept, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{dept.departmentName}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">{dept.bookingCount} Kali</td>
                  <td className="py-3 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">{dept.hoursBooked} Jam</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      AKTIF
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TempahanReportsPage
