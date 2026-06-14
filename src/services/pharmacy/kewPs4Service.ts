import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ItemMovementWithRelations } from './itemMovementService'

interface KEWPS4Data {
    itemName: string
    itemCode: string
    uom: string
    location: string
    movements: ItemMovementWithRelations[]
    generatedBy: string
}

/**
 * Generate KEW.PS-4 (Kad Kawalan Stok / Kad Petak) PDF
 * This is a standard government form for inventory control.
 */
export const generateKEWPS4 = (data: KEWPS4Data) => {
    const doc = new jsPDF()
    const timestamp = new Date().toLocaleString('en-GB')
    const pageWidth = doc.internal.pageSize.width

    // ==========================================
    // 1. OFFICIAL HEADER
    // ==========================================
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.text('KERAJAAN MALAYSIA', pageWidth - 15, 12, { align: 'right' })
    doc.text('KEW.PS-4', pageWidth - 15, 17, { align: 'right' })

    doc.setFontSize(12)
    doc.text('KAD KAWALAN STOK (KAD PETAK)', pageWidth / 2, 25, { align: 'center' })
    doc.setFontSize(10)
    doc.text('(Perbekalan / Farmasi)', pageWidth / 2, 30, { align: 'center' })

    // ==========================================
    // 2. ITEM INFORMATION SECTION
    // ==========================================
    doc.setDrawColor(0)
    doc.setLineWidth(0.2)

    // Top Info Box
    doc.rect(15, 35, 180, 20)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Nama Barang:', 18, 42)
    doc.setFont('helvetica', 'normal')
    doc.text(data.itemName.toUpperCase(), 45, 42)

    doc.setFont('helvetica', 'bold')
    doc.text('No. Kod:', 18, 48)
    doc.setFont('helvetica', 'normal')
    doc.text(data.itemCode, 45, 48)

    doc.setFont('helvetica', 'bold')
    doc.text('Unit Pengukuran:', 110, 48)
    doc.setFont('helvetica', 'normal')
    doc.text(data.uom || 'UNIT', 140, 48)

    doc.setFont('helvetica', 'bold')
    doc.text('Lokasi:', 18, 53)
    doc.setFont('helvetica', 'normal')
    doc.text(data.location || 'UTAMA', 45, 53)

    // ==========================================
    // 3. MOVEMENTS TABLE WITH RUNNING BALANCE
    // ==========================================

    // Sort movements by date ascending to calculate balances accurately
    const sortedMoves = [...data.movements].sort((a, b) =>
        new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime()
    )

    let currentBalance = 0
    const tableData = sortedMoves.map((move) => {
        const qty = move.quantity || 1
        let received = '-'
        let issued = '-'

        if (move.movement_type === 'received' || move.movement_type === 'registered' || move.movement_type === 'returned_from_dept') {
            received = qty.toString()
            currentBalance += qty
        } else if (move.movement_type === 'issued' || move.movement_type === 'consumed' || move.movement_type === 'returned_to_supplier' || move.movement_type === 'disposed') {
            issued = qty.toString()
            currentBalance -= qty
        }

        return [
            new Date(move.performed_at).toLocaleDateString('en-GB'),
            move.source_document_number || 'REGISTRATION',
            received,
            issued,
            currentBalance.toString(),
            move.performer?.full_name || move.performer?.email || '-',
            move.remarks || (move.scan_method === 'qr' ? '✓ Physical Scan' : '')
        ]
    })

    autoTable(doc, {
        startY: 60,
        head: [['Tarikh', 'No. Rujukan', 'Kuantiti Terima', 'Kuantiti Keluar', 'Baki', 'Tandatangan', 'Catatan']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: 0,
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.1
        },
        bodyStyles: {
            fontSize: 8,
            textColor: 50
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { halign: 'center', cellWidth: 35 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
            5: { halign: 'center', cellWidth: 30 },
            6: { halign: 'left' }
        },
        styles: {
            font: 'helvetica',
            lineColor: [0, 0, 0],
            lineWidth: 0.1
        }
    })

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    const pageHeight = doc.internal.pageSize.height

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Dijana melalui Sistem HospOS oleh ${data.generatedBy} pada ${timestamp}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        doc.text(`Muka Surat ${i} daripada ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' })
    }

    doc.save(`KEW.PS-4_${data.itemCode}_${Date.now()}.pdf`)
}
