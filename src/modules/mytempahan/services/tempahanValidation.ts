// src/modules/mytempahan/services/tempahanValidation.ts
// Precision Collision Engine, Time Validation & Status Automations for MyTempahan

import { Room, Booking, OperatingHours } from '@/shared/types/mytempahan'

/**
 * Converts "HH:mm" time string to total minutes from midnight (00:00 -> 0, 14:30 -> 870)
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes)
}

/**
 * Converts total minutes from midnight back to 24-hour "HH:mm" string
 */
export function minutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.min(1439, minutes))
  const hrs = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Overlap check between two intervals [startA, endA] and [startB, endB]
 * Overlap occurs if and only if: max(startA, startB) < min(endA, endB)
 * Touching edges (e.g. 09:00-10:00 and 10:00-11:00) DO NOT overlap.
 */
export function isTimeIntervalOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const startAMin = timeToMinutes(startA)
  const endAMin = timeToMinutes(endA)
  const startBMin = timeToMinutes(startB)
  const endBMin = timeToMinutes(endB)

  return Math.max(startAMin, startBMin) < Math.min(endAMin, endBMin)
}

/**
 * Validates if the booking slot strictly conforms to room operating hours
 */
export function isWithinOperatingHours(
  dateStr: string,
  startTime: string,
  endTime: string,
  operatingHours: OperatingHours
): { isValid: boolean; message?: string } {
  if (operatingHours.is24Hours) {
    return { isValid: true }
  }

  // Check Day of Week
  const targetDate = new Date(`${dateStr}T00:00:00`)
  const dayOfWeek = targetDate.getDay() // 0 = Sunday, 1 = Monday, etc.

  if (operatingHours.operatingDays && !operatingHours.operatingDays.includes(dayOfWeek)) {
    return {
      isValid: false,
      message: 'Fasiliti ini tidak beroperasi pada hari yang dipilih.'
    }
  }

  const bookingStartMin = timeToMinutes(startTime)
  const bookingEndMin = timeToMinutes(endTime)
  const opStartMin = timeToMinutes(operatingHours.start)
  const opEndMin = timeToMinutes(operatingHours.end)

  if (bookingStartMin < opStartMin || bookingEndMin > opEndMin) {
    return {
      isValid: false,
      message: `Waktu tempahan mesti berada dalam waktu operasi fasiliti (${operatingHours.start} - ${operatingHours.end}).`
    }
  }

  return { isValid: true }
}

/**
 * Validates advance notice rules (minimum notice & maximum advance booking window)
 */
export function validateBookingLeadTime(
  dateStr: string,
  startTime: string,
  minNoticeHours: number,
  maxAdvanceDays: number,
  isUrgentOverride: boolean = false
): { isValid: boolean; message?: string } {
  const now = new Date()
  const bookingStartDateTime = new Date(`${dateStr}T${startTime}:00`)

  // 1. Cannot book in the past
  if (bookingStartDateTime.getTime() <= now.getTime() - 5 * 60 * 1000) { // allow 5 min grace
    return {
      isValid: false,
      message: 'Tarikh dan masa tempahan mestilah pada waktu masa hadapan.'
    }
  }

  // 2. Minimum advance notice check (unless urgent emergency override)
  if (!isUrgentOverride && minNoticeHours > 0) {
    const diffHours = (bookingStartDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (diffHours < minNoticeHours && diffHours >= 0) {
      return {
        isValid: false,
        message: `Tempahan bilik ini memerlukan notis awal sekurang-kurangnya ${minNoticeHours} jam sebelum acara bermula.`
      }
    }
  }

  // 3. Maximum advance days check
  if (maxAdvanceDays > 0) {
    const diffDays = (bookingStartDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays > maxAdvanceDays) {
      return {
        isValid: false,
        message: `Tempahan tidak boleh dibuat melebihi ${maxAdvanceDays} hari (kira-kira ${Math.round(maxAdvanceDays / 30)} bulan) dari sekarang.`
      }
    }
  }

  return { isValid: true }
}

/**
 * Evaluates and auto-transitions booking status based on live clock
 */
export function evaluateAutoStatusTransition(booking: Booking, currentDateTime: Date = new Date()): Booking {
  // Do not modify terminal / user-cancelled / rejected statuses
  if (['cancelled', 'rejected', 'completed'].includes(booking.status)) {
    return booking
  }

  const startDateTime = new Date(`${booking.date}T${booking.start_time}:00`)
  const endDateTime = new Date(`${booking.date}T${booking.end_time}:00`)
  const nowMs = currentDateTime.getTime()

  // 1. If currently APPROVED and end_time has passed -> Auto transition to 'completed'
  if (booking.status === 'approved' && nowMs >= endDateTime.getTime()) {
    return {
      ...booking,
      status: 'completed',
      check_out_at: booking.check_out_at || endDateTime.toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // 2. If currently APPROVED and live time is within [start_time, end_time] -> Auto 'in_use'
  if (booking.status === 'approved' && nowMs >= startDateTime.getTime() && nowMs < endDateTime.getTime()) {
    return {
      ...booking,
      status: 'in_use',
      check_in_at: booking.check_in_at || startDateTime.toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // 3. If currently IN_USE and live time >= end_time -> Auto 'completed'
  if (booking.status === 'in_use' && nowMs >= endDateTime.getTime()) {
    return {
      ...booking,
      status: 'completed',
      check_out_at: booking.check_out_at || endDateTime.toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // 4. If PENDING and event start time has already passed -> Mark as expired
  if (booking.status === 'pending' && nowMs >= startDateTime.getTime()) {
    return {
      ...booking,
      status: 'expired',
      rejection_reason: 'Permohonan luput secara automatik kerana tidak diluluskan sebelum masa mula acara.',
      updated_at: new Date().toISOString()
    }
  }

  return booking
}
