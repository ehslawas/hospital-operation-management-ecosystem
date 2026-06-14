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

    // 1. Header with Jata Negara (Simulated with Text Placeholder for now, or Image if available)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('KERAJAAN MALAYSIA', 105, 15, { align: 'center' })
    doc.text('KEMENTERIAN KESIHATAN MALAYSIA', 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.text('NOTA SERAHAN SILINDER OKSIGEN', 105, 30, { align: 'center' })
    doc.setFontSize(8)
    doc.text('(Borang KEW.PS-11 / Setara)', 105, 35, { align: 'center' })

    // 2. Metadata Block
    doc.setDrawColor(200)
    doc.line(15, 40, 195, 40)

    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`No. Rujukan: ${data.requestId || 'MANUAL-' + Date.now().toString().slice(-6)}`, 15, 48)
    doc.text(`Tarikh: ${new Date(data.date).toLocaleDateString('en-GB')}`, 155, 48)

    doc.setFont('Helvetica', 'bold')
    doc.text('Maklumat Jabatan/Unit Penerima:', 15, 58)
    doc.setFont('Helvetica', 'normal')
    doc.text(`${data.dept_name.toUpperCase()}`, 15, 63)

    // 3. Cylinder Table
    const tableData = data.cylinders.map((qr, index) => [
        index + 1,
        'OKSIGEN PERUBATAN',
        qr,
        '1 UNIT',
        'BAIK'
    ])

    autoTable(doc, {
        startY: 70,
        head: [['Bil', 'Perihal Item', 'No. Siri / QR Code', 'Kuantiti', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [31, 41, 55],
            textColor: [255, 255, 255],
            fontSize: 9,
            halign: 'center'
        },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 30 },
            4: { halign: 'center', cellWidth: 25 },
        }
    })

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 20

    // 4. Verification/Signature Section
    doc.setFontSize(9)
    doc.setFont('Helvetica', 'bold')
    doc.text('PENGELUAR (ISSUER)', 15, finalY)
    doc.text('PENERIMA (REQUESTER)', 110, finalY)

    doc.setFont('Helvetica', 'normal')
    doc.line(15, finalY + 15, 80, finalY + 15)
    doc.line(110, finalY + 15, 175, finalY + 15)

    doc.text(`Nama: ${data.issuer}`, 15, finalY + 20)
    doc.text(`Nama: ${data.requester}`, 110, finalY + 20)

    doc.text(`Tarikh: ${new Date(data.date).toLocaleDateString('en-GB')}`, 15, finalY + 25)
    doc.text(`Tarikh: ${new Date(data.date).toLocaleDateString('en-GB')}`, 110, finalY + 25)

    // Footer
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Dokumen ini dijana secara digital pada ${timestamp}. Tiada tandatangan diperlukan.`, 105, 285, { align: 'center' })

    doc.save(`Issuance_Note_${data.requestId || 'Manual'}.pdf`)
}
