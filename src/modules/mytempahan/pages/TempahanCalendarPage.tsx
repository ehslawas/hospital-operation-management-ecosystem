// src/modules/mytempahan/pages/TempahanCalendarPage.tsx
// Interactive Multi-View Calendar for Hospital Facility & Room Bookings with Dark/Light Support

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  Filter,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar as CalendarIcon,
  Layers,
  Sparkles
} from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import {
  Room,
  Booking
} from '@/shared/types/mytempahan'
import { PUBLIC_HOLIDAYS_DATABASE } from '../constants/defaultVenues'
import { getRooms, getBookings } from '../services/tempahanService'
import { BookingDetailDrawer } from '../components/BookingDetailDrawer'
import { cn } from '@/lib/utils'

type CalendarView = 'month' | 'week' | 'day'

const DAYS_SHORT = ['Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab', 'Ahd']
const MONTH_NAMES = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
]

export const TempahanCalendarPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialRoomId = searchParams.get('roomId') || 'all'

  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [activeView, setActiveView] = useState<CalendarView>('month')
  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialRoomId)

  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [roomsRes, bookingsRes] = await Promise.all([
        getRooms(),
        getBookings()
      ])
      if (roomsRes.data) setRooms(roomsRes.data)
      if (bookingsRes.data) setBookings(bookingsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter bookings by selected room
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (selectedRoomId !== 'all' && b.room_id !== selectedRoomId) return false
      return ['approved', 'in_use', 'completed', 'pending'].includes(b.status)
    })
  }, [bookings, selectedRoomId])

  // Month navigation
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Generate Month Grid Matrix (Monday first)
  const calendarMatrix = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    let startDayOffset = firstDayOfMonth.getDay() - 1
    if (startDayOffset === -1) startDayOffset = 6 // Sunday is last column

    const daysInMonth = lastDayOfMonth.getDate()
    const matrix: Array<{
      dateStr: string
      dayNum: number
      isCurrentMonth: boolean
      holiday?: string
      bookings: Booking[]
    }> = []

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i
      const dDate = new Date(year, month - 1, dNum)
      const dStr = dDate.toISOString().slice(0, 10)
      matrix.push({
        dateStr: dStr,
        dayNum: dNum,
        isCurrentMonth: false,
        holiday: PUBLIC_HOLIDAYS_DATABASE[dStr],
        bookings: filteredBookings.filter(b => b.date === dStr)
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dDate = new Date(year, month, day)
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      matrix.push({
        dateStr: dStr,
        dayNum: day,
        isCurrentMonth: true,
        holiday: PUBLIC_HOLIDAYS_DATABASE[dStr],
        bookings: filteredBookings.filter(b => b.date === dStr)
      })
    }

    // Next month filler days (fill up to multiple of 7)
    const remainingSlots = 7 - (matrix.length % 7)
    if (remainingSlots < 7) {
      for (let day = 1; day <= remainingSlots; day++) {
        const dDate = new Date(year, month + 1, day)
        const dStr = dDate.toISOString().slice(0, 10)
        matrix.push({
          dateStr: dStr,
          dayNum: day,
          isCurrentMonth: false,
          holiday: PUBLIC_HOLIDAYS_DATABASE[dStr],
          bookings: filteredBookings.filter(b => b.date === dStr)
        })
      }
    }

    return matrix
  }, [year, month, filteredBookings])

  // Week Grid generation
  const weekDays = useMemo(() => {
    const current = new Date(currentDate)
    const dayOfWeek = current.getDay()
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(current.setDate(current.getDate() + distanceToMonday))

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      const dStr = d.toISOString().slice(0, 10)
      days.push({
        date: d,
        dateStr: dStr,
        dayName: DAYS_SHORT[i],
        dayNum: d.getDate(),
        holiday: PUBLIC_HOLIDAYS_DATABASE[dStr]
      })
    }
    return days
  }, [currentDate])

  const hoursList = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 text-slate-900 dark:text-slate-100">
      {/* 1. Top Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.TEMPAHAN)}
            className="p-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Kembali ke Papan Pemuka"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {MONTH_NAMES[month]} {year}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {filteredBookings.length} Tempahan
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Jadual ketersediaan bilik mesyuarat dan dewan persidangan Hospital Lawas
            </p>
          </div>
        </div>

        {/* Filters, Views & Action Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Room Filter Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedRoomId}
              onChange={e => setSelectedRoomId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="all">Semua Fasiliti & Bilik</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.floor_level})
                </option>
              ))}
            </select>
          </div>

          {/* Month / Week / Day Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold">
            {(['month', 'week', 'day'] as CalendarView[]).map(v => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all capitalize',
                  activeView === v
                    ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {v === 'month' ? 'Bulan' : v === 'week' ? 'Minggu' : 'Hari'}
              </button>
            ))}
          </div>

          {/* Month Pagination Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Book Trigger */}
          <button
            onClick={() => navigate(ROUTES.TEMPAHAN_REQUEST_NEW)}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tempah Slot</span>
          </button>
        </div>
      </div>

      {/* 2. Calendar View Content */}
      {activeView === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Day Name Columns */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center text-xs font-bold text-slate-600 dark:text-slate-300 py-3">
            {DAYS_SHORT.map(d => (
              <div key={d} className="uppercase tracking-wider text-[11px]">
                {d}
              </div>
            ))}
          </div>

          {/* Month Cells Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {calendarMatrix.map((cell, idx) => {
              const isToday = cell.dateStr === new Date().toISOString().slice(0, 10)

              return (
                <div
                  key={idx}
                  className={cn(
                    'min-h-[120px] p-2 flex flex-col justify-between transition-colors relative group',
                    cell.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600',
                    isToday && 'ring-2 ring-inset ring-teal-500/50 dark:ring-teal-400/40 bg-teal-50/20 dark:bg-teal-950/20'
                  )}
                >
                  {/* Date Header & Holiday Label */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono',
                          isToday
                            ? 'bg-teal-700 text-white shadow-xs'
                            : cell.isCurrentMonth
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                        )}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Quick book (+) button on hover */}
                      <button
                        onClick={() => navigate(`${ROUTES.TEMPAHAN_REQUEST_NEW}?date=${cell.dateStr}${selectedRoomId !== 'all' ? `&roomId=${selectedRoomId}` : ''}`)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-slate-500 hover:text-teal-700 transition-all"
                        title="Tempah pada tarikh ini"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Holiday Chip */}
                    {cell.holiday && (
                      <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 px-1.5 py-0.5 rounded mb-1.5 truncate">
                        ★ {cell.holiday}
                      </div>
                    )}
                  </div>

                  {/* Bookings for the Day */}
                  <div className="space-y-1 overflow-hidden">
                    {cell.bookings.slice(0, 3).map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBooking(b)
                          setDrawerOpen(true)
                        }}
                        className={cn(
                          'p-1.5 rounded-md text-[10px] font-medium border cursor-pointer truncate transition-transform hover:scale-[1.02]',
                          b.status === 'approved' && 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                          b.status === 'pending' && 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                          b.status === 'in_use' && 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
                          b.status === 'completed' && 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        )}
                        title={`${b.start_time}-${b.end_time}: ${b.purpose} (${b.room?.name})`}
                      >
                        <span className="font-bold font-mono mr-1">{b.start_time}</span>
                        <span>{b.purpose}</span>
                      </div>
                    ))}

                    {cell.bookings.length > 3 && (
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1">
                        +{cell.bookings.length - 3} lagi acara
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {activeView === 'week' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Columns */}
            <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center py-3">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Masa</div>
              {weekDays.map(d => (
                <div key={d.dateStr} className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  <div className="uppercase text-[10px] text-slate-400">{d.dayName}</div>
                  <div className="text-sm font-mono">{d.dayNum}</div>
                  {d.holiday && (
                    <div className="text-[9px] text-amber-600 dark:text-amber-400 truncate px-1">
                      {d.holiday}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {hoursList.map(hour => (
                <div key={hour} className="grid grid-cols-8 min-h-[56px]">
                  <div className="p-2 text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/20">
                    {hour}
                  </div>
                  {weekDays.map(d => {
                    const match = filteredBookings.filter(b => {
                      const startH = b.start_time.slice(0, 2)
                      return b.date === d.dateStr && startH === hour.slice(0, 2)
                    })

                    return (
                      <div
                        key={d.dateStr}
                        className="p-1 border-r border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors relative"
                      >
                        {match.map(b => (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSelectedBooking(b)
                              setDrawerOpen(true)
                            }}
                            className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[10px] text-teal-800 dark:text-teal-300 cursor-pointer shadow-2xs"
                          >
                            <div className="font-bold truncate">{b.purpose}</div>
                            <div className="text-[9px] text-teal-600 dark:text-teal-400 font-mono">
                              {b.start_time} - {b.end_time}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Day View */}
      {activeView === 'day' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Agenda Harian: {currentDate.toISOString().slice(0, 10)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Susunan jadual tempahan sepanjang waktu operasi hospital.
              </p>
            </div>
            <button
              onClick={() => navigate(`${ROUTES.TEMPAHAN_REQUEST_NEW}?date=${currentDate.toISOString().slice(0, 10)}`)}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
            >
              + Tempah Hari Ini
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {hoursList.map(hour => {
              const match = filteredBookings.filter(b => {
                const startH = b.start_time.slice(0, 2)
                return b.date === currentDate.toISOString().slice(0, 10) && startH === hour.slice(0, 2)
              })

              return (
                <div key={hour} className="py-3 flex items-start gap-4">
                  <span className="w-16 text-xs font-mono font-bold text-slate-400 dark:text-slate-500 shrink-0">
                    {hour}
                  </span>
                  <div className="flex-1 space-y-2">
                    {match.length === 0 ? (
                      <div className="text-xs text-slate-300 dark:text-slate-700 italic">Slot kosong</div>
                    ) : (
                      match.map(b => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setSelectedBooking(b)
                            setDrawerOpen(true)
                          }}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-teal-700 dark:text-teal-300 text-xs">
                                {b.start_time} - {b.end_time}
                              </span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                {b.room?.name}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{b.purpose}</h4>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Pemohon: {b.pemohon_name} ({b.pemohon_department}) • {b.attendees_count} Pax
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Drawer */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

export default TempahanCalendarPage
