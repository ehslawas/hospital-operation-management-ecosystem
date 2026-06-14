import * as pdfjsLib from 'pdfjs-dist';

// Use static path from public folder
const pdfjsWorker = '/pdf.worker.min.mjs';

export { pdfjsLib, pdfjsWorker };

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;


export interface LPOExtractedData {
    lpoNumber: string;
    lpoDate: string;
    supplierHint?: string;
    totalAmount?: number;
    contractNumber?: string;       // KKM Contract Number
    ptjCode?: string;              // PTJ Code 42152701
    voteCode?: string;             // Vote/Dana code (080702)
    voteActivity?: string;         // Activity code
    documentControlNumber?: string; // No. Dokumen Kawalan
    poHint?: string;
    deliveryDate?: string;
    extractedItems: {
        name: string;
        code?: string;             // Item code from Kod Item column
        quantity?: number;
        price?: number;
        lineTotal?: number;        // Total for this line
    }[];
    rawText?: string;
}

/**
 * Basic PDF text extraction - Clean Slate
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, useSystemFonts: true });
        const pdf = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Join items with specialized separator to preserve table structure hints
            // Use 2 spaces for visual separation, which helps regex
            fullText += textContent.items.map((item: any) => item.str).join('  ') + '\n';
        }

        return fullText;
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Failed to read PDF.');
    }
};

export interface PDFTextItem {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Extract text with coordinates from the first page of the PDF
 */
export const extractPositionedText = async (file: File): Promise<PDFTextItem[]> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, useSystemFonts: true });
        const pdf = await loadingTask.promise;

        // Only process the first page as per LPO requirements
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();

        const items: PDFTextItem[] = textContent.items.map((item: any) => {
            // Transform matrix: [scaleX, skewY, skewX, scaleY, translateX, translateY]
            // We care about translateX (x) and translateY (y)
            const tx = item.transform;
            return {
                text: item.str,
                x: tx[4],
                y: tx[5],
                width: item.width,
                height: item.height
            };
        });

        return items;
    } catch (error) {
        console.error('Error extracting positioned text:', error);
        return [];
    }
};

/**
 * Deterministic LPO data extraction from raw PDF text
 * Specialized for Malaysian Government LPO Format
 * REFACTORED: Now uses coordinate-based line reconstruction for accurate table parsing
 */
