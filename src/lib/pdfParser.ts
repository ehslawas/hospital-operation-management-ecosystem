import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker for simplicity in Vite environments
// Matches the version installed (4.10.38)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

/**
 * Extracts text from the first page of a PDF file and finds the LPO number.
 * Looks for patterns like PO26..., CO26..., LPO-..., etc.
 */
export async function extractLpoNumberFromPdf(file: File): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Scan up to 3 pages to find the LPO number
    const maxPages = Math.min(pdf.numPages, 3);
    let text = '';
    
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      text += ' ' + pageText;
    }
    
    // 1. Try label-based search first (highly accurate, matches e.g. "NO. PESANAN (LPO) : PO-2026-0407")
    const labelRegex = /(?:No\.\s*Pesanan\s*\(LPO\)|No\s*Pesanan\s*LPO|Pesanan\s*\(?LPO\)?)\s*:\s*([A-Z0-9\-_/]+)/i;
    const labelMatch = text.match(labelRegex);
    if (labelMatch) {
      return labelMatch[1].trim();
    }
    
    // 2. Try patterns like PO-2026-0407, LPO-2026-0407, etc.
    const lpoPatternRegex = /\b((?:LPO|PO|CO|DO)[-_\s/]?\d{2,6}[-_\s/]?\d{4,20})\b/i;
    const patternMatch = text.match(lpoPatternRegex);
    if (patternMatch) {
      return patternMatch[1].trim();
    }

    // 3. Fallback to older strict numeric patterns
    // Try CO or LPO prefix first (usually the actual LPO number)
    const lpoRegex = /\b((?:CO|LPO)\s*\d{10,})\b/i;
    let match = text.match(lpoRegex);
    
    // Fallback to PO prefix
    if (!match) {
      const poRegex = /\b(PO\s*\d{10,})\b/i;
      match = text.match(poRegex);
    }
    
    if (match) {
      const cleaned = match[1].replace(/\s+/g, '').toUpperCase();
      // STRICT VALIDATION: Must start with CO, LPO, or PO and be followed by digits
      if (/^(CO|LPO|PO)\d{8,}$/.test(cleaned)) {
        return cleaned;
      }
    }
    
    // Fallback: search for any 10+ digit sequence if prefix is missing
    const digitRegex = /\b(\d{10,})\b/;
    const digitMatch = text.match(digitRegex);
    
    if (digitMatch) {
      const cleaned = digitMatch[1];
      if (cleaned.startsWith('26') || cleaned.startsWith('20') || cleaned.length >= 12) {
        return cleaned;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return null;
  }
}

/**
 * Extracts raw text from the first few pages of a PDF file.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    // Extract text from the first 3 pages (usually sufficient for LPO headers)
    for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(' ') + ' ';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
}

/**
 * Parses date string in DD/MM/YYYY format to YYYY-MM-DD
 */
function parseDmyDate(dateStr: string): string | null {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return null;
}

export interface ExtractedLpoDates {
  documentDate: string | null;
  expectedDeliveryDate: string | null;
}

/**
 * Extracts document_date and expected_delivery_date from PDF text if present
 */
export async function extractDatesFromPdf(file: File): Promise<ExtractedLpoDates> {
  const result: ExtractedLpoDates = { documentDate: null, expectedDeliveryDate: null };
  try {
    const text = await extractTextFromPdf(file);
    if (!text) return result;

    // 1. Extract Tarikh Dokumen / Tarikh Pesanan (LPO)
    const docDateRegex = /(?:Tarikh\s+Dokumen|Tarikh\s+Pesanan\s*\(?LPO\)?|Tarikh\s+Pesanan)[\s\S]{0,150}?(\d{2}\/\d{2}\/\d{4})/i;
    const docDateMatch = text.match(docDateRegex);
    if (docDateMatch) {
      result.documentDate = parseDmyDate(docDateMatch[1]);
    } else {
      // General fallback to search for any date in the document, first one is usually the document date
      const generalDateRegex = /(\d{2}\/\d{2}\/\d{4})/;
      const dateMatch = text.match(generalDateRegex);
      if (dateMatch) {
        result.documentDate = parseDmyDate(dateMatch[1]);
      }
    }

    // 2. Extract expected delivery date ("Pada atau sebelum")
    const deliveryDateRegex = /Pada\s+atau\s+sebelum\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i;
    const deliveryDateMatch = text.match(deliveryDateRegex);
    if (deliveryDateMatch) {
      result.expectedDeliveryDate = parseDmyDate(deliveryDateMatch[1]);
    } else if (text.toLowerCase().includes('pada atau sebelum')) {
      const index = text.toLowerCase().indexOf('pada atau sebelum');
      const textAfter = text.substring(index, index + 200);
      const dateMatch = textAfter.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        result.expectedDeliveryDate = parseDmyDate(dateMatch[1]);
      }
    }
  } catch (error) {
    console.error('Error extracting dates from PDF:', error);
  }
  return result;
}


