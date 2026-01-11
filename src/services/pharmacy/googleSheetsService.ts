/**
 * Google Sheets Sync Service
 * Handles synchronization of contract data from Google Sheets
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse } from '@/types'

export interface GoogleSheetsSyncConfig {
  id?: string
  hospital_id?: string
  sheet_id: string
  sheet_name?: string
  range?: string
  sync_type: 'contracts' | 'other'
  auto_sync_enabled?: boolean
  sync_interval_minutes?: number
  api_key?: string
  last_sync_at?: string
  last_sync_status?: 'success' | 'failed' | 'in_progress'
  last_sync_error?: string
  detected_headers?: string[] // NEW: Store detected headers from Google Sheet
}

export interface ContractRow {
  contract_number?: string
  contract_name: string
  supplier_name?: string
  contract_type?: string
  start_date?: string
  end_date?: string
  value?: number
  currency?: string
  status?: string
  [key: string]: any // For additional columns from Google Sheets
}

export interface SyncResult {
  success: boolean
  rowsProcessed: number
  rowsCreated: number
  rowsUpdated: number
  rowsDeleted: number
  errors: string[]
  detectedHeaders?: string[] // NEW: Include detected headers in result
}

// =====================================================
// ERROR HANDLING ENHANCEMENTS
// =====================================================

/**
 * Sync error codes for better error handling
 */
export enum SyncErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SHEET_NOT_FOUND = 'SHEET_NOT_FOUND',
  SHEET_NOT_ACCESSIBLE = 'SHEET_NOT_ACCESSIBLE',
  INVALID_SHEET_FORMAT = 'INVALID_SHEET_FORMAT',
  NO_HEADERS_FOUND = 'NO_HEADERS_FOUND',
  NO_DATA_ROWS = 'NO_DATA_ROWS',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured sync error with details and suggestions
 */
export interface SyncError {
  code: SyncErrorCode
  message: string
  details?: string
  suggestion?: string
}

/**
 * Response from sheet with dynamic headers
 */
export interface SheetWithHeaders {
  headers: string[]                        // Raw headers from Google Sheet
  headerRowIndex: number                   // Row where headers were detected
  data: ContractRow[]                      // Parsed data rows
  rawData: any[][]                         // Raw data for debugging
  columnMapping: Record<string, number>    // Header to column index mapping
  totalRows: number                        // Total rows in sheet
}

/**
 * Create a structured sync error
 */
export function createSyncError(
  code: SyncErrorCode,
  message: string,
  details?: string,
  suggestion?: string
): SyncError {
  return { code, message, details, suggestion }
}

/**
 * Get user-friendly error message with suggestion
 */
export function getErrorSuggestion(code: SyncErrorCode): string {
  switch (code) {
    case SyncErrorCode.SHEET_NOT_ACCESSIBLE:
      return 'Sila minta pemilik Google Sheet untuk berkongsi dokumen sebagai "Sesiapa yang mempunyai pautan" → "Pembaca".'
    case SyncErrorCode.SHEET_NOT_FOUND:
      return 'Sila pastikan ID atau URL Google Sheet adalah betul.'
    case SyncErrorCode.NO_HEADERS_FOUND:
      return 'Sila pastikan Google Sheet mempunyai baris header dengan nama lajur.'
    case SyncErrorCode.NO_DATA_ROWS:
      return 'Sila pastikan Google Sheet mempunyai data di bawah baris header.'
    case SyncErrorCode.AUTHENTICATION_FAILED:
      return 'Sila log keluar dan log masuk semula, kemudian cuba lagi.'
    case SyncErrorCode.RATE_LIMITED:
      return 'Terlalu banyak permintaan. Sila tunggu beberapa minit dan cuba lagi.'
    case SyncErrorCode.NETWORK_ERROR:
      return 'Sila semak sambungan internet anda dan cuba lagi.'
    default:
      return 'Sila hubungi pentadbir sistem jika masalah berterusan.'
  }
}

/**
 * Extract Sheet ID from Google Sheets URL or return the ID if already extracted
 */
export function extractSheetId(input: string): string | null {
  if (!input || !input.trim()) return null

  const trimmed = input.trim()

  // If it's already just an ID (alphanumeric with dashes/underscores, no slashes or special chars)
  // Google Sheet IDs are typically 44 characters long
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('?')) {
    return trimmed
  }

  // Try to extract from URL - handle various URL formats
  // Pattern 1: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit...
  // Pattern 2: /spreadsheets/d/{SHEET_ID}/
  // Pattern 3: /d/{SHEET_ID}/
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i,
    /\/d\/([a-zA-Z0-9_-]+)/i,
    /spreadsheets\/d\/([a-zA-Z0-9_-]+)/i,
    /d\/([a-zA-Z0-9_-]+)/i,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1] && match[1].length >= 20) {
      return match[1]
    }
  }

  return null
}

/**
 * Fetch data from Google Sheets via Supabase Edge Function (avoids CORS)
 * The Edge Function acts as a proxy to fetch data from Google Sheets
 */
export async function fetchGoogleSheetData(
  sheetIdOrUrl: string,
  sheetName: string = 'Sheet1',
  range?: string,
  apiKey?: string,
  accessToken?: string // OAuth 2.0 access token for authenticated access
): Promise<ApiResponse<any[][]>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: 'Supabase is not configured. Cannot fetch Google Sheets data.',
      }
    }

    // Extract sheet ID from URL if needed
    const sheetId = extractSheetId(sheetIdOrUrl)

    if (!sheetId) {
      return {
        data: null,
        error: 'Invalid Google Sheet ID or URL. Please provide either the Sheet ID or the full Google Sheets URL.',
      }
    }

    // Ensure session is fresh before calling Edge Function
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return {
        data: null,
        error: 'Authentication required. Please log in to sync Google Sheets.',
      }
    }

    // Refresh session if it's close to expiring (within 5 minutes)
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000

    if (expiresAt < fiveMinutesFromNow) {
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.warn('Failed to refresh session:', refreshError)
      }
    }

    // Use Supabase client's functions.invoke() which handles auth automatically
    // This ensures the JWT token is properly included and refreshed if needed
    const { data, error: invokeError } = await supabase.functions.invoke('sync-google-sheets', {
      body: {
        sheetId,
        sheetName,
        range,
        apiKey,
        accessToken, // Include OAuth token if provided
      },
    })

    if (invokeError) {
      console.error('Edge Function invoke error:', invokeError)

      // Handle authentication errors
      if (invokeError.message?.includes('401') || invokeError.message?.includes('Unauthorized')) {
        return {
          data: null,
          error: 'Authentication failed. Please log out and log back in, then try again.',
        }
      }

      // Handle 403 Forbidden (sheet not accessible)
      if (invokeError.message?.includes('403') || invokeError.message?.includes('Forbidden')) {
        return {
          data: null,
          error: 'The Google Sheet is not publicly accessible. Please either:\n1. Make the sheet publicly viewable: Go to File → Share → "Anyone with the link" → Viewer, OR\n2. Provide a Google Sheets API key in the configuration.',
        }
      }

      return {
        data: null,
        error: invokeError.message || 'Failed to invoke sync function',
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'No data returned from sync function',
      }
    }

    if (data.error) {
      // Check if it's a 403 error in the response
      if (data.error.includes('not publicly accessible') || data.error.includes('403')) {
        return {
          data: null,
          error: 'The Google Sheet is not publicly accessible. Please either:\n1. Make the sheet publicly viewable: Go to File → Share → "Anyone with the link" → Viewer, OR\n2. Provide a Google Sheets API key in the configuration.',
        }
      }

      return {
        data: null,
        error: data.error,
      }
    }

    if (!data.data || !Array.isArray(data.data)) {
      return {
        data: null,
        error: 'Invalid response format from Google Sheets',
      }
    }

    return {
      data: data.data,
      error: null,
    }
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch Google Sheet data',
    }
  }
}

