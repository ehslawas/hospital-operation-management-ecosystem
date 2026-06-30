// @ts-nocheck
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function formatPdfDate(d?: string) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch (e) {
    return d
  }
}

function numberToBmWords(num: number | string): string {
  const n = Number(num || 0);
  const units = ["KOSONG", "SATU", "DUA", "TIGA", "EMPAT", "LIMA", "ENAM", "TUJUH", "LAPAN", "SEBILAN", "SEPULUH", "SEBELAS"];
  if (n <= 11) return units[n];
  
  const tens = ["", "SEPULUH", "DUA PULUH", "TIGA PULUH", "EMPAT PULUH", "LIMA PULUH", "ENAM PULUH", "TUJUH PULUH", "LAPAN PULUH", "SEBILAN PULUH"];
  const unitsBM = ["", "SATU", "DUA", "TIGA", "EMPAT", "LIMA", "ENAM", "TUJUH", "LAPAN", "SEBILAN"];
  
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return `${tens[ten]} ${unitsBM[unit]}`.trim();
  }
  return n.toString();
}

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

export async function generateCCPenaltyPdf(penalty: any): Promise<jsPDF> {
  const doc = new jsPDF()
  const margin = 20
  const pageWidth = 210
  const pageHeight = 297
  const supplier = penalty.supplier
  const lpo = penalty.lpo
  const tracking = penalty.order_tracking
  const po = penalty.purchase_order

  // Extract all items on this PO
  const poItems = penalty.purchase_order?.items && penalty.purchase_order.items.length > 0
    ? penalty.purchase_order.items
    : [{
        item_code: penalty.item_code || penalty.order_tracking?.item_code || '',
        item_name: penalty.item_name || penalty.order_tracking?.item_name || '',
        unit_price: Number(penalty.unit_price || 0),
        quantity_ordered: Number(penalty.quantity || 0),
        total_price: Number(penalty.unit_price || 0) * Number(penalty.quantity || 0)
      }]

  const firstItemCode = poItems[0]?.item_code || ''
  const deliveries = penalty.partial_deliveries && Array.isArray(penalty.partial_deliveries) && penalty.partial_deliveries.length > 0
    ? penalty.partial_deliveries.map((del: any) => ({
        ...del,
        item_code: del.item_code || firstItemCode
      }))
    : [{
        delivery_number: '1st Delivery',
        date: penalty.actual_delivery_date || '',
        quantity: penalty.quantity || 0,
        days_late: penalty.days_delayed || 0,
        is_late: (penalty.days_delayed || 0) > 0,
        item_code: firstItemCode
      }]

  // Pre-calculate sum of penalty to find the highest value
  let calculatedSum = 0
  deliveries.forEach((del: any) => {
    const matchingItem = poItems.find((i: any) => i.item_code === del.item_code) || poItems[0] || {}
    const price = Number(matchingItem.unit_price || 0)
    const qty = Number(del.quantity || 0)
    const days = Number(del.days_late || 0)
    const calculatedPenalty = days > 0 ? price * qty * (days / 30) * 0.10 : 0
    calculatedSum += calculatedPenalty
  })
  const finalPenaltyAmount = Math.max(calculatedSum, penalty.selected_penalty_type === 'minimum' ? 200.00 : 0)

  // Page 1: Surat Tuntutan Bayaran Denda (Official Letter of Demand)
  // Load and embed Jata Negara (Official Malaysian Coat of Arms)
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

  // Metadata Block (Right aligned top, mathematically aligned)
  doc.setFont('times', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  
  const refLabelX = pageWidth - margin - 82
  const refColonX = refLabelX + 22
  const refValueX = refColonX + 3

  doc.text('Rujukan Tuan', refLabelX, 44)
  doc.text(':', refColonX, 44)
  doc.text('', refValueX, 44)

  doc.text('Rujukan Kami', refLabelX, 50)
  doc.text(':', refColonX, 50)
  doc.setFont('times', 'bold')
  doc.text(`PENALTI/CC/2026-${penalty.id.slice(0, 8).toUpperCase()}`, refValueX, 50)

  doc.setFont('times', 'normal')
  doc.text('Tarikh', refLabelX, 56)
  doc.text(':', refColonX, 56)
  doc.text(`${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, refValueX, 56)

  // Recipient Block
  doc.setFontSize(10.5)
  doc.setTextColor(15, 23, 42)
  let y = 65
  doc.text('Pengarah Urusan,', margin, y)
  y += 5.5
  doc.setFont('times', 'bold')
  doc.text(String(supplier?.company_name || ''), margin, y)
  y += 5.5
  doc.setFont('times', 'normal')
  const addrLines = doc.splitTextToSize(String(supplier?.address || ''), 110)
  doc.text(addrLines, margin, y)
  
  y += addrLines.length * 5 + 8

  // Salutation
  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.text('Tuan/Puan,', margin, y)
  y += 7.5

  // Subject line (Bold, underlined)
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  const subject = 'NOTIS TUNTUTAN BAYARAN DENDA BEKALAN LEWAT DI BAWAH KONTRAK CC'
  doc.text(subject, margin, y)
  doc.setLineWidth(0.4)
  doc.line(margin, y + 1.2, margin + doc.getTextWidth(subject), y + 1.2)
  
  y += 9

  // Body Paragraph 1
  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  const p1Text = "Dengan segala hormatnya, saya merujuk kepada perkara di atas."
  doc.text(p1Text, margin, y)
  y += 7.5

  // Body Paragraph 2
  const p2Text = "2.      Adalah dimaklumkan bahawa syarikat tuan/puan telah lewat menyempurnakan bekalan bagi Pesanan Kerajaan (LPO) seperti butiran di bawah:"
  const wrappedP2 = doc.splitTextToSize(p2Text, pageWidth - (margin * 2))
  doc.text(wrappedP2, margin, y)
  y += wrappedP2.length * 5.5 + 4

  // Contract Details Block with elegant left accent border
  const itemNamesCombined = poItems.map((item: any) => `${item.item_name || ''} (${item.item_code || ''})`).join('\n')
  const uniqueDates = Array.from(new Set(deliveries.map((d: any) => formatPdfDate(d.date)).filter(d => d && d !== '')))
  const datesStr = uniqueDates.length > 0 ? uniqueDates.join(', ') : String(formatPdfDate(penalty.actual_delivery_date || tracking?.actual_delivery_date))

  const doNum = penalty.goods_receipt?.delivery_note_number || penalty.receiving?.do_number || penalty.do_number || ''
  const detailRows = [
    ['NO. KONTRAK KKM', String(penalty.kkm_contract_number || tracking?.kkm_contract_number || '')],
    ['NO. PESANAN (LPO)', String(lpo?.lpo_number || po?.po_number || '')],
    ['NO. DELIVERY ORDER (DO)', String(doNum).toUpperCase()],
    ['NAMA ITEM BEKALAN', itemNamesCombined.toUpperCase()],
    ['TARIKH PESANAN (LPO)', String(formatPdfDate(lpo?.document_date || po?.order_date))],
    ['TARIKH BEKALAN DITERIMA', datesStr]
  ]

  const startDetailY = y
  detailRows.forEach(([label, value]) => {
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(String(label), margin + 6, y)
    doc.text(':', margin + 58, y)
    
    doc.setFont('times', 'bold')
    doc.setTextColor(15, 23, 42)
    const wrappedVal = doc.splitTextToSize(String(value), 120)
    doc.text(wrappedVal, margin + 61, y)
    y += wrappedVal.length * 5.5 + 1.5
  })

  // Accent Left Slate Line
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.8)
  doc.line(margin + 2, startDetailY - 3.5, margin + 2, y - 2)

  y += 6

  // Body Paragraph 3
  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  
  const deliveryDays = penalty.delivery_duration_days || 21
  const deliveryDaysBm = numberToBmWords(deliveryDays)
  const amountVal = finalPenaltyAmount

  const p3Text = `3.      Kelewatan ini melanggar tempoh serahan yang ditetapkan iaitu selama ${deliveryDaysBm} HARI (${deliveryDays}) dari tarikh pesanan. Oleh yang demikian, selaras dengan syarat-syarat kontrak yang telah ditetapkan, syarikat tuan/puan dikehendaki membayar denda sebanyak RM ${Number(amountVal).toFixed(2)} seperti pada pengiraan berikut:`
  const wrappedP3 = doc.splitTextToSize(p3Text, pageWidth - (margin * 2))
  doc.text(wrappedP3, margin, y)
  
  y += wrappedP3.length * 5.5 + 4

  // Calculation Grid Table (Executive bookkeeping design)
  const isManualHigher = finalPenaltyAmount === calculatedSum
  const tableRows = deliveries.map((del: any, idx: number) => {
    const matchingItem = poItems.find((i: any) => i.item_code === del.item_code) || poItems[0] || {}
    const itemName = matchingItem.item_name || ''
    const itemCode = matchingItem.item_code || ''
    const price = Number(matchingItem.unit_price || 0)
    const qty = Number(del.quantity || 0)
    const days = Number(del.days_late || 0)
    const calculatedPenalty = days > 0 ? price * qty * (days / 30) * 0.10 : 0
    
    return [
      `${idx + 1}.`,
      `${itemName}\n(${itemCode})`,
      formatPdfDate(del.date || penalty.actual_delivery_date),
      qty.toLocaleString('en-US'),
      price.toFixed(2),
      days.toString(),
      calculatedPenalty.toFixed(2)
    ]
  })

  const isMinimumPenalty = penalty.selected_penalty_type === 'minimum'
  if (isMinimumPenalty) {
    tableRows.push([
      `${tableRows.length + 1}.`,
      'PENALTI MINIMA\n(MINIMUM PENALTY)',
      '',
      '',
      '',
      '',
      '200.00'
    ])
  }

  const totalAmount = finalPenaltyAmount
  tableRows.push([
    {
      content: 'JUMLAH KESELURUHAN (RM)',
      colSpan: 6,
      styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] }
    },
    {
      content: totalAmount.toFixed(2),
      styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] }
    }
  ])

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { 
      font: 'times', 
      fontSize: 9, 
      cellPadding: 3.5, 
      lineColor: [203, 213, 225], 
      lineWidth: 0.15,
      textColor: [30, 41, 59]
    },
    headStyles: { 
      fillColor: [241, 245, 249], 
      fontStyle: 'bold', 
      textColor: [15, 23, 42], 
      halign: 'center', 
      valign: 'middle',
      lineColor: [148, 163, 184],
      lineWidth: 0.2
    },
    alternateRowStyles: { 
      fillColor: [255, 255, 255] 
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { halign: 'left', cellWidth: 36 },
      2: { halign: 'center', cellWidth: 26 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 30 }
    },
    head: [[
      'Bil',
      'Butiran Bekalan\n(Item & Kod)',
      'Tarikh Bekalan\nDiterima',
      'Kuantiti Bekalan\nDiterima (A)',
      'Harga Seunit\n(B) (RM)',
      'Bilangan Hari\nLewat* (C)',
      'KADAR DENDA\n(RM)'
    ]],
    body: tableRows,
    theme: 'grid',
    didParseCell: (data) => {
      if (data.row.section === 'body') {
        const isMinRow = data.row.index === deliveries.length
        const shouldHighlight = isManualHigher ? !isMinRow : isMinRow
        const isTotalsRow = data.row.raw && (data.row.raw[0]?.content === 'JUMLAH KESELURUHAN (RM)' || data.row.raw.some((cell: any) => cell?.content === 'JUMLAH KESELURUHAN (RM)'))
        
        if (shouldHighlight && !isTotalsRow) {
          data.cell.styles.fillColor = [224, 242, 254]
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = [15, 23, 42]
        }
      }
    }
  })

  y = (doc as any).lastAutoTable.finalY + 4
  doc.setFont('times', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text('* Bilangan hari lewat adalah bermula setelah tempoh serahan tamat.', margin, y)
  y += 10

  // Closing section wrap calculations & rendering
  const closingSectionHeight = 72
  const pageLimitY = 270
  
  if (y + closingSectionHeight > pageLimitY) {
    doc.addPage()
    y = 25
  } else {
    y += 4
  }

  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  
  const p4Sentence1 = '4.      Sila maklumkan pengesahan bertulis syarikat tuan/puan berkenaan dengan bayaran denda tersebut.'
  const wrappedS1 = doc.splitTextToSize(p4Sentence1, pageWidth - (margin * 2))
  doc.text(wrappedS1, margin, y)
  y += wrappedS1.length * 5.5
  
  doc.setFont('times', 'bold')
  const contactName = penalty.approved_by_name || penalty.approved_by_user?.full_name || penalty.verified_by_name || penalty.checked_by_name || (penalty.verified_by?.full_name) || 'Kamriah Binti Haji Mail'
  const contactPhone = penalty.approved_by_phone || penalty.approved_by_user?.phone || penalty.verified_by_phone || '085-283781 (Samb. 206)'
  const p4Sentence2 = `Sebarang pertanyaan sila hubungi pegawai kami iaitu ${contactName} di talian ${contactPhone}`
  const wrappedS2 = doc.splitTextToSize(p4Sentence2, pageWidth - (margin * 2))
  doc.text(wrappedS2, margin, y)
  
  const lastLine = wrappedS2[wrappedS2.length - 1]
  const lastLineWidth = doc.getTextWidth(lastLine)
  
  doc.setFont('times', 'normal')
  const trailingText = ' untuk tindakan selanjutnya.'
  const trailingWidth = doc.getTextWidth(trailingText)
  
  const lastLineY = y + (wrappedS2.length - 1) * 5.5
  if (lastLineWidth + trailingWidth <= (pageWidth - margin * 2)) {
    doc.text(trailingText, margin + lastLineWidth, lastLineY)
    y += wrappedS2.length * 5.5
  } else {
    y += wrappedS2.length * 5.5
    doc.text('untuk tindakan selanjutnya.', margin, y)
    y += 5.5
  }

  y += 8
  doc.text('Sekian, terima kasih.', margin, y)
  y += 8

  // Motto
  doc.setFont('times', 'bold')
  doc.text('"MALAYSIA MADANI"', margin, y)
  y += 5.5
  doc.text('"BERKHIDMAT UNTUK NEGARA"', margin, y)
  y += 12

  // Closing Sign-off
  doc.setFont('times', 'normal')
  doc.text('Saya yang menjalankan amanah,', margin, y)
  
  y += 18
  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(0.4)
  doc.line(margin, y, margin + 65, y)
  y += 5
  
  doc.setFont('times', 'bold')
  const hasApproved = !!(penalty.approved_by || penalty.approved_by_user?.id || (penalty.approved_by_name && penalty.approved_by_name !== '' && penalty.approved_by_name !== ''))
  const officerName = hasApproved 
    ? `(${penalty.approved_by_name || penalty.approved_by_user?.full_name || 'TAN YUAN ZHANG'})`.toUpperCase()
    : '(                                              )'
  doc.text(officerName, margin, y)
  y += 5
  
  doc.setFont('times', 'normal')
  const officerTitle = hasApproved
    ? (penalty.approved_by_designation || penalty.approved_by_user?.jawatan || 'PEGAWAI FARMASI UF12').toUpperCase()
    : 'PEGAWAI FARMASI'
  doc.text(officerTitle, margin, y)
  y += 5
  doc.text('Hospital Lawas', margin, y)

  // -------------------------------------------------------------
  // Page 2: Internal Calculation Sheet / Lembaran Kerja
  doc.addPage()
  
  // Set font properties first
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text('LEMBARAN KERJA PENGIRAAN DENDA (CC)', margin, 20)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(100, 116, 139)
  doc.text('BAHAGIAN PERKHIDMATAN FARMASI | HOSPITAL LAWAS', margin, 25)
  
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.6)
  doc.line(margin, 28, pageWidth - margin, 28)

  // 1. Top Metadata Card
  const cardY = 34
  const cardHeight = 43
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.2)
  doc.roundedRect(margin, cardY, pageWidth - (margin * 2), cardHeight, 3, 3, 'FD')
  
  doc.setFillColor(71, 85, 105)
  doc.rect(margin, cardY, 3, cardHeight, 'F')
  
  doc.setFontSize(9)
  const leftLabelX = margin + 8
  const leftColonX = leftLabelX + 35
  const leftValX = leftColonX + 3
  
  let fieldY = cardY + 7
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('NO. PESANAN (LPO)', leftLabelX, fieldY)
  doc.text(':', leftColonX, fieldY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(String(lpo?.lpo_number || po?.po_number || ''), leftValX, fieldY)
  
  fieldY += 7.5
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('TARIKH PESANAN', leftLabelX, fieldY)
  doc.text(':', leftColonX, fieldY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(String(formatPdfDate(lpo?.document_date || po?.order_date)), leftValX, fieldY)
  
  fieldY += 7.5
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('KONTRAK KKM', leftLabelX, fieldY)
  doc.text(':', leftColonX, fieldY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(String(penalty.kkm_contract_number || tracking?.kkm_contract_number || ''), leftValX, fieldY)

  fieldY += 7.5
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('NO. DO', leftLabelX, fieldY)
  doc.text(':', leftColonX, fieldY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(String(doNum).toUpperCase(), leftValX, fieldY)

  const rightLabelX = margin + 95
  const rightColonX = rightLabelX + 35
  const rightValX = rightColonX + 3
  
  fieldY = cardY + 7
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('NILAI LPO (RM)', rightLabelX, fieldY)
  doc.text(':', rightColonX, fieldY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(Number(penalty.total_order_value || 0).toFixed(2), rightValX, fieldY)
  
  fieldY += 7.5
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('NAMA PEMBEKAL', rightLabelX, fieldY)
  doc.text(':', rightColonX, fieldY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  const wrappedSupplier = doc.splitTextToSize(String(supplier?.company_name || '').toUpperCase(), 40)
  doc.text(wrappedSupplier[0] || '', rightValX, fieldY)
  
  fieldY += 7.5
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('NAMA ITEM', rightLabelX, fieldY)
  doc.text(':', rightColonX, fieldY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  
  const metaItemName = poItems.length > 1
    ? `${poItems[0].item_name || ''} (+${poItems.length - 1} ITEM LAIN)`
    : String(poItems[0]?.item_name || '')
  
  const wrappedItemName = doc.splitTextToSize(metaItemName.toUpperCase(), 40)
  doc.text(wrappedItemName[0] || '', rightValX, fieldY)
  if (wrappedItemName[1]) {
    doc.setFontSize(7.5)
    doc.text(wrappedItemName[1], rightValX, fieldY + 3.5)
  }
  
  // 2. Deliveries / Calculation Table
  const tableStartY = cardY + cardHeight + 8
  let calculatedSumPage2 = 0;
  const isManualHigherPage2 = finalPenaltyAmount === calculatedSum
  const tableData = deliveries.map((del: any) => {
    const matchingItem = poItems.find((i: any) => i.item_code === del.item_code) || poItems[0] || {}
    const itemName = matchingItem.item_name || ''
    const itemCode = matchingItem.item_code || ''
    const qty = Number(del.quantity || 0)
    const price = Number(matchingItem.unit_price || 0)
    const days = del.days_late !== undefined ? Number(del.days_late) : 0
    const calculatedPenalty = days > 0 ? price * qty * (days / 30) * 0.10 : 0
    calculatedSumPage2 += calculatedPenalty
    
    return [
      `${itemName}\n(${itemCode})`,
      formatPdfDate(po?.expected_delivery_date || penalty.expected_delivery_date || tracking?.expected_delivery_date),
      formatPdfDate(del.date || penalty.actual_delivery_date),
      qty.toLocaleString('en-US'),
      price.toFixed(2),
      days.toString(),
      calculatedPenalty.toFixed(2)
    ]
  })

  if (penalty.selected_penalty_type === 'minimum') {
    tableData.push([
      'PENALTI MINIMA\n(MINIMUM PENALTY)',
      '',
      '',
      '',
      '',
      '',
      '200.00'
    ])
  }

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    styles: { 
      font: 'helvetica', 
      fontSize: 8.5, 
      cellPadding: 4.5, 
      lineColor: [226, 232, 240], 
      lineWidth: 0.15,
      textColor: [30, 41, 59]
    },
    headStyles: { 
      fillColor: [51, 65, 85], 
      fontStyle: 'bold', 
      textColor: [255, 255, 255], 
      halign: 'center', 
      valign: 'middle',
      lineColor: [30, 41, 59]
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] 
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 32 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 26 }
    },
    head: [[
      'BUTIRAN BEKALAN\n(ITEM & KOD)',
      'TARIKH PATUT\nSERAH (ETA)', 
      'TARIKH\nDITERIMA', 
      'KUANTITI', 
      'HARGA\nSEUNIT (RM)', 
      'HARI\nLEWAT', 
      'PENALTI\n(RM)'
    ]],
    body: tableData,
    theme: 'grid',
    didParseCell: (data) => {
      if (data.row.section === 'body') {
        const isMinRow = data.row.index === deliveries.length
        const shouldHighlight = isManualHigherPage2 ? !isMinRow : isMinRow
        
        if (shouldHighlight) {
          data.cell.styles.fillColor = [224, 242, 254]
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = [15, 23, 42]
        }
      }
    }
  })

  y = (doc as any).lastAutoTable.finalY + 5
  doc.setFont('helvetica', 'oblique')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Formula Pengiraan: Harga Seunit x Kuantiti Lewat x (Bilangan Hari Lewat / 30) x 10% = Denda/Penalti', margin, y)

  // Page break check for Page 2 Ledger and Signatures
  const spaceNeeded = 138
  const pageLimitPage2 = 280
  if (y + spaceNeeded > pageLimitPage2) {
    doc.addPage()
    y = 25
  } else {
    y += 12
  }

  // 3. Calculation Ledger (Bookkeeper totals panel)
  const totalVal = Number(penalty.total_order_value || 0)
  const dendaVal = finalPenaltyAmount
  
  let balanceAfterDenda = totalVal - dendaVal
  let cdcVal = 0
  let netPayable = 0
  let chequePaymentVal = 0
  const isChequeRequired = totalVal < dendaVal

  if (isChequeRequired) {
    chequePaymentVal = dendaVal - totalVal
    balanceAfterDenda = 0
    cdcVal = 0
    netPayable = 0
  } else {
    balanceAfterDenda = totalVal - dendaVal
    cdcVal = penalty.payment_kaedah === 1 ? balanceAfterDenda * 0.004 : 0
    netPayable = balanceAfterDenda - cdcVal
  }

  const ledgerLeftX = 115
  const ledgerEqX = 152
  const ledgerRightX = pageWidth - margin
  
  const ledgerStartY = y - 4
  const ledgerHeight = isChequeRequired ? 52 : 44
  doc.setFillColor(250, 250, 250)
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.2)
  doc.roundedRect(ledgerLeftX - 10, ledgerStartY, (pageWidth - margin) - (ledgerLeftX - 10), ledgerHeight, 2, 2, 'FD')
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(71, 85, 105)
  
  doc.text('AMAUN LPO', ledgerLeftX, y)
  doc.text('=  RM', ledgerEqX, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(totalVal.toFixed(2), ledgerRightX, y, { align: 'right' })
  
  y += 7.5
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(225, 29, 72) // Red color for denda deduction highlight
  doc.text('(-) DENDA KELEWATAN', ledgerLeftX, y)
  doc.setTextColor(71, 85, 105)
  doc.text('=  RM', ledgerEqX, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(225, 29, 72)
  doc.text(dendaVal.toFixed(2), ledgerRightX, y, { align: 'right' })

  if (isChequeRequired) {
    y += 7.5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(16, 185, 129) // Green color for cheque payment to offset
    doc.text('(+) POTONGAN CEK', ledgerLeftX, y)
    doc.setTextColor(71, 85, 105)
    doc.text('=  RM', ledgerEqX, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(16, 185, 129)
    doc.text(chequePaymentVal.toFixed(2), ledgerRightX, y, { align: 'right' })
  }
  
  y += 2.5
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.3)
  doc.line(ledgerLeftX - 4, y, ledgerRightX, y)
  
  y += 5.5
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('SUBTOTAL', ledgerLeftX, y)
  doc.text('RM', ledgerEqX + 3, y)
  doc.text(balanceAfterDenda.toFixed(2), ledgerRightX, y, { align: 'right' })
  
  y += 7.5
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('(-) TOLAK CDC (0.4%)', ledgerLeftX, y)
  doc.text('=  RM', ledgerEqX, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(cdcVal.toFixed(2), ledgerRightX, y, { align: 'right' })
  
  y += 2.5
  doc.line(ledgerLeftX - 4, y, ledgerRightX, y)
  
  y += 5.5
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('NET BAUCER BAYARAN', ledgerLeftX, y)
  doc.text('RM', ledgerEqX + 3, y)
  doc.text(netPayable.toFixed(2), ledgerRightX, y, { align: 'right' })
  
  if (isChequeRequired) {
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(225, 29, 72)
    const warningText = "* Denda ini hendaklah dibayar secara Bayaran Cek kerana nilai LPO kurang daripada penalti minima RM200.00."
    const wrappedWarning = doc.splitTextToSize(warningText, (pageWidth - margin) - (ledgerLeftX - 10))
    doc.text(wrappedWarning, ledgerLeftX - 10, y)
    y += (wrappedWarning.length * 3.5)
  }

  // 4. Perakuan / Pengesahan Box
  y += 10
  const sigBoxHeight = 72
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(255, 255, 255)
  doc.setLineWidth(0.2)
  doc.roundedRect(margin, y, pageWidth - (margin * 2), sigBoxHeight, 3, 3, 'FD')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('PERAKUAN / PENGESAHAN DOKUMEN SOKONGAN', pageWidth / 2, y + 5.5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('(Untuk Kegunaan Bahagian Khidmat Pengurusan / Farmasi Hospital Lawas)', pageWidth / 2, y + 9.5, { align: 'center' })
  
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y + 13, pageWidth - margin, y + 13)
  
  const sigColY = y + 19
  const sigColW = (pageWidth - (margin * 2)) / 3

  const hasPrepared = !!(penalty.prepared_by_user_id || penalty.prepared_by?.id || (penalty.prepared_by_name && penalty.prepared_by_name !== '' && penalty.prepared_by_name !== ''))
  const hasVerified = !!(penalty.verified_by_user_id || penalty.verified_by?.id || (penalty.verified_by_name && penalty.verified_by_name !== '' && penalty.verified_by_name !== ''))

  const sigConfigs = [
    {
      title: 'Disediakan Oleh :-',
      name: hasPrepared ? String(penalty.prepared_by_name || penalty.prepared_by?.full_name || 'AMRI AMIT') : '',
      designation: hasPrepared ? String(penalty.prepared_by_designation || penalty.prepared_by?.jawatan || 'PENOLONG PEGAWAI FARMASI U5') : '',
      dateStr: hasPrepared ? formatPdfDate(penalty.prepared_at) : '',
      x: margin + 3
    },
    {
      title: 'Disemak Oleh :-',
      name: hasVerified ? String(penalty.verified_by_name || penalty.checked_by_name || penalty.verified_by?.full_name || 'KAMRIAH BT HAJI MAIL') : '',
      designation: hasVerified ? String(penalty.verified_by_designation || penalty.checked_by_designation || penalty.verified_by?.jawatan || 'PENOLONG PEGAWAI FARMASI U7 TBK 2') : '',
      dateStr: hasVerified ? formatPdfDate(penalty.verified_at) : '',
      x: margin + sigColW + 3
    },
    {
      title: 'Disahkan Oleh :-',
      name: hasApproved ? String(penalty.approved_by_name || penalty.approved_by_user?.full_name || 'TAN YUAN ZHANG') : '',
      designation: hasApproved ? String(penalty.approved_by_designation || penalty.approved_by_user?.jawatan || 'PEGAWAI FARMASI UF 12') : '',
      dateStr: hasApproved ? formatPdfDate(penalty.approved_at) : '',
      x: margin + (sigColW * 2) + 3
    }
  ]

  sigConfigs.forEach((cfg) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    doc.text(String(cfg.title), cfg.x, sigColY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('Tandatangan: ...................................', cfg.x, sigColY + 10)
    
    doc.setTextColor(100, 116, 139)
    doc.text('Nama', cfg.x, sigColY + 17)
    doc.text('Jawatan', cfg.x, sigColY + 23)
    doc.text('Tarikh', cfg.x, sigColY + 29)
    
    doc.text(':', cfg.x + 12, sigColY + 17)
    doc.text(':', cfg.x + 12, sigColY + 23)
    doc.text(':', cfg.x + 12, sigColY + 29)
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    
    // Wrapped Name to prevent overlapping
    const wrappedName = doc.splitTextToSize(String(cfg.name).toUpperCase(), 40)
    doc.text(wrappedName, cfg.x + 14, sigColY + 17)
    const nameLinesCount = wrappedName.length
    const nameLastY = sigColY + 17 + (nameLinesCount - 1) * 3.5
    
    // Wrapped Designation underneath the wrapped name dynamically
    doc.setFont('helvetica', 'normal')
    const wrappedDesig = doc.splitTextToSize(String(cfg.designation).toUpperCase(), 40)
    doc.text(wrappedDesig, cfg.x + 14, nameLastY + 6)
    const desigLinesCount = wrappedDesig.length
    const desigLastY = nameLastY + 6 + (desigLinesCount - 1) * 3
    
    // Date underneath the wrapped designation
    doc.text(String(cfg.dateStr), cfg.x + 14, desigLastY + 6)
  })

  // Return the PDF document
  return doc
}
