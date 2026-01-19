/**
 * Warrant Export Service
 * Handles PDF and CSV export for warrant data with professional formatting
 */

import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib'
import type { Warrant, WarrantSummary } from '@/types/pharmacy'
import { WARRANT_CATEGORIES, WARRANT_DEPARTMENTS, WARRANT_VOTE_ACTIVITIES } from './warrantService'

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
 * Get vote activity label
 */
function getVoteActivityLabel(value: string): string {
  return WARRANT_VOTE_ACTIVITIES.find((v) => v.value === value)?.label || value
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

  // Colors
  const black = rgb(0, 0, 0)
  const darkGray = rgb(0.2, 0.2, 0.2)

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

  // Draw Header Background
  // We won't draw a full colored box, we want a clean official letterhead style

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
  currentPage.drawText(hospitalName.toUpperCase(), { x: 50, y: yPosition, size: 12, font: helveticaBold })
  currentPage.drawText(`Fiscal Year: ${fiscalYear}`, { x: width - 150, y: yPosition, size: 10, font: helvetica, color: darkGray })
  yPosition -= 15

  currentPage.drawText(`WARRANT ALLOCATION REPORT`, { x: 50, y: yPosition, size: 14, font: helveticaBold, color: rgb(0.1, 0.4, 0.3) }) // Emerald Green title

  const reportDate = new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' })
  currentPage.drawText(`Generated on: ${reportDate}`, { x: width - 150, y: yPosition, size: 9, font: helvetica, color: darkGray })
  yPosition -= 25

  if (filters?.category || filters?.department) {
    let filterText = 'Filtered By: '
    if (filters.category) filterText += `Category [${getCategoryLabel(filters.category)}] `
    if (filters.department) filterText += `Department [${getDepartmentLabel(filters.department)}]`

    currentPage.drawText(filterText, { x: 50, y: yPosition, size: 9, font: helvetica, color: darkGray })
    yPosition -= 20
  }

  // ---------------------------------------------------------
  // 2. Financial Summary & Charts
  // ---------------------------------------------------------

  const summaryBoxY = yPosition
  const summaryBoxHeight = 160

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
  const statsGap = 20

  const drawStat = (label: string, value: string, isTotal = false) => {
    currentPage.drawText(label, { x: leftColX, y: statsY, size: 9, font: helvetica, color: darkGray })
    currentPage.drawText(value, {
      x: leftColX + 110,
      y: statsY,
      size: isTotal ? 11 : 10,
      font: helveticaBold,
      color: isTotal ? rgb(0, 0, 0) : darkGray
    })
    statsY -= statsGap
  }

  currentPage.drawText('FINANCIAL SUMMARY', { x: leftColX, y: summaryBoxY - 20, size: 10, font: helveticaBold, color: rgb(0.1, 0.4, 0.3) })

  drawStat('Total Allocation', formatCurrency(summary.total_allocation), true)
  drawStat('Total Expenses', formatCurrency(summary.total_expenses))
  drawStat('Available Balance', formatCurrency(summary.total_balance), true)
  statsY -= 5
  drawStat('Liabilities', formatCurrency(summary.total_liabilities))
  drawStat('Net Expenses', formatCurrency(summary.net_expenses))
  drawStat('Total Warrants', summary.total_count.toString())

  // Right Column: Simple Bar Chart
  // "Usage Rate"
  const chartX = 350
  const chartY = summaryBoxY - 50
  const chartWidth = 150
  const chartHeight = 15

  currentPage.drawText(`Usage Rate: ${summary.usage_percentage.toFixed(1)}%`, { x: chartX, y: chartY + 20, size: 9, font: helveticaBold })

  // Background bar
  currentPage.drawRectangle({
    x: chartX,
    y: chartY,
    width: chartWidth,
    height: chartHeight,
    color: rgb(0.9, 0.9, 0.9),
    // rounded corners not directly supported, rect is fine
  })

  // Foreground bar (Usage)
  const usageWidth = Math.min((summary.usage_percentage / 100) * chartWidth, chartWidth)
  // Color code based on usage
  let barColor = rgb(0.1, 0.7, 0.4) // Green
  if (summary.usage_percentage > 90) barColor = rgb(0.9, 0.2, 0.2) // Red
  else if (summary.usage_percentage > 75) barColor = rgb(0.9, 0.6, 0.1) // Orange

  if (usageWidth > 0) {
    currentPage.drawRectangle({
      x: chartX,
      y: chartY,
      width: usageWidth,
      height: chartHeight,
      color: barColor,
    })
  }

  yPosition -= (summaryBoxHeight + 30)

  // ---------------------------------------------------------
  // 3. Departmental Breakdown (Detailed)
  // ---------------------------------------------------------

  // Define Footer Drawer Helper (Closure captures width, fonts)
  const drawFooter = (page: any, pageNum: number, totalPages: number) => {
    const footerY = 30
    const color = rgb(0.5, 0.5, 0.5)

    page.drawLine({
      start: { x: 50, y: footerY + 15 },
      end: { x: width - 50, y: footerY + 15 },
      thickness: 0.5,
      color,
    })

    page.drawText('Hospital Operation and Management Ecosystem (HOME)', {
      x: 50,
      y: footerY,
      size: 8,
      font: helveticaOblique,
      color,
    })

    page.drawText('This is a computer-generated document. No signature is required.', {
      x: 50,
      y: footerY - 10,
      size: 8,
      font: helveticaOblique,
      color: rgb(0.6, 0.6, 0.6),
    })

    page.drawText(`Page ${pageNum} of ${totalPages}`, {
      x: width - 100,
      y: footerY,
      size: 8,
      font: helvetica,
      color,
    })
  }

  // Get unique departments from summary
  const departments = summary.by_department

  for (const dept of departments) {
    // Check page space for Department Header + Table Header + at least 1 row
    if (yPosition < 150) {
      // We'll draw footers at the very end to get correct page numbers
      currentPage = pdfDoc.addPage([595, 842])
      yPosition = height - 60
    }

    // Department Header
    const deptLabel = getDepartmentLabel(dept.department)
    currentPage.drawText(`DEPARTMENT: ${deptLabel.toUpperCase()}`, { x: 50, y: yPosition, size: 10, font: helveticaBold, color: rgb(0, 0, 0) })
    yPosition -= 15

    // Department Summary Stats
    const deptStats = `Total Allocation: ${formatCurrency(dept.allocation)}   |   Total Usage: ${formatCurrency(dept.expenses)}   |   Balance: ${formatCurrency(dept.balance)}`
    currentPage.drawText(deptStats, { x: 50, y: yPosition, size: 9, font: helvetica, color: darkGray })
    yPosition -= 20

    // Detailed Table for this Department
    const items = summary.by_department_vote_activity.filter(i => i.department === dept.department)

    const detHeaders = ['Vote Code', 'Activity', 'Allocation', 'Usage', 'Balance']
    const detColX = [50, 130, 300, 400, 490]
    const detRowHeight = 20

    // Header Background
    currentPage.drawRectangle({
      x: 40, y: yPosition - 5, width: width - 80, height: 20, color: rgb(0.95, 0.95, 0.95)
    })

    // Draw Detailed Headers
    detHeaders.forEach((h, i) => {
      const x = i >= 2 ? detColX[i] + 40 : detColX[i] // Shift right alignment for numbers
      currentPage.drawText(h, { x: i >= 2 ? x - 40 : x, y: yPosition, size: 8, font: helveticaBold, color: darkGray })
    })
    yPosition -= detRowHeight

    // Rows
    for (const item of items) {
      if (yPosition < 50) {
        currentPage = pdfDoc.addPage([595, 842])
        yPosition = height - 60
        currentPage.drawText(`${deptLabel.toUpperCase()} (Cont.)`, { x: 50, y: yPosition, size: 9, font: helveticaBold, color: darkGray })
        yPosition -= 20
      }

      currentPage.drawText(item.vote_code, { x: detColX[0], y: yPosition, size: 8, font: helvetica })

      // Activity Label lookup
      const actLabel = getVoteActivityLabel(item.vote_activity)
      currentPage.drawText(actLabel, { x: detColX[1], y: yPosition, size: 8, font: helvetica })

      const allocStr = formatCurrency(item.allocation).replace('RM', '').trim()
      const expStr = formatCurrency(item.expenses).replace('RM', '').trim()
      const balStr = formatCurrency(item.balance).replace('RM', '').trim()

      currentPage.drawText(allocStr, { x: detColX[2] + 50 - helvetica.widthOfTextAtSize(allocStr, 8), y: yPosition, size: 8, font: helvetica })
      currentPage.drawText(expStr, { x: detColX[3] + 40 - helvetica.widthOfTextAtSize(expStr, 8), y: yPosition, size: 8, font: helvetica })
      currentPage.drawText(balStr, { x: detColX[4] + 40 - helvetica.widthOfTextAtSize(balStr, 8), y: yPosition, size: 8, font: helvetica })

      yPosition -= detRowHeight
    }
    yPosition -= 20 // Spacing between departments
  }

  // ---------------------------------------------------------
  // 4. Warrant Reference List
  // ---------------------------------------------------------

  if (yPosition < 100) {
    currentPage = pdfDoc.addPage([595, 842])
    yPosition = height - 60
  }

  currentPage.drawText('WARRANT REFERENCE LIST (RAW DATA)', { x: 50, y: yPosition, size: 11, font: helveticaBold, color: black })
  yPosition -= 20

  const refHeaders = ['Date', 'Doc No', 'Vote Code', 'Category', 'Dept', 'Amount (RM)']
  const colWidths = [60, 90, 60, 80, 110, 95]
  const colX = [50, 110, 200, 260, 340, 450]
  const rowHeight = 24
  const fontSize = 8

  const drawRefTableHeader = (y: number) => {
    currentPage.drawRectangle({
      x: 40,
      y: y - 5,
      width: width - 80,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    })

    refHeaders.forEach((h, i) => {
      const x = i === refHeaders.length - 1 ? colX[i] + 40 : colX[i]
      currentPage.drawText(h, {
        x,
        y,
        size: 8,
        font: helveticaBold,
        color: darkGray
      })
    })
  }

  drawRefTableHeader(yPosition)
  yPosition -= rowHeight

  // Draw Rows for Reference List
  for (let i = 0; i < warrants.length; i++) {
    const w = warrants[i]
    if (yPosition < 50) {
      currentPage = pdfDoc.addPage([595, 842])
      yPosition = height - 60
      drawRefTableHeader(yPosition)
      yPosition -= rowHeight
    }
    if (i % 2 === 0) {
      currentPage.drawRectangle({
        x: 40, y: yPosition - 5, width: width - 80, height: rowHeight - 4, color: rgb(0.98, 0.98, 0.98),
      })
    }
    currentPage.drawText(formatDate(w.warrant_date), { x: colX[0], y: yPosition, size: fontSize, font: helvetica })
    currentPage.drawText(w.document_no, { x: colX[1], y: yPosition, size: fontSize, font: helvetica })
    currentPage.drawText(w.vote_code, { x: colX[2], y: yPosition, size: fontSize, font: helvetica })

    let catLabel = getCategoryLabel(w.category)
    if (catLabel.length > 15) catLabel = catLabel.substring(0, 12) + '...'
    currentPage.drawText(catLabel, { x: colX[3], y: yPosition, size: fontSize, font: helvetica })

    let deptLabel = getDepartmentLabel(w.department)
    if (deptLabel.length > 20) deptLabel = deptLabel.substring(0, 17) + '...'
    currentPage.drawText(deptLabel, { x: colX[4], y: yPosition, size: fontSize, font: helvetica })

    const amountStr = formatCurrency(Number(w.amount)).replace('RM', '').trim()
    const amountWidth = helvetica.widthOfTextAtSize(amountStr, fontSize)
    currentPage.drawText(amountStr, {
      x: colX[5] + colWidths[5] - amountWidth - 10,
      y: yPosition,
      size: fontSize,
      font: helveticaBold,
      color: black
    })
    yPosition -= rowHeight
  }

  // Footer for all pages
  const totalFnPages = pdfDoc.getPageCount()
  pdfDoc.getPages().forEach((page, index) => {
    drawFooter(page, index + 1, totalFnPages)
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
  rows.push('HOPSITAL OPERATION AND MANAGEMENT ECOSYSTEM')
  rows.push(hospitalName.toUpperCase())
  rows.push('')
  rows.push('WARRANT ALLOCATION REPORT')
  rows.push(`Report Generated,${new Date().toLocaleDateString('en-MY')}`)
  rows.push(`Fiscal Year,${fiscalYear}`)

  if (filters?.category) rows.push(`Category,${getCategoryLabel(filters.category)}`)
  if (filters?.department) rows.push(`Department,${getDepartmentLabel(filters.department)}`)
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

  rows.push('')
  rows.push('DETAILED BREAKDOWN (DEPT + VOTE CODE + ACTIVITY)')
  rows.push('Department,Vote Code,Activity,Allocation (RM),Expenses (RM),Balance (RM),Count')
  summary.by_department_vote_activity.forEach((item) => {
    rows.push(`${getDepartmentLabel(item.department)},${item.vote_code},${getVoteActivityLabel(item.vote_activity)},${item.allocation.toFixed(2)},${item.expenses.toFixed(2)},${item.balance.toFixed(2)},${item.count}`)
  })

  return rows.join('\n')
}
