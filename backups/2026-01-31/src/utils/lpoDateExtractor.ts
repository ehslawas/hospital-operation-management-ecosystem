import * as pdfjsLib from 'pdfjs-dist'
import Tesseract from 'tesseract.js'

// Configure PDF.js worker
// Use local worker via Vite import to avoid CORS issues with CDNs
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

interface DateExtractionResult {
    date: string | null // ISO YYYY-MM-DD
    confidence: number
    rawText: string
    isValid: boolean // New field to indicate if validation passed
}

interface ExtractionOptions {
    scale: number
    region: 'full' | 'bottom' | 'top' | 'header'
    enhanceContrast?: boolean
}

/**
 * Validates if a date is reasonable for LPO documents
 * - Year must be between 2020 and 2035 (reasonable range for procurement)
 * - Month must be 1-12
 * - Day must be valid for that month/year
 */
function isValidDate(day: number, month: number, year: number): boolean {
    // Check year is reasonable (procurement documents should be within this range)
    if (year < 2020 || year > 2035) {
        console.warn(`Date validation failed: Year ${year} is outside valid range (2020-2035)`)
        return false
    }

    // Check month is valid
    if (month < 1 || month > 12) {
        console.warn(`Date validation failed: Month ${month} is invalid`)
        return false
    }

    // Check day is valid for the month (using Date to handle leap years)
    const daysInMonth = new Date(year, month, 0).getDate()
    if (day < 1 || day > daysInMonth) {
        console.warn(`Date validation failed: Day ${day} is invalid for month ${month}/${year}`)
        return false
    }

    return true
}

/**
 * Formats and validates a date extracted from OCR
 * Returns null if the date is invalid
 */
