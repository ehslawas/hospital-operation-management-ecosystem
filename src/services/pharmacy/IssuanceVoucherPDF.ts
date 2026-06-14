import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface IssuanceVoucherData {
    voucher_number: string;
    to_department: string;
    date: string;
    items: Array<{
        name: string;
        code: string;
        batch: string;
        expiry: string;
        quantity: number;
        unit: string;
    }>;
    issued_by: string;
}

export const generateIssuanceVoucherPDF = (data: IssuanceVoucherData) => {
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
    doc.text('BAUCER PENYERAHAN STOK (ISSUANCE VOUCHER)', pageWidth / 2, 32, { align: 'center' })

    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.line(15, 38, 195, 38)

    // ==========================================
    // 2. METADATA
    // ==========================================
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    doc.setFont('helvetica', 'bold')
    doc.text('No. Baucer:', 15, 48)
    doc.setFont('helvetica', 'normal')
    doc.text(data.voucher_number, 45, 48)

    doc.setFont('helvetica', 'bold')
    doc.text('Tarikh Serahan:', 130, 48)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(data.date).toLocaleDateString('en-GB'), 160, 48)

    doc.setFont('helvetica', 'bold')
    doc.text('Unit Penerima:', 15, 54)
    doc.setFont('helvetica', 'normal')
    doc.text(data.to_department.toUpperCase(), 45, 54)

    // ==========================================
    // 3. ITEMS TABLE
    // ==========================================
    const tableData = data.items.map((item, index) => [
        index + 1,
        item.name,
        item.code,
        item.batch || 'N/A',
        item.expiry || 'N/A',
        item.quantity,
        item.unit || 'UNIT'
    ])

    autoTable(doc, {
        startY: 65,
        head: [['Bil', 'Perihal Item', 'Kod Item', 'No. Batch', 'Tarikh Luput', 'Kuantiti', 'Unit']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 41, 59],
            textColor: 255,
            fontSize: 8,
            halign: 'center'
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            5: { halign: 'center', cellWidth: 20 },
            6: { halign: 'center', cellWidth: 15 }
        }
    })

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 15

    // ==========================================
    // 4. SIGNATURES
    // ==========================================
    const sigY = finalY < 230 ? finalY : 20
    if (sigY === 20) doc.addPage()

    doc.setFont('helvetica', 'bold')
    doc.text('DISERAH OLEH:', 15, sigY)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nama: ${data.issued_by}`, 15, sigY + 20)
    doc.line(15, sigY + 18, 70, sigY + 18)

    doc.setFont('helvetica', 'bold')
    doc.text('DITERIMA OLEH:', 130, sigY)
    doc.setFont('helvetica', 'normal')
    doc.text('Nama: ................................', 130, sigY + 20)
    doc.line(130, sigY + 18, 185, sigY + 18)

    // Footer
    const ph = doc.internal.pageSize.height
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Dijana melalui Sistem HospOS pada ${timestamp}`, pageWidth / 2, ph - 10, { align: 'center' })

    doc.save(`Issuance_Voucher_${data.voucher_number}.pdf`)
}
