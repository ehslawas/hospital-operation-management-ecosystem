import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface LoanFormData {
    loan_number: string;
    loan_type: 'borrowed' | 'lent';
    loan_date: string;
    counterparty_name: string;
    counterparty_type: string;
    created_by: string;
    items: Array<{
        name: string;
        code: string;
        quantity: number;
        unit: string;
    }>;
}

export const generateLoanFormPDF = (data: LoanFormData) => {
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
    const title = data.loan_type === 'borrowed' ? 'BORANG PERMOHONAN PINJAMAN BEKALAN' : 'BORANG PINJAMAN BEKALAN (DIKELUARKAN)';
    doc.text(title, pageWidth / 2, 32, { align: 'center' })

    // Decorative Line
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.line(15, 40, 195, 40)

    // ==========================================
    // 2. METADATA SECTION
    // ==========================================
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    const dateStr = new Date(data.loan_date).toLocaleDateString('en-GB')

    doc.setFont('helvetica', 'bold')
    doc.text('No. Rujukan:', 15, 50)
    doc.setFont('helvetica', 'normal')
    doc.text(data.loan_number, 40, 50)

    doc.setFont('helvetica', 'bold')
    doc.text('Tarikh:', 130, 50)
    doc.setFont('helvetica', 'normal')
    doc.text(dateStr, 160, 50)

    // Recipient/Source Box
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.rect(15, 55, 180, 20, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.text(data.loan_type === 'borrowed' ? 'Sumber Bekalan (Dari):' : 'Penerima Pinjaman (Ke):', 20, 62)
    doc.text(data.counterparty_name.toUpperCase(), 20, 69)
    doc.setFontSize(8)
    doc.text(`Kategori: ${data.counterparty_type}`, 20, 73)

    // ==========================================
    // 3. ITEMS TABLE
    // ==========================================
    const tableData = data.items.map((item, index) => [
        index + 1,
        item.name,
        item.code,
        item.quantity,
        item.unit || 'UNIT'
    ])

    autoTable(doc, {
        startY: 80,
        head: [['Bil', 'Perihal Item', 'Kod Item', 'Kuantiti Pinjaman', 'Unit']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 41, 59],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 9
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 40 },
            4: { halign: 'center', cellWidth: 30 }
        }
    })

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 20

    // ==========================================
    // 4. AUTHORIZATION
    // ==========================================
    const startY = finalY < 230 ? finalY : 20
    if (startY === 20) doc.addPage()

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('PERAKUAN PEGAWAI:', 15, startY)

    doc.setFont('helvetica', 'normal')
    doc.text('Saya dengan ini mengesahkan bahawa bekalan di atas adalah diperlukan untuk kegunaan mendesak/stok minima.', 15, startY + 7)

    doc.line(15, startY + 30, 70, startY + 30)
    doc.text('(Tandatangan Pegawai)', 15, startY + 35)
    doc.text(`Nama: ${data.created_by}`, 15, startY + 42)
    doc.text(`Jawatan: ................................`, 15, startY + 47)

    doc.line(130, startY + 30, 185, startY + 30)
    doc.text('(Tandatangan Ketua Unit)', 130, startY + 35)
    doc.text('Tarikh: ................................', 130, startY + 42)

    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Dokumen digital ini tidak memerlukan tandatangan jika dijana secara rasmi oleh Sistem HospOS pada ${timestamp}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    doc.save(`Loan_Form_${data.loan_number}.pdf`)
}
