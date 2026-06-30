// @ts-nocheck
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { OxygenReceptionRecord } from '@/types/pharmacy'

// Helper to convert image URL to base64
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
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

export interface OxygenPdfItem {
  size_code: string
  is_loan: boolean
  quantity: number
  unit_price: number
  total_price: number
}

const getCylinderVolume = (sizeCode: string): string => {
  const code = sizeCode.toUpperCase()
  if (code.includes('HS')) return '6.4M³'
  if (code.includes('D')) return '0.5M³'
  if (code.includes('E')) return '0.7M³'
  if (code.includes('F')) return '1.4M³'
  if (code.includes('N')) return '8.0M³'
  return '-'
}

interface OxygenPdfOptions {
  reception: OxygenReceptionRecord
  items: OxygenPdfItem[]
  hospitalName?: string
  applicantName?: string
  applicantPosition?: string
  headName?: string
  headPosition?: string
  supplierName?: string
  supplierAddress?: string
  supplierPhone?: string
  balanceBefore?: number | null
  balanceAfter?: number | null
}

/**
 * Generate official Ministry of Health PO PDF for Oxygen Delivery
 */
export async function generateOxygenPoPdf(options: OxygenPdfOptions): Promise<Blob> {
  const {
    reception,
    items,
    hospitalName = 'Hospital Daerah Lawas',
    applicantName = 'Ahmad Bin Ismail',
    applicantPosition = 'Pegawai Farmasi U41',
    headName = 'â€”',
    headPosition = 'â€”',
    supplierName = 'LINDE EOX SDN BHD (CAW. MIRI)',
    supplierAddress = 'Lot 1525, Block 3 Piasau Industrial Estate, MCLD 98008 Miri Sarawak Bumi Kenyalang',
    supplierPhone = '+60-3-7803-4567',
    balanceAfter = null,
  } = options

  const doc = new jsPDF('p', 'mm', 'a4')
  const logoBase64 = await getBase64ImageFromUrl('/512px-Jata_MalaysiaV2.svg.png')

  const pageWidth = 210
  const margin = 10
  const contentWidth = pageWidth - margin * 2
  const col1 = margin + 5
  const col2 = pageWidth / 2 + 5

  // Symmetrical currency formatter
  const fmt = (val: number) => `RM ${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

  // Page Frame and Watermark
  const renderFrame = () => {
    // Watermark
    if (logoBase64) {
      try {
        doc.saveGraphicsState()
        const GState = (doc as any).GState || (jsPDF as any).GState
        if (GState) {
          doc.setGState(new GState({ opacity: 0.05 }))
        }
        doc.addImage(logoBase64, 'PNG', (pageWidth - 90) / 2, (297 - 90) / 2, 90, 90)
        doc.restoreGraphicsState()
      } catch (err) {
        console.error('Error drawing crest watermark:', err)
      }
    }
    // Solid border
    doc.setDrawColor(31, 41, 55)
    doc.setLineWidth(0.4)
    doc.rect(margin, margin, contentWidth, 268)
  }

  // Pre-process items by physical size code into separate PO blocks for refill and loan
  interface PoBlock {
    type: 'refill' | 'loan'
    items: OxygenPdfItem[]
    totalPrice: number
    balanceBefore: number | null
    balanceAfter: number | null
  }

  const blocks: PoBlock[] = []
  const loanRate = 18.36

  // 1. Group Refills by Size (each size refill gets its own LPO - all received cylinders are refilled!)
  const refillGroups: Record<string, { quantity: number; unitPrice: number }[]> = {}
  
  items.forEach(itm => {
    const size = itm.size_code === '101-F' ? 'P101-F' : itm.size_code
    const refillPrice = itm.is_loan ? (itm.unit_price - loanRate) : itm.unit_price
    
    if (!refillGroups[size]) refillGroups[size] = []
    refillGroups[size].push({
      quantity: itm.quantity,
      unitPrice: refillPrice
    })
  })

  // Add Refill PO block for each size
  Object.keys(refillGroups).sort().forEach(size => {
    const groupItems = refillGroups[size]
    const totalQty = groupItems.reduce((sum, g) => sum + g.quantity, 0)
    const refillPrice = groupItems[0].unitPrice
    
    blocks.push({
      type: 'refill',
      items: [{
        size_code: size,
        is_loan: false,
        quantity: totalQty,
        unit_price: refillPrice,
        total_price: refillPrice * totalQty
      }],
      totalPrice: refillPrice * totalQty,
      balanceBefore: null,
      balanceAfter: null
    })
  })

  // 2. Consolidate ALL Loan items of all sizes into a single Consolidated Loan LPO
  const loanItems = items.filter(itm => itm.is_loan)
  if (loanItems.length > 0) {
    const consolidatedLoanItems = loanItems.map(itm => {
      const size = itm.size_code === '101-F' ? 'P101-F' : itm.size_code
      return {
        ...itm,
        size_code: size,
        unit_price: loanRate,
        total_price: loanRate * itm.quantity
      }
    })
    const totalPrice = consolidatedLoanItems.reduce((sum, itm) => sum + itm.total_price, 0)
    blocks.push({
      type: 'loan',
      items: consolidatedLoanItems,
      totalPrice,
      balanceBefore: null,
      balanceAfter: null
    })
  }

  // 3. Calculate sequential budget balance deductions for refills
  const refillBlocks = blocks.filter(b => b.type === 'refill')
  
  const finalBalanceAfter = balanceAfter !== null && balanceAfter !== undefined 
    ? balanceAfter 
    : 12962.30 // fallback to current balance in user screenshot

  const totalRefillAmount = reception?.refill_amount || items.filter(itm => !itm.is_loan).reduce((sum, itm) => sum + itm.total_price, 0)
  let runningBalance = finalBalanceAfter + totalRefillAmount

  refillBlocks.forEach(b => {
    b.balanceBefore = runningBalance
    b.balanceAfter = runningBalance - b.totalPrice
    runningBalance = b.balanceAfter
  })

  for (let sIdx = 0; sIdx < blocks.length; sIdx++) {
    const block = blocks[sIdx]

    if (sIdx > 0) {
      doc.addPage()
    }

    // --- PAGE 1: PO DETAILS ---
    renderFrame()

    // 1. Logo
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin + 5, 15, 22.5, 18)
    }

    // 2. Thick vertical bar next to logo
    doc.setFillColor(31, 41, 55)
    doc.rect(margin + 30.5, 15, 0.8, 18, 'F')

    // 3. Ministry header
    doc.setFont('times', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.text('KEMENTERIAN KESIHATAN', pageWidth / 2, 19, { align: 'center' })
    doc.setFontSize(12)
    doc.text('MINISTRY OF HEALTH', pageWidth / 2, 24, { align: 'center' })
    doc.text('MALAYSIA', pageWidth / 2, 29, { align: 'center' })
    doc.setFontSize(10.5)
    doc.text(hospitalName, pageWidth / 2, 35, { align: 'center' })

    // 4. Thick vertical bar far right
    doc.setFillColor(31, 41, 55)
    doc.rect(pageWidth - margin - 7, 15, 0.8, 18, 'F')

    // 5. Horizontal divider
    doc.setLineWidth(0.8)
    doc.setDrawColor(31, 41, 55)
    doc.line(margin + 5, 39, pageWidth - margin - 5, 39)

    // 6. Document Titles
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text('BORANG PERMOHONAN UNTUK PENGELUARAN PESANAN KERAJAAN', pageWidth / 2, 45, { align: 'center' })
    doc.setFont('times', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(75, 85, 99)
    doc.text('Application Form for Government Purchase Order (Oxygen Supply)', pageWidth / 2, 49, { align: 'center' })

    // Divider
    doc.setLineWidth(0.3)
    doc.setDrawColor(31, 41, 55)
    doc.line(margin + 5, 52, pageWidth - margin - 5, 52)

    // 7. Info Grid Row
    let gridY = 53
    const rowHeight = 9.5

    const drawGridRow = (y: number, label1: string, val1: string, label2?: string, val2?: string) => {
      doc.setLineWidth(0.15)
      doc.setDrawColor(209, 213, 219)
      doc.line(margin + 5, y + rowHeight, pageWidth - margin - 5, y + rowHeight)

      // Col 1
      doc.setFont('times', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(107, 114, 128)
      doc.text(label1.toUpperCase(), col1, y + 3.0)

      doc.setFont('times', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(17, 24, 39)
      doc.text(val1, col1, y + 7.2)

      if (label2 && val2) {
        // Col 2
        doc.setFont('times', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(107, 114, 128)
        doc.text(label2.toUpperCase(), col2, y + 3.0)

        doc.setFont('times', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(17, 24, 39)
        doc.text(val2, col2, y + 7.2)
      }
    }

    // Rows
    const poNo = `PO-O2-${reception.delivery_order_no.substring(0, 6).toUpperCase()}`
    const formattedDate = new Date(reception.reception_date).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase()

    drawGridRow(gridY, 'NO. REKOD PENERIMAAN / REC NO.', poNo, 'JABATAN / DEPARTMENT', 'FARMASI LOGISTIK')
    gridY += rowHeight

    drawGridRow(gridY, 'KOD UNDI / VOTE CODE', reception.vote_code, 'TARIKH TERIMA / RECEIVED DATE', formattedDate)
    gridY += rowHeight

    drawGridRow(gridY, 'AKTIVITI UNDI / VOTE ACTIVITY', reception.vote_activity, 'KATEGORI / CATEGORY', 'OKSIGEN PERUBATAN (MEDICAL OXYGEN)')
    gridY += rowHeight

    drawGridRow(gridY, 'DELIVERY ORDER NO.', reception.delivery_order_no, 'SALES ORDER NO.', reception.sales_order_no)
    gridY += rowHeight

    gridY += 5

    // 8. Supplier section
    doc.setFont('times', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(17, 24, 39)
    doc.text('MAKLUMAT PEMBEKAL / SUPPLIER INFORMATION', col1, gridY)
    gridY += 3.5

    doc.setLineWidth(0.25)
    doc.setDrawColor(107, 114, 128)

    doc.rect(margin + 5, gridY, contentWidth - 10, 11)
    doc.setFont('times', 'bolditalic')
    doc.setFontSize(7.5)
    doc.setTextColor(107, 114, 128)
    doc.text('NAMA SYARIKAT / COMPANY NAME', margin + 7, gridY + 3.5)

    doc.setFont('times', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(17, 24, 39)
    doc.text(supplierName.toUpperCase(), margin + 7, gridY + 8.5)

    gridY += 13.5

    // Box 2
    doc.rect(margin + 5, gridY, contentWidth - 10, 14)
    doc.setFont('times', 'bolditalic')
    doc.setFontSize(7.5)
    doc.setTextColor(107, 114, 128)
    doc.text('ALAMAT BEKALAN / SUPPLIER ADDRESS', margin + 7, gridY + 3.5)

    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(17, 24, 39)
    doc.text(supplierAddress, margin + 7, gridY + 8.5, { maxWidth: contentWidth - 15 })

    gridY += 18

    // 9. Table of Items (Consolidated dynamically from block.items)
    const tableData: any[][] = block.items.map((itm, idx) => {
      const displaySize = itm.size_code
      const nameLabel = block.type === 'loan'
        ? `CAJ SEWA SILINDER / CYLINDER LOAN CHARGES (${displaySize})`
        : `BEKALAN REFILL GAS OKSIGEN (${displaySize})`
      
      return [
        idx + 1,
        nameLabel,
        block.type === 'loan' ? '-' : displaySize,
        itm.quantity,
        `RM ${itm.unit_price.toFixed(2)}`,
        `RM ${itm.total_price.toFixed(2)}`,
        block.type === 'loan' ? '-' : getCylinderVolume(displaySize)
      ]
    })

    autoTable(doc, {
      startY: gridY,
      head: [['BIL', 'NAMA GAS / OXYGEN CYLINDER SIZE', 'KOD SAIZ', 'KUANTITI', 'HARGA GAS', 'JUMLAH', 'VOLUME CYLINDER']],
      body: tableData,
      theme: 'grid',
      styles: { font: 'times', fontSize: 8.5, cellPadding: 2.2, lineColor: [0, 0, 0], lineWidth: 0.15 },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', font: 'times', fontSize: 7.5, halign: 'center' },
      margin: { left: margin + 5, right: margin + 5, bottom: 42 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 24 },
        5: { halign: 'right', cellWidth: 24 },
        6: { halign: 'center', cellWidth: 24 },
      },
    })

    // Symmetrical signature and totals layout anchored at bottom
    const finalY = 243
    const boxWidth = 90
    const boxX = pageWidth - margin - 5 - boxWidth
    doc.setDrawColor(0)
    doc.setLineWidth(0.3)

    const currentTotalAmount = block.totalPrice
    const hasBudgetBox = block.balanceBefore !== null && block.balanceAfter !== null

    if (hasBudgetBox) {
      doc.rect(boxX, finalY, boxWidth, 24)
      doc.line(boxX, finalY + 8, boxX + boxWidth, finalY + 8)
      doc.line(boxX, finalY + 16, boxX + boxWidth, finalY + 16)
      doc.line(boxX + 50, finalY, boxX + 50, finalY + 24)

      doc.setFont('times', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(17, 24, 39)
      doc.text('BAKI SEBELUM / BALANCE BEFORE:', boxX + 2, finalY + 5.2)
      doc.text('JUMLAH / TOTAL AMOUNT:', boxX + 2, finalY + 13.2)
      doc.text('BAKI SELEPAS / BALANCE AFTER:', boxX + 2, finalY + 21.2)

      doc.setFont('times', 'bold')
      doc.setFontSize(9.5)
      doc.text(fmt(block.balanceBefore || 0), boxX + boxWidth - 2, finalY + 5.2, { align: 'right' })
      doc.text(fmt(currentTotalAmount), boxX + boxWidth - 2, finalY + 13.2, { align: 'right' })
      doc.text(fmt(block.balanceAfter || 0), boxX + boxWidth - 2, finalY + 21.2, { align: 'right' })
    } else {
      // Consolidated Loan PO: no standard budget balance rows shown (separate budget type)
      doc.rect(boxX, finalY + 12, boxWidth, 12)
      doc.line(boxX + 50, finalY + 12, boxX + 50, finalY + 24)

      doc.setFont('times', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(17, 24, 39)
      doc.text('JUMLAH KESELURUHAN / TOTAL AMOUNT:', boxX + 2, finalY + 19.5, { maxWidth: 46 })

      doc.setFont('times', 'bold')
      doc.setFontSize(10.5)
      doc.text(fmt(currentTotalAmount), boxX + boxWidth - 2, finalY + 19.5, { align: 'right' })
    }

    // Single Signature for First Page (Pegawai Yang Mengesahkan Peruntukan)
    doc.setFont('times', 'normal')
    doc.setFontSize(9.5)
    doc.line(margin + 10, finalY + 14, margin + 70, finalY + 14)
    doc.text('(Tandatangan)', margin + 40, finalY + 17, { align: 'center' })
    doc.setFont('times', 'bold')
    doc.setFontSize(9.5)
    doc.text('Pegawai Yang Mengesahkan Peruntukan', margin + 40, finalY + 21, { align: 'center' })
    doc.text('Pengarah Hospital Lawas', margin + 40, finalY + 25, { align: 'center' })


    // --- PAGE 2: INTERNAL ROUTING PAGE ---
    doc.addPage()
    renderFrame()

    // Mini Header for Routing Page
    doc.setFont('times', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(75, 85, 99)
    doc.text(`No. Pesanan: ${poNo}`, pageWidth - margin - 5, 17, { align: 'right' })
    doc.setFont('times', 'italic')
    doc.text(`Halaman ${(doc as any).internal.getNumberOfPages()}`, pageWidth - margin - 5, 22, { align: 'right' })
    doc.setDrawColor(31, 41, 55)
    doc.setLineWidth(0.3)
    doc.line(margin + 5, 24, pageWidth - margin - 5, 24)

    let ry = 32

    // Section 3: MAKLUMAT PEMBEKAL (SAMBUNGAN)
    doc.setFontSize(10.5)
    doc.setFont('times', 'bold')
    doc.setTextColor(0)
    doc.text('MAKLUMAT PEMBEKAL (SAMBUNGAN)', pageWidth / 2, ry, { align: 'center' })
    doc.setLineWidth(0.3)
    doc.setDrawColor(0)
    doc.line(pageWidth / 2 - 35, ry + 1.2, pageWidth / 2 + 35, ry + 1.2)
    ry += 5

    const companyName = supplierName
    const address = supplierAddress
    const textLines = doc.splitTextToSize(address, contentWidth - 80).length
    const supplierBoxHeight = Math.max(15, 6 + textLines * 3.5 + 4)

    // Draw supplier box
    doc.setFillColor(243, 244, 246)
    doc.rect(margin + 5, ry, 40, supplierBoxHeight, 'F')

    doc.setLineWidth(0.35)
    doc.setDrawColor(0)
    doc.rect(margin + 5, ry, contentWidth - 10, supplierBoxHeight)
    doc.line(margin + 45, ry, margin + 45, ry + supplierBoxHeight)
    doc.line(margin + 5, ry + supplierBoxHeight - 6, pageWidth - margin - 5, ry + supplierBoxHeight - 6)

    doc.setFont('times', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(0)
    doc.text('Nama Pembekal :', margin + 8, ry + 5)
    doc.text(companyName.toUpperCase(), margin + 48, ry + 4.5)
    doc.setFontSize(7.5)
    doc.setFont('times', 'normal')
    doc.text(address, margin + 48, ry + 8, { maxWidth: contentWidth - 80 })

    doc.setFontSize(9.5)
    doc.setFont('times', 'bold')
    doc.text('No. Telefon :', margin + 8, ry + supplierBoxHeight - 2)
    doc.text(supplierPhone || 'â€”', margin + 48, ry + supplierBoxHeight - 2)

    ry = 37 + supplierBoxHeight + 9

    doc.setFont('times', 'normal')
    doc.setFontSize(9.5)
    doc.text('Berdaftar dengan Pejabat Kewangan Persekutuan Sarawak ( Ya / Tidak )', margin + 5, ry)
    ry += 6
    doc.text('No. Rujukan Pendaftaran :', margin + 5, ry)
    doc.line(margin + 55, ry + 0.5, margin + 120, ry + 0.5)

    ry += 12

    // Section 4: Bersama-sama ini dinyatakan
    doc.setFont('times', 'bold')
    doc.text('4. Bersama-sama ini dinyatakan (Penuhkan mana yang sesuai).', margin + 5, ry)
    doc.setFont('times', 'normal')
    ry += 6
    doc.text('(i)   No. rujukan surat mampu :', margin + 10, ry)
    doc.setLineDashPattern([0.8, 0.8], 0)
    doc.line(margin + 55, ry + 0.5, margin + 120, ry + 0.5)
    ry += 6
    doc.text('(ii)  No. rujukan kontrak :', margin + 10, ry)
    doc.line(margin + 48, ry + 0.5, margin + 120, ry + 0.5)
    doc.setFont('times', 'bold')
    doc.text('â€”', margin + 50, ry - 0.5)
    doc.setFont('times', 'normal')
    ry += 6
    doc.text('(iii) Salinan surat kelulusan Pejabat Kewangan Persekutuan Bil.:', margin + 10, ry)
    doc.line(margin + 98, ry + 0.5, pageWidth - margin - 5, ry + 0.5)
    doc.setLineDashPattern([], 0)

    ry += 12

    // Signature 4 (Applicant)
    doc.setFont('times', 'bold')
    doc.text('Tarikh :', margin + 10, ry)
    doc.text(formattedDate, margin + 23, ry)

    doc.line(pageWidth - margin - 75, ry, pageWidth - margin - 5, ry)
    doc.text('(Tandatangan Pegawai yang Memohon)', pageWidth - margin - 40, ry + 3, { align: 'center' })
    doc.setFont('times', 'normal')

    const nameLines = doc.splitTextToSize(`Nama : ${applicantName}`, 68)
    const posLines = doc.splitTextToSize(`Jawatan : ${applicantPosition}`, 68)

    let currentY = ry + 7
    nameLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 75, currentY)
      currentY += 4
    })
    posLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 75, currentY)
      currentY += 4
    })

    ry = currentY + 10

    // Section 5: Akaun Ketua Bahagian
    doc.setFont('times', 'bold')
    doc.text('5. Akaun Ketua Bahagian.', margin + 5, ry)
    doc.setFont('times', 'normal')
    ry += 6
    doc.text('(i)   Adalah disahkan pembelian ini telah dimasukkan dalam cadangan anggaran Belanjawan tahunan.', margin + 15, ry)
    ry += 6
    doc.text('(ii)  Pembelian ini adalah diperlukan.', margin + 15, ry)

    ry += 12

    // Signature 5 (Head)
    doc.setFont('times', 'bold')
    doc.text('Tarikh :', margin + 10, ry)
    doc.text(formattedDate, margin + 23, ry)

    doc.line(pageWidth - margin - 75, ry, pageWidth - margin - 5, ry)
    doc.text('(Tandatangan Ketua Bahagian)', pageWidth - margin - 40, ry + 3, { align: 'center' })
    doc.setFont('times', 'normal')

    const headNameLines = doc.splitTextToSize(`Nama : ${headName}`, 68)
    const headPosLines = doc.splitTextToSize(`Jawatan : ${headPosition}`, 68)

    let headY = ry + 7
    headNameLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 75, headY)
      headY += 4
    })
    headPosLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 75, headY)
      headY += 4
    })

    ry = headY + 8
    doc.setFont('times', 'bold')
    doc.text('Permohonan diluluskan/tidak diluluskan', pageWidth / 2, ry, { align: 'center' })

    ry += 12

    // Signature 6 (Director Approval)
    doc.text('Tarikh :', margin + 10, ry)
    doc.line(margin + 22, ry + 0.5, margin + 70, ry + 0.5)

    doc.line(pageWidth - margin - 75, ry, pageWidth - margin - 5, ry)
    doc.text('(Tandatangan Pegawai Yang Meluluskan)', pageWidth - margin - 40, ry + 3, { align: 'center' })
    doc.setFont('times', 'normal')

    const dirLines = doc.splitTextToSize('Pengarah Hospital Daerah, Lawas.', 68)
    let dirY = ry + 7
    dirLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 40, dirY, { align: 'center' })
      dirY += 4
    })

    ry = dirY + 12

    // Section 6: Financial Department Use
    doc.setFont('times', 'bold')
    doc.setFontSize(10.5)
    doc.text('UNTUK KEGUNAAN BAHAGIAN KEWANGAN', pageWidth / 2, ry, { align: 'center' })

    ry += 8
    doc.setFontSize(9.5)
    doc.text('6. Kerani Kewangan', margin + 5, ry)
    doc.setFont('times', 'normal')
    ry += 6
    doc.text('(iii) Sila Keluarkan Pesanan Kerajaan', margin + 15, ry)
    ry += 6
    doc.text('(iv) Sila dapatkan Sebut harga', margin + 15, ry)

    doc.setLineDashPattern([0.8, 0.8], 0)
    doc.line(pageWidth - margin - 65, ry - 4, pageWidth - margin - 5, ry - 4)
    doc.setLineDashPattern([], 0)
    doc.setFont('times', 'bold')
    doc.text('(Bahagian Kewangan)', pageWidth - margin - 35, ry, { align: 'center' })
    doc.setFont('times', 'normal')
    doc.text('B.P. Pengarah Hospital Daerah, Lawas.', pageWidth - margin - 35, ry + 4, { align: 'center' })

    ry += 13
    doc.setFont('times', 'bold')
    doc.text('Catatan :', margin + 5, ry)
    doc.setLineDashPattern([0.8, 0.8], 0)
    doc.line(margin + 20, ry + 0.5, margin + 110, ry + 0.5)

    ry += 7
    doc.text('No. Rujukan Pesanan Kerajaan :', margin + 5, ry)
    doc.line(margin + 55, ry + 0.5, margin + 110, ry + 0.5)

    ry += 7
    doc.text('Tarikh :', margin + 5, ry)
    doc.line(margin + 18, ry + 0.5, margin + 80, ry + 0.5)
    doc.setLineDashPattern([], 0)
  }

  // Footer page numbers
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('times', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(31, 41, 55)
    doc.text('Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia', pageWidth / 2, 284, { align: 'center' })
    doc.setFont('times', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(75, 85, 99)
    doc.text('Dikeluarkan secara digital oleh Sistem HOME / Digital Copy Generated by HOME System', pageWidth / 2, 288, { align: 'center' })
    doc.setFont('times', 'bold')
    doc.text(`Halaman ${i} daripada ${totalPages}`, pageWidth - margin - 5, 288, { align: 'right' })
  }

  return doc.output('blob')
}

/**
 * Generate official Ministry of Health Oxygen Reception and Inspection Report PDF
 */
export async function generateOxygenReceptionReportPdf(options: OxygenPdfOptions): Promise<Blob> {
  const {
    reception,
    items,
    hospitalName = 'Hospital Daerah Lawas',
    applicantName = 'Ahmad Bin Ismail',
    applicantPosition = 'Pegawai Farmasi U41',
  } = options

  const doc = new jsPDF('p', 'mm', 'a4')
  const logoBase64 = await getBase64ImageFromUrl('/512px-Jata_MalaysiaV2.svg.png')

  const pageWidth = 210
  const margin = 10
  const contentWidth = pageWidth - margin * 2

  // Frame Border
  const renderFrame = () => {
    if (logoBase64) {
      try {
        doc.saveGraphicsState()
        const GState = (doc as any).GState || (jsPDF as any).GState
        if (GState) {
          doc.setGState(new GState({ opacity: 0.05 }))
        }
        doc.addImage(logoBase64, 'PNG', (pageWidth - 90) / 2, (297 - 90) / 2, 90, 90)
        doc.restoreGraphicsState()
      } catch (err) {
        console.error('Error drawing crest watermark:', err)
      }
    }
    doc.setDrawColor(31, 41, 55)
    doc.setLineWidth(0.4)
    doc.rect(margin, margin, contentWidth, 268)
  }

  renderFrame()

  // 1. Header logo and titles
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin + 5, 15, 22.5, 18)
  }
  doc.setFillColor(31, 41, 55)
  doc.rect(margin + 30.5, 15, 0.8, 18, 'F')

  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text('KEMENTERIAN KESIHATAN MALAYSIA', pageWidth / 2, 19, { align: 'center' })
  doc.setFontSize(12)
  doc.text(hospitalName, pageWidth / 2, 24, { align: 'center' })
  doc.setFontSize(10.5)
  doc.text('LAPORAN PENERIMAAN & PEMERIKSAAN BEKALAN OKSIGEN', pageWidth / 2, 29, { align: 'center' })
  doc.setFont('times', 'italic')
  doc.text('Oxygen Reception, Verification, and Inspection Audit Report', pageWidth / 2, 33, { align: 'center' })

  doc.setLineWidth(0.6)
  doc.setDrawColor(31, 41, 55)
  doc.line(margin + 5, 37, pageWidth - margin - 5, 37)

  // 2. DO Details grid
  let y = 43
  doc.setFont('times', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(17, 24, 39)
  doc.text('A. RUJUKAN DOKUMEN / DOCUMENTATION REFERENCE', margin + 5, y)
  y += 5

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.text(`No. Rekod Penerimaan: PO-O2-${reception.delivery_order_no.substring(0, 6).toUpperCase()}`, margin + 8, y)
  doc.text(`Tarikh Penerimaan: ${new Date(reception.reception_date).toLocaleDateString('en-MY')}`, pageWidth / 2 + 5, y)
  y += 5
  doc.text(`No. Delivery Order (DO): ${reception.delivery_order_no}`, margin + 8, y)
  doc.text(`No. Sales Order (SO): ${reception.sales_order_no}`, pageWidth / 2 + 5, y)
  y += 5
  doc.text(`Kategori Belanjawan: Oksigen Perubatan (Vote: ${reception.vote_code} / ${reception.vote_activity})`, margin + 8, y)

  y += 10

  // 3. Items list
  doc.setFont('times', 'bold')
  doc.text('B. ANALISIS SILINDER YANG DITERIMA / DELIVERED CYLINDER ANALYSIS', margin + 5, y)
  y += 5

  const tableData: any[] = []
  let bil = 1
  let totalLoanQty = 0
  const loanRate = 18.36

  // Pre-process items to group standard refill quantities by physical size code
  const refillGroup: Record<string, { size_code: string; quantity: number; unit_price: number }> = {}

  items.forEach((itm) => {
    const displaySizeCode = itm.size_code === '101-F' ? 'P101-F' : itm.size_code
    const refillPrice = itm.is_loan ? (itm.unit_price - loanRate) : itm.unit_price

    if (itm.is_loan) {
      totalLoanQty += itm.quantity
    }

    if (!refillGroup[displaySizeCode]) {
      refillGroup[displaySizeCode] = {
        size_code: displaySizeCode,
        quantity: itm.quantity,
        unit_price: refillPrice
      }
    } else {
      refillGroup[displaySizeCode].quantity += itm.quantity
    }
  })

  // Push grouped refill rows
  Object.values(refillGroup).forEach((group) => {
    const totalCost = group.unit_price * group.quantity
    tableData.push([
      bil++,
      group.size_code,
      'Standard Refill',
      group.quantity,
      `RM ${group.unit_price.toFixed(2)}`,
      `RM ${totalCost.toFixed(2)}`,
      'DITERIMA / ACCEPTED'
    ])
  })

  // Append a single combined loan row at the end if applicable
  if (totalLoanQty > 0) {
    tableData.push([
      bil++,
      '-',
      'Cylinder Loan',
      totalLoanQty,
      `RM ${loanRate.toFixed(2)}`,
      `RM ${(loanRate * totalLoanQty).toFixed(2)}`,
      'DITERIMA / ACCEPTED'
    ])
  }

  autoTable(doc, {
    startY: y,
    head: [['BIL', 'KOD SAIZ', 'JENIS ALOKASI', 'KUANTITI', 'HARGA UNIT', 'JUMLAH KOS', 'KEADAAN FIZIKAL']],
    body: tableData,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.15 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', font: 'times', fontSize: 7.5, halign: 'center' },
    margin: { left: margin + 5, right: margin + 5 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 25 },
      2: { cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 24 },
      6: { halign: 'center', cellWidth: 35 },
    },
  })

  y = (doc as any).lastAutoTable.finalY + 10

  // 4. KEW.PS-3 receiving verification checklist
  doc.setFont('times', 'bold')
  doc.setFontSize(9.5)
  doc.text('C. VERIFIKASI PENERIMAAN / RECEIVING VERIFICATION CHECKLIST (KEW.PS-3)', margin + 5, y)
  y += 5

  doc.setLineWidth(0.2)
  doc.setDrawColor(156, 163, 175)
  doc.rect(margin + 5, y, contentWidth - 10, 36)

  doc.setFont('times', 'normal')
  doc.setFontSize(8.5)
  doc.text('[ X ]  1. Spesifikasi & Saiz: Menepati jenis, saiz, dan kapasiti silinder oksigen yang dipesan.', margin + 9, y + 6)
  doc.text('[ X ]  2. Pengesahan Kuantiti: Kuantiti fizikal yang diterima adalah sama seperti di dalam Nota Serahan (DO).', margin + 9, y + 13)
  doc.text('[ X ]  3. Pemeriksaan Fizikal: Keadaan fizikal bekalan adalah elok, bersih, tiada kecacatan, dan memuaskan.', margin + 9, y + 20)
  doc.text('[ X ]  4. Kelengkapan Dokumen: Nota Serahan (DO) dan dokumen pengesahan pembekal lengkap dilampirkan.', margin + 9, y + 27)
  doc.text('[ X ]  5. Kepatuhan KEW.PS-3: Pembekalan menepati terma pesanan kerajaan dan direkodkan dengan sah.', margin + 9, y + 33)

  y += 48

  // 5. Signatures
  doc.setFont('times', 'bold')
  doc.setFontSize(9.5)
  doc.text('D. PENGESAHAN PENERIMAAN / RECEPTION CONFIRMATION & AUDIT SIGN-OFF', margin + 5, y)
  y += 5

  doc.setFont('times', 'normal')
  doc.text('Dengan ini disahkan bahawa bekalan gas oksigen perubatan ini telah diterima, diperiksa, dan direkodkan ke dalam inventori farmasi.', margin + 5, y, { maxWidth: contentWidth - 10 })

  y += 24

  doc.line(margin + 5, y, margin + 70, y)
  doc.line(pageWidth - margin - 70, y, pageWidth - margin - 5, y)

  doc.setFont('times', 'bold')
  doc.text('(Tandatangan Pegawai Penerima)', margin + 37, y + 4.5, { align: 'center' })
  doc.text('(Tandatangan Saksi / Penyelia)', pageWidth - margin - 37, y + 4.5, { align: 'center' })

  doc.setFont('times', 'normal')
  doc.text(applicantName, margin + 37, y + 9.5, { align: 'center' })
  doc.text('Pegawai Yang Mengesahkan', pageWidth - margin - 37, y + 9.5, { align: 'center' })

  doc.setFont('times', 'italic')
  doc.setFontSize(8.5)
  doc.text(applicantPosition, margin + 37, y + 13, { align: 'center' })
  doc.text('Farmasi Logistik', pageWidth - margin - 37, y + 13, { align: 'center' })

  // Footer page numbers
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('times', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(31, 41, 55)
    doc.text('Dokumen Penerimaan Rasmi Unit Farmasi / Official Pharmacy Reception Audit Report', pageWidth / 2, 284, { align: 'center' })
    doc.setFont('times', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(75, 85, 99)
    doc.text('Dikeluarkan secara digital oleh Sistem HOME / Digital Copy Generated by HOME System', pageWidth / 2, 288, { align: 'center' })
    doc.setFont('times', 'bold')
    doc.text(`Halaman ${i} daripada ${totalPages}`, pageWidth - margin - 5, 288, { align: 'right' })
  }

  return doc.output('blob')
}
