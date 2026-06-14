import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ProcurementReportData } from './procurementReportService'

// Helper to convert image URL to base64
const getBase64ImageFromUrlLocal = async (imageUrl: string): Promise<string | null> => {
  try {
    const res = await fetch(imageUrl)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.onerror = () => {
        resolve(null)
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to load image:', error)
    return null
  }
}

/**
 * Generates a formal KKM document for LPOs approaching their ETA
 */
export async function generateETAReportPdf(data: ProcurementReportData): Promise<{ success: boolean, pdfUrl?: string, error?: string }> {
  try {
    const doc = new jsPDF('p', 'mm', 'a4')
    
    // Formatting helpers
    const fmtNum = (val: number) => Number(val).toLocaleString()
    
    const pageWidth = 210
    const margin = 14

    // Load Logo
    const logoBase64 = await getBase64ImageFromUrlLocal('/512px-Jata_MalaysiaV2.svg.png')
    
    // --- Helper: Draw Watermark ---
    const drawWatermark = () => {
      if (logoBase64) {
        try {
          doc.saveGraphicsState();
          const GState = (doc as any).GState || (jsPDF as any).GState;
          if (GState) {
            doc.setGState(new GState({ opacity: 0.04 }));
          }
          doc.addImage(logoBase64, 'PNG', (pageWidth - 90) / 2, (297 - 90) / 2, 90, 90);
          doc.restoreGraphicsState();
        } catch (err) {
          console.error('Error drawing watermark:', err);
        }
      }
    };

    // --- Draw Header ---
    const drawHeader = (title: string, showLogo = true) => {
      if (showLogo && logoBase64) {
        doc.addImage(logoBase64, 'PNG', (pageWidth - 25) / 2, 15, 25, 20)
      }
      
      let y = showLogo ? 45 : 20
      
      doc.setFont('times', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(31, 41, 55)
      doc.text('KEMENTERIAN KESIHATAN MALAYSIA', pageWidth / 2, y, { align: 'center' })
      y += 6
      doc.setFontSize(11)
      doc.text(data.metadata.hospitalName.toUpperCase(), pageWidth / 2, y, { align: 'center' })
      y += 8
      
      // Divider
      doc.setLineWidth(0.5)
      doc.setDrawColor(31, 41, 55)
      doc.line(margin, y, pageWidth - margin, y)
      y += 8
      
      doc.setFont('times', 'bold')
      doc.setFontSize(14)
      doc.text(title.toUpperCase(), pageWidth / 2, y, { align: 'center' })
      y += 6
      
      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.text(`Dijana pada: ${new Date(data.metadata.generatedAt).toLocaleDateString('en-MY')}  |  Oleh: ${data.metadata.generatedBy}`, pageWidth / 2, y, { align: 'center' })
      y += 10
      
      return y
    }
    
    // --- Helper: Draw Footer ---
    const drawFooter = (pageData: any) => {
      doc.setFontSize(8)
      doc.setFont('times', 'italic')
      doc.setTextColor(75, 85, 99)
      doc.text(`LAPORAN MENGEJAR ETA (MENGHAMPIRI TARIKH PENGHANTARAN)`, margin, 285)
      doc.text(`Halaman ${pageData.pageNumber}`, pageWidth - margin, 285, { align: 'right' })
    }

    drawWatermark()
    let y = drawHeader('LAPORAN STATUS PESANAN — MENGHAMPIRI TARIKH PENGHANTARAN\n(Order Status Report — Approaching ETA Date)')
    
    // Summary
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text('RINGKASAN LPO MENGHAMPIRI ETA (7 HARI)', margin, y)
    y += 6

    const statsData = [
      ['Jumlah LPO Menghampiri ETA', fmtNum(data.orderTracking.etaSummary.approachingETA)],
      ['Jumlah LPO Lewat Semasa (Past due)', fmtNum(data.orderTracking.etaSummary.pastETA)],
      ['Jumlah LPO Tiada Tarikh ETA', fmtNum(data.orderTracking.etaSummary.noETA)]
    ]

    autoTable(doc, {
      startY: y,
      head: [['Metrik Pengesanan', 'Bilangan LPO']],
      body: statsData,
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [51, 65, 85] },
      didDrawPage: drawFooter
    })

    y = (doc as any).lastAutoTable.finalY + 12

    // Detailed List of ETA LPOs
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text('SENARAI PERINCIAN LPO MENGHAMPIRI ETA', margin, y)
    y += 6

    // Find the supplier name for an LPO
    const findSupplierName = (lpoNo: string): string => {
      for (const breakdown of data.orderTracking.supplierBreakdown) {
        const found = breakdown.lpoDetails.find(d => d.lpoNumber === lpoNo)
        if (found) return breakdown.supplierName
      }
      return 'Unknown Supplier'
    }

    const etaRows = (data.orderTracking.etaSummary.etaLPOs || []).map(l => {
      const supName = findSupplierName(l.lpoNumber)
      
      // Calculate days to ETA
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const etaDate = new Date(l.expectedDeliveryDate)
      const diffTime = etaDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return [
        supName,
        l.lpoNumber,
        l.poNumber,
        l.expectedDeliveryDate || '—',
        diffDays > 0 ? `${diffDays} hari lagi` : 'Hari ini',
        `${l.deliveredItems}/${l.totalItems} item`,
        l.status === 'partially_delivered' ? 'Separa Terima' : 'Pending'
      ]
    })

    if (etaRows.length === 0) {
      etaRows.push([
        'Tiada rekod LPO yang menghampiri ETA dalam tempoh 7 hari akan datang.',
        '', '', '', '', '', ''
      ])
    }

    autoTable(doc, {
      startY: y,
      head: [['Pembekal (Supplier)', 'LPO No.', 'PO No.', 'Tarikh ETA', 'Hari ke ETA', 'Status Item', 'Status LPO']],
      body: etaRows,
      theme: 'grid',
      styles: { font: 'times', fontSize: 8 },
      headStyles: { fillColor: [71, 85, 105] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 25 },
        6: { halign: 'center' }
      },
      didDrawPage: drawFooter
    })

    y = (doc as any).lastAutoTable.finalY + 25

    // Check if we need to add a page break for signatures
    if (y > 230) {
      doc.addPage()
      drawWatermark()
      y = 30
    }

    // Signatures
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.text('Disediakan Oleh:', margin + 20, y)
    doc.text('Disahkan Oleh:', pageWidth - margin - 60, y)
    
    y += 25
    doc.setLineWidth(0.3)
    doc.line(margin + 10, y, margin + 70, y)
    doc.line(pageWidth - margin - 70, y, pageWidth - margin - 10, y)
    
    y += 5
    doc.setFont('times', 'normal')
    doc.text(data.metadata.generatedBy, margin + 40, y, { align: 'center' })
    doc.text('(Ketua Pegawai Farmasi)', pageWidth - margin - 40, y, { align: 'center' })
    
    y += 5
    doc.text(`Tarikh: ${new Date().toLocaleDateString('en-MY')}`, margin + 40, y, { align: 'center' })
    doc.text(`Tarikh: `, pageWidth - margin - 40, y, { align: 'center' })

    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)

    return { success: true, pdfUrl }
  } catch (error: any) {
    console.error('generateETAReportPdf error', error)
    return { success: false, error: error.message || 'Failed to generate ETA PDF' }
  }
}

