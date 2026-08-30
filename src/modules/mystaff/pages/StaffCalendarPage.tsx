// src/modules/mystaff/pages/StaffCalendarPage.tsx
// Executive 2-Column Balanced Calendar & Comprehensive Daily Activity Hub

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  Users,
  Clock,
  MapPin,
  CalendarDays,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Presentation,
  Palmtree,
  Timer,
  Car,
  FileText,
  Building2,
  CheckCircle2,
  Check,
  Sparkles,
  Info,
  type LucideIcon
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import { getStaffMovements, updateMovementStatus } from '@/modules/mystaff/services/staffService'
import type { StaffMovement, MovementType, MovementStatus } from '@/shared/types/mystaff'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalEvent {
  id: string
  title: string
  person: string
  position: string
  departmentName?: string
  type: MovementType
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  destination?: string
  purpose?: string
  status: string
  daysCount: number
}

interface GridCell {
  dayNum: number
  dateStr: string
  isCurrentMonth: boolean
  isToday?: boolean
  isWeekend: boolean
  holiday?: PublicHoliday | null
}

interface PublicHoliday {
  name: string
  nameEn?: string
  isSarawakOnly: boolean
}

// ─── Public Holidays Database (Malaysia & Special for Sarawak) ────────────────

const PUBLIC_HOLIDAYS_DATABASE: Record<string, PublicHoliday> = {
  // 2025
  '2025-01-01': { name: 'Tahun Baru', nameEn: "New Year's Day", isSarawakOnly: false },
  '2025-01-29': { name: 'Tahun Baru Cina (Hari 1)', nameEn: 'Chinese New Year (Day 1)', isSarawakOnly: false },
  '2025-01-30': { name: 'Tahun Baru Cina (Hari 2)', nameEn: 'Chinese New Year (Day 2)', isSarawakOnly: false },
  '2025-03-31': { name: 'Hari Raya Aidilfitri (Hari 1)', nameEn: 'Hari Raya Aidilfitri', isSarawakOnly: false },
  '2025-04-01': { name: 'Hari Raya Aidilfitri (Hari 2)', nameEn: 'Hari Raya Aidilfitri', isSarawakOnly: false },
  '2025-04-18': { name: 'Good Friday', nameEn: 'Good Friday', isSarawakOnly: true },
  '2025-05-01': { name: 'Hari Pekerja', nameEn: 'Labour Day', isSarawakOnly: false },
  '2025-05-12': { name: 'Hari Wesak', nameEn: 'Wesak Day', isSarawakOnly: false },
  '2025-06-01': { name: 'Hari Gawai Dayak (Hari 1)', nameEn: 'Gawai Dayak (Day 1)', isSarawakOnly: true },
  '2025-06-02': { name: 'Hari Gawai Dayak (Hari 2)', nameEn: 'Gawai Dayak (Day 2)', isSarawakOnly: true },
  '2025-06-09': { name: 'Hari Keputeraan YDP Agong', nameEn: "King's Birthday", isSarawakOnly: false },
  '2025-06-07': { name: 'Hari Raya Haji / Aidiladha', nameEn: 'Hari Raya Haji', isSarawakOnly: false },
  '2025-06-27': { name: 'Awal Muharram (Maal Hijrah)', nameEn: 'Awal Muharram', isSarawakOnly: false },
  '2025-07-22': { name: 'Hari Sarawak', nameEn: 'Sarawak Independence Day', isSarawakOnly: true },
  '2025-08-31': { name: 'Hari Kebangsaan (Merdeka)', nameEn: 'National Day', isSarawakOnly: false },
  '2025-09-05': { name: 'Maulidur Rasul', nameEn: "Prophet Muhammad's Birthday", isSarawakOnly: false },
  '2025-09-16': { name: 'Hari Malaysia', nameEn: 'Malaysia Day', isSarawakOnly: false },
  '2025-10-11': { name: 'Hari Jadi TYT Sarawak', nameEn: "Sarawak Governor's Birthday", isSarawakOnly: true },
  '2025-10-20': { name: 'Hari Deepavali', nameEn: 'Deepavali', isSarawakOnly: false },
  '2025-12-24': { name: 'Hari Sebelum Krismas (Christmas Eve)', nameEn: 'Christmas Eve', isSarawakOnly: true },
  '2025-12-25': { name: 'Hari Krismas', nameEn: 'Christmas Day', isSarawakOnly: false },

  // 2026
  '2026-01-01': { name: 'Tahun Baru', nameEn: "New Year's Day", isSarawakOnly: false },
  '2026-02-17': { name: 'Tahun Baru Cina (Hari 1)', nameEn: 'Chinese New Year (Day 1)', isSarawakOnly: false },
  '2026-02-18': { name: 'Tahun Baru Cina (Hari 2)', nameEn: 'Chinese New Year (Day 2)', isSarawakOnly: false },
  '2026-03-20': { name: 'Hari Raya Aidilfitri (Hari 1)', nameEn: 'Hari Raya Aidilfitri (Day 1)', isSarawakOnly: false },
  '2026-03-21': { name: 'Hari Raya Aidilfitri (Hari 2)', nameEn: 'Hari Raya Aidilfitri (Day 2)', isSarawakOnly: false },
  '2026-04-03': { name: 'Good Friday', nameEn: 'Good Friday', isSarawakOnly: true },
  '2026-05-01': { name: 'Hari Pekerja', nameEn: 'Labour Day', isSarawakOnly: false },
  '2026-05-27': { name: 'Hari Raya Haji / Aidiladha', nameEn: 'Hari Raya Haji', isSarawakOnly: false },
  '2026-05-31': { name: 'Hari Wesak', nameEn: 'Wesak Day', isSarawakOnly: false },
  '2026-06-01': { name: 'Hari Gawai Dayak (Hari 1)', nameEn: 'Gawai Dayak (Day 1)', isSarawakOnly: true },
  '2026-06-02': { name: 'Hari Gawai Dayak (Hari 2)', nameEn: 'Gawai Dayak (Day 2)', isSarawakOnly: true },
  '2026-06-08': { name: 'Hari Keputeraan YDP Agong', nameEn: "King's Birthday", isSarawakOnly: false },
  '2026-06-16': { name: 'Awal Muharram (Maal Hijrah)', nameEn: 'Awal Muharram', isSarawakOnly: false },
  '2026-07-22': { name: 'Hari Sarawak', nameEn: 'Sarawak Independence Day', isSarawakOnly: true },
  '2026-08-25': { name: 'Maulidur Rasul', nameEn: "Prophet Muhammad's Birthday", isSarawakOnly: false },
  '2026-08-31': { name: 'Hari Kebangsaan (Merdeka)', nameEn: 'National Day', isSarawakOnly: false },
  '2026-09-16': { name: 'Hari Malaysia', nameEn: 'Malaysia Day', isSarawakOnly: false },
  '2026-10-10': { name: 'Hari Jadi TYT Sarawak', nameEn: "Sarawak Governor's Birthday", isSarawakOnly: true },
  '2026-11-08': { name: 'Hari Deepavali', nameEn: 'Deepavali', isSarawakOnly: false },
  '2026-12-24': { name: 'Hari Sebelum Krismas (Christmas Eve)', nameEn: 'Christmas Eve', isSarawakOnly: true },
  '2026-12-25': { name: 'Hari Krismas', nameEn: 'Christmas Day', isSarawakOnly: false },

  // 2027
  '2027-01-01': { name: 'Tahun Baru', nameEn: "New Year's Day", isSarawakOnly: false },
  '2027-02-06': { name: 'Tahun Baru Cina (Hari 1)', nameEn: 'Chinese New Year (Day 1)', isSarawakOnly: false },
  '2027-02-07': { name: 'Tahun Baru Cina (Hari 2)', nameEn: 'Chinese New Year (Day 2)', isSarawakOnly: false },
  '2027-03-10': { name: 'Hari Raya Aidilfitri (Hari 1)', nameEn: 'Hari Raya Aidilfitri (Day 1)', isSarawakOnly: false },
  '2027-03-11': { name: 'Hari Raya Aidilfitri (Hari 2)', nameEn: 'Hari Raya Aidilfitri (Day 2)', isSarawakOnly: false },
  '2027-03-26': { name: 'Good Friday', nameEn: 'Good Friday', isSarawakOnly: true },
  '2027-05-01': { name: 'Hari Pekerja', nameEn: 'Labour Day', isSarawakOnly: false },
  '2027-05-17': { name: 'Hari Raya Haji / Aidiladha', nameEn: 'Hari Raya Haji', isSarawakOnly: false },
  '2027-05-20': { name: 'Hari Wesak', nameEn: 'Wesak Day', isSarawakOnly: false },
  '2027-06-01': { name: 'Hari Gawai Dayak (Hari 1)', nameEn: 'Gawai Dayak (Day 1)', isSarawakOnly: true },
  '2027-06-02': { name: 'Hari Gawai Dayak (Hari 2)', nameEn: 'Gawai Dayak (Day 2)', isSarawakOnly: true },
  '2027-06-07': { name: 'Hari Keputeraan YDP Agong', nameEn: "King's Birthday", isSarawakOnly: false },
  '2027-06-06': { name: 'Awal Muharram', nameEn: 'Awal Muharram', isSarawakOnly: false },
  '2027-07-22': { name: 'Hari Sarawak', nameEn: 'Sarawak Independence Day', isSarawakOnly: true },
  '2027-08-15': { name: 'Maulidur Rasul', nameEn: "Prophet Muhammad's Birthday", isSarawakOnly: false },
  '2027-08-31': { name: 'Hari Kebangsaan (Merdeka)', nameEn: 'National Day', isSarawakOnly: false },
  '2027-09-16': { name: 'Hari Malaysia', nameEn: 'Malaysia Day', isSarawakOnly: false },
  '2027-10-09': { name: 'Hari Jadi TYT Sarawak', nameEn: "Sarawak Governor's Birthday", isSarawakOnly: true },
  '2027-10-29': { name: 'Hari Deepavali', nameEn: 'Deepavali', isSarawakOnly: false },
  '2027-12-24': { name: 'Hari Sebelum Krismas (Christmas Eve)', nameEn: 'Christmas Eve', isSarawakOnly: true },
  '2027-12-25': { name: 'Hari Krismas', nameEn: 'Christmas Day', isSarawakOnly: false },
}

