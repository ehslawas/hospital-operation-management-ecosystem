// @ts-nocheck
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ProcurementReportData } from './procurementReportService'
import { drawHospitalHeader } from '@/lib/pdfHeader'

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

export async function generateProcurementReportPdf(data: ProcurementReportData): Promise<{ success: boolean, pdfUrl?: string, error?: string }> {
  try {
    const doc = new jsPDF('p', 'mm', 'a4')
    
    // Formatting helpers
    const fmt = (val: number) => `RM ${Number(val).toFixed(2).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')}`
    const fmtNum = (val: number) => Number(val).toLocaleString()
    
    // --- PDF Configuration ---
    const pageWidth = 210
    const margin = 14
    const contentWidth = pageWidth - (margin * 2)

    // Load Logo
    const logoBase64 = await getBase64ImageFromUrlLocal('/512px-Jata_MalaysiaV2.svg.png')
    
    // --- Helper: Draw Watermark ---
    const drawWatermark = () => {
      if (logoBase64) {
        try {
          doc.saveGraphicsState();
          const GState = (doc as any).GState || (jsPDF as any).GState;
          if (GState) {
            doc.setGState(new GState({ opacity: 0.05 }));
          }
          doc.addImage(logoBase64, 'PNG', (pageWidth - 90) / 2, (297 - 90) / 2, 90, 90);
          doc.restoreGraphicsState();
        } catch (err) {
          console.error('Error drawing watermark:', err);
        }
      }
    };

    // --- Draw Header ---
    const drawHeader = async (title: string, showLogo = true) => {
      let y = await drawHospitalHeader(doc, { margin, startY: 10, logoBase64 })
      
      doc.setFont('times', 'bold')
      doc.setFontSize(16)
      doc.text(title.toUpperCase(), pageWidth / 2, y, { align: 'center' })
      y += 6
      
      doc.setFont('times', 'normal')
      doc.setFontSize(10)
      doc.text(`Tempoh Laporan: ${data.metadata.dateFrom} hingga ${data.metadata.dateTo}`, pageWidth / 2, y, { align: 'center' })
      y += 12
      
      return y
    }
    
    // --- Helper: Draw Footer ---
    const drawFooter = (pageData: any) => {
      doc.setFontSize(8)
      doc.setFont('times', 'italic')
      doc.setTextColor(75, 85, 99)
      const dateStr = new Date(data.metadata.generatedAt).toLocaleString('en-MY')
      doc.text(`Dijana pada: ${dateStr} oleh ${data.metadata.generatedBy}`, margin, 285)
      doc.text(`Halaman ${pageData.pageNumber}`, pageWidth - margin, 285, { align: 'right' })
    }

    // ==========================================
    // PAGE 1: COVER & EXECUTIVE SUMMARY
    // ==========================================
    drawWatermark()
    let y = await drawHeader('Laporan Eksekutif Perolehan (Procurement Executive Summary)')
    
    // Executive Summary Grid
    const drawStatBox = (x: number, y: number, w: number, h: number, label: string, value: string, subValue?: string) => {
      doc.setDrawColor(200, 200, 200)
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(x, y, w, h, 2, 2, 'FD')
      
      doc.setFont('times', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text(label, x + w/2, y + 6, { align: 'center' })
      
      doc.setFont('times', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(17, 24, 39)
      doc.text(value, x + w/2, y + 14, { align: 'center' })
      
      if (subValue) {
        doc.setFont('times', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(subValue, x + w/2, y + 19, { align: 'center' })
      }
    }
    
    const boxW = (contentWidth - 10) / 3
    const boxH = 22
    
    // Row 1
    drawStatBox(margin, y, boxW, boxH, 'JUMLAH PO / TOTAL POs', fmtNum(data.executive.totalPOs))
    drawStatBox(margin + boxW + 5, y, boxW, boxH, 'NILAI KESELURUHAN / TOTAL VALUE', fmt(data.executive.totalValue))
    drawStatBox(margin + boxW*2 + 10, y, boxW, boxH, 'KADAR PENYIAPAN / COMPLETION %', `${data.executive.completionRate.toFixed(1)}%`)
    y += boxH + 5
    
    // Row 2
    drawStatBox(margin, y, boxW, boxH, 'PENGHANTARAN / ON-TIME DELIVERY', `${data.executive.onTimeDeliveryRate.toFixed(1)}%`)
    drawStatBox(margin + boxW + 5, y, boxW, boxH, 'JUMLAH DENDA / TOTAL PENALTIES', fmtNum(data.executive.totalPenalties))
    drawStatBox(margin + boxW*2 + 10, y, boxW, boxH, 'PRESTASI PEMBEKAL / AVG SCORE', `${data.executive.avgSupplierScore.toFixed(1)}%`)
    
    y += boxH + 15

    // Add some brief intro text
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(17, 24, 39)
    const introText = "Laporan ini merangkumi analisis menyeluruh mengenai aktiviti perolehan farmasi yang merangkumi Pesanan Kerajaan (PO), Pesanan Belian Tempatan (LPO), pengesanan pesanan, penerimaan barangan, status pembayaran, nota kredit, denda, dan penilaian prestasi pembekal bagi tempoh yang dinyatakan."
    const splitIntro = doc.splitTextToSize(introText, contentWidth)
    doc.text(splitIntro, margin, y)
    
    // Add page numbers
    drawFooter({ pageNumber: 1 })

    // ==========================================
    // PAGE 2: POs & LPOs
    // ==========================================
    doc.addPage()
    drawWatermark()
    y = drawHeader('1. Analisis Pesanan Kerajaan (Purchase Orders)', false)
    
    // PO Table
    autoTable(doc, {
      startY: y,
      head: [['Bulan', 'Bilangan PO', 'Nilai (RM)']],
      body: data.purchaseOrders.monthlyTrend.map(t => [t.month, t.count, fmt(t.value)]),
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [51, 65, 85] },
      didDrawPage: drawFooter
    })
    
    y = (doc as any).lastAutoTable.finalY + 15
    
    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.text('2. Status Pesanan Belian Tempatan (LPOs)', margin, y)
    y += 8
    
    autoTable(doc, {
      startY: y,
      head: [['Status LPO', 'Jumlah']],
      body: Object.entries(data.lpo.stats).map(([status, count]) => [status.toUpperCase(), count]) as any,
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [51, 65, 85] },
      didDrawPage: drawFooter
    })

    // ==========================================
    // PAGE 3: ORDER TRACKING & RECEIVING
    // ==========================================
    doc.addPage()
    drawWatermark()
    y = drawHeader('3. Pengesanan Pesanan (Order Tracking)', false)
    
    const trackingStats = [
      ['Jumlah Pesanan Dijejak', fmtNum(data.orderTracking.stats.total)],
      ['Sedang Diproses (Pending)', fmtNum(data.orderTracking.stats.pending)],
      ['Penghantaran Separa', fmtNum(data.orderTracking.stats.partial)],
      ['Selesai Dihantar', fmtNum(data.orderTracking.stats.completed)],
      ['Lewat (Overdue)', fmtNum(data.orderTracking.stats.overdue)],
      ['Purata Kelewatan (Hari)', data.orderTracking.overdueAnalysis.avgDays.toFixed(1)]
    ]
    
    autoTable(doc, {
      startY: y,
      head: [['Metrik', 'Nilai']],
      body: trackingStats,
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [51, 65, 85] },
      didDrawPage: drawFooter
    })
    
    y = (doc as any).lastAutoTable.finalY + 10
    
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.text('3.1 Pecahan Mengikut Pembekal (Supplier Breakdown)', margin, y)
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

    // Add a totals row if there are suppliers
    if (data.orderTracking.supplierBreakdown && data.orderTracking.supplierBreakdown.length > 0) {
      const totLPOs = data.orderTracking.supplierBreakdown.reduce((sum, s) => sum + s.totalLPOs, 0)
      const totLate = data.orderTracking.supplierBreakdown.reduce((sum, s) => sum + s.lateLPOs, 0)
      const totFull = data.orderTracking.supplierBreakdown.reduce((sum, s) => sum + s.fullyArrivedLPOs, 0)
      const totPartial = data.orderTracking.supplierBreakdown.reduce((sum, s) => sum + s.partiallyArrivedLPOs, 0)
      const totPending = data.orderTracking.supplierBreakdown.reduce((sum, s) => sum + s.pendingLPOs, 0)
      const avgOnTime = totLPOs > 0 ? (totFull / totLPOs) * 100 : 0
      
      supplierRows.push([
        'JUMLAH / TOTAL',
        fmtNum(totLPOs),
        fmtNum(totLate),
        fmtNum(totFull),
        fmtNum(totPartial),
        fmtNum(totPending),
        avgOnTime.toFixed(1) + '%'
      ])
    }

    autoTable(doc, {
      startY: y,
      head: [['Pembekal (Supplier)', 'Total LPO', 'Lewat (Late)', 'Selesai (Full)', 'Separa (Partial)', 'Proses (Pending)', 'Tepat Masa']],
      body: supplierRows,
      theme: 'grid',
      styles: { font: 'times', fontSize: 8 },
      headStyles: { fillColor: [71, 85, 105] },
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

    y = (doc as any).lastAutoTable.finalY + 12
    
    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.text('4. Penerimaan Barangan (Goods Receipts)', margin, y)
    y += 8
    
    autoTable(doc, {
      startY: y,
      head: [['Bulan', 'Bilangan GR']],
      body: data.receivedItems.monthlyGRs.map(g => [g.month, g.count]),
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [51, 65, 85] },
      didDrawPage: drawFooter
    })

    // ==========================================
    // PAGE 4: PAYMENTS, CREDIT NOTES, PENALTIES
    // ==========================================
    doc.addPage()
    drawWatermark()
    y = drawHeader('5. Status Pembayaran', false)
    
    const paymentData = [
      ['Jumlah Transaksi', fmtNum(data.payment.stats.totalTransactions), 'â€”'],
      ['Selesai Dibayar (Paid)', fmtNum(data.payment.statusBreakdown['paid'] || 0), fmt(data.payment.stats.paidValue)],
      ['Sedang Diproses (Processing)', fmtNum(data.payment.statusBreakdown['sent_for_payment'] || 0), fmt(data.payment.stats.outstandingValue)],
    ]
    
    autoTable(doc, {
      startY: y,
      head: [['Status', 'Bilangan', 'Nilai (RM)']],
      body: paymentData,
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [51, 65, 85] },
      didDrawPage: drawFooter
    })
    
    y = (doc as any).lastAutoTable.finalY + 15
    
    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.text('6. Denda & Nota Kredit', margin, y)
    y += 8
    
    const penaltyCnData = [
      ['Jumlah Denda', fmtNum(data.penalties.stats.total), fmt(data.penalties.stats.applValue + data.penalties.stats.ccValue)],
      ['Jumlah Nota Kredit', fmtNum(data.creditNotes.stats.total), fmt(data.creditNotes.stats.value)]
    ]
    
    autoTable(doc, {
      startY: y,
      head: [['Item', 'Bilangan', 'Nilai (RM)']],
      body: penaltyCnData,
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [51, 65, 85] },
      didDrawPage: drawFooter
    })

    // ==========================================
    // PAGE 5: SUPPLIER PERFORMANCE & SIGNATURES
    // ==========================================
    doc.addPage()
    drawWatermark()
    y = drawHeader('7. Prestasi Pembekal (Supplier Performance)', false)
    
    autoTable(doc, {
      startY: y,
      head: [['Tahap Prestasi', 'Bilangan Penilaian']],
      body: Object.entries(data.supplierPerformance.distribution).map(([level, count]) => [level, count]),
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [51, 65, 85] },
      didDrawPage: drawFooter
    })
    
    y = (doc as any).lastAutoTable.finalY + 30
    
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
    
    drawFooter({ pageNumber: 5 })

    // Save
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)

    return { success: true, pdfUrl }
  } catch (error: any) {
    console.error('generateProcurementReportPdf error', error)
    return { success: false, error: error.message || 'Failed to generate PDF' }
  }
}
