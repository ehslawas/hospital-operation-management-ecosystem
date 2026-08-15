// @ts-nocheck
import * as XLSX from 'xlsx'
import { supabase } from '@/services/supabase'
import type { GoodsReceiptCreate, GoodsReceiptItemCreate } from './receivingService'

export interface ExcelRow {
  rowNumber: number
  lpoNumber: string
  altLpoNumber?: string
  lpoApprovalDate: string
  receiptNo: string
  goodsReceivedDate: string
  actualDeliveryDays: string
  deliveryNote: string
  itemCode: string
  itemDescription: string
  purchaseType: string
  quantity: number
  packagingDescription: string
  conversionPKU: string
  unitPrice: number
  amount: number
  brandName: string
  batchNo: string
  mfgDate: string
  expiryDate: string
  supplierName: string
}

export interface ParseError {
  row: number
  column: string
  message: string
  severity: 'error' | 'warning'
}

export interface ParsedExcelResult {
  rows: ExcelRow[]
  errors: ParseError[]
  debugIndices?: any
}

export interface MatchedItem {
  poItemId: string
  item_id: string
  item_name: string
  item_code: string
  quantity_ordered: number
  quantity_previously_received: number
  quantity_received: number // quantity from Excel
  quantity_accepted: number
  quantity_rejected: number
  batch_number: string
  mfg_date?: string
  expiry_date: string
  batches?: Array<{
    batch_number: string
    mfg_date?: string
    expiry_date: string
    quantity: number
  }>
}

export interface MatchedPOGroup {
  poId: string
  poNumber: string
  lpoId: string
  lpoNumber: string
  supplierId: string
  supplierName: string
  deliveryNote: string
  receiptDate: string
  invoiceNumber: string
  debugIndices?: any
  items: MatchedItem[]
  unmatchedExcelRows: ExcelRow[]
  isDuplicate: boolean
  alreadyProcessed: boolean
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
 * Parse Excel expiry date format or date strings
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