function getPublicHoliday(dateStr: string): PublicHoliday | null {
  if (PUBLIC_HOLIDAYS_DATABASE[dateStr]) return PUBLIC_HOLIDAYS_DATABASE[dateStr]

  // Fixed recurring date fallback for any year:
  const mmdd = dateStr.slice(5)
  if (mmdd === '01-01') return { name: 'Tahun Baru', nameEn: "New Year's Day", isSarawakOnly: false }
  if (mmdd === '05-01') return { name: 'Hari Pekerja', nameEn: 'Labour Day', isSarawakOnly: false }
  if (mmdd === '06-01') return { name: 'Hari Gawai Dayak (Hari 1)', nameEn: 'Gawai Dayak (Day 1)', isSarawakOnly: true }
  if (mmdd === '06-02') return { name: 'Hari Gawai Dayak (Hari 2)', nameEn: 'Gawai Dayak (Day 2)', isSarawakOnly: true }
  if (mmdd === '07-22') return { name: 'Hari Sarawak', nameEn: 'Sarawak Independence Day', isSarawakOnly: true }
  if (mmdd === '08-31') return { name: 'Hari Kebangsaan (Merdeka)', nameEn: 'National Day', isSarawakOnly: false }
  if (mmdd === '09-16') return { name: 'Hari Malaysia', nameEn: 'Malaysia Day', isSarawakOnly: false }
  if (mmdd === '12-24') return { name: 'Hari Sebelum Krismas', nameEn: 'Christmas Eve', isSarawakOnly: true }
  if (mmdd === '12-25') return { name: 'Hari Krismas', nameEn: 'Christmas Day', isSarawakOnly: false }

  return null
}

