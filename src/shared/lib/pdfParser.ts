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
 * Accurately extracts serial numbers from oxygen delivery order documents:
 * 1. Sanitizes non-serial metadata (dates, batch numbers, postcodes, phone numbers, terms, item sizes).
 * 2. Works reliably across digital PDF streams, multi-page PDFs, and OCR scanned images.
 * 3. Extracts all 6-digit (e.g. 006064, 001026, 004047) and standard alphanumeric cylinder tags.
 */
export function parseSerialsFromText(text: string): string[] {
  const serialsList: string[] = [];

  // Sanitize out non-serial patterns from the raw text to prevent false matches
  let sanitized = text;

  // 1. Remove order/LPO/PO/REQ references like O2-REQ-20260702-2688, PO-2026-0407, DO-2026-9876, etc.
  sanitized = sanitized.replace(/\b(?:O2-REQ|PO|DO|LPO|CO)[A-Z0-9\-_/]+\b/gi, ' ');

  // 2. Remove dates DD/MM/YYYY or YYYYMMDD
  sanitized = sanitized.replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, ' ');
  sanitized = sanitized.replace(/\b(20\d{6}|19\d{6})\b/g, ' ');

  // 3. Remove batch numbers like O970/26, 0971/26, O973/26, O975/26, etc.
  sanitized = sanitized.replace(/\b[A-Z0-9]{2,8}\/\d{2}\b/gi, ' ');

  // 4. Remove company registration / tax IDs like C8870258080 or 199401024117
  sanitized = sanitized.replace(/\b[A-Z]\d{8,}\b/gi, ' ');
  sanitized = sanitized.replace(/\b\d{10,}\b/g, ' ');

  // 5. Remove Malaysian postcodes (e.g. 93450 Kuching, 98850 Lawas, 88xxx KK, etc.)
  sanitized = sanitized.replace(/\b(93|98|95|96|97|88|89|90|91|50|51|52|53|54|55|56|57|58|59|60|68|40|41|42|43|47|48)\d{3}\b/g, ' ');

  // 6. Remove phone numbers / fax numbers e.g. 082-337713, 085-123456, 337713, 334178
  sanitized = sanitized.replace(/\b08\d[\-\s]?\d{6,8}\b/g, ' ');
  sanitized = sanitized.replace(/\b33\d{4}\b/g, ' ');

  // 7. Remove item sizes & units like 101-F, 101-N, 101F, 10F, 1.4m3, 80m3, 64m3, 48 UNIT
  sanitized = sanitized.replace(/\b(?:CODE\s*SIZE\s*:\s*)?[A-Z]?101[\-_]?[A-Z0-9]+\b/gi, ' ');
  sanitized = sanitized.replace(/\b\d+(\.\d+)?\s*m[3]?\b/gi, ' ');
  sanitized = sanitized.replace(/\b\d+\s*(?:UNIT|PCS|BATANG)\b/gi, ' ');

  // 8. Remove quantity prefixes before "Serial No." e.g. "10 Serial No.:", "9 Serial No.:", "1 Serial No.:"
  sanitized = sanitized.replace(/\b\d+\s+(?:Serial\s*No|Nomor\s*Siri|No\.\s*Siri)\b/gi, ' ');

  // 9. Remove payment terms e.g. 30 DAYS, 30DAYS, 60 DAYS
  sanitized = sanitized.replace(/\b\d+\s*DAYS\b/gi, ' ');

  // Tokenize the sanitized text
  const tokens = sanitized.split(/[\s,;|]+/);

  const isNoiseWord = (lower: string): boolean => {
    const meta = new Set([
      'serial', 'no', 'number', 'numbers', 's/n', 'nomor', 'siri', 'batch',
      'filling', 'expiry', 'date', 'unit', 'silinder', 'sewaan', 'gas', 'oksigen',
      'oxygen', 'perihal', 'kegunaan', 'ambulance', 'hospital', 'borneo', 'delivery',
      'order', 'received', 'signature', 'tandatangan', 'jumlah', 'total',
      'halaman', 'page', 'code', 'size', 'attn', 'kuching', 'sarawak', 'malaysia',
      'lawas', 'pending', 'terms', 'nota', 'catatan', 'notes', 'disediakan',
      'disahkan', 'item', 'customer', 'tel', 'fax', 'days', 'day'
    ]);
    return meta.has(lower);
  };

  for (const token of tokens) {
    // Strip leading/trailing bullets, dashes, tildes, colons
    const cleaned = token.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();
    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();
    if (isNoiseWord(lower)) continue;

    // Genuine cylinder serial pattern:
    // 1. 6-digit numeric (e.g. 006064, 001026, 004047, 001006)
    // 2. Or 5-8 digit numeric
    // 3. Or alphanumeric code of length 5-10 with at least 2 digits
    const is6Digit = /^\d{6}$/.test(cleaned);
    const isStandardSerial = /^(00\d{4}|\d{5,8})$/.test(cleaned);
    const isAlphaNumericTag = /^[A-Z0-9]{5,10}$/i.test(cleaned) && (cleaned.match(/\d/g) || []).length >= 2;

    if (is6Digit || isStandardSerial || isAlphaNumericTag) {
      let finalSerial = cleaned.toUpperCase();
      if (/^saboxy-/i.test(finalSerial)) {
        finalSerial = `saboxy-${finalSerial.substring(7)}`;
      } else {
        finalSerial = `saboxy-${finalSerial}`;
      }

      serialsList.push(finalSerial);
    }
  }

  return applySameDoDuplicateSuffix(serialsList);
}

