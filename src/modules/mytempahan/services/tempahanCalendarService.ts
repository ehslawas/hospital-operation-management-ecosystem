// src/modules/mytempahan/services/tempahanCalendarService.ts
// RFC 5545 Compliant iCalendar (.ics) Generator for Outlook, Apple Calendar, and Google Calendar

import { Booking } from '@/shared/types/mytempahan'

function formatIcsDateTime(dateStr: string, timeStr: string): string {
  const cleanDate = (dateStr || '').replace(/-/g, '')
  const cleanTime = (timeStr || '').replace(/:/g, '') + '00'
  return `${cleanDate}T${cleanTime}`
}

function escapeIcsText(text: string): string {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function generateBookingICS(booking: Booking): string {
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const dtStart = formatIcsDateTime(booking.date, booking.start_time)
  const dtEnd = formatIcsDateTime(booking.date, booking.end_time)
  const location = `${booking.room?.name || 'Bilik Mesyuarat'}, ${booking.room?.location || 'Hospital Lawas'}`
  const summary = `[MyTempahan] ${booking.purpose}`
  const description = `No. Rujukan: ${booking.booking_number}\\n` +
    `Pemohon: ${booking.pemohon_name || booking.user?.full_name || 'Pegawai KKM'}\\n` +
    `Fasiliti: ${booking.room?.name} (${booking.room?.room_code})\\n` +
    `Susun Atur: ${booking.layout_type}\\n` +
    `Kehadiran: ${booking.attendees_count} Pax\\n` +
    `Peralatan Dimohon: ${(booking.requested_amenities || []).join(', ')}`

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hospital Lawas//HOME MyTempahan//MS',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${booking.booking_number}@homelawas.moh.gov.my`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${escapeIcsText(location)}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Peringatan Mesyuarat / Tempahan Fasiliti Hospital Lawas',
    'TRIGGER:-PT15M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ]

  return icsLines.join('\r\n')
}

export function downloadBookingICS(booking: Booking): void {
  const icsContent = generateBookingICS(booking)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${booking.booking_number}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
