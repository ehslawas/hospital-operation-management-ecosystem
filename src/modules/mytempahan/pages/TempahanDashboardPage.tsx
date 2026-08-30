// src/modules/mytempahan/pages/TempahanDashboardPage.tsx
// Professional Command Center Dashboard for Hospital Facility & Room Bookings

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  Plus,
  Calendar,
  Clock,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Filter,
  Search,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Layers,
  FileSpreadsheet
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import {
  Room,
  Booking,
  BookingStats
} from '@/shared/types/mytempahan'
import {
  getRooms,
  getBookings,
  getBookingStats
} from '../services/tempahanService'
import { RoomCard } from '../components/RoomCard'
import { BookingDetailDrawer } from '../components/BookingDetailDrawer'
import { cn } from '@/lib/utils'

export const TempahanDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [loading, setLoading] = useState(true)

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [roomsRes, bookingsRes, statsRes] = await Promise.all([
        getRooms(),
        getBookings(),
        getBookingStats()
      ])

      if (roomsRes.data) setRooms(roomsRes.data)
      if (bookingsRes.data) setBookings(bookingsRes.data)
      if (statsRes.data) setStats(statsRes.data)
    } catch (err) {
      console.error('Error loading tempahan dashboard data:', err)
      addToast({
        type: 'error',
        title: 'Ralat Memuat Data',
        message: 'Gagal memuat senarai fasiliti dan tempahan terkini.'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const handleUpdate = () => loadData()
    window.addEventListener('tempahan_bookings_updated', handleUpdate)
    window.addEventListener('tempahan_rooms_updated', handleUpdate)

    return () => {
      window.removeEventListener('tempahan_bookings_updated', handleUpdate)
      window.removeEventListener('tempahan_rooms_updated', handleUpdate)
    }
  }, [])

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q) || r.room_code.toLowerCase().includes(q)
      }
      return true
    })
  }, [rooms, selectedCategory, searchQuery])

  // Today's bookings
  const todayBookings = useMemo(() => {
    return bookings
      .filter(b => b.date === todayStr && ['approved', 'in_use', 'completed'].includes(b.status))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [bookings, todayStr])

  // Recent applications (all statuses)
  const recentBookings = useMemo(() => {
    return bookings.slice(0, 6)
  }, [bookings])

  // Map room occupation status for current hour
  const currentOccupancyMap = useMemo(() => {
    const now = new Date()
    const currentHours = now.getHours()
    const currentMins = now.getMinutes()
    const nowTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMins.toString().padStart(2, '0')}`

    const map = new Map<string, { eventName: string; endTime: string }>()

    todayBookings.forEach(b => {
      if (nowTimeStr >= b.start_time && nowTimeStr <= b.end_time) {
        map.set(b.room_id, {
          eventName: b.purpose,
          endTime: b.end_time
        })
      }
    })

    return map
  }, [todayBookings])

  const handleBookRoom = (roomId: string) => {
    navigate(`${ROUTES.TEMPAHAN_REQUEST_NEW}?roomId=${roomId}`)
  }

  const handleViewSchedule = (roomId: string) => {
    navigate(`${ROUTES.TEMPAHAN_CALENDAR}?roomId=${roomId}`)
  }

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setDrawerOpen(true)
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 text-slate-900 dark:text-slate-100">
      {/* 1. Official Enterprise Hospital Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(ROUTES.HUB)}
            className="p-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Kembali ke Hub Utama"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0 shadow-2xs">
            <CalendarDays className="w-6 h-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Pusat Kawalan Tempahan Fasiliti
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Hospital Lawas
              </span>
              {stats?.pendingApprovals ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                  {stats.pendingApprovals} Menunggu Kelulusan
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sistem Pengurusan & Tempahan Dewan Persidangan, Bilik Mesyuarat dan Ruang Latihan Klinikal
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate(ROUTES.TEMPAHAN_CALENDAR)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-2 shadow-2xs"
          >
            <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Kalendar Penuh</span>
          </button>

          <button
            onClick={() => navigate(ROUTES.TEMPAHAN_REQUEST_NEW)}
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tempahan Baharu</span>
          </button>
        </div>
      </div>

      {/* 2. Key Operational Metrics (KPI) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Events */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tempahan Hari Ini
            </span>
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {todayBookings.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acara & mesyuarat berjadual
            </div>
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div
          onClick={() => navigate(ROUTES.TEMPAHAN_APPROVAL_QUEUE)}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3 cursor-pointer group hover:border-amber-400 dark:hover:border-amber-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Menunggu Kelulusan
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums flex items-center gap-2">
              {stats?.pendingApprovals ?? 0}
              {stats?.pendingApprovals ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold border border-amber-200 dark:border-amber-800">
                  Tindakan
                </span>
              ) : null}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 group-hover:text-amber-600 dark:group-hover:text-amber-400">
              Semak kelulusan permohonan <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card 3: Utilization Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kadar Utilisasi
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {stats?.averageUtilizationRate ?? 42}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bulan semasa ({stats?.totalHoursBooked ?? 0} Jam)
            </div>
          </div>
        </div>

        {/* Card 4: Available Venues */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fasiliti Tersedia
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {rooms.length - currentOccupancyMap.size} / {rooms.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bilik sedia untuk ditempah
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Venue Directory & Today's Schedule */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Room Directory */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Ketersediaan Fasiliti & Bilik</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilih fasiliti hospital untuk semak jadual atau tempah slot masa.</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'meeting_room', label: 'Mesyuarat' },
                { id: 'conference_hall', label: 'Dewan' },
                { id: 'training_room', label: 'Latihan' },
                { id: 'computer_lab', label: 'Makmal IT' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                    selectedCategory === tab.id
                      ? 'bg-slate-900 dark:bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filteredRooms.map(room => {
              const currentOcc = currentOccupancyMap.get(room.id)
              return (
                <RoomCard
                  key={room.id}
                  room={room}
                  isCurrentlyOccupied={Boolean(currentOcc)}
                  currentEventName={currentOcc?.eventName}
                  currentEventEnd={currentOcc?.endTime}
                  onBook={handleBookRoom}
                  onViewSchedule={handleViewSchedule}
                />
              )
            })}
          </div>
        </div>

        {/* Right 1 Col: Today's Schedule & Quick Links */}
        <div className="space-y-6">
          {/* Today's Agenda Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Jadual Acara Hari Ini</h3>
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                {todayStr}
              </span>
            </div>

            {todayBookings.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 stroke-1" />
                Tiada acara atau mesyuarat berjadual untuk hari ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayBookings.map(b => (
                  <div
                    key={b.id}
                    onClick={() => openBookingDetails(b)}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-teal-700 dark:text-teal-300 font-mono">
                        {b.start_time} - {b.end_time}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {b.room?.name || 'Bilik'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                      {b.purpose}
                    </h4>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span className="truncate">{b.pemohon_name}</span>
                      <span className="font-semibold">{b.attendees_count} Pax</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate(ROUTES.TEMPAHAN_CALENDAR)}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              Lihat Kalendar Bulanan <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Akses Pantas Modul
            </h4>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => navigate(ROUTES.TEMPAHAN_MY_BOOKINGS)}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors text-left"
              >
                <span>Permohonan Tempahan Saya</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => navigate(ROUTES.TEMPAHAN_APPROVAL_QUEUE)}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors text-left"
              >
                <span>Semakan Kelulusan Pentadbir</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => navigate(ROUTES.TEMPAHAN_ROOM_REGISTRY)}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors text-left"
              >
                <span>Direktori Fasiliti & Bilik</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => navigate(ROUTES.TEMPAHAN_REPORTS)}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors text-left"
              >
                <span>Laporan Utilisasi & Statistik</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Booking Applications Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Senarai Permohonan Terkini</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Permohonan tempahan ruang yang dihantar oleh jabatan hospital.</p>
          </div>

          <button
            onClick={() => navigate(ROUTES.TEMPAHAN_MY_BOOKINGS)}
            className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 border-y border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">No. Rujukan</th>
                <th className="py-3 px-4">Tujuan / Program</th>
                <th className="py-3 px-4">Fasiliti</th>
                <th className="py-3 px-4">Tarikh & Masa</th>
                <th className="py-3 px-4">Pemohon</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentBookings.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{b.booking_number}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-[220px] truncate">{b.purpose}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{b.room?.name || '-'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    <div>{b.date}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{b.start_time} - {b.end_time}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{b.pemohon_name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{b.pemohon_department}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-semibold border',
                        b.status === 'approved' && 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                        b.status === 'pending' && 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                        b.status === 'rejected' && 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                        b.status === 'completed' && 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      )}
                    >
                      {b.status === 'approved' ? 'DILULUSKAN' : b.status === 'pending' ? 'DALAM SEMAKAN' : b.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openBookingDetails(b)}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition-colors"
                    >
                      Perincian
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

export default TempahanDashboardPage
