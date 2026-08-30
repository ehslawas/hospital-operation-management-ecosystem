// src/modules/mytempahan/components/BookingDetailDrawer.tsx
// Professional Slide-Over Detail Drawer with Dark/Light Support, PDF Slip & iCal Export

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  Mail,
  Utensils,
  Crown,
  Layers,
  Wrench,
  ShieldCheck,
  QrCode
} from 'lucide-react'
import { Booking } from '@/shared/types/mytempahan'
import { downloadBookingConfirmationPdf } from '../services/tempahanPdfService'
import { downloadBookingICS } from '../services/tempahanCalendarService'
import { cn } from '@/lib/utils'

export interface BookingDetailDrawerProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  onCancelBooking?: (bookingId: string) => void
  onApproveBooking?: (booking: Booking) => void
  onRejectBooking?: (booking: Booking) => void
  canApprove?: boolean
}

export const BookingDetailDrawer: React.FC<BookingDetailDrawerProps> = ({
  booking,
  isOpen,
  onClose,
  onCancelBooking,
  onApproveBooking,
  onRejectBooking,
  canApprove = false
}) => {
  if (!booking) return null

  // Status visual mapping
  const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    pending: { label: 'Menunggu Kelulusan', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', icon: AlertCircle },
    approved: { label: 'Diluluskan', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle2 },
    rejected: { label: 'Ditolak', bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', icon: XCircle },
    in_use: { label: 'Sedang Digunakan', bg: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-300', icon: Clock },
    completed: { label: 'Selesai', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', icon: CheckCircle2 },
    cancelled: { label: 'Dibatalkan', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: XCircle },
    expired: { label: 'Luput', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: AlertCircle }
  }

  const currentStatus = statusConfig[booking.status] || statusConfig.pending
  const StatusIcon = currentStatus.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end text-slate-900 dark:text-slate-100">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          {/* Slide Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl z-10 flex flex-col justify-between overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {booking.booking_number}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                      currentStatus.bg,
                      currentStatus.text
                    )}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {currentStatus.label}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {booking.purpose}
                </h2>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Event Time & Venue Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      Fasiliti / Bilik
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {booking.room?.name || 'Bilik Mesyuarat'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {booking.room?.location}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                    {booking.event_type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Tarikh Acara</div>
                      <div className="font-semibold">{booking.date}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Masa (Durasi)</div>
                      <div className="font-semibold">
                        {booking.start_time} - {booking.end_time} ({booking.duration_hours}j)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pemohon Contact Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Maklumat Pemohon & Jabatan
                </h4>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{booking.pemohon_name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{booking.pemohon_jawatan} • {booking.pemohon_department}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                      {booking.attendees_count} Pax
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{booking.pemohon_phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{booking.pemohon_email || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logistics & Equipment */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Susun Atur & Keperluan Logistik
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mb-1">SUSUNAN MEJA</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      {booking.layout_type}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mb-1">STATUS JAMUAN</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      {booking.tempahan_makanan?.diperlukan ? 'Katering Disediakan' : 'Tiada Jamuan'}
                    </span>
                  </div>
                </div>

                {/* VIP Indicator */}
                {booking.tetamu_vip?.ada_vip && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                    <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Kehadiran Tetamu Kenamaan (VIP)</div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                        {(booking.tetamu_vip.senarai_vip || []).join(', ') || 'Tetamu Rasmi KKM'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Amenities Requested */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block tracking-wider">
                    Peralatan Dimohon
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(booking.requested_amenities || []).map(amenity => (
                      <span
                        key={amenity}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium shadow-2xs"
                      >
                        {amenity.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Special Requirements */}
                {booking.special_requirements && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-1">
                      Catatan Khas
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 italic">{booking.special_requirements}</p>
                  </div>
                )}
              </div>

              {/* Rejection / Approval Notes */}
              {booking.rejection_reason && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300">
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" /> Sebab Penolakan:
                  </div>
                  <div>{booking.rejection_reason}</div>
                </div>
              )}

              {booking.catatan_pelulus && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Catatan Kelulusan ({booking.approved_by_name || 'Pentadbir'}):
                  </div>
                  <div>{booking.catatan_pelulus}</div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col gap-2.5">
              {/* Document Triggers */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => downloadBookingConfirmationPdf(booking)}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Cetak Slip PDF
                </button>

                <button
                  onClick={() => downloadBookingICS(booking)}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Eksport ke iCal (.ics)
                </button>
              </div>

              {/* Admin Approval Quick Action or User Cancel */}
              {canApprove && booking.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onRejectBooking && onRejectBooking(booking)}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors"
                  >
                    Tolak Permohonan
                  </button>
                  <button
                    onClick={() => onApproveBooking && onApproveBooking(booking)}
                    className="py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Luluskan Tempahan
                  </button>
                </div>
              )}

              {!canApprove && ['pending', 'approved'].includes(booking.status) && onCancelBooking && (
                <button
                  onClick={() => onCancelBooking(booking.id)}
                  className="w-full py-2 px-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs font-semibold transition-colors"
                >
                  Batal Permohonan Tempahan Ini
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
