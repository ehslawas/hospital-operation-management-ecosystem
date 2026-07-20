// @ts-nocheck
import * as XLSX from 'xlsx'

export interface PaymentExcelRow {
  rowNumber: number
  refNo: string
  lpoNumber: string
  lpoDate: string
  supplierName: string
  paymentDate: string
  invoiceNo: string
  invoiceDate: string
  invoiceAmount: number
  lpoAmount: number
  paymentAmount: number
  creditNoteAmount: number
  itemPurchaseType: string
}

export interface ParseError {
  row: number
  column: string
  message: string
  severity: 'error' | 'warning'
}

export interface PaymentExcelParseResult {
  rows: PaymentExcelRow[]
  errors: ParseError[]
  debugIndices?: any
}

/**
 * Standardize and clean sheet strings
 */
const cleanString = (val: any): string => {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

/**
 * Clean sheet headers by removing all whitespace and newlines, and lowercase it
 */
const cleanHeader = (val: any): string => {
  if (val === null || val === undefined) return ''
  return String(val).replace(/\s+/g, '').toLowerCase()
}

/**
 * Clean numeric values
 */
const cleanNumber = (val: any): number => {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return val
  const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ''))
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Ensures XLSX library is loaded and returns the instance
 */
async function ensureXLSX(): Promise<any> {
  if (typeof window === 'undefined') return XLSX
  if ((window as any).XLSX) return (window as any).XLSX

  // Load from CDN if not already loaded to prevent any bundler issues
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
    script.async = true
    script.onload = () => {
      const instance = (window as any).XLSX
      if (instance) {
        resolve(instance)
      } else {
        reject(new Error('XLSX loaded but not available on window'))
      }
    }
    script.onerror = () => {
      reject(new Error('Failed to load XLSX parser library from CDN.'))
    }
    document.head.appendChild(script)
  })
}

/**
 * Parse Excel date format or date strings
 */
const parseExcelDate = (val: any, xlsxInstance: any): string => {
  if (!val) return ''
  
  if (typeof val === 'number' && xlsxInstance?.SSF) {
    try {
      const date = xlsxInstance.SSF.parse_date_code(val)
      if (date) {
        const d = new Date(date.y, date.m - 1, date.d)
        return d.toISOString().split('T')[0]
      }
    } catch (e) {
      console.warn('Failed to parse numeric date code:', val, e)
    }
  }

  const str = cleanString(val)
  if (!str) return ''

  // Isolate the date part if there is a space/time component
  const datePart = str.split(/\s+/)[0]
  if (!datePart) return ''

  // Attempt standard formats, e.g., DD/MM/YYYY, DD/MM/YY, YYYY-MM-DD
  const parts = datePart.split(/[-/.]/)
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10)
    let month = parseInt(parts[1], 10)
    let year = parseInt(parts[2], 10)

    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10)
      month = parseInt(parts[1], 10)
      day = parseInt(parts[2], 10)
    }

    if (year < 100) {
      year += 2000
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const d = new Date(year, month - 1, day)
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0]
      }
    }
  }

  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0]
  }

  return str
}

/**
 * Parses the Excel file and extracts payment rows
 */
