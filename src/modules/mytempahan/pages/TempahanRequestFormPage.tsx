// src/modules/mytempahan/pages/TempahanRequestFormPage.tsx
// 4-Step Guided Facility Booking Wizard with Real-Time Conflict Detector & Dark/Light Support

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Clock,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  Tv,
  Mic,
  Video,
  Projector,
  Layers,
  Utensils,
  Crown,
  FileText,
  Printer,
  Sparkles
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import {
  Room,
  RoomLayoutType,
  RoomAmenity,
  BookingPriority,
  Booking
} from '@/shared/types/mytempahan'
import {
  getRooms,
  createBooking,
  checkRoomAvailability
} from '../services/tempahanService'
import { downloadBookingConfirmationPdf } from '../services/tempahanPdfService'
import { cn } from '@/lib/utils'

export const TempahanRequestFormPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [rooms, setRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(null)

  // Current Wizard Step (1 - 4)
  const [step, setStep] = useState(1)

  // Step 1: Venue & Timing
  const [roomId, setRoomId] = useState<string>(searchParams.get('roomId') || '')
  const [date, setDate] = useState<string>(searchParams.get('date') || new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState<string>('09:00')
  const [endTime, setEndTime] = useState<string>('11:00')
  const [layoutType, setLayoutType] = useState<RoomLayoutType>('boardroom')

  // Conflict Checking State
  const [checkingConflict, setCheckingConflict] = useState(false)
  const [conflictResult, setConflictResult] = useState<{
    checked: boolean
    isAvailable: boolean
    reason?: string
    conflicts: any[]
  }>({ checked: false, isAvailable: true, conflicts: [] })

  // Step 2: Event Details
  const [purpose, setPurpose] = useState('')
  const [eventType, setEventType] = useState('Mesyuarat Rasmi')
  const [priority, setPriority] = useState<BookingPriority>('normal')
  const [attendeesCount, setAttendeesCount] = useState<number>(15)
  const [departmentName, setDepartmentName] = useState(user?.department?.department_name || 'Jabatan Farmasi')
  const [pemohonName, setPemohonName] = useState(user?.full_name || 'Amri Amit')
  const [pemohonJawatan, setPemohonJawatan] = useState(user?.jawatan || 'Penolong Pegawai Farmasi U5')
  const [pemohonPhone, setPemohonPhone] = useState(user?.phone_number || '011-1657713')
  const [pemohonEmail, setPemohonEmail] = useState(user?.email || 'amri.amit@yahoo.com')

  // VIP
  const [hasVip, setHasVip] = useState(false)
  const [vipListStr, setVipListStr] = useState('')

  // Step 3: Logistics & Catering
  const [requestedAmenities, setRequestedAmenities] = useState<RoomAmenity[]>(['smart_tv', 'wifi_kkm', 'aircond'])
  const [hasCatering, setHasCatering] = useState(false)
  const [mealType, setMealType] = useState<'sarapan' | 'makan_tengahari' | 'minum_petang' | 'makan_malam' | 'kudapan'>('makan_tengahari')
  const [cateringLocation, setCateringLocation] = useState('Foyer Luar Bilik')
  const [specialRequirements, setSpecialRequirements] = useState('')

  // Step 4: Terms
  const [agreedTerms, setAgreedTerms] = useState(false)

  // Load Rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await getRooms()
        if (res.data) {
          setRooms(res.data)
          if (!roomId && res.data.length > 0) {
            setRoomId(res.data[0].id)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingRooms(false)
      }
    }
    fetchRooms()
  }, [roomId])

  // Selected Room Object
  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === roomId)
  }, [rooms, roomId])

  // Automatically validate conflict when Room, Date, or Time changes
  useEffect(() => {
    if (!roomId || !date || !startTime || !endTime) return

    let isMounted = true
    const check = async () => {
      setCheckingConflict(true)
      try {
        const res = await checkRoomAvailability(roomId, date, startTime, endTime)
        if (isMounted) {
          setConflictResult({
            checked: true,
            isAvailable: res.isAvailable,
            reason: res.reason,
            conflicts: res.conflictingBookings || []
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (isMounted) setCheckingConflict(false)
      }
    }

    const timer = setTimeout(check, 300)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [roomId, date, startTime, endTime])

  const toggleAmenity = (amenity: RoomAmenity) => {
    setRequestedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
  }

  // Step Navigations
  const handleNext = () => {
    if (step === 1) {
      if (!roomId) {
        addToast({ type: 'warning', title: 'Pilih Fasiliti', message: 'Sila pilih bilik atau dewan yang ingin ditempah.' })
        return
      }
      if (!conflictResult.isAvailable) {
        addToast({ type: 'error', title: 'Pertindihan Slot', message: conflictResult.reason || 'Slot masa bilik tidak tersedia.' })
        return
      }
    }

    if (step === 2) {
      if (!purpose.trim()) {
        addToast({ type: 'warning', title: 'Isi Tajuk Mesyuarat', message: 'Sila nyatakan tujuan atau nama program acara.' })
        return
      }
      if (selectedRoom && attendeesCount > selectedRoom.capacity) {
        addToast({
          type: 'warning',
          title: 'Kapasiti Melebihi Had',
          message: `Kapasiti maksimum bilik ini adalah ${selectedRoom.capacity} pax.`
        })
        return
      }
    }

    setStep(prev => Math.min(4, prev + 1))
  }

  const handlePrev = () => {
    setStep(prev => Math.max(1, prev - 1))
  }

  // Submit Booking
  const handleSubmit = async () => {
    if (!agreedTerms) {
      addToast({
        type: 'warning',
        title: 'Perakuan Diperlukan',
        message: 'Sila tandakan persetujuan terhadap terma penggunaan fasiliti.'
      })
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        room_id: roomId,
        user_id: user?.id || 'user-current',
        pemohon_name: pemohonName,
        pemohon_jawatan: pemohonJawatan,
        pemohon_department: departmentName,
        pemohon_email: pemohonEmail,
        pemohon_phone: pemohonPhone,
        purpose,
        event_type: eventType,
        priority,
        date,
        start_time: startTime,
        end_time: endTime,
        duration_hours: 2,
        attendees_count: attendeesCount,
        layout_type: layoutType,
        requested_amenities: requestedAmenities,
        tempahan_makanan: {
          diperlukan: hasCatering,
          jenis_hidangan: hasCatering ? mealType : undefined,
          anggaran_pax: hasCatering ? attendeesCount : undefined,
          lokasi_hidang: hasCatering ? cateringLocation : undefined
        },
        tetamu_vip: {
          ada_vip: hasVip,
          senarai_vip: hasVip && vipListStr ? vipListStr.split(',').map(s => s.trim()) : []
        },
        special_requirements: specialRequirements,
        hospital_id: 'hosp-lawas'
      }

      const res = await createBooking(payload)

      if (res.data) {
        setSubmittedBooking(res.data)
        addToast({
          type: 'success',
          title: 'Tempahan Berjaya Dihantar',
          message: `No. Rujukan Tempahan: ${res.data.booking_number}`
        })
      } else {
        throw new Error(res.error || 'Gagal menghantar tempahan.')
      }
    } catch (err: any) {
      console.error(err)
      addToast({
        type: 'error',
        title: 'Ralat Penghantaran',
        message: err.message || 'Sila semak semula maklumat tempahan anda.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Success Screen
  if (submittedBooking) {
    return (
      <div className="p-6 max-w-3xl mx-auto py-12 text-center space-y-6 text-slate-900 dark:text-slate-100">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-sm"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
            {submittedBooking.status === 'approved' ? 'Tempahan Diluluskan Secara Automatik' : 'Permohonan Dalam Semakan Pentadbir'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Tempahan Anda Berjaya Didaftarkan!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Slip pengesahan rasmi telah dijana. Anda boleh memuat turun fail PDF atau melihatnya di senarai permohonan.
          </p>
        </div>

        {/* Summary Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-left max-w-lg mx-auto space-y-3 text-xs shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">No. Rujukan:</span>
            <span className="font-mono font-bold text-sm text-teal-700 dark:text-teal-400">{submittedBooking.booking_number}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Fasiliti:</span>
            <span className="font-bold text-slate-900 dark:text-white">{submittedBooking.room?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Tarikh & Masa:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{submittedBooking.date} ({submittedBooking.start_time} - {submittedBooking.end_time})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Tujuan:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{submittedBooking.purpose}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => downloadBookingConfirmationPdf(submittedBooking)}
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Muat Turun Slip PDF
          </button>

          <button
            onClick={() => navigate(ROUTES.TEMPAHAN_MY_BOOKINGS)}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
          >
            Lihat Permohonan Saya
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <button
          onClick={() => navigate(ROUTES.TEMPAHAN)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Papan Pemuka
        </button>

        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
          Langkah {step} daripada 4
        </span>
      </div>

      {/* 4-Step Stepper Progress Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { num: 1, label: 'Fasiliti & Masa' },
            { num: 2, label: 'Butiran Acara' },
            { num: 3, label: 'Logistik & Jamuan' },
            { num: 4, label: 'Pengesahan' }
          ].map(s => {
            const isCompleted = step > s.num
            const isCurrent = step === s.num

            return (
              <div key={s.num} className="space-y-1.5 flex flex-col items-center">
                <div
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all',
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-teal-700 text-white ring-4 ring-teal-100 dark:ring-teal-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-bold tracking-tight',
                    isCurrent ? 'text-teal-700 dark:text-teal-300' : isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
                  )}
                >
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        {/* STEP 1: FASILITI & MASA */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pilih Fasiliti & Slot Masa</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sistem akan menyemak ketersediaan bilik dan sebarang pertindihan secara masa nyata.</p>
            </div>

            {/* Room Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Pilih Bilik / Dewan Hospital
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rooms.map(r => (
                  <div
                    key={r.id}
                    onClick={() => setRoomId(r.id)}
                    className={cn(
                      'p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3',
                      roomId === r.id
                        ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-600 dark:border-teal-500 ring-2 ring-teal-200 dark:ring-teal-900/60'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    <Building2 className={cn('w-5 h-5 mt-0.5 shrink-0', roomId === r.id ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400')} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{r.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.location}</div>
                      <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1">Kapasiti: {r.capacity} Pax Maks</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Tarikh Acara</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Masa Mula</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Masa Tamat</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Real-time Conflict Alert Banner */}
            {conflictResult.checked && (
              <div
                className={cn(
                  'p-4 rounded-xl border text-xs flex items-start gap-3 transition-all',
                  conflictResult.isAvailable
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                )}
              >
                {conflictResult.isAvailable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {conflictResult.isAvailable
                      ? 'Slot Masa Tersedia & Bebas Untuk Ditempah'
                      : 'Amaran Pertindihan Slot Tempahan'}
                  </div>
                  <div className="text-[11px] mt-0.5 opacity-90">
                    {conflictResult.isAvailable
                      ? 'Tiada sebarang acara lain yang dijadualkan pada waktu ini.'
                      : conflictResult.reason}
                  </div>
                </div>
              </div>
            )}

            {/* Layout Preset */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Bentuk Susunan Meja / Kerusi
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'boardroom', label: 'Boardroom (Meja Utama)' },
                  { id: 'classroom', label: 'Bilik Darjah' },
                  { id: 'u_shape', label: 'Bentuk U' },
                  { id: 'theatre', label: 'Teater' }
                ].map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLayoutType(l.id as any)}
                    className={cn(
                      'p-3 rounded-xl border text-left font-semibold transition-all',
                      layoutType === l.id
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 dark:border-teal-500 text-teal-900 dark:text-teal-200'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: BUTIRAN ACARA */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Maklumat Acara & Penganjur</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lengkapkan butiran rasmi mesyuarat atau program hospital.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Tajuk Mesyuarat / Program *</label>
              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="cth. Mesyuarat Kajian Semula Pengurusan Kualiti Bil. 2/2026"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Kategori Acara</label>
                <select
                  value={eventType}
                  onChange={e => setEventType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="Mesyuarat Rasmi">Mesyuarat Rasmi</option>
                  <option value="Kursus / Latihan">Kursus / Latihan</option>
                  <option value="CME / CPD Klinikal">CME / CPD Klinikal</option>
                  <option value="Taklimat / Briefing">Taklimat / Briefing</option>
                  <option value="Lawatan VIP">Lawatan VIP</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Keutamaan Tempahan</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="normal">Biasa (Normal)</option>
                  <option value="urgent">Segera (Urgent)</option>
                  <option value="vvip_event">Acara Khas VVIP</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Bilangan Peserta (Pax)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedRoom?.capacity || 200}
                  value={attendeesCount}
                  onChange={e => setAttendeesCount(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Organizer Info */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Pegawai Bertanggungjawab (PIC)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Nama Pegawai</label>
                  <input
                    type="text"
                    value={pemohonName}
                    onChange={e => setPemohonName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Jawatan & Jabatan</label>
                  <input
                    type="text"
                    value={`${pemohonJawatan} (${departmentName})`}
                    disabled
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">No. Telefon Bimbit / Sambungan</label>
                  <input
                    type="text"
                    value={pemohonPhone}
                    onChange={e => setPemohonPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Alamat Emel</label>
                  <input
                    type="email"
                    value={pemohonEmail}
                    onChange={e => setPemohonEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* VIP Checkbox */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVip}
                  onChange={e => setHasVip(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-600" />
                  Melibatkan Tetamu Kehormat / VVIP (Pengarah KKM / JKN / VIP Luar)
                </span>
              </label>

              {hasVip && (
                <input
                  type="text"
                  value={vipListStr}
                  onChange={e => setVipListStr(e.target.value)}
                  placeholder="Senaraikan nama tetamu VIP (asingkan dengan koma)"
                  className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs text-amber-950 dark:text-amber-200 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 3: LOGISTIK & JAMUAN */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Peralatan AV & Penyediaan Jamuan</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilih peralatan teknikal dan kemudahan sokongan yang diperlukan.</p>
            </div>

            {/* Amenities Toggle Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Peralatan Audio Visual & Kemudahan
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'projector', label: 'Projektor HD & Layar' },
                  { id: 'smart_tv', label: 'Smart TV Interaktif' },
                  { id: 'video_conferencing', label: 'Video Conferencing (Zoom/Teams)' },
                  { id: 'pa_sound_system', label: 'Sistem PA & Pembesar Suara' },
                  { id: 'wireless_mic', label: 'Mikrofon Tanpa Wayar' },
                  { id: 'whiteboard', label: 'Papan Putih & Pen Penanda' },
                  { id: 'podium', label: 'Podium / Rostrum Rasmi' },
                  { id: 'recording_facility', label: 'Rakaman Video Acara' },
                  { id: 'flipchart', label: 'Papan Carta Selak (Flipchart)' }
                ].map(item => {
                  const isSelected = requestedAmenities.includes(item.id as any)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleAmenity(item.id as any)}
                      className={cn(
                        'p-3 rounded-xl border text-left font-semibold transition-all flex items-center justify-between',
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 dark:border-teal-500 text-teal-900 dark:text-teal-200'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Catering Settings */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCatering}
                  onChange={e => setHasCatering(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-amber-500" />
                  Perkhidmatan Jamuan / Makanan Disediakan
                </span>
              </label>

              {hasCatering && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-semibold block">Jenis Hidangan</label>
                    <select
                      value={mealType}
                      onChange={e => setMealType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                    >
                      <option value="sarapan">Sarapan Pagi</option>
                      <option value="makan_tengahari">Makan Tengahari</option>
                      <option value="minum_petang">Minum Petang</option>
                      <option value="makan_malam">Makan Malam</option>
                      <option value="kudapan">Kudapan Ringan</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-semibold block">Lokasi Hidangan</label>
                    <input
                      type="text"
                      value={cateringLocation}
                      onChange={e => setCateringLocation(e.target.value)}
                      placeholder="cth. Foyer Luar Bilik Mesyuarat"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Special Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Catatan Khas / Keperluan Tambahan</label>
              <textarea
                rows={3}
                value={specialRequirements}
                onChange={e => setSpecialRequirements(e.target.value)}
                placeholder="Sebarang perincian tambahan untuk perhatian Pegawai Fasiliti..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </motion.div>
        )}

        {/* STEP 4: SEMAKAN & PENGESAHAN */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Semakan Ringkasan Permohonan</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sila semak semula semua perincian sebelum menghantar permohonan rasmi.</p>
            </div>

            {/* Official Summary Card */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 text-xs">
              <div className="pb-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase">Fasiliti Dipilih</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedRoom?.name}</h3>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">{selectedRoom?.location}</div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {attendeesCount} Pax
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Tajuk Acara:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{purpose}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Tarikh & Masa:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{date} ({startTime} - {endTime})</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Susunan Meja:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{layoutType}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Pemohon:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{pemohonName} ({departmentName})</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 block mb-1">Peralatan Dimohon:</span>
                <div className="flex flex-wrap gap-1">
                  {requestedAmenities.map(a => (
                    <span key={a} className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                      {a.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Terms Agreement Checkbox */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={e => setAgreedTerms(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 mt-0.5"
                />
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Saya dengan ini mengesahkan bahawa maklumat yang diberikan adalah tepat dan berjanji akan mematuhi terma kebersihan, keselamatan peralatan AV, serta memastikan suis elektrik dan penghawa dingin dimatikan selepas selesai digunakan.
                </span>
              </label>
            </div>
          </motion.div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1 || submitting}
            className={cn(
              'px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5',
              step === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Sebelumnya
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              Seterusnya
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 active:scale-95"
            >
              {submitting ? 'Menghantar Permohonan...' : 'Hantar Permohonan Tempahan'}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TempahanRequestFormPage