/**
 * Detect manual indices for contract columns from raw headers
 */
export function detectManualIndices(rawHeaders: string[]): any {
  const manualIndices: any = {}

  // Map keywords to indices for unified parsing
  const findKeywordIdx = (keywords: string[]) => {
    const normalizedHeaders = rawHeaders.map(h =>
      h.toLowerCase().trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
    )
    const normalizedKeywords = keywords.map(k =>
      k.toLowerCase().trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
    )

    // Exact match first
    let idx = normalizedHeaders.findIndex(h => normalizedKeywords.some(k => h === k))

    // Substring match if not found
    if (idx === -1) {
      idx = normalizedHeaders.findIndex(h =>
        normalizedKeywords.some(k => h.includes(k) || k.includes(h))
      )
    }
    return idx
  }

  // The 'No' column (row numbers) - we need this to SKIP it when mapping 'Item'
  const rowNumberIdx = findKeywordIdx(['no', 'bil', 'bil.', 'no.'])
  console.log('🔢 Row Number Column (No) detected at index:', rowNumberIdx)

  manualIndices.contractNumberIdx = findKeywordIdx(['no kontrak', 'no. kontrak', 'contract no', 'contract number', 'nombor kontrak'])

  // For Item/Contract Name, we need to be STRICT to avoid matching the 'No' column
  // Only match 'item' if it's a standalone column with these exact headers
  const itemHeaders = rawHeaders.map(h => h.toLowerCase().trim())
  const itemIdx = itemHeaders.findIndex(h =>
    h === 'item' ||
    h === 'item name' ||
    h === 'nama item' ||
    h === 'ppt' ||
    h === 'nama kontrak' ||
    h === 'butiran' ||
    h === 'perihal' ||
    h === 'description'
  )
  manualIndices.contractNameIdx = itemIdx
  // Specific helper for supplier to avoid matching "Item Name" or "Contract Name"
  const findSupplierIdx = () => {
    const keywords = ['pembekal', 'supplier', 'vendor', 'nama syarikat', 'company name', 'supplier name']
    const normalizedHeaders = rawHeaders.map(h => h.toLowerCase().trim())

    return normalizedHeaders.findIndex(h => {
      // Exclude if header looks like "Item Name" or "Contract Name"
      if (h.includes('item') || h.includes('contract') || h.includes('produk') || h.includes('product')) return false

      return keywords.some(k => h.includes(k) || k.includes(h))
    })
  }
  manualIndices.supplierNameIdx = findSupplierIdx()
  manualIndices.startDateIdx = findKeywordIdx(['kontrak mula', 'tarikh mula', 'start date', 'mula'])
  manualIndices.endDateIdx = findKeywordIdx(['kontrak tamat', 'tarikh tamat', 'end date', 'tamat'])
  manualIndices.valueIdx = findKeywordIdx(['harga (rm)', 'harga', 'value', 'price', 'nilai', 'jumlah'])
  manualIndices.tempohSerahanIdx = findKeywordIdx(['tempoh serahan', 'delivery period', 'delivery'])
  manualIndices.sstIdx = findKeywordIdx(['sst', 'dokumen sst', 'sst document'])
  manualIndices.unitIdx = findKeywordIdx(['unit', 'unit pengukuran', 'uom'])

  console.log('📋 Manual Indices Detected:', manualIndices)

  return manualIndices
}

/**
 * Parse contract data from Google Sheets rows
 * Assumes first row is headers
 */
