// src/modules/myporter/pages/PorterRosterPage.tsx
import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  Plus, 
  Check, 
  X, 
  Sun, 
  Sunset, 
  Moon, 
  Coffee, 
  FileDown, 
  ArrowLeftRight, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  GripVertical,
  Info,
  CalendarDays,
  ShieldCheck,
  Filter,
  Search,
  Layers,
  Printer
} from 'lucide-react'
import { useToast } from '@/stores/toastStore'
import { Button, Input, Modal, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { 
  getPorterRoster, 
  saveRosterShift, 
  moveOrUpdateRosterShift, 
  deleteRosterShift, 
  getPorterProfiles, 
  getShiftExchanges, 
  createShiftExchangeRequest, 
  approveShiftExchange, 
  rejectShiftExchange,
  calculateWeeklyWorkHours,
  getShiftHours
} from '../services/porterService'
import { exportRosterToPdf, type WeekRange } from '../services/porterRosterPdfService'
import type { 
  PorterRosterShift, 
  PorterProfile, 
  ShiftType, 
  ShiftExchangeRequest,
  WeeklyWorkHourSummary 
} from '@/shared/types/myporter'

export const PorterRosterPage: React.FC = () => {
  const toast = useToast()

  const [roster, setRoster] = useState<PorterRosterShift[]>([])
  const [porters, setPorters] = useState<PorterProfile[]>([])
  const [exchanges, setExchanges] = useState<ShiftExchangeRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Current calendar view date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeView, setActiveView] = useState<'matrix' | 'weekly_board' | 'exchanges'>('matrix')

  // Weekly filter: 'all' | 1 | 2 | 3 | 4 | 5
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | 'all'>(1)

  // Filtering porters & zones
  const [filterPorterId, setFilterPorterId] = useState<string>('all')
  const [filterZone, setFilterZone] = useState<string>('all')
  const [filterSearch, setFilterSearch] = useState<string>('')

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<{
    shiftId?: string
    porterId: string
    shiftType: ShiftType
    sourceDate: string
  } | null>(null)

  // PDF Export Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)

  // Shift Edit / Assignment Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editPorterId, setEditPorterId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editShift, setEditShift] = useState<ShiftType>('morning')
  const [editZone, setEditZone] = useState('Zon A (Wad Kenanga / Mawar)')

  // Shift Swap Modal
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false)
  const [swapRequesterId, setSwapRequesterId] = useState('')
  const [swapRequesterDate, setSwapRequesterDate] = useState('')
  const [swapRequesterShift, setSwapRequesterShift] = useState<ShiftType>('evening')
  const [swapTargetId, setSwapTargetId] = useState('')
  const [swapTargetDate, setSwapTargetDate] = useState('')
  const [swapTargetShift, setSwapTargetShift] = useState<ShiftType>('morning')
  const [swapReason, setSwapReason] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rostRes, profRes, excRes] = await Promise.all([
        getPorterRoster(),
        getPorterProfiles(),
        getShiftExchanges()
      ])
      if (rostRes.data) setRoster(rostRes.data)
      if (profRes.data) setPorters(profRes.data)
      if (excRes.data) setExchanges(excRes.data)
    } catch (err: any) {
      toast.error('Ralat Memuat Jadual', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])
  // Month computations
  const currentYear = selectedDate.getFullYear()
  const currentMonth = selectedDate.getMonth()
  const monthName = selectedDate.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Construct 7-day weekly ranges for the selected month
  const weekRanges: WeekRange[] = useMemo(() => {
    const ranges: WeekRange[] = []
    let currentStart = 1
    let wIdx = 1

    while (currentStart <= daysInMonth) {
      const currentEnd = Math.min(currentStart + 6, daysInMonth)
      const startStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentStart).padStart(2, '0')}`
      const endStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentEnd).padStart(2, '0')}`

      ranges.push({
        weekIndex: wIdx,
        label: `Minggu ${wIdx} (${currentStart} - ${currentEnd} ${selectedDate.toLocaleDateString('ms-MY', { month: 'short' })})`,
        startDay: currentStart,
        endDay: currentEnd,
        startDateStr: startStr,
        endDateStr: endStr
      })

      currentStart += 7
      wIdx++
    }

    return ranges
  }, [currentYear, currentMonth, daysInMonth, selectedDate])

  const activeWeekRange = useMemo(() => {
    if (selectedWeekIndex === 'all') return null
    return weekRanges.find(w => w.weekIndex === selectedWeekIndex) || weekRanges[0]
  }, [selectedWeekIndex, weekRanges])

  const handlePrevMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1))
    setSelectedWeekIndex(1)
  }

  const handleNextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, 1))
    setSelectedWeekIndex(1)
  }

  const handleToday = () => {
    setSelectedDate(new Date())
    setSelectedWeekIndex(1)
  }

  // Filtered porters list based on search, zone, or selected porter
  const filteredPorters = useMemo(() => {
    return porters.filter(p => {
      if (filterPorterId !== 'all' && p.id !== filterPorterId) return false
      if (filterZone !== 'all' && !p.assigned_zone.includes(filterZone)) return false
      if (filterSearch) {
        const q = filterSearch.toLowerCase()
        if (!p.full_name.toLowerCase().includes(q) && !p.staff_no.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [porters, filterPorterId, filterZone, filterSearch])

  // Drag and drop handlers
  const handleDragStart = (porterId: string, shiftType: ShiftType, sourceDate: string, shiftId?: string) => {
    setDraggedItem({
      shiftId,
      porterId,
      shiftType,
      sourceDate
    })
  }

  const handleDropOnDate = async (targetPorterId: string, targetDate: string) => {
    if (!draggedItem) return

    try {
      const res = await moveOrUpdateRosterShift(targetPorterId, targetDate, draggedItem.shiftType)
      if (res.data) {
        toast.success('Syif Dikemaskini (Drag & Drop)', `Syif ${draggedItem.shiftType.toUpperCase()} berjaya diletakkan pada ${targetDate}.`)
        fetchData()
      }
    } catch (err: any) {
      toast.error('Ralat Mengemaskini Syif', err.message)
    } finally {
      setDraggedItem(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Quick Shift Change (1-click cycle)
  const handleCellClick = (porterId: string, dateStr: string, currentShift?: ShiftType) => {
    const shiftOrder: ShiftType[] = ['morning', 'evening', 'night', 'off']
    const nextShift = currentShift ? shiftOrder[(shiftOrder.indexOf(currentShift) + 1) % shiftOrder.length] : 'morning'

    moveOrUpdateRosterShift(porterId, dateStr, nextShift).then(() => {
      fetchData()
    })
  }

  // Weekly 43h Work Hours summaries for all porters in the active week
  const weeklySummaries: WeeklyWorkHourSummary[] = useMemo(() => {
    if (porters.length === 0) return []
    const refDate = activeWeekRange ? activeWeekRange.startDateStr : selectedDate
    return porters.map(p => calculateWeeklyWorkHours(p.id, refDate))
  }, [porters, roster, selectedDate, activeWeekRange])

  // PDF Export
  const handleExportPDF = async (type: 'weekly' | 'monthly') => {
    setIsPdfModalOpen(false)
    try {
      if (type === 'weekly') {
        const targetWeek = activeWeekRange || weekRanges[0]
        await exportRosterToPdf(filteredPorters, roster, selectedDate, targetWeek)
        toast.success('Eksport PDF Mingguan Berjaya', `Jadual ${targetWeek.label} Hospital Lawas telah dimuat turun.`)
      } else {
        await exportRosterToPdf(filteredPorters, roster, selectedDate, null)
        toast.success('Eksport PDF Bulanan Berjaya', 'Jadual bertugas bulanan Hospital Lawas telah dimuat turun.')
      }
    } catch (err: any) {
      toast.error('Ralat Eksport PDF', err.message)
    }
  }

  // Shift Exchange Submit
  const handleCreateSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    const reqPorter = porters.find(p => p.id === swapRequesterId)
    const tgtPorter = porters.find(p => p.id === swapTargetId)

    if (!reqPorter || !tgtPorter) {
      toast.error('Pilihan Tidak Sah', 'Sila pilih pemohon dan penerima pertukaran.')
      return
    }

    try {
      const res = await createShiftExchangeRequest({
        requester_porter_id: reqPorter.id,
        requester_porter_name: reqPorter.full_name,
        requester_date: swapRequesterDate,
        requester_shift: swapRequesterShift,
        target_porter_id: tgtPorter.id,
        target_porter_name: tgtPorter.full_name,
        target_date: swapTargetDate,
        target_shift: swapTargetShift,
        reason: swapReason || 'Urusan peribadi/keluarga.'
      })

      if (res.data) {
        toast.success('Permohonan Dihantar', 'Permohonan pertukaran syif sedang menunggu kelulusan penyelia.')
        setIsSwapModalOpen(false)
        fetchData()
      }
    } catch (err: any) {
      toast.error('Ralat Menghantar Permohonan', err.message)
    }
  }

  const handleApproveSwap = async (exchangeId: string) => {
    try {
      const res = await approveShiftExchange(exchangeId, 'Penyelia PPK')
      if (res.data) {
        toast.success('Pertukaran Diluluskan!', 'Jadual bertugas kedua-dua PPK telah ditukar secara automatik.')
        fetchData()
      }
    } catch (err: any) {
      toast.error('Ralat Kelulusan', err.message)
    }
  }

  const handleRejectSwap = async (exchangeId: string) => {
    try {
      const res = await rejectShiftExchange(exchangeId, 'Tidak menepati kekosongan syif')
      if (res.data) {
        toast.success('Permohonan Ditolak', 'Permohonan pertukaran telah ditolak.')
        fetchData()
      }
    } catch (err: any) {
      toast.error('Ralat', err.message)
    }
  }

  const shiftConfigMap: Record<ShiftType, { label: string; short: string; hours: number; color: string; icon: React.ElementType }> = {
    morning: { label: 'Pagi (07:00 - 15:00)', short: 'P', hours: 8, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30', icon: Sun },
    evening: { label: 'Petang (14:00 - 22:00)', short: 'PT', hours: 8, color: 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30', icon: Sunset },
    night: { label: 'Malam (21:30 - 07:30)', short: 'M', hours: 10, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30', icon: Moon },
    off: { label: 'Rehat (Off Day)', short: 'R', hours: 0, color: 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800', icon: Coffee }
  }
  return (
    <div className="w-full space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-sky-400" />
            <span>Jadual Bertugas Syif & Zon PPK</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pengurusan penugasan giliran syif Pembantu Perawatan Kesihatan (PPK) mengikut minggu, had 43 jam mingguan, dan pertukaran syif
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-bold rounded-xl px-4 py-2 text-xs shadow-lg shadow-rose-500/20"
          >
            <FileDown className="w-4 h-4" />
            <span>Eksport Jadual (PDF)</span>
          </Button>

          <Button
            onClick={() => {
              if (porters.length >= 2) {
                setSwapRequesterId(porters[0].id)
                setSwapTargetId(porters[1].id)
                const todayStr = new Date().toISOString().split('T')[0]
                setSwapRequesterDate(todayStr)
                setSwapTargetDate(todayStr)
              }
              setIsSwapModalOpen(true)
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl px-4 py-2 text-xs shadow-lg shadow-amber-500/20"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Mohon Tukar Syif ({exchanges.filter(e => e.status === 'pending').length})</span>
          </Button>

          <Button
            onClick={() => {
              setEditDate(new Date().toISOString().split('T')[0])
              if (porters.length > 0) setEditPorterId(porters[0].id)
              setIsEditModalOpen(true)
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold rounded-xl px-4 py-2 text-xs shadow-lg shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Penugasan</span>
          </Button>
        </div>
      </div>

      {/* WEEKLY 43-HOUR COMPLIANCE & DEFICIT CARRY-FORWARD BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Had Bekerja Maksimum 43 Jam Seminggu</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded-full">
                  Pekeliling KKM PPK
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sekiranya jumlah jam minggu ini kurang daripada 43 jam, baki defisit perlu diganti/ditambah pada jadual minggu berikutnya.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-300 font-mono bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
            {activeWeekRange ? (
              <span>Paparan: <strong className="text-sky-400">{activeWeekRange.label}</strong> ({activeWeekRange.startDateStr} hingga {activeWeekRange.endDateStr})</span>
            ) : (
              <span>Paparan: <strong className="text-sky-400">Keseluruhan Bulan {monthName}</strong></span>
            )}
          </div>
        </div>

        {/* Porters 43h Workload Progress Bar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {weeklySummaries.map((summary) => {
            const pct = Math.min(100, Math.round((summary.total_hours_scheduled / 43) * 100))
            const isOptimum = summary.status === 'optimum_43h'
            const isDeficit = summary.status === 'deficit_addon_required'
            const isOver = summary.status === 'over_cap'

            return (
              <div
                key={summary.porter_id}
                className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-2.5 hover:border-slate-700 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-white text-xs">{summary.porter_name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Had: 43 Jam Seminggu</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-white">
                      {summary.total_hours_scheduled} <span className="text-[10px] font-normal text-slate-400">/ 43j</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver
                        ? 'bg-rose-500'
                        : isOptimum
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-amber-500 to-sky-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Status Notice */}
                <div className="flex items-center justify-between text-[10px]">
                  {isOptimum && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Cukup 43 Jam (Optimum)</span>
                    </span>
                  )}
                  {isDeficit && (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Kurang {summary.deficit_carried_forward}j (Ganti minggu depan)</span>
                    </span>
                  )}
                  {isOver && (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Lebih {summary.hour_difference}j (Melebihi Had)</span>
                    </span>
                  )}
                  <span className="font-mono text-slate-500 font-bold">{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* WEEKLY FILTER & MONTH NAVIGATOR BAR */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Month Picker */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrevMonth}
              variant="outline"
              className="p-2 h-9 w-9 rounded-xl border-slate-800 bg-slate-950 text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-black text-sm text-white capitalize min-w-[170px] text-center">
              {monthName}
            </div>

            <Button
              onClick={handleNextMonth}
              variant="outline"
              className="p-2 h-9 w-9 rounded-xl border-slate-800 bg-slate-950 text-slate-300 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleToday}
              variant="outline"
              className="text-xs font-bold border-slate-800 bg-slate-950 text-sky-400 hover:text-white rounded-xl h-9 px-3"
            >
              Hari Ini
            </Button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveView('matrix')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeView === 'matrix' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Matriks Jadual
            </button>
            <button
              onClick={() => setActiveView('weekly_board')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeView === 'weekly_board' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Papan Syif Harian
            </button>
            <button
              onClick={() => setActiveView('exchanges')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeView === 'exchanges' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Tukar Syif</span>
              {exchanges.filter(e => e.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* WEEK SELECTION TABS */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>Pilih Minggu:</span>
          </span>

          <button
            onClick={() => setSelectedWeekIndex('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedWeekIndex === 'all'
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Semua Bulan (1 - {daysInMonth})
          </button>

          {weekRanges.map((w) => (
            <button
              key={w.weekIndex}
              onClick={() => setSelectedWeekIndex(w.weekIndex)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedWeekIndex === w.weekIndex
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* PORTER, ZONE & SEARCH FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tapis Petugas PPK</label>
            <select
              value={filterPorterId}
              onChange={(e) => setFilterPorterId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
            >
              <option value="all">Semua Petugas PPK ({porters.length})</option>
              {porters.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.staff_no})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tapis Zon Penugasan</label>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
            >
              <option value="all">Semua Zon Hospital</option>
              <option value="Zon A">Zon A (Wad Kenanga / Mawar)</option>
              <option value="Zon B">Zon B (Dewan Bedah & ICU)</option>
              <option value="Zon C">Zon C (Makmal & Farmasi)</option>
              <option value="Zon D">Zon D (Kecemasan & Trauma)</option>
              <option value="Central Pool">Central Pool & Triage</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cari Nama / No. Staf</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari PPK..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SHIFT LEGEND BAR */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-900/60 border border-slate-800/80 px-5 py-3 rounded-2xl">
        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mr-2">Petunjuk Syif:</span>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-bold">
          <Sun className="w-3.5 h-3.5" />
          <span>Pagi (P): 07:00 - 15:00 (8j)</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-300 font-bold">
          <Sunset className="w-3.5 h-3.5" />
          <span>Petang (PT): 14:00 - 22:00 (8j)</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 font-bold">
          <Moon className="w-3.5 h-3.5" />
          <span>Malam (M): 21:30 - 07:30 (10j)</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-bold">
          <Coffee className="w-3.5 h-3.5" />
          <span>Rehat (R): Hari Kelepasan (0j)</span>
        </div>
        <span className="text-slate-500 ml-auto text-[11px] hidden lg:inline">
          💡 <em>Klik atau seret (drag & drop) kotak syif untuk menukar penugasan.</em>
        </span>
      </div>
      {/* VIEW 1: MATRIX TABLE (WEEKLY OR MONTHLY) */}
      {activeView === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-sky-400" />
              <span>
                {activeWeekRange
                  ? `Jadual Penugasan Syif: ${activeWeekRange.label}`
                  : `Jadual Penugasan Syif: Bulan Penuh (${monthName})`}
              </span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Memaparkan <strong className="text-sky-400">{filteredPorters.length}</strong> orang petugas PPK
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-56 sticky left-0 bg-slate-950 z-20">Petugas PPK</th>
                  <th className="p-3 w-40">Zon Bertugas</th>
                  {(() => {
                    const startDay = activeWeekRange ? activeWeekRange.startDay : 1
                    const endDay = activeWeekRange ? activeWeekRange.endDay : daysInMonth
                    const count = endDay - startDay + 1

                    return Array.from({ length: count }, (_, i) => {
                      const dayNum = startDay + i
                      const dateObj = new Date(currentYear, currentMonth, dayNum)
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
                      const isToday = new Date().toDateString() === dateObj.toDateString()

                      return (
                        <th
                          key={dayNum}
                          className={`p-2.5 text-center border-l border-slate-800/60 ${
                            activeWeekRange ? 'min-w-[70px]' : 'min-w-[34px]'
                          } ${
                            isToday ? 'bg-sky-500/20 text-sky-300 font-black' : isWeekend ? 'text-amber-400/80 bg-slate-950/80' : ''
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase">{dateObj.toLocaleDateString('ms-MY', { weekday: 'short' })}</div>
                          <div className="text-xs font-extrabold">{dayNum}</div>
                        </th>
                      )
                    })
                  })()}
                  <th className="p-3 text-center border-l border-slate-800">Jumlah Jam</th>
                  <th className="p-3 text-center border-l border-slate-800">Status 43j</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPorters.map((porter) => {
                  let totalHours = 0
                  const startDay = activeWeekRange ? activeWeekRange.startDay : 1
                  const endDay = activeWeekRange ? activeWeekRange.endDay : daysInMonth
                  const count = endDay - startDay + 1

                  return (
                    <tr key={porter.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={porter.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                            alt=""
                            className="w-8 h-8 rounded-xl object-cover ring-2 ring-slate-800 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-extrabold text-white text-xs truncate">{porter.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{porter.staff_no} • {porter.gred}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-slate-300 font-medium text-xs truncate max-w-[150px]">
                        {porter.assigned_zone}
                      </td>

                      {Array.from({ length: count }, (_, i) => {
                        const dayNum = startDay + i
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                        const shiftObj = roster.find(r => r.porter_id === porter.id && r.date === dateStr)
                        const shiftType = (shiftObj?.shift || 'off') as ShiftType
                        const cfg = shiftConfigMap[shiftType]
                        const hours = getShiftHours(shiftType)
                        totalHours += hours

                        return (
                          <td
                            key={dayNum}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDropOnDate(porter.id, dateStr)}
                            onClick={() => handleCellClick(porter.id, dateStr, shiftType)}
                            className="p-1.5 text-center border-l border-slate-800/40 hover:bg-sky-500/10 cursor-pointer transition-colors"
                            title={`${porter.full_name} - ${dateStr}: ${cfg.label} (${hours} jam). Klik untuk tukar syif.`}
                          >
                            <div
                              draggable
                              onDragStart={() => handleDragStart(porter.id, shiftType, dateStr, shiftObj?.id)}
                              className={`mx-auto rounded-xl font-extrabold flex items-center justify-center border transition-all select-none ${
                                activeWeekRange ? 'h-9 px-2 text-xs gap-1' : 'w-7 h-7 text-[10px]'
                              } ${cfg.color}`}
                            >
                              <span>{cfg.short}</span>
                              {activeWeekRange && (
                                <span className="text-[9px] font-normal opacity-80">({hours}j)</span>
                              )}
                            </div>
                          </td>
                        )
                      })}

                      <td className="p-3 text-center font-mono font-black text-sky-400 border-l border-slate-800 bg-slate-950/40">
                        {totalHours}j
                      </td>

                      <td className="p-3 text-center border-l border-slate-800 bg-slate-950/40">
                        {totalHours === 43 ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold text-[10px] rounded-full">
                            Optimum (43j)
                          </span>
                        ) : totalHours < 43 ? (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 font-bold text-[10px] rounded-full">
                            Kurang {43 - totalHours}j
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 font-bold text-[10px] rounded-full">
                            Lebih {totalHours - 43}j
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: WEEKLY BOARD WITH DRAG & DROP LANES */}
      {activeView === 'weekly_board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(['morning', 'evening', 'night', 'off'] as ShiftType[]).map((shiftKey) => {
            const cfg = shiftConfigMap[shiftKey]
            const todayStr = selectedDate.toISOString().split('T')[0]
            const portersInShift = roster.filter(r => r.date === todayStr && r.shift === shiftKey)

            return (
              <div
                key={shiftKey}
                onDragOver={handleDragOver}
                onDrop={() => {
                  if (draggedItem) {
                    moveOrUpdateRosterShift(draggedItem.porterId, todayStr, shiftKey).then(() => {
                      toast.success('Syif Ditukar', `PPK telah dipindahkan ke ${cfg.label}.`)
                      fetchData()
                      setDraggedItem(null)
                    })
                  }
                }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 min-h-[380px] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <cfg.icon className="w-5 h-5 text-sky-400" />
                    <div>
                      <h4 className="font-extrabold text-white text-xs">{cfg.label}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{cfg.hours} Jam Bekerja</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-200">
                    {portersInShift.length} PPK
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {portersInShift.map((r) => {
                    const porter = porters.find(p => p.id === r.porter_id)

                    return (
                      <div
                        key={r.id}
                        draggable
                        onDragStart={() => handleDragStart(r.porter_id, r.shift, todayStr, r.id)}
                        className="bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-3.5 space-y-2 cursor-grab active:cursor-grabbing transition-all shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={porter?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-800"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-white text-xs truncate">{r.porter_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{porter?.staff_no} • {r.zone}</p>
                          </div>
                          <GripVertical className="w-4 h-4 text-slate-600" />
                        </div>
                      </div>
                    )
                  })}

                  {portersInShift.length === 0 && (
                    <div className="h-full flex items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center">
                      <p className="text-xs text-slate-500">Tiada penugasan bagi syif ini. Tarik kad PPK ke sini untuk memasukkan.</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VIEW 3: SHIFT EXCHANGES MANAGER */}
      {activeView === 'exchanges' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-amber-400" />
                <span>Senarai Permohonan Pertukaran Syif (Suka Sama Suka)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelulusan rasmi pertukaran syif antara kakitangan PPK dengan audit automatik jadual
              </p>
            </div>

            <Button
              onClick={() => setIsSwapModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl px-4 py-2"
            >
              + Mohon Pertukaran Baharu
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Pemohon Asal</th>
                  <th className="p-3.5">Syif Dilepaskan</th>
                  <th className="p-3.5">Petugas Pengganti</th>
                  <th className="p-3.5">Syif Diambil</th>
                  <th className="p-3.5">Sebab Pertukaran</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {exchanges.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3.5 font-bold text-white">{ex.requester_porter_name}</td>
                    <td className="p-3.5 font-mono">
                      <span className="text-amber-400 font-bold">{ex.requester_shift.toUpperCase()}</span> ({ex.requester_date})
                    </td>
                    <td className="p-3.5 font-bold text-white">{ex.target_porter_name}</td>
                    <td className="p-3.5 font-mono">
                      <span className="text-sky-400 font-bold">{ex.target_shift.toUpperCase()}</span> ({ex.target_date})
                    </td>
                    <td className="p-3.5 text-slate-300 max-w-xs truncate">{ex.reason}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        ex.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : ex.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                      }`}>
                        {ex.status === 'approved' ? 'DILULUSKAN' : ex.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU KELULUSAN'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {ex.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleApproveSwap(ex.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 font-bold"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Lulus</span>
                          </Button>
                          <Button
                            onClick={() => handleRejectSwap(ex.id)}
                            variant="outline"
                            className="border-rose-700 text-rose-400 hover:bg-rose-950 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 font-bold"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[10px]">
                          {ex.approved_by || 'Selesai'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF EXPORT SELECTOR MODAL */}
      <Modal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="Pilihan Eksport Jadual Bertugas PDF (Hospital Lawas)"
      >
        <div className="space-y-4 p-3 text-xs">
          <p className="text-slate-300">
            Sila pilih format penjanaan fail PDF rasmi berserta Kepala Surat Hospital Lawas dan Jata Negara:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => handleExportPDF('weekly')}
              className="p-4 bg-slate-950 border border-slate-800 hover:border-sky-500/60 rounded-2xl cursor-pointer hover:bg-sky-500/5 transition-all space-y-2"
            >
              <div className="p-2.5 bg-sky-500/10 rounded-xl w-fit text-sky-400">
                <FileDown className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-white text-sm">Jadual Mingguan</h4>
              <p className="text-slate-400 text-[11px]">
                Eksport jadual bagi <strong className="text-sky-400">{activeWeekRange?.label || 'Minggu 1'}</strong> (7 hari dengan kolum luas dan butiran syif mingguan).
              </p>
            </div>

            <div
              onClick={() => handleExportPDF('monthly')}
              className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500/60 rounded-2xl cursor-pointer hover:bg-emerald-500/5 transition-all space-y-2"
            >
              <div className="p-2.5 bg-emerald-500/10 rounded-xl w-fit text-emerald-400">
                <Printer className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-white text-sm">Jadual Bulanan Penuh</h4>
              <p className="text-slate-400 text-[11px]">
                Eksport matriks keseluruhan bagi <strong className="text-emerald-400">Bulan {monthName}</strong> (1 hingga {daysInMonth} hari).
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => setIsPdfModalOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* SHIFT EXCHANGE MODAL */}
      <Modal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        title="Permohonan Pertukaran Syif (Shift Swap)"
      >
        <form onSubmit={handleCreateSwap} className="space-y-4 p-2 text-xs">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Pertukaran syif adalah berasaskan persetujuan bersama (Suka Sama Suka) dan tidak boleh melanggar had waktu kerja 43 jam seminggu.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-white text-xs">Kakitangan Pemohon:</h4>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nama PPK</label>
                <select
                  value={swapRequesterId}
                  onChange={(e) => setSwapRequesterId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-semibold"
                >
                  {porters.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Tarikh Syif Pemohon</label>
                <input
                  type="date"
                  value={swapRequesterDate}
                  onChange={(e) => setSwapRequesterDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Jenis Syif Asal</label>
                <select
                  value={swapRequesterShift}
                  onChange={(e) => setSwapRequesterShift(e.target.value as ShiftType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-semibold"
                >
                  <option value="morning">Pagi (07:00 - 15:00)</option>
                  <option value="evening">Petang (14:00 - 22:00)</option>
                  <option value="night">Malam (21:30 - 07:30)</option>
                  <option value="off">Rehat (Off Day)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-white text-xs">Kakitangan Pengganti (Target):</h4>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nama PPK</label>
                <select
                  value={swapTargetId}
                  onChange={(e) => setSwapTargetId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-semibold"
                >
                  {porters.filter(p => p.id !== swapRequesterId).map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Tarikh Syif Pengganti</label>
                <input
                  type="date"
                  value={swapTargetDate}
                  onChange={(e) => setSwapTargetDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Jenis Syif Diambil</label>
                <select
                  value={swapTargetShift}
                  onChange={(e) => setSwapTargetShift(e.target.value as ShiftType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-semibold"
                >
                  <option value="morning">Pagi (07:00 - 15:00)</option>
                  <option value="evening">Petang (14:00 - 22:00)</option>
                  <option value="night">Malam (21:30 - 07:30)</option>
                  <option value="off">Rehat (Off Day)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Alasan Pertukaran</label>
            <textarea
              rows={2}
              value={swapReason}
              onChange={(e) => setSwapReason(e.target.value)}
              placeholder="cth: Menggantikan teman ada temujanji klinik kesihatan..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSwapModalOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6"
            >
              Hantar Permohonan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD / EDIT SHIFT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Penugasan Syif Petugas PPK"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const porter = porters.find(p => p.id === editPorterId)
            if (!porter) return
            await saveRosterShift({
              porter_id: editPorterId,
              porter_name: porter.full_name,
              date: editDate,
              shift: editShift,
              zone: editZone
            })
            toast.success('Syif Disimpan', `Syif untuk ${porter.full_name} pada ${editDate} telah dikemaskini.`)
            setIsEditModalOpen(false)
            fetchData()
          }}
          className="space-y-4 p-2 text-xs"
        >
          <div>
            <label className="block text-slate-400 font-bold mb-1">Petugas PPK</label>
            <select
              value={editPorterId}
              onChange={(e) => setEditPorterId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold"
            >
              {porters.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.staff_no})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Tarikh</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Syif</label>
              <select
                value={editShift}
                onChange={(e) => setEditShift(e.target.value as ShiftType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold"
              >
                <option value="morning">Pagi (07:00 - 15:00, 8j)</option>
                <option value="evening">Petang (14:00 - 22:00, 8j)</option>
                <option value="night">Malam (21:30 - 07:30, 10j)</option>
                <option value="off">Rehat (Off Day, 0j)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Zon Penugasan Utama</label>
            <input
              type="text"
              value={editZone}
              onChange={(e) => setEditZone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6"
            >
              Simpan Penugasan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default PorterRosterPage
