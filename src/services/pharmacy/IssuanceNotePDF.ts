import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface IssuanceNoteData {
    dept_name: string
    requester: string
    issuer: string
    date: string
    cylinders: string[]
    requestId?: string
}

export const generateIssuanceNotePDF = (data: IssuanceNoteData) => {
    const doc = new jsPDF()
    const timestamp = new Date().toLocaleString('en-GB')

    // ==========================================
    // 1. OFFICIAL HEADER
    // ==========================================
    const pageWidth = doc.internal.pageSize.width

    // Logo placeholder logic would go here (omitted for now)

    doc.setFont('times', 'bold') // Serif font for official gov feel
    doc.setFontSize(14)
    doc.text('KERAJAAN MALAYSIA', pageWidth / 2, 15, { align: 'center' })
    doc.text('KEMENTERIAN KESIHATAN MALAYSIA', pageWidth / 2, 21, { align: 'center' })

    doc.setFont('helvetica', 'bold') // Clean sans-serif for form title
    doc.setFontSize(16)
    doc.text('NOTA SERAHAN SILINDER OKSIGEN', pageWidth / 2, 32, { align: 'center' })

    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100)
    doc.text('(Borang KEW.PS-11 / Setara)', pageWidth / 2, 37, { align: 'center' })
    doc.setTextColor(0) // Reset black

    // Decorative Line
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.line(15, 42, 195, 42)
    doc.setLineWidth(0.1)

    // ==========================================
    // 2. METADATA SECTION
    // ==========================================
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    const todayStr = new Date(data.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const refNo = data.requestId || 'MANUAL-' + Date.now().toString().slice(-6)

    // Layout: Ref No (Left) | Date (Right)
    doc.text(`No. Rujukan: ${refNo}`, 15, 52)
    doc.text(`Tarikh: ${todayStr}`, 195, 52, { align: 'right' })

    // Recipient Box (Modern Touch)
    doc.setFillColor(248, 250, 252) // Very light gray bg
    doc.setDrawColor(226, 232, 240)
    doc.rect(15, 58, 180, 18, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105) // Slate-600
    doc.text('Maklumat Jabatan/Unit Penerima:', 20, 65)

    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(data.dept_name.toUpperCase(), 20, 72)

    // ==========================================
    // 3. CYLINDER TABLE
    // ==========================================
    const tableData = data.cylinders.map((qr, index) => [
        index + 1,
        'OKSIGEN PERUBATAN',
        qr,
        '1 UNIT',
        'BAIK'
    ])

    autoTable(doc, {
        startY: 85,
        head: [['Bil', 'Perihal Item', 'No. Siri / QR Code', 'Kuantiti', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 41, 59], // Slate-800 branding
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 4
        },
        bodyStyles: {
            textColor: [51, 65, 85],
            fontSize: 9,
            cellPadding: 4
        },
        alternateRowStyles: {
            fillColor: [241, 245, 249] // Slate-100 striping
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 30 },
            4: { halign: 'center', cellWidth: 30 },
        },
        styles: {
            lineColor: [203, 213, 225],
            lineWidth: 0.1
        }
    })

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 15

    // ==========================================
    // 4. SIGNATURE SECTION (3-COLUMN MODERN)
    // ==========================================
    // We ensure the block doesn't break page, or start new page if low space
    const signatureY = finalY < 230 ? finalY : 20
    if (signatureY === 20) doc.addPage()

    const colWidth = 55
    const gap = 5
    const startX = 15

    // Helper for columns
    const drawSignatureBlock = (x: number, title: string, role: string, nameVal: string, dateVal: string, isManual = false) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(0)
        doc.text(title, x, signatureY)

        // Dashed Box area for signature feel
        doc.setDrawColor(150)
        doc.setLineWidth(0.1)
        doc.setLineDashPattern([1, 1], 0)
        doc.line(x, signatureY + 25, x + colWidth, signatureY + 25)
        doc.setLineDashPattern([], 0) // Reset size

        doc.setFontSize(8)
        doc.setTextColor(100)
        doc.text('(Tandatangan & Cop Rasmi)', x + (colWidth / 2), signatureY + 29, { align: 'center' })

        // Details
        doc.setTextColor(0)
        doc.setFont('helvetica', 'normal')

        // Name Field
        doc.text('Nama:', x, signatureY + 40)
        if (isManual) {
            doc.text('......................................................', x + 12, signatureY + 40)
        } else {
            doc.setFont('helvetica', 'bold')
            doc.text(nameVal.toUpperCase(), x + 12, signatureY + 40)
            doc.setFont('helvetica', 'normal')
        }

        // Role Field
        doc.text(role, x, signatureY + 48)
        doc.text('......................................................', x + 15, signatureY + 48)

        // Date Field
        doc.text('Tarikh:', x, signatureY + 56)
        if (isManual) {
            doc.text('......................................................', x + 12, signatureY + 56)
        } else {
            doc.text(todayStr, x + 12, signatureY + 56)
        }
    }

    // Col 1: Pemohon (Requester)
    drawSignatureBlock(startX, 'PEMOHON:', 'Jawatan:', data.requester, todayStr, false)

    // Col 2: Pengeluar (Issuer) - Center
    drawSignatureBlock(startX + colWidth + gap + 5, 'PENGELUAR (ISSUER):', 'Jawatan:', data.issuer, todayStr, false)

    // Col 3: Pegawai Pelulus - Right
    drawSignatureBlock(startX + (colWidth + gap + 5) * 2, 'PEGAWAI PELULUS:', 'Jawatan:', '', '', true)

    // ==========================================
    // 5. FOOTER
    // ==========================================
    const pageHeight = doc.internal.pageSize.height
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Dokumen ini dijana secara digital melalui Sistem HospOS pada ${timestamp}.`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    doc.text(`ID Rujukan Unik: ${refNo}`, pageWidth / 2, pageHeight - 7, { align: 'center' })

    doc.save(`Issuance_Note_${refNo}.pdf`)
}
