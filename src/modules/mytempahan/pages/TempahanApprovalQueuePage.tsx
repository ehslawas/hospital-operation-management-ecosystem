// src/modules/mytempahan/pages/TempahanApprovalQueuePage.tsx
// Facility Administrator Review Queue for Approvals, Conflict Resolution & Endorsements with Dark/Light Support

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Layers,
  Crown,
  FileText,
  Utensils,
  ChevronRight,
  ArrowLeft,
  CalendarDays,
  Sparkles
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import { Booking } from '@/shared/types/mytempahan'
import {
  getBookings,
  updateBookingStatus
} from '../services/tempahanService'
import { BookingDetailDrawer } from '../components/BookingDetailDrawer'
import { cn } from '@/lib/utils'

export const TempahanApprovalQueuePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('pending')

  // Selected Booking Drawer
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Action Modals
  const [actionModalBooking, setActionModalBooking] = useState<Booking | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [approvalNotes, setApprovalNotes] = useState('Permohonan diluluskan. Sila pastikan SOP kebersihan dipatuhi.')
  const [rejectionReason, setRejectionReason] = useState('')
  const [checklistKeys, setChecklistKeys] = useState(true)
  const [checklistAv, setChecklistAv] = useState(true)
  const [processing, setProcessing] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getBookings()
      if (res.data) setBookings(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('tempahan_bookings_updated', handleUpdate)
    return () => window.removeEventListener('tempahan_bookings_updated', handleUpdate)
  }, [])

  // Filter queue
  const queueBookings = useMemo(() => {
    return bookings.filter(b => {
      if (filterType === 'pending' && b.status !== 'pending') return false
      if (filterType === 'approved' && b.status !== 'approved') return false
      if (filterType === 'rejected' && b.status !== 'rejected') return false

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          b.booking_number.toLowerCase().includes(q) ||
          b.purpose.toLowerCase().includes(q) ||
          b.pemohon_name.toLowerCase().includes(q) ||
          b.pemohon_department.toLowerCase().includes(q) ||
          (b.room?.name || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [bookings, filterType, searchQuery])

  const pendingCount = useMemo(() => {
    return bookings.filter(b => b.status === 'pending').length
  }, [bookings])

  const handleOpenActionModal = (booking: Booking, type: 'approve' | 'reject', e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setActionModalBooking(booking)
    setActionType(type)
    if (type === 'approve') {
      setApprovalNotes('Permohonan diluluskan. Sila pastikan SOP kebersihan bilik dipatuhi.')
    } else {
      setRejectionReason('')
    }
  }

  const handleExecuteAction = async () => {
    if (!actionModalBooking) return

    try {
      setProcessing(true)

      if (actionType === 'approve') {
        const res = await updateBookingStatus(actionModalBooking.id, 'approved', {
          userId: user?.id || 'admin-user',
          userName: user?.full_name || 'Pentadbir Fasiliti Hospital',
          notes: approvalNotes
        })

        if (res.data) {
          addToast({
            type: 'success',
            title: 'Permohonan Diluluskan',
            message: `Tempahan ${actionModalBooking.booking_number} telah disahkan dan diluluskan.`
          })
          setActionModalBooking(null)
        }
      } else {
        if (!rejectionReason.trim()) {
          addToast({
            type: 'warning',
            title: 'Sebab Diperlukan',
            message: 'Sila nyatakan sebab penolakan permohonan tempahan ini.'
          })
          setProcessing(false)
          return
        }

        const res = await updateBookingStatus(actionModalBooking.id, 'rejected', {
          userId: user?.id || 'admin-user',
          userName: user?.full_name || 'Pentadbir Fasiliti Hospital',
          reason: rejectionReason
        })

        if (res.data) {
          addToast({
            type: 'info',
            title: 'Permohonan Ditolak',
            message: `Tempahan ${actionModalBooking.booking_number} telah ditolak.`
          })
          setActionModalBooking(null)
        }
      }
    } catch (err) {
      console.error(err)
      addToast({
        type: 'error',
        title: 'Ralat',
        message: 'Gagal mengemaskini status permohonan.'
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 text-slate-900 dark:text-slate-100">
      {/* 1. Official Header */}
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
            <ShieldCheck className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Semakan & Kelulusan Tempahan Fasiliti
              </h1>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                  {pendingCount} Menunggu Tindakan
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Panel kawalan Pegawai Pentadbir & Penjaga Bilik untuk mengesahkan permohonan ruang hospital.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'pending', label: `Menunggu (${pendingCount})` },
            { id: 'approved', label: 'Telah Diluluskan' },
            { id: 'rejected', label: 'Ditolak' },
            { id: 'all', label: 'Semua Rekod' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={cn(
                'px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                filterType === tab.id
                  ? 'bg-slate-900 dark:bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari pemohon, jabatan, no rujukan..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* 3. Queue List */}
      {queueBookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto stroke-1" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Tiada Permohonan Tertangguh</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
            Semua permohonan tempahan fasiliti telah disemak dan diambil tindakan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {queueBookings.map(b => {
            const isPending = b.status === 'pending'
            const isApproved = b.status === 'approved'

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  setSelectedBooking(b)
                  setDrawerOpen(true)
                }}
                className={cn(
                  'p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all hover:shadow-md cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group',
                  isPending
                    ? 'border-amber-200/90 dark:border-amber-800/80 bg-amber-50/10 dark:bg-amber-950/10'
                    : 'border-slate-200/90 dark:border-slate-800'
                )}
              >
                {/* Left Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      {b.booking_number}
                    </span>

                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                        isPending && 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                        isApproved && 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                        b.status === 'rejected' && 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      )}
                    >
                      {isPending ? 'MENUNGGU KELULUSAN' : isApproved ? 'DILULUSKAN' : b.status.toUpperCase()}
                    </span>

                    {b.tetamu_vip?.ada_vip && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-600" /> VIP
                      </span>
                    )}

                    {b.priority === 'urgent' && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold">
                        SEGERA
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                    {b.purpose}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {b.room?.name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {b.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {b.start_time} - {b.end_time}
                    </span>
                    <span>•</span>
                    <span>{b.attendees_count} Pax</span>
                  </div>
                </div>

                {/* Center: Organizer Info */}
                <div className="lg:border-l lg:border-r border-slate-100 dark:border-slate-800 lg:px-6 py-1 text-xs text-slate-600 dark:text-slate-400 space-y-1 shrink-0">
                  <div className="font-bold text-slate-900 dark:text-white">{b.pemohon_name}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">{b.pemohon_jawatan}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">{b.pemohon_department}</div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPending ? (
                    <>
                      <button
                        onClick={e => handleOpenActionModal(b, 'reject', e)}
                        className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={e => handleOpenActionModal(b, 'approve', e)}
                        className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Luluskan
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedBooking(b)
                        setDrawerOpen(true)
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Lihat Butiran
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Approval / Rejection Action Modal */}
      <AnimatePresence>
        {actionModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-left"
            >
              <div className="space-y-1">
                <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                  {actionModalBooking.booking_number}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {actionType === 'approve' ? 'Luluskan Permohonan Tempahan' : 'Tolak Permohonan Tempahan'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {actionModalBooking.purpose} • {actionModalBooking.room?.name}
                </p>
              </div>

              {actionType === 'approve' ? (
                <div className="space-y-4 text-xs">
                  {/* Readiness Checklist */}
                  <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2.5">
                    <span className="font-bold text-teal-950 dark:text-teal-200 block">Senarai Semak Ketersediaan Fasiliti:</span>
                    <label className="flex items-center gap-2 cursor-pointer text-teal-900 dark:text-teal-300">
                      <input
                        type="checkbox"
                        checked={checklistKeys}
                        onChange={e => setChecklistKeys(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Kunci bilik dan akses fizikal disahkan tersedia</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-teal-900 dark:text-teal-300">
                      <input
                        type="checkbox"
                        checked={checklistAv}
                        onChange={e => setChecklistAv(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Peralatan AV & projektor yang dimohon telah disahkan berfungsi</span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Catatan Kelulusan (Kepada Pemohon)</label>
                    <textarea
                      rows={3}
                      value={approvalNotes}
                      onChange={e => setApprovalNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-300">
                    <p className="font-semibold">
                      Sila nyatakan sebab penolakan yang jelas untuk makluman pemohon bagi membolehkan mereka membuat penjadualan semula atau memilih fasiliti alternatif.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Sebab Penolakan *</label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="cth. Fasiliti ini digunakan untuk Taklimat Pengarah KKM yang tidak dapat dipinda..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModalBooking(null)}
                  disabled={processing}
                  className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={processing}
                  className={cn(
                    'py-2.5 rounded-xl text-white text-xs font-bold shadow-xs transition-all',
                    actionType === 'approve'
                      ? 'bg-teal-700 hover:bg-teal-800'
                      : 'bg-rose-600 hover:bg-rose-700'
                  )}
                >
                  {processing ? 'Memproses...' : actionType === 'approve' ? 'Sahkan Kelulusan' : 'Sahkan Tolak'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-over Detail Drawer */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        canApprove={true}
        onApproveBooking={b => {
          setDrawerOpen(false)
          handleOpenActionModal(b, 'approve')
        }}
        onRejectBooking={b => {
          setDrawerOpen(false)
          handleOpenActionModal(b, 'reject')
        }}
      />
    </div>
  )
}

export default TempahanApprovalQueuePage
