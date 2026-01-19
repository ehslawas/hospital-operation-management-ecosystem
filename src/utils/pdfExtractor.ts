import * as pdfjsLib from 'pdfjs-dist';

// Use static path from public folder - most reliable for PDF.js v5+ in Vite
const pdfjsWorker = '/pdf.worker.min.mjs';

// Export for use in other services to ensure consistency
export { pdfjsLib, pdfjsWorker };

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface LPOExtractedData {
    lpoNumber: string;
    lpoDate: string;
    supplierHint?: string;
    totalAmount?: number;
    itemHints?: string[];
    poHint?: string;
}

/**
 * Extracts LPO Number and LPO Date from a government LPO PDF document.
 * Also attempts to find supplier and total amount for matching.
 */
export const extractLPODataFromPDF = async (file: File): Promise<LPOExtractedData> => {
    try {
        console.log('Starting PDF extraction for file:', file.name);
        const arrayBuffer = await file.arrayBuffer();
        console.log('ArrayBuffer loaded, size:', arrayBuffer.byteLength);

        // Use static path for worker to avoid Vite dynamic import issues
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            // Use defaults that are safe for government docs
            useSystemFonts: true,
            isEvalSupported: false
        });

        const pdf = await loadingTask.promise;
        console.log('PDF document loaded, pages:', pdf.numPages);

        // Extract text from the first two pages and the last page
        let fullText = '';
        const pagesToScan = new Set<number>();

        // Always scan first two
        pagesToScan.add(1);
        if (pdf.numPages > 1) pagesToScan.add(2);
        // Also scan the last page where "Jumlah Keseluruhan" usually resides in long LPOs
        if (pdf.numPages > 2) pagesToScan.add(pdf.numPages);

        const allItems: any[] = [];

        for (const pageNum of Array.from(pagesToScan).sort((a, b) => a - b)) {
            console.log(`Scanning page ${pageNum}...`);
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageItems = textContent.items as any[];
            allItems.push(...pageItems);
            fullText += pageItems.map((item: any) => item.str).join(' ') + ' ';
        }

        const text = fullText;
        console.log('Text content extracted, total length:', text.length);

        // 1. Extract LPO Number (No. Dokumen / No. Pesanan / Local Purchase Order)
        let lpoNumber = '';
        const lpoPatterns = [
            /No\.?\s*(?:Dokumen|Pesanan|LPO|Kod)\s*[:\-]?\s*([A-Z0-9/.\-]+)/i,
            /Purchase\s*Order\s*No\.?\s*[:\-]?\s*([A-Z0-9/.\-]+)/i,
            /(CO\d{10,20})/i,
            /([A-Z]{2,}\/\d{4,}\/\d{4,})/
        ];

        for (const pattern of lpoPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                let found = match[1].trim();
                if (found.startsWith(':')) found = found.substring(1).trim();

                // Filter out common false positives like "KOD" if it's just the label
                if (found.toUpperCase() === 'KOD') continue;

                lpoNumber = found;
                break;
            }
        }

        // 2. Extract LPO Date (Tarikh Dokumen / Tarikh Pesanan)
        let formattedDate = '';
        const dateMatch = text.match(/Tarikh\s*(?:Dokumen|Pesanan)?\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
            text.match(/(\d{2}\/\d{2}\/\d{4})/);

        if (dateMatch) {
            const dateStr = dateMatch[1];
            const [day, month, year] = dateStr.split('/');
            formattedDate = `${year}-${month}-${day}`;
        }

        // 3. Extract Total Amount (RM / Jumlah / Ringgit Malaysia)
        let totalAmount = 0;
        // Search for all monetary patterns and take the one that looks most like a total
        const allAmountMatches = text.matchAll(/([\d,]+\.\d{2})/g);
        const amounts = Array.from(allAmountMatches).map(m => parseFloat(m[1].replace(/,/g, '')));

        // Specific patterns for total - Malaysian LPOs often use "JUMLAH KESELURUHAN" or "JUMLAH PESANAN"
        const totalMatch = text.match(/Jumlah\s*(?:Keseluruhan|Pesanan|LPO|Besar|Akan\s*Dibayar)?\s*(?:\(RM\))?\s*[:\-]?\s*RM?\s*([\d,]+\.\d{2})/i) ||
            text.match(/Ringgit\s*Malaysia\s*[:\-]?\s*RM\s*([\d,]+\.\d{2})/i) ||
            text.match(/Jumlah\s*Besar\s*[:\-]?\s*RM?\s*([\d,]+\.\d{2})/i) ||
            text.match(/([\d,]+\.\d{2})\s*(?:JUMLAH|TOTAL)/i) || // Reverse pattern - FIXED: Added capturing group
            text.match(/TOTAL\s*DUE\s*[:\-]?\s*RM?\s*([\d,]+\.\d{2})/i);

        if (totalMatch && totalMatch[1]) {
            totalAmount = parseFloat(totalMatch[1].replace(/,/g, ''));
        } else if (amounts.length > 0) {
            // Fallback: take the largest amount found, which is often the total
            totalAmount = Math.max(...amounts);
            console.log('Using largest amount as fallback total:', totalAmount);
        }

        // 4. Extract Supplier Hint
        let supplierHint = '';
        const supplierMatch = text.match(/Kepada\s*(?:Pembekal|Kontraktor)?\s*[:\-]?\s*([A-Z0-9\s,.-]{5,})\s*(?:No\.|Alamat|Tel|Attn)/i) ||
            text.match(/Pembekal\s*[:\-]?\s*([A-Z0-9\s,.-]{5,})\s*(?:No\.|Alamat|Tel|Attn)/i) ||
            text.match(/([A-Z0-9\s,.-]{10,})\s*(?:SDN\.\s*BHD\.|BHD\.)/i); // Match by SDN BHD suffix

        if (supplierMatch) {
            supplierHint = supplierMatch[1].trim().replace(/\s+/g, ' ');
        }

        // 5. Detect explicit PO Numbers for perfect matching
        // Pattern: PO-YYYY-NNNN or just YYYY-NNNN with various separators and optional spaces
        const poExplicitMatch = text.match(/PO\s*[-–—:]?\s*\d{4}\s*[-–—:]\s*\d{4,5}/i);
        const poLooseMatch = text.match(/\d{4}\s*[-–—]\s*\d{4,5}/);
        const poNumericMatch = text.match(/\b\d{4}-\d{4}\b/);

        let poHint = undefined;
        if (poExplicitMatch) {
            poHint = poExplicitMatch[0].replace(/\s+/g, '').toUpperCase();
        } else if (poLooseMatch) {
            poHint = `PO-${poLooseMatch[0].replace(/\s+/g, '')}`.toUpperCase();
        } else if (poNumericMatch) {
            poHint = `PO-${poNumericMatch[0].replace(/\s+/g, '')}`.toUpperCase();
        }

        // 6. Extract Item Hints
        const itemHints: string[] = [];
        const potentialItems = allItems
            .map(i => i.str.trim())
            .filter(str =>
                str.length > 3 && // Catch short abbreviations
                !['KERAJAAN', 'DOKUMEN', 'PESANAN', 'PEMBEKAL', 'KOD', 'JUMLAH', 'TOTAL', 'TARIKH'].some(k => str.toUpperCase().includes(k))
            );

        potentialItems.forEach(item => {
            // Match chemical names or common drug suffixes
            if (item.match(/\b(TAB|CAP|INJ|SUSP|MG|ML|IU|G|TABLET|CAPSULE|INJECTION|SOLUTION|CREAM)\b/i) ||
                item.match(/[A-Z]{5,}/) ||
                item.match(/\b\d+\s*(?:mg|ml|g|mcg|unit)\b/i)) {
                if (!itemHints.includes(item)) itemHints.push(item);
            }
        });

        console.log('Final Extracted Data:', { lpoNumber, lpoDate: formattedDate, supplierHint, totalAmount, poHint, itemsFound: itemHints.length });

        return {
            lpoNumber,
            lpoDate: formattedDate,
            supplierHint,
            totalAmount,
            itemHints: itemHints.slice(0, 15), // Scan more items
            poHint
        };
    } catch (error) {
        console.error('Error in extractLPODataFromPDF:', error);
        throw new Error('Failed to read PDF document. Please ensure it is a valid LPO PDF.');
    }
};
