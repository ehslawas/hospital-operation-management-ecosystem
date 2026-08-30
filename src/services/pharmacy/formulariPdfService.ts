import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { JATA_NEGARA_BASE64 } from '@/modules/mytransporter/pages/jataNegaraBase64'
import { getDrugTherapeuticCategory, getDrugPrescriberCategory } from '@/lib/drugCategorizer'
import { useAuthStore } from '@/stores/authStore'

export interface FormulariDrugItem {
  id?: string
  drug_code?: string
  item_code?: string
  sku?: string
  drug_name?: string
  generic_name?: string
  dosage_form?: string
  uom?: string
  strength?: string
  price?: number
  unit_price?: number
  category_name?: string
  category_id?: string
  procurement_vote?: string
  is_active?: boolean
  [key: string]: any
}

export interface FormulariPdfOptions {
  skim?: string
  preparedBy?: string
  preparedByTitle?: string
  checkedBy?: string
  checkedByTitle?: string
  approvedBy?: string
  approvedByTitle?: string
  hospitalName?: string
  department?: string
  referenceNo?: string
  isNonDrug?: boolean
}

export function generateFormulariPdf(
  items: FormulariDrugItem[],
  opts: FormulariPdfOptions = {}
) {
  const currentUser = useAuthStore.getState().user
  const {
    skim = 'SEMUA',
    preparedBy = currentUser?.full_name || (currentUser as any)?.name || 'Pegawai Farmasi',
    preparedByTitle = currentUser?.jawatan || (opts.isNonDrug ? 'Pegawai Farmasi / Penolong Pegawai Farmasi' : 'Pegawai Farmasi (S41/S44/S48)'),
    checkedBy = 'Ketua Unit Farmasi',
    checkedByTitle = 'Ketua Unit Farmasi',
    approvedBy = 'Pengarah Hospital',
    approvedByTitle = 'Pengarah Hospital',
    hospitalName = currentUser?.hospital?.hospital_name || (currentUser?.hospital as any)?.name || 'HOSPITAL LAWAS',
    department = opts.isNonDrug ? 'Stor Integrasi Bukan Ubat' : 'Jabatan Farmasi',
    referenceNo = `KKM/HL/FARM/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    isNonDrug = false,
  } = opts

  const themeColor: [number, number, number] = isNonDrug ? [16, 124, 65] : [0, 91, 150]

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // ─── Watermark helper ──────────────────────────────────────────────────────
  const drawWatermark = () => {
    const wW = 120
    const wH = 95
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
    doc.addImage(JATA_NEGARA_BASE64, 'PNG', 14, 8, 22, 18)

    // Ministry name block
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 30, 70)
    doc.text('KEMENTERIAN KESIHATAN MALAYSIA', 40, 13.5)

    doc.setFontSize(9.5)
    doc.text(hospitalName + ', SARAWAK', 40, 19.5)

    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(80, 80, 80)
    doc.text(
      'Jalan Hospital, 98850 Lawas, Sarawak  |  Tel: 085 283 781 (ext 206)  |  farmasi.hlawas@moh.gov.my',
      40, 25
    )

    // Double-rule letterhead divider
    doc.setDrawColor(15, 30, 70)
    doc.setLineWidth(0.9)
    doc.line(14, 29.5, pageW - 14, 29.5)
    doc.setLineWidth(0.3)
    doc.line(14, 31, pageW - 14, 31)

    // MOH logo band — thin colour bar
    doc.setFillColor(themeColor[0], themeColor[1], themeColor[2])
    doc.rect(14, 32, pageW - 28, 1.5, 'F')
  }

  // ─── Initial Page Setup ───────────────────────────────────────────────────
  drawHeader()

  const now = new Date()
  const currentMonthName = now.toLocaleString('ms-MY', { month: 'long' })
  const currentDateFormatted = `${now.getDate()} ${currentMonthName} ${now.getFullYear()}`
  const currentTimeFormatted = now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false })

  // Metadata block (Rujukan, Tarikh, Jabatan)
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text(`Rujukan: ${referenceNo}`, 14, 40)
  doc.setFont('Helvetica', 'normal')
  doc.text(`Tarikh: ${currentDateFormatted} | Masa: ${currentTimeFormatted} PTG`, 14, 44.5)
  doc.text(`Jabatan: ${department}`, 14, 49)

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(180, 0, 0)
  doc.text('RASMI / SULIT', pageW - 14, 38, { align: 'right' })
  doc.setTextColor(60, 60, 60)

  // ─── Document Title block ─────────────────────────────────────────────────
  doc.setFillColor(themeColor[0], themeColor[1], themeColor[2])
  doc.roundedRect(14, 53, pageW - 28, 14, 2, 2, 'F')

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text(isNonDrug ? 'SENARAI INVENTORI BUKAN UBAT' : 'FORMULARI UBAT HOSPITAL', pageW / 2, 62.5, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // ─── Preamble paragraph ───────────────────────────────────────────────────
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(7.8)
  doc.setTextColor(40, 40, 40)
  const preamble = isNonDrug
    ? `Senarai Inventori Bukan Ubat ini disediakan oleh ${department}, ${hospitalName} Sarawak bagi tujuan ` +
      `pemantauan stok, perolehan, dan pengagihan barangan bukan ubat di dalam premis hospital ini.`
    : `Senarai Formulari Ubat ini disediakan oleh ${department}, ${hospitalName} Sarawak selaras dengan ` +
      `Dasar Ubat Negara (DUN) dan Formulari Ubat KKM edisi semasa. Hanya ubat-ubatan yang tersenarai ` +
      `dalam dokumen ini dibenarkan untuk dipreskripsi, diperolehi dan dibekalkan di dalam premis hospital ` +
      `ini. Sebarang penambahan atau pemadaman item hendaklah mendapat kelulusan Jawatankuasa Farmasi & ` +
      `Terapeutik (JFT) Hospital sebelum berkuat kuasa.`
  const preambleLines = doc.splitTextToSize(preamble, pageW - 28)
  doc.text(preambleLines, 14, 72)

  // ─── Summary box ──────────────────────────────────────────────────────────
  const summaryY = 72 + preambleLines.length * 3.8 + 2
  doc.setFillColor(isNonDrug ? 240 : 240, isNonDrug ? 253 : 246, isNonDrug ? 244 : 255)
  doc.setDrawColor(themeColor[0], themeColor[1], themeColor[2])
  doc.setLineWidth(0.3)
  doc.roundedRect(14, summaryY, pageW - 28, 12, 1.5, 1.5, 'FD')

  const activeCount = items.filter(i => i.is_active !== false).length
  const totalItems = items.length

  const getVote = (i: FormulariDrugItem) => {
    const raw = (i.procurement_vote || i.scheme || i.skim || '').toString().toLowerCase().trim()
    if (raw === 'cc') return 'CC'
    if (raw === 'lp') return 'LP'
    if (raw === 'dp') return 'DP'
    if (raw === 'appl') return 'APPL'
    return isNonDrug ? 'CC' : 'APPL'
  }

  const applCount = items.filter(i => getVote(i) === 'APPL').length
  const ccCount = items.filter(i => getVote(i) === 'CC').length
  const lpCount = items.filter(i => getVote(i) === 'LP').length
  const dpCount = items.filter(i => getVote(i) === 'DP').length

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(isNonDrug ? 6 : 0, isNonDrug ? 90 : 60, isNonDrug ? 44 : 120)
  doc.text(isNonDrug ? `Jumlah Item: ${totalItems}` : `Jumlah Item Formulari: ${totalItems}`, 18, summaryY + 7.5)
  doc.text(`Item Aktif: ${activeCount}`, 62, summaryY + 7.5)
  doc.text(`APPL: ${applCount}`, 104, summaryY + 7.5)
  doc.text(`CC: ${ccCount}`, 138, summaryY + 7.5)
  doc.text(`LP: ${lpCount}`, 170, summaryY + 7.5)
  doc.text(`DP: ${dpCount}`, 202, summaryY + 7.5)
  doc.text(`Skim Perolehan: ${skim.toUpperCase()}`, 234, summaryY + 7.5)
  doc.setTextColor(0, 0, 0)

  // ─── Main Formulary Table ─────────────────────────────────────────────────
  const tableStartY = summaryY + 16

  const tableHead = isNonDrug ? [[
    { content: 'BIL.', styles: { halign: 'center' as const, cellWidth: 10 } },
    { content: 'KOD BARANG', styles: { cellWidth: 45 } },
    { content: 'NAMA BARANG', styles: { cellWidth: 130 } },
    { content: 'PACKAGING', styles: { cellWidth: 38 } },
    { content: 'HARGA (RM)', styles: { halign: 'right' as const, cellWidth: 25 } },
    { content: 'SKIM', styles: { halign: 'center' as const, cellWidth: 20 } },
  ]] : [[
    { content: 'BIL.', styles: { halign: 'center' as const, cellWidth: 10 } },
    { content: 'KOD UBAT', styles: { cellWidth: 45 } },
    { content: 'NAMA UBAT / NAMA GENERIK', styles: { cellWidth: 85 } },
    { content: 'PACKAGING', styles: { cellWidth: 38 } },
    { content: 'HARGA (RM)', styles: { halign: 'right' as const, cellWidth: 25 } },
    { content: 'KATEGORI TERAPEUTIK', styles: { cellWidth: 38 } },
    { content: 'KAT. PRESK.', styles: { halign: 'center' as const, cellWidth: 20 } },
    { content: 'SKIM', styles: { halign: 'center' as const, cellWidth: 12 } },
  ]]

  const tableBody = items.map((drug, idx) => {
    const code = drug.item_code || drug.drug_code || drug.sku || '-'
    const itemName = drug.item_name || drug.drug_name || '-'

    // Only show generic name if it's meaningfully different from drug name
    const drugNameNorm = (itemName || '').toLowerCase().trim()
    const genericNameNorm = (drug.generic_name || '').toLowerCase().trim()
    const showGeneric = !isNonDrug && drug.generic_name &&
      genericNameNorm !== drugNameNorm &&
      genericNameNorm.length > 0
    const nameCell = showGeneric
      ? `${itemName}\n(${drug.generic_name})`
      : itemName

    // Packaging: line 1 = dosage form, line 2 = packaging description or strength+UOM
    const dosageForm = (drug.unit_of_measure || drug.dosage_form || drug.uom || '').toString().toUpperCase()
    const packDesc = drug.packaging_description || ''
    const packLine2 = packDesc ||
      (drug.strength && drug.unit_of_measure
        ? `${drug.strength} / ${drug.unit_of_measure}`
        : drug.strength || drug.unit_of_measure || '')
    const packagingCell = packLine2
      ? `${dosageForm}\n${packLine2}`
      : dosageForm

    const price = (drug.price ?? drug.unit_price ?? 0).toFixed(2)
    const therapCat = drug.category?.category_name || drug.category_name || 'General'
    const prescriberCat = '-'
    const skim = (drug.procurement_vote || 'APPL').toUpperCase()

    return isNonDrug ? [
      { content: String(idx + 1), styles: { halign: 'center' as const } },
      { content: code, styles: { fontStyle: 'bold' as const } },
      { content: nameCell },
      { content: packagingCell },
      { content: price, styles: { halign: 'right' as const } },
      { content: skim, styles: { halign: 'center' as const } },
    ] : [
      { content: String(idx + 1), styles: { halign: 'center' as const } },
      { content: code, styles: { fontStyle: 'bold' as const } },
      { content: nameCell },
      { content: packagingCell },
      { content: price, styles: { halign: 'right' as const } },
      { content: drug.category?.category_name || drug.category_name || 'General' },
      { content: prescriberCat, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
      { content: skim, styles: { halign: 'center' as const } },
    ]
  })

  // Track current Y for footer after table
  let finalY = tableStartY

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      font: 'Helvetica',
      cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
      overflow: 'linebreak',
      valign: 'middle',
      textColor: [20, 20, 20],
    },
    headStyles: {
      fillColor: themeColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      lineWidth: 0,
    },
    alternateRowStyles: {
      fillColor: [245, 249, 255],
    },
    columnStyles: isNonDrug ? {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 45, fontStyle: 'bold', textColor: [0, 70, 140] },
      2: { cellWidth: 130 },
      3: { cellWidth: 38 },
      4: { halign: 'right', cellWidth: 25, fontStyle: 'bold' },
      5: { halign: 'center', cellWidth: 20 },
    } : {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 45, fontStyle: 'bold', textColor: [0, 70, 140] },
      2: { cellWidth: 85 },
      3: { cellWidth: 38 },
      4: { halign: 'right', cellWidth: 25, fontStyle: 'bold' },
      5: { cellWidth: 38 },
      6: { halign: 'center', cellWidth: 20, fontStyle: 'bold', textColor: [100, 0, 0] },
      7: { halign: 'center', cellWidth: 12 },
    },
    didDrawPage: (data: any) => {
      // Redraw header on every subsequent page
      if (data.pageNumber > 1) {
        drawHeader()
        // Running page header
        doc.setFont('Helvetica', 'italic')
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.text(isNonDrug ? `Inventori Bukan Ubat ${hospitalName} (sambungan)` : `Formulari Ubat ${hospitalName} — Skim: ${skim.toUpperCase()} (sambungan)`, 14, 37)
        doc.setTextColor(0, 0, 0)
      }
      finalY = (data.cursor as any)?.y ?? finalY
    },
    margin: { top: 40, left: 14, right: 14, bottom: 18 },
    tableWidth: 'auto',
  })

  // ─── Certification / Signature Block ─────────────────────────────────────
  const sigY = (doc as any).lastAutoTable.finalY + 10
  const totalSigBlockHeight = 80 // yellow box + 2 sig boxes + stamp box
  const needsNewPage = sigY + totalSigBlockHeight > pageH - 14

  if (needsNewPage) {
    doc.addPage()
    drawHeader()
    doc.setFont('Helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(isNonDrug ? `Inventori Bukan Ubat ${hospitalName} — Halaman Tandatangan` : `Formulari Ubat ${hospitalName} — Halaman Tandatangan`, 14, 37)
    doc.setTextColor(0, 0, 0)
  }

  const sigStartY = needsNewPage ? 42 : sigY

  // Certification statement
  doc.setFillColor(255, 251, 235)
  doc.setDrawColor(200, 150, 0)
  doc.setLineWidth(0.3)
  const certSentence =
    `Saya mengesahkan bahawa Formulari Ubat ini telah disemak, disahkan dan diluluskan oleh ` +
    `Jawatankuasa Farmasi & Terapeutik (JFT) ${hospitalName} bagi tahun ${now.getFullYear()}. ` +
    `Dokumen ini adalah rasmi dan berkuat kuasa sehingga dikemas kini oleh pihak berkuasa yang berkenaan.`
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(80, 60, 0)
  const certLines = doc.splitTextToSize(certSentence, pageW - 36)
  const certH = certLines.length * 4.2 + 6
  doc.roundedRect(14, sigStartY, pageW - 28, certH, 1.5, 1.5, 'FD')
  doc.text(certLines, 18, sigStartY + 5)
  doc.setTextColor(0, 0, 0)

  const sigBoxY = sigStartY + certH + 6
  const gap = 6
  const colW = (pageW - 28 - (gap * 2)) / 3

  // Helper: draw a signature box
  const drawSigBox = (x: number, y: number, w: number, label: string, name: string, title: string) => {
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, w, 38, 1.5, 1.5, 'S')

    // Signature line
    doc.setDrawColor(120, 120, 120)
    doc.setLineWidth(0.5)
    doc.line(x + 6, y + 22, x + w - 6, y + 22)

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    doc.text(label, x + w / 2, y + 6, { align: 'center' })

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(name.toUpperCase(), x + w / 2, y + 27, { align: 'center' })

    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(80, 80, 80)
    doc.text(title, x + w / 2, y + 32, { align: 'center' })
    doc.text(hospitalName, x + w / 2, y + 36.5, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }

  drawSigBox(14, sigBoxY, colW, 'DISEDIAKAN OLEH', preparedBy, preparedByTitle)
  drawSigBox(14 + colW + gap, sigBoxY, colW, 'DISEMAK OLEH', checkedBy, checkedByTitle)
  drawSigBox(14 + (colW + gap) * 2, sigBoxY, colW, 'DISAHKAN OLEH', approvedBy, approvedByTitle)

  // Stamp area placeholder
  doc.setFillColor(248, 248, 248)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.roundedRect(14, sigBoxY + 40, pageW - 28, 14, 1.5, 1.5, 'FD')
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text(
    'COP RASMI HOSPITAL / JABATAN FARMASI — Untuk Perakuan Dokumen Rasmi',
    pageW / 2,
    sigBoxY + 48,
    { align: 'center' }
  )

  // ─── Final footer — written once per page after all content is finalized ──
  const totalPages = (doc.internal as any).getNumberOfPages()
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg)
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    // Clear the footer band before writing to prevent overlap artifacts
    doc.setFillColor(255, 255, 255)
    doc.rect(0, pageH - 14, pageW, 14, 'F')
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.2)
    doc.line(14, pageH - 12, pageW - 14, pageH - 12)
    doc.text(
      `Halaman ${pg} daripada ${totalPages}  |  SULIT — Untuk Kegunaan Hospital Sahaja`,
      pageW / 2,
      pageH - 7,
      { align: 'center' }
    )
  }

  // ─── Save ─────────────────────────────────────────────────────────────────
  const fileName = `Formulari_Ubat_${hospitalName.replace(/\s+/g, '_')}_${skim.toUpperCase()}_${now.getFullYear()}.pdf`
  doc.save(fileName)
}

// ─── Non-Drug Facility Catalog PDF Generator ─────────────────────────────────

export function generateFormulariSimplePdf(
  items: FormulariDrugItem[],
  opts: FormulariPdfOptions = {}
) {
  const currentUser = useAuthStore.getState().user
  const {
    skim = 'SEMUA',
    preparedBy = currentUser?.full_name || (currentUser as any)?.name || 'Pegawai Farmasi / Logistik',
    preparedByTitle = currentUser?.jawatan || 'Pegawai Farmasi / Logistik',
    checkedBy = 'Ketua Unit Logistik / Inventori',
    checkedByTitle = 'Ketua Unit Logistik / Inventori',
    approvedBy = 'Pengarah Hospital',
    approvedByTitle = 'Pengarah Hospital',
    hospitalName = currentUser?.hospital?.hospital_name || (currentUser?.hospital as any)?.name || 'HOSPITAL LAWAS',
    department = 'Unit Inventori Bukan Ubat & Logistik',
    referenceNo = `KKM/HL/NONDRUG/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  } = opts

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // ─── Watermark ─────────────────────────────────────────────────────────────
  const drawWatermark = () => {
    const wW = 120
    const wH = 95
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

  // ─── Header ────────────────────────────────────────────────────────────────
  const drawHeader = () => {
    drawWatermark()
    doc.addImage(JATA_NEGARA_BASE64, 'PNG', 14, 8, 22, 18)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 30, 70)
    doc.text('KEMENTERIAN KESIHATAN MALAYSIA', 40, 13.5)
    doc.setFontSize(9.5)
    doc.text(hospitalName + ', SARAWAK', 40, 19.5)
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(80, 80, 80)
    doc.text(
      'Jalan Hospital, 98850 Lawas, Sarawak  |  Tel: 085 283 781 (ext 206)  |  farmasi.hlawas@moh.gov.my',
      40, 25
    )
    doc.setDrawColor(15, 30, 70)
    doc.setLineWidth(0.9)
    doc.line(14, 29.5, pageW - 14, 29.5)
    doc.setLineWidth(0.3)
    doc.line(14, 31, pageW - 14, 31)
    doc.setFillColor(13, 148, 136) // teal band
    doc.rect(14, 29.5, pageW - 28, 1.5, 'F')
  }

  drawHeader()

  // ─── Meta Info ─────────────────────────────────────────────────────────────
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(60, 60, 60)
  const now = new Date()
  const dateStr = now.toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })
  doc.text(`Rujukan: ${referenceNo}`, 14, 38)
  doc.text(`Tarikh: ${dateStr}  |  Masa: ${timeStr}`, 14, 43)
  doc.text(`Jabatan: ${department}`, 14, 48)

  doc.setFont('Helvetica', 'bold')
  doc.setTextColor(180, 0, 0)
  doc.text('RASMI / SULIT', pageW - 14, 38, { align: 'right' })
  doc.setTextColor(60, 60, 60)

  // ─── Title Banner ──────────────────────────────────────────────────────────
  doc.setFillColor(13, 148, 136)
  doc.roundedRect(14, 53, pageW - 28, 14, 2, 2, 'F')

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('REKOD KATALOG & INVENTORI BUKAN UBAT FASILITI', pageW / 2, 62.5, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // ─── Preamble Paragraph ───────────────────────────────────────────────────
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(7.8)
  doc.setTextColor(40, 40, 40)
  const preamble =
    `Dokumen ini mengandungi Senarai Inventori Bukan Ubat berdaftar bagi ${hospitalName} Sarawak. ` +
    `Segala item bukan ubat, bahan pakai buang (consumables), serta kelengkapan perubatan dan am di bawah ` +
    `pegangan fasiliti direkodkan untuk tujuan pengurusan stok, audit logistik, dan rekod perolehan premis.`
  const preambleLines = doc.splitTextToSize(preamble, pageW - 28)
  doc.text(preambleLines, 14, 72)

  // ─── Summary Box ──────────────────────────────────────────────────────────
  const summaryY = 72 + preambleLines.length * 3.8 + 2
  doc.setFillColor(240, 253, 250) // teal tint
  doc.setDrawColor(13, 148, 136)
  doc.setLineWidth(0.3)
  doc.roundedRect(14, summaryY, pageW - 28, 12, 1.5, 1.5, 'FD')

  const totalValuation = items.reduce((acc, d) => {
    const priceVal = d.unit_price ?? d.price ?? 0
    return acc + priceVal * (d.facility_stock || 0)
  }, 0)

  const applCount = items.filter(i => (i.procurement_vote || i.scheme || i.skim || '').toString().toLowerCase() === 'appl').length
  const ccCount = items.filter(i => {
    const v = (i.procurement_vote || i.scheme || i.skim || '').toString().toLowerCase()
    return v === 'cc' || (!v)
  }).length
  const lpCount = items.filter(i => (i.procurement_vote || i.scheme || i.skim || '').toString().toLowerCase() === 'lp').length
  const dpCount = items.filter(i => (i.procurement_vote || i.scheme || i.skim || '').toString().toLowerCase() === 'dp').length

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(15, 118, 110)
  doc.text(`Jumlah Item: ${items.length}`, 18, summaryY + 7.5)
  doc.text(`APPL: ${applCount}`, 56, summaryY + 7.5)
  doc.text(`CC: ${ccCount}`, 88, summaryY + 7.5)
  doc.text(`LP: ${lpCount}`, 118, summaryY + 7.5)
  doc.text(`DP: ${dpCount}`, 148, summaryY + 7.5)
  doc.text(`Jumlah Nilai: RM ${totalValuation.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`, 178, summaryY + 7.5)
  doc.text(`Skim: ${skim.toUpperCase()}`, 240, summaryY + 7.5)
  doc.setTextColor(0, 0, 0)

  // ─── Table ────────────────────────────────────────────────────────────────
  const tableStartY = summaryY + 16

  const tableHead = [[
    { content: 'BIL.', styles: { halign: 'center' as const, cellWidth: 10 } },
    { content: 'KOD ITEM', styles: { cellWidth: 40 } },
    { content: 'NAMA ITEM', styles: { cellWidth: 120 } },
    { content: 'PEMBUNGKUSAN', styles: { cellWidth: 40 } },
    { content: 'HARGA (RM)', styles: { halign: 'right' as const, cellWidth: 30 } },
    { content: 'SKIM', styles: { halign: 'center' as const, cellWidth: 20 } },
  ]]

  const tableBody = items.map((item, idx) => {
    const code = item.item_code || item.code || item.sku || '-'
    const price = (item.unit_price ?? item.price ?? 0).toFixed(2)
    const packDesc = item.packaging_description || item.packaging
    const packaging = packDesc ? packDesc : (item.uom || item.unit_of_measure || 'PACK').toUpperCase()
    const skimVote = (item.procurement_vote || 'APPL').toUpperCase()

    return [
      { content: String(idx + 1), styles: { halign: 'center' as const } },
      { content: code, styles: { fontStyle: 'bold' as const } },
      { content: item.item_name || '-' },
      { content: packaging },
      { content: price, styles: { halign: 'right' as const } },
      { content: skimVote, styles: { halign: 'center' as const } },
    ]
  })

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      font: 'Helvetica',
      cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
      overflow: 'linebreak',
      valign: 'middle',
      textColor: [20, 20, 20],
    },
    headStyles: {
      fillColor: [13, 148, 136],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      lineWidth: 0,
    },
    alternateRowStyles: {
      fillColor: [240, 253, 250],
    },
  })

  // ─── Certification / Signature Block ─────────────────────────────────────
  const sigY = (doc as any).lastAutoTable.finalY + 10
  const totalSigBlockHeight = 80 // yellow box + 2 sig boxes + stamp box
  const needsNewPage = sigY + totalSigBlockHeight > pageH - 14

  if (needsNewPage) {
    doc.addPage()
    drawHeader()
    doc.setFont('Helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(`Katalog Bukan Ubat ${hospitalName} — Halaman Tandatangan`, 14, 37)
    doc.setTextColor(0, 0, 0)
  }

  const sigStartY = needsNewPage ? 42 : sigY

  // Certification statement
  doc.setFillColor(255, 251, 235)
  doc.setDrawColor(200, 150, 0)
  doc.setLineWidth(0.3)
  const certSentence =
    `Saya mengesahkan bahawa Katalog / Inventori Bukan Ubat ini telah disemak, disahkan dan diluluskan oleh ` +
    `Jawatankuasa Pengurusan Stok & Logistik (JPSL) ${hospitalName} bagi tahun ${now.getFullYear()}. ` +
    `Dokumen ini adalah rasmi dan berkuat kuasa sehingga dikemas kini oleh pihak berkuasa yang berkenaan.`
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(80, 60, 0)
  const certLines = doc.splitTextToSize(certSentence, pageW - 36)
  const certH = certLines.length * 4.2 + 6
  doc.roundedRect(14, sigStartY, pageW - 28, certH, 1.5, 1.5, 'FD')
  doc.text(certLines, 18, sigStartY + 5)
  doc.setTextColor(0, 0, 0)

  const sigBoxY = sigStartY + certH + 6
  const gap = 6
  const colW = (pageW - 28 - (gap * 2)) / 3

  // Helper: draw a signature box
  const drawSigBox = (x: number, y: number, w: number, label: string, name: string, title: string) => {
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, w, 38, 1.5, 1.5, 'S')

    // Signature line
    doc.setDrawColor(120, 120, 120)
    doc.setLineWidth(0.5)
    doc.line(x + 6, y + 22, x + w - 6, y + 22)

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    doc.text(label, x + w / 2, y + 6, { align: 'center' })

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(name.toUpperCase(), x + w / 2, y + 27, { align: 'center' })

    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(80, 80, 80)
    doc.text(title, x + w / 2, y + 32, { align: 'center' })
    doc.text(hospitalName, x + w / 2, y + 36.5, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }

  drawSigBox(14, sigBoxY, colW, 'DISEDIAKAN OLEH', preparedBy, preparedByTitle)
  drawSigBox(14 + colW + gap, sigBoxY, colW, 'DISEMAK OLEH', checkedBy, checkedByTitle)
  drawSigBox(14 + (colW + gap) * 2, sigBoxY, colW, 'DISAHKAN OLEH', approvedBy, approvedByTitle)

  // Stamp area placeholder
  doc.setFillColor(248, 248, 248)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.roundedRect(14, sigBoxY + 40, pageW - 28, 14, 1.5, 1.5, 'FD')
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text(
    'COP RASMI HOSPITAL / JABATAN FARMASI — Untuk Perakuan Dokumen Rasmi',
    pageW / 2,
    sigBoxY + 48,
    { align: 'center' }
  )

  // ─── Final Footers ────────────────────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages()
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg)
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    doc.setFillColor(255, 255, 255)
    doc.rect(0, pageH - 14, pageW, 14, 'F')
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.2)
    doc.line(14, pageH - 12, pageW - 14, pageH - 12)
    doc.text(
      `Halaman ${pg} daripada ${totalPages}  |  SULIT — Untuk Kegunaan Hospital Sahaja`,
      pageW / 2,
      pageH - 7,
      { align: 'center' }
    )
  }

  // ─── Save PDF ─────────────────────────────────────────────────────────────
  const fileName = `Katalog_Bukan_Ubat_${hospitalName.replace(/\s+/g, '_')}_${skim.toUpperCase()}_${now.getFullYear()}.pdf`
  doc.save(fileName)
}
