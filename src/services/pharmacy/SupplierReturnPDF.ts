import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatDate } from '@/lib/utils'

interface SupplierReturnForm {
    vendor_name: string
    driver_name?: string
    vehicle_no?: string
    return_date: string
}

/**
 * Generates a professional Malaysian Government-standard cylinder return manifest
 * based on the "BORANG PESANAN GAS PERUBATAN DAN PENGELUARAN SILINDER" template.
 */
export const generateSupplierReturnPDF = (items: any[], form: SupplierReturnForm, user: any) => {
    const doc = new jsPDF()
    const timestamp = new Date().toLocaleString('en-GB')
    const hospitalName = "HOSPITAL DAERAH LAWAS"
    const hospitalAddress = "98850, LAWAS, SARAWAK."
    const hospitalContact = "TEL: 085-284384  FAX: 085-283270"

    // 1. MAIN TITLE
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(10)
    doc.text("BORANG PESANAN GAS PERUBATAN DAN PENGELUARAN SILINDER", 105, 10, { align: 'center' })

    // Draw Top Table Border
    doc.setLineWidth(0.5)
    doc.line(10, 12, 200, 12) // Top border

    // 2. DARIPADA / KEPADA BOXES
    doc.setFontSize(8)
    // Box for DARIPADA
    doc.rect(10, 12, 95, 25) // Left box
    doc.text("DARIPADA:", 11, 16)
    doc.text(hospitalName, 35, 16)
    doc.setFont('Helvetica', 'normal')
    doc.text(hospitalAddress, 35, 21)
    doc.text(hospitalContact, 35, 26)

    // Box for KEPADA
    doc.setFont('Helvetica', 'bold')
    doc.rect(105, 12, 95, 25) // Right box
    doc.text("KEPADA:", 106, 16)
    doc.text(form.vendor_name.toUpperCase(), 125, 16)
    doc.setFont('Helvetica', 'normal')
    doc.text("ALAMAT PEMBEKAL BERDAFTAR", 125, 21) // Placeholder if no address

    // 3. REF NUMBERS
    doc.setFont('Helvetica', 'bold')
    doc.rect(10, 37, 95, 10) // Left bottom box
    doc.text("NO. PEMESANAN:", 11, 43)
    doc.text(`VRET-${Date.now().toString().slice(-6)}`, 45, 43)

    doc.rect(105, 37, 95, 10) // Right bottom box
    doc.text("NO. PESANAN KERAJAAN:", 106, 43)
    doc.text("-", 155, 43) // Placeholder

    // 4. MAIN MANIFEST TABLE - GRID STYLE
    // We group by size as requested
    const sizes = [...new Set(items.map(i => i.size_info?.code || 'Unknown'))]

    const rows: any[] = []
    sizes.forEach(size => {
        const sizeItems = items.filter(i => (i.size_info?.code || 'Unknown') === size)

        // Split QR codes into groups of 5 for grid-like layout in rows
        for (let i = 0; i < sizeItems.length; i += 5) {
            const chunk = sizeItems.slice(i, i + 5)
            const rowArr = new Array(5).fill('')
            chunk.forEach((it, idx) => {
                rowArr[idx] = it.qr_code
            })

            rows.push([
                i === 0 ? `${size}\n(Medical Oxygen)` : '', // Only show size name on first sub-row
                ...rowArr,
                chunk.length, // Qty Sent
                '' // Qty Received (Empty)
            ])
        }
    })

    const autoTable = (doc as any).autoTable
    autoTable({
        startY: 52,
        head: [['PERIHAL BARANG', { content: 'NO. PENDAFTARAN SILINDER', colSpan: 5 }, 'QTY\nSENT', 'QTY\nREC']],
        body: rows,
        theme: 'grid',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontSize: 7,
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.1,
            lineColor: [0, 0, 0]
        },
        styles: {
            fontSize: 7,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            font: 'Helvetica'
        },
        columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold' },
            1: { halign: 'center', cellWidth: 25 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 25 },
            4: { halign: 'center', cellWidth: 25 },
            5: { halign: 'center', cellWidth: 25 },
            6: { halign: 'center', cellWidth: 15 },
            7: { halign: 'center', cellWidth: 15 },
        }
    })

    // 5. SUMMARY ROW
    const finalY = (doc as any).lastAutoTable.finalY
    doc.setFont('Helvetica', 'bold')
    doc.rect(10, finalY, 155, 8)
    doc.text("JUMLAH", 140, finalY + 5.5)
    doc.rect(165, finalY, 15, 8)
    doc.text(items.length.toString(), 172.5, finalY + 5.5, { align: 'center' })
    doc.rect(180, finalY, 20, 8) // Qty Received sum placeholder

    // 6. SIGNATURE PROTOCOL (TRIPLE BLOCK)
    const sigY = finalY + 15
    doc.setFontSize(7)

    // Header for signature blocks
    doc.rect(10, sigY, 63, 10)
    doc.text("AKUAN PENGELUARAN\nSILINDER & PEMESANAN", 41.5, sigY + 4, { align: 'center' })

    doc.rect(73, sigY, 64, 10)
    doc.text("AKUAN TERIMA PEMBEKAL/\nSYARIKAT PENGANGKUTAN", 105, sigY + 4, { align: 'center' })

    doc.rect(137, sigY, 63, 10)
    doc.text("AKUAN TERIMA PENERIMA\n(DILENGKAPKAN SETELAH STOK DITERIMA)", 168.5, sigY + 4, { align: 'center' })

    // Signatures content
    const sigContentY = sigY + 10
    doc.rect(10, sigContentY, 63, 40) // Block 1
    doc.text("........................................................", 15, sigContentY + 25)
    doc.text(`NAMA: ${user?.full_name?.toUpperCase()}`, 12, sigContentY + 30)
    doc.text(`JAWATAN: PEGAWAI FARMASI`, 12, sigContentY + 34)
    doc.text(`TARIKH: ${formatDate(new Date())}`, 12, sigContentY + 38)

    doc.rect(73, sigContentY, 64, 40) // Block 2
    doc.text("........................................................", 78, sigContentY + 25)
    doc.text(`NAMA: ${(form.driver_name || '').toUpperCase()}`, 75, sigContentY + 30)
    doc.text(`VEHICLE: ${(form.vehicle_no || '').toUpperCase()}`, 75, sigContentY + 34)
    doc.text(`TARIKH: ${formatDate(form.return_date)}`, 75, sigContentY + 38)

    doc.rect(137, sigContentY, 63, 40) // Block 3
    doc.text("........................................................", 142, sigContentY + 25)
    doc.text(`NAMA:`, 139, sigContentY + 30)
    doc.text(`JAWATAN:`, 139, sigContentY + 34)
    doc.text(`TARIKH:`, 139, sigContentY + 38)

    // FOOTER
    doc.setFontSize(7)
    doc.setFont('Helvetica', 'italic')
    doc.text("BORANG INI HENDAKLAH DIISI DALAM TIGA (3) SALINAN", 10, sigContentY + 45)

    doc.setFontSize(6)
    doc.setTextColor(150)
    doc.text(`System Generated: ${timestamp} | Digital Manifest V2.0`, 105, 290, { align: 'center' })

    doc.save(`Oxygen_Return_Manifest_${Date.now()}.pdf`)
}