export function parseContractRows(
  rows: any[][],
  providedHeaderRowIndex: number = 0,
  manualIndices?: {
    contractNumberIdx?: number;
    contractNameIdx?: number;
    supplierNameIdx?: number;
    contractTypeIdx?: number;
    startDateIdx?: number;
    endDateIdx?: number;
    valueIdx?: number;
    currencyIdx?: number;
    statusIdx?: number;
    tempohSerahanIdx?: number;
    sstIdx?: number;
    periodIdx?: number;
  }
): ContractRow[] {
  if (!rows || rows.length === 0) {
    return []
  }

  // 1. SCORE-BASED HEADER ROW DETECTION
  // Requires 3+ keyword matches AND 25% match ratio to avoid picking data rows
  let headerRowIndex = providedHeaderRowIndex
  const headerKeywords = [
    'contract', 'kontrak', 'item', 'barang', 'perkhidmatan',
    'pembekal', 'no.', 'no kontrak', 'no. kontrak', 'sst', 'tempoh serahan',
    'tarikh', 'date', 'mula', 'tamat', 'status', 'supplier', 'vendor',
    'harga', 'price', 'nilai', 'serahan', 'delivery'
  ]

  // If provided index is 0, let's try to find a better one
  if (providedHeaderRowIndex === 0) {
    let bestScore = 0
    let bestRowIndex = 0

    for (let i = 0; i < Math.min(rows.length, 15); i++) { // Check first 15 rows
      const row = rows[i].map((c: any) => String(c || '').toLowerCase().trim())

      // Count non-empty cells
      const nonEmptyCells = row.filter(c => c && c.length > 0)
      if (nonEmptyCells.length < 3) continue // Skip rows with too few cells

      // Count keyword matches
      const keywordMatches = row.filter(cell =>
        cell && headerKeywords.some(k => cell.includes(k))
      )

      // Calculate match ratio
      const matchRatio = keywordMatches.length / nonEmptyCells.length

      // Score: requires at least 3 keyword matches AND 25% ratio
      // Also penalize rows where cells are too long (likely data, not headers)
      const avgCellLength = nonEmptyCells.reduce((sum, c) => sum + c.length, 0) / nonEmptyCells.length
      const lengthPenalty = avgCellLength > 50 ? 0.5 : 1 // Penalize long cells

      const score = keywordMatches.length * matchRatio * lengthPenalty

      console.log(`Row ${i}: ${keywordMatches.length} matches, ${(matchRatio * 100).toFixed(1)}% ratio, score: ${score.toFixed(2)}`)

      if (keywordMatches.length >= 3 && matchRatio >= 0.25 && score > bestScore) {
        bestScore = score
        bestRowIndex = i
      }
    }

    if (bestScore > 0) {
      headerRowIndex = bestRowIndex
      console.log(`✅ Selected header row at index ${headerRowIndex} with score: ${bestScore.toFixed(2)}`)
    } else {
      console.warn('⚠️ No header row found with sufficient confidence, using row 0')
    }
  }

  const headers = rows[headerRowIndex]?.map((h: any) => String(h || '').trim().toLowerCase()) || []
  const contracts: ContractRow[] = []

  if (headers.length === 0) return []

  // 2. BROAD & ROBUST HEADER INDEX MAPPING
  const findHeaderIndex = (keywords: string[]) => {
    // Normalize function: remove special chars, extra spaces, lowercase
    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace special chars with space
        .replace(/\s+/g, ' ')      // Collapse multiple spaces
        .trim()
    }

    // Normalize headers and keywords for better matching
    const normalizedHeaders = headers.map(h => normalize(h))
    const normalizedKeywords = keywords.map(k => normalize(k))

    // Try exact match first (normalized)
    let idx = normalizedHeaders.findIndex(h =>
      normalizedKeywords.some(k => h === k)
    )
    if (idx >= 0) return idx

    // Try substring match (header contains keyword)
    idx = normalizedHeaders.findIndex(h => {
      if (!h) return false
      return normalizedKeywords.some(k => h.includes(k))
    })
    if (idx >= 0) return idx

    // Try keyword contains header (e.g. "name" matches "item name" keyword)
    idx = normalizedHeaders.findIndex(h => {
      if (!h || h.length < 3) return false
      return normalizedKeywords.some(k => k.includes(h))
    })
    if (idx >= 0) return idx

    // Try word-based matching (all words in keyword present in header)
    idx = normalizedHeaders.findIndex(h => {
      if (!h) return false
      const headerWords = h.split(' ').filter(w => w.length > 0)
      return normalizedKeywords.some(k => {
        const keywordWords = k.split(' ').filter(w => w.length > 0)
        // Check if all keyword words are in header
        return keywordWords.every(kw => headerWords.some(hw => hw.includes(kw) || kw.includes(hw)))
      })
    })

    return idx
  }

  // Column mappings using EXACT headers from user's Google Sheet
  // Priority order: exact match first, then variations

  // Contract No → "No Kontrak" in Google Sheet
  const contractNumberIdx = manualIndices?.contractNumberIdx ?? findHeaderIndex([
    'no kontrak', 'no. kontrak', 'nombor kontrak',
    'contract no', 'contract number',
    'kontrak no', 'contract_no', 'contractno', 'contract #', 'no. contract'
  ])

  // Item Name → "Item" in Google Sheet
  // IMPORTANT: Use EXACT match only to avoid matching "No" column
  let contractNameIdx = manualIndices?.contractNameIdx
  if (contractNameIdx === undefined || contractNameIdx === -1) {
    const itemHeaders = headers.map(h => h.toLowerCase().trim())
    contractNameIdx = itemHeaders.findIndex(h =>
      h === 'item' ||
      h === 'item name' ||
      h === 'nama item' ||
      h === 'nama kontrak' ||
      h === 'butiran' ||
      h === 'perihal' ||
      h === 'description' ||
      h === 'nama' ||
      h === 'barang' ||
      h === 'perkhidmatan' ||
      h === 'service' ||
      h === 'product' ||
      h === 'produk'
    )
  }

  // Supplier → "Pembekal" in Google Sheet
  const supplierNameIdx = manualIndices?.supplierNameIdx ?? findHeaderIndex([
    'pembekal', 'supplier', 'vendor', 'nama syarikat', 'company', 'syarikat',
    'nama pembekal', 'supplier name', 'vendor name', 'company name'
  ])

  const contractTypeIdx = manualIndices?.contractTypeIdx ?? findHeaderIndex([
    'type', 'category', 'jenis', 'kategori',
    'contract type', 'jenis kontrak', 'kategori kontrak'
  ])

  // Period Mula → "Kontrak Mula" in Google Sheet
  const startDateIdx = manualIndices?.startDateIdx ?? findHeaderIndex([
    'kontrak mula', 'tarikh mula', 'start', 'begin', 'effective',
    'start date', 'tarikh kontrak mula', 'mula', 'from', 'dari'
  ])

  // Period Tamat → "Kontrak Tamat" in Google Sheet
  const endDateIdx = manualIndices?.endDateIdx ?? findHeaderIndex([
    'kontrak tamat', 'tarikh tamat', 'end', 'expir', 'terminat',
    'end date', 'tarikh kontrak tamat', 'tamat', 'to', 'hingga', 'until'
  ])

  const valueIdx = manualIndices?.valueIdx ?? findHeaderIndex([
    'harga (rm)', 'harga', 'value', 'amount', 'price', 'nilai', 'jumlah',
    'pricing', 'cost', 'kos', 'total', 'contract value',
    'nilai kontrak', 'harga kontrak', 'jumlah kontrak'
  ])

  const currencyIdx = manualIndices?.currencyIdx ?? findHeaderIndex([
    'currency', 'mata wang', 'curr', 'matawang'
  ])

  const statusIdx = manualIndices?.statusIdx ?? findHeaderIndex([
    'status', 'keadaan', 'state', 'condition'
  ])

  // Tempoh Serahan → "Tempoh Serahan" in Google Sheet
  const tempohSerahanIdx = manualIndices?.tempohSerahanIdx ?? findHeaderIndex([
    'tempoh serahan', 'delivery period', 'serahan', 'delivery', 'masa serahan', 'delivery time'
  ])

  // SST → "SST" in Google Sheet
  const sstIdx = manualIndices?.sstIdx ?? findHeaderIndex([
    'sst', 'dokumen sst', 'surat sst', 'sst document', 'sst cert', 'sst certificate', 'sijil sst'
  ])

  // Legacy combined period column fallback
  const periodIdx = manualIndices?.periodIdx ?? findHeaderIndex([
    'jangkaan kontrak', 'contract period', 'tempoh kontrak',
    'duration', 'masa kontrak'
  ])

  // DIAGNOSTIC LOGGING
  console.log('📋 Header Detection Results:')
  console.log('Headers found:', headers)
  console.log('Column Mappings:')
  console.log('  Contract Number:', contractNumberIdx >= 0 ? `Column ${contractNumberIdx} ("${headers[contractNumberIdx]}")` : 'NOT FOUND')
  console.log('  Contract Name:', contractNameIdx >= 0 ? `Column ${contractNameIdx} ("${headers[contractNameIdx]}")` : 'NOT FOUND')
  console.log('  Supplier:', supplierNameIdx >= 0 ? `Column ${supplierNameIdx} ("${headers[supplierNameIdx]}")` : 'NOT FOUND')
  console.log('  Contract Type:', contractTypeIdx >= 0 ? `Column ${contractTypeIdx} ("${headers[contractTypeIdx]}")` : 'NOT FOUND')
  console.log('  Start Date:', startDateIdx >= 0 ? `Column ${startDateIdx} ("${headers[startDateIdx]}")` : 'NOT FOUND')
  console.log('  End Date:', endDateIdx >= 0 ? `Column ${endDateIdx} ("${headers[endDateIdx]}")` : 'NOT FOUND')
  console.log('  Value:', valueIdx >= 0 ? `Column ${valueIdx} ("${headers[valueIdx]}")` : 'NOT FOUND')
  console.log('  Currency:', currencyIdx >= 0 ? `Column ${currencyIdx} ("${headers[currencyIdx]}")` : 'NOT FOUND')
  console.log('  Status:', statusIdx >= 0 ? `Column ${statusIdx} ("${headers[statusIdx]}")` : 'NOT FOUND')
  console.log('  Tempoh Serahan:', tempohSerahanIdx >= 0 ? `Column ${tempohSerahanIdx} ("${headers[tempohSerahanIdx]}")` : 'NOT FOUND')
  console.log('  SST:', sstIdx >= 0 ? `Column ${sstIdx} ("${headers[sstIdx]}")` : 'NOT FOUND')

  // Process data rows
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const contract: ContractRow = {
      contract_name: contractNameIdx >= 0 && row[contractNameIdx]
        ? String(row[contractNameIdx]).trim()
        : ``,
    }

    // Default name if missing or empty
    if (!contract.contract_name || contract.contract_name.length < 2) {
      if (contractNumberIdx >= 0 && row[contractNumberIdx]) {
        contract.contract_name = String(row[contractNumberIdx]).trim()
      } else {
        contract.contract_name = `Contract ${i + 1}`
      }
    }

    // Map known columns - just assign values directly (column mapping is the fix)
    if (contractNumberIdx >= 0 && row[contractNumberIdx]) {
      contract.contract_number = String(row[contractNumberIdx]).trim()
    }

    if (supplierNameIdx >= 0 && row[supplierNameIdx]) {
      contract.supplier_name = String(row[supplierNameIdx]).trim()
    }

    // Parse combined period column if start/end dates are missing
    if (startDateIdx === -1 && endDateIdx === -1 && periodIdx >= 0 && row[periodIdx]) {
      try {
        const periodStr = String(row[periodIdx]);
        // Attempt to split by common separators like " - ", " to ", etc.
        const parts = periodStr.split(/ - | to | hingga /i);
        if (parts.length === 2) {
          contract.start_date = parseDate(parts[0].trim());
          contract.end_date = parseDate(parts[1].trim());
        } else {
          // Try parsing naive date extraction (first 2 dates found)
          const dateMatches = periodStr.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g);
          if (dateMatches && dateMatches.length >= 2) {
            contract.start_date = parseDate(dateMatches[0]);
            contract.end_date = parseDate(dateMatches[1]);
          }
        }
      } catch (e) {
        console.warn(`Failed to parse period: ${row[periodIdx]}`);
      }
    }

    if (contractTypeIdx >= 0 && row[contractTypeIdx]) {
      contract.contract_type = String(row[contractTypeIdx]).trim()
    }

    // Start date (direct assignment)
    if (startDateIdx >= 0 && row[startDateIdx]) {
      contract.start_date = parseDate(String(row[startDateIdx]))
    }

    // End date (direct assignment)
    if (endDateIdx >= 0 && row[endDateIdx]) {
      contract.end_date = parseDate(String(row[endDateIdx]))
    }

    if (valueIdx >= 0 && row[valueIdx]) {
      const valueStr = String(row[valueIdx]).replace(/[^\d.-]/g, '')
      contract.value = parseFloat(valueStr) || undefined
    }
    if (currencyIdx >= 0 && row[currencyIdx]) {
      contract.currency = String(row[currencyIdx]).trim().toUpperCase() || 'MYR'
    }

    // Status with validation
    if (statusIdx >= 0 && row[statusIdx]) {
      const rawValue = String(row[statusIdx]).trim()
      const validStatus = normalizeStatus(rawValue)
      if (validStatus) {
        contract.status = validStatus
      } else {
        console.warn(`Row ${i + 2}: Invalid status "${rawValue.substring(0, 30)}${rawValue.length > 30 ? '...' : ''}", will default to "active"`)
      }
    }
    if (tempohSerahanIdx >= 0 && row[tempohSerahanIdx]) {
      contract.tempoh_serahan = String(row[tempohSerahanIdx]).trim()
    }
    if (sstIdx >= 0 && row[sstIdx]) {
      contract.sst = String(row[sstIdx]).trim()
    }

    // Store all other columns in metadata
    const metadata: Record<string, any> = {}

    // Add explicitly mapped fields to metadata as well for UI compatibility
    if (contract.tempoh_serahan) metadata['tempoh serahan'] = contract.tempoh_serahan
    if (contract.sst) metadata['sst'] = contract.sst

    headers.forEach((header, idx) => {
      if (row[idx] !== undefined && row[idx] !== null && row[idx] !== '') {
        // Skip already mapped basic columns
        if (
          idx !== contractNumberIdx &&
          idx !== contractNameIdx &&
          idx !== supplierNameIdx &&
          idx !== contractTypeIdx &&
          idx !== startDateIdx &&
          idx !== endDateIdx &&
          idx !== valueIdx &&
          idx !== currencyIdx &&
          idx !== statusIdx &&
          idx !== tempohSerahanIdx &&
          idx !== sstIdx
        ) {
          metadata[header] = row[idx]
        }
      }
    })
    contract.metadata = Object.keys(metadata).length > 0 ? metadata : undefined

    contracts.push(contract)
  }

  return contracts
}