interface EvBar {
  event: CalEvent
  startCol: number
  endCol: number
  lane: number
  isStartHere: boolean
  isEndHere: boolean
}

interface WeekData {
  bars: EvBar[]
  overflow: number[]
}

// ─── Design Constants ─────────────────────────────────────────────────────────

const MAX_LANES   = 3
const LANE_H      = 26   // px per event lane
const DAY_HDR_H   = 36   // px for day number row
const MIN_ROW_H   = 110  // px minimum height for each week row
const BOTTOM_PAD  = 12   // px at bottom of week row

// ─── Event Palette (vivid, enterprise-grade colors) ───────────────────────────

interface Palette {
  solid: string
  lightBg: string
  lightBorder: string
  label: string
  icon: LucideIcon
}

const PALETTE: Record<string, Palette> = {
  MEETING: {
    solid: '#2563eb',
    lightBg: '#eff6ff',
    lightBorder: '#bfdbfe',
    label: 'Mesyuarat',
    icon: Briefcase
  },
  COURSE: {
    solid: '#7c3aed',
    lightBg: '#f5f3ff',
    lightBorder: '#ddd6fe',
    label: 'Kursus / Latihan',
    icon: GraduationCap
  },
  CME: {
    solid: '#0891b2',
    lightBg: '#ecfeff',
    lightBorder: '#a5f3fc',
    label: 'CME / CPD',
    icon: Stethoscope
  },
  PRESENTATION: {
    solid: '#d97706',
    lightBg: '#fffbeb',
    lightBorder: '#fde68a',
    label: 'Pembentangan',
    icon: Presentation
  },
  ANNUAL_LEAVE: {
    solid: '#e11d48',
    lightBg: '#fff1f2',
    lightBorder: '#fecdd3',
    label: 'Cuti Tahunan',
    icon: Palmtree
  },
  TIME_OFF: {
    solid: '#ea580c',
    lightBg: '#fff7ed',
    lightBorder: '#fed7aa',
    label: 'Time Off',
    icon: Timer
  },
  SITE_VISIT: {
    solid: '#059669',
    lightBg: '#ecfdf5',
    lightBorder: '#a7f3d0',
    label: 'Lawatan / Tugas Luar',
    icon: MapPin
  },
  OFFICIAL_DUTY: {
    solid: '#059669',
    lightBg: '#ecfdf5',
    lightBorder: '#a7f3d0',
    label: 'Tugas Rasmi',
    icon: Car
  },
}

const FILTERS = [
  { id: 'ALL',          label: 'Semua Kategori', color: null },
  { id: 'MEETING',      label: 'Mesyuarat',      color: '#2563eb' },
  { id: 'ANNUAL_LEAVE', label: 'Cuti',           color: '#e11d48' },
  { id: 'COURSE',       label: 'Kursus',         color: '#7c3aed' },
  { id: 'CME',          label: 'CME',            color: '#0891b2' },
  { id: 'SITE_VISIT',   label: 'Lawatan',        color: '#059669' },
  { id: 'PRESENTATION', label: 'Pembentangan',   color: '#d97706' },
  { id: 'TIME_OFF',     label: 'Time Off',       color: '#ea580c' },
]

const MONTHS_MY = [
  'Januari','Februari','Mac','April','Mei','Jun',
  'Julai','Ogos','September','Oktober','November','Disember',
]
const DAYS_SHORT  = ['MON','TUE','WED','THU','FRI','SAT','SUN']
const DAYS_LONG   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserAvatarStyle(name: string): { bg: string; text: string } {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  const hue = Math.abs(h) % 360
  return {
    bg: `hsl(${hue}, 68%, 46%)`,
    text: '#ffffff'
  }
}