export const extractLPODataFromPDF = async (file: File): Promise<LPOExtractedData> => {
    // 1. Extract text with coordinates to reconstruct physical lines
    // This fixes the issue where pdf.js dumps everything as one long string
    const textItems = await extractPositionedText(file);

    // Sort by Y (vertical), then X (horizontal) checks
    // Note: PDF Y-coordinates usually go from bottom-left (0,0) to top-right. 
    // Higher Y means higher up on the page? No, usually in pdf.js:
    // Page coordinate system: (0,0) is usually bottom-left.
    // So distinct Y values usually indicate new lines.
    // BUT! Sometimes Y is inverted depending on the pdf.js build or viewport. 
    // We will assume standard sorting: Sort by Y descending (top to bottom), then X ascending.

    // Quick heuristic to check coordinate system direction if needed, but standard is:
    textItems.sort((a, b) => {
        // Round Y to nearest integer to handle slight misalignments
        const yA = Math.round(a.y);
        const yB = Math.round(b.y);
        if (yA !== yB) {
            return yB - yA; // Descending Y (Top to Bottom)
        }
        return a.x - b.x; // Ascending X (Left to Right)
    });

    // Group into lines based on Y-proximity
    const lines: string[] = [];
    let currentLine: { text: string, y: number }[] = [];

    for (const item of textItems) {
        if (currentLine.length === 0) {
            currentLine.push(item);
            continue;
        }

        const lastItem = currentLine[currentLine.length - 1];
        // Threshold for being on the "same line" (e.g., 4 units)
        if (Math.abs(item.y - lastItem.y) < 6) {
            currentLine.push(item);
        } else {
            // New line detected
            // Join current line items by space
            // Use double space if large gap? For now single space is safer for regex words
            lines.push(currentLine.map(i => i.text).join(' '));
            currentLine = [item];
        }
    }
    // Push the last line
    if (currentLine.length > 0) {
        lines.push(currentLine.map(i => i.text).join(' '));
    }

    // Identify full raw text for global searches
    const rawText = lines.join('\n');

    // Debug log
    console.log(`Reconstructed ${lines.length} lines from PDF`);

    // --- EXTRACTION LOGIC ---

    // 1. Extract Document Number (No. Dokumen)
    // Relaxed Regex Strategy to catch more formats
    let lpoNumber = '';

    // Strategy A: Explicit Label (Dokumen / Pesanan / Rujukan / Purchase Order)
    const labelMatch = rawText.match(/(?:No\.?|Nombor)\s*(?:Dokumen|Pesanan|Rujukan|Local Order|Purchase Order)\s*[:\.]?\s*([A-Z0-9\-\/]{6,})/i);

    // Strategy B: Generic "No." or "No" label but with stricter value check (must look like an ID)
    const genericNoMatch = rawText.match(/(?:No\.|No)\s*[:\.]?\s*([A-Z0-9\-\/]{8,})/);

    // Strategy C: Prefix Match (LPO, PO, QT, CO) - Standalone
    const prefixMatch = rawText.match(/\b(LPO|PO|QT|CO|LO)[-.]?(\d{5,})\b/i);

    if (labelMatch) {
        lpoNumber = labelMatch[1];
    } else if (prefixMatch) {
        lpoNumber = prefixMatch[0]; // e.g. LPO-12345
    } else if (genericNoMatch) {
        // Validation: generic match shouldn't be just a date like 2024/01/01
        if (!genericNoMatch[1].match(/^\d{2,4}\/\d{1,2}\/\d{2,4}$/)) {
            lpoNumber = genericNoMatch[1];
        }
    } else {
        // Last resort: Old CO2 match
        const coMatch = rawText.match(/CO2\d{9,}/i);
        if (coMatch) lpoNumber = coMatch[0];
    }

    // Cleanup: Remove trailing punctuation if any caught
    lpoNumber = lpoNumber.replace(/[\.,:;]$/, '').trim();

    // 2. Extract Document Date (Tarikh Dokumen)
    const docDateMatch = rawText.match(/Tarikh\s*Dokumen\s*[:\.]?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
        rawText.match(/(\d{2}\/\d{2}\/\d{4})/);
    let lpoDate = '';
    if (docDateMatch) {
        const matchVal = docDateMatch[1] || docDateMatch[0];
        // Basic validation to ensure it's a date and not some other number
        if (matchVal.includes('/')) {
            const [d, m, y] = matchVal.split('/');
            lpoDate = `${y}-${m}-${d}`;
        }
    }

    // 3. Extract Contract Number
    let contractNumber: string | undefined;
    const kkmMatch = rawText.match(/(KKM[\w\-\.\/]+)/i);
    if (kkmMatch) {
        contractNumber = kkmMatch[1];
    } else {
        const genericMatch = rawText.match(/No\.?\s*Kontrak[^:]*[:\.]\s*(?:Surat\s*Setuju\s*Terima\s*(?:Rujukan|Ruj)?\s*[:\.]?)?\s*([A-Z0-9\/\.-]{5,})/i);
        if (genericMatch) {
            contractNumber = genericMatch[1].trim();
        }
    }

    // 4. Extract Supplier Name (Enhanced)
    let supplierHint = '';

    // Strategy: Scan lines for "Kepada Pembekal" OR strict suffix matches
    // Since we now have reliable lines, we can check line-by-line

    const invalidSupplierSubstrings = [
        'PESANAN KERAJAAN', 'SILA KEMUKAKAN', 'TANDATANGAN', 'PENGAKUAN',
        'KEMENTERIAN KESIHATAN', 'PEGAWAI PENGAWAL', 'UNIT', 'VOT', 'DANA',
        'COP RASMI', 'SYARIKAT', 'ALAMAT', 'TEL'
    ];

    for (const line of lines) {
        const cleanLine = line.trim();

        // Priority 1: Label Match
        const labelMatch = cleanLine.match(/(?:Kepada|Nama)\s*(?:Pembekal|Kontraktor)\s*[:\.]?\s*([^\n\r]+)/i);
        if (labelMatch) {
            const candidate = labelMatch[1].trim();
            if (candidate.length > 3 && !invalidSupplierSubstrings.some(invalid => candidate.toUpperCase().includes(invalid))) {
                supplierHint = candidate;
                break; // High confidence
            }
        }

        // Priority 2: Suffix Match (SDN BHD, etc.) - Standalone Line
        // This is excellent for lines like "LF MERCU SDN. BHD." that sit alone
        if (cleanLine.match(/(?:SDN\.?\s*BHD\.?|BHD\.?|PLT|ENTERPRISE|PHARMACY|TRADING|CO\.?)$/i)) {
            // Check if it's NOT a government header
            if (!cleanLine.toUpperCase().includes('KEMENTERIAN') && cleanLine.length > 5) {
                // Often the best hint is the FIRST line that looks like a company
                // Only set if we haven't found a label match yet
                if (!supplierHint) {
                    supplierHint = cleanLine;
                }
            }
        }
    }

    // Cleanup Supplier
    supplierHint = supplierHint.replace(/No\.\s*Pendaftaran.*/i, '').trim();


    // 5. & 6. Vote Code & PTJ (Global regex still works fine here)
    const voteMatch = rawText.match(/(\d{6})\b.*\b(\d{5})\b/) || rawText.match(/(?:Vot|Dana).*?([A-Z]\d{2,})\s+(\d{6})/i);
    const voteCode = voteMatch ? (voteMatch[1] || voteMatch[2]) : undefined;

    const ptjMatch = rawText.match(/Kod\s*Kump\.?\s*PTJ.*?(\d{8})/i);
    const ptjCode = ptjMatch ? ptjMatch[1] : undefined;

    // 7. Total Amount
    const totalMatch = rawText.match(/Jumlah\s*(?:Keseluruhan|Amaun).*?(?:RM|:)?\s*([\d,]+\.?\d{2})/i);
    const totalAmount = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;

    // 8. Extract Items (The Core Fix)
    const extractedItems: {
        name: string;
        code?: string;
        quantity?: number;
        price?: number;
        lineTotal?: number;
    }[] = [];

    const HEADER_KEYWORDS = ['AMAUN', 'HARGA', 'SEUNIT', 'KUANTITI', 'PERIHAL', 'KOD', 'ITEM', 'UNIT'];

    for (const line of lines) {
        const upperLine = line.toUpperCase();

        // STRONG HEADER GUARD
        // If line contains 2+ header words, skip it.
        if (HEADER_KEYWORDS.filter(k => upperLine.includes(k)).length >= 2) {
            continue;
        }

        // --- Item Regex Strategy ---
        // Now that 'line' is a true row, anchors ^ and $ work.

        // Pattern 1: Explicit Code First
        // "C010... Name... Qty... Price... Total"
        // Regex needs to be tolerant of spacing
        const codeMatch = line.match(/^\s*([A-Z0-9.\-]{5,20})\s+(.+?)\s+(\d+(?:[\.,]\d+)?)\s+(?:UNIT|BOX|EA|SET|NOS)?\s+(\d+(?:[\.,]\d+)?)\s+(\d+(?:[\.,]\d+)?)/i);

        if (codeMatch) {
            const code = codeMatch[1];
            const name = codeMatch[2].trim();
            // Anti-false positive: Code shouldn't be "1" (index) or "2026" (date part)
            if (code.length > 4 && !/^\d{4}$/.test(code)) {
                extractedItems.push({
                    code: code,
                    name: name,
                    quantity: parseFloat(codeMatch[3].replace(/,/g, '')),
                    price: parseFloat(codeMatch[4].replace(/,/g, '')),
                    lineTotal: parseFloat(codeMatch[5].replace(/,/g, ''))
                });
                continue;
            }
        }

        // Pattern 2: Description + "Sebanyak" + Qty
        // "Tender Pembekalan... Sebanyak 23,577,000 Tablet"
        const sebanyakMatch = line.match(/^(.*?)\s+Sebanyak\s+([\d,]+)(?:\.\d+)?\s*([A-Za-z]+)?/i);
        if (sebanyakMatch) {
            extractedItems.push({
                name: sebanyakMatch[1].trim(),
                quantity: parseFloat(sebanyakMatch[2].replace(/,/g, '')),
                price: 0,
                lineTotal: 0
            });
            continue;
        }

        // Pattern 3: Description First (Implicit)
        // "<Name> <Qty> <Unit?> <Price> <Total>"
        // Relies on finding the numbers at the END of the line to anchor

        // Look for 3 numbers at the end (Qty, Price, Total) OR 2 numbers (Qty, Price/Total)
        // We use $ anchor to be safe
        const tailNumsMatch = line.match(/(.+?)\s+(\d+(?:[\.,]\d+)?)\s*(?:UNIT|BOX|EA|SET|NOS|TABLET)?\s*(?:RM\s*)?(\d+(?:[\.,]\d+)?)\s*(?:RM\s*)?(\d+(?:[\.,]\d+)?)\s*$/i);

        if (tailNumsMatch) {
            const probableName = tailNumsMatch[1].trim();
            // Guard: Name shouldn't be just a number or date or header
            if (probableName.length > 8 && !/^\d+$/.test(probableName) && !HEADER_KEYWORDS.some(k => probableName.toUpperCase().includes(k))) {
                extractedItems.push({
                    name: probableName,
                    quantity: parseFloat(tailNumsMatch[2].replace(/,/g, '')),
                    price: parseFloat(tailNumsMatch[3].replace(/,/g, '')),
                    lineTotal: parseFloat(tailNumsMatch[4].replace(/,/g, ''))
                });
                continue;
            }
        }
    }

    // Activity Code Search
    let voteActivity = undefined;
    const activityMatch = rawText.match(/Aktiviti\s*[:\.]?\s*(\d{5})/i) || rawText.match(/\b(\d{5})\b/g);
    if (activityMatch) {
        if (Array.isArray(activityMatch)) {
            voteActivity = activityMatch.find((s: string) => s.startsWith('2') || s.startsWith('0'));
        } else {
            voteActivity = activityMatch[1];
        }
    }

    return {
        lpoNumber,
        lpoDate,
        supplierHint,
        totalAmount,
        contractNumber,
        ptjCode,
        voteCode,
        voteActivity,
        extractedItems,
        rawText
    };
};