/**
 * Parse date string from various formats
 */
function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined

  try {
    // Try parsing as ISO date
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }

    // Try parsing common formats (DD/MM/YYYY, DD-MM-YYYY, etc.)
    const parts = dateStr.split(/[\/\-]/)
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const year = parseInt(parts[2], 10)
      const parsed = new Date(year, month, day)
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
      }
    }
  } catch (e) {
    console.warn('Failed to parse date:', dateStr)
  }

  return undefined
}

/**
 * Validate if a value looks like a contract number/reference
 * Contract refs typically contain patterns like "KKM-323/2025" or "34/2025"
 */
function isValidContractNumber(value: string): boolean {
  if (!value || value.length < 2 || value.length > 100) return false

  // Contract refs typically contain year patterns
  const hasYearPattern = /\/20\d{2}/.test(value) || /\d{2,4}\/\d{4}/.test(value) || /20\d{2}/.test(value)
  const hasContractPrefix = /^(kkm|kontrak|po|ref|no)/i.test(value.trim())

  // Should NOT look like delivery terms or long descriptions
  const looksLikeDeliveryText = /tempoh|serahan|tidak melebihi|hari daripada|tarikh pesanan/i.test(value)
  const isTooLong = value.length > 80

  if (looksLikeDeliveryText || isTooLong) return false

  return hasYearPattern || hasContractPrefix || (value.length <= 30 && /\d/.test(value))
}

