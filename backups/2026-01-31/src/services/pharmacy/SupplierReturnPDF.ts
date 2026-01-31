import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '@/lib/utils'

interface SupplierReturnForm {
    vendor_name: string
    driver_name?: string
    vehicle_no?: string
    return_date: string
}

/**
 * Generates a professional Malaysian Government-standard cylinder return manifest.
 * Strictly enforces 2 pages: Page 1 (Private/Own), Page 2 (Loan/Vendor).
 * Fills the entire A4 page to look like a formal pre-printed document.
 */
export const generateSupplierReturnPDF = (items: any[], form: SupplierReturnForm, user: any) => {
    const doc = new jsPDF('p', 'mm', 'a4')

    // Filter Items
    const privateItems = items.filter(i => i.ownership === 'Private')
    const loanItems = items.filter(i => i.ownership !== 'Private')

    // PAGE 1: PRIVATE CYLINDERS
    drawPage(doc, privateItems, form, user, "SILINDER H.D.L (MILIK SENDIRI)", 1)

    doc.addPage()

    // PAGE 2: LOAN CYLINDERS
    drawPage(doc, loanItems, form, user, "SILINDER PEMBEKAL (PINJAMAN)", 2)

    doc.save(`Return_Manifest_${Date.now()}.pdf`)
}

