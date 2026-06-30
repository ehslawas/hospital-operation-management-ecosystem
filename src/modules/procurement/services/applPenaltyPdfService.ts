// @ts-nocheck
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '@/lib/utils'
import { PerformanceStandard } from './penaltyService'

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

export async function generateAPPLPenaltyPdf(penalty: any, standards: PerformanceStandard[]): Promise<jsPDF> {
  const doc = new jsPDF()
  const margin = 20
  const pageWidth = 210
  const pageHeight = 297
  const contentWidth = pageWidth - 2 * margin
  const supplier = penalty.supplier
  const lpo = penalty.lpo

  // 1. Logo & Top Info (Official Malaysian Coat of Arms)
  const logoBase64 = await getBase64ImageFromUrlLocal('/512px-Jata_MalaysiaV2.svg.png')
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, 14, 20, 16)
  }

  // Header Typography (Times New Roman style)
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text('KEMENTERIAN KESIHATAN MALAYSIA', margin + 24, 18)
  doc.text('HOSPITAL LAWAS', margin + 24, 23)
  
  doc.setFont('times', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(71, 85, 105)
  doc.text('Jalan Hospital, 98850 Lawas, Sarawak, Malaysia', margin + 24, 27.5)
  doc.text('Telefon: 085-283781  |  Faks: 085-283782', margin + 24, 32)

  // Divider Line
  doc.setDrawColor(71, 85, 105)
  doc.setLineWidth(0.8)
  doc.line(margin, 36, pageWidth - margin, 36)

  // Top-Right Reference Box (Perfectly Aligned)
  doc.setFont('times', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(30, 41, 59)
  
  const refLabelX = pageWidth - margin - 82
  const refColonX = refLabelX + 22
  const refValueX = refColonX + 3

  doc.text('No. Lampiran', refLabelX, 44)
  doc.text(':', refColonX, 44)
  doc.setFont('times', 'bold')
  doc.text('LAMPIRAN 9', refValueX, 44)

  doc.setFont('times', 'normal')
  doc.text('No. Rujukan', refLabelX, 50)
  doc.text(':', refColonX, 50)
  doc.setFont('times', 'bold')
  const penaltyRef = penalty.penalty_ref_number || `PENALTI/APPL/${new Date().getFullYear()}-${String(penalty.id || 'REF').slice(0, 6).toUpperCase()}`
  doc.text(String(penaltyRef), refValueX, 50)

  doc.setFont('times', 'normal')
  doc.text('Tarikh', refLabelX, 56)
  doc.text(':', refColonX, 56)
  const claimDateStr = penalty.created_at 
    ? new Date(penalty.created_at).toLocaleDateString('en-GB') 
    : new Date().toLocaleDateString('en-GB')
  doc.text(String(claimDateStr), refValueX, 56)

  // Title Header with elegant borders
  doc.setLineWidth(0.4)
  doc.setDrawColor(51, 65, 85)
  doc.line(margin, 62, pageWidth - margin, 62)
  doc.line(margin, 69, pageWidth - margin, 69)

  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text('BORANG TUNTUTAN PEMBAYARAN PENALTI', pageWidth / 2, 66.5, { align: 'center' })

  // 3. Details Rows with Colons and Slate Accents
  let curY = 77
  const alignX = margin + 55

  const drawDetailRow = (numLabel: string, value: string, isNumberOrValueField: boolean = false, suffix: string = '') => {
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(numLabel, margin + 6, curY)
    doc.text(':', alignX - 3, curY)
    
    doc.setFont('times', 'bold')
    doc.setTextColor(15, 23, 42)
    
    if (isNumberOrValueField) {
      // Value right-aligned for bookkeeping
      doc.text(value, pageWidth - margin - 25, curY, { align: 'right' })
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(0.3)
      doc.line(alignX, curY + 0.8, pageWidth - margin - 20, curY + 0.8)
      if (suffix) {
        doc.setFont('times', 'italic')
        doc.setFontSize(8.5)
        doc.setTextColor(100, 116, 139)
        doc.text(suffix, pageWidth - margin - 18, curY)
      }
    } else {
      const textWidth = pageWidth - margin - (alignX + 4)
      const lines = doc.splitTextToSize(String(value), textWidth)
      
      lines.forEach((line: string, i: number) => {
        doc.text(line, alignX, curY)
        doc.setDrawColor(203, 213, 225)
        doc.setLineWidth(0.3)
        doc.line(alignX, curY + 0.8, pageWidth - margin - 5, curY + 0.8)
        if (i < lines.length - 1) {
          curY += 6
        }
      })
    }
    curY += 6.5
  }

  // Format all details beautifully
  const claimDateTime = penalty.created_at 
    ? new Date(penalty.created_at).toLocaleDateString('en-GB') + ' ' + new Date(penalty.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    : new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  const supplierAddress = supplier?.address || penalty.manual_supplier_address || ''
  const poDate = penalty.purchase_order?.order_date 
    ? new Date(penalty.purchase_order.order_date).toLocaleDateString('en-GB') 
    : ''
  const lpoDate = lpo?.document_date 
    ? new Date(lpo.document_date).toLocaleDateString('en-GB') 
    : ''
  const arrivedDate = penalty.actual_delivery_date 
    ? new Date(penalty.actual_delivery_date).toLocaleDateString('en-GB') 
    : ''
  const daysDelayed = penalty.days_delayed || 0

  const startDetailY = curY
  drawDetailRow('1) Nama PTJ', 'HOSPITAL LAWAS')
  drawDetailRow('2) Tarikh Tuntutan', claimDateTime)
  drawDetailRow('3) No. LPO', String(lpo?.lpo_number || penalty.purchase_order?.po_number || '').toUpperCase())
  drawDetailRow('3a) No. Kontrak', String(supplier?.contract_number || '').toUpperCase())
  drawDetailRow('3b) Alamat Pembekal', String(supplierAddress).toUpperCase())
  drawDetailRow('3c) Tarikh Ordered (PO)', poDate)
  drawDetailRow('3d) Tarikh LPO Dicipta', lpoDate)
  drawDetailRow('3e) Tarikh Sampai (Arrived)', arrivedDate)
  drawDetailRow('3g) Bilangan Hari Lewat', `${daysDelayed} HARI`)
  drawDetailRow('4a) Nama Item & Kuantiti', `${String(penalty.item_name || '').toUpperCase()} (${penalty.quantity || 0})`)
  drawDetailRow('4b) No. Delivery Order (DO)', String(penalty.do_number || '').toUpperCase())
  drawDetailRow('5) Nilai Produk/LPO (RM)', Number(penalty.total_order_value || 0).toFixed(2), true)
  drawDetailRow('6) Nilai Produk Gagal Dibekalkan (RM)', Number(penalty.failed_product_value || 0).toFixed(2), true, '(Jika berkenaan)')
  drawDetailRow('7) No. Invois', String(penalty.payment_reference || '').toUpperCase())

  // Left vertical accent bar matching Details block
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.8)
  doc.line(margin + 2, startDetailY - 3, margin + 2, curY - 4)

  curY += 2

  // Standard Header section 8
  doc.setFont('times', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('8) Kategori Performance Standard : (Sila tandakan (✓) pada kategori yang berkenaan sahaja)', margin + 2, curY)
  curY += 4.5
  doc.text('   Yang Gagal Dipatuhi', margin + 2, curY)
  curY += 5.5

  // 4. Performance Standards table
  const selectedCodes = penalty.performance_standards_violated || []
  const tableBody = standards.map((std, idx) => {
    const isViolated = selectedCodes.includes(std.code)
    let fineText = ''
    
    if (isViolated) {
      let amount = 0
      const failedVal = Number(penalty.failed_product_value || 0)
      
      if (std.penalty_type === 'percentage' && std.penalty_rate) {
        amount = Number(std.penalty_rate) * failedVal * daysDelayed
      } else if (std.penalty_type === 'fixed' && std.fixed_amount) {
        amount = Number(std.fixed_amount)
      } else if (std.penalty_type === 'per_incident' && std.fixed_amount) {
        amount = Number(std.fixed_amount)
      } else if (std.penalty_type === 'per_day' && std.fixed_amount) {
        amount = Number(std.fixed_amount) * daysDelayed
      } else if (std.fixed_amount) {
        amount = Number(std.fixed_amount)
      }
      fineText = amount.toFixed(2)
    }
    
    return [
      `${idx + 1}  ${std.description_bm}`,
      std.penalty_formula || '',
      fineText
    ]
  })

  // Append Total Row to Table Body
  tableBody.push([
    {
      content: 'JUMLAH KESELURUHAN (RM)',
      colSpan: 2,
      styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] }
    },
    {
      content: Number(penalty.penalty_amount || 0).toFixed(2),
      styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] }
    }
  ] as any)

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    styles: { 
      font: 'times', 
      fontSize: 9.5, 
      textColor: [30, 41, 59], 
      lineColor: [203, 213, 225], 
      lineWidth: 0.15, 
      cellPadding: 5 
    },
    headStyles: { 
      fillColor: [241, 245, 249], 
      textColor: [15, 23, 42], 
      fontStyle: 'bold', 
      lineColor: [148, 163, 184], 
      lineWidth: 0.2, 
      halign: 'center' 
    },
    head: [['PERFORMANCE STANDARD YANG GAGAL DIPATUHI', 'NILAI DENDA', 'JUMLAH (RM)']],
    body: tableBody,
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25, halign: 'right' }
    }
  })

  // 5. Boxes below Table (Perakuan PTJ, Kaedah Bayaran, Perakuan Syarikat)
  let postTableY = (doc as any).lastAutoTable.finalY + 5
  if (postTableY + 120 > pageHeight - margin) {
    doc.addPage()
    postTableY = 15
  }

  // Box 1: Perakuan PTJ (Designation-based signature fields)
  const drawPerakuanPTJ = (y: number) => {
    const boxHeight = 44
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.2)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, 'FD')
    
    // Centered Title
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('PERAKUAN / PENGESAHAN', pageWidth / 2, y + 4.5, { align: 'center' })
    
    doc.setFont('times', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(100, 116, 139)
    doc.text('(Untuk diisi oleh PTJ bertanggungjawab)', pageWidth / 2, y + 8.5, { align: 'center' })
    
    // Divider line
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, y + 11, pageWidth - margin, y + 11)
    
    const colW = contentWidth / 3
    const col1X = margin + 3
    const col2X = margin + colW + 3
    const col3X = margin + 2 * colW + 3
    
    const drawSignCol = (startX: number, title: string, name: string, designation: string, dateStr: string) => {
      doc.setFont('times', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(30, 41, 59)
      doc.text(title, startX, y + 15)
      
      doc.setFont('times', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(148, 163, 184)
      doc.text('Tandatangan: ...................................', startX, y + 21)
      
      doc.setTextColor(100, 116, 139)
      doc.text('Nama', startX, y + 27)
      doc.text('Jawatan', startX, y + 33)
      doc.text('Tarikh', startX, y + 39)
      
      const labelAlign = startX + 13
      doc.text(':', labelAlign, y + 27)
      doc.text(':', labelAlign, y + 33)
      doc.text(':', labelAlign, y + 39)
      
      const valX = labelAlign + 2
      
      // Dynamic wrapped elements to prevent overlap
      doc.setFont('times', 'bold')
      doc.setTextColor(15, 23, 42)
      const wrappedName = doc.splitTextToSize(String(name).toUpperCase(), colW - 18)
      doc.text(wrappedName, valX, y + 27)
      const nameLines = wrappedName.length
      const nameLastY = y + 27 + (nameLines - 1) * 3.5
      
      doc.setFont('times', 'normal')
      const wrappedDesig = doc.splitTextToSize(String(designation).toUpperCase(), colW - 18)
      doc.text(wrappedDesig, valX, nameLastY + 6)
      const desigLines = wrappedDesig.length
      const desigLastY = nameLastY + 6 + (desigLines - 1) * 3
      
      doc.text(String(dateStr), valX, desigLastY + 6)
    }
    
    const hasPrepared = !!(penalty.prepared_by_user_id || penalty.prepared_by?.id || (penalty.prepared_by_name && penalty.prepared_by_name !== '' && penalty.prepared_by_name !== ''))
    const hasVerified = !!(penalty.verified_by_user_id || penalty.verified_by?.id || (penalty.verified_by_name && penalty.verified_by_name !== '' && penalty.verified_by_name !== ''))
    const hasApproved = !!(penalty.approved_by || penalty.approved_by_user?.id || (penalty.approved_by_name && penalty.approved_by_name !== '' && penalty.approved_by_name !== ''))

    const prepName = hasPrepared ? (penalty.prepared_by_name || penalty.prepared_by?.full_name || 'AMRI AMIT') : ''
    const prepDes = hasPrepared ? (penalty.prepared_by_designation || penalty.prepared_by?.jawatan || 'PENOLONG PEGAWAI FARMASI U5') : ''
    const prepDate = hasPrepared && penalty.prepared_at ? new Date(penalty.prepared_at).toLocaleDateString('en-GB') : ''

    const checkName = hasVerified ? (penalty.verified_by_name || penalty.verified_by?.full_name || 'KAMRIAH BT HAJI MAIL') : ''
    const checkDes = hasVerified ? (penalty.verified_by_designation || penalty.verified_by?.jawatan || 'PENOLONG PEGAWAI FARMASI U7 TBK 2') : ''
    const checkDate = hasVerified && penalty.verified_at ? new Date(penalty.verified_at).toLocaleDateString('en-GB') : ''

    const approveName = hasApproved ? (penalty.approved_by_user?.full_name || penalty.approved_by_name || 'TAN YUAN ZHANG') : ''
    const approveDes = hasApproved ? (penalty.approved_by_user?.jawatan || penalty.approved_by_designation || 'PEGAWAI FARMASI UF 12') : ''
    const approveDate = hasApproved && penalty.approved_at ? new Date(penalty.approved_at).toLocaleDateString('en-GB') : ''

    drawSignCol(col1X, 'Disediakan Oleh :-', prepName, prepDes, prepDate)
    drawSignCol(col2X, 'Disemak Oleh :-', checkName, checkDes, checkDate)
    drawSignCol(col3X, 'Disahkan Oleh :-', approveName, approveDes, approveDate)
  }

  // Box 2: Kaedah Bayaran
  const drawKaedahBayaran = (y: number) => {
    const boxHeight = 36
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.2)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, 'FD')
    
    // Centered Title
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('KAEDAH BAYARAN', pageWidth / 2, y + 4.5, { align: 'center' })
    
    doc.setFont('times', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(100, 116, 139)
    doc.text('(Untuk diisi oleh PTJ)', pageWidth / 2, y + 8, { align: 'center' })
    
    // Divider
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, y + 10, pageWidth - margin, y + 10)
    
    // Content
    doc.setFont('times', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    doc.text('Tanda ( ✓ ) pada mana yang berkenaan :', margin + 4, y + 14)
    
    const isKaedah1 = penalty.payment_kaedah === 1
    const isKaedah2 = penalty.payment_kaedah === 2
    
    // Checkbox 1
    doc.setDrawColor(71, 85, 105)
    doc.setLineWidth(0.3)
    doc.rect(margin + 5, y + 16.5, 3.5, 3.5)
    if (isKaedah1) {
      doc.text('✓', margin + 5.8, y + 19.5)
    }
    doc.setFont('times', 'normal')
    doc.text('Bayaran melalui Kaedah 1 - Bayaran denda melalui potongan pada baucer bayaran oleh PTJ.', margin + 11, y + 19.5)
    
    // Checkbox 2
    doc.rect(margin + 5, y + 21.5, 3.5, 3.5)
    if (isKaedah2) {
      doc.text('✓', margin + 5.8, y + 24.5)
    }
    doc.text('Bayaran melalui Kaedah 2 - Bayaran denda melalui cek oleh Syarikat Konsesi.', margin + 11, y + 24.5)
    
    // Notes
    doc.setFont('times', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('* Pembayaran denda melalui cek hendaklah dilakukan dalam masa 14 hari dari tarikh notifikasi.', margin + 11, y + 29)
    
    const note2 = '* Cek hendaklah dibuat atas nama Ketua Setiausaha KKM / Pengarah Hospital / Pengarah JKN / PKD.'
    doc.text(note2, margin + 11, y + 32.5)
  }

  // Box 3: Perakuan Syarikat Konsesi
  const drawPerakuanSupplier = (y: number) => {
    const boxHeight = 36
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.2)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, 'FD')
    
    // Centered Title
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('PERAKUAN SYARIKAT KONSESI', pageWidth / 2, y + 4.5, { align: 'center' })
    
    doc.setFont('times', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(100, 116, 139)
    doc.text('(Untuk diisi oleh Syarikat Konsesi)', pageWidth / 2, y + 8, { align: 'center' })
    
    // Divider
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, y + 10, pageWidth - margin, y + 10)
    
    // Content
    doc.setFont('times', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(30, 41, 59)
    doc.text('*Disertakan bayaran denda melalui cek bernombor ............................................. berjumlah RM .............................................', margin + 4, y + 14)
    
    // Input Fields
    doc.text('Tandatangan', margin + 4, y + 20)
    doc.text(':', margin + 38, y + 20)
    doc.line(margin + 40, y + 20.5, margin + 130, y + 20.5)
    
    doc.text('Nama', margin + 4, y + 24.5)
    doc.text(':', margin + 38, y + 24.5)
    doc.line(margin + 40, y + 25, margin + 130, y + 25)
    
    doc.text('Jawatan & Cop Syarikat', margin + 4, y + 29)
    doc.text(':', margin + 38, y + 29)
    doc.line(margin + 40, y + 29.5, margin + 130, y + 29.5)
    
    doc.text('Tarikh', margin + 4, y + 33.5)
    doc.text(':', margin + 38, y + 33.5)
    doc.line(margin + 40, y + 34, margin + 85, y + 34)
    
    doc.text('No. Telefon', margin + 92, y + 33.5)
    doc.text(':', margin + 110, y + 33.5)
    doc.line(margin + 112, y + 34, margin + 175, y + 34)
  }

  // Draw all three sections
  drawPerakuanPTJ(postTableY)
  drawKaedahBayaran(postTableY + 48)
  drawPerakuanSupplier(postTableY + 88)

  // 6. Footer (Catatan KKM)
  const drawFooter = (y: number) => {
    doc.setFont('times', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text('Catatan KKM', margin, y)
    
    doc.setFont('times', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('1) Borang ini merupakan dokumen rasmi tuntutan penalti di bawah Perjanjian Konsesi Bekalan Farmasi APPL.', margin, y + 4.5)
    doc.text('2) Sila kepilkan bersama salinan LPO, DO, Invois dan dokumen pembuktian kelewatan yang lain.', margin, y + 8)
  }

  drawFooter(postTableY + 128)

  return doc
}