/**
 * Validate if a value looks like a supplier/company name
 * Should be a company name, not a contract reference
 */
function isValidSupplierName(value: string): boolean {
  if (!value || value.length < 3) return false

  // Definitely looks like a contract reference, NOT a supplier
  const looksLikeContractRef = /^KKM[-\/]\d+/i.test(value.trim()) ||
    /^\d+\/\d{4}$/.test(value.trim()) ||
    /^(po|ref|kontrak)[-\/]/i.test(value.trim())

  if (looksLikeContractRef) return false

  // Malaysian company indicators
  const hasCompanyIndicators = /sdn|bhd|berhad|co\.|inc|ltd|enterprise|trading|supply|pharma|medical/i.test(value)

  // At minimum, it should be a reasonable length name (not a single number)
  const isReasonableName = value.length >= 5 && !/^\d+$/.test(value.trim())

  return hasCompanyIndicators || isReasonableName
}

/**
 * Validate if a value looks like a date
 */
function isValidDateValue(value: string): boolean {
  if (!value || value.length < 6) return false

  const datePatterns = [
    /\d{1,2}[-\/\.]\w{3}[-\/\.]\d{2,4}/i, // "27-oct-2025", "27/oct/25"
    /\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}/, // "27/10/2025", "27-10-25"
    /\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}/,   // "2025-10-27"
    /\w{3}[-\/\.\s]\d{1,2}[-\/\.\s,]*\d{2,4}/i // "oct 27, 2025"
  ]

  return datePatterns.some(p => p.test(value))
}

/**
 * Normalize and validate status value
 */
function normalizeStatus(value: string): 'active' | 'expired' | 'terminated' | 'pending' | null {
  if (!value) return null

  const normalized = value.toLowerCase().trim()
  const validStatuses = ['active', 'expired', 'terminated', 'pending'] as const

  // Direct match
  if (validStatuses.includes(normalized as any)) {
    return normalized as typeof validStatuses[number]
  }

  // Map common variations
  if (/aktif|berkuatkuasa|dalam/i.test(normalized)) return 'active'
  if (/tamat|luput|ended/i.test(normalized)) return 'expired'
  if (/batal|ditamatkan|cancelled/i.test(normalized)) return 'terminated'
  if (/menunggu|pending|dalam proses/i.test(normalized)) return 'pending'

  // If it looks like a long description or contract ref, it's not a valid status
  if (normalized.length > 30 || /\d{4}/.test(normalized) || /kkm|kontrak/i.test(normalized)) {
    return null
  }

  return null
}

/**
 * Sync contracts from Google Sheets to database
 */
