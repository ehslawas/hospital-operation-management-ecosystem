import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface TransferNoteData {
    transfer_number: string;
    from_dept: string;
    to_dept: string;
    requested_by: string;
    request_date: string;
    approved_by?: string;
    approved_date?: string;
    priority: string;
    notes?: string;
    items: Array<{
        name: string;
        code: string;
        requested_qty: number;
        approved_qty: number;
        unit: string;
    }>;
}

export const generateTransferNotePDF = (data: TransferNoteData) => {
    const doc = new jsPDF()
    const timestamp = new Date().toLocaleString('en-GB')
    const pageWidth = doc.internal.pageSize.width

    // ==========================================
    // 1. OFFICIAL HEADER (Malaysia Government Style)
    // ==========================================
    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.text('KERAJAAN MALAYSIA', pageWidth / 2, 15, { align: 'center' })
    doc.text('KEMENTERIAN KESIHATAN MALAYSIA', pageWidth / 2, 21, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('NOTA PEMINDAHAN STOK', pageWidth / 2, 32, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100)
    doc.text('(Borang KEW.PS-11)', pageWidth / 2, 37, { align: 'center' })
    doc.setTextColor(0)

    // Decorative Line
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.line(15, 42, 195, 42)

    // ==========================================
    // 2. METADATA SECTION
    // ==========================================
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    const dateStr = new Date(data.request_date).toLocaleDateString('en-GB')

    // Left Column
    doc.setFont('helvetica', 'bold')
    doc.text('No. Pemindahan:', 15, 52)
    doc.setFont('helvetica', 'normal')
    doc.text(data.transfer_number, 45, 52)

    doc.setFont('helvetica', 'bold')
    doc.text('Dari Unit:', 15, 58)
    doc.setFont('helvetica', 'normal')
    doc.text(data.from_dept.toUpperCase(), 45, 58)

    doc.setFont('helvetica', 'bold')
    doc.text('Ke Unit:', 15, 64)
    doc.setFont('helvetica', 'normal')
    doc.text(data.to_dept.toUpperCase(), 45, 64)

    // Right Column
    doc.setFont('helvetica', 'bold')
    doc.text('Tarikh Permohonan:', 130, 52)
    doc.setFont('helvetica', 'normal')
    doc.text(dateStr, 165, 52)

    doc.setFont('helvetica', 'bold')
    doc.text('Prioriti:', 130, 58)
    doc.setFont('helvetica', 'normal')
    doc.text(data.priority.toUpperCase(), 165, 58)

    // ==========================================
    // 3. ITEMS TABLE
    // ==========================================
    const tableData = data.items.map((item, index) => [
        index + 1,
        item.name,
        item.code,
        item.requested_qty,
        item.approved_qty,
        item.unit || 'UNIT'
    ])

    autoTable(doc, {
        startY: 72,
        head: [['Bil', 'Perihal Item', 'Kod Item', 'Kuantiti Mohon', 'Kuantiti Dilulus', 'Unit']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [51, 65, 85],
            textColor: 255,
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            3: { halign: 'center', cellWidth: 25 },
            4: { halign: 'center', cellWidth: 25 },
            5: { halign: 'center', cellWidth: 20 }
        }
    })

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 15

    // ==========================================
    // 4. SIGNATURES
    // ==========================================
    const signatureY = finalY < 230 ? finalY : 20
    if (signatureY === 20) doc.addPage()

    const colWidth = 55
    const gap = 15
    const startX = 15

    const drawLine = (x: number, y: number) => {
        doc.setDrawColor(200)
        doc.line(x, y + 20, x + colWidth, y + 20)
    }

    doc.setFontSize(8)

    // Col 1: Pemohon
    doc.setFont('helvetica', 'bold')
    doc.text('PEMOHON:', startX, signatureY)
    drawLine(startX, signatureY)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nama: ${data.requested_by}`, startX, signatureY + 25)
    doc.text(`Tarikh: ${dateStr}`, startX, signatureY + 30)

    // Col 2: Pelulus
    doc.setFont('helvetica', 'bold')
    doc.text('PELULUS:', startX + colWidth + gap, signatureY)
    drawLine(startX + colWidth + gap, signatureY)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nama: ${data.approved_by || '................................'}`, startX + colWidth + gap, signatureY + 25)
    doc.text(`Tarikh: ${data.approved_date ? new Date(data.approved_date).toLocaleDateString('en-GB') : '................................'}`, startX + colWidth + gap, signatureY + 30)

    // Col 3: Penerima
    doc.setFont('helvetica', 'bold')
    doc.text('PENERIMA:', startX + (colWidth + gap) * 2, signatureY)
    drawLine(startX + (colWidth + gap) * 2, signatureY)
    doc.setFont('helvetica', 'normal')
    doc.text('Nama: ................................', startX + (colWidth + gap) * 2, signatureY + 25)
    doc.text('Tarikh: ................................', startX + (colWidth + gap) * 2, signatureY + 30)

    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Dijana melalui Sistem HospOS pada ${timestamp}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    doc.save(`Transfer_Note_${data.transfer_number}.pdf`)
}
