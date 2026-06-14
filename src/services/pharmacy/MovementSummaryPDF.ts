import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { MovementSummary } from './itemMovementService'

interface SummaryPDFData {
    hospitalName: string
    dateRange: {
        startDate: string
        endDate: string
    }
    summary: MovementSummary
    generatedBy: string
}

/**
 * Generate Item Movement Summary Report PDF
 */
export const generateMovementSummaryPDF = (data: SummaryPDFData) => {
    const doc = new jsPDF()
    const timestamp = new Date().toLocaleString('en-GB')
    const pageWidth = doc.internal.pageSize.width

    // ==========================================
    // 1. HEADER
    // ==========================================
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('ITEM MOVEMENT SUMMARY REPORT', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.text(data.hospitalName.toUpperCase(), pageWidth / 2, 28, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.text(`Period: ${new Date(data.dateRange.startDate).toLocaleDateString('en-GB')} to ${new Date(data.dateRange.endDate).toLocaleDateString('en-GB')}`, pageWidth / 2, 34, { align: 'center' })

    doc.setLineWidth(0.5)
    doc.line(15, 40, 195, 40)

    // ==========================================
    // 2. STATS OVERVIEW
    // ==========================================
    const statsX = 20
    let statsY = 55

    doc.setFont('helvetica', 'bold')
    doc.text('Operational Overview:', statsX, statsY - 5)

    const statsData = [
        ['Total Items Received', data.summary.total_received.toString()],
        ['Total Items Issued', data.summary.total_issued.toString()],
        ['Total Returns Processed', data.summary.total_returned.toString()],
        ['Inter-Location Transfers', data.summary.total_transferred.toString()],
        ['Total Consumed/Used', data.summary.total_consumed.toString()]
    ]

    autoTable(doc, {
        startY: statsY,
        head: [['Metric', 'Quantity']],
        body: statsData,
        theme: 'striped',
        margin: { left: 20, right: 100 },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [51, 65, 85] }
    })

    // ==========================================
    // 3. STATUS DISTRIBUTION
    // ==========================================
    // @ts-ignore
    const nextY = doc.lastAutoTable.finalY + 20

    doc.setFont('helvetica', 'bold')
    doc.text('Current Status Distribution:', statsX, nextY - 5)

    const distributionData = data.summary.by_status.map(s => [
        s.status.charAt(0).toUpperCase() + s.status.slice(1),
        s.count.toString()
    ])

    autoTable(doc, {
        startY: nextY,
        head: [['Status', 'Item Count']],
        body: distributionData,
        theme: 'grid',
        margin: { left: 20, right: 100 },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] }
    })

    // ==========================================
    // 4. FOOTER
    // ==========================================
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Dijana melalui Sistem HospOS oleh ${data.generatedBy} pada ${timestamp}`, pageWidth / 2, pageHeight - 15, { align: 'center' })

    doc.save(`Movement_Summary_${Date.now()}.pdf`)
}
