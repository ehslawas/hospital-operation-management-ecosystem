import jsPDF from 'jspdf'
import { MemoWithRelations } from '@/types'
import { formatDate } from '@/lib/utils'

/**
 * Helper to load image
 */
const loadImage = (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = src
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0)
            resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = reject
    })
}

/**
 * Service to handle formal government-style PDF export for memos
 */
export const generateMemoPDF = async (memo: MemoWithRelations) => {
    const doc = new jsPDF()
    const timestamp = new Date().toLocaleString('en-GB')

    // Page Width for centering
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Load Jata Negara
    let jataDataUrl = ''
    try {
        jataDataUrl = await loadImage('/512px-Jata_MalaysiaV2.svg.png')
    } catch (e) {
        console.error('Failed to load Jata Negara', e)
    }

    // ==========================================
    // 1. HEADER SECTION
    // ==========================================
    if (memo.is_letter) {
        // --- SURAT RASMI HEADER ---
        // Jata Logo on Left
        if (jataDataUrl) {
            doc.addImage(jataDataUrl, 'PNG', margin, 15, 25, 25)
        }

        // Text Block Left Aligned (beside logo)
        const headerX = margin + 30
        doc.setFont('times', 'bold') // Use Times for serif look
        doc.setFontSize(14)
        doc.text('JABATAN KESIHATAN NEGERI SARAWAK', headerX, 22)
        doc.setFontSize(12)
        doc.text('HOSPITAL LAWAS', headerX, 28)

        doc.setFont('times', 'normal')
        doc.setFontSize(9)
        doc.text('Jalan Hospital, 98850 Lawas, Sarawak', headerX, 33)
        doc.setFontSize(8)
        doc.text('Tel: 085-285464   Faks: 085-285555', headerX, 37)

        // Line
        doc.setLineWidth(0.5)
        doc.line(margin, 43, pageWidth - margin, 43)

        // Recipient Address Block (Left)
        doc.setFontSize(11)
        doc.setFont('times', 'bold')
        doc.text(memo.recipient_name || 'Kepada Pihak Berkenaan', margin, 55)
        doc.setFont('times', 'normal')
        const addressLines = doc.splitTextToSize(memo.recipient_address || 'Alamat Penerima', contentWidth / 2)
        doc.text(addressLines, margin, 60)

        // Ref & Date (Right)
        doc.setFontSize(10)
        const rightX = pageWidth - margin - 50 // Start 50px from right margin
        doc.text('Ruj. Kami:', pageWidth - margin - 25, 55, { align: 'right' }) // Label
        doc.text(String(memo.ref_number || '(  ) dlm.HLWS/600-15/1/2'), pageWidth - margin, 55, { align: 'right' }) // Value seems too long maybe?

        // Better alignment for Ref
        doc.text(`Ruj. Kami: ${memo.ref_number || '(  ) dlm.HLWS/600-15/1/2'}`, pageWidth - margin, 55, { align: 'right' })
        doc.text(`Tarikh: ${formatDate(memo.created_at)}`, pageWidth - margin, 60, { align: 'right' })

        // "Tuan/Puan"
        doc.setFontSize(12)
        doc.text('Tuan/Puan,', margin, 85)

    } else {
        // --- MEMO DALAMAN HEADER ---
        // Center aligned with Logo on top or center? Usually logo is top center.
        if (jataDataUrl) {
            doc.addImage(jataDataUrl, 'PNG', (pageWidth - 25) / 2, 10, 25, 25)
        }

        doc.setFont('times', 'bold')
        doc.setFontSize(11)
        const deptName = memo.created_by_user?.department?.name || 'FARMASI'
        doc.text(`UNIT ${deptName.toUpperCase()}`, pageWidth / 2, 40, { align: 'center' })

        doc.setFontSize(14)
        doc.text('HOSPITAL LAWAS', pageWidth / 2, 46, { align: 'center' })

        doc.setFontSize(10)
        doc.text('KEMENTERIAN KESIHATAN MALAYSIA', pageWidth / 2, 51, { align: 'center' })

        // No line usually for internal memo top header, but let's add thin
        // doc.line(margin, 54, pageWidth - margin, 54)

        // Info Table Box
        const boxTop = 60
        const boxHeight = 35 // Estimate
        const col1 = margin + 5
        const col2 = margin + 40
        const col3 = pageWidth / 2 + 10
        const col4 = pageWidth / 2 + 40

        // Box Outline
        doc.rect(margin, boxTop, contentWidth, boxHeight)

        doc.setFontSize(10)
        // Row 1
        doc.setFont('times', 'bold'); doc.text('RUJ. KAMI', col1, boxTop + 8)
        doc.setFont('times', 'normal'); doc.text(`: ${memo.ref_number || '(  ) dlm.HLWS/600-15/1/2'}`, col2, boxTop + 8)

        doc.setFont('times', 'bold'); doc.text('TARIKH', col3, boxTop + 8)
        doc.setFont('times', 'normal'); doc.text(`: ${formatDate(memo.created_at)}`, col4, boxTop + 8)

        // Row 2
        doc.setFont('times', 'bold'); doc.text('KEPADA', col1, boxTop + 18)
        // Check "all departments"
        const toText = memo.target_departments?.includes('all') ? 'SEMUA KETUA JABATAN / UNIT' : 'KETUA JABATAN BERKENAAN'
        doc.setFont('times', 'normal'); doc.text(`: ${toText}`, col2, boxTop + 18)

        // Row 3
        doc.setFont('times', 'bold'); doc.text('DARIPADA', col1, boxTop + 28)
        doc.setFont('times', 'normal'); doc.text(`: KETUA UNIT ${deptName.toUpperCase()}`, col2, boxTop + 28)
    }

    // ==========================================
    // 2. CONTENT SECTION
    // ==========================================

    // Subject Line
    const startY = memo.is_letter ? 95 : 105
    doc.setFont('times', 'bold')
    doc.setFontSize(12)

    // Memo puts "PERKARA:", Letter just Subject
    const subjectPrefix = memo.is_letter ? '' : 'PERKARA: '
    const subjectText = (subjectPrefix + memo.title).toUpperCase()

    const subjectLines = doc.splitTextToSize(subjectText, contentWidth)
    doc.text(subjectLines, margin, startY)

    // Underline subject
    // doc.line(margin, startY + 2, margin + doc.getTextWidth(subjectLines[0]), startY + 2) // Simple underline for first line

    let currentY = startY + (subjectLines.length * 6) + 10

    // Body
    if (memo.is_letter) {
        doc.setFont('times', 'normal')
        doc.text('Dengan segala hormatnya perkara di atas adalah dirujuk.', margin, currentY)
        currentY += 10
    }

    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    const bodyLines = doc.splitTextToSize(memo.content, contentWidth)
    doc.text(bodyLines, margin, currentY, { align: 'justify' })

    currentY += (bodyLines.length * 6) + 10

    if (memo.is_letter) {
        doc.text('Sekian, terima kasih.', margin, currentY)
        currentY += 15
    }

    // ==========================================
    // 3. SIGNATURE SECTION
    // ==========================================

    // Check page break
    if (currentY > pageHeight - 60) {
        doc.addPage()
        currentY = 30
    } else {
        currentY += 10
    }

    doc.setFont('times', 'bold')
    doc.text('"BERKHIDMAT UNTUK NEGARA"', margin, currentY)
    currentY += 6
    doc.setFont('times', 'italic')
    doc.text('Saya yang menjalankan amanah,', margin, currentY)
    currentY += 25 // Space for signature

    doc.setFont('times', 'bold')
    const creatorName = memo.created_by_user?.full_name?.toUpperCase() || 'PEGAWAI BERTUGAS'
    doc.text(`(${creatorName})`, margin, currentY)

    doc.setFont('times', 'normal')
    currentY += 5
    const designation = (memo.created_by_user as any)?.jawatan || 'Pegawai'
    doc.text(designation, margin, currentY)

    currentY += 5
    const deptSign = memo.is_letter ? 'Hospital Lawas' : `Unit ${(memo.created_by_user as any)?.department?.name || 'Farmasi'}`
    doc.text(deptSign, margin, currentY)

    if (!memo.is_letter) {
        currentY += 5
        doc.text('Hospital Lawas', margin, currentY)
    }

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(`Dokumen ini dijana oleh System Hospital Lawas pada ${timestamp}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    // Save
    doc.save(`${memo.is_letter ? 'SURAT' : 'MEMO'}_${memo.ref_number?.replace(/\//g, '-') || memo.id.slice(0, 8)}.pdf`)
}