/**
 * Generates a formal KKM document for LPOs that are Late (Past ETA)
 */
export async function generateLateReportPdf(data: ProcurementReportData): Promise<{ success: boolean, pdfUrl?: string, error?: string }> {
  try {
    const doc = new jsPDF('p', 'mm', 'a4')
    
    // Formatting helpers
    const fmtNum = (val: number) => Number(val).toLocaleString()
    
    const pageWidth = 210
    const margin = 14

    // Load Logo
    const logoBase64 = await getBase64ImageFromUrlLocal('/512px-Jata_MalaysiaV2.svg.png')
    
    // --- Helper: Draw Watermark ---
    const drawWatermark = () => {
      if (logoBase64) {
        try {
          doc.saveGraphicsState();
          const GState = (doc as any).GState || (jsPDF as any).GState;
          if (GState) {
            doc.setGState(new GState({ opacity: 0.04 }));
          }
          doc.addImage(logoBase64, 'PNG', (pageWidth - 90) / 2, (297 - 90) / 2, 90, 90);
          doc.restoreGraphicsState();
        } catch (err) {
          console.error('Error drawing watermark:', err);
        }
      }
    };

    // --- Draw Header ---
    const drawHeader = (title: string, showLogo = true) => {
      if (showLogo && logoBase64) {
        doc.addImage(logoBase64, 'PNG', (pageWidth - 25) / 2, 15, 25, 20)
      }
      
      let y = showLogo ? 45 : 20
      
      doc.setFont('times', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(31, 41, 55)
      doc.text('KEMENTERIAN KESIHATAN MALAYSIA', pageWidth / 2, y, { align: 'center' })
      y += 6
      doc.setFontSize(11)
      doc.text(data.metadata.hospitalName.toUpperCase(), pageWidth / 2, y, { align: 'center' })
      y += 8
      
      // Divider
      doc.setLineWidth(0.5)
      doc.setDrawColor(31, 41, 55)
      doc.line(margin, y, pageWidth - margin, y)
      y += 8
      
      doc.setFont('times', 'bold')
      doc.setFontSize(14)
      doc.text(title.toUpperCase(), pageWidth / 2, y, { align: 'center' })
      y += 6
      
      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.text(`Dijana pada: ${new Date(data.metadata.generatedAt).toLocaleDateString('en-MY')}  |  Oleh: ${data.metadata.generatedBy}`, pageWidth / 2, y, { align: 'center' })
      y += 10
      
      return y
    }
    
    // --- Helper: Draw Footer ---
    const drawFooter = (pageData: any) => {
      doc.setFontSize(8)
      doc.setFont('times', 'italic')
      doc.setTextColor(75, 85, 99)
      doc.text(`LAPORAN LATE LPO (KELEWATAN PENGHANTARAN PESANAN BELIAN TEMPATAN)`, margin, 285)
      doc.text(`Halaman ${pageData.pageNumber}`, pageWidth - margin, 285, { align: 'right' })
    }

    drawWatermark()
    let y = drawHeader('LAPORAN KELEWATAN PENGHANTARAN PESANAN BELIAN TEMPATAN\n(Delivery Delay Report — Local Purchase Orders)')
    
    // Summary
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text('RINGKASAN KELEWATAN PENGHANTARAN KESELURUHAN', margin, y)
    y += 6

    const statsData = [
      ['Jumlah LPO Lewat Semasa (Past Due)', fmtNum(data.orderTracking.stats.overdue)],
      ['Purata Hari Kelewatan LPO', `${data.orderTracking.overdueAnalysis.avgDays.toFixed(1)} hari`],
      ['Kelewatan Maksimum Dikesan', `${data.orderTracking.overdueAnalysis.maxDays} hari`],
      ['Jumlah Surat Peringatan Dihantar', fmtNum(data.orderTracking.reminderStats.total)]
    ]

    autoTable(doc, {
      startY: y,
      head: [['Metrik Kelewatan', 'Nilai Laporan']],
      body: statsData,
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [153, 27, 27] }, // Dark Red
      didDrawPage: drawFooter
    })

    y = (doc as any).lastAutoTable.finalY + 10

    // Supplier Table Breakdown
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text('PRESTASI PENGHANTARAN MENGIKUT PEMBEKAL', margin, y)
    y += 6

    const supplierRows = (data.orderTracking.supplierBreakdown || []).map(s => [
      s.supplierName,
      fmtNum(s.totalLPOs),
      fmtNum(s.lateLPOs),
      fmtNum(s.fullyArrivedLPOs),
      fmtNum(s.partiallyArrivedLPOs),
      fmtNum(s.pendingLPOs),
      s.onTimeRate.toFixed(1) + '%'
    ])

    autoTable(doc, {
      startY: y,
      head: [['Pembekal (Supplier)', 'Total LPO', 'Lewat (Late)', 'Selesai (Full)', 'Separa (Partial)', 'Proses (Pending)', 'Kadar Tepat Masa']],
      body: supplierRows,
      theme: 'grid',
      styles: { font: 'times', fontSize: 8 },
      headStyles: { fillColor: [51, 65, 85] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' }
      },
      didDrawPage: drawFooter
    })

    y = (doc as any).lastAutoTable.finalY + 10

    // Detailed List of Overdue LPOs
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text('SENARAI DETEL LPO LEWAT (OVERDUE)', margin, y)
    y += 6

    // Find the supplier name for an LPO
    const findSupplierName = (lpoNo: string): string => {
      for (const breakdown of data.orderTracking.supplierBreakdown) {
        const found = breakdown.lpoDetails.find(d => d.lpoNumber === lpoNo)
        if (found) return breakdown.supplierName
      }
      return 'Unknown Supplier'
    }

    const lateRows = (data.orderTracking.etaSummary.lateLPOs || []).map(l => {
      const supName = findSupplierName(l.lpoNumber)
      return [
        supName,
        l.lpoNumber,
        l.poNumber,
        l.expectedDeliveryDate || '—',
        `${l.daysOverdue} hari lewati`,
        `${l.reminderCount} kali sent`,
        `${l.deliveredItems}/${l.totalItems} item`
      ]
    })

    if (lateRows.length === 0) {
      lateRows.push([
        'Tiada rekod LPO yang lewat dikesan dalam pangkalan data.',
        '', '', '', '', '', ''
      ])
    }

    autoTable(doc, {
      startY: y,
      head: [['Pembekal (Supplier)', 'LPO No.', 'PO No.', 'Tarikh ETA', 'Kelewatan', 'Peringatan', 'Penghantaran']],
      body: lateRows,
      theme: 'grid',
      styles: { font: 'times', fontSize: 8 },
      headStyles: { fillColor: [185, 28, 28] }, // Red for overdue
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'center' }
      },
      didDrawPage: drawFooter
    })

    y = (doc as any).lastAutoTable.finalY + 25

    // Check if we need to add a page break for signatures
    if (y > 230) {
      doc.addPage()
      drawWatermark()
      y = 30
    }

    // Signatures
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.text('Disediakan Oleh:', margin + 20, y)
    doc.text('Disahkan Oleh:', pageWidth - margin - 60, y)
    
    y += 25
    doc.setLineWidth(0.3)
    doc.line(margin + 10, y, margin + 70, y)
    doc.line(pageWidth - margin - 70, y, pageWidth - margin - 10, y)
    
    y += 5
    doc.setFont('times', 'normal')
    doc.text(data.metadata.generatedBy, margin + 40, y, { align: 'center' })
    doc.text('(Ketua Pegawai Farmasi)', pageWidth - margin - 40, y, { align: 'center' })
    
    y += 5
    doc.text(`Tarikh: ${new Date().toLocaleDateString('en-MY')}`, margin + 40, y, { align: 'center' })
    doc.text(`Tarikh: `, pageWidth - margin - 40, y, { align: 'center' })

    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)

    return { success: true, pdfUrl }
  } catch (error: any) {
    console.error('generateLateReportPdf error', error)
    return { success: false, error: error.message || 'Failed to generate Late PDF' }
  }
}
