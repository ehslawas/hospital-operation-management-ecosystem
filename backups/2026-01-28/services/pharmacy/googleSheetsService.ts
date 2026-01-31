/**
 * Google Sheets Sync Service
 * Handles synchronization of contract data from Google Sheets
 */

import { supabase } from '../supabase'
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
 */
export async function fetchGoogleSheetData(
  sheetIdOrUrl: string,
  sheetName: string = 'Sheet1',
  range?: string,
  apiKey?: string,
  accessToken?: string
): Promise<ApiResponse<any[][]>> {
  try {
    const sheetId = extractSheetId(sheetIdOrUrl)

    if (!sheetId) {
      return {
        data: null,
        error: 'Invalid Google Sheet ID or URL. Please provide either the Sheet ID or the full Google Sheets URL.',
      }
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return {
        data: null,
        error: 'Authentication required. Please log in to sync Google Sheets.',
      }
    }

    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000

    if (expiresAt < fiveMinutesFromNow) {
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.warn('Failed to refresh session:', refreshError)
      }
    }

    const { data, error: invokeError } = await supabase.functions.invoke('sync-google-sheets', {
      body: {
        sheetId,
        sheetName,
        range,
        apiKey,
        accessToken,
      },
    })

    if (invokeError) {
      console.error('Edge Function invoke error:', invokeError)
      if (invokeError.message?.includes('401') || invokeError.message?.includes('Unauthorized')) {
        return {
          data: null,
          error: 'Authentication failed. Please log out and log back in, then try again.',
        }
      }
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

    if (!data) return { data: null, error: 'No data returned from sync function' }

    if (data.error) {
      if (data.error.includes('not publicly accessible') || data.error.includes('403')) {
        return {
          data: null,
          error: 'The Google Sheet is not publicly accessible. Please either:\n1. Make the sheet publicly viewable: Go to File → Share → "Anyone with the link" → Viewer, OR\n2. Provide a Google Sheets API key in the configuration.',
        }
      }
      return { data: null, error: data.error }
    }

    if (!data.data || !Array.isArray(data.data)) {
      return { data: null, error: 'Invalid response format from Google Sheets' }
    }

    return { data: data.data, error: null }
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
  const findKeywordIdx = (keywords: string[]) => {
    const normalizedHeaders = rawHeaders.map(h =>
      h.toLowerCase().trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
    )
    const normalizedKeywords = keywords.map(k =>
      k.toLowerCase().trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
    )
    let idx = normalizedHeaders.findIndex(h => normalizedKeywords.some(k => h === k))
    if (idx === -1) {
      idx = normalizedHeaders.findIndex(h =>
        normalizedKeywords.some(k => h.includes(k) || k.includes(h))
      )
    }
    return idx
  }
  manualIndices.contractNumberIdx = findKeywordIdx(['no kontrak', 'no. kontrak', 'contract no', 'contract number', 'nombor kontrak'])
  const itemHeaders = rawHeaders.map(h => h.toLowerCase().trim())
  const itemIdx = itemHeaders.findIndex(h =>
    h === 'item' || h === 'item name' || h === 'nama item' || h === 'ppt' || h === 'nama kontrak' || h === 'butiran' || h === 'perihal' || h === 'description'
  )
  manualIndices.contractNameIdx = itemIdx
  const findSupplierIdx = () => {
    const keywords = ['pembekal', 'supplier', 'vendor', 'nama syarikat', 'company name', 'supplier name']
    const normalizedHeaders = rawHeaders.map(h => h.toLowerCase().trim())
    return normalizedHeaders.findIndex(h => {
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
  return manualIndices
}

/**
 * Parse contract data from Google Sheets rows
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
  if (!rows || rows.length === 0) return []
  let headerRowIndex = providedHeaderRowIndex
  const headerKeywords = [
    'contract', 'kontrak', 'item', 'barang', 'perkhidmatan', 'pembekal', 'no.', 'no kontrak', 'no. kontrak', 'sst', 'tempoh serahan',
    'tarikh', 'date', 'mula', 'tamat', 'status', 'supplier', 'vendor', 'harga', 'price', 'nilai', 'serahan', 'delivery'
  ]
  if (providedHeaderRowIndex === 0) {
    let bestScore = 0
    let bestRowIndex = 0
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i].map((c: any) => String(c || '').toLowerCase().trim())
      const nonEmptyCells = row.filter(c => c && c.length > 0)
      if (nonEmptyCells.length < 3) continue
      const keywordMatches = row.filter(cell => cell && headerKeywords.some(k => cell.includes(k)))
      const matchRatio = keywordMatches.length / nonEmptyCells.length
      const avgCellLength = nonEmptyCells.reduce((sum, c) => sum + c.length, 0) / nonEmptyCells.length
      const lengthPenalty = avgCellLength > 50 ? 0.5 : 1
      const score = keywordMatches.length * matchRatio * lengthPenalty
      if (keywordMatches.length >= 3 && matchRatio >= 0.25 && score > bestScore) {
        bestScore = score
        bestRowIndex = i
      }
    }
    if (bestScore > 0) headerRowIndex = bestRowIndex
  }
  const headers = rows[headerRowIndex]?.map((h: any) => String(h || '').trim().toLowerCase()) || []
  if (headers.length === 0) return []
  const findHeaderIndex = (keywords: string[]) => {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
    const normalizedHeaders = headers.map(h => normalize(h))
    const normalizedKeywords = keywords.map(k => normalize(k))
    let idx = normalizedHeaders.findIndex(h => normalizedKeywords.some(k => h === k))
    if (idx >= 0) return idx
    idx = normalizedHeaders.findIndex(h => h && normalizedKeywords.some(k => h.includes(k)))
    if (idx >= 0) return idx
    idx = normalizedHeaders.findIndex(h => h && h.length >= 3 && normalizedKeywords.some(k => k.includes(h)))
    return idx
  }
  const contractNumberIdx = manualIndices?.contractNumberIdx ?? findHeaderIndex(['no kontrak', 'no. kontrak', 'nombor kontrak', 'contract no', 'contract number', 'kontrak no', 'contract_no', 'contractno', 'contract #', 'no. contract'])
  let contractNameIdx = manualIndices?.contractNameIdx
  if (contractNameIdx === undefined || contractNameIdx === -1) {
    const itemHeaders = headers.map(h => h.toLowerCase().trim())
    contractNameIdx = itemHeaders.findIndex(h => ['item', 'item name', 'nama item', 'nama kontrak', 'butiran', 'perihal', 'description', 'nama', 'barang', 'perkhidmatan', 'service', 'product', 'produk'].includes(h))
  }
  const supplierNameIdx = manualIndices?.supplierNameIdx ?? findHeaderIndex(['pembekal', 'supplier', 'vendor', 'nama syarikat', 'company', 'syarikat', 'nama pembekal', 'supplier name', 'vendor name', 'company name'])
  const contractTypeIdx = manualIndices?.contractTypeIdx ?? findHeaderIndex(['type', 'category', 'jenis', 'kategori', 'contract type', 'jenis kontrak', 'kategori kontrak'])
  const startDateIdx = manualIndices?.startDateIdx ?? findHeaderIndex(['kontrak mula', 'tarikh mula', 'start', 'begin', 'effective', 'start date', 'tarikh kontrak mula', 'mula', 'from', 'dari'])
  const endDateIdx = manualIndices?.endDateIdx ?? findHeaderIndex(['kontrak tamat', 'tarikh tamat', 'end', 'expir', 'terminat', 'end date', 'tarikh kontrak tamat', 'tamat', 'to', 'hingga', 'until'])
  const valueIdx = manualIndices?.valueIdx ?? findHeaderIndex(['harga (rm)', 'harga', 'value', 'amount', 'price', 'nilai', 'jumlah', 'pricing', 'cost', 'kos', 'total', 'contract value', 'nilai kontrak', 'harga kontrak', 'jumlah kontrak'])
  const currencyIdx = manualIndices?.currencyIdx ?? findHeaderIndex(['currency', 'mata wang', 'curr', 'matawang'])
  const statusIdx = manualIndices?.statusIdx ?? findHeaderIndex(['status', 'keadaan', 'state', 'condition'])
  const tempohSerahanIdx = manualIndices?.tempohSerahanIdx ?? findHeaderIndex(['tempoh serahan', 'delivery period', 'serahan', 'delivery', 'masa serahan', 'delivery time'])
  const sstIdx = manualIndices?.sstIdx ?? findHeaderIndex(['sst', 'dokumen sst', 'surat sst', 'sst document', 'sst cert', 'sst certificate', 'sijil sst'])
  const periodIdx = manualIndices?.periodIdx ?? findHeaderIndex(['jangkaan kontrak', 'contract period', 'tempoh kontrak', 'duration', 'masa kontrak'])
  const contracts: ContractRow[] = []
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue
    const contract: ContractRow = {
      contract_name: contractNameIdx >= 0 && row[contractNameIdx] ? String(row[contractNameIdx]).trim() : ``,
    }
    if (!contract.contract_name || contract.contract_name.length < 2) {
      contract.contract_name = (contractNumberIdx >= 0 && row[contractNumberIdx]) ? String(row[contractNumberIdx]).trim() : `Contract ${i + 1}`
    }
    if (contractNumberIdx >= 0 && row[contractNumberIdx]) contract.contract_number = String(row[contractNumberIdx]).trim()
    if (supplierNameIdx >= 0 && row[supplierNameIdx]) contract.supplier_name = String(row[supplierNameIdx]).trim()
    if (startDateIdx === -1 && endDateIdx === -1 && periodIdx >= 0 && row[periodIdx]) {
      try {
        const parts = String(row[periodIdx]).split(/ - | to | hingga /i)
        if (parts.length === 2) { contract.start_date = parseDate(parts[0].trim()); contract.end_date = parseDate(parts[1].trim()) }
      } catch (e) { }
    }
    if (contractTypeIdx >= 0 && row[contractTypeIdx]) contract.contract_type = String(row[contractTypeIdx]).trim()
    if (startDateIdx >= 0 && row[startDateIdx]) contract.start_date = parseDate(String(row[startDateIdx]))
    if (endDateIdx >= 0 && row[endDateIdx]) contract.end_date = parseDate(String(row[endDateIdx]))
    if (valueIdx >= 0 && row[valueIdx]) {
      const valueStr = String(row[valueIdx]).replace(/[^\d.-]/g, '')
      contract.value = parseFloat(valueStr) || undefined
    }
    if (currencyIdx >= 0 && row[currencyIdx]) contract.currency = String(row[currencyIdx]).trim().toUpperCase() || 'MYR'
    if (statusIdx >= 0 && row[statusIdx]) {
      const validStatus = normalizeStatus(String(row[statusIdx]).trim())
      if (validStatus) contract.status = validStatus
    }
    if (tempohSerahanIdx >= 0 && row[tempohSerahanIdx]) contract.tempoh_serahan = String(row[tempohSerahanIdx]).trim()
    if (sstIdx >= 0 && row[sstIdx]) contract.sst = String(row[sstIdx]).trim()
    const metadata: Record<string, any> = {}
    if (contract.tempoh_serahan) metadata['tempoh serahan'] = contract.tempoh_serahan
    if (contract.sst) metadata['sst'] = contract.sst
    headers.forEach((header, idx) => {
      if (row[idx] !== undefined && row[idx] !== null && row[idx] !== '' && ![contractNumberIdx, contractNameIdx, supplierNameIdx, contractTypeIdx, startDateIdx, endDateIdx, valueIdx, currencyIdx, statusIdx, tempohSerahanIdx, sstIdx].includes(idx)) {
        metadata[header] = row[idx]
      }
    })
    contract.metadata = Object.keys(metadata).length > 0 ? metadata : undefined
    contracts.push(contract)
  }
  return contracts
}

function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
    const parts = dateStr.split(/[\/\-]/)
    if (parts.length === 3) {
      const parsed = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
    }
  } catch (e) { }
  return undefined
}

function normalizeStatus(value: string): 'active' | 'expired' | 'terminated' | 'pending' | null {
  if (!value) return null
  const normalized = value.toLowerCase().trim()
  if (['active', 'expired', 'terminated', 'pending'].includes(normalized)) return normalized as any
  if (/aktif|berkuatkuasa|dalam/i.test(normalized)) return 'active'
  if (/tamat|luput|ended/i.test(normalized)) return 'expired'
  if (/batal|ditamatkan|cancelled/i.test(normalized)) return 'terminated'
  if (/menunggu|pending|dalam proses/i.test(normalized)) return 'pending'
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
    if (config.id) {
      await supabase.from('google_sheets_sync_config').update({ last_sync_status: 'in_progress', last_sync_at: new Date().toISOString() }).eq('id', config.id)
    }
    const extractedSheetId = extractSheetId(config.sheet_id)
    if (!extractedSheetId) {
      const errorMsg = 'Invalid Google Sheet ID or URL.'
      if (config.id) await supabase.from('google_sheets_sync_config').update({ last_sync_status: 'failed', last_sync_error: errorMsg }).eq('id', config.id)
      return { data: null, error: errorMsg }
    }
    const fetchResult = await fetchGoogleSheetData(extractedSheetId, config.sheet_name || 'Sheet1', config.range, config.api_key)
    if (fetchResult.error || !fetchResult.data) {
      const errorMsg = fetchResult.error || 'Failed to fetch data'
      if (config.id) await supabase.from('google_sheets_sync_config').update({ last_sync_status: 'failed', last_sync_error: errorMsg }).eq('id', config.id)
      return { data: null, error: errorMsg }
    }
    const result: SyncResult = { success: true, rowsProcessed: 0, rowsCreated: 0, rowsUpdated: 0, rowsDeleted: 0, errors: [] }
    const contracts = parseContractRows(fetchResult.data, 0, manualIndices)
    if (contracts.length === 0) {
      const errorMsg = 'No contract data found'
      if (config.id) await supabase.from('google_sheets_sync_config').update({ last_sync_status: 'failed', last_sync_error: errorMsg }).eq('id', config.id)
      return { data: null, error: errorMsg }
    }
    result.rowsProcessed = contracts.length
    const { data: existingContracts } = await supabase.from('contracts').select('id, contract_number, sync_hash').eq('hospital_id', hospitalId)
    const existingMap = new Map((existingContracts || []).map(c => [c.contract_number || '', c]))
    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i]
      try {
        const hashData = JSON.stringify({ contract_number: contract.contract_number, contract_name: contract.contract_name, supplier_name: contract.supplier_name, start_date: contract.start_date, end_date: contract.end_date, value: contract.value })
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashData))
        const syncHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
        if (!contract.contract_name) continue
        const finalStatus = contract.status || 'active'
        const contractData: any = {
          hospital_id: hospitalId, contract_number: contract.contract_number || null, contract_name: contract.contract_name.trim(),
          supplier_name: contract.supplier_name ? contract.supplier_name.trim() : null, contract_type: contract.contract_type ? contract.contract_type.trim() : null,
          start_date: contract.start_date || null, end_date: contract.end_date || null, total_value: contract.value || null,
          currency: (contract.currency || 'MYR').trim().toUpperCase(), status: finalStatus,
          metadata: { ...contract.metadata, raw_value: contract.value, tempoh_serahan: contract.tempoh_serahan, sst: contract.sst },
          google_sheet_row_index: i + 2, last_synced_at: new Date().toISOString(), sync_hash: syncHash
        }
        if (contract.supplier_name) {
          const { data: supplier } = await supabase.from('suppliers').select('id').ilike('company_name', contract.supplier_name).limit(1).single()
          if (supplier) contractData.supplier_id = supplier.id
        }
        const existing = contract.contract_number ? existingMap.get(contract.contract_number) : null
        if (existing) {
          if (existing.sync_hash !== syncHash) {
            const { error: updateError } = await supabase.from('contracts').update({ ...contractData, updated_at: new Date().toISOString() }).eq('id', existing.id)
            if (updateError) result.errors.push(`Row ${i + 2}: ${updateError.message}`)
            else result.rowsUpdated++
          }
        } else {
          const { error: insertError } = await supabase.from('contracts').upsert(contractData, { onConflict: 'hospital_id,contract_number', ignoreDuplicates: false })
          if (insertError) result.errors.push(`Row ${i + 2}: ${insertError.message}`)
          else result.rowsCreated++
        }
      } catch (error) { result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`) }
    }
    const syncedContractNumbers = new Set(contracts.map(c => c.contract_number).filter((n): n is string => !!n))
    const contractsToMark = (existingContracts || []).filter(c => c.contract_number && !syncedContractNumbers.has(c.contract_number))
    if (contractsToMark.length > 0) {
      const { error: updateError } = await supabase.from('contracts').update({ status: 'expired', updated_at: new Date().toISOString() }).in('id', contractsToMark.map(c => c.id))
      if (!updateError) result.rowsDeleted = contractsToMark.length
    }
    if (config.id) {
      await supabase.from('google_sheets_sync_config').update({ last_sync_status: result.errors.length === 0 ? 'success' : 'failed', last_sync_error: result.errors.length > 0 ? result.errors.join('; ') : null, last_sync_at: new Date().toISOString() }).eq('id', config.id)
    }
    return { data: result, error: result.errors.length > 0 ? result.errors.join('; ') : null }
  } catch (error) {
    if (config.id) await supabase.from('google_sheets_sync_config').update({ last_sync_status: 'failed', last_sync_error: error instanceof Error ? error.message : 'Unknown' }).eq('id', config.id)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to sync' }
  }
}

export async function getSyncConfig(hospitalId: string): Promise<ApiResponse<GoogleSheetsSyncConfig>> {
  try {
    const { data, error } = await supabase.from('google_sheets_sync_config').select('*').eq('hospital_id', hospitalId).eq('sync_type', 'contracts').single()
    if (error && (error as any).code !== 'PGRST116') throw error
    return { data: data || null, error: null }
  } catch (error) { return { data: null, error: error instanceof Error ? error.message : 'Failed' } }
}

export async function saveSyncConfig(config: GoogleSheetsSyncConfig): Promise<ApiResponse<GoogleSheetsSyncConfig>> {
  try {
    if (config.id) {
      const { data, error } = await supabase.from('google_sheets_sync_config').update({ ...config, updated_at: new Date().toISOString() }).eq('id', config.id).select().single()
      if (error) throw error
      return { data, error: null }
    } else {
      const { data, error } = await supabase.from('google_sheets_sync_config').insert({ ...config, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single()
      if (error) throw error
      return { data, error: null }
    }
  } catch (error) { return { data: null, error: error instanceof Error ? error.message : 'Failed' } }
}

export async function previewSheetHeaders(sheetIdOrUrl: string, sheetName: string = 'Sheet1', range?: string, apiKey?: string): Promise<ApiResponse<{ headers: string[], headerRowIndex: number, sampleRows: any[][], totalRows: number }>> {
  try {
    const fetchResult = await fetchGoogleSheetData(sheetIdOrUrl, sheetName, range, apiKey)
    if (fetchResult.error || !fetchResult.data) return { data: null, error: fetchResult.error || 'Failed' }
    const rows = fetchResult.data
    if (!rows || rows.length === 0) return { data: null, error: 'No data' }
    let headerRowIndex = 0; let bestScore = 0
    const headerKeywords = ['contract', 'kontrak', 'item', 'pembekal', 'status', 'harga']
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const r = rows[i].map((c: any) => String(c || '').toLowerCase().trim())
      const matches = r.filter(cell => cell && headerKeywords.some(k => cell.includes(k)))
      const score = matches.length
      if (score > bestScore) { bestScore = score; headerRowIndex = i }
    }
    return { data: { headers: rows[headerRowIndex]?.map((h: any) => String(h || '').trim()) || [], headerRowIndex, sampleRows: rows.slice(headerRowIndex + 1, headerRowIndex + 6), totalRows: rows.length }, error: null }
  } catch (error) { return { data: null, error: error instanceof Error ? error.message : 'Failed' } }
}

export async function fetchSheetWithDynamicHeaders(sheetIdOrUrl: string, sheetName: string = 'Sheet1', range?: string, apiKey?: string): Promise<ApiResponse<SheetWithHeaders>> {
  try {
    const fetchResult = await fetchGoogleSheetData(sheetIdOrUrl, sheetName, range, apiKey)
    if (fetchResult.error || !fetchResult.data) return { data: null, error: fetchResult.error || 'Failed' }
    const rows = fetchResult.data
    if (!rows || rows.length === 0) return { data: null, error: 'No data' }
    let headerRowIndex = 0; let bestScore = 0
    const headerKeywords = ['contract', 'kontrak', 'item', 'pembekal', 'status', 'harga']
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const r = rows[i].map((c: any) => String(c || '').toLowerCase().trim())
      const matches = r.filter(cell => cell && headerKeywords.some(k => cell.includes(k)))
      if (matches.length > bestScore) { bestScore = matches.length; headerRowIndex = i }
    }
    const rawHeaders = rows[headerRowIndex]?.map((h: any) => String(h || '').trim()) || []
    const columnMapping: Record<string, number> = {}
    rawHeaders.forEach((h, idx) => { if (h) columnMapping[h.toLowerCase()] = idx })
    const contracts = parseContractRows(rows, headerRowIndex, detectManualIndices(rawHeaders))
    return { data: { headers: rawHeaders.filter(h => h), headerRowIndex, data: contracts, rawData: rows, columnMapping, totalRows: rows.length }, error: null }
  } catch (error) { return { data: null, error: error instanceof Error ? error.message : 'Failed' } }
}

export async function syncContractsWithDynamicHeaders(hospitalId: string, config: GoogleSheetsSyncConfig): Promise<ApiResponse<SyncResult & { detectedHeaders: string[] }>> {
  const sheetResult = await fetchSheetWithDynamicHeaders(config.sheet_id, config.sheet_name, config.range, config.api_key)
  if (sheetResult.error || !sheetResult.data) {
    if (config.id) await supabase.from('google_sheets_sync_config').update({ last_sync_status: 'failed', last_sync_error: sheetResult.error, last_sync_at: new Date().toISOString() }).eq('id', config.id)
    return { data: null, error: sheetResult.error || 'Failed' }
  }
  const syncRes = await syncContractsFromGoogleSheets(hospitalId, config, detectManualIndices(sheetResult.data.headers))
  if (syncRes.data) return { data: { ...syncRes.data, detectedHeaders: sheetResult.data.headers }, error: null }
  return { data: null, error: syncRes.error }
}