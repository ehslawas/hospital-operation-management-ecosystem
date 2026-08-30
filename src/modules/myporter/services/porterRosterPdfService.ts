// src/modules/myporter/services/porterRosterPdfService.ts
// Official Hospital Lawas Duty Roster PDF Export Service for MyPorter

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PorterProfile, PorterRosterShift, ShiftType } from '@/shared/types/myporter'
import { getShiftHours, calculateWeeklyWorkHours } from './porterService'
import { drawHospitalHeader } from '@/lib/pdfHeader'
import { JATA_NEGARA_BASE64 } from '@/modules/mytransporter/pages/jataNegaraBase64'

export interface WeekRange {
  weekIndex: number
  label: string
  startDay: number
  endDay: number
  startDateStr: string
  endDateStr: string
}

export const exportRosterToPdf = async (
  porters: PorterProfile[],
  roster: PorterRosterShift[],
  selectedMonth: Date = new Date(),
  selectedWeek?: WeekRange | null
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth() // 297mm
  const pageHeight = doc.internal.pageSize.getHeight() // 210mm
  const margin = 14

  const year = selectedMonth.getFullYear()
  const month = selectedMonth.getMonth()
  const monthName = selectedMonth.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' }).toUpperCase()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 1. Draw Official Hospital Lawas Header with Jata Negara
  const headerEndY = await drawHospitalHeader(doc, {
    logoBase64: JATA_NEGARA_BASE64,
    margin,
    startY: 8
  })

  // 2. Document Title Banner
  let currentY = headerEndY + 1

  const isWeekly = !!selectedWeek
  const titleText = isWeekly
    ? `JADUAL BERTUGAS SYIF MINGGUAN PPK GRED U11 / U14 (${selectedWeek.label.toUpperCase()})`
    : `JADUAL BERTUGAS SYIF BULANAN PEMBANTU PERAWATAN KESIHATAN (PPK)`

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42) // Slate 900
  doc.text(titleText, pageWidth / 2, currentY, { align: 'center' })

  currentY += 4.5
  doc.setFontSize(9)
  doc.setTextColor(3, 105, 161) // Sky 700
  const subText = isWeekly
    ? `TEMPOH: ${selectedWeek.startDateStr} HINGGA ${selectedWeek.endDateStr} | BULAN ${monthName} | UNIT LOGISTIK (MYPORTER)`
    : `BULAN: ${monthName} | UNIT LOGISTIK & DISPATCH (MYPORTER)`
  doc.text(subText, pageWidth / 2, currentY, { align: 'center' })

  // 3. Shift Standard & Legend Note
  currentY += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105) // Slate 600
  doc.text(
    'Standard Kerja Syif: P = Pagi (07:00-15:00, 8j) | PT = Petang (14:00-22:00, 8j) | M = Malam (21:30-07:30, 10j) | R = Rehat (0j) | Had Maksimum: 43 Jam/Minggu',
    margin,
    currentY
  )

  const shiftCodeMap: Record<ShiftType, string> = {
    morning: 'P',
    evening: 'PT',
    night: 'M',
    off: 'R'
  }

  const shiftNameMap: Record<ShiftType, string> = {
    morning: 'Pagi (8j)',
    evening: 'Petang (8j)',
    night: 'Malam (10j)',
    off: 'Rehat (0j)'
  }

  if (isWeekly && selectedWeek) {
    // ==========================================
    // WEEKLY FORMAT (Spacious 7-day columns)
    // ==========================================
    const startDay = selectedWeek.startDay
    const endDay = selectedWeek.endDay
    const dayCount = endDay - startDay + 1

    const dayHeaders = Array.from({ length: dayCount }, (_, i) => {
      const dayNum = startDay + i
      const dateObj = new Date(year, month, dayNum)
      const dayName = dateObj.toLocaleDateString('ms-MY', { weekday: 'short' })
      return `${dayNum} (${dayName})`
    })

    const head = [['Bil', 'Nama Petugas PPK', 'No. / Gred', 'Zon Penugasan', ...dayHeaders, 'Jum Jam (43j)', 'Status / Baki']]

    const rows = porters.map((porter, idx) => {
      let weekTotalHours = 0

      const dayCells = Array.from({ length: dayCount }, (_, i) => {
        const dayNum = startDay + i
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        const shiftObj = roster.find(r => r.porter_id === porter.id && r.date === dateStr)
        const shiftType = (shiftObj?.shift || 'off') as ShiftType
        const hours = getShiftHours(shiftType)
        weekTotalHours += hours

        return shiftNameMap[shiftType] || '-'
      })

      const diff = weekTotalHours - 43
      const statusText = weekTotalHours === 43
        ? 'Optimum (43j)'
        : weekTotalHours < 43
          ? `Kurang ${43 - weekTotalHours}j`
          : `Lebih ${diff}j`

      return [
        String(idx + 1),
        porter.full_name,
        `${porter.staff_no} (${porter.gred})`,
        porter.assigned_zone,
        ...dayCells,
        `${weekTotalHours} / 43j`,
        statusText
      ]
    })

    autoTable(doc, {
      head,
      body: rows,
      startY: currentY + 2.5,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
        textColor: [15, 23, 42],
        lineWidth: 0.1,
        lineColor: [203, 213, 225]
      },
      headStyles: {
        fillColor: [15, 23, 42], // Slate 900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 42, halign: 'left', fontStyle: 'bold' },
        2: { cellWidth: 22, halign: 'left' },
        3: { cellWidth: 32, halign: 'left' },
        [dayCount + 4]: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
        [dayCount + 5]: { cellWidth: 24, fontStyle: 'bold', halign: 'center' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index >= 4 && data.column.index < dayCount + 4) {
          const val = String(data.cell.raw)
          if (val.includes('Pagi')) {
            data.cell.styles.fillColor = [254, 243, 199]
            data.cell.styles.textColor = [180, 83, 9]
            data.cell.styles.fontStyle = 'bold'
          } else if (val.includes('Petang')) {
            data.cell.styles.fillColor = [255, 237, 213]
            data.cell.styles.textColor = [194, 65, 12]
            data.cell.styles.fontStyle = 'bold'
          } else if (val.includes('Malam')) {
            data.cell.styles.fillColor = [224, 231, 255]
            data.cell.styles.textColor = [67, 56, 202]
            data.cell.styles.fontStyle = 'bold'
          } else if (val.includes('Rehat')) {
            data.cell.styles.fillColor = [241, 245, 249]
            data.cell.styles.textColor = [148, 163, 184]
          }
        }

        if (data.section === 'body' && data.column.index === dayCount + 5) {
          const val = String(data.cell.raw)
          if (val.includes('Optimum')) {
            data.cell.styles.textColor = [16, 185, 129]
            data.cell.styles.fontStyle = 'bold'
          } else if (val.includes('Kurang')) {
            data.cell.styles.textColor = [217, 119, 6]
            data.cell.styles.fontStyle = 'bold'
          } else if (val.includes('Lebih')) {
            data.cell.styles.textColor = [225, 29, 72]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      }
    })
  } else {
    // ==========================================
    // MONTHLY MATRIX FORMAT (1-31 days)
    // ==========================================
    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))
    const head = [['Bil', 'Nama Petugas PPK', 'No. / Gred', ...dayHeaders, 'Jum Jam', 'Status 43j']]

    const rows = porters.map((porter, idx) => {
      let totalMonthHours = 0

      const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = i + 1
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        const shiftObj = roster.find(r => r.porter_id === porter.id && r.date === dateStr)
        const shiftType = (shiftObj?.shift || 'off') as ShiftType
        const hours = getShiftHours(shiftType)
        totalMonthHours += hours

        return shiftCodeMap[shiftType] || '-'
      })

      const weekSummary = calculateWeeklyWorkHours(porter.id, selectedMonth)
      const statusText = weekSummary.status === 'optimum_43h'
        ? 'Optimum (43j)'
        : weekSummary.status === 'deficit_addon_required'
          ? `Kurang ${weekSummary.deficit_carried_forward}j`
          : `Lebih ${weekSummary.hour_difference}j`

      return [
        String(idx + 1),
        porter.full_name,
        `${porter.staff_no} (${porter.gred})`,
        ...dayCells,
        `${totalMonthHours}j`,
        statusText
      ]
    })

    autoTable(doc, {
      head,
      body: rows,
      startY: currentY + 2.5,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.1,
        halign: 'center',
        valign: 'middle',
        textColor: [15, 23, 42],
        lineWidth: 0.1,
        lineColor: [203, 213, 225]
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 38, halign: 'left', fontStyle: 'bold' },
        2: { cellWidth: 20, halign: 'left' },
        [daysInMonth + 3]: { cellWidth: 14, fontStyle: 'bold', halign: 'center' },
        [daysInMonth + 4]: { cellWidth: 18, fontStyle: 'bold', halign: 'center' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index >= 3 && data.column.index < daysInMonth + 3) {
          const val = data.cell.raw
          if (val === 'P') {
            data.cell.styles.fillColor = [254, 243, 199]
            data.cell.styles.textColor = [180, 83, 9]
            data.cell.styles.fontStyle = 'bold'
          } else if (val === 'PT') {
            data.cell.styles.fillColor = [255, 237, 213]
            data.cell.styles.textColor = [194, 65, 12]
            data.cell.styles.fontStyle = 'bold'
          } else if (val === 'M') {
            data.cell.styles.fillColor = [224, 231, 255]
            data.cell.styles.textColor = [67, 56, 202]
            data.cell.styles.fontStyle = 'bold'
          } else if (val === 'R') {
            data.cell.styles.fillColor = [241, 245, 249]
            data.cell.styles.textColor = [148, 163, 184]
          }
        }

        if (data.section === 'body' && data.column.index === daysInMonth + 4) {
          const val = String(data.cell.raw)
          if (val.includes('Optimum')) {
            data.cell.styles.textColor = [16, 185, 129]
          } else if (val.includes('Kurang')) {
            data.cell.styles.textColor = [217, 119, 6]
          } else if (val.includes('Lebih')) {
            data.cell.styles.textColor = [225, 29, 72]
          }
        }
      }
    })
  }

  // 4. Signatures Section Block
  const finalY = (doc as any).lastAutoTable?.finalY || 135
  const sigY = Math.min(finalY + 8, pageHeight - 38)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)

  // 1st Signature (Penyelia PPK)
  doc.text('Disediakan Oleh:', 20, sigY)
  doc.line(20, sigY + 15, 75, sigY + 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('(Penyelia PPK / PPP U32)', 20, sigY + 19)
  doc.text('Hospital Lawas, Sarawak', 20, sigY + 22.5)
  doc.text(`Tarikh: ${new Date().toLocaleDateString('ms-MY')}`, 20, sigY + 26)

  // 2nd Signature (Ketua Penyelia Hospital)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Disemak & Disahkan Oleh:', 120, sigY)
  doc.line(120, sigY + 15, 175, sigY + 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('(Ketua Penyelia Hospital U36)', 120, sigY + 19)
  doc.text('Hospital Lawas, Sarawak', 120, sigY + 22.5)
  doc.text('Tarikh:', 120, sigY + 26)

  // 3rd Signature (Pengarah Hospital)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Diluluskan Oleh:', 220, sigY)
  doc.line(220, sigY + 15, 275, sigY + 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('(Pengarah Hospital)', 220, sigY + 19)
  doc.text('Hospital Lawas, Sarawak', 220, sigY + 22.5)
  doc.text('Tarikh:', 220, sigY + 26)

  // Save PDF
  const filename = isWeekly && selectedWeek
    ? `Jadual_Bertugas_PPK_Minggu_${selectedWeek.weekIndex}_Hospital_Lawas.pdf`
    : `Jadual_Bertugas_PPK_Hospital_Lawas_${monthName.replace(/\s+/g, '_')}.pdf`

  doc.save(filename)
}
