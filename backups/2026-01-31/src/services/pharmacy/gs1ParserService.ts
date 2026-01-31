export interface GS1ParsedData {
    gtin?: string
    batchNumber?: string
    expiryDate?: string // YYYY-MM-DD
    serialNumber?: string
}

export const gs1ParserService = {
    /**
     * Parses a raw GS1 barcode string (DataMatrix or Code128)
     * Handles Application Identifiers (AIs):
     * 01: GTIN (14 digits)
     * 10: Batch/Lot (Variable length, ended by FNC1)
     * 17: Expiry (YYMMDD)
     * 21: Serial (Variable length)
     */
    parse(raw: string): GS1ParsedData {
        const result: GS1ParsedData = {}
        let cursor = 0

        // Remove known non-printable start chars if any (common in some scanner modes)
        const clean = raw.replace(/^\]d2/, '') // ]d2 is common prefix for GS1 DataMatrix

        while (cursor < clean.length) {
            const two = clean.slice(cursor, cursor + 2)

            if (two === '01') {
                // GTIN-14: Fixed length 14 digits
                result.gtin = clean.slice(cursor + 2, cursor + 16)
                cursor += 16
            } else if (two === '17') {
                // Expiry: Fixed length 6 digits (YYMMDD)
                const dateStr = clean.slice(cursor + 2, cursor + 8)
                if (dateStr.length === 6) {
                    const yy = parseInt(dateStr.slice(0, 2))
                    const mm = dateStr.slice(2, 4)
                    const dd = dateStr.slice(4, 6)
                    // GS1 Year logic: 00-49 = 2000-2049, 50-99 = 1950-1999. Assuming 20xx for pharmacy.
                    // Or typically simple 20+yy
                    const year = `20${dateStr.slice(0, 2)}`
                    result.expiryDate = `${year}-${mm}-${dd}`
                }
                cursor += 8
            } else if (two === '10') {
                // Batch: Variable length. Ends at separator (GS/FNC1) or end of string.
                // Note: In raw strings from JS scanners, FNC1 is often not visible or represented as specific char.
                // We'll take until end or known next AI start if we can detect it. 
                // But simplified: usually Batch is last or we assume clean delimiters if provided.
                // However, without FNC1, valid AIs are ambiguous.
                // Strategy: Consume until end of string OR until we hit a known fixed length valid AI check?
                // Simplest robust approach for GS1 composite without FNC1 is tricky. 
                // Let's assume typical ordering: 01... 17... 10... 
                cursor += 2
                const rest = clean.slice(cursor)
                // Heuristic: Batch usually alphanumeric. 
                // If we see a special separator char (like <GS> group separator \u001d), stop there.
                const separatorIdx = rest.search(/[\u001d]/)
                if (separatorIdx !== -1) {
                    result.batchNumber = rest.slice(0, separatorIdx)
                    cursor += separatorIdx + 1
                } else {
                    // Take rest as batch if no other known AIs follow?
                    result.batchNumber = rest
                    cursor += rest.length
                }
            } else if (two === '21') {
                // Serial: Variable length.
                cursor += 2
                const rest = clean.slice(cursor)
                const separatorIdx = rest.search(/[\u001d]/)
                if (separatorIdx !== -1) {
                    result.serialNumber = rest.slice(0, separatorIdx)
                    cursor += separatorIdx + 1
                } else {
                    result.serialNumber = rest
                    cursor += rest.length
                }
            } else {
                // Unknown AI or filler, skip 1 to try to realign? 
                // Or break to avoid infinite loop
                cursor++
            }
        }

        return result
    }
}
