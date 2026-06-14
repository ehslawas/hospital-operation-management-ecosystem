import Tesseract from 'tesseract.js'

export interface ScannedDOItem {
    item_code: string | null
    description: string | null
    quantity: number | null
    batch_number: string | null
    manufactured_date: string | null
    expiry_date: string | null
}

export interface DOScanResult {
    items: ScannedDOItem[]
    do_number: string | null
    supplier_name: string | null
    delivery_date: string | null
}

export const doScannerService = {
    /**
     * Scans a DO image and returns structured data
     * Uses Tesseract.js for client-side OCR
     */
    async scanDO(file: File, onProgress?: (msg: string) => void): Promise<DOScanResult> {
        try {
            console.log('[doScannerService] Starting scan for:', file.name)
            if (onProgress) onProgress('Initializing AI...')

            // 1. Perform OCR
            const { data: { text } } = await Tesseract.recognize(file, 'eng+msa', {
                logger: m => {
                    console.log(m)
                    if (onProgress && m.status === 'recognizing text') {
                        const pct = Math.round(m.progress * 100)
                        onProgress(`Reading Text (${pct}%)`)
                    } else if (onProgress && m.status.includes('loading')) {
                        onProgress('Loading AI Models...')
                    }
                }
            })

            console.log('[doScannerService] OCR Text length:', text.length)
            if (onProgress) onProgress('Parsing Data...')

            // 2. Parse text with Regex
            return this.parseText(text)
        } catch (err) {
            console.error('DO Scan failed:', err)
            throw new Error('Failed to parse DO. Please try again with a clearer photo.')
        }
    },

    /**
     * Basic Regex-based parser for Pharmaniaga-style DO text
     */
    parseText(text: string): DOScanResult {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        const items: ScannedDOItem[] = []
        let do_number = null

        // Try to find DO Number
        // Example: DO Ref No. : 1622596325
        const doMatch = text.match(/DO Ref No\D+(\d+)/i) || text.match(/DO No\D+(\d+)/i)
        if (doMatch) do_number = doMatch[1]

        console.log('[doScannerService] Parsing lines:', lines.length)

        // Parse items
        // Example: 1 D07.4201.06 *BCG VACCINE FREEZE... 1 PCK E2401 ... 31-MAR-24 31-AUG-26
        lines.forEach((line, idx) => {
            // Match pattern: [No] [Product Code] [Description...] [Qty] [Unit] [Batch] [Mfg] [Exp]
            const codeMatch = line.match(/([DLU]\d{2}\.\d{4}\.\d{2}[A-Za-z]?)/i)

            if (codeMatch) {
                const itemCode = codeMatch[1].toUpperCase()

                // Now look for Batch and Dates in the same or subsequent lines
                const batchPattern = /([A-Z0-9]{5,15})\s+(\d{1,2}[-\/]\w+[-\/]\d{2,4})/i
                const batchMatch = line.match(batchPattern) || (lines[idx + 1] && lines[idx + 1].match(batchPattern))

                // Extract Qty - usually a number before PCK/BOX/UNIT or directly after description
                const qtyMatch = line.match(/(\d+)\s+(PCK|BOX|UNIT|EA|PCS|BAG)/i) || line.match(/\s+(\d+)\s+[A-Z0-9]{5,}/i)

                // Extract dates
                const datePattern = /(\d{1,2}[-\/]\w+[-\/]\d{2,4})/g
                const dates = line.match(datePattern) || []

                items.push({
                    item_code: itemCode,
                    description: null,
                    quantity: qtyMatch ? parseInt(qtyMatch[1]) : null,
                    batch_number: batchMatch ? batchMatch[1] : (line.match(/\s([A-Z0-9]{5,15})\s/i)?.[1] || null),
                    manufactured_date: dates.length >= 2 ? this.normalizeDate(dates[dates.length - 2]) : null,
                    expiry_date: dates.length >= 1 ? this.normalizeDate(dates[dates.length - 1]) : null
                })
            }
        })

        // Clean up items (remove duplicates if any)
        const uniqueItems = items.filter((item, index, self) =>
            index === self.findIndex((t) => (
                t.item_code === item.item_code && t.batch_number === item.batch_number
            ))
        )

        return {
            items: uniqueItems,
            do_number,
            supplier_name: null,
            delivery_date: null
        }
    },

    /**
     * Helper to convert various date formats to YYYY-MM-DD
     */
    normalizeDate(dateStr: string): string | null {
        if (!dateStr) return null

        // Handle DD-MMM-YY (e.g., 31-AUG-26)
        const months: Record<string, string> = {
            'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
            'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
        }

        const parts = dateStr.toUpperCase().split(/[-\/\.\s]+/)
        if (parts.length === 3) {
            let day = parts[0].padStart(2, '0')
            let month = months[parts[1]] || parts[1].padStart(2, '0')
            let year = parts[2]

            if (year.length === 2) year = '20' + year

            return `${year}-${month}-${day}`
        }

        return null
    }
}
