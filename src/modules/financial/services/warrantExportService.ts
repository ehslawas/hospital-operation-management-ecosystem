// @ts-nocheck
/**
 * Warrant Export Service
 * Handles PDF and CSV export for warrant data with professional formatting
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Warrant, WarrantSummary } from '@/types/pharmacy'
import { WARRANT_CATEGORIES, WARRANT_DEPARTMENTS } from './warrantService'

/**
 * Get category label
 */
function getCategoryLabel(value: string): string {
  return WARRANT_CATEGORIES.find((c) => c.value === value)?.label || value
}

/**
 * Get department label
 */
function getDepartmentLabel(value: string): string {
  return WARRANT_DEPARTMENTS.find((d) => d.value === value)?.label || value
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Export warrants to PDF
 */
export async function exportWarrantsToPDF(
  warrants: Warrant[],
  summary: WarrantSummary,
  hospitalName: string,
  fiscalYear: number,
  filters?: {
    category?: string
    department?: string
  }
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 size
  const { width, height } = page.getSize()

  // Fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  let currentPage = page
  let yPosition = height - 50

  // Header with Jata Negara and Ministry
  currentPage.drawRectangle({
    x: 0,
    y: yPosition,
    width: width,
    height: 80,
    color: rgb(0.2, 0.4, 0.2), // Dark green
  })

  // Ministry Name
  currentPage.drawText('KEMENTERIAN KESIHATAN MALAYSIA', {
    x: 50,
    y: yPosition + 50,
    size: 14,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  currentPage.drawText('MINISTRY OF HEALTH MALAYSIA', {
    x: 50,
    y: yPosition + 35,
    size: 10,
    font: helvetica,
    color: rgb(1, 1, 1),
  })

  // Hospital Name
  currentPage.drawText(hospitalName.toUpperCase(), {
    x: 50,
    y: yPosition + 20,
    size: 12,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  // Report Title
  yPosition -= 100
  currentPage.drawText('WARRANT ALLOCATION REPORT', {
    x: 50,
    y: yPosition,
    size: 16,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  })

  // Report Details
  yPosition -= 30
  const reportDate = new Date().toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  currentPage.drawText(`Report Generated: ${reportDate}`, {
    x: 50,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  })

  yPosition -= 15
  currentPage.drawText(`Fiscal Year: ${fiscalYear}`, {
    x: 50,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  })

  if (filters?.category || filters?.department) {
    yPosition -= 15
    const filterText = [
      filters.category && `Category: ${getCategoryLabel(filters.category)}`,
      filters.department && `Department: ${getDepartmentLabel(filters.department)}`,
    ]
      .filter(Boolean)
      .join(', ')
    currentPage.drawText(`Filters: ${filterText}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    })
  }

  // Summary Section
  yPosition -= 40
  currentPage.drawText('FINANCIAL SUMMARY', {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  })

  yPosition -= 20
  const summaryData = [
    ['Total Allocation', formatCurrency(summary.total_allocation)],
    ['Total Expenses', formatCurrency(summary.total_expenses)],
    ['Available Balance', formatCurrency(summary.total_balance)],
    ['Liabilities', formatCurrency(summary.total_liabilities)],
    ['Net Expenses', formatCurrency(summary.net_expenses)],
    ['Usage Rate', `${summary.usage_percentage.toFixed(2)}%`],
    ['Total Warrants', summary.total_count.toString()],
  ]

  summaryData.forEach(([label, value]) => {
    currentPage.drawText(label + ':', {
      x: 60,
      y: yPosition,
      size: 9,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    })
    currentPage.drawText(value, {
      x: 200,
      y: yPosition,
      size: 9,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })
    yPosition -= 15
  })

  // Warrant Details Table
  yPosition -= 30
  currentPage.drawText('WARRANT DETAILS', {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  })

  yPosition -= 20

  // Table Header
  const rowHeight = 20
  const colWidths = [80, 100, 60, 60, 80, 100, 80]
  const headers = ['Date', 'Document No', 'Vote Code', 'Activity', 'Category', 'Department', 'Amount']

  // Draw header background
  currentPage.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: width - 100,
    height: rowHeight,
    color: rgb(0.9, 0.9, 0.9),
  })

  let xPos = 55
  headers.forEach((header, index) => {
    currentPage.drawText(header, {
      x: xPos,
      y: yPosition - 5,
      size: 8,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })
    xPos += colWidths[index]
  })

  yPosition -= rowHeight

  // Table rows
  warrants.forEach((warrant, index) => {
    if (yPosition < 100) {
      // New page
      currentPage = pdfDoc.addPage([595, 842])
      yPosition = height - 50
      currentPage.drawText('WARRANT DETAILS (continued)', {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      })
      yPosition -= 30
      
      // Redraw header on new page
      currentPage.drawRectangle({
        x: 50,
        y: yPosition - 15,
        width: width - 100,
        height: rowHeight,
        color: rgb(0.9, 0.9, 0.9),
      })
      xPos = 55
      headers.forEach((header, headerIndex) => {
        currentPage.drawText(header, {
          x: xPos,
          y: yPosition - 5,
          size: 8,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        })
        xPos += colWidths[headerIndex]
      })
      yPosition -= rowHeight
    }

    // Alternate row color
    if (index % 2 === 0) {
      currentPage.drawRectangle({
        x: 50,
        y: yPosition - 15,
        width: width - 100,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98),
      })
    }

    xPos = 55
    const rowData = [
      formatDate(warrant.warrant_date).split(' ')[0], // Just date part
      warrant.document_no,
      warrant.vote_code,
      warrant.vote_activity,
      getCategoryLabel(warrant.category),
      getDepartmentLabel(warrant.department),
      formatCurrency(Number(warrant.amount)),
    ]

    rowData.forEach((cell, cellIndex) => {
      const maxWidth = colWidths[cellIndex] - 5
      let text = cell
      if (cell.length > 15 && cellIndex !== 4 && cellIndex !== 5) {
        text = cell.substring(0, 12) + '...'
      }
      currentPage.drawText(text, {
        x: xPos,
        y: yPosition - 5,
        size: 7,
        font: helvetica,
        color: rgb(0, 0, 0),
        maxWidth,
      })
      xPos += colWidths[cellIndex]
    })

    yPosition -= rowHeight
  })

  // Footer
  const totalPages = pdfDoc.getPageCount()
  pdfDoc.getPages().forEach((page, pageIndex) => {
    const footerY = 30
    page.drawLine({
      start: { x: 50, y: footerY + 20 },
      end: { x: width - 50, y: footerY + 20 },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    })

    page.drawText('This is a computer-generated document. No signature is required.', {
      x: 50,
      y: footerY,
      size: 8,
      font: helveticaOblique,
      color: rgb(0.5, 0.5, 0.5),
    })

    page.drawText(`Page ${pageIndex + 1} of ${totalPages}`, {
      x: width - 100,
      y: footerY,
      size: 8,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    })
  })

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as any], { type: 'application/pdf' })
}

/**
 * Export warrants to CSV
 */
export function exportWarrantsToCSV(
  warrants: Warrant[],
  summary: WarrantSummary,
  hospitalName: string,
  fiscalYear: number,
  filters?: {
    category?: string
    department?: string
  }
): string {
  const rows: string[] = []

  // Header
  rows.push('KEMENTERIAN KESIHATAN MALAYSIA')
  rows.push('MINISTRY OF HEALTH MALAYSIA')
  rows.push(hospitalName.toUpperCase())
  rows.push('')
  rows.push('WARRANT ALLOCATION REPORT')
  rows.push(`Report Generated: ${new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' })}`)
  rows.push(`Fiscal Year: ${fiscalYear}`)
  if (filters?.category || filters?.department) {
    const filterText = [
      filters.category && `Category: ${getCategoryLabel(filters.category)}`,
      filters.department && `Department: ${getDepartmentLabel(filters.department)}`,
    ]
      .filter(Boolean)
      .join(', ')
    rows.push(`Filters: ${filterText}`)
  }
  rows.push('')

  // Summary
  rows.push('FINANCIAL SUMMARY')
  rows.push('Metric,Value')
  rows.push(`Total Allocation,${summary.total_allocation.toFixed(2)}`)
  rows.push(`Total Expenses,${summary.total_expenses.toFixed(2)}`)
  rows.push(`Available Balance,${summary.total_balance.toFixed(2)}`)
  rows.push(`Liabilities,${summary.total_liabilities.toFixed(2)}`)
  rows.push(`Net Expenses,${summary.net_expenses.toFixed(2)}`)
  rows.push(`Usage Rate (%),${summary.usage_percentage.toFixed(2)}`)
  rows.push(`Total Warrants,${summary.total_count}`)
  rows.push('')

  // Warrant Details
  rows.push('WARRANT DETAILS')
  rows.push('Date,Document Number,Vote Code,Vote Activity,Category,Department,Amount (RM),Created At')
  
  warrants.forEach((warrant) => {
    const row = [
      warrant.warrant_date,
      warrant.document_no,
      warrant.vote_code,
      warrant.vote_activity,
      getCategoryLabel(warrant.category),
      getDepartmentLabel(warrant.department),
      Number(warrant.amount).toFixed(2),
      warrant.created_at || '',
    ]
    rows.push(row.map((cell) => `"${cell}"`).join(','))
  })

  // Summary by breakdown
  rows.push('')
  rows.push('BREAKDOWN BY VOTE CODE')
  rows.push('Vote Code,Allocation (RM),Expenses (RM),Balance (RM),Count')
  summary.by_vote_code.forEach((item) => {
    rows.push(`${item.vote_code},${item.allocation.toFixed(2)},${item.expenses.toFixed(2)},${item.balance.toFixed(2)},${item.count}`)
  })

  rows.push('')
  rows.push('BREAKDOWN BY CATEGORY')
  rows.push('Category,Allocation (RM),Expenses (RM),Balance (RM),Count')
  summary.by_category.forEach((item) => {
    rows.push(`${getCategoryLabel(item.category)},${item.allocation.toFixed(2)},${item.expenses.toFixed(2)},${item.balance.toFixed(2)},${item.count}`)
  })

  rows.push('')
  rows.push('BREAKDOWN BY DEPARTMENT')
  rows.push('Department,Allocation (RM),Expenses (RM),Balance (RM),Count')
  summary.by_department.forEach((item) => {
    rows.push(`${getDepartmentLabel(item.department)},${item.allocation.toFixed(2)},${item.expenses.toFixed(2)},${item.balance.toFixed(2)},${item.count}`)
  })

  return rows.join('\n')
}