function getEventBarContent(ev: CalEvent): { bubble: string; text: string; isEvent: boolean } {
  const isEvent = ['MEETING', 'COURSE', 'CME', 'PRESENTATION'].includes(ev.type)

  if (isEvent) {
    let typeShort = 'Event'
    let bubbleText = 'EV'
    if (ev.type === 'CME') {
      typeShort = 'CME'
      bubbleText = 'CME'
    } else if (ev.type === 'MEETING') {
      typeShort = 'Mesyuarat'
      bubbleText = 'MTG'
    } else if (ev.type === 'COURSE') {
      typeShort = 'Kursus'
      bubbleText = 'KRS'
    } else if (ev.type === 'PRESENTATION') {
      typeShort = 'Pembentangan'
      bubbleText = 'PBN'
    }

    let displayText = ev.title || typeShort
    if (!displayText.toLowerCase().includes(typeShort.toLowerCase())) {
      displayText = `${typeShort}: ${displayText}`
    }

    return {
      bubble: bubbleText,
      text: displayText,
      isEvent: true
    }
  } else {
    // Log pergerakan: show user name
    const rawName = ev.person || 'Pegawai'
    const cleanName = rawName.replace(/^(Dr\.|En\.|Pn\.|Cik)\s+/i, '').trim()
    const shortName = cleanName.split(' ')[0] || rawName
    const initial = cleanName.charAt(0).toUpperCase() || 'P'

    return {
      bubble: initial,
      text: shortName,
      isEvent: false
    }
  }
}

function getPalette(type: string): Palette {
  return PALETTE[type] ?? {
    solid: '#6366f1',
    lightBg: '#eef2ff',
    lightBorder: '#c7d2fe',
    label: type,
    icon: CalendarDays
  }
}

function calculateDaysBetween(start: string, end: string): number {
  if (!start || !end) return 1
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff + 1)
}

