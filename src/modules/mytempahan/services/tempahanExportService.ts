// src/modules/mytempahan/services/tempahanExportService.ts
// Excel Workbook Multi-Sheet Export for MyTempahan Bookings, Stats & Room Registry

import * as XLSX from 'xlsx'
import { Booking, BookingStats, Room } from '@/shared/types/mytempahan'

export async function exportBookingsToExcel(
  bookings: Booking[],
  rooms: Room[],
  stats: BookingStats,
  fileName: string = `MyTempahan_Laporan_${new Date().toISOString().slice(0, 10)}.xlsx`
): Promise<void> {
  const wb = XLSX.utils.book_new()

  // -------------------------------------------------------------
  // Sheet 1: Ringkasan & Statistik Eksekutif
  // -------------------------------------------------------------
  const summaryData = [
    ['HOSPITAL DAERAH LAWAS - SISTEM MYTEMPAHAN'],
    ['LAPORAN EKSEKUTIF PENGGUNAAN FASILITI & BILIK MESYUARAT'],
    ['Tarikh Dijana:', new Date().toLocaleString('ms-MY')],
    [''],
    ['METRIK UTAMA', 'NILAI'],
    ['Jumlah Keseluruhan Tempahan', stats.totalBookings],
    ['Tempahan Diluluskan', stats.approvedBookings],
    ['Tempahan Sedang Digunakan Hari Ini', stats.inUseToday],
    ['Menunggu Kelulusan', stats.pendingApprovals],
    ['Tempahan Selesai', stats.completedBookings],
    ['Tempahan Dibatalkan / Ditolak', stats.cancelledBookings],
    ['Kadar Utilisasi Purata (%)', `${stats.averageUtilizationRate}%`],
    ['Bilik Paling Kerap Digunakan', stats.busiestRoomName],
    ['Jumlah Jam Digunakan (Bulan Semasa)', `${stats.totalHoursBooked} Jam`],
    [''],
    ['PECAHAN MENGIKUT JABATAN / UNIT', 'JUMLAH TEMPAHAN', 'JUMLAH JAM']
  ]

  stats.departmentUtilization.forEach(d => {
    summaryData.push([d.departmentName, d.bookingCount as any, d.hoursBooked as any])
  })

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif')

  // -------------------------------------------------------------
  // Sheet 2: Log Senarai Tempahan Lengkap
  // -------------------------------------------------------------
  const bookingRows = bookings.map((b, idx) => ({
    'Bil': idx + 1,
    'No. Rujukan': b.booking_number,
    'Nama Bilik': b.room?.name || b.room_id,
    'Kod Bilik': b.room?.room_code || '-',
    'Lokasi': b.room?.location || '-',
    'Pemohon': b.pemohon_name || b.user?.full_name || b.user_id,
    'Jawatan': b.pemohon_jawatan || '-',
    'Jabatan': b.pemohon_department || b.department?.department_name || '-',
    'No. Telefon': b.pemohon_phone || '-',
    'Tujuan Mesyuarat': b.purpose,
    'Jenis Acara': b.event_type,
    'Tarikh': b.date,
    'Masa Mula': b.start_time,
    'Masa Tamat': b.end_time,
    'Durasi (Jam)': b.duration_hours,
    'Bil. Kehadiran': b.attendees_count,
    'Susunan': b.layout_type,
    'Jamuan': b.tempahan_makanan?.diperlukan ? `Ya (${b.tempahan_makanan.jenis_hidangan})` : 'Tidak',
    'VIP': b.tetamu_vip?.ada_vip ? 'Ya' : 'Tidak',
    'Keutamaan': b.priority,
    'Status': b.status,
    'Tarikh Dibuat': b.created_at.slice(0, 10)
  }))

  const wsBookings = XLSX.utils.json_to_sheet(bookingRows)
  XLSX.utils.book_append_sheet(wb, wsBookings, 'Log Tempahan')

  // -------------------------------------------------------------
  // Sheet 3: Daftar Bilik & Fasiliti
  // -------------------------------------------------------------
  const roomRows = rooms.map((r, idx) => ({
    'Bil': idx + 1,
    'Kod Bilik': r.room_code,
    'Nama Bilik': r.name,
    'Kategori': r.category,
    'Kapasiti (Pax)': r.capacity,
    'Aras': r.floor_level,
    'Blok': r.building_block,
    'Status': r.status,
    'Waktu Operasi': r.operating_hours.is24Hours ? '24 Jam' : `${r.operating_hours.start} - ${r.operating_hours.end}`,
    'Perlu Kelulusan': r.requires_approval ? 'Ya' : 'Tidak',
    'Fasiliti Sedia Ada': r.amenities.join(', ')
  }))

  const wsRooms = XLSX.utils.json_to_sheet(roomRows)
  XLSX.utils.book_append_sheet(wb, wsRooms, 'Daftar Bilik')

  // Write and trigger browser download
  XLSX.writeFile(wb, fileName)
}
