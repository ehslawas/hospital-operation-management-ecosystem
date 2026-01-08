/**
 * APPL Allocation Export Service
 * Handles PDF and CSV export for APPL allocation data with professional formatting
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { APPLExpenseWithRelations, APPLAllocationSummary } from '@/types/pharmacy'

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
 * Get status label
 */
function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return map[status] || status
}

/**
 * Get PO type label
 */
function getPoTypeLabel(poType: string): string {
  const map: Record<string, string> = {
    regular: 'PO',
    lpo: 'LPO',
    emergency: 'Emergency',
  }
  return map[poType] || poType
}

/**
 * Export APPL expenses to PDF
 */
export async function exportAPPLToPDF(
  expenses: APPLExpenseWithRelations[],
  summary: APPLAllocationSummary,
  hospitalName: string,
  fiscalYear: number,
  filters?: {
    voteActivity?: string
    status?: string
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
  currentPage.drawText('APPL ALLOCATION EXPENSE REPORT', {
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

  if (filters?.voteActivity || filters?.status) {
    yPosition -= 15
    const filterText = [
      filters.voteActivity && `Vote Activity: ${filters.voteActivity}`,
      filters.status && `Status: ${getStatusLabel(filters.status)}`,
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
    ['Total Expenses Count', summary.total_count.toString()],
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

  // Breakdown by Vote Activity
  if (summary.by_vote_activity && summary.by_vote_activity.length > 0) {
    yPosition -= 30
    currentPage.drawText('BREAKDOWN BY VOTE ACTIVITY', {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    yPosition -= 20
    summary.by_vote_activity.forEach((item) => {
      currentPage.drawText(`Activity ${item.vote_activity}:`, {
        x: 60,
        y: yPosition,
        size: 9,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      })
      yPosition -= 12
      currentPage.drawText(`  Allocation: ${formatCurrency(item.allocation)}`, {
        x: 70,
        y: yPosition,
        size: 8,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      })
      yPosition -= 12
      currentPage.drawText(`  Expenses: ${formatCurrency(item.expenses)}`, {
        x: 70,
        y: yPosition,
        size: 8,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      })
      yPosition -= 12
      currentPage.drawText(`  Balance: ${formatCurrency(item.balance)}`, {
        x: 70,
        y: yPosition,
        size: 8,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      })
      yPosition -= 12
      currentPage.drawText(`  Count: ${item.count}`, {
        x: 70,
        y: yPosition,
        size: 8,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      })
      yPosition -= 15
    })
  }

  // Expense Details Table
  yPosition -= 30
  currentPage.drawText('EXPENSE DETAILS', {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  })

  yPosition -= 20

  // Table Header
  const rowHeight = 20
  const colWidths = [70, 90, 90, 50, 80, 80]
  const headers = ['Date', 'PO Number', 'LPO Number', 'Type', 'Amount', 'Status']

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
  expenses.forEach((expense, index) => {
    if (yPosition < 100) {
      // New page
      currentPage = pdfDoc.addPage([595, 842])
      yPosition = height - 50
      currentPage.drawText('EXPENSE DETAILS (continued)', {
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
      formatDate(expense.expense_date).split(' ')[0],
      expense.po_number,
      expense.lpo_number || '—',
      getPoTypeLabel(expense.po_type),
      formatCurrency(Number(expense.amount)),
      getStatusLabel(expense.status),
    ]

    rowData.forEach((cell, cellIndex) => {
      const maxWidth = colWidths[cellIndex] - 5
      let text = cell
      if (cell.length > 12 && cellIndex !== 4) {
        text = cell.substring(0, 10) + '...'
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
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

/**
 * Export APPL expenses to CSV
 */
export function exportAPPLToCSV(
  expenses: APPLExpenseWithRelations[],
  summary: APPLAllocationSummary,
  hospitalName: string,
  fiscalYear: number,
  filters?: {
    voteActivity?: string
    status?: string
  }
): string {
  const rows: string[] = []

  // Header
  rows.push('KEMENTERIAN KESIHATAN MALAYSIA')
  rows.push('MINISTRY OF HEALTH MALAYSIA')
  rows.push(hospitalName.toUpperCase())
  rows.push('')
  rows.push('APPL ALLOCATION EXPENSE REPORT')
  rows.push(`Report Generated: ${new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' })}`)
  rows.push(`Fiscal Year: ${fiscalYear}`)
  if (filters?.voteActivity || filters?.status) {
    const filterText = [
      filters.voteActivity && `Vote Activity: ${filters.voteActivity}`,
      filters.status && `Status: ${getStatusLabel(filters.status)}`,
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
  rows.push(`Total Expenses Count,${summary.total_count}`)
  rows.push('')

  // Breakdown by Vote Activity
  if (summary.by_vote_activity && summary.by_vote_activity.length > 0) {
    rows.push('BREAKDOWN BY VOTE ACTIVITY')
    rows.push('Vote Activity,Allocation (RM),Expenses (RM),Balance (RM),Count')
    summary.by_vote_activity.forEach((item) => {
      rows.push(`${item.vote_activity},${item.allocation.toFixed(2)},${item.expenses.toFixed(2)},${item.balance.toFixed(2)},${item.count}`)
    })
    rows.push('')
  }

  // Expense Details
  rows.push('EXPENSE DETAILS')
  rows.push('Date,PO Number,LPO Number,Type,Amount (RM),Status,Vote Activity,Category')
  
  expenses.forEach((expense) => {
    const row = [
      expense.expense_date,
      expense.po_number,
      expense.lpo_number || '',
      getPoTypeLabel(expense.po_type),
      Number(expense.amount).toFixed(2),
      getStatusLabel(expense.status),
      expense.vote_activity || '',
      expense.category || '',
    ]
    rows.push(row.map((cell) => `"${cell}"`).join(','))
  })

  return rows.join('\n')
}