function computeWeekBars(weekCells: GridCell[], events: CalEvent[]): WeekData {
  const ws = weekCells[0].dateStr
  const we = weekCells[6].dateStr

  const relevant = events.filter(e => e.startDate <= we && e.endDate >= ws)

  // Sort: multi-day first (longer span first), then by startDate
  const sorted = [...relevant].sort((a, b) => {
    const aLen = calculateDaysBetween(a.startDate, a.endDate)
    const bLen = calculateDaysBetween(b.startDate, b.endDate)
    if (aLen !== bLen) return bLen - aLen
    return a.startDate.localeCompare(b.startDate)
  })

  // Lane assignment: greedy first-fit
  const laneSlots: Array<Array<{ s: number; e: number }>> = []
  const bars: EvBar[] = []

  for (const ev of sorted) {
    const sc = ev.startDate < ws
      ? 0
      : weekCells.findIndex(c => c.dateStr === ev.startDate)
    const ec = ev.endDate > we
      ? 6
      : weekCells.findIndex(c => c.dateStr === ev.endDate)

    if (sc < 0 || ec < 0) continue

    let lane = 0
    for (; lane < 20; lane++) {
      if (!laneSlots[lane]) { laneSlots[lane] = []; break }
      const conflict = laneSlots[lane].some(o => o.s <= ec && o.e >= sc)
      if (!conflict) break
    }
    if (!laneSlots[lane]) laneSlots[lane] = []
    laneSlots[lane].push({ s: sc, e: ec })

    bars.push({
      event: ev,
      startCol: sc,
      endCol: ec,
      lane,
      isStartHere: ev.startDate >= ws,
      isEndHere: ev.endDate <= we,
    })
  }

  // Per-day overflow count (events that didn't fit in visible lanes)
  const overflow = weekCells.map((_, col) =>
    bars.filter(b => b.lane >= MAX_LANES && b.startCol <= col && b.endCol >= col).length
  )

  return { bars, overflow }
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return {
    weekday: dt.toLocaleDateString('en-US', { weekday: 'long' }),
    full: dt.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }),
    dayNumber: d,
    monthName: MONTHS_MY[m - 1],
    year: y
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const StaffCalendarPage: React.FC = () => {
  const navigate = useNavigate()
  const toast    = useToast()
  const user     = useAuthStore(s => s.user)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [typeFilter,   setTypeFilter]   = useState('ALL')
  const [movements,    setMovements]    = useState<StaffMovement[]>([])
  const [loading,      setLoading]      = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const handleMarkMovementDone = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setMovements(prev =>
        prev.map(m => (m.id === id ? { ...m, status: 'completed' as MovementStatus } : m))
      )
      await updateMovementStatus(id, 'completed' as MovementStatus)
      toast.success('Acara / Pergerakan berjaya ditandakan sebagai SELESAI!')
    } catch {
      toast.error('Gagal mengemaskini status pergerakan.')
    }
  }

  // ── Data loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await getStaffMovements({
          hospitalId:   user?.hospital_id,
          departmentId: user?.department_id,
        })
        if (alive && res.data) setMovements(res.data)
      } catch {
        if (alive) toast.error('Ralat memuatkan data kalendar pergerakan staf')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [user?.hospital_id, user?.department_id])

  const y = currentDate.getFullYear()
  const m = currentDate.getMonth()

  // ── Derived events ──────────────────────────────────────────────────────────
  const allEvents = useMemo<CalEvent[]>(() =>
    movements
      .filter(mv => mv.status !== 'cancelled' && mv.status !== 'rejected')
      .map(mv => {
        const fallbackName =
          mv.user_id === 'staff-2' ? 'Dr. Nurul Ain' :
          mv.user_id === 'staff-3' ? 'En. Faizul Akmal' :
          mv.user_id === 'default-user' ? 'Amri Abd Razak' : 'Pegawai Bertugas'

        const staffName = mv.user?.full_name || mv.logged_by_name || fallbackName

        return {
          id:             mv.id,
          title:          mv.tajuk,
          person:         staffName,
          position:       mv.user?.jawatan   ?? 'Pegawai Hospital',
          departmentName: mv.department?.department_name ?? undefined,
          type:           mv.jenis_pergerakan,
          startDate:      mv.tarikh_mula,
          endDate:        mv.tarikh_tamat,
          startTime:      mv.masa_keluar  ?? undefined,
          endTime:        mv.masa_balik   ?? undefined,
          destination:    mv.destination,
          purpose:        mv.tujuan,
          status:         mv.status,
          daysCount:      calculateDaysBetween(mv.tarikh_mula, mv.tarikh_tamat),
        }
      })
  , [movements])

  const filteredEvents = useMemo(() =>
    typeFilter === 'ALL'
      ? allEvents
      : allEvents.filter(e => e.type === typeFilter)
  , [allEvents, typeFilter])

  // ── Calendar grid calculation (Monday-first) ─────────────────────────────────
  const gridCells = useMemo<GridCell[]>(() => {
    const firstDayRaw = new Date(y, m, 1).getDay() // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const firstDayCol = (firstDayRaw + 6) % 7      // Monday = 0, Tuesday = 1, ... Sunday = 6
    const dim         = new Date(y, m + 1, 0).getDate()
    const prevLast    = new Date(y, m, 0).getDate()
    const cells: GridCell[] = []

    for (let i = firstDayCol - 1; i >= 0; i--) {
      const d  = prevLast - i
      const dt = new Date(y, m - 1, d)
      const ds = dt.toISOString().split('T')[0]
      const wd = dt.getDay()
      cells.push({
        dayNum: d,
        dateStr: ds,
        isCurrentMonth: false,
        isWeekend: wd === 0 || wd === 6,
        holiday: getPublicHoliday(ds)
      })
    }
    for (let d = 1; d <= dim; d++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const wd = new Date(y, m, d).getDay()
      cells.push({
        dayNum: d,
        dateStr: ds,
        isCurrentMonth: true,
        isToday: ds === todayStr,
        isWeekend: wd === 0 || wd === 6,
        holiday: getPublicHoliday(ds)
      })
    }
    for (let d = 1; cells.length < 42; d++) {
      const dt = new Date(y, m + 1, d)
      const ds = dt.toISOString().split('T')[0]
      const wd = dt.getDay()
      cells.push({
        dayNum: d,
        dateStr: ds,
        isCurrentMonth: false,
        isWeekend: wd === 0 || wd === 6,
        holiday: getPublicHoliday(ds)
      })
    }
    return cells
  }, [y, m, todayStr])

  const weeks = useMemo<GridCell[][]>(() =>
    Array.from({ length: 6 }, (_, i) => gridCells.slice(i * 7, i * 7 + 7))
  , [gridCells])

  const weekBars = useMemo<WeekData[]>(() =>
    weeks.map(w => computeWeekBars(w, filteredEvents))
  , [weeks, filteredEvents])

  // ── Detail panel data ────────────────────────────────────────────────────────
  const dayEvents = useMemo(() =>
    filteredEvents.filter(e => selectedDate >= e.startDate && selectedDate <= e.endDate)
  , [filteredEvents, selectedDate])

  const selectedHoliday = useMemo(() =>
    getPublicHoliday(selectedDate)
  , [selectedDate])

  const upcoming = useMemo(() =>
    allEvents
      .filter(e => e.startDate > selectedDate)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 5)
  , [allEvents, selectedDate])

  const selLabel = useMemo(() => {
    const f = fmtDate(selectedDate)
    return { ...f, isToday: selectedDate === todayStr }
  }, [selectedDate, todayStr])

  const monthTotal = useMemo(() => {
    const prefix = `${y}-${String(m + 1).padStart(2, '0')}`
    return allEvents.filter(e => e.startDate.startsWith(prefix) || e.endDate.startsWith(prefix)).length
  }, [allEvents, y, m])

  // Category counts for selected day
  const dayCategoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    dayEvents.forEach(ev => {
      counts[ev.type] = (counts[ev.type] || 0) + 1
    })
    return counts
  }, [dayEvents])

  // ── Navigation helpers ───────────────────────────────────────────────────────
  const prevMonth = useCallback(() => setCurrentDate(new Date(y, m - 1, 1)), [y, m])
  const nextMonth = useCallback(() => setCurrentDate(new Date(y, m + 1, 1)), [y, m])
  const goToday   = useCallback(() => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDate(now.toISOString().split('T')[0])
  }, [])

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-h-screen text-slate-800 font-sans space-y-5">

      {/* ════════════════ TOP EXECUTIVE HEADER ════════════════ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(ROUTES.STAFF_DASHBOARD)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all shadow-sm"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Kalendar Pergerakan Staf
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Hub
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {loading ? 'Memuatkan rekod...' : `Terdapat ${monthTotal} aktiviti dan pergerakan dijadualkan bagi ${MONTHS_MY[m]} ${y}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(ROUTES.STAFF_MOVEMENT)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pergerakan</span>
          </button>
        </div>
      </div>

      {/* ════════════════ CONTROLS & CATEGORY FILTER BAR ════════════════ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Month Navigator Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="min-w-[150px] text-center font-bold text-slate-900 text-sm tracking-tight px-2">
            {MONTHS_MY[m]} {y}
          </div>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            title="Bulan Seterusnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            Hari Ini
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          {FILTERS.map(f => {
            const active = typeFilter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {f.color && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: active ? '#ffffff' : f.color }}
                  />
                )}
                <span>{f.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ════════════════ 2-COLUMN BALANCED COMMAND CENTER ════════════════ */}
      {/* Compact Calendar (~42-45% width) + Expanded Summary Command Hub (~55-58% width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">

        {/* ──────────────── LEFT: COMPACT PROPORTIONAL CALENDAR ──────────────── */}
        <div className="lg:col-span-5 2xl:col-span-5 space-y-4">
          <div className="bg-slate-100/60 border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-sm relative space-y-2.5">
            
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-20 rounded-2xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <span className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                  <span>Memuatkan rekod kalendar...</span>
                </div>
              </div>
            )}

            {/* Days Header (Monday to Sunday) */}
            <div className="grid grid-cols-7 gap-2 pb-1">
              {DAYS_SHORT.map((d, i) => (
                <div
                  key={d}
                  className={`py-2 text-center text-xs font-bold uppercase tracking-wider rounded-xl shadow-2xs border ${
                    i === 5
                      ? 'text-sky-700 bg-sky-50/80 border-sky-100'
                      : i === 6
                      ? 'text-rose-700 bg-rose-50/80 border-rose-100'
                      : 'text-slate-600 bg-white border-slate-200/80'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* 6 Week Rows with Separated Date Boxes */}
            <div className="space-y-2">
              {weeks.map((weekCells, wi) => {
                const { bars, overflow } = weekBars[wi]
                const visLanes = bars.filter(b => b.lane < MAX_LANES)
                const maxLane = visLanes.reduce((acc, b) => Math.max(acc, b.lane), -1)
                const lanesUsed = maxLane + 1
                const calculatedH = DAY_HDR_H + lanesUsed * LANE_H + BOTTOM_PAD
                const rowH = Math.max(MIN_ROW_H, calculatedH)

                return (
                  <div
                    key={wi}
                    className="relative"
                    style={{ minHeight: `${MIN_ROW_H}px`, height: `${rowH}px` }}
                  >
                    {/* Day Number Cell Grid — 7 distinct separated boxes with gap-2 */}
                    <div className="grid grid-cols-7 gap-2 absolute inset-0">
                      {weekCells.map((cell, ci) => {
                        const isSel      = cell.dateStr === selectedDate
                        const isWknd     = ci === 5 || ci === 6
                        const hasHoliday = !!cell.holiday
                        const isSarawak  = cell.holiday?.isSarawakOnly

                        return (
                          <div
                            key={ci}
                            onClick={() => setSelectedDate(cell.dateStr)}
                            className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-150 flex flex-col justify-between cursor-pointer h-full relative overflow-hidden ${
                              isSel
                                ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-300 shadow-xs z-1'
                                : cell.isToday
                                ? 'bg-white border-slate-900 ring-2 ring-slate-900/10 shadow-xs'
                                : !cell.isCurrentMonth
                                ? 'bg-slate-50/40 border-slate-200/50 text-slate-300'
                                : hasHoliday
                                ? isSarawak
                                  ? 'bg-amber-50/90 border-amber-300 shadow-2xs hover:border-amber-400 hover:bg-amber-100/60 ring-1 ring-amber-200/60'
                                  : 'bg-rose-50/80 border-rose-200 shadow-2xs hover:border-rose-300 hover:bg-rose-100/60'
                                : isWknd
                                ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 shadow-2xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between">
                                <span
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold tabular-nums transition-all ${
                                    cell.isToday
                                      ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/20'
                                      : isSel
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : !cell.isCurrentMonth
                                      ? 'text-slate-300'
                                      : hasHoliday
                                      ? isSarawak ? 'bg-amber-200/90 text-amber-950 font-black' : 'bg-rose-200/90 text-rose-950 font-black'
                                      : isWknd
                                      ? 'text-slate-500'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  {cell.dayNum}
                                </span>

                                {overflow[ci] > 0 && (
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-1.5 py-0.5 rounded-md leading-tight">
                                    +{overflow[ci]} lagi
                                  </span>
                                )}
                              </div>

                              {/* Holiday Remark Pill */}
                              {cell.holiday && (
                                <div
                                  className={`mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold truncate border shadow-2xs ${
                                    cell.holiday.isSarawakOnly
                                      ? 'bg-amber-100/95 text-amber-950 border-amber-300'
                                      : 'bg-rose-100/95 text-rose-950 border-rose-200'
                                  }`}
                                  title={`${cell.holiday.name} (${cell.holiday.isSarawakOnly ? 'Cuti Khas Sarawak' : 'Cuti Umum Malaysia'})`}
                                >
                                  <span className="shrink-0">{cell.holiday.isSarawakOnly ? '⭐' : '🇲🇾'}</span>
                                  <span className="truncate">{cell.holiday.name.split('(')[0]}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Spanning Event Bars Layer */}
                    <div className="absolute top-[36px] left-0 right-0 bottom-0 pointer-events-none">
                      {visLanes.map((bar, bi) => {
                        const pal   = getPalette(bar.event.type)
                        const span  = bar.endCol - bar.startCol + 1
                        const topPx = bar.lane * LANE_H

                        const leftStyle =
                          bar.startCol === 0
                            ? '0px'
                            : `calc(${bar.startCol} * ((100% - 48px) / 7 + 8px))`

                        const widthStyle =
                          span === 7
                            ? '100%'
                            : `calc(${span} * ((100% - 48px) / 7) + ${span - 1} * 8px)`

                        const rL = bar.isStartHere ? '8px' : '0px'
                        const rR = bar.isEndHere   ? '8px' : '0px'

                        const clickDate =
                          bar.event.startDate >= weekCells[0].dateStr
                            ? bar.event.startDate
                            : weekCells[0].dateStr

                        const isEventActive = selectedEventId === bar.event.id
                        const content = getEventBarContent(bar.event)

                        return (
                          <div
                            key={`${bar.event.id}-${wi}-${bi}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDate(clickDate)
                              setSelectedEventId(bar.event.id)
                            }}
                            title={
                              content.isEvent
                                ? `${pal.label}: ${bar.event.title} (Pegawai: ${bar.event.person})`
                                : `${bar.event.person} (${pal.label}): ${bar.event.title}`
                            }
                            className={`pointer-events-auto absolute flex items-center gap-1.5 px-2 cursor-pointer transition-all duration-150 shadow-xs hover:brightness-105 hover:z-10 ${
                              isEventActive ? 'ring-2 ring-slate-900 ring-offset-1 z-10' : ''
                            }`}
                            style={{
                              left: leftStyle,
                              width: widthStyle,
                              top: `${topPx}px`,
                              height: `${LANE_H - 3}px`,
                              backgroundColor: pal.solid,
                              borderRadius: `${rL} ${rR} ${rR} ${rL}`,
                            }}
                          >
                            {bar.isStartHere && (
                              <>
                                <div
                                  className={`flex items-center justify-center font-bold text-white shrink-0 shadow-xs ${
                                    content.isEvent
                                      ? 'px-1 h-4 rounded-md text-[8px] tracking-wider'
                                      : 'w-4 h-4 rounded-full text-[8px]'
                                  }`}
                                  style={{ backgroundColor: 'rgba(255,255,255,0.28)' }}
                                >
                                  {content.bubble}
                                </div>
                                <span className="text-[11px] font-semibold text-white truncate leading-none">
                                  {content.text}
                                </span>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Color Legend Row with Public Holidays */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Kategori Cuti & Pergerakan
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-800">
                  <span>🇲🇾</span>
                  <span>Cuti Umum Malaysia</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-300 text-[11px] font-extrabold text-amber-950">
                  <span>⭐</span>
                  <span>Cuti Khas Sarawak</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {Object.entries(PALETTE).filter(([k]) => k !== 'OFFICIAL_DUTY').map(([key, pal]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: pal.solid }}
                  />
                  <span className="text-xs font-medium text-slate-600">{pal.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ──────────────── RIGHT: EXPANDED DETAILED SUMMARY & EVENT COMMAND HUB ──────────────── */}
        <div className="lg:col-span-7 2xl:col-span-7 space-y-4 lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            
            {/* Header: Selected Day Typography & Fast Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {selLabel.weekday}
                  </h2>
                  {selLabel.isToday && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                      Hari Ini
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span>{selLabel.full}</span>
                </p>
              </div>

              {/* Total Day Events Metric */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2 self-start sm:self-auto">
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 tabular-nums leading-none">
                    {dayEvents.length}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    Aktiviti
                  </div>
                </div>
              </div>
            </div>

            {/* Public Holiday Banner in Summary Panel */}
            {selectedHoliday && (
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-3 shadow-xs transition-all ${
                  selectedHoliday.isSarawakOnly
                    ? 'bg-gradient-to-r from-amber-50 via-yellow-50/80 to-amber-50/40 border-amber-300 text-amber-950'
                    : 'bg-gradient-to-r from-rose-50 via-red-50/70 to-rose-50/40 border-rose-200 text-rose-950'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-2xs ${
                    selectedHoliday.isSarawakOnly
                      ? 'bg-amber-100 border border-amber-300 text-amber-800'
                      : 'bg-rose-100 border border-rose-200 text-rose-700'
                  }`}
                >
                  {selectedHoliday.isSarawakOnly ? '⭐' : '🇲🇾'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        selectedHoliday.isSarawakOnly
                          ? 'bg-amber-200/70 text-amber-950 border-amber-300'
                          : 'bg-rose-200/70 text-rose-950 border-rose-300'
                      }`}
                    >
                      {selectedHoliday.isSarawakOnly ? 'Cuti Khas Negeri Sarawak' : 'Cuti Umum Kebangsaan (Malaysia)'}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 mt-1">
                    {selectedHoliday.name}
                  </h4>
                  {selectedHoliday.nameEn && (
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {selectedHoliday.nameEn}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Category Summary Breakdown Badges (if events exist) */}
            {dayEvents.length > 0 && Object.keys(dayCategoryBreakdown).length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {Object.entries(dayCategoryBreakdown).map(([type, count]) => {
                  const pal = getPalette(type)
                  return (
                    <div
                      key={type}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border"
                      style={{
                        backgroundColor: pal.lightBg,
                        borderColor: pal.lightBorder,
                        color: pal.solid
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.solid }} />
                      <span>{count} {pal.label}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Event List Section */}
            <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1 hide-scrollbar">
              {dayEvents.length === 0 ? (
                /* Empty State */
                <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm mb-3">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Semua Staf di Stesen
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[260px] mt-1 leading-relaxed">
                    Tiada pergerakan luar, kursus, mesyuarat atau cuti direkodkan untuk tarikh ini.
                  </p>
                  <button
                    onClick={() => navigate(ROUTES.STAFF_MOVEMENT)}
                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Catat Pergerakan</span>
                  </button>
                </div>
              ) : (
                /* Rich Spacious Event Cards */
                dayEvents.map(ev => {
                  const pal = getPalette(ev.type)
                  const Icon = pal.icon
                  const isMulti = ev.startDate !== ev.endDate
                  const avatarStyle = getUserAvatarStyle(ev.person)
                  const isSelected = selectedEventId === ev.id

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEventId(ev.id)}
                      className={`group p-4 sm:p-5 rounded-2xl bg-white border transition-all duration-200 cursor-pointer space-y-3.5 ${
                        isSelected
                          ? 'ring-2 ring-indigo-500 shadow-md border-indigo-200 bg-indigo-50/10'
                          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md'
                      }`}
                      style={{
                        borderLeftWidth: '5px',
                        borderLeftColor: pal.solid
                      }}
                    >
                      {/* Top Header Row: Category Badge + Status + Time */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: pal.lightBg,
                              color: pal.solid,
                              borderColor: pal.lightBorder
                            }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{pal.label}</span>
                          </span>

                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ev.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : ev.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {ev.status === 'completed' ? '✓ Selesai' : ev.status === 'confirmed' ? 'Disahkan' : 'Aktif'}
                          </span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-lg tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ev.startTime || '08:00'} – {ev.endTime || '17:00'}</span>
                        </div>
                      </div>

                      {/* Main Title */}
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-950 transition-colors">
                        {ev.title}
                      </h4>

                      {/* Officer Profile Strip */}
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-sm shrink-0"
                          style={{ backgroundColor: avatarStyle.bg }}
                        >
                          {ev.person.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {ev.person}
                          </div>
                          <div className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
                            <span>{ev.position}</span>
                            {ev.departmentName && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400">{ev.departmentName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details Grid (Destination, Duration, Purpose) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                        
                        {/* Destination */}
                        {ev.destination && (
                          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100/80">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Lokasi / Destinasi
                              </span>
                              <span className="font-semibold text-slate-800 break-words">
                                {ev.destination}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Multi-Day Span / Tempoh */}
                        <div className={`flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 ${!ev.destination ? 'sm:col-span-2' : ''}`}>
                          <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Tempoh Pergerakan
                            </span>
                            <span className="font-semibold text-slate-800">
                              {ev.startDate.split('-').reverse().join('/')}
                              {isMulti ? ` – ${ev.endDate.split('-').reverse().join('/')} (${ev.daysCount} Hari)` : ' (1 Hari)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Purpose / Catatan Box */}
                      {ev.purpose && (
                        <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
                          <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                            <Info className="w-3.5 h-3.5 text-amber-600" />
                            <span>Tujuan / Keterangan:</span>
                          </div>
                          <p className="font-normal text-slate-700 italic">
                            "{ev.purpose}"
                          </p>
                        </div>
                      )}

                      {/* Mark as Done action button if not completed */}
                      {ev.status !== 'completed' && (
                        <div className="flex items-center justify-end pt-1">
                          <button
                            onClick={(e) => handleMarkMovementDone(ev.id, e)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 text-xs font-bold transition-all shadow-2xs group/btn"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600 group-hover/btn:text-white" />
                            <span>Tanda Selesai</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Upcoming Lookahead (Akan Datang) */}
            {upcoming.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Akan Datang ({MONTHS_MY[m]})
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600">
                    {upcoming.length} Rekod Seterusnya
                  </span>
                </div>

                <div className="space-y-2">
                  {upcoming.map(up => {
                    const pal = getPalette(up.type)
                    return (
                      <div
                        key={up.id}
                        onClick={() => {
                          setSelectedDate(up.startDate)
                          setSelectedEventId(up.id)
                        }}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: pal.solid }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                              {up.title}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate">
                              {up.person} • <span className="font-semibold" style={{ color: pal.solid }}>{pal.label}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-slate-700 tabular-nums">
                            {up.startDate.split('-').reverse().slice(0, 2).join('/')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Helper Styles */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

export default StaffCalendarPage
