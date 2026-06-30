// @ts-nocheck
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { FinancialReportData } from './financialReportService'

// Helper to convert logo image to base64
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

export async function generateFinancialReportPdf(data: FinancialReportData): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  try {
    const doc = new jsPDF('p', 'mm', 'a4')

    // Formatting helpers
    const fmt = (val: number) => `RM ${Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    const fmtNum = (val: number) => Number(val).toLocaleString()

    const pageWidth = 210
    const margin = 14
    const contentWidth = pageWidth - (margin * 2)

    // Load logo
    const logoBase64 = await getBase64ImageFromUrlLocal('/512px-Jata_MalaysiaV2.svg.png')

    // Watermark
    const drawWatermark = () => {
      if (logoBase64) {
        try {
          doc.saveGraphicsState()
          const GState = (doc as any).GState || (jsPDF as any).GState
          if (GState) {
            doc.setGState(new GState({ opacity: 0.04 }))
          }
          doc.addImage(logoBase64, 'PNG', (pageWidth - 95) / 2, (297 - 95) / 2, 95, 95)
          doc.restoreGraphicsState()
        } catch (err) {
          console.error('Error drawing watermark:', err)
        }
      }
    }

    // Header drawing
    const drawHeader = (title: string, showLogo = true) => {
      if (showLogo && logoBase64) {
        doc.addImage(logoBase64, 'PNG', (pageWidth - 25) / 2, 15, 25, 20)
      }
      
      let y = showLogo ? 45 : 20
      
      doc.setFont('times', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(31, 41, 55)
      doc.text('KEMENTERIAN KESIHATAN MALAYSIA', pageWidth / 2, y, { align: 'center' })
      y += 6
      doc.setFontSize(12)
      doc.text(data.metadata.hospitalName.toUpperCase(), pageWidth / 2, y, { align: 'center' })
      y += 10
      
      // Divider line
      doc.setLineWidth(0.5)
      doc.setDrawColor(31, 41, 55)
      doc.line(margin, y, pageWidth - margin, y)
      y += 8
      
      doc.setFont('times', 'bold')
      doc.setFontSize(16)
      doc.text(title.toUpperCase(), pageWidth / 2, y, { align: 'center' })
      y += 6
      
      doc.setFont('times', 'normal')
      doc.setFontSize(10)
      doc.text(`Tempoh Penilaian: ${data.metadata.dateFrom} hingga ${data.metadata.dateTo}`, pageWidth / 2, y, { align: 'center' })
      y += 12
      
      return y
    }

    // Footer drawing
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
    let y = drawHeader('Laporan Eksekutif Kewangan & Belanjawan (Financial Intelligence Report)')

    // Draw Stat KPI boxes (3x2 Grid)
    const drawStatBox = (x: number, y: number, w: number, h: number, label: string, value: string, subValue?: string) => {
      doc.setDrawColor(210, 214, 219)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(x, y, w, h, 2, 2, 'FD')
      
      doc.setFont('times', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(71, 85, 105)
      doc.text(label, x + w/2, y + 6, { align: 'center' })
      
      doc.setFont('times', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(15, 23, 42)
      doc.text(value, x + w/2, y + 14, { align: 'center' })
      
      if (subValue) {
        doc.setFont('times', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text(subValue, x + w/2, y + 19, { align: 'center' })
      }
    }

    const boxW = (contentWidth - 10) / 3
    const boxH = 22

    // Row 1 KPI
    drawStatBox(margin, y, boxW, boxH, 'PERUNTUKAN / ALLOCATION', fmt(data.executive.totalAllocation))
    drawStatBox(margin + boxW + 5, y, boxW, boxH, 'PERBELANJAAN / EXPENSES', fmt(data.executive.totalExpenses))
    drawStatBox(margin + boxW*2 + 10, y, boxW, boxH, 'BAKI PERUNTUKAN / BALANCE', fmt(data.executive.remainingBalance))
    y += boxH + 5

    // Row 2 KPI
    drawStatBox(margin, y, boxW, boxH, 'KADAR PENGGUNAAN / UTILIZATION', `${data.executive.usageRate.toFixed(1)}%`)
    drawStatBox(margin + boxW + 5, y, boxW, boxH, 'BILANGAN WARAN / WARRANTS', fmtNum(data.executive.totalWarrants))
    drawStatBox(margin + boxW*2 + 10, y, boxW, boxH, 'PO AKTIF / ACTIVE POs', fmtNum(data.executive.activePOs))
    y += boxH + 15

    // Brief Intro text
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    const introText = "Laporan Kecerdasan Kewangan (Financial Intelligence Report) ini memperincikan peruntukan belanjawan, penggunaan, baki, serta transaksi perolehan bagi hospital. Analisis ini diasingkan secara mendalam mengikut Kod Vot (080702, 990102), Kategori Produk (Ubat, Bukan Ubat, Reagen, dll), Jabatan Hospital, serta Aktiviti Vot / Kod Item bagi membimbing pengurusan belanjawan farmasi secara strategik."
    const splitIntro = doc.splitTextToSize(introText, contentWidth)
    doc.text(splitIntro, margin, y)

    drawFooter({ pageNumber: 1 })

    // ==========================================
    // PAGE 2: BY VOTE CODE & CATEGORY
    // ==========================================
    doc.addPage()
    drawWatermark()
    y = drawHeader('1. Laporan Belanjawan Mengikut Kod Vot (By Vote Code)', false)

    autoTable(doc, {
      startY: y,
      head: [['Kod Vot', 'Peruntukan (RM)', 'Perbelanjaan (RM)', 'Baki (RM)', 'Kadar %', 'Bilangan PO']],
      body: data.byVoteCode.map(vc => [
        vc.voteCode,
        fmt(vc.allocation),
        fmt(vc.expenses),
        fmt(vc.balance),
        `${vc.usageRate.toFixed(1)}%`,
        vc.poCount
      ]),
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
      didDrawPage: drawFooter
    })

    y = (doc as any).lastAutoTable.finalY + 15

    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(31, 41, 55)
    doc.text('2. Laporan Belanjawan Mengikut Kategori (By Category)', margin, y)
    y += 8

    autoTable(doc, {
      startY: y,
      head: [['Kategori', 'Peruntukan (RM)', 'Perbelanjaan (RM)', 'Baki (RM)', 'Kadar %', 'Bilangan PO']],
      body: data.byCategory.map(c => [
        c.category,
        fmt(c.allocation),
        fmt(c.expenses),
        fmt(c.balance),
        `${c.usageRate.toFixed(1)}%`,
        c.poCount
      ]),
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      didDrawPage: drawFooter
    })

    // ==========================================
    // PAGE 3: BY DEPARTMENT & ACTIVITY
    // ==========================================
    doc.addPage()
    drawWatermark()
    y = drawHeader('3. Laporan Belanjawan Mengikut Jabatan (By Department)', false)

    autoTable(doc, {
      startY: y,
      head: [['Jabatan Hospital', 'Peruntukan (RM)', 'Perbelanjaan (RM)', 'Baki (RM)', 'Kadar %', 'Bilangan PO']],
      body: data.byDepartment.map(d => [
        d.department,
        fmt(d.allocation),
        fmt(d.expenses),
        fmt(d.balance),
        `${d.usageRate.toFixed(1)}%`,
        d.poCount
      ]),
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      didDrawPage: drawFooter
    })

    y = (doc as any).lastAutoTable.finalY + 15

    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(31, 41, 55)
    doc.text('4. Laporan Peruntukan Mengikut Aktiviti Vot (By Vote Activity)', margin, y)
    y += 8

    autoTable(doc, {
      startY: y,
      head: [['Aktiviti Vot', 'Peruntukan (RM)', 'Perbelanjaan (RM)', 'Baki (RM)', 'Kadar %', 'Bilangan PO']],
      body: data.byVoteActivity.map(act => [
        act.voteActivity,
        fmt(act.allocation),
        fmt(act.expenses),
        fmt(act.balance),
        `${act.usageRate.toFixed(1)}%`,
        act.poCount
      ]),
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      didDrawPage: drawFooter
    })

    // ==========================================
    // PAGE 4: TOP ITEM USAGE & FORECASTING
    // ==========================================
    doc.addPage()
    drawWatermark()
    y = drawHeader('5. Produk / Item Tertinggi Mengikut Perbelanjaan (Top Spending Items)', false)

    autoTable(doc, {
      startY: y,
      head: [['Nama Item', 'Kod Item', 'Kategori', 'Jabatan', 'Vot', 'Kuantiti', 'Jumlah (RM)']],
      body: data.topItems.map(item => [
        item.itemName,
        item.itemCode,
        item.category,
        item.department,
        item.voteCode,
        fmtNum(item.quantity),
        fmt(item.totalSpent)
      ]),
      theme: 'grid',
      styles: { font: 'times', fontSize: 8.5 },
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: {
        0: { cellWidth: 50 }, // constrain item name width
      },
      didDrawPage: drawFooter
    })

    y = (doc as any).lastAutoTable.finalY + 15

    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(31, 41, 55)
    doc.text('6. Ramalan & Unjuran Belanjawan (Budget Forecast)', margin, y)
    y += 8

    const forecastData = [
      ['Unjuran Tahunan (Annual Projection)', fmt(data.forecast.annualProjection)],
      ['Varians Belanjawan (Variance vs Allocation)', fmt(data.forecast.variance)],
      ['Kadar Pembakaran Belanjawan (Burn Rate)', `${data.forecast.burnRate.toFixed(1)}%`]
    ]

    autoTable(doc, {
      startY: y,
      head: [['Metrik Kebolehan', 'Unjuran Nilai']],
      body: forecastData,
      theme: 'grid',
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      didDrawPage: drawFooter
    })

    // ==========================================
    // PAGE 5: SIGNATURES BLOCK
    // ==========================================
    doc.addPage()
    drawWatermark()
    y = drawHeader('Analisis Kelayakan & Pengesahan Belanjawan', false)

    // A simple notes box
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(31, 41, 55)
    doc.text('Catatan / Justifikasi Kewangan:', margin, y)
    y += 6

    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, y, contentWidth, 50, 1, 1, 'FD')

    // Add some guiding text lines inside the notes box
    doc.setFont('times', 'italic')
    doc.setFontSize(9.5)
    doc.setTextColor(120, 120, 120)
    doc.text('Peruntukan belanjawan setakat ini didapati mencukupi bagi menampung perolehan kritikal.', margin + 4, y + 6)
    doc.text('Unjuran burn-rate menunjukkan keperluan tambahan peruntukan bagi Kod Vot 080702 menjelang Suku Ke-4.', margin + 4, y + 12)

    y += 80

    // Signatures
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(31, 41, 55)

    doc.text('Disediakan Oleh:', margin + 20, y)
    doc.text('Disahkan Oleh:', pageWidth - margin - 60, y)

    y += 25
    doc.setLineWidth(0.3)
    doc.line(margin + 10, y, margin + 70, y)
    doc.line(pageWidth - margin - 70, y, pageWidth - margin - 10, y)

    y += 5
    doc.setFont('times', 'normal')
    doc.text(data.metadata.generatedBy, margin + 40, y, { align: 'center' })
    doc.text('(Pengarah Hospital / Ketua Jabatan)', pageWidth - margin - 40, y, { align: 'center' })

    y += 5
    doc.text(`Tarikh: ${new Date().toLocaleDateString('en-MY')}`, margin + 40, y, { align: 'center' })
    doc.text('Tarikh: ', pageWidth - margin - 40, y, { align: 'center' })

    drawFooter({ pageNumber: 5 })

    // Save
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)

    return { success: true, pdfUrl }
  } catch (error: any) {
    console.error('generateFinancialReportPdf error', error)
    return { success: false, error: error.message || 'Failed to generate PDF' }
  }
}
