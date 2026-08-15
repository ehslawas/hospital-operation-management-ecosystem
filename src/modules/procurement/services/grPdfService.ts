// @ts-nocheck
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from '@/lib/utils'
import { GoodsReceiptWithRelations } from '@/types/pharmacy'
import { supabase } from '@/services/supabase'
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

export async function generateGoodsReceiptPdf(gr: GoodsReceiptWithRelations): Promise<void> {
  const doc = new jsPDF()
  const margin = 20
  const pageWidth = 210
  
  // Resolve PO and LPO Numbers properly
  let poNumber = gr.purchase_order?.po_number || '-'
  let lpoNumber = '-'

  if (gr.purchase_order?.lpo && gr.purchase_order.lpo.length > 0) {
    lpoNumber = gr.purchase_order.lpo[0].lpo_number
  } else if (gr.purchase_order?.lpo_number) {
    lpoNumber = gr.purchase_order.lpo_number
  }

  let penalties = (gr as any).penalties || []

  // Try to fetch missing relations directly if needed
  try {
    // 1. Check System A (pharmacy_goods_receipts)
    const { data: grData } = await supabase
      .from('pharmacy_goods_receipts')
      .select(`
        po_id,
        purchase_order:pharmacy_purchase_orders!pharmacy_goods_receipts_po_id_fkey(
          id, 
          po_number, 
          po_type, 
          pharmacy_lpo!pharmacy_lpo_po_id_fkey(id, lpo_number)
        ),
        received_by_user:users!pharmacy_goods_receipts_received_by_fkey(full_name, jawatan),
        inspected_by_user:users!pharmacy_goods_receipts_inspected_by_fkey(full_name, jawatan)
      `)
      .eq('id', gr.id)
      .maybeSingle()
    
    if (grData) {
      const po = grData.purchase_order as any
      const poId = grData.po_id || po?.id
      const lpoId = po?.pharmacy_lpo?.[0]?.id

      if (grData.received_by_user) (gr as any).received_by_user = grData.received_by_user
      if (grData.inspected_by_user) (gr as any).inspected_by_user = grData.inspected_by_user

      if (po) {
        if (po.po_number) poNumber = po.po_number
        if (po.pharmacy_lpo && po.pharmacy_lpo.length > 0) {
          lpoNumber = po.pharmacy_lpo[0].lpo_number
        } else if (po.po_type === 'lpo') {
          lpoNumber = po.po_number || lpoNumber
        }
      }

      // 2. Fetch Penalties using all possible links
      const penaltyFilters = [`gr_id.eq.${gr.id}`]
      if (poId) penaltyFilters.push(`po_id.eq.${poId}`)
      if (lpoId) penaltyFilters.push(`lpo_id.eq.${lpoId}`)

      const { data: pData } = await supabase
        .from('pharmacy_penalties')
        .select('*')
        .or(penaltyFilters.join(','))
      
      if (pData && pData.length > 0) penalties = pData
    } else {
      // 2. Try System B (pharmacy_receiving)
      const { data: recData } = await supabase
        .from('pharmacy_receiving')
        .select(`
          lpo_id,
          received_by_user:users!pharmacy_receiving_received_by_fkey(full_name, jawatan),
          lpo:pharmacy_lpo!pharmacy_receiving_lpo_id_fkey(
            id,
            lpo_number,
            purchase_order:pharmacy_purchase_orders!pharmacy_lpo_po_id_fkey(
              id,
              po_number,
              po_type
            )
          )
        `)
        .eq('id', gr.id)
        .maybeSingle()

      if (recData) {
        if (recData.received_by_user) (gr as any).received_by_user = recData.received_by_user
        
        const lpo = recData.lpo as any
        const po = lpo?.purchase_order
        const poId = po?.id
        const lpoId = lpo?.id

        if (po) {
          poNumber = po.po_number || '-'
          if (lpo?.lpo_number) lpoNumber = lpo.lpo_number
        }

        // Fetch Penalties for System B
        const penaltyFilters = [`receiving_id.eq.${gr.id}`]
        if (poId) penaltyFilters.push(`po_id.eq.${poId}`)
        if (lpoId) penaltyFilters.push(`lpo_id.eq.${lpoId}`)

        const { data: pData } = await supabase
          .from('pharmacy_penalties')
          .select('*')
          .or(penaltyFilters.join(','))
        
        if (pData && pData.length > 0) penalties = pData
      }
    }
  } catch(e) {
    console.warn('Could not fetch additional GR data for PDF', e)
  }
  
  // 1. Header
  await drawHospitalHeader(doc, { margin: 20, startY: 10 })
  
  // Title
  doc.setFontSize(16)
  doc.text("NOTA TERIMAAN BARANG (GRN)", pageWidth / 2, 42, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text("(GOODS RECEIPT NOTE)", pageWidth / 2, 47, { align: 'center' })
  
  let currentY = 58
  
  // 2. Info Grid (Formal Table Style)
  doc.setLineWidth(0.1)
  doc.setDrawColor(200, 200, 200)
  
  // Left Column Labels
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text("NO. PENERIMAAN:", margin, currentY)
  doc.text("TARIKH TERIMAAN:", margin, currentY + 7)
  doc.text("NO. INVOIS:", margin, currentY + 14)
  doc.text("DELIVERY ORDER NO. (DO):", margin, currentY + 21)
  
  doc.setFont('helvetica', 'normal')
  doc.text(String(gr.gr_number || '-'), margin + 40, currentY)
  doc.text(String(formatDate(gr.receipt_date)), margin + 40, currentY + 7)
  doc.text(String(gr.invoice_number || '-'), margin + 40, currentY + 14)
  doc.text(String(gr.delivery_note_number || '-'), margin + 40, currentY + 21)
  
  // Right Column Labels
  const rightColX = pageWidth / 2 + 5
  doc.setFont('helvetica', 'bold')
  doc.text("NO. PESANAN (PO):", rightColX, currentY)
  doc.text("NO. LPO:", rightColX, currentY + 7)
  doc.text("STATUS:", rightColX, currentY + 14)
  doc.text("DISEDIAKAN OLEH:", rightColX, currentY + 21)
  
  doc.setFont('helvetica', 'normal')
  doc.text(String(poNumber), rightColX + 35, currentY)
  doc.text(String(lpoNumber), rightColX + 35, currentY + 7)
  doc.text(String(gr.status.toUpperCase()), rightColX + 35, currentY + 14)
  doc.text(String(gr.received_by_user?.full_name || 'System'), rightColX + 35, currentY + 21)

  currentY += 32

  // 3. Items Table
  const poType = gr.purchase_order?.po_type?.toLowerCase() || ''
  const isDrug = poType.includes('drug') || gr.items?.some(i => i.po_item?.category?.toLowerCase().includes('drug'))
  const sectionTitle = isDrug ? "MAKLUMAT BEKALAN UBAT-UBATAN (DRUG)" : "MAKLUMAT BEKALAN BUKAN UBAT (NON-DRUG)"

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(sectionTitle, margin, currentY)
  
  currentY += 4

  const tableData = gr.items?.map((item, idx) => {
    return [
      idx + 1,
      item.po_item?.item_name || item.item_id || item.po_item_id,
      item.po_item?.item_code || '-',
      item.quantity_received.toString(),
      item.batch_number || '-',
      item.expiry_date ? formatDate(item.expiry_date) : '-',
      item.disposition.toUpperCase(),
    ]
  }) || []

  autoTable(doc, {
    startY: currentY,
    head: [['No.', 'Nama Barangan', 'Kod', 'Kuantiti', 'Batch', 'Luput', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 28 },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
    }
  })

  currentY = (doc as any).lastAutoTable.finalY + 12

  // 4. Penalty Section (NEW)
  if (penalties.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(185, 28, 28) // red-700
    doc.text("MAKLUMAT DENDA (PENALTY)", margin, currentY)
    
    currentY += 4
    
    const penaltyData = penalties.map((p: any) => [
      p.penalty_type?.toUpperCase() || 'KELEWATAN',
      p.days_delayed ? `${p.days_delayed} Hari` : (p.days_late ? `${p.days_late} Hari` : '-'),
      p.reason || p.notes || 'Penyerahan lewat daripada tarikh jangkaan.'
    ])
    
    autoTable(doc, {
      startY: currentY,
      head: [['Jenis Denda', 'Tempoh Kelewatan', 'Sebab/Catatan']],
      body: penaltyData,
      theme: 'grid',
      headStyles: { fillColor: [254, 242, 242], textColor: [153, 27, 27], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        1: { cellWidth: 40, halign: 'center', fontStyle: 'bold' }
      }
    })
    
    currentY = (doc as any).lastAutoTable.finalY + 15
  } else {
    currentY += 5
  }

  // 5. Signatures
  if (currentY > 230) {
    doc.addPage()
    currentY = 40
  }

  const sigBoxWidth = 75
  
  // Left Box
  doc.setDrawColor(0, 0, 0)
  doc.rect(margin, currentY, sigBoxWidth, 45)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text("DITERIMA & DISEMAK OLEH:", margin + 3, currentY + 8)
  
  doc.line(margin + 5, currentY + 32, margin + sigBoxWidth - 5, currentY + 32)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text("Tandatangan & Cop Jawatan", margin + 5, currentY + 37)
  doc.text("Tarikh:", margin + 5, currentY + 42)
  
  if (gr.received_by_user) {
    doc.setFont('helvetica', 'bold')
    doc.text(String(gr.received_by_user.full_name.toUpperCase()), margin + 5, currentY + 27)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(String((gr.received_by_user as any).jawatan || ''), margin + 5, currentY + 31)
  }

  // Right Box
  const verifyX = pageWidth - margin - sigBoxWidth
  doc.rect(verifyX, currentY, sigBoxWidth, 45)
  doc.setFont('helvetica', 'bold')
  doc.text("DISAHKAN OLEH (PEGAWAI FARMASI):", verifyX + 3, currentY + 8)
  
  doc.line(verifyX + 5, currentY + 32, verifyX + sigBoxWidth - 5, currentY + 32)
  doc.setFont('helvetica', 'normal')
  doc.text("Tandatangan & Cop Jawatan", verifyX + 5, currentY + 37)
  doc.text("Tarikh:", verifyX + 5, currentY + 42)
  
  if (gr.inspected_by_user) {
    doc.setFont('helvetica', 'bold')
    doc.text(String(gr.inspected_by_user.full_name.toUpperCase()), verifyX + 5, currentY + 27)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(String((gr.inspected_by_user as any).jawatan || ''), verifyX + 5, currentY + 31)
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `DOKUMEN INI DIJANA SECARA KOMPUTER. TIDAK MEMERLUKAN TANDATANGAN MANUVAL KECUALI UNTUK PENGESAHAN PENERIMAAN.`,
      pageWidth / 2,
      282,
      { align: 'center' }
    )
    doc.text(
      `Dicetak pada ${formatDate(new Date().toISOString())} â€¢ Mukasurat ${i} dari ${pageCount}`,
      pageWidth / 2,
      287,
      { align: 'center' }
    )
  }

  doc.save(`GRN_${gr.gr_number || gr.id.substring(0, 8)}.pdf`)
}