const drawPage = (doc: jsPDF, items: any[], form: SupplierReturnForm, user: any, typeLabel: string, pageNum: number) => {
    // A4 Height = 297mm. Width = 210mm.
    const PAGE_HEIGHT = 297
    const FOOTER_HEIGHT = 60 // Height required for signatures + notices
    const HEADER_HEIGHT = 45
    const MARGIN = 10
    const TABLE_START_Y = HEADER_HEIGHT + 5
    const FOOTER_START_Y = PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN // ~227mm

    const timestamp = new Date().toLocaleString('en-GB')
    const hospitalName = "HOSPITAL DAERAH LAWAS"
    const hospitalAddress = "98850, LAWAS, SARAWAK."
    const hospitalContact = "TEL: 085-284384  FAX: 085-283270"

    // --- 1. HEADER SECTION ---
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(10)
    doc.text("BORANG PESANAN GAS PERUBATAN DAN PENGELUARAN SILINDER", 105, 12, { align: 'center' })
    doc.setFontSize(9)
    doc.text(`(${typeLabel})`, 105, 16, { align: 'center' })

    doc.setLineWidth(0.5)
    doc.line(10, 18, 200, 18)

    // --- 2. INFO BOXES ---
    const boxTopY = 20
    doc.setLineWidth(0.1)

    // DARIPADA
    doc.rect(10, boxTopY, 95, 20)
    doc.setFontSize(8)
    doc.setFont('Helvetica', 'bold')
    doc.text("DARIPADA:", 12, boxTopY + 4)
    doc.text(hospitalName, 32, boxTopY + 4)
    doc.setFont('Helvetica', 'normal')
    doc.text(hospitalAddress, 32, boxTopY + 8)
    doc.text(hospitalContact, 32, boxTopY + 12)

    // KEPADA
    doc.rect(105, boxTopY, 95, 20)
    doc.setFont('Helvetica', 'bold')
    doc.text("KEPADA:", 107, boxTopY + 4)
    doc.text(form.vendor_name.toUpperCase(), 125, boxTopY + 4)
    doc.setFont('Helvetica', 'normal')
    doc.text("LOT 1525, PIASAU IND. ESTATE", 125, boxTopY + 8)
    doc.text("98000 MIRI, SARAWAK.", 125, boxTopY + 12)

    // REFS
    const refY = boxTopY + 20
    doc.rect(10, refY, 95, 8)
    doc.setFont('Helvetica', 'bold')
    doc.text("NO. PEMESANAN:", 12, refY + 5)
    doc.text(`VRET-${Date.now().toString().slice(-6)}-${pageNum === 1 ? 'P' : 'L'}`, 45, refY + 5)

    doc.rect(105, refY, 95, 8)
    doc.text("NO. PESANAN KERAJAAN:", 107, refY + 5)
    doc.text("-", 155, refY + 5)

    // --- 3. TABLE DATA ---
    const rows: any[] = []

    // Process Items
    const groupedItemsByCode: { [key: string]: any[] } = {}
    items.forEach(item => {
        const code = item.size_info?.code || 'Unknown'
        if (!groupedItemsByCode[code]) groupedItemsByCode[code] = []
        groupedItemsByCode[code].push(item)
    })

    Object.keys(groupedItemsByCode).sort().forEach(code => {
        const sizeItems = groupedItemsByCode[code];
        const sizeDescription = code === 'J' ? 'BN 6.4m³' : (code === 'F' ? 'BN 1.4m³' : 'BN 0.7m³');

        // Rows of 4
        for (let i = 0; i < sizeItems.length; i += 4) {
            const chunk = sizeItems.slice(i, i + 4);
            const serials = new Array(4).fill('');
            chunk.forEach((it, idx) => {
                serials[idx] = it.serial_number || it.qr_code;
            });

            rows.push([
                i === 0 ? sizeDescription : '',
                ...serials,
                i === 0 ? sizeItems.length : '',
                ''
            ]);
        }
    });

    if (rows.length === 0) {
        rows.push(['TIADA', '', '', '', '', '0', '']);
    }

    // FILLER ROWS TO REACH BOTTOM
    // Estimate row height ~ 6-7mm. 
    // Available height for table body = FOOTER_START_Y - TABLE_START_Y - Headlines
    // We want the table to visually touch the footer block.
    // Let's rely on autoTable's styling but force a certain number of rows if short.

    const ROW_HEIGHT = 8
    const availableHeight = FOOTER_START_Y - TABLE_START_Y - 10 // -10 for header
    const maxRows = Math.floor(availableHeight / ROW_HEIGHT)

    while (rows.length < maxRows) {
        rows.push(['', '', '', '', '', '', '']);
    }

    // --- 4. DRAW TABLE ---
    autoTable(doc, {
        startY: TABLE_START_Y,
        margin: { left: 10, right: 10 },
        head: [
            [
                { content: 'PERIHAL BARANG', rowSpan: 1, styles: { halign: 'left' } },
                { content: 'NO. PENDAFTARAN SILINDER', colSpan: 4, styles: { halign: 'center' } },
                { content: 'KUANTITI\nDIHANTAR', rowSpan: 1, styles: { halign: 'center', valign: 'middle' } },
                { content: 'KUANTITI\nDITERIMA', rowSpan: 1, styles: { halign: 'center', valign: 'middle' } }
            ]
        ],
        body: rows,
        theme: 'grid',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            lineWidth: 0.2, // Thicker header borders
            lineColor: [0, 0, 0]
        },
        styles: {
            fontSize: 8,
            cellPadding: 1.5,
            minCellHeight: ROW_HEIGHT,
            lineColor: [0, 0, 0],
            lineWidth: 0.1, // Thinner body borders
            font: 'Helvetica',
            valign: 'middle',
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 30, fontStyle: 'bold' }, // Desc
            1: { cellWidth: 25, halign: 'center' },  // S1
            2: { cellWidth: 25, halign: 'center' },  // S2
            3: { cellWidth: 25, halign: 'center' },  // S3
            4: { cellWidth: 25, halign: 'center' },  // S4
            5: { cellWidth: 30, halign: 'center' },  // Qty Sent
            6: { cellWidth: 30, halign: 'center' }   // Qty Rec
        }
    })

    // --- 5. FIXED FOOTER POSITION ---
    // We ignore the table's finalY and render the footer at the strict bottom location
    // ensuring the document feels "full".
    // If the table overflowed (too many items), autoTable handles page breaks, 
    // but for our case, we assume it fits or fits on 2 pages naturally. 
    // Since we forced empty rows, we might need to check if we pushed too far, 
    // but the maxRows calc should prevent that.

    const sigY = FOOTER_START_Y
    const finalTableY = (doc as any).lastAutoTable.finalY

    // Draw JUMLAH ROW manually at the very bottom of the table area OR at the top of the footer?
    // Better to draw it right above the Signature block for consistency.
    const sumRowY = sigY - 8

    // Rect for JUMLAH
    doc.setLineWidth(0.2)
    doc.setFont('Helvetica', 'bold')

    // Label
    doc.rect(10, sumRowY, 130, 8)
    doc.text("JUMLAH", 135, sumRowY + 5.5, { align: 'right' })

    // Count - Sum total items (ignoring filler rows)
    // We only sum real items
    const itemCount = items.length
    doc.rect(140, sumRowY, 30, 8)
    doc.text(items.length > 0 ? itemCount.toString() : '0', 155, sumRowY + 5.5, { align: 'center' })

    // Empty Rec
    doc.rect(170, sumRowY, 30, 8)
    doc.text("0", 185, sumRowY + 5.5, { align: 'center' })

    // --- 6. SIGNATURES ---
    doc.setFontSize(7)
    const boxW = 63.3
    const headerH = 10
    const bodyH = 40

    // Headers
    doc.rect(10, sigY, boxW, headerH)
    doc.text("AKUAN PENGELUARAN\nSILINDER & PEMESANAN", 10 + (boxW / 2), sigY + 4, { align: 'center' })

    doc.rect(73.3, sigY, boxW, headerH)
    doc.text("AKUAN TERIMA PEMBEKAL/\nPENGANGKUTAN", 73.3 + (boxW / 2), sigY + 4, { align: 'center' })

    doc.rect(136.6, sigY, boxW, headerH)
    doc.text("AKUAN TERIMA PENERIMA\n(DILENGKAPKAN SETELAH STOK DITERIMA)", 136.6 + (boxW / 2), sigY + 4, { align: 'center' })

    // Bodies
    const sigBodyY = sigY + headerH

    // Box 1
    doc.rect(10, sigBodyY, boxW, bodyH)
    doc.text("........................................................", 15, sigBodyY + 25)
    doc.text(`NAMA: ${user?.full_name?.toUpperCase() || 'AMRI AMIT'}`, 12, sigBodyY + 30)
    doc.text(`JAWATAN: PENOLONG PEGAWAI FARMASI`, 12, sigBodyY + 34)
    doc.text(`TARIKH: ${formatDate(new Date())}`, 12, sigBodyY + 38)

    // Box 2
    doc.rect(73.3, sigBodyY, boxW, bodyH)
    doc.text("........................................................", 78.5, sigBodyY + 25)
    doc.text(`NAMA:`, 75.5, sigBodyY + 30)
    doc.text(`TARIKH:`, 75.5, sigBodyY + 34)
    doc.text(`COP JABATAN:`, 75.5, sigBodyY + 38)

    // Box 3
    doc.rect(136.6, sigBodyY, boxW, bodyH)
    doc.text("........................................................", 142, sigBodyY + 25)
    doc.text(`NAMA:`, 139, sigBodyY + 30)
    doc.text(`JAWATAN:`, 139, sigBodyY + 34)
    doc.text(`TARIKH:`, 139, sigBodyY + 38)

    // Footer Text
    doc.setFont('Helvetica', 'bolditalic')
    doc.text("BORANG INI HENDAKLAH DIISI DALAM TIGA (3) SALINAN", 10, sigBodyY + 45)

    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(150)
    doc.text(`Generated by HOME Ecosystem | ${timestamp} | Page ${pageNum} of 2`, 105, 292, { align: 'center' })
}
