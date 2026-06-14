/**
 * APPL Allocation Export Service
 * Handles PDF and CSV export for APPL allocation data with professional formatting
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'
import type { APPLExpenseWithRelations, APPLAllocationSummary } from '@/types/pharmacy'

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
    sq: 'SQ',
    manual: 'Manual',
  }
  return map[poType] || poType
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
 * Wrap text to a specific width
 */
function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  if (!text) return []
  // Replace newlines and carriage returns with spaces to avoid encoding errors
  const sanitizedText = text.replace(/[\r\n]+/g, ' ')
  const words = sanitizedText.split(/\s+/)
  const lines: string[] = []
  let currentLine = words[0]

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    if (!word) continue
    const width = font.widthOfTextAtSize(`${currentLine} ${word}`, fontSize)
    if (width < maxWidth) {
      currentLine += ` ${word}`
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

/**
 * Load image from URL
 */
async function loadImage(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to load image')
    return await response.arrayBuffer()
  } catch (error) {
    console.error('Error loading image:', error)
    return null
  }
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
    department?: string
  },
  reporterName?: string
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 size
  const { width, height } = page.getSize()

  // Fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // Colors
  const black = rgb(0, 0, 0)
  const darkGray = rgb(0.2, 0.2, 0.2)
  const lightGray = rgb(0.9, 0.9, 0.9)
  const white = rgb(1, 1, 1)

  let currentPage = page
  let yPosition = height - 40

  // ---------------------------------------------------------
  // 1. Header Section with Logo
  // ---------------------------------------------------------

  // Load Logo
  const logoBytes = await loadImage('/jata-logo.png')
  let logoImage
  if (logoBytes) {
    try {
      logoImage = await pdfDoc.embedPng(logoBytes)
    } catch (e) {
      console.warn('Failed to embed PNG logo, trying JPG just in case', e)
    }
  }

  // Draw Logo if exists
  if (logoImage) {
    const logoDims = logoImage.scale(0.18) // Adjust scale as needed
    currentPage.drawImage(logoImage, {
      x: width / 2 - (logoDims.width / 2),
      y: yPosition - logoDims.height,
      width: logoDims.width,
      height: logoDims.height,
    })
    yPosition -= (logoDims.height + 15)
  } else {
    yPosition -= 40 // Spacer if no logo
  }

  // Main Title Text (Centered)
  const drawCenteredText = (text: string, font: PDFFont, size: number, y: number, color = black) => {
    const textWidth = font.widthOfTextAtSize(text, size)
    currentPage.drawText(text, {
      x: width / 2 - textWidth / 2,
      y,
      size,
      font,
      color,
    })
  }

  drawCenteredText('KEMENTERIAN KESIHATAN MALAYSIA', helveticaBold, 14, yPosition)
  yPosition -= 15
  drawCenteredText('MINISTRY OF HEALTH MALAYSIA', helvetica, 10, yPosition, darkGray)
  yPosition -= 25

  // Horizontal Line
  currentPage.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: black,
  })
  yPosition -= 20

  // Report Info
  // Ensure "HOSPITAL LAWAS" is displayed
  const hospitalDisplay = hospitalName.toUpperCase().includes("LAWAS") ? hospitalName.toUpperCase() : "HOSPITAL LAWAS"

  currentPage.drawText(hospitalDisplay, { x: 50, y: yPosition, size: 12, font: helveticaBold })
  currentPage.drawText(`Fiscal Year: ${fiscalYear}`, { x: width - 150, y: yPosition, size: 10, font: helvetica, color: darkGray })
  yPosition -= 15

  currentPage.drawText(`APPL ALLOCATION & EXPENDITURE REPORT`, { x: 50, y: yPosition, size: 14, font: helveticaBold, color: rgb(0.1, 0.4, 0.3) })

  const reportDate = new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' })
  currentPage.drawText(`Generated on: ${reportDate}`, { x: width - 150, y: yPosition, size: 9, font: helvetica, color: darkGray })
  yPosition -= 25

  if (filters?.voteActivity || filters?.status || filters?.department) {
    let filterText = 'Filtered By: '
    const parts = []
    if (filters.voteActivity) parts.push(`Vote Activity [${filters.voteActivity}]`)
    if (filters.department) parts.push(`Department [${filters.department}]`)
    if (filters.status) parts.push(`Status [${getStatusLabel(filters.status)}]`)

    filterText += parts.join(', ')

    currentPage.drawText(filterText, { x: 50, y: yPosition, size: 9, font: helvetica, color: darkGray })
    yPosition -= 20
  }

  // ---------------------------------------------------------
  // 2. Financial Summary
  // ---------------------------------------------------------

  const summaryBoxY = yPosition
  const summaryBoxHeight = 100 // Reduced height

  // Background for summary
  currentPage.drawRectangle({
    x: 40,
    y: summaryBoxY - summaryBoxHeight,
    width: width - 80,
    height: summaryBoxHeight,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  })

  let statsY = summaryBoxY - 30

  // Left Column: Stats
  const leftColX = 60

  const drawStat = (label: string, value: string, isTotal = false) => {
    currentPage.drawText(label, { x: leftColX, y: statsY, size: 9, font: helvetica, color: darkGray })
    currentPage.drawText(value, {
      x: leftColX + 120,
      y: statsY,
      size: 9,
      font: isTotal ? helveticaBold : helvetica,
      color: black
    })
    statsY -= 15
  }

  drawStat('Total Allocation:', formatCurrency(summary.total_allocation), true)
  drawStat('Total Expenses:', formatCurrency(summary.total_expenses), true)
  drawStat('Available Balance:', formatCurrency(summary.total_balance), true)

  statsY = summaryBoxY - 30
  const rightColX = width / 2 + 20

  const drawRightStat = (label: string, value: string) => {
    currentPage.drawText(label, { x: rightColX, y: statsY, size: 9, font: helvetica, color: darkGray })
    currentPage.drawText(value, { x: rightColX + 100, y: statsY, size: 9, font: helveticaBold, color: black })
    statsY -= 15
  }

  drawRightStat('Usage Rate:', `${summary.usage_percentage.toFixed(2)}%`)
  drawRightStat('Liabilities:', formatCurrency(summary.total_liabilities))
  drawRightStat('Net Expenses:', formatCurrency(summary.net_expenses))

  yPosition -= (summaryBoxHeight + 30)

  // ---------------------------------------------------------
  // Quarterly Breakdown
  // ---------------------------------------------------------

  if (summary.quarterly && summary.quarterly.length > 0) {
    currentPage.drawText('QUARTERLY BREAKDOWN', { x: 50, y: yPosition, size: 10, font: helveticaBold })
    yPosition -= 15

    const qTableHeaders = ['Quarter', 'Allocation', 'Expenses', 'Balance', 'Usage %']
    const qColWidths = [100, 100, 100, 100, 80]

    // Header
    currentPage.drawRectangle({ x: 50, y: yPosition - 15, width: width - 100, height: 20, color: lightGray })
    let qX = 55
    qTableHeaders.forEach((h, i) => {
      currentPage.drawText(h, { x: qX, y: yPosition - 10, size: 8, font: helveticaBold })
      qX += qColWidths[i]
    })
    yPosition -= 20

    // Rows
    summary.quarterly.forEach((q, i) => {
      if (i % 2 === 0) currentPage.drawRectangle({ x: 50, y: yPosition - 15, width: width - 100, height: 20, color: rgb(0.98, 0.98, 0.98) })

      qX = 55
      currentPage.drawText(`Q${q.quarter}`, { x: qX, y: yPosition - 10, size: 8, font: helvetica })
      qX += qColWidths[0]
      currentPage.drawText(formatCurrency(q.allocation), { x: qX, y: yPosition - 10, size: 8, font: helvetica })
      qX += qColWidths[1]
      currentPage.drawText(formatCurrency(q.expenses), { x: qX, y: yPosition - 10, size: 8, font: helvetica })
      qX += qColWidths[2]
      currentPage.drawText(formatCurrency(q.balance), { x: qX, y: yPosition - 10, size: 8, font: helvetica })
      qX += qColWidths[3]
      currentPage.drawText(`${q.usage_percentage.toFixed(1)}%`, { x: qX, y: yPosition - 10, size: 8, font: helvetica })

      yPosition -= 20
    })
    yPosition -= 25
  }

  // ---------------------------------------------------------
  // Detailed Expense List with Item Breakdown
  // ---------------------------------------------------------

  currentPage.drawText('DETAILED PURCHASE ORDERS & ITEMS', { x: 50, y: yPosition, size: 10, font: helveticaBold })
  yPosition -= 15

  // Table Configuration
  const headers = ['Date', 'PO Number', 'Department', 'Items Purchased', 'Amount (RM)', 'Status']
  const colWidths = [60, 80, 80, 180, 60, 60] // Adjusted widths
  const rowBaseHeight = 20

  // Draw Header
  const drawHeader = (page: PDFPage) => {
    page.drawRectangle({ x: 40, y: yPosition - 15, width: width - 80, height: 20, color: lightGray })
    let x = 45
    headers.forEach((h, i) => {
      page.drawText(h, { x, y: yPosition - 10, size: 7, font: helveticaBold })
      x += colWidths[i]
    })
    yPosition -= 20
  }

  drawHeader(currentPage)

  // Rows
  for (const [index, expense] of expenses.entries()) {
    // Check page break
    // We need to estimate height dynamically based on items
    const items = expense.purchase_order?.items || []
    const itemCount = items.length
    // Limit items shown to avoid massive rows
    const displayItems = items.slice(0, 5)
    // Extra line for "...and X more"
    const hasMore = itemCount > 5

    // Pre-calculate wrapped lines to determine row height
    const columnWidth = colWidths[3] - 10
    const fontSize = 7
    const itemWrappedLines: string[][] = displayItems.map(item =>
      wrapText(`${item.quantity_ordered} x ${item.item_name}`, columnWidth, helvetica, fontSize)
    )
    const totalItemLines = itemWrappedLines.reduce((sum, lines) => sum + lines.length, 0)
    const extraLines = hasMore ? 1 : 0
    const rowHeight = Math.max(25, (totalItemLines + extraLines) * 10 + 10)

    if (yPosition < rowHeight + 40) {
      currentPage = pdfDoc.addPage([595, 842])
      yPosition = height - 50
      drawHeader(currentPage)
    }

    if (index % 2 === 0) {
      currentPage.drawRectangle({ x: 40, y: yPosition - rowHeight + 5, width: width - 80, height: rowHeight, color: rgb(0.98, 0.98, 0.98) })
    }

    let colX = 45
    // Date
    currentPage.drawText(formatDate(expense.expense_date), { x: colX, y: yPosition - 10, size: 7, font: helvetica, maxWidth: colWidths[0] - 5 })
    colX += colWidths[0]

    // PO Number
    currentPage.drawText(expense.po_number, { x: colX, y: yPosition - 10, size: 7, font: helvetica, maxWidth: colWidths[1] - 5 })
    colX += colWidths[1]

    // Department
    currentPage.drawText(expense.department || '-', { x: colX, y: yPosition - 10, size: 7, font: helvetica, maxWidth: colWidths[2] - 5 })
    colX += colWidths[2]

    // Items (Multiline)
    let itemY = yPosition - 10
    if (items.length === 0) {
      currentPage.drawText('No items recorded', { x: colX, y: itemY, size: 7, font: helveticaOblique, color: darkGray })
    } else {
      itemWrappedLines.forEach(lines => {
        lines.forEach(line => {
          currentPage.drawText(line, { x: colX, y: itemY, size: 7, font: helvetica })
          itemY -= 10
        })
      })
      if (hasMore) {
        currentPage.drawText(`...and ${itemCount - 5} more items`, { x: colX, y: itemY, size: 7, font: helveticaOblique, color: darkGray })
      }
    }
    colX += colWidths[3]

    // Amount
    currentPage.drawText(formatCurrency(Number(expense.amount)), { x: colX, y: yPosition - 10, size: 7, font: helveticaBold })
    colX += colWidths[4]

    // Status
    currentPage.drawText(getStatusLabel(expense.status), { x: colX, y: yPosition - 10, size: 7, font: helvetica })

    yPosition -= rowHeight
  }

  // ---------------------------------------------------------
  // Footer
  // ---------------------------------------------------------
  const totalPages = pdfDoc.getPageCount()
  pdfDoc.getPages().forEach((p, i) => {
    const footerY = 30
    p.drawLine({ start: { x: 50, y: footerY + 20 }, end: { x: width - 50, y: footerY + 20 }, thickness: 0.5, color: darkGray })
    p.drawText('This is a computer-generated document. No signature is required.', { x: 50, y: footerY, size: 8, font: helveticaOblique, color: darkGray })
    p.drawText(`Page ${i + 1} of ${totalPages} | HOSPITAL LAWAS`, { x: width - 150, y: footerY, size: 8, font: helvetica, color: darkGray })
  })

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes.buffer as any], { type: 'application/pdf' })
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
    department?: string
  },
  reporterName?: string
): string {
  const rows: string[] = []

  // Ensure Branding
  const brandingName = hospitalName.toUpperCase().includes("LAWAS") ? hospitalName.toUpperCase() : "HOSPITAL LAWAS"

  // Header
  rows.push('KEMENTERIAN KESIHATAN MALAYSIA')
  rows.push('MINISTRY OF HEALTH MALAYSIA')
  rows.push(brandingName)
  rows.push('')
  rows.push('APPL ALLOCATION & EXPENDITURE REPORT')
  rows.push(`Report Generated: ${new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' })}`)
  rows.push(`Fiscal Year: ${fiscalYear}`)

  const filterParts = []
  if (filters?.voteActivity) filterParts.push(`Vote Activity: ${filters.voteActivity}`)
  if (filters?.department) filterParts.push(`Department: ${filters.department}`)
  if (filters?.status) filterParts.push(`Status: ${getStatusLabel(filters.status)}`)
  if (filterParts.length > 0) rows.push(`Filters: ${filterParts.join(', ')}`)

  if (reporterName) rows.push(`Generated By: ${reporterName}`)
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
  rows.push('')

  // Quarterly
  if (summary.quarterly && summary.quarterly.length > 0) {
    rows.push('QUARTERLY BREAKDOWN')
    rows.push('Quarter,Allocation,Expenses,Balance,Usage %')
    summary.quarterly.forEach(q => {
      rows.push(`Q${q.quarter},${q.allocation.toFixed(2)},${q.expenses.toFixed(2)},${q.balance.toFixed(2)},${q.usage_percentage.toFixed(2)}`)
    })
    rows.push('')
  }

  // Expense Details with Items
  rows.push('EXPENSE DETAILS')
  rows.push('Date,PO Number,Department,Type,Amount (RM),Status,Vote Activity,Items')

  expenses.forEach((expense) => {
    // This replacement handles the loop in exportAPPLToCSV
    // Format items as a single string
    const itemsStr = (expense.purchase_order?.items || [])
      .map(i => `${i.quantity_ordered}x ${i.item_name} (RM${i.unit_price})`)
      .join('; ')

    const row = [
      expense.expense_date,
      expense.po_number,
      expense.department || '',
      getPoTypeLabel(expense.po_type),
      Number(expense.amount).toFixed(2),
      getStatusLabel(expense.status),
      expense.vote_activity || '',
      itemsStr
    ]
    // Escape for CSV
    rows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  })

  return rows.join('\n')
}
