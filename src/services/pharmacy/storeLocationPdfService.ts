import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { JATA_NEGARA_BASE64 } from '@/modules/mytransporter/pages/jataNegaraBase64'
import type { StoreLocationWithOccupancy } from '@/types/pharmacy'

export interface StoreLocationPdfItem {
  id?: string
  drug_code?: string
  item_code?: string
  sku?: string
  code?: string
  drug_name?: string
  item_name?: string
  name?: string
  generic_name?: string
  procurement_vote?: string
  skim?: string
  scheme?: string
  category_name?: string
  location?: string
  storage_conditions?: string
  sub_location?: string
  cabinet_rack?: string
  shelf_level?: string
  quantity?: number
  current_stock?: number
  unit_of_measure?: string
  uom?: string
  [key: string]: any
}

export interface StoreLocationPdfOptions {
  hospitalName?: string
  department?: string
  preparedBy?: string
  approvedBy?: string
  referenceNo?: string
  subLocationsList?: Array<{ name: string; code: string; type: string }>
}

/**
 * Strips redundant store code and store name prefixes from location strings for a clean PDF display
 */
export function cleanLocationDisplay(rawLocation: string, storeName: string = '', locationCode: string = ''): string {
  if (!rawLocation || rawLocation === '-') return 'Lokasi Utama'

  let cleaned = rawLocation.trim()

  // 1. Remove bracketed location codes e.g. [LOG-SL-001] or [LOG-SL(-001]
  cleaned = cleaned.replace(/^\[[^\]]+\]\s*/, '')

  // 2. Remove raw locationCode prefix e.g. "LOG-SL-001 - " or "LOG-SL-001 > "
  if (locationCode) {
    const escCode = locationCode.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    cleaned = cleaned.replace(new RegExp(`^${escCode}\\s*(>|-)?\\s*`, 'i'), '')
  }

  // 3. Remove storeName prefix e.g. "Stor Logistik (Drug) > "
  if (storeName) {
    const escStore = storeName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    cleaned = cleaned.replace(new RegExp(`^${escStore}\\s*>\\s*`, 'i'), '')
    if (cleaned.trim().toLowerCase() === storeName.trim().toLowerCase()) {
      return 'Lokasi Utama'
    }
  }

  cleaned = cleaned.trim()
  if (!cleaned || cleaned === '>') return 'Lokasi Utama'

  return cleaned
}