function formatAndValidateDate(dayStr: string, monthStr: string, yearStr: string): string | null {
    const day = parseInt(dayStr, 10)
    const month = parseInt(monthStr, 10)
    const year = parseInt(yearStr, 10)

    // Validate before returning
    if (!isValidDate(day, month, year)) {
        console.warn(`Rejecting invalid date: ${dayStr}/${monthStr}/${yearStr}`)
        return null
    }

    // Format as YYYY-MM-DD for HTML date input
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

/**
 * Attempt extraction with specific options
 */
async function attemptExtraction(
    pdfUrl: string,
    options: ExtractionOptions
): Promise<DateExtractionResult> {
    try {
        console.log(`Attempting extraction with scale=${options.scale}, region=${options.region}`)

        // 1. Load PDF Document
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1) // LPO is usually single page

        // 2. Setup Viewport with configurable scale
        const viewport = page.getViewport({ scale: options.scale })

        // 3. Create Canvas
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Failed to create canvas context')

        canvas.height = viewport.height
        canvas.width = viewport.width

        // 4. Render PDF to Canvas
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        } as any

        await page.render(renderContext).promise

        // 5. Optional: Enhance contrast for better OCR
        if (options.enhanceContrast) {
            enhanceCanvasContrast(context, canvas.width, canvas.height)
        }

        // 6. Crop to specific region if needed
        let dataUrl: string

        if (options.region === 'header') {
            // SPECIALLY OPTIMIZED FOR LPO HEADER DATE
            // Skips the top 15% (logos/crest) and bottom 60%
            // Targets the "Tarikh Dokumen" box specifically (approx 15% - 40% height)
            const cropCanvas = document.createElement('canvas')
            const cropCtx = cropCanvas.getContext('2d')
            if (cropCtx) {
                const startY = Math.floor(canvas.height * 0.15) // Start below logo
                const cropHeight = Math.floor(canvas.height * 0.25) // Capture 25% height

                cropCanvas.width = canvas.width
                cropCanvas.height = cropHeight

                cropCtx.drawImage(
                    canvas,
                    0, startY, canvas.width, cropHeight,
                    0, 0, canvas.width, cropHeight
                )
                dataUrl = cropCanvas.toDataURL('image/png')
            } else {
                dataUrl = canvas.toDataURL('image/png')
            }

        } else if (options.region === 'bottom') {
            // Crop to bottom 40% of the page (delivery date often at bottom)
            const cropCanvas = document.createElement('canvas')
            const cropCtx = cropCanvas.getContext('2d')
            if (cropCtx) {
                const cropHeight = Math.floor(canvas.height * 0.4)
                cropCanvas.width = canvas.width
                cropCanvas.height = cropHeight
                cropCtx.drawImage(
                    canvas,
                    0, canvas.height - cropHeight, canvas.width, cropHeight,
                    0, 0, canvas.width, cropHeight
                )
                dataUrl = cropCanvas.toDataURL('image/png')
            } else {
                dataUrl = canvas.toDataURL('image/png')
            }
        } else if (options.region === 'top') {
            // Crop to top 40% of the page (general header scan)
            const cropCanvas = document.createElement('canvas')
            const cropCtx = cropCanvas.getContext('2d')
            if (cropCtx) {
                const cropHeight = Math.floor(canvas.height * 0.4)
                cropCanvas.width = canvas.width
                cropCanvas.height = cropHeight
                cropCtx.drawImage(
                    canvas,
                    0, 0, canvas.width, cropHeight,
                    0, 0, canvas.width, cropHeight
                )
                dataUrl = cropCanvas.toDataURL('image/png')
            } else {
                dataUrl = canvas.toDataURL('image/png')
            }
        } else {
            dataUrl = canvas.toDataURL('image/png')
        }

        // 7. Perform OCR with Tesseract - Enhanced settings
        console.log('Performing OCR...')
        const { data: { text, confidence } } = await Tesseract.recognize(
            dataUrl,
            'eng+msa', // Use English + Malay
            {
                logger: m => console.debug(m),
            }
        )

        console.log('OCR Confidence:', confidence)
        console.log('OCR Raw Text (first 500 chars):', text.substring(0, 500))

        // 8. Parse Date with Keyword Associativity and VALIDATION
        const lines = text.split('\n')
        let bestDate: string | null = null
        let dateIsValid = false

        // Regex that allows optional spaces around separators (common OCR issue)
        // Matches: 21/02/2026, 21 / 02 / 2026, 21-02-2026, etc.
        const datePattern = /(\d{1,2})\s*[\\/\-\.]\s*(\d{1,2})\s*[\\/\-\.]\s*(\d{4})/
        const deliveryKeywords = ['serahan', 'delivery', 'sebelum', 'before', 'supply', 'delivered', 'hingga', 'tarikh', 'dokumen']

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const lowerLine = line.toLowerCase()

            if (deliveryKeywords.some(k => lowerLine.includes(k))) {
                // Check current line
                let match = line.match(datePattern)

                // If not found, check next 2 lines (for headers like "Tarikh Dokumen" \n "22/01/2026")
                if (!match && i + 1 < lines.length) {
                    match = lines[i + 1].match(datePattern)
                    if (match) console.log(`✓ Found date on next line after keyword "${line.trim()}": ${match[0]}`)
                }
                if (!match && i + 2 < lines.length) {
                    match = lines[i + 2].match(datePattern)
                    if (match) console.log(`✓ Found date on 2nd line after keyword "${line.trim()}": ${match[0]}`)
                }

                if (match) {
                    const validatedDate = formatAndValidateDate(match[1], match[2], match[3])
                    if (validatedDate) {
                        bestDate = validatedDate
                        dateIsValid = true
                        console.log(`✓ Found valid keyword match: "${line.trim()}" -> ${bestDate}`)
                        break
                    }
                }
            }
        }

        // Priority 2: If no keyword match, look for ALL dates and pick the most reasonably late one (delivery date)
        if (!bestDate) {
            const allDates = [...text.matchAll(new RegExp(datePattern, 'g'))]
            console.log(`Found ${allDates.length} date patterns in document`)

            // Try each date found, prefer later ones (delivery date usually at bottom)
            for (let i = allDates.length - 1; i >= 0; i--) {
                const match = allDates[i]
                const validatedDate = formatAndValidateDate(match[1], match[2], match[3])
                if (validatedDate) {
                    bestDate = validatedDate
                    dateIsValid = true
                    console.log(`✓ Using validated date #${i}: ${bestDate}`)
                    break
                }
            }

            // Priority 3: Try alternative format (YYYY/MM/DD) with spaces
            if (!bestDate) {
                const isoPattern = /(\d{4})\s*[\\/\-\.]\s*(\d{1,2})\s*[\\/\-\.]\s*(\d{1,2})/
                for (const line of lines) {
                    const match = line.match(isoPattern)
                    if (match) {
                        const validatedDate = formatAndValidateDate(match[3], match[2], match[1]) // Note swap for d/m/y args
                        if (validatedDate) {
                            bestDate = validatedDate
                            dateIsValid = true
                            console.log(`✓ Found alternative format date: ${bestDate}`)
                            break
                        }
                    }
                }
            }
        }

        return {
            date: bestDate,
            confidence: confidence,
            rawText: text,
            isValid: dateIsValid
        }

    } catch (error) {
        console.error('Extraction attempt failed:', error)
        return {
            date: null,
            confidence: 0,
            rawText: '',
            isValid: false
        }
    }
}

