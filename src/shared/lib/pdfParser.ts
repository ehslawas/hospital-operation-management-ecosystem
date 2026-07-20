import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

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

/**
 * Parses and extracts serial numbers from a raw string text, formatting them with 'saboxy-' prefix.
 */
export function parseSerialsFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  
  // Find "serial" section
  let startIdx = -1;
  const serialKeywords = ['serial no', 'serial number', 'serialno', 's/n', 'silinder sewaan'];
  for (const keyword of serialKeywords) {
    const idx = lowerText.indexOf(keyword);
    if (idx !== -1) {
      startIdx = idx + keyword.length;
      break;
    }
  }
  
  let searchArea = text;
  if (startIdx !== -1) {
    searchArea = text.substring(startIdx);
    
    // Find where the serial section ends (Batch No., Filling Date, etc.)
    const endKeywords = ['batch', 'filling', 'expiry', 'date', 'perihal', 'total', 'qty', 'catatan', 'nota', 'notes'];
    let endIdx = searchArea.length;
    const lowerSearchArea = searchArea.toLowerCase();
    for (const keyword of endKeywords) {
      const idx = lowerSearchArea.indexOf(keyword);
      if (idx !== -1 && idx < endIdx) {
        endIdx = idx;
      }
    }
    searchArea = searchArea.substring(0, endIdx);
  }
  
  // Split by whitespace, commas, semicolons, or pipes
  const words = searchArea.split(/[\s,;|]+/);
  const serialsSet = new Set<string>();
  
  for (let word of words) {
    // Clean token: remove leading/trailing punctuation except letters/numbers
    const cleaned = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();
    
    // Match alphanumeric values of length 4 to 12 containing at least 2 digits
    if (/^[a-zA-Z0-9]{4,12}$/.test(cleaned) && (cleaned.match(/\d/g) || []).length >= 2) {
      const lowerCleaned = cleaned.toLowerCase();
      // Filter out typical layout labels
      if (lowerCleaned.includes('101n') || lowerCleaned.includes('101f') || lowerCleaned.includes('size') || lowerCleaned.includes('page')) {
        continue;
      }
      
      // Prefix formatting: 'saboxy-<UPPERCASE_SERIAL>'
      let finalSerial = cleaned.toUpperCase();
      if (/^saboxy-/i.test(finalSerial)) {
        finalSerial = `saboxy-${finalSerial.substring(7)}`;
      } else {
        finalSerial = `saboxy-${finalSerial}`;
      }
      
      serialsSet.add(finalSerial);
    }
  }
  
  return Array.from(serialsSet);
}

/**
 * Extracts serial numbers from a PDF or image document using text extraction or Tesseract OCR.
 */
export async function extractSerialsFromDocument(file: File): Promise<string[]> {
  try {
    if (file.type === 'application/pdf') {
      // 1. Try digital text extraction first
      const digitalText = await extractTextFromPdf(file);
      if (digitalText && digitalText.trim().length > 0) {
        const digitalSerials = parseSerialsFromText(digitalText);
        if (digitalSerials.length > 0) {
          return digitalSerials;
        }
      }
      
      // 2. Fallback to OCR on rendered pages if digital text extraction yielded nothing
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullOcrText = '';
      const pagesToScan = Math.min(pdf.numPages, 3);
      
      for (let i = 1; i <= pagesToScan; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale helps OCR accuracy
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({ canvasContext: context, viewport }).promise;
          
          const { data: { text: pageText } } = await Tesseract.recognize(canvas, 'eng');
          fullOcrText += '\n' + pageText;
        }
      }
      
      return parseSerialsFromText(fullOcrText);
    } else {
      // Image file OCR
      const { data: { text: ocrText } } = await Tesseract.recognize(file, 'eng');
      return parseSerialsFromText(ocrText);
    }
  } catch (error) {
    console.error('Error extracting serial numbers from document:', error);
    throw new Error('Failed to parse document. Please ensure the document is clear and readable.');
  }
}


