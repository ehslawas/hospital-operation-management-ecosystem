import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '@/lib/utils'
import { uploadRequestDocument } from '@/services/pharmacy/oxygenDepartmentService'

interface RequestItem {
    cylinder_size_code: string
    quantity: number
    quantity_approved?: number
    remarks?: string
}

interface RequestData {
    id: string
    created_at: string
    department_name: string
    requester_name: string
    status: string
    items: RequestItem[]
    approved_by?: string
    approved_at?: string
}

const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    try {
        const res = await fetch(imageUrl)
        const blob = await res.blob()
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    } catch (e) {
        console.error('Failed to load image', e)
        return ''
    }
}

export const generateRequestForm = async (data: RequestData) => {
    // Orientation: 'l' for landscape, Unit: 'mm', Format: 'a4'
    const doc = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // --- Header ---
    doc.setFontSize(10)
    doc.text('Pekeliling Perbendaharaan Malaysia', 14, 10) // Up from 15
    doc.text('AM 6.5 Lampiran B', pageWidth - 14, 10, { align: 'right' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('KEW.PS-8', pageWidth - 14, 15, { align: 'right' }) // Up

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`No. BPSI : ${data.id}`, pageWidth - 14, 20, { align: 'right' }) // Up
    const textWidth = doc.getTextWidth(data.id)
    doc.line(pageWidth - 14 - textWidth, 21, pageWidth - 14, 21)

    // Jata Negara
    try {
        const imgData = await getBase64ImageFromUrl('/jata-logo.png')
        if (imgData) {
            const imgWidth = 20 // Smaller logo
            const imgHeight = 16
            const x = (pageWidth - imgWidth) / 2
            doc.addImage(imgData, 'PNG', x, 8, imgWidth, imgHeight) // Up at 8
        }
    } catch (e) {
        // ignore
    }

    // Government Headers
    doc.setFontSize(12) // Slightly smaller font
    doc.setFont('times', 'bold')
    doc.text('KEMENTERIAN KESIHATAN MALAYSIA', pageWidth / 2, 28, { align: 'center' })
    doc.text('HOSPITAL LAWAS', pageWidth / 2, 33, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('BORANG PERMOHONAN STOK', pageWidth / 2, 42, { align: 'center' }) // Up
    doc.text('(INDIVIDU KEPADA STOR)', pageWidth / 2, 47, { align: 'center' })

    // ... Table prep ...
    const tableColumn = [
        'No.\nKod',
        'Perihal Stok',
        'Kuantiti\nDimohon',
        'Catatan',
        'Baki Sedia\nAda',
        'Kuantiti\nDiluluskan',
        'Catatan',
        'Kuantiti\nDiterima',
        'Catatan'
    ]

    const tableRows = data.items.map((item) => [
        item.cylinder_size_code,
        'MEDICAL OXYGEN CYLINDER',
        item.quantity.toString(),
        '',
        '',
        item.quantity_approved?.toString() || '',
        '',
        '',
        ''
    ])

    autoTable(doc, {
        startY: 55, // Up from 65
        head: [
            [{ content: 'Permohonan', colSpan: 4, styles: { halign: 'center', fillColor: [240, 240, 240] } },
            { content: 'Pegawai Pelulus', colSpan: 3, styles: { halign: 'center', fillColor: [240, 240, 240] } },
            { content: 'Perakuan Penerimaan', colSpan: 2, styles: { halign: 'center', fillColor: [240, 240, 240] } }],
            tableColumn
        ],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: 20,
            fontSize: 9,
            lineColor: 10,
            lineWidth: 0.1,
            valign: 'middle',
            halign: 'center'
        },
        bodyStyles: {
            lineColor: 10,
            lineWidth: 0.1,
            minCellHeight: 10, // Reduced from 12
            fontSize: 9, // Slightly smaller font
            valign: 'middle'
        },
        styles: {
            font: 'helvetica',
            overflow: 'linebreak'
        },
        columnStyles: {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 60 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 25 },
            4: { cellWidth: 25, halign: 'center' },
            5: { cellWidth: 25, halign: 'center' },
            6: { cellWidth: 25 },
            7: { cellWidth: 25, halign: 'center' },
            8: { cellWidth: 25 }
        }
    })

    // --- Footer (Signatures) ---
    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 10 // Tight gap

    // Check space. We need approx 45-50mm for signatures.
    // If we have less than 50mm left, new page.
    if (finalY + 45 > pageHeight - 5) {
        doc.addPage()
        finalY = 20
    }

    const colWidth = (pageWidth - 28) / 3

    const drawSignature = (title: string, x: number, name: string, date: string) => {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(title, x, finalY)
        doc.setFont('helvetica', 'normal')
        doc.text('................................................................', x, finalY + 20)
        doc.setFontSize(8)
        doc.text('(Tandatangan)', x + 25, finalY + 24, { align: 'center' })
        doc.setFontSize(10)
        doc.text(`Nama    : ${name}`, x, finalY + 35)
        doc.text(`Jawatan : ..........................................`, x, finalY + 43)
        doc.text(`Tarikh  : ${date}`, x, finalY + 51)
    }

    drawSignature('Pemohon:', 14, data.requester_name.toUpperCase(), formatDate(data.created_at))
    const approverName = data.approved_by ? data.approved_by.toUpperCase() : '..........................................'
    const approvalDate = data.approved_at ? formatDate(data.approved_at) : '..........................................'
    drawSignature('Pegawai Pelulus:', 14 + colWidth, approverName, approvalDate)
    drawSignature('Pemohon/ Wakil:', 14 + (colWidth * 2), '..........................................', '..........................................')

    // System Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100)
    const footerText = 'This document is naturally generated by Hospital Operation and Management System (HOMS)'
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' })

    // Preview
    window.open(doc.output('bloburl'), '_blank')

    // Background Upload to Supabase
    // We don't await this so the user doesn't wait for upload to see the preview
    // But we should catch errors silently
    const blob = doc.output('blob')
    uploadRequestDocument(data.id, blob).then(res => {
        if (res.error) console.error('Failed to backup PDF to Supabase', res.error)
        else console.log('PDF backed up to Supabase', res.data)
    })
}