/**
 * Enhance canvas contrast for better OCR
 */
function enhanceCanvasContrast(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Increase contrast
    const factor = 1.5 // Contrast factor
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128))     // R
        data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)) // G
        data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)) // B
    }

    ctx.putImageData(imageData, 0, 0)
}

/**
 * Main extraction function with fallback attempts
 */
export const extractLPODeliveryDate = async (pdfUrl: string): Promise<DateExtractionResult> => {
    console.log('═══════════════════════════════════════════════')
    console.log('Starting LPO Date Extraction for:', pdfUrl)
    console.log('═══════════════════════════════════════════════')

    // Attempt 1: SPECIFIC HEADER BOX (Fastest & Most Targeted)
    // 15% to 40% from top. Skips Logo.
    console.log('Attempt 1: Header region (Scale 3.0)...')
    let result = await attemptExtraction(pdfUrl, { scale: 3.0, region: 'header' })
    if (result.date && result.isValid && result.confidence >= 60) {
        console.log('✓ Attempt 1 succeeded (header region)')
        return result
    }

    // Attempt 2: Bottom half (Fallback if header missed)
    console.log('Attempt 1 failed, trying Bottom region...')
    result = await attemptExtraction(pdfUrl, { scale: 3.0, region: 'bottom' })
    if (result.date && result.isValid && result.confidence >= 60) {
        console.log('✓ Attempt 2 succeeded (bottom region)')
        return result
    }

    // Attempt 3: Full Page (Fallback)
    console.log('Attempt 2 failed, trying Full page...')
    result = await attemptExtraction(pdfUrl, { scale: 3.0, region: 'full' })
    if (result.date && result.isValid) {
        console.log('✓ Attempt 3 succeeded (full page)')
        return result
    }

    // Attempt 4: Fallback
    console.log('Attempt 3 failed, trying Enhanced Contrast...')
    result = await attemptExtraction(pdfUrl, {
        scale: 3.0,
        region: 'full',
        enhanceContrast: true
    })
    if (result.date && result.isValid) {
        console.log('✓ Attempt 4 succeeded (enhanced contrast)')
        return result
    }

    console.log('═══════════════════════════════════════════════')
    console.log('All extraction attempts failed or returned invalid dates')
    console.log('═══════════════════════════════════════════════')

    // Return the best attempt
    return {
        date: null,
        confidence: result.confidence,
        rawText: result.rawText,
        isValid: false
    }
}
