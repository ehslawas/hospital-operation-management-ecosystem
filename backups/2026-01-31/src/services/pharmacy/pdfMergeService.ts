/**
 * PDF Merge Service
 * Merges PO form (HTML) with supplier documents (Account & MOF PDFs) into a single PDF
 */

import { PDFDocument } from 'pdf-lib'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export interface MergePDFOptions {
  poElement: HTMLElement
  accountDocumentUrl?: string | null
  mofCertificateUrl?: string | null
  bumiputeraRegistrationCertificateUrl?: string | null
  poNumber: string
}

export interface MergePDFResult {
  success: boolean
  pdfBlob?: Blob
  pdfUrl?: string
  error?: string
}

/**
 * Convert HTML element to PDF bytes with professional quality
 * Uses high-resolution rendering for government-standard documents
 */
async function htmlToPdf(element: HTMLElement): Promise<Uint8Array> {
  // Ensure element is visible for querySelector to work properly
  const originalDisplay = element.style.display
  const originalVisibility = element.style.visibility
  const originalPosition = element.style.position

  // Temporarily make element visible if it's hidden
  if (window.getComputedStyle(element).display === 'none' || element.classList.contains('hidden')) {
    element.style.setProperty('display', 'block', 'important')
    element.style.setProperty('visibility', 'visible', 'important')
    element.style.setProperty('position', 'fixed', 'important')
    element.style.setProperty('opacity', '0.01', 'important')
    element.style.setProperty('left', '0', 'important')
    element.style.setProperty('top', '0', 'important')
    element.style.setProperty('width', '210mm', 'important')
    element.style.setProperty('pointer-events', 'none', 'important')

    // Force a reflow
    void element.offsetHeight
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Get all pages in the element
  const pages = element.querySelectorAll('.page')

  // Debug logging
  console.log('htmlToPdf - Element:', {
    tagName: element.tagName,
    className: element.className,
    display: window.getComputedStyle(element).display,
    visibility: window.getComputedStyle(element).visibility,
    hasChildren: element.children.length,
    innerHTMLLength: element.innerHTML.length,
    pagesFound: pages.length
  })

  if (pages.length === 0) {
    // Try to find elements without .page class as fallback
    const allDivs = element.querySelectorAll('div')
    console.error('No .page elements found. Available divs:', allDivs.length)
    console.error('First few div classes:', Array.from(allDivs).slice(0, 5).map(d => d.className))
    console.error('Element HTML (first 1000 chars):', element.innerHTML.substring(0, 1000))

    // Restore styles before throwing
    element.style.display = originalDisplay || ''
    element.style.visibility = originalVisibility || ''
    element.style.position = originalPosition || ''
    element.style.removeProperty('opacity')
    element.style.removeProperty('left')
    element.style.removeProperty('top')
    element.style.removeProperty('width')
    element.style.removeProperty('pointer-events')

    throw new Error('No pages found in the element. Make sure the print section has elements with class "page".')
  }

  // Restore original styles if we changed them
  if (originalDisplay === '' && element.style.display === 'block') {
    element.style.removeProperty('display')
  } else if (originalDisplay) {
    element.style.display = originalDisplay
  }
  element.style.visibility = originalVisibility || ''
  element.style.position = originalPosition || ''

  // Professional PDF settings - A4 dimensions (Government Standard)
  const pdfWidth = 210 // A4 width in mm
  const pdfHeight = 297 // A4 height in mm

  // A4 dimensions in pixels at 96 DPI (standard screen DPI)
  // 210mm = 8.27 inches = 794 pixels
  // 297mm = 11.69 inches = 1123 pixels
  const screenDPI = 96
  const pixelsPerMM = screenDPI / 25.4
  const targetWidthPx = Math.round(pdfWidth * pixelsPerMM) // 794 pixels
  const targetHeightPx = Math.round(pdfHeight * pixelsPerMM) // 1123 pixels

  // Create a temporary container for proper rendering
  const tempContainer = document.createElement('div')
  tempContainer.style.position = 'fixed'
  tempContainer.style.left = '0'
  tempContainer.style.top = '0'
  tempContainer.style.width = `${targetWidthPx}px`
  tempContainer.style.height = `${targetHeightPx * pages.length}px`
  tempContainer.style.backgroundColor = '#ffffff'
  tempContainer.style.zIndex = '99999'
  tempContainer.style.overflow = 'hidden'
  tempContainer.style.pointerEvents = 'none'
  document.body.appendChild(tempContainer)

  try {
    // Create PDF with A4 dimensions (Government Standard)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    for (let i = 0; i < pages.length; i++) {
      const originalPage = pages[i] as HTMLElement

      // Clone the page for rendering
      const clonedPage = originalPage.cloneNode(true) as HTMLElement

      // Get computed styles to preserve original styling
      const computedStyle = window.getComputedStyle(originalPage)

      // Set up cloned page for rendering with exact A4 dimensions
      clonedPage.style.position = 'relative'
      clonedPage.style.display = 'block'
      clonedPage.style.visibility = 'visible'
      clonedPage.style.width = `${targetWidthPx}px`
      clonedPage.style.height = `${targetHeightPx}px`
      clonedPage.style.margin = '0'
      clonedPage.style.padding = computedStyle.padding || '20mm' // Preserve padding
      clonedPage.style.backgroundColor = '#ffffff'
      clonedPage.style.boxSizing = 'border-box'
      clonedPage.style.overflow = 'visible' // Allow content to render properly
      clonedPage.style.fontFamily = computedStyle.fontFamily || "'Times New Roman', serif"
      clonedPage.style.fontSize = computedStyle.fontSize || '11pt'

      // Append to temp container
      tempContainer.appendChild(clonedPage)

      // Wait for all images in the cloned page to load
      const images = Array.from(clonedPage.querySelectorAll('img'))
      if (images.length > 0) {
        await Promise.all(images.map(img => {
          if (img.complete) return Promise.resolve()
          return new Promise(resolve => {
            img.onload = resolve
            img.onerror = resolve // Resolve even on error to not block forever
          })
        }))
      }

      // Force reflow and wait for fonts to load
      void clonedPage.offsetHeight
      await new Promise(resolve => setTimeout(resolve, 300))

      // Get actual rendered dimensions
      const rect = clonedPage.getBoundingClientRect()
      const actualWidth = Math.max(rect.width, targetWidthPx)
      const actualHeight = Math.max(rect.height, targetHeightPx)

      // Capture with professional quality (scale 4 for 384 DPI equivalent quality)
      const canvas = await html2canvas(clonedPage, {
        scale: 4,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: actualWidth,
        height: actualHeight,
        windowWidth: actualWidth,
        windowHeight: actualHeight,
        removeContainer: false,
        imageTimeout: 15000,
        foreignObjectRendering: false,
      })

      // Remove cloned page
      tempContainer.removeChild(clonedPage)

      // Convert to PNG for best quality (no compression artifacts)
      const imgData = canvas.toDataURL('image/png', 1.0)

      // Add new page if not the first
      if (i > 0) {
        pdf.addPage()
      }

      // Calculate dimensions - canvas is 4x scale
      // Convert pixels to mm: 1px at 96 DPI = 0.264583mm
      // const imgWidthMM = (canvas.width / 4) * 0.264583
      // const imgHeightMM = (canvas.height / 4) * 0.264583

      // Add image to PDF with exact A4 dimensions (fills entire page)
      // This ensures proper margins are preserved from the original HTML
      pdf.addImage(
        imgData,
        'PNG',
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        'FAST'
      )
    }

    // Cleanup
    document.body.removeChild(tempContainer)

    // Return PDF as array buffer
    const pdfOutput = pdf.output('arraybuffer')
    return new Uint8Array(pdfOutput)
  } catch (error) {
    // Cleanup on error
    if (tempContainer.parentNode) {
      document.body.removeChild(tempContainer)
    }
    throw error
  }
}