  // Isolate the date part if there is a space/time component (e.g. "10/04/2026 4.25 PM" -> "10/04/2026")
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
 * Parses the Excel file and extracts structured rows
 */
export async function parseSupplierExcel(
  file: File,
  onProgress?: (status: string, percent: number) => void
): Promise<ParsedExcelResult> {
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
            
            // Check if this row contains multiple signature columns for goods receiving / LPO files
            const matches = cleanedRow.filter(h => 
              h.includes('lpo') || 
              h.includes('sku') || 
              h.includes('itemcode') || 
              h.includes('receiveddate') || 
              h.includes('deliverynote') || 
              h.includes('donumber') || 
              h.includes('dono') || 
              h.includes('qty') || 
              h.includes('quantity') || 
              h.includes('batchnumber') || 
              h.includes('batch') || 
              h.includes('exp')
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
            no: findColumnIndex(['no.'], 0),
            lpoNo: findColumnIndex(['lpono', 'lponumber', 'lpo'], 1),
            lpoApprovalDate: findColumnIndex(['lpoapproval', 'approvaldate', 'lpodate'], 2),
            receiptNo: findColumnIndex(['receiptno', 'invoice', 'invno'], 3),
            goodsReceivedDate: findColumnIndex(['goodsreceived', 'receiveddate', 'deliverydate', 'receiptdate'], 4),
            actualDeliveryDays: findColumnIndex(['deliverydays', 'actualdelivery'], 5),
            deliveryNote: findColumnIndex(['deliverynote', 'donumber', 'dono', 'do.no'], 6),
            itemCode: findColumnIndex(['itemcode', 'sku', 'productcode'], 7),
            itemDescription: findColumnIndex(['itemdescription', 'description', 'itemname', 'productname'], 8),
            purchaseType: findColumnIndex(['purchasetype'], 9),
            quantity: findColumnIndex(['quantity', 'qty', 'receivedqty', 'recqty'], 10),
            packagingDescription: findColumnIndex(['packagingdescription', 'packaging', 'uom'], 11),
            conversionPKU: findColumnIndex(['pku'], 12),
            conversionFactor: findColumnIndex(['conversionfactor', 'factor'], 13),
            unitPrice: findColumnIndex(['unitprice', 'price', 'unitcost'], 14),
            amount: findColumnIndex(['amount', 'totalprice', 'totalcost'], 15),
            brandName: findColumnIndex(['brand', 'brandname'], 16),
            batchNo: findColumnIndex(['batchno', 'batchnumber', 'batch#', 'lot', 'lotno', 'lotnumber'], 17),
            mfgDate: findColumnIndex(['mfgdate', 'manufacturingdate', 'manufacturing'], -1),
            expiryDate: findColumnIndex(['expirydate', 'expdate', 'expiry', 'exp', 'expiration', 'expirationdate'], 18),
            supplierName: findColumnIndex(['suppliername', 'supplier', 'vendor'], 19)
          }

          console.warn('Excel Sync Headers parsed:', headers)
          console.warn('Excel Sync Column Indices matched:', indices)

          onProgress?.('Extracting delivery records...', 70)
          const rows: ExcelRow[] = []
          const errors: ParseError[] = []

          // Begin parsing rows from the line immediately following the detected header row
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const rowData = jsonData[i] as any[]
            if (!rowData || rowData.length === 0) continue

            const hasAnyData = rowData.some(val => val !== '' && val !== null && val !== undefined)
            if (!hasAnyData) continue

            const rowNum = i + 1
            const lpoNumber = cleanString(rowData[indices.lpoNo])
            const itemCode = cleanString(rowData[indices.itemCode])
            const quantity = cleanNumber(rowData[indices.quantity])
            const deliveryNote = cleanString(rowData[indices.deliveryNote])
            
            if (!lpoNumber) {
              errors.push({ row: rowNum, column: 'LPO NO.', message: 'LPO Number is missing.', severity: 'error' })
              continue
            }
            if (!itemCode) {
              errors.push({ row: rowNum, column: 'Item Code', message: 'Item Code is missing.', severity: 'error' })
              continue
            }
            if (quantity <= 0) {
              errors.push({ row: rowNum, column: 'Quantity', message: `Quantity must be greater than 0 (got ${quantity}).`, severity: 'error' })
              continue
            }
            if (!deliveryNote) {
              errors.push({ row: rowNum, column: 'Delivery Note', message: 'Delivery Note (DO No.) is missing.', severity: 'error' })
              continue
            }

            const altLpoNumber = cleanString(rowData[1])

            rows.push({
              rowNumber: rowNum,
              lpoNumber,
              altLpoNumber,
              lpoApprovalDate: cleanString(rowData[indices.lpoApprovalDate]),
              receiptNo: cleanString(rowData[indices.receiptNo]),
              goodsReceivedDate: parseExcelDate(rowData[indices.goodsReceivedDate], xlsxInstance),
              actualDeliveryDays: cleanString(rowData[indices.actualDeliveryDays]),
              deliveryNote,
              itemCode,
              itemDescription: cleanString(rowData[indices.itemDescription]),
              purchaseType: cleanString(rowData[indices.purchaseType]),
              quantity,
              packagingDescription: cleanString(rowData[indices.packagingDescription]),
              conversionPKU: cleanString(rowData[indices.conversionPKU]),
              unitPrice: cleanNumber(rowData[indices.unitPrice]),
              amount: cleanNumber(rowData[indices.amount]),
              brandName: cleanString(rowData[indices.brandName]),
              batchNo: cleanString(rowData[indices.batchNo]),
              mfgDate: indices.mfgDate !== -1 ? parseExcelDate(rowData[indices.mfgDate], xlsxInstance) : '',
              expiryDate: parseExcelDate(rowData[indices.expiryDate], xlsxInstance),
              supplierName: cleanString(rowData[indices.supplierName])
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

export function generateLpoVariants(raw: string): string[] {
  if (!raw) return []
  let clean = raw.toUpperCase().trim().replace(/[^A-Z0-9]/g, '')
  clean = clean.replace(/^C[O0]/, 'CO').replace(/^P[O0]/, 'PO')

  const variants = new Set<string>([raw, clean, clean.replace(/O/g, '0'), clean.replace(/0/g, 'O')])
  const match = clean.match(/^([A-Z]+\d{2})0*(\d+)$/)
  if (match) {
    const prefix = match[1]
    const seq = match[2]
    for (let zeros = 4; zeros <= 14; zeros++) {
      const padded = prefix + '0'.repeat(zeros) + seq
      variants.add(padded)
      variants.add(padded.replace(/O/g, '0'))
    }
  }
  return Array.from(variants)
}

/**
 * Match parsed Excel rows to DB Purchase Orders and Items (BATCH OPTIMIZED to prevent loading hangs)
 */
export async function matchExcelToDatabase(
  parsed: ParsedExcelResult,
  hospitalId: string,
  onProgress?: (status: string, percent: number) => void
): Promise<MatchedPOGroup[]> {
  const groups: MatchedPOGroup[] = []
  if (parsed.rows.length === 0) return groups

  onProgress?.('Grouping rows by LPO...', 15)
  // Group Excel rows by LPO Number
  const rowsByLPO = new Map<string, ExcelRow[]>()
  parsed.rows.forEach(row => {
    const key = row.lpoNumber.toUpperCase().trim()
    const list = rowsByLPO.get(key) || []
    list.push(row)
    rowsByLPO.set(key, list)
  })

  // Gather all unique search keys from the Excel rows (fuzzy matching PO/LPO columns & zero padding variants)
  const uniqueSearchKeys = new Set<string>()
  parsed.rows.forEach(row => {
    if (row.lpoNumber) {
      generateLpoVariants(row.lpoNumber).forEach(v => uniqueSearchKeys.add(v))
    }
    if (row.altLpoNumber) {
      generateLpoVariants(row.altLpoNumber).forEach(v => uniqueSearchKeys.add(v))
    }
  })

  const searchKeysArray = Array.from(uniqueSearchKeys)
  onProgress?.(`Querying ${searchKeysArray.length} LPO keys in database...`, 30)

  // 1. Fetch matching LPOs in chunked batches of 100 to avoid PostgREST request URL size limit issues
  const lposList: any[] = []
  const chunkSize = 100
  for (let i = 0; i < searchKeysArray.length; i += chunkSize) {
    const chunk = searchKeysArray.slice(i, i + chunkSize)
    const { data: chunkData, error: chunkError } = await supabase
      .from('pharmacy_lpo')
      .select(`
        id, 
        lpo_number,
        payment_status,
        po_id,
        purchase_order:pharmacy_purchase_orders!pharmacy_lpo_po_id_fkey(
          id,
          po_number,
          supplier_id,
          status,
          supplier:suppliers!pharmacy_purchase_orders_supplier_id_fkey(company_name),
          items:pharmacy_purchase_order_items(*)
        )
      `)
      .in('lpo_number', chunk)
      .eq('hospital_id', hospitalId)

    if (chunkError) {
      console.error('Error fetching LPO chunk in batch:', chunkError)
      throw new Error(`Database error querying LPO chunk: ${chunkError.message}`)
    }
    if (chunkData) {
      lposList.push(...chunkData)
    }
  }

  // Create lookup maps for fast matching
  const lpoMap = new Map<string, any>()
  const lpoIds: string[] = []
  
  if (lposList) {
    lposList.forEach(l => {
      const dbLpo = l.lpo_number.toUpperCase().trim()
      generateLpoVariants(dbLpo).forEach(v => lpoMap.set(v, l))
      lpoIds.push(l.id)
    })
  }

  // 2. Fetch existing goods receipts for duplicate checks in chunked batch queries
  const existingGrMapA = new Map<string, Set<string>>() // lpo_id -> Set of delivery_notes
  const existingGrMapB = new Map<string, Set<string>>() // lpo_id -> Set of do_numbers
  const grDataA: any[] = []
  const grDataB: any[] = []

  if (lpoIds.length > 0) {
    onProgress?.('Checking for duplicate goods receipts...', 60)
    for (let i = 0; i < lpoIds.length; i += chunkSize) {
      const idChunk = lpoIds.slice(i, i + chunkSize)
      const [grResA, grResB] = await Promise.all([
        supabase
          .from('pharmacy_goods_receipts')
          .select('lpo_id, delivery_note_number')
          .in('lpo_id', idChunk),
        supabase
          .from('pharmacy_receiving')
          .select('lpo_id, do_number')
          .in('lpo_id', idChunk)
      ])

      if (grResA.data) grDataA.push(...grResA.data)
      if (grResB.data) grDataB.push(...grResB.data)
    }

    grDataA.forEach(gr => {
      if (!gr.lpo_id || !gr.delivery_note_number) return
      const key = gr.lpo_id
      const set = existingGrMapA.get(key) || new Set<string>()
      set.add(gr.delivery_note_number.toUpperCase().trim())
      existingGrMapA.set(key, set)
    })

    grDataB.forEach(gr => {
      if (!gr.lpo_id || !gr.do_number) return
      const key = gr.lpo_id
      const set = existingGrMapB.get(key) || new Set<string>()
      set.add(gr.do_number.toUpperCase().trim())
      existingGrMapB.set(key, set)
    })
  }

  onProgress?.('Cross-referencing items...', 80)
  
  // 3. Build groups entirely in-memory (No database calls inside loop)
  let processed = 0
  const total = rowsByLPO.size

  for (const [lpoKey, excelRows] of rowsByLPO.entries()) {
    processed++
    const pct = 80 + Math.floor((processed / total) * 20)
    onProgress?.(`Processing LPO ${lpoKey}...`, pct)

    let lpoData = lpoMap.get(lpoKey)
    if (!lpoData) {
      const variants = generateLpoVariants(lpoKey)
      for (const v of variants) {
        lpoData = lpoMap.get(v)
        if (lpoData) break
      }
    }
    if (!lpoData) {
      for (const row of excelRows) {
        if (row.altLpoNumber) {
          const variants = generateLpoVariants(row.altLpoNumber)
          for (const v of variants) {
            lpoData = lpoMap.get(v)
            if (lpoData) break
          }
          if (lpoData) break
        }
      }
    }

    if (!lpoData) {
      // Unmatched LPO group
      groups.push({
        poId: '',
        poNumber: '',
        lpoId: '',
        lpoNumber: excelRows[0].lpoNumber,
        supplierId: '',
        supplierName: excelRows[0].supplierName || 'Unknown Supplier',
        deliveryNote: excelRows[0].deliveryNote,
        receiptDate: excelRows[0].goodsReceivedDate || new Date().toISOString().split('T')[0],
        invoiceNumber: excelRows[0].receiptNo,
        items: [],
        unmatchedExcelRows: excelRows,
        isDuplicate: false,
        alreadyProcessed: false
      })
      continue
    }

    const po = lpoData.purchase_order
    if (!po) continue

    const poItems = po.items || []
    const matchedItems: MatchedItem[] = []
    const unmatchedExcelRows: ExcelRow[] = []

    // Check duplicate status
    let isDuplicate = false
    let alreadyProcessed = false

    const doSetA = existingGrMapA.get(lpoData.id)
    const doSetB = existingGrMapB.get(lpoData.id)

    excelRows.forEach(row => {
      const rowDo = row.deliveryNote.toUpperCase().trim()
      if (rowDo) {
        if (doSetA?.has(rowDo) || doSetB?.has(rowDo)) {
          isDuplicate = true
        }
      }
    })

    if (po.status === 'completed') {
      alreadyProcessed = true
    }

    // Match Excel items to PO Items
    excelRows.forEach(row => {
      let matchedPoItem = poItems.find(
        pi => cleanString(pi.item_code).toUpperCase() === row.itemCode.toUpperCase()
      )

      if (!matchedPoItem) {
        matchedPoItem = poItems.find(
          pi => cleanString(pi.item_name).toUpperCase() === row.itemDescription.toUpperCase()
        )
      }

      // Fuzzy description fallback
      if (!matchedPoItem) {
        matchedPoItem = poItems.find(pi => {
          const dbName = cleanString(pi.item_name).toLowerCase()
          const excelName = cleanString(row.itemDescription).toLowerCase()
          if (!dbName || !excelName) return false

          const cleanDesc = (str: string) => {
            return str
              .replace(/[^a-z0-9]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
          }

          const dbCleaned = cleanDesc(dbName)
          const excelCleaned = cleanDesc(excelName)

          // 1. Number matching safeguard
          const dbNums = dbCleaned.match(/\b\d+\b/g) || []
          const excelNums = excelCleaned.match(/\b\d+\b/g) || []
          const numbersMatch = excelNums.every(num => dbNums.includes(num))
          if (!numbersMatch) return false

          // 2. Token overlap check
          const stopWords = new Set([
            'tablet', 'tablets', 'capsule', 'capsules', 'solution', 'injection',
            'mg', 'g', 'ml', 'percent', 'of', 'and', 'with', 'tube', 'each', 'bottle'
          ])
          
          const dbTokens = new Set(dbCleaned.split(' ').filter(t => t.length > 0 && !stopWords.has(t)))
          const excelTokens = new Set(excelCleaned.split(' ').filter(t => t.length > 0 && !stopWords.has(t)))
          
          if (dbTokens.size === 0 || excelTokens.size === 0) return false

          let commonCount = 0
          excelTokens.forEach(t => {
            if (dbTokens.has(t)) commonCount++
          })

          const score = commonCount / excelTokens.size
          return score >= 0.6 // Match if 60% of Excel description words are found in DB item description
        })
      }

      // 4th Fallback: If PO has only one item, match it
      if (!matchedPoItem && poItems.length === 1) {
        matchedPoItem = poItems[0]
      }

      // 5th Fallback: Match by quantity if unique in PO items list
      if (!matchedPoItem) {
        const potentialItems = poItems.filter(pi => pi.quantity_ordered === row.quantity)
        if (potentialItems.length === 1) {
          matchedPoItem = potentialItems[0]
        }
      }

      // 6th Fallback: If only 1 remaining unassigned PO item exists for this PO, match it automatically
      // ONLY if there is token overlap (prevents matching Salbutamol to Budesonide)
      if (!matchedPoItem) {
        const assignedPoItemIds = new Set(matchedItems.map(mi => mi.poItemId))
        const remainingPoItems = poItems.filter(pi => !assignedPoItemIds.has(pi.id))
        if (remainingPoItems.length === 1) {
          const remName = cleanString(remainingPoItems[0].item_name).toLowerCase()
          const remCode = cleanString(remainingPoItems[0].item_code).toLowerCase()
          const rowName = cleanString(row.itemDescription).toLowerCase()
          const rowCode = cleanString(row.itemCode).toLowerCase()
          
          const rowTokens = rowName.split(/\s+/).filter(t => t.length > 2)
          const hasTokenMatch = rowTokens.some(t => remName.includes(t) || remCode.includes(t)) ||
            (rowCode && remCode && rowCode.includes(remCode))
            
          if (hasTokenMatch || !rowName) {
            matchedPoItem = remainingPoItems[0]
          }
        }
      }

      if (matchedPoItem) {
        const existingItem = matchedItems.find(mi => mi.poItemId === matchedPoItem.id)
        const batchEntry = {
          batch_number: row.batchNo,
          mfg_date: row.mfgDate,
          expiry_date: row.expiryDate,
          quantity: row.quantity
        }

        if (existingItem) {
          existingItem.quantity_received += row.quantity
          existingItem.quantity_accepted += row.quantity
          if (!existingItem.batches) {
            existingItem.batches = [
              {
                batch_number: existingItem.batch_number,
                mfg_date: existingItem.mfg_date,
                expiry_date: existingItem.expiry_date,
                quantity: existingItem.quantity_accepted - row.quantity
              }
            ]
          }
          existingItem.batches.push(batchEntry)
        } else {
          matchedItems.push({
            poItemId: matchedPoItem.id,
            item_id: matchedPoItem.item_id,
            item_name: matchedPoItem.item_name,
            item_code: matchedPoItem.item_code,
            quantity_ordered: matchedPoItem.quantity_ordered,
            quantity_previously_received: matchedPoItem.quantity_received || 0,
            quantity_received: row.quantity,
            quantity_accepted: row.quantity,
            quantity_rejected: 0,
            batch_number: row.batchNo,
            mfg_date: row.mfgDate,
            expiry_date: row.expiryDate,
            batches: [batchEntry]
          })
        }
      } else {
        unmatchedExcelRows.push(row)
      }
    })

    groups.push({
      poId: po.id,
      poNumber: po.po_number,
      lpoId: lpoData.id,
      lpoNumber: lpoData.lpo_number,
      supplierId: po.supplier_id,
      supplierName: po.supplier?.company_name || excelRows[0].supplierName || 'Unknown Supplier',
      deliveryNote: excelRows[0].deliveryNote,
      receiptDate: excelRows[0].goodsReceivedDate || new Date().toISOString().split('T')[0],
      invoiceNumber: excelRows[0].receiptNo,
      debugIndices: parsed.debugIndices,
      items: matchedItems,
      unmatchedExcelRows,
      isDuplicate,
      alreadyProcessed
    })
  }

  onProgress?.('Reconciliation completed.', 100)
  return groups
}

/**
 * Helper to prepare GoodsReceiptCreate payload for a matched group
 */
export function convertToGoodsReceiptPayload(
  group: MatchedPOGroup,
  userId: string,
  hospitalId: string
): GoodsReceiptCreate {
  const items: GoodsReceiptItemCreate[] = group.items.map(item => {
    return {
      po_item_id: item.poItemId,
      item_id: item.item_id,
      item_name: item.item_name,
      quantity_ordered: item.quantity_ordered,
      quantity_previously_received: item.quantity_previously_received,
      quantity_received: item.quantity_received,
      quantity_accepted: item.quantity_accepted,
      quantity_rejected: item.quantity_rejected,
      disposition: 'accepted',
      rejection_reason: '',
      notes: 'Auto-populated from Excel upload',
      batches: item.batches && item.batches.length > 0
        ? item.batches.map(b => ({
            batch_number: b.batch_number,
            manufacturing_date: b.mfg_date || '',
            expiry_date: b.expiry_date,
            quantity: b.quantity
          }))
        : [
            {
              batch_number: item.batch_number,
              manufacturing_date: item.mfg_date || '',
              expiry_date: item.expiry_date,
              quantity: item.quantity_accepted
            }
          ],
      credit_note_quantity: 0,
      mark_remaining_as_credit_note: false,
      arrived: true
    }
  })

  return {
    hospital_id: hospitalId,
    po_id: group.poId,
    lpo_id: group.lpoId,
    receipt_date: group.receiptDate,
    delivery_note_number: group.deliveryNote,
    invoice_number: group.invoiceNumber,
    received_by: userId,
    notes: 'Uploaded and processed via Supplier Excel spreadsheet.',
    document_urls: [],
    items
  }
}