export async function parsePaymentExcel(
  file: File,
  onProgress?: (status: string, percent: number) => void
): Promise<PaymentExcelParseResult> {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress?.('Loading Excel parser engine...', 10)
      const xlsxInstance = await ensureXLSX()

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          onProgress?.('Reading spreadsheet contents...', 30)
          const data = e.target?.result
          const workbook = xlsxInstance.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = xlsxInstance.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

          if (jsonData.length === 0) {
            resolve({ rows: [], errors: [{ row: 0, column: '', message: 'The spreadsheet is empty.', severity: 'error' }] })
            return
          }

          onProgress?.('Analyzing table headers...', 50)
          
          // Dynamically scan the first 10 rows to find the actual header row
          let headerRowIndex = 0
          for (let r = 0; r < Math.min(jsonData.length, 10); r++) {
            const row = jsonData[r] as any[]
            if (!row) continue
            const cleanedRow = row.map(h => cleanHeader(h))
            
            // Check if this row contains keys from the payment Excel
            const matches = cleanedRow.filter(h => 
              h.includes('lpono') || 
              h.includes('lpodate') || 
              h.includes('paymentdate') || 
              h.includes('invoiceno') || 
              h.includes('invoicedate') || 
              h.includes('invoiceamount') || 
              h.includes('lpoamount') || 
              h.includes('paymentamount') || 
              h.includes('creditnote')
            )
            
            if (matches.length >= 2) {
              headerRowIndex = r
              break
            }
          }

          const headers = (jsonData[headerRowIndex] as any[]).map(h => cleanHeader(h))
          
          const findColumnIndex = (keywords: string[], defaultIdx: number): number => {
            for (let i = 0; i < headers.length; i++) {
              const h = headers[i]
              if (keywords.some(k => h.includes(k))) return i
            }
            return defaultIdx
          }

          const indices = {
            refNo: findColumnIndex(['refno', 'ref.no'], 0),
            lpoNo: findColumnIndex(['lpono', 'lponumber', 'lpo'], 1),
            lpoDate: findColumnIndex(['lpodate', 'lpoapprovaldate'], 2),
            supplierName: findColumnIndex(['suppliername', 'supplier', 'vendor'], 3),
            paymentDate: findColumnIndex(['paymentdate', 'effective'], 4),
            invoiceNo: findColumnIndex(['invoiceno', 'invoice#', 'receiptno'], 5),
            invoiceDate: findColumnIndex(['invoicedate', 'datesent'], 6),
            invoiceAmount: findColumnIndex(['invoiceamount', 'invoiceamt'], 7),
            lpoAmount: findColumnIndex(['lpoamount', 'lpoamt'], 8),
            paymentAmount: findColumnIndex(['paymentamount', 'paymentamt'], 9),
            creditNoteAmount: findColumnIndex(['creditnoteamount', 'creditnoteamt', 'creditnote'], 10),
            itemPurchaseType: findColumnIndex(['itempurchasetype', 'purchasetype', 'type'], 11)
          }

          console.log('Payment Excel Headers parsed:', headers)
          console.log('Payment Excel Column Indices matched:', indices)

          onProgress?.('Extracting payment records...', 70)
          const rows: PaymentExcelRow[] = []
          const errors: ParseError[] = []

          // Begin parsing rows from the line immediately following the detected header row
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const rowData = jsonData[i] as any[]
            if (!rowData || rowData.length === 0) continue

            const hasAnyData = rowData.some(val => val !== '' && val !== null && val !== undefined)
            if (!hasAnyData) continue

            const rowNum = i + 1
            const lpoNumber = cleanString(rowData[indices.lpoNo])
            const paymentDate = parseExcelDate(rowData[indices.paymentDate], xlsxInstance)
            const invoiceNo = cleanString(rowData[indices.invoiceNo])
            
            if (!lpoNumber) {
              errors.push({ row: rowNum, column: 'LPO No', message: 'LPO Number is missing.', severity: 'error' })
              continue
            }
            if (!paymentDate) {
              errors.push({ row: rowNum, column: 'Payment Date', message: 'Payment Date is missing or invalid.', severity: 'error' })
              continue
            }
            if (!invoiceNo) {
              errors.push({ row: rowNum, column: 'Invoice No', message: 'Invoice Number is missing.', severity: 'error' })
              continue
            }

            rows.push({
              rowNumber: rowNum,
              refNo: cleanString(rowData[indices.refNo]),
              lpoNumber,
              lpoDate: parseExcelDate(rowData[indices.lpoDate], xlsxInstance),
              supplierName: cleanString(rowData[indices.supplierName]),
              paymentDate,
              invoiceNo,
              invoiceDate: parseExcelDate(rowData[indices.invoiceDate], xlsxInstance),
              invoiceAmount: cleanNumber(rowData[indices.invoiceAmount]),
              lpoAmount: cleanNumber(rowData[indices.lpoAmount]),
              paymentAmount: cleanNumber(rowData[indices.paymentAmount]),
              creditNoteAmount: cleanNumber(rowData[indices.creditNoteAmount]),
              itemPurchaseType: cleanString(rowData[indices.itemPurchaseType])
            })
          }

          onProgress?.('Parsing completed successfully.', 100)
          resolve({ rows, errors, debugIndices: indices })
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = (err) => reject(err)
      reader.readAsBinaryString(file)
    } catch (err) {
      reject(err)
    }
  })
}