/**
 * Fetch PDF from URL and return as Uint8Array
 */
async function fetchPdfBytes(url: string): Promise<Uint8Array> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  } catch (error) {
    console.error('Error fetching PDF:', error)
    throw error
  }
}

/**
 * Merge multiple PDFs into one
 */
async function mergePdfs(pdfBytesArray: Uint8Array[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create()

  for (const pdfBytes of pdfBytesArray) {
    try {
      const pdf = await PDFDocument.load(pdfBytes)
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())

      for (const page of pages) {
        mergedPdf.addPage(page)
      }
    } catch (error) {
      console.error('Error loading PDF for merge:', error)
      // Continue with other PDFs even if one fails
    }
  }

  return mergedPdf.save()
}

/**
 * Main function to merge PO with supplier documents
 */
export async function mergePOWithSupplierDocs(options: MergePDFOptions): Promise<MergePDFResult> {
  const { poElement, accountDocumentUrl, mofCertificateUrl, bumiputeraRegistrationCertificateUrl } = options

  try {
    console.log('Starting PDF merge process...')
    console.log('Account Document URL:', accountDocumentUrl)
    console.log('MOF Certificate URL:', mofCertificateUrl)
    console.log('Bumiputera Certificate URL:', bumiputeraRegistrationCertificateUrl)

    const pdfBytesArray: Uint8Array[] = []

    // Step 1: Convert PO HTML to PDF
    console.log('Converting PO form to PDF...')
    const poPdfBytes = await htmlToPdf(poElement)
    pdfBytesArray.push(poPdfBytes)
    console.log('PO form converted successfully')

    // Step 2: Fetch Account Document PDF if available
    if (accountDocumentUrl) {
      console.log('Fetching Account Document...')
      try {
        const accountPdfBytes = await fetchPdfBytes(accountDocumentUrl)
        pdfBytesArray.push(accountPdfBytes)
        console.log('Account Document fetched successfully')
      } catch (error) {
        console.warn('Failed to fetch Account Document:', error)
        // Continue without this document
      }
    }

    // Step 3: Fetch MOF Certificate PDF if available
    if (mofCertificateUrl) {
      console.log('Fetching MOF Certificate...')
      try {
        const mofPdfBytes = await fetchPdfBytes(mofCertificateUrl)
        pdfBytesArray.push(mofPdfBytes)
        console.log('MOF Certificate fetched successfully')
      } catch (error) {
        console.warn('Failed to fetch MOF Certificate:', error)
        // Continue without this document
      }
    }

    // Step 4: Fetch Bumiputera Certificate PDF if available
    if (bumiputeraRegistrationCertificateUrl) {
      console.log('Fetching Bumiputera Certificate...')
      try {
        const bumiputeraPdfBytes = await fetchPdfBytes(bumiputeraRegistrationCertificateUrl)
        pdfBytesArray.push(bumiputeraPdfBytes)
        console.log('Bumiputera Certificate fetched successfully')
      } catch (error) {
        console.warn('Failed to fetch Bumiputera Certificate:', error)
        // Continue without this document
      }
    }

    // Step 5: Merge all PDFs
    console.log('Merging PDFs...')
    const mergedPdfBytes = await mergePdfs(pdfBytesArray)
    console.log('PDFs merged successfully')

    // Step 6: Create blob and URL
    const pdfBlob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' })
    const pdfUrl = URL.createObjectURL(pdfBlob)

    console.log('PDF merge complete')

    return {
      success: true,
      pdfBlob,
      pdfUrl,
    }
  } catch (error) {
    console.error('Error merging PDFs:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to merge PDFs',
    }
  }
}

/**
 * Open merged PDF in new window for printing
 */
export function openPdfForPrint(pdfUrl: string): void {
  const printWindow = window.open(pdfUrl, '_blank')

  if (printWindow) {
    printWindow.onload = () => {
      // Wait a bit for PDF to render, then trigger print
      setTimeout(() => {
        printWindow.print()
      }, 1000)
    }
  }
}

/**
 * Download merged PDF
 */
export function downloadPdf(pdfBlob: Blob, filename: string): void {
  const url = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Cleanup: revoke object URL when no longer needed
 */
export function cleanupPdfUrl(pdfUrl: string): void {
  URL.revokeObjectURL(pdfUrl)
}