export async function syncContractsFromGoogleSheets(
  hospitalId: string,
  config: GoogleSheetsSyncConfig,
  manualIndices?: any
): Promise<ApiResponse<SyncResult>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: 'Supabase is not configured',
      }
    }

    // Update sync status to in_progress
    if (config.id) {
      await supabase
        .from('google_sheets_sync_config')
        .update({
          last_sync_status: 'in_progress',
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', config.id)
    }

    // Extract sheet ID from URL if needed
    const extractedSheetId = extractSheetId(config.sheet_id)
    if (!extractedSheetId) {
      const errorMsg = 'Invalid Google Sheet ID or URL. Please provide either the Sheet ID or the full Google Sheets URL.'

      if (config.id) {
        await supabase
          .from('google_sheets_sync_config')
          .update({
            last_sync_status: 'failed',
            last_sync_error: errorMsg,
          })
          .eq('id', config.id)
      }

      return {
        data: null,
        error: errorMsg,
      }
    }

    // Fetch data from Google Sheets
    const fetchResult = await fetchGoogleSheetData(
      extractedSheetId,
      config.sheet_name || 'Sheet1',
      config.range,
      config.api_key
    )

    if (fetchResult.error || !fetchResult.data) {
      const errorMsg = fetchResult.error || 'Failed to fetch data from Google Sheets'

      if (config.id) {
        await supabase
          .from('google_sheets_sync_config')
          .update({
            last_sync_status: 'failed',
            last_sync_error: errorMsg,
          })
          .eq('id', config.id)
      }

      return {
        data: null,
        error: errorMsg,
      }
    }

    // Initialize result object early
    const result: SyncResult = {
      success: true,
      rowsProcessed: 0,
      rowsCreated: 0,
      rowsUpdated: 0,
      rowsDeleted: 0,
      errors: [],
    }

    // --- AUTO-REPAIR LOGIC MOVED HERE ---
    // Check for "Squashed" data (user pasted CSV into one column)
    const rawRowsForCheck = fetchResult.data || []
    const squashedRowIndex = rawRowsForCheck.findIndex(row =>
      row.length === 1 &&
      typeof row[0] === 'string' &&
      (row[0].indexOf('No Kontrak') !== -1 || row[0].indexOf('Contract No') !== -1) &&
      (row[0].indexOf('Pembekal') !== -1 || row[0].indexOf('Supplier') !== -1)
    )

    if (squashedRowIndex !== -1) {
      console.warn('⚠️ Squashed CSV data detected! Attempting to auto-repair...')
      const splitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/

      const repairedRows = rawRowsForCheck.map(row => {
        if (row.length === 1 && typeof row[0] === 'string') {
          let line = row[0].trim()
          const parts = line.split(splitRegex)
          return parts.map(p => p.trim().replace(/^"|"$/g, '').replace(/""/g, '"'))
        }
        return row
      })

      // Update data source immediately
      fetchResult.data = repairedRows

      // Re-detect indices
      const newHeaderIdx = repairedRows.findIndex((r: any[]) =>
        r.some((c: string) =>
          String(c).toLowerCase().indexOf('no kontrak') !== -1 ||
          String(c).toLowerCase().indexOf('contract no') !== -1
        )
      )

      if (newHeaderIdx !== -1) {
        const newHeaders = repairedRows[newHeaderIdx]
        manualIndices = detectManualIndices(newHeaders)
        console.log('🔄 Re-detected indices after repair:', manualIndices)

        // DEBUG: Show headers to user
        result.errors.push(`ℹ️ Detected Columns: ${newHeaders.join(' | ')}`)
        result.errors.push(`ℹ️ Mapped Supplier Column: ${newHeaders[manualIndices.supplierNameIdx] || 'Not Found'}`)
      }
    }
    // ------------------------------------

    // Parse contract rows
    let contracts = parseContractRows(fetchResult.data, 0, manualIndices)

    if (contracts.length === 0) {
      const errorMsg = 'No contract data found in Google Sheet'

      if (config.id) {
        await supabase
          .from('google_sheets_sync_config')
          .update({
            last_sync_status: 'failed',
            last_sync_error: errorMsg,
          })
          .eq('id', config.id)
      }

      return {
        data: null,
        error: errorMsg,
      }
    }

    // Sync to database
    result.rowsProcessed = contracts.length

    // (Old squashed logic removed - moved to top)

    // Get existing contracts for this hospital
    const { data: existingContracts } = await supabase
      .from('contracts')
      .select('id, contract_number, sync_hash')
      .eq('hospital_id', hospitalId)

    const existingMap = new Map(
      (existingContracts || []).map(c => [c.contract_number || '', c])
    )

    // Process each contract
    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i]
      try {
        // Create sync hash
        const hashData = JSON.stringify({
          contract_number: contract.contract_number,
          contract_name: contract.contract_name,
          supplier_name: contract.supplier_name,
          start_date: contract.start_date,
          end_date: contract.end_date,
          value: contract.value,
        })
        // Calculate hash of the data
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashData))
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const syncHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        // Validate required fields
        if (!contract.contract_name || contract.contract_name.trim() === '') {
          result.errors.push(`Row ${i + 2}: Contract name is required`)
          continue
        }

        // Validate and normalize status - must be one of: 'active', 'expired', 'terminated', 'pending'
        const validStatuses = ['active', 'expired', 'terminated', 'pending'] as const
        let normalizedStatus: 'active' | 'expired' | 'terminated' | 'pending' = 'active' // Default to active

        if (contract.status) {
          const statusStr = String(contract.status).toLowerCase().trim()
          if (validStatuses.includes(statusStr as any)) {
            normalizedStatus = statusStr as typeof normalizedStatus
          } else {
            // Invalid status value - default to active and log warning
            console.warn(`Row ${i + 2}: Invalid status "${contract.status}", defaulting to "active"`)
          }
        }

        // Ensure status is always a valid value (double-check)
        if (!validStatuses.includes(normalizedStatus)) {
          normalizedStatus = 'active'
        }

        // Final validation - ensure status is exactly one of the valid values
        const finalStatus = validStatuses.includes(normalizedStatus) ? normalizedStatus : 'active'

        const contractData: any = {
          hospital_id: hospitalId,
          contract_number: contract.contract_number || null,
          contract_name: contract.contract_name.trim(),
          supplier_name: contract.supplier_name ? contract.supplier_name.trim() : null,
          contract_type: contract.contract_type ? contract.contract_type.trim() : null,
          start_date: contract.start_date || null,
          end_date: contract.end_date || null,
          total_value: contract.value || null,
          currency: (contract.currency || 'MYR').trim().toUpperCase(),
          status: finalStatus, // Always guaranteed to be exactly 'active', 'expired', 'terminated', or 'pending'
          metadata: {
            ...contract.metadata,
            raw_value: contract.value,
            tempoh_serahan: contract.tempoh_serahan,
            sst: contract.sst
          },
          google_sheet_row_index: i + 2, // +2 because row 1 is header, row 2 is first data
          last_synced_at: new Date().toISOString(),
          sync_hash: syncHash,
        }

        // Try to find supplier by name
        if (contract.supplier_name) {
          const { data: supplier } = await supabase
            .from('suppliers')
            .select('id')
            .ilike('company_name', contract.supplier_name)
            .limit(1)
            .single()

          if (supplier) {
            contractData.supplier_id = supplier.id
          }
        }

        const existing = contract.contract_number
          ? existingMap.get(contract.contract_number)
          : null

        if (existing) {
          // Check if data has changed
          if (existing.sync_hash !== syncHash) {
            // Update existing contract - ensure status is valid
            const updateData = {
              ...contractData,
              status: finalStatus, // Explicitly set valid status (same as insert)
              updated_at: new Date().toISOString(),
            }

            const { error: updateError } = await supabase
              .from('contracts')
              .update(updateData)
              .eq('id', existing.id)

            if (updateError) {
              const errorDetails = updateError.details || updateError.hint || ''
              const errorMsg = `Failed to update contract "${contract.contract_number}": ${updateError.message}${errorDetails ? ` (${errorDetails})` : ''}`
              console.error('Update error:', updateError, 'Contract data:', contractData)
              result.errors.push(errorMsg)
            } else {
              result.rowsUpdated++
            }
          }
        } else {
          // Create new contract using upsert to handle duplicate key gracefully
          // Final safety check - ensure status is valid before insert
          if (!validStatuses.includes(contractData.status as any)) {
            console.error(`Row ${i + 2}: Status validation failed! Status value: "${contractData.status}", type: ${typeof contractData.status}`)
            contractData.status = 'active' // Force to valid value
          }

          // Use upsert if we have a contract_number, otherwise insert with duplicate handling
          if (contract.contract_number) {
            // Upsert: will update if exists, insert if new
            const { error: upsertError } = await supabase
              .from('contracts')
              .upsert(contractData, {
                onConflict: 'hospital_id,contract_number',
                ignoreDuplicates: false
              })
              .select()

            if (upsertError) {
              const errorDetails = upsertError.details || upsertError.hint || ''
              const errorMsg = `Failed to upsert contract "${contract.contract_number}": ${upsertError.message}${errorDetails ? ` (${errorDetails})` : ''}`
              console.error('Upsert error:', upsertError, 'Contract data:', JSON.stringify(contractData, null, 2))
              result.errors.push(errorMsg)
            } else {
              // Count as created (upsert might have updated, but we can't tell easily)
              result.rowsCreated++
            }
          } else {
            // No contract_number, just insert - skip if duplicate name
            const { error: insertError } = await supabase
              .from('contracts')
              .insert(contractData)
              .select()

            if (insertError) {
              // If it's a duplicate error, log and skip instead of failing
              if (insertError.code === '23505') {
                console.warn(`Row ${i + 2}: Skipping duplicate contract "${contract.contract_name}"`)
              } else {
                const errorDetails = insertError.details || insertError.hint || ''
                const errorMsg = `Failed to create contract "${contract.contract_name}": ${insertError.message}${errorDetails ? ` (${errorDetails})` : ''}`
                console.error('Insert error:', insertError, 'Contract data:', JSON.stringify(contractData, null, 2))
                result.errors.push(errorMsg)
              }
            } else {
              result.rowsCreated++
            }
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Row ${i + 2}: ${errorMsg}`)
      }
    }

    // Mark contracts that are no longer in the sheet as deleted/expired
    const syncedContractNumbers = new Set(
      contracts
        .map(c => c.contract_number)
        .filter((n): n is string => !!n)
    )

    const contractsToMark = (existingContracts || []).filter(
      c => c.contract_number && !syncedContractNumbers.has(c.contract_number)
    )

    if (contractsToMark.length > 0) {
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .in(
          'id',
          contractsToMark.map(c => c.id)
        )

      if (!updateError) {
        result.rowsDeleted = contractsToMark.length
      }
    }

    // Update sync config with success status
    if (config.id) {
      await supabase
        .from('google_sheets_sync_config')
        .update({
          last_sync_status: result.errors.length === 0 ? 'success' : 'failed',
          last_sync_error: result.errors.length > 0 ? result.errors.join('; ') : null,
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', config.id)
    }

    return {
      data: result,
      error: result.errors.length > 0 ? result.errors.join('; ') : null,
    }
  } catch (error) {
    console.error('Error syncing contracts from Google Sheets:', error)

    if (config.id) {
      await supabase
        .from('google_sheets_sync_config')
        .update({
          last_sync_status: 'failed',
          last_sync_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', config.id)
    }

    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to sync contracts',
    }
  }
}

/**
 * Get or create sync configuration
 */
export async function getSyncConfig(
  hospitalId: string
): Promise<ApiResponse<GoogleSheetsSyncConfig>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: 'Supabase is not configured',
      }
    }

    const { data, error } = await supabase
      .from('google_sheets_sync_config')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('sync_type', 'contracts')
      .single()

    if (error && (error as any).code !== 'PGRST116') {
      throw error
    }

    return {
      data: data || null,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get sync config',
    }
  }
}

/**
 * Save sync configuration
 */
export async function saveSyncConfig(
  config: GoogleSheetsSyncConfig
): Promise<ApiResponse<GoogleSheetsSyncConfig>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: 'Supabase is not configured',
      }
    }

    if (config.id) {
      // Update existing
      const { data, error } = await supabase
        .from('google_sheets_sync_config')
        .update({
          ...config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } else {
      // Create new
      const { data, error } = await supabase
        .from('google_sheets_sync_config')
        .insert({
          ...config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to save sync config',
    }
  }
}

/**
 * Preview Google Sheet headers and first few rows for debugging
 * Helps users verify that headers are being detected correctly
 */
export async function previewSheetHeaders(
  sheetIdOrUrl: string,
  sheetName: string = 'Sheet1',
  range?: string,
  apiKey?: string
): Promise<ApiResponse<{
  headers: string[]
  headerRowIndex: number
  sampleRows: any[][]
  totalRows: number
}>> {
  try {
    // Fetch data from Google Sheets
    const fetchResult = await fetchGoogleSheetData(
      sheetIdOrUrl,
      sheetName,
      range,
      apiKey
    )

    if (fetchResult.error || !fetchResult.data) {
      return {
        data: null,
        error: fetchResult.error || 'Failed to fetch data from Google Sheets',
      }
    }

    const rows = fetchResult.data

    if (!rows || rows.length === 0) {
      return {
        data: null,
        error: 'No data found in Google Sheet',
      }
    }

    // Detect header row using score-based matching (same as parseContractRows)
    let headerRowIndex = 0
    let bestScore = 0
    const headerKeywords = [
      'contract', 'kontrak', 'item', 'barang', 'perkhidmatan',
      'pembekal', 'no.', 'no kontrak', 'no. kontrak', 'sst', 'tempoh serahan',
      'tarikh', 'date', 'mula', 'tamat', 'status', 'supplier', 'vendor',
      'harga', 'price', 'nilai', 'serahan', 'delivery'
    ]

    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i].map((c: any) => String(c || '').toLowerCase().trim())

      const nonEmptyCells = row.filter(c => c && c.length > 0)
      if (nonEmptyCells.length < 3) continue

      const keywordMatches = row.filter(cell =>
        cell && headerKeywords.some(k => cell.includes(k))
      )

      const matchRatio = keywordMatches.length / nonEmptyCells.length
      const avgCellLength = nonEmptyCells.reduce((sum, c) => sum + c.length, 0) / nonEmptyCells.length
      const lengthPenalty = avgCellLength > 50 ? 0.5 : 1

      const score = keywordMatches.length * matchRatio * lengthPenalty

      if (keywordMatches.length >= 3 && matchRatio >= 0.25 && score > bestScore) {
        bestScore = score
        headerRowIndex = i
      }
    }

    const headers = rows[headerRowIndex]?.map((h: any) => String(h || '').trim()) || []
    const sampleRows = rows.slice(headerRowIndex + 1, Math.min(headerRowIndex + 6, rows.length))

    return {
      data: {
        headers,
        headerRowIndex,
        sampleRows,
        totalRows: rows.length,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error previewing sheet headers:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to preview sheet headers',
    }
  }
}

/**
 * Fetch Google Sheet data with dynamic headers
 * Returns both raw headers AND parsed data for dynamic UI rendering
 */
export async function fetchSheetWithDynamicHeaders(
  sheetIdOrUrl: string,
  sheetName: string = 'Sheet1',
  range?: string,
  apiKey?: string
): Promise<ApiResponse<SheetWithHeaders>> {
  try {
    // Fetch raw data from Google Sheets
    const fetchResult = await fetchGoogleSheetData(
      sheetIdOrUrl,
      sheetName,
      range,
      apiKey
    )

    if (fetchResult.error || !fetchResult.data) {
      // Classify error type
      let errorCode = SyncErrorCode.UNKNOWN_ERROR
      const errorMsg = fetchResult.error || 'Unknown error'

      if (errorMsg.includes('403') || errorMsg.includes('not publicly accessible')) {
        errorCode = SyncErrorCode.SHEET_NOT_ACCESSIBLE
      } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        errorCode = SyncErrorCode.SHEET_NOT_FOUND
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        errorCode = SyncErrorCode.AUTHENTICATION_FAILED
      } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        errorCode = SyncErrorCode.RATE_LIMITED
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        errorCode = SyncErrorCode.NETWORK_ERROR
      }

      return {
        data: null,
        error: `${errorMsg}\n\n💡 ${getErrorSuggestion(errorCode)}`,
      }
    }

    const rows = fetchResult.data

    if (!rows || rows.length === 0) {
      return {
        data: null,
        error: `No data found in Google Sheet.\n\n💡 ${getErrorSuggestion(SyncErrorCode.NO_DATA_ROWS)}`,
      }
    }

    // Detect header row using score-based matching
    let headerRowIndex = 0
    let bestScore = 0
    const headerKeywords = [
      'contract', 'kontrak', 'item', 'barang', 'perkhidmatan',
      'pembekal', 'no.', 'no kontrak', 'no. kontrak', 'sst', 'tempoh serahan',
      'tarikh', 'date', 'mula', 'tamat', 'status', 'supplier', 'vendor',
      'harga', 'price', 'nilai', 'serahan', 'delivery', 'unit'
    ]

    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i].map((c: any) => String(c || '').toLowerCase().trim())

      const nonEmptyCells = row.filter(c => c && c.length > 0)
      if (nonEmptyCells.length < 3) continue

      const keywordMatches = row.filter(cell =>
        cell && headerKeywords.some(k => cell.includes(k))
      )

      const matchRatio = keywordMatches.length / nonEmptyCells.length
      const avgCellLength = nonEmptyCells.reduce((sum, c) => sum + c.length, 0) / nonEmptyCells.length
      const lengthPenalty = avgCellLength > 50 ? 0.5 : 1

      const score = keywordMatches.length * matchRatio * lengthPenalty

      if (keywordMatches.length >= 3 && matchRatio >= 0.25 && score > bestScore) {
        bestScore = score
        headerRowIndex = i
      }
    }

    // Extract raw headers
    const rawHeaders = rows[headerRowIndex]?.map((h: any) => String(h || '').trim()) || []

    if (rawHeaders.length === 0 || rawHeaders.every(h => !h)) {
      return {
        data: null,
        error: `No headers found in Google Sheet.\n\n💡 ${getErrorSuggestion(SyncErrorCode.NO_HEADERS_FOUND)}`,
      }
    }

    // Create column mapping
    const columnMapping: Record<string, number> = {}
    const manualIndices = detectManualIndices(rawHeaders)

    rawHeaders.forEach((header, index) => {
      if (header) {
        columnMapping[header.toLowerCase()] = index
      }
    })

    // Parse contract data rows with manual indices to ensure consistency
    const contracts = parseContractRows(rows, headerRowIndex, manualIndices)

    if (contracts.length === 0) {
      return {
        data: null,
        error: `No data rows found below the header row.\n\n💡 ${getErrorSuggestion(SyncErrorCode.NO_DATA_ROWS)}`,
      }
    }

    console.log('✅ Dynamic headers extracted:', {
      headers: rawHeaders,
      headerRowIndex,
      dataRows: contracts.length,
      columnMapping
    })

    return {
      data: {
        headers: rawHeaders.filter(h => h), // Remove empty headers
        headerRowIndex,
        data: contracts,
        rawData: rows,
        columnMapping,
        totalRows: rows.length,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching sheet with dynamic headers:', error)
    return {
      data: null,
      error: error instanceof Error
        ? `${error.message}\n\n💡 ${getErrorSuggestion(SyncErrorCode.UNKNOWN_ERROR)}`
        : 'Failed to fetch sheet data',
    }
  }
}

/**
 * Enhanced sync that also stores detected headers
 */
export async function syncContractsWithDynamicHeaders(
  hospitalId: string,
  config: GoogleSheetsSyncConfig
): Promise<ApiResponse<SyncResult & { detectedHeaders: string[] }>> {
  try {
    // First, fetch with dynamic headers to get header info
    const sheetResult = await fetchSheetWithDynamicHeaders(
      config.sheet_id,
      config.sheet_name || 'Sheet1',
      config.range,
      config.api_key
    )

    if (sheetResult.error || !sheetResult.data) {
      // Update sync config with error
      if (config.id) {
        await supabase
          .from('google_sheets_sync_config')
          .update({
            last_sync_status: 'failed',
            last_sync_error: sheetResult.error,
            last_sync_at: new Date().toISOString(),
          })
          .eq('id', config.id)
      }

      return {
        data: null,
        error: sheetResult.error || 'Failed to fetch sheet data',
      }
    }

    const { headers, data: _contracts } = sheetResult.data

    // Store detected headers in sync config
    if (config.id) {
      await supabase
        .from('google_sheets_sync_config')
        .update({
          detected_headers: headers,
          last_sync_status: 'in_progress',
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', config.id)
    }

    // Detect manual indices for consistent sync
    const manualIndices = detectManualIndices(headers)

    // Now perform the actual sync using existing logic, passing our detected indices
    const syncResult = await syncContractsFromGoogleSheets(hospitalId, config, manualIndices)

    if (syncResult.error || !syncResult.data) {
      return {
        data: null,
        error: syncResult.error || 'Failed to sync contracts',
      }
    }

    // Return result with detected headers
    return {
      data: {
        ...syncResult.data,
        detectedHeaders: headers,
      },
      error: syncResult.error,
    }
  } catch (error) {
    console.error('Error in sync with dynamic headers:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to sync contracts',
    }
  }
}