// src/modules/mytempahan/services/tempahanPdfService.ts
// Official KKM / Hospital Lawas Facility Booking Confirmation Slip PDF Generator

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import { Booking } from '@/shared/types/mytempahan'
import { drawHospitalHeader } from '@/lib/pdfHeader'
import { timeToMinutes } from './tempahanValidation'

export async function generateBookingConfirmationPdf(booking: Booking): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2

  // 1. Draw Page Border
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.4)
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2)

  // 2. Draw Official Hospital Letterhead
  let currentY = await drawHospitalHeader(doc, {
    margin: margin + 3,
    startY: margin + 2
  })

  // 3. Document Title Block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42) // Slate 900
  doc.text('SLIP PENGESAHAN TEMPAHAN FASILITI & BILIK MESYUARAT', pageWidth / 2, currentY, { align: 'center' })

  currentY += 4.5
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139) // Slate 500
  doc.text('Hospital Lawas Facility Booking Confirmation Slip (Format Rasmi KKM)', pageWidth / 2, currentY, { align: 'center' })

  // 4. Generate QR Code
  currentY += 5
  const qrPayload = JSON.stringify({
    ref: booking.booking_number,
    room: booking.room?.name,
    date: booking.date,
    time: `${booking.start_time}-${booking.end_time}`,
    status: booking.status,
    pax: booking.attendees_count
  })

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 250,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 26, currentY, 22, 22)
  } catch (err) {
    console.warn('QR Code generation skipped:', err)
  }

  // 5. Booking Reference Banner
  doc.setFillColor(248, 250, 252) // Slate 50
  doc.setDrawColor(226, 232, 240)
  doc.rect(margin + 4, currentY, contentWidth - 34, 22, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text('NO. RUJUKAN TEMPAHAN:', margin + 7, currentY + 6)
  doc.setFontSize(11)
  doc.setTextColor(2, 132, 199) // Sky 600
  doc.text(booking.booking_number, margin + 7, currentY + 12)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text('STATUS PERMOHONAN:', margin + 75, currentY + 6)
  doc.setFontSize(10)
  const statusLabel = booking.status === 'approved' ? 'DILULUSKAN (APPROVED)' : booking.status.toUpperCase()
  doc.setTextColor(booking.status === 'approved' ? 16 : 220, booking.status === 'approved' ? 149 : 38, booking.status === 'approved' ? 95 : 38)
  doc.text(statusLabel, margin + 75, currentY + 12)

  currentY += 26

  const durationHrs = Math.round(((timeToMinutes(booking.end_time) - timeToMinutes(booking.start_time)) / 60) * 10) / 10

  // 6. Section 1: Maklumat Pemohon & Acara Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin + 4, right: margin + 4 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['1. MAKLUMAT PEMOHON & BUTIRAN ACARA', 'SPESIFIKASI']],
    body: [
      ['Nama Pemohon', booking.pemohon_name || booking.user?.full_name || 'Pegawai Hospital Lawas'],
      ['Jawatan & Jabatan / Unit', `${booking.pemohon_jawatan || 'Pegawai Perubatan'} (${booking.pemohon_department || booking.department?.department_name || 'Unit Berkaitan'})`],
      ['No. Telefon & Emel', `${booking.pemohon_phone || '085-284100'} | ${booking.pemohon_email || 'hosp_lawas@moh.gov.my'}`],
      ['Tujuan Acara / Mesyuarat', booking.purpose],
      ['Kategori Acara / Keutamaan', `${booking.event_type} [Keutamaan: ${booking.priority.toUpperCase()}]`],
      ['Tarikh Acara', `${booking.date} (${new Date(booking.date).toLocaleDateString('ms-MY', { weekday: 'long' })})`],
      ['Masa Mula - Tamat', `${booking.start_time} hingga ${booking.end_time} (${durationHrs} Jam)`],
      ['Anggaran Kehadiran Peserta', `${booking.attendees_count} Orang`]
    ]
  })

  currentY = (doc as any).lastAutoTable.finalY + 3.5

  // 7. Section 2: Butiran Fasiliti & Susun Atur Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin + 4, right: margin + 4 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [192, 38, 211], textColor: [255, 255, 255], fontStyle: 'bold' }, // Fuchsia 600
    head: [['2. MAKLUMAT FASILITI & LOGISTIK', 'BUTIRAN']],
    body: [
      ['Nama Fasiliti / Ruang', `${booking.room?.name || 'Bilik Mesyuarat'} (${booking.room?.room_code || '-'})`],
      ['Lokasi & Aras Bangunan', `${booking.room?.location || '-'} [${booking.room?.floor_level || '-'}]`],
      ['Kapasiti Maksimum Bilik', `${booking.room?.capacity || '-'} Pax`],
      ['Bentuk Susunan Meja & Kerusi', (booking.layout_type || 'boardroom').toUpperCase()],
      ['Fasiliti & Peralatan Dimohon', (booking.requested_amenities || []).join(', ') || 'Peralatan asas bilik'],
      ['Peralatan Tambahan', (booking.peralatan_tambahan || []).map(p => `${p.equipment_name} (${p.quantity} unit)`).join(', ') || 'Tiada'],
      ['Jamuan / Katering', booking.tempahan_makanan?.diperlukan ? `Ya (${booking.tempahan_makanan.jenis_hidangan} - ${booking.tempahan_makanan.anggaran_pax} pax di ${booking.tempahan_makanan.lokasi_hidang})` : 'Tiada Jamuan'],
      ['Tetamu Kenamaan (VIP)', booking.tetamu_vip?.ada_vip ? `Ya: ${(booking.tetamu_vip.senarai_vip || []).join(', ')}` : 'Tiada'],
      ['Keperluan Khas / Catatan', booking.special_requirements || 'Tiada']
    ]
  })

  currentY = (doc as any).lastAutoTable.finalY + 3.5

  // 8. Terms & Rules Box
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.rect(margin + 4, currentY, contentWidth - 8, 18, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(15, 23, 42)
  doc.text('TERMA & SYARAT PENGGUNAAN FASILITI HOSPITAL LAWAS:', margin + 6, currentY + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(71, 85, 105)
  doc.text('1. Pemohon bertanggungjawab memastikan kebersihan, keselamatan peralatan IT/AV, serta suis elektrik dimatikan selepas selesai.', margin + 6, currentY + 8.5)
  doc.text('2. Makanan & minuman hanya dibenarkan jika ruang tersebut mempunyai kebenaran katering. Sisa katering wajib dibersihkan serta-merta.', margin + 6, currentY + 12)
  doc.text('3. Kunci dan peralatan tambahan hendaklah diserahkan kembali kepada Pegawai Penjaga Bilik sejurus selepas majlis tamat.', margin + 6, currentY + 15.5)

  currentY += 21

  // 9. Signatures Block
  const sigBoxWidth = (contentWidth - 12) / 2
  const sigBoxHeight = 30

  // Requester Signature Box
  doc.rect(margin + 4, currentY, sigBoxWidth, sigBoxHeight)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(15, 23, 42)
  doc.text('PERAKUAN PEMOHON:', margin + 6, currentY + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('Tandatangan:', margin + 6, currentY + 16)
  doc.text(`Nama: ${booking.pemohon_name || booking.user?.full_name || 'Pegawai Pemohon'}`, margin + 6, currentY + 21)
  doc.text(`Tarikh: ${booking.created_at.slice(0, 10)}`, margin + 6, currentY + 25.5)

  // Approver Signature Box
  doc.rect(margin + 4 + sigBoxWidth + 4, currentY, sigBoxWidth, sigBoxHeight)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(15, 23, 42)
  doc.text('KELULUSAN PENTADBIR FASILITI:', margin + 6 + sigBoxWidth + 4, currentY + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('Tandatangan & Cop Rasmi:', margin + 6 + sigBoxWidth + 4, currentY + 16)
  doc.text(`Pegawai: ${booking.approved_by_name || booking.approved_by || 'Pentadbir Fasiliti Hospital'}`, margin + 6 + sigBoxWidth + 4, currentY + 21)
  doc.text(`Tarikh Diluluskan: ${booking.approved_at ? booking.approved_at.slice(0, 10) : '-'}`, margin + 6 + sigBoxWidth + 4, currentY + 25.5)

  return doc.output('blob')
}

export async function downloadBookingConfirmationPdf(booking: Booking): Promise<void> {
  const blob = await generateBookingConfirmationPdf(booking)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Slip_Tempahan_${booking.booking_number}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
