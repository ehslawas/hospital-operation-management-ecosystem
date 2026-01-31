import { extractLPODataFromPDF } from '@/utils/pdfExtractor'
import { PurchaseOrderWithRelations } from '@/types/pharmacy'
import { ExtractedLPOData, LPOMatchResult } from '@/types/pharmacy/procurementNew'

// ------------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------------

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
    const matrix = []
    let i, j

    if (a.length === 0) return b.length
    if (b.length === 0) return a.length

    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i]
    }

    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j
    }

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                )
            }
        }
    }

    return matrix[b.length][a.length]
}

function calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()

    if (s1 === s2) return 1
    if (s1.includes(s2) || s2.includes(s1)) return 0.9 // Substring match is strong

    const distance = levenshteinDistance(s1, s2)
    const maxLength = Math.max(s1.length, s2.length)
    if (maxLength === 0) return 1

    return 1 - (distance / maxLength)
}

// ------------------------------------------------------------------
// SERVICE IMPLEMENTATION
// ------------------------------------------------------------------

export const lpoDocumentExtractionService = {

    // Always configured now since it's local
    isConfigured(): boolean {
        return true
    },


    // Extract Data from LPO PDF (Local Deterministic Version)
    async extractLPOFromPDF(file: File): Promise<ExtractedLPOData> {
        try {
            // Use the local deterministic parser
            const extraction = await extractLPODataFromPDF(file);

            return {
                documentNumber: extraction.lpoNumber || '',
                documentDate: extraction.lpoDate || '',
                supplierName: extraction.supplierHint || '',
                supplierAddress: '',
                voteCode: extraction.voteCode || '',
                voteActivity: extraction.voteActivity || '',
                contractNumber: extraction.contractNumber,
                ptjCode: extraction.ptjCode,
                documentControlNumber: extraction.documentControlNumber,
                items: extraction.extractedItems.map(i => ({
                    itemCode: i.code || '',
                    itemName: i.name,
                    quantity: i.quantity || 0,
                    unitPrice: i.price || 0,
                    amount: i.lineTotal || (i.quantity || 0) * (i.price || 0)
                })),
                totalAmount: extraction.totalAmount || 0,
                confidence: 85,
                rawText: extraction.rawText
            }
        } catch (error) {
            console.error('Local LPO Extraction Failed:', error)
            throw new Error('Failed to parse PDF. Please ensure it is a valid LPO document.')
        }
    },

    // Match LPO to Pending POs
    async matchLPOToPurchaseOrders(
        extractedData: ExtractedLPOData,
        pendingPOs: PurchaseOrderWithRelations[]
    ): Promise<LPOMatchResult> {

        let bestMatch: PurchaseOrderWithRelations | undefined
        let highestScore = 0
        let matchReasons: string[] = []
        let alternativePOs: PurchaseOrderWithRelations[] = []

        // Helper to normalize strings for comparison
        const normalize = (str?: string) => str ? str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';

        // --- SMART FILTERING OPTIMIZATION ---
        // If we have a clear Contract Number, we can ignore 99% of POs.
        // This drastically reduces waiting time.
        let candidatesToScan = pendingPOs

        if (extractedData.contractNumber) {
            const rawContract = normalize(extractedData.contractNumber)
            // Strict pre-filter: Only check POs with this contract
            const filtered = pendingPOs.filter(po => normalize(po.kkm_contract_number) === rawContract)

            if (filtered.length > 0) {
                console.log(`Smart Filter: Reduced ${pendingPOs.length} -> ${filtered.length} candidates using Contract Num ${extractedData.contractNumber}`)
                candidatesToScan = filtered
            } else {
                console.log(`Smart Filter: Contract Num ${extractedData.contractNumber} found in PDF but no matching POs. Falling back to full scan.`)
            }
        }

        // Iterate through candidates and score them
        const candidates = candidatesToScan.map(po => {
            let score = 0
            const reasons: string[] = []

            // ---------------------------------------------------------
            // TIER 0: LPO Number Match (Highest Priority)
            // ---------------------------------------------------------
            // If the PO already has an LPO record with this number, it's a perfect match
            if (extractedData.documentNumber && (po as any).lpo) {
                const lpoData = (po as any).lpo
                const lpos = Array.isArray(lpoData) ? lpoData : [lpoData]
                const hasMatchingLpo = lpos.some((l: any) => 
                    l.lpo_number && normalize(l.lpo_number) === normalize(extractedData.documentNumber)
                )
                
                if (hasMatchingLpo) {
                    score += 100
                    reasons.push(`Existing LPO Number Match: ${extractedData.documentNumber}`)
                }
            }

            // ---------------------------------------------------------
            // TIER 1: Contract Number Match (The "Golden Key")
            // ---------------------------------------------------------
            if (extractedData.contractNumber && po.kkm_contract_number) {
                // Re-verify logic (redundant if filtered, but safe)
                if (normalize(extractedData.contractNumber) === normalize(po.kkm_contract_number)) {
                    score += 100; // Instant high confidence
                    reasons.push(`Contract Number Match: ${extractedData.contractNumber}`);
                }
            }

            // ---------------------------------------------------------
            // TIER 2: Item Code Match
            // ---------------------------------------------------------
            let itemCodeMatches = 0;

            if (extractedData.items.length > 0 && po.items && po.items.length > 0) {
                extractedData.items.forEach(lpoItem => {
                    const matchedPoItem = po.items?.find(pi =>
                        // Match if Item Code exists and matches
                        (lpoItem.itemCode && pi.item_code && normalize(lpoItem.itemCode) === normalize(pi.item_code))
                    );

                    if (matchedPoItem) {
                        itemCodeMatches++;
                        // Verify quantity for bonus points
                        if (lpoItem.quantity === matchedPoItem.quantity_ordered) {
                            score += 20;
                            reasons.push(`Item Code & Qty Match: ${lpoItem.itemCode}`);
                        } else {
                            score += 15;
                            reasons.push(`Item Code Match: ${lpoItem.itemCode}`);
                        }
                    }
                });
            }

            // ---------------------------------------------------------
            // TIER 3: Vote Code & Activity Match
            // ---------------------------------------------------------
            if (extractedData.voteCode && po.vote_code) {
                if (normalize(extractedData.voteCode) === normalize(po.vote_code)) {
                    score += 10;
                    reasons.push(`Vote Code Match: ${extractedData.voteCode}`);
                }
            }

            // ---------------------------------------------------------
            // TIER 4: Fuzzy Logic (Fallback)
            // ---------------------------------------------------------

            // 4a. Item Name Similarity (25% Weight)
            let itemMatchScore = 0
            let matchedItemName = ''

            if (extractedData.items && extractedData.items.length > 0 && po.items && po.items.length > 0) {
                for (const lpoItem of extractedData.items) {
                    for (const poItem of po.items) {
                        const similarity = calculateSimilarity(lpoItem.itemName, poItem.item_name || '')
                        if (similarity > itemMatchScore) {
                            itemMatchScore = similarity
                            matchedItemName = `${lpoItem.itemName} ≈ ${poItem.item_name}`
                        }
                    }
                }
            }

            if (itemMatchScore > 0.7) {
                score += (itemMatchScore * 25)
                reasons.push(`Item Name Match: ${matchedItemName} (${Math.round(itemMatchScore * 100)}%)`)
            }

            // 4b. Supplier Name Match (15% Weight)
            const supplierSimilarity = calculateSimilarity(extractedData.supplierName, po.supplier?.company_name || '')
            if (supplierSimilarity > 0.6) {
                score += (supplierSimilarity * 15)
                reasons.push(`Supplier Name Match: ${extractedData.supplierName} (${Math.round(supplierSimilarity * 100)}%)`)
            }

            // 4c. Amount Match (20% Weight)
            const extractedTotal = extractedData.totalAmount;
            const poTotal = po.total_amount || po.items?.reduce((sum, i) => sum + (i.total_price || 0), 0) || 0;

            if (extractedTotal > 0 && poTotal > 0) {
                const diff = Math.abs(poTotal - extractedTotal)
                const percentDiff = diff / poTotal

                if (percentDiff < 0.01) { // Exact match (within 1%)
                    score += 30; // High confidence for exact amount
                    reasons.push(`Exact Amount Match: RM${extractedTotal}`);
                } else if (percentDiff < 0.05) { // Within 5%
                    score += 15;
                    reasons.push(`Close Amount Match: RM${extractedTotal} ≈ RM${poTotal}`);
                }
            }

            return { po, score: Math.min(score, 100), reasons }
        })

        // Sort candidates by score
        candidates.sort((a, b) => b.score - a.score)

        if (candidates.length > 0) {
            const topCandidate = candidates[0]
            highestScore = topCandidate.score
            bestMatch = topCandidate.po
            matchReasons = topCandidate.reasons

            // Get alternatives (next 2 candidates with score > 40)
            alternativePOs = candidates.slice(1, 4)
                .filter(c => c.score > 40)
                .map(c => c.po)
        }

        return {
            extractedData,
            matchedPO: highestScore > 50 ? bestMatch : undefined, // Only return match if score > 50
            confidenceScore: highestScore,
            matchReasons,
            alternativePOs
        }
    }

}
