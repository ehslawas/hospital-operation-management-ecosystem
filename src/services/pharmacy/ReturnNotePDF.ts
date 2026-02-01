import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ReturnNoteData {
    return_number: string;
    loan_number: string;
    return_date: string;
    recorded_by: string;
    items: Array<{
        name: string;
        code: string;
        quantity_loaned: number;
        quantity_returned: number;
        unit: string;
    }>;
    notes?: string;
}

export const generateReturnNotePDF = (data: ReturnNoteData) => {
    const doc = new jsPDF()
    const timestamp = new Date().toLocaleString('en-GB')
    const pageWidth = doc.internal.pageSize.width

    // ==========================================
    // 1. OFFICIAL HEADER
    // ==========================================
    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.text('KERAJAAN MALAYSIA', pageWidth / 2, 15, { align: 'center' })
    doc.text('KEMENTERIAN KESIHATAN MALAYSIA', pageWidth / 2, 21, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('NOTA PEMULANGAN BEKALAN PINJAMAN', pageWidth / 2, 32, { align: 'center' })

    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.line(15, 38, 195, 38)

    // ==========================================
    // 2. METADATA
    // ==========================================
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    doc.setFont('helvetica', 'bold')
    doc.text('No. Pemulangan:', 15, 48)
    doc.setFont('helvetica', 'normal')
    doc.text(data.return_number, 45, 48)

    doc.setFont('helvetica', 'bold')
    doc.text('No. Pinjaman Asal:', 15, 54)
    doc.setFont('helvetica', 'normal')
    doc.text(data.loan_number, 45, 54)

    doc.setFont('helvetica', 'bold')
    doc.text('Tarikh Pulang:', 130, 48)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(data.return_date).toLocaleDateString('en-GB'), 160, 48)

    // ==========================================
    // 3. ITEMS TABLE
    // ==========================================
    const tableData = data.items.map((item, index) => [
        index + 1,
        item.name,
        item.code,
        item.quantity_loaned,
        item.quantity_returned,
        item.unit || 'UNIT'
    ])

    autoTable(doc, {
        startY: 65,
        head: [['Bil', 'Perihal Item', 'Kod Item', 'Jum. Pinjam', 'Jum. Pulang', 'Unit']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [5, 150, 105], // Green-600 for returns
            textColor: 255,
            fontSize: 9,
            halign: 'center'
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            3: { halign: 'center', cellWidth: 25 },
            4: { halign: 'center', cellWidth: 25 },
            5: { halign: 'center', cellWidth: 15 }
        }
    })

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 15

    if (data.notes) {
        doc.setFont('helvetica', 'bold')
        doc.text('Nota/Catatan:', 15, finalY)
        doc.setFont('helvetica', 'normal')
        doc.text(data.notes, 15, finalY + 5, { maxWidth: 180 })
    }

    // ==========================================
    // 4. SIGNATURES
    // ==========================================
    const sigY = (data.notes ? finalY + 25 : finalY + 15)
    doc.setFont('helvetica', 'bold')
    doc.text('DIREKOD OLEH:', 15, sigY)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nama: ${data.recorded_by}`, 15, sigY + 20)
    doc.text('Tarikh: ................................', 15, sigY + 25)

    doc.setFont('helvetica', 'bold')
    doc.text('PENGESAHAN PENERIMA:', 130, sigY)
    doc.setFont('helvetica', 'normal')
    doc.text('Nama: ................................', 130, sigY + 20)
    doc.text('Tarikh: ................................', 130, sigY + 25)

    // Footer
    const ph = doc.internal.pageSize.height
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Dijana oleh HospOS Distribution System pada ${timestamp}`, pageWidth / 2, ph - 10, { align: 'center' })

    doc.save(`Return_Note_${data.return_number}.pdf`)
}