/**
 * Automatically applies duplicate suffix (-A, -B, etc.) to repeated serial numbers within the same Delivery Order.
 * e.g. 1st occurrence: 'saboxy-001036', 2nd occurrence: 'saboxy-001036-A'
 */
export function applySameDoDuplicateSuffix(serialsList: string[]): string[] {
  const countMap = new Map<string, number>();
  const result: string[] = [];

  for (const serial of serialsList) {
    const upper = serial.toUpperCase();
    const count = (countMap.get(upper) || 0) + 1;
    countMap.set(upper, count);

    if (count === 1) {
      result.push(serial);
    } else {
      const letterIndex = count - 2; // 0 for 'A', 1 for 'B', etc.
      const suffixLetter = String.fromCharCode(65 + (letterIndex % 26));
      const suffix = letterIndex >= 26 ? `-${suffixLetter}${Math.floor(letterIndex / 26) + 1}` : `-${suffixLetter}`;
      result.push(`${serial}${suffix}`);
    }
  }

  return result;
}

/**
 * Extracts serial numbers from a PDF or image document (or multiple documents) using text extraction or Tesseract OCR.
 */
export async function extractSerialsFromDocument(files: File | File[]): Promise<string[]> {
  const fileList = Array.isArray(files) ? files : [files];
  const combinedSerials: string[] = [];

  for (const file of fileList) {
    try {
      if (file.type === 'application/pdf') {
        // 1. Try digital text extraction first
        const digitalText = await extractTextFromPdf(file);
        if (digitalText && digitalText.trim().length > 0) {
          const digitalSerials = parseSerialsFromText(digitalText);
          if (digitalSerials.length > 0) {
            combinedSerials.push(...digitalSerials);
            continue;
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
        
        const ocrSerials = parseSerialsFromText(fullOcrText);
        combinedSerials.push(...ocrSerials);
      } else {
        // Image file OCR
        const Tesseract = await getTesseract();
        const { data: { text: ocrText } } = await Tesseract.recognize(file, 'eng');
        const imgSerials = parseSerialsFromText(ocrText);
        combinedSerials.push(...imgSerials);
      }
    } catch (error) {
      console.error(`Error extracting serial numbers from ${file.name}:`, error);
    }
  }

  if (combinedSerials.length === 0) {
    throw new Error('Failed to parse document or no serial numbers detected. Please ensure the document is clear and readable.');
  }

  return applySameDoDuplicateSuffix(combinedSerials);
}