export function generateStoreLocationPdf(
  location: StoreLocationWithOccupancy,
  items: StoreLocationPdfItem[],
  opts: StoreLocationPdfOptions = {}
) {
  const {
    hospitalName = 'HOSPITAL LAWAS',
    department = 'Jabatan Farmasi / Unit Logistik Stor',
    preparedBy = 'Pegawai Farmasi / Penolong Pegawai Farmasi',
    approvedBy = 'Ketua Jabatan / Pegawai Farmasi Y/M',
    referenceNo = `KKM/HL/STOR/${location.location_code || 'LOG'}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  } = opts

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // ─── Watermark helper ──────────────────────────────────────────────────────
  const drawWatermark = () => {
    const wW = 100
    const wH = 80
    const wx = (pageW - wW) / 2
    const wy = (pageH - wH) / 2
    doc.saveGraphicsState()
    try {
      const gState = new (doc as any).GState({ opacity: 0.04 })
      doc.setGState(gState)
    } catch (_) {}
    doc.addImage(JATA_NEGARA_BASE64, 'PNG', wx, wy, wW, wH)
    doc.restoreGraphicsState()
  }

  // ─── Header helper (called once per page) ──────────────────────────────────
  const drawHeader = () => {
    drawWatermark()

    // Jata Negara crest
    doc.addImage(JATA_NEGARA_BASE64, 'PNG', 14, 8, 20, 16)

    // Ministry name block
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 30, 70)
    doc.text('KEMENTERIAN KESIHATAN MALAYSIA', 38, 13)

    doc.setFontSize(9.5)
    doc.text(hospitalName + ', SARAWAK', 38, 18.5)

    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(80, 80, 80)
    doc.text(
      'Jalan Hospital, 98850 Lawas, Sarawak  |  Tel: 085-283122  |  Faks: 085-283123  |  hlawas@moh.gov.my',
      38, 23.5
    )

    // Double-rule letterhead divider
    doc.setDrawColor(15, 30, 70)
    doc.setLineWidth(0.8)
    doc.line(14, 27.5, pageW - 14, 27.5)
    doc.setLineWidth(0.3)
    doc.line(14, 29, pageW - 14, 29)

    // MOH logo band — thin colour bar
    doc.setFillColor(0, 91, 150)
    doc.rect(14, 27.5, pageW - 28, 1.5, 'F')
  }

  // ─── Page 1 Header ────────────────────────────────────────────────────────
  drawHeader()

  // Reference meta block
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(60, 60, 60)
  const now = new Date()
  const dateStr = now.toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })

  doc.text(`Rujukan: ${referenceNo}`, 14, 35)
  doc.text(`Tarikh Cetakan: ${dateStr} (${timeStr})`, 14, 39.5)
  doc.text(`Unit/Jabatan: ${department}`, 14, 44)

  doc.setFont('Helvetica', 'bold')
  doc.setTextColor(180, 0, 0)
  doc.text('RASMI / SULIT', pageW - 14, 35, { align: 'right' })
  doc.setTextColor(60, 60, 60)

  // ─── Document Title Block ─────────────────────────────────────────────────
  doc.setFillColor(0, 91, 150)
  doc.roundedRect(14, 48, pageW - 28, 12, 1.5, 1.5, 'F')

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('LAPORAN INVENTORI & PENEMPATAN LOKASI STOR', pageW / 2, 55.5, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // ─── Store Location Detail Box ───────────────────────────────────────────
  const storeBoxY = 63
  doc.setFillColor(245, 249, 255)
  doc.setDrawColor(0, 91, 150)
  doc.setLineWidth(0.3)
  doc.roundedRect(14, storeBoxY, pageW - 28, 26, 1.5, 1.5, 'FD')

  // Column 1 Info
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(0, 60, 120)
  doc.text('MAKLUMAT LOKASI STOR:', 18, storeBoxY + 5.5)

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(30, 30, 30)

  doc.setFont('Helvetica', 'bold')
  doc.text('Nama Stor Utama:', 18, storeBoxY + 11)
  doc.setFont('Helvetica', 'normal')
  doc.text(location.store_name || '-', 48, storeBoxY + 11)

  doc.setFont('Helvetica', 'bold')
  doc.text('Kod Lokasi:', 18, storeBoxY + 16)
  doc.setFont('Helvetica', 'normal')
  doc.text(location.location_code || '-', 48, storeBoxY + 16)

  doc.setFont('Helvetica', 'bold')
  doc.text('Hirarki/Susunan:', 18, storeBoxY + 21)
  doc.setFont('Helvetica', 'normal')
  const hierarchyStr = [location.store_name, location.cabinet_rack, location.shelf_level]
    .filter(p => p && p !== '-')
    .join(' > ')
  doc.text(hierarchyStr || location.store_name, 48, storeBoxY + 21)

  // Column 2 Info
  const col2X = 112
  doc.setFont('Helvetica', 'bold')
  doc.text('Kategori Bekalan:', col2X, storeBoxY + 11)
  doc.setFont('Helvetica', 'normal')
  const typeText = location.location_type === 'drug'
    ? 'Bekalan Ubat Sahaja'
    : location.location_type === 'non_drug'
    ? 'Bukan Ubat Sahaja'
    : 'Ubat & Bukan Ubat'
  doc.text(typeText, col2X + 28, storeBoxY + 11)

  doc.setFont('Helvetica', 'bold')
  doc.text('Syarat Simpanan:', col2X, storeBoxY + 16)
  doc.setFont('Helvetica', 'normal')
  const condText = location.storage_condition === 'cold_2_8c'
    ? 'Peti Sejuk (2-8°C)'
    : location.storage_condition === 'controlled'
    ? 'Bilik Kawalan DDA'
    : 'Suhu Bilik (Ambient)'
  doc.text(condText, col2X + 28, storeBoxY + 16)

  doc.setFont('Helvetica', 'bold')
  doc.text('Jumlah Item:', col2X, storeBoxY + 21)
  doc.setFont('Helvetica', 'bold')
  doc.setTextColor(0, 100, 0)
  doc.text(`${items.length} Item Berdaftar`, col2X + 28, storeBoxY + 21)

  // ─── Main Inventory Items Table ───────────────────────────────────────────
  const tableStartY = storeBoxY + 30

  const tableHead = [[
    { content: 'BIL.', styles: { halign: 'center' as const, cellWidth: 10 } },
    { content: 'KOD UBAT / ITEM', styles: { cellWidth: 38 } },
    { content: 'NAMA UBAT / BEKALAN', styles: { cellWidth: 70 } },
    { content: 'SKIM', styles: { halign: 'center' as const, cellWidth: 26 } },
    { content: 'LOKASI / SUB-LOKASI FIZIKAL', styles: { cellWidth: 38 } },
  ]]

  const tableBody = items.map((item, idx) => {
    // 1. Drug Code
    const code = item.drug_code || item.item_code || item.sku || item.code || '-'

    // 2. Drug Name
    const name = item.drug_name || item.item_name || item.name || '-'
    const generic = item.generic_name && item.generic_name.toLowerCase() !== name.toLowerCase()
      ? `\n(${item.generic_name})`
      : ''
    const fullName = `${name}${generic}`

    // 3. Skim (Formulary / Procurement Scheme)
    let skim = item.procurement_vote || item.skim || item.scheme || item.category_name || 'APPL'
    skim = String(skim).toUpperCase()
    if (skim === 'UNDEFINED' || skim === 'NULL' || !skim) skim = 'APPL'

    // 4. Physical Location (Cleaned: remove store code and store name prefix to avoid repetition)
    let rawLocStr = item.location || item.storage_conditions || item.sub_location || ''
    let locStr = cleanLocationDisplay(rawLocStr, location.store_name, location.location_code)

    return [
      { content: String(idx + 1), styles: { halign: 'center' as const } },
      { content: code, styles: { fontStyle: 'bold' as const } },
      { content: fullName },
      { content: skim, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
      { content: locStr },
    ]
  })

  // Fallback row if no items found
  if (tableBody.length === 0) {
    tableBody.push([
      { content: '-', styles: { halign: 'center' as const } },
      { content: '-', styles: { fontStyle: 'normal' as const } },
      { content: 'Tiada rekod item inventori tersimpan di lokasi ini.', styles: { fontStyle: 'italic' as const } },
      { content: '-', styles: { halign: 'center' as const } },
      { content: 'Lokasi Utama' },
    ] as any)
  }

  let finalY = tableStartY

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      font: 'Helvetica',
      cellPadding: { top: 2.5, right: 2.5, bottom: 2.5, left: 2.5 },
      overflow: 'linebreak',
      valign: 'middle',
      textColor: [20, 20, 20],
    },
    headStyles: {
      fillColor: [0, 91, 150],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      lineWidth: 0,
    },
    alternateRowStyles: {
      fillColor: [248, 251, 255],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 38, fontStyle: 'bold', textColor: [0, 70, 140] },
      2: { cellWidth: 70 },
      3: { halign: 'center', cellWidth: 26, fontStyle: 'bold', textColor: [100, 40, 0] },
      4: { cellWidth: 38 },
    },
    didDrawPage: (data: any) => {
      if (data.pageNumber > 1) {
        drawHeader()
        doc.setFont('Helvetica', 'italic')
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.text(`Inventori ${location.store_name} (${location.location_code}) — sambungan`, 14, 33)
        doc.setTextColor(0, 0, 0)
      }
      finalY = (data.cursor as any)?.y ?? finalY
    },
    margin: { top: 38, left: 14, right: 14, bottom: 18 },
    tableWidth: 'auto',
  })

  // ─── Certification & Signatures Block ─────────────────────────────────────
  const sigY = Math.min((doc as any).lastAutoTable.finalY + 8, pageH - 65)
  const needsNewPage = sigY + 50 > pageH - 14

  if (needsNewPage) {
    doc.addPage()
    drawHeader()
    doc.setFont('Helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(`Inventori ${location.store_name} — Halaman Pengesahan`, 14, 33)
    doc.setTextColor(0, 0, 0)
  }

  const sigStartY = needsNewPage ? 40 : sigY

  // Certification box
  doc.setFillColor(255, 251, 235)
  doc.setDrawColor(200, 150, 0)
  doc.setLineWidth(0.3)
  const certSentence =
    `Saya mengesahkan bahawa senarai fizikal ubat dan bekalan di lokasi stor "${location.store_name}" ` +
    `(${location.location_code}) telah disemak dan didaftarkan selaras dengan tatacara pengurusan stor ` +
    `Hospital Lawas. Sebarang perubahan kedudukan item hendaklah dikemas kini dalam Sistem Pengurusan Lokasi Stor.`
  const certLines = doc.splitTextToSize(certSentence, pageW - 28)
  const certH = certLines.length * 3.6 + 6
  doc.roundedRect(14, sigStartY, pageW - 28, certH, 1.5, 1.5, 'FD')

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(80, 60, 0)
  doc.text(certLines, 18, sigStartY + 4.5)
  doc.setTextColor(0, 0, 0)

  // Signature Boxes
  const sigBoxY = sigStartY + certH + 5
  const colW = (pageW - 28) / 2 - 4

  const drawSigBox = (x: number, y: number, w: number, label: string, name: string, title: string) => {
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, w, 34, 1.5, 1.5, 'S')

    // Signature line
    doc.setDrawColor(120, 120, 120)
    doc.setLineWidth(0.4)
    doc.line(x + 6, y + 19, x + w - 6, y + 19)

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    doc.text(label, x + w / 2, y + 5.5, { align: 'center' })

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(name.toUpperCase(), x + w / 2, y + 23.5, { align: 'center' })

    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(80, 80, 80)
    doc.text(title, x + w / 2, y + 28, { align: 'center' })
    doc.text(hospitalName, x + w / 2, y + 32, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }

  drawSigBox(14, sigBoxY, colW, 'DISEDIAKAN OLEH (PENYELIA STOR)', preparedBy, 'Pegawai Farmasi / Storekeeper')
  drawSigBox(14 + colW + 8, sigBoxY, colW, 'DISAHKAN OLEH (KETUA UNIT)', approvedBy, 'Ketua Unit Stor / Pegawai Farmasi Y/M')

  // ─── Footer with Page Numbers ─────────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages()
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg)
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    doc.setFillColor(255, 255, 255)
    doc.rect(0, pageH - 12, pageW, 12, 'F')
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.2)
    doc.line(14, pageH - 10, pageW - 14, pageH - 10)
    doc.text(
      `Halaman ${pg} daripada ${totalPages}  |  SULIT — Pengurusan Lokasi Stor Hospital Lawas`,
      pageW / 2,
      pageH - 5.5,
      { align: 'center' }
    )
  }

  // ─── Save File ────────────────────────────────────────────────────────────
  const cleanCode = (location.location_code || 'STOR').replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = `Inventori_Lokasi_${cleanCode}_${now.getFullYear()}.pdf`
  doc.save(fileName)
}
