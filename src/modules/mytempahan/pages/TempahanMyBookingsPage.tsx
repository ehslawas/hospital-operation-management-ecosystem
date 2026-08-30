// src/modules/mytempahan/pages/TempahanMyBookingsPage.tsx
// User Self-Service Portal for Facility Bookings with Dark/Light Support & QR Handshake

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Printer,
  Calendar,
  Download,
  MapPin,
  Users,
  QrCode,
  Layers,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  FileSpreadsheet,
  X
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import { Booking } from '@/shared/types/mytempahan'
import {
  getBookings,
  updateBookingStatus
} from '../services/tempahanService'
import { downloadBookingConfirmationPdf } from '../services/tempahanPdfService'
import { downloadBookingICS } from '../services/tempahanCalendarService'
import { BookingDetailDrawer } from '../components/BookingDetailDrawer'
import { cn } from '@/lib/utils'

export const TempahanMyBookingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Detail Drawer State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // QR Modal State
  const [qrModalBooking, setQrModalBooking] = useState<Booking | null>(null)

  // Cancellation Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getBookings()
      if (res.data) {
        setBookings(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Tab filter
      if (statusTab === 'upcoming') {
        const today = new Date().toISOString().slice(0, 10)
        if (b.date < today || ['cancelled', 'rejected', 'completed'].includes(b.status)) return false
      } else if (statusTab === 'pending') {
        if (b.status !== 'pending') return false
      } else if (statusTab === 'approved') {
        if (b.status !== 'approved') return false
      } else if (statusTab === 'history') {
        if (!['completed', 'cancelled', 'rejected'].includes(b.status)) return false
      }

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          b.booking_number.toLowerCase().includes(q) ||
          b.purpose.toLowerCase().includes(q) ||
          (b.room?.name || '').toLowerCase().includes(q)
        )
      }

      return true
    })
  }, [bookings, statusTab, searchQuery])

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return

    try {
      setCancelling(true)
      const res = await updateBookingStatus(cancelModalBooking.id, 'cancelled', {
        reason: cancelReason || 'Dibatalkan oleh pemohon.'
      })

      if (res.data) {
        addToast({
          type: 'info',
          title: 'Permohonan Dibatalkan',
          message: `Tempahan ${cancelModalBooking.booking_number} telah berjaya dibatalkan.`
        })
        setCancelModalBooking(null)
        setCancelReason('')
        loadData()
      }
    } catch (err) {
      console.error(err)
      addToast({
        type: 'error',
        title: 'Ralat',
        message: 'Gagal membatalkan permohonan.'
      })
    } finally {
      setCancelling(false)
    }
  }

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
            <CalendarDays className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Permohonan Tempahan Saya
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {filteredBookings.length} Rekod
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Semak status kelulusan, cetak slip pengesahan rasmi dan paparkan kod QR daftar masuk fasiliti.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(ROUTES.TEMPAHAN_REQUEST_NEW)}
          className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tempahan Baharu</span>
        </button>
      </div>

      {/* 2. Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'all', label: 'Semua Tempahan' },
            { id: 'upcoming', label: 'Akan Datang' },
            { id: 'pending', label: 'Dalam Semakan' },
            { id: 'approved', label: 'Diluluskan' },
            { id: 'history', label: 'Sejarah & Selesai' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                statusTab === tab.id
                  ? 'bg-slate-900 dark:bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari no. rujukan, tujuan..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* 3. Booking List Cards */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto stroke-1" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Tiada Rekod Tempahan Dijumpai</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
            Anda belum mempunyai permohonan tempahan di bawah kategori ini.
          </p>
          <button
            onClick={() => navigate(ROUTES.TEMPAHAN_REQUEST_NEW)}
            className="mt-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
          >
            Buat Tempahan Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filteredBookings.map(b => {
            const isApproved = b.status === 'approved'
            const isPending = b.status === 'pending'
            const isRejected = b.status === 'rejected'
            const isCancelled = b.status === 'cancelled'
            const isCompleted = b.status === 'completed'

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {b.booking_number}
                    </span>

                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                        isApproved && 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                        isPending && 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                        isRejected && 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                        isCancelled && 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
                        isCompleted && 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      )}
                    >
                      {isApproved ? 'DILULUSKAN' : isPending ? 'DALAM SEMAKAN' : isRejected ? 'DITOLAK' : isCancelled ? 'DIBATALKAN' : 'SELESAI'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug">
                    {b.purpose}
                  </h3>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{b.room?.name || 'Fasiliti'} ({b.room?.location})</span>
                    </div>

                    <div className="flex items-center gap-3 pt-1 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        {b.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        {b.start_time} - {b.end_time}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isApproved && (
                      <button
                        onClick={() => downloadBookingConfirmationPdf(b)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-600 dark:text-slate-300 hover:text-teal-700 transition-colors"
                        title="Cetak Slip Pengesahan PDF"
                      >
                        <Printer className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      </button>
                    )}

                    {isApproved && (
                      <button
                        onClick={() => setQrModalBooking(b)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Paparkan Kod QR Daftar Masuk"
                      >
                        <QrCode className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                      </button>
                    )}

                    {(isPending || isApproved) && (
                      <button
                        onClick={() => setCancelModalBooking(b)}
                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-semibold transition-colors"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedBooking(b)
                      setDrawerOpen(true)
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    Perincian <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* QR Check-in Modal */}
      <AnimatePresence>
        {qrModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrModalBooking(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 z-10"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase">Pas Masuk Fasiliti</span>
                <button onClick={() => setQrModalBooking(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{qrModalBooking.room?.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{qrModalBooking.date} • {qrModalBooking.start_time} - {qrModalBooking.end_time}</p>
              </div>

              {/* QR Mock View */}
              <div className="w-48 h-48 mx-auto bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-4">
                <QrCode className="w-32 h-32 text-slate-800 dark:text-slate-100" />
                <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 mt-1">
                  {qrModalBooking.booking_number}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>PIN Kunci Pintu:</span>
                <span className="font-mono text-sm tracking-widest text-teal-700 dark:text-teal-400">
                  {qrModalBooking.checkin_pin || '8842'}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Confirmation Dialog */}
      <AnimatePresence>
        {cancelModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancelModalBooking(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 z-10 text-left"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Sahkan Pembatalan Tempahan</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">No. Rujukan: {cancelModalBooking.booking_number}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Sebab Pembatalan</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="cth. Mesyuarat ditangguhkan ke tarikh baharu..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  {cancelling ? 'Membatalkan...' : 'Sahkan Batal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCancelBooking={(id) => {
          setDrawerOpen(false)
          const b = bookings.find(item => item.id === id)
          if (b) setCancelModalBooking(b)
        }}
      />
    </div>
  )
}

export default TempahanMyBookingsPage
