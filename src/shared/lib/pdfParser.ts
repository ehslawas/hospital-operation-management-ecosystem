// ⚡ PERFORMANCE: pdfjs-dist (~5MB) and tesseract.js (~10MB WASM) are loaded
// dynamically on first use — NOT at module load time — to prevent them from
// being bundled into the main chunk and delaying the initial app load.

type PdfjsLib = typeof import('pdfjs-dist')
type TesseractLib = typeof import('tesseract.js')

let _pdfjs: any = null
let _tesseract: any = null

async function getPdfjs(): Promise<any> {
  if (!_pdfjs) {
    const raw = await import('pdfjs-dist')
    _pdfjs = (raw as any).default || raw
    if (_pdfjs && _pdfjs.GlobalWorkerOptions) {
      _pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`
    }
  }
  return _pdfjs
}

async function getTesseract(): Promise<any> {
  if (!_tesseract) {
    const raw = await import('tesseract.js')
    _tesseract = (raw as any).default || raw
  }
  return _tesseract
}


/**
 * Extracts text from the first page of a PDF file and finds the LPO number.
 * Looks for patterns like PO26..., CO26..., LPO-..., etc.
 */
export async function extractLpoNumberFromPdf(file: File): Promise<string | null> {
  try {
    const pdfjsLib = await getPdfjs();
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
    const pdfjsLib = await getPdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    // Extract text from up to 10 pages to ensure multi-item/multi-page DOs are fully parsed
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
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
 * Scans ALL "Serial No." sections across multiple items in the document and stops reading each section at section boundaries.
 */
export function parseSerialsFromText(text: string): string[] {
  const serialsSet = new Set<string>();

  // Find all section headers like "Serial No.:", "Serial Number", "S/N", "Nomor Siri", etc.
  const headerRegex = /(?:serial\s*(?:no|number|numbers|s\/n)?|s\/n|silinder\s*sewaan|nomor\s*siri|no\.\s*siri)\s*:?/gi;

  const matches: { index: number; length: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = headerRegex.exec(text)) !== null) {
    matches.push({ index: match.index, length: match[0].length });
  }

  const textBlocksToScan: string[] = [];

  if (matches.length > 0) {
    // For each "Serial No." header found, extract raw block up to the next header or end of document
    for (let i = 0; i < matches.length; i++) {
      const startPos = matches[i].index + matches[i].length;
      const endPos = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
      const rawBlock = text.substring(startPos, endPos);
      textBlocksToScan.push(rawBlock);
    }
  } else {
    // Fallback: search entire document text if no explicit section header is found
    textBlocksToScan.push(text);
  }

  // Keywords that signal the end of a serial number section
  const isStopKeyword = (lowerToken: string): boolean => {
    return (
      lowerToken.includes('perihal') ||
      lowerToken.includes('total') ||
      lowerToken.includes('jumlah') ||
      lowerToken.includes('nota') ||
      lowerToken.includes('catatan') ||
      lowerToken.includes('notes') ||
      lowerToken.includes('disediakan') ||
      lowerToken.includes('disahkan') ||
      lowerToken.includes('received') ||
      lowerToken.includes('signature') ||
      lowerToken.includes('tandatangan') ||
      lowerToken.includes('terms') ||
      lowerToken.includes('borneo') ||
      lowerToken.includes('delivery') ||
      lowerToken.includes('order') ||
      lowerToken.includes('hospital') ||
      lowerToken.includes('batch') ||
      lowerToken.includes('filling') ||
      lowerToken.includes('expiry') ||
      lowerToken.includes('code') ||
      lowerToken.includes('size') ||
      lowerToken.includes('silinder') ||
      lowerToken.includes('101n') ||
      lowerToken.includes('101f') ||
      lowerToken.includes('p101hs') ||
      lowerToken.includes('page') ||
      lowerToken.includes('halaman') ||
      lowerToken.includes('attn') ||
      lowerToken.includes('kuching') ||
      lowerToken.includes('sarawak') ||
      lowerToken.includes('malaysia')
    );
  };

  const isNoiseToken = (str: string): boolean => {
    const lower = str.toLowerCase();
    // Filter volume/weight units e.g. 80m3, 8m3, 14m3, 64m3
    if (/^\d+(\.\d+)?m3?$/i.test(str)) {
      return true;
    }
    // Filter dates (DD/MM/YYYY or YYYYMMDD)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str) || (/^\d{8}$/.test(str) && (str.startsWith('20') || str.startsWith('19')))) {
      return true;
    }
    // Filter PO / DO / REF patterns like O2-REQ-20260805-6477 or D26/08-039 or 199401024117
    if (/req|lpo|po-|co-|do-/i.test(str)) {
      return true;
    }
    // Filter phone numbers / registration numbers (>10 digits starting with 082, 085, 011, 016, 1994, 3097)
    if (/^(082|085|011|016|1994|3097)/.test(str)) {
      return true;
    }
    return false;
  };

  for (const block of textBlocksToScan) {
    // Split by whitespace, commas, semicolons, or pipes
    const words = block.split(/[\s,;|]+/);
    let consecutiveNonSerialCount = 0;

    for (let word of words) {
      // Clean token: strip leading/trailing non-alphanumeric chars (e.g. "- 054610" -> "054610")
      const cleaned = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();
      const lowerCleaned = cleaned.toLowerCase();

      if (!cleaned) continue;

      // If we encounter a section stop keyword, terminate scanning this block immediately
      if (isStopKeyword(lowerCleaned)) {
        break;
      }

      // Match alphanumeric tokens of length 4 to 14 containing at least 2 digits
      if (/^[a-zA-Z0-9]{4,14}$/.test(cleaned) && (cleaned.match(/\d/g) || []).length >= 2) {
        if (isNoiseToken(cleaned)) {
          consecutiveNonSerialCount++;
          if (consecutiveNonSerialCount >= 3) break;
          continue;
        }

        consecutiveNonSerialCount = 0; // reset counter on valid serial

        let finalSerial = cleaned.toUpperCase();
        if (/^saboxy-/i.test(finalSerial)) {
          finalSerial = `saboxy-${finalSerial.substring(7)}`;
        } else {
          finalSerial = `saboxy-${finalSerial}`;
        }

        serialsSet.add(finalSerial);
      } else {
        consecutiveNonSerialCount++;
        // If we see 3 non-serial words in a row (when section headers exist), stop reading block
        if (matches.length > 0 && consecutiveNonSerialCount >= 3) {
          break;
        }
      }
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
      const pdfjsLib = await getPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullOcrText = '';
      const pagesToScan = Math.min(pdf.numPages, 10);
      
      for (let i = 1; i <= pagesToScan; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale helps OCR accuracy
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({ canvasContext: context, viewport }).promise;
          
          const Tesseract = await getTesseract();
          const { data: { text: pageText } } = await Tesseract.recognize(canvas, 'eng');
          fullOcrText += '\n' + pageText;
        }
      }
      
      return parseSerialsFromText(fullOcrText);
    } else {
      // Image file OCR
      const Tesseract = await getTesseract();
      const { data: { text: ocrText } } = await Tesseract.recognize(file, 'eng');
      return parseSerialsFromText(ocrText);
    }
  } catch (error) {
    console.error('Error extracting serial numbers from document:', error);
    throw new Error('Failed to parse document. Please ensure the document is clear and readable.');
  }
}


