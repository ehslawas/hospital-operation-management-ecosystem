// @ts-nocheck
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
}

export interface ContractRow {
  contract_number?: string
  contract_name: string
  supplier_name?: string
  contract_type?: string
  start_date?: string
  end_date?: string
  value?: number
  unit_price?: number
  sst_rate?: string
  document_url?: string
  item_code?: string
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
 * Parse contract data from Google Sheets rows
 * Assumes first row is headers
 */
export function parseContractRows(
  data: any,
  providedHeaderRowIndex: number = 0
): ContractRow[] {
  const rows = data?.values || []
  if (!rows || rows.length <= providedHeaderRowIndex) {
    return []
  }

  // --- Pre-scan: find contract-level "Tempoh Serahan" note ---
  // KKM contract Excels often have the Tempoh Serahan as a merged-cell paragraph
  // ABOVE (or below) the item table — not as a per-row column. We scan every
  // cell in the entire sheet and capture the first one that looks like the
  // delivery-period description text.
  let contractLevelDeliveryPeriod: string | null = null
  for (let ri = 0; ri < rows.length; ri++) {
    for (let ci = 0; ci < (rows[ri] || []).length; ci++) {
      const cellRaw = String(rows[ri][ci] || '').trim()
      const cellLow = cellRaw.toLowerCase()
      // The cell either IS the label+value (long sentence) or is the label
      // with the value in the adjacent cell.
      if (cellLow.includes('tempoh serahan')) {
        if (cellRaw.length > 60) {
          // Long cell — it's both label and value (merged-cell style)
          contractLevelDeliveryPeriod = cellRaw
          break
        } else {
          // Short label cell — value is in the next column(s) of the same row
          for (let nci = ci + 1; nci < (rows[ri] || []).length; nci++) {
            const nextVal = String(rows[ri][nci] || '').trim()
            if (nextVal.length > 20) {
              contractLevelDeliveryPeriod = nextVal
              break
            }
          }
          if (!contractLevelDeliveryPeriod && ci > 0) {
            // Sometimes value is in the cell right before the label in wide merged layouts
            const prevVal = String(rows[ri][ci - 1] || '').trim()
            if (prevVal.length > 20) contractLevelDeliveryPeriod = prevVal
          }
          if (contractLevelDeliveryPeriod) break
        }
      }
    }
    if (contractLevelDeliveryPeriod) break
  }

  // Find the actual header row by scoring the first 15 rows based on keyword matches
  let headerRowIndex = providedHeaderRowIndex
  if (headerRowIndex === 0) {
    let maxMatches = -1
    const keywords = ['item', 'kontrak', 'contract', 'pembekal', 'supplier', 'harga', 'price', 'mula', 'start', 'tamat', 'end', 'sst']
    
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const rowData = rows[i].map((cell: any) => String(cell || '').toLowerCase())
      const matches = rowData.filter(cell => keywords.some(kw => cell.includes(kw))).length
      if (matches > maxMatches) {
        maxMatches = matches
        headerRowIndex = i
      }
      // If we found a very good candidate, we can stop
      if (matches >= 5) break
    }
  }

  const headers = rows[headerRowIndex].map((h: any) => String(h || '').trim().toLowerCase())

  // Find column indices - support both English and Malay headers
  const contractNumberIdx = headers.findIndex(h => 
    (h.includes('contract') && (h.includes('number') || h.includes('no') || h.includes('code'))) ||
    (h.includes('no') && h.includes('kontrak')) ||
    h === 'kkm contract no'
  )
  const contractNameIdx = headers.findIndex(h => 
    (h.includes('contract') && h.includes('name')) || 
    h.includes('item name') || 
    h === 'item' ||
    h === 'nama item' ||
    h === 'nama' ||
    h === 'title'
  )
  const supplierNameIdx = headers.findIndex(h => 
    h.includes('supplier') || h.includes('vendor') || h.includes('pembekal')
  )
  const contractTypeIdx = headers.findIndex(h => 
    h.includes('type') || h.includes('category') || h.includes('jenis') || h.includes('kategori')
  )
  const startDateIdx = headers.findIndex(h => 
    h.includes('start') || h.includes('begin') || h.includes('effective') ||
    (h.includes('kontrak') && h.includes('mula')) ||
    h.includes('tarikh mula')
  )
  const endDateIdx = headers.findIndex(h => 
    h.includes('end') || h.includes('expir') || h.includes('terminat') ||
    (h.includes('kontrak') && h.includes('tamat')) ||
    h.includes('tarikh tamat')
  )
  const valueIdx = headers.findIndex(h => 
    (h.includes('value') || h.includes('amount') || h.includes('jumlah')) && !h.includes('unit')
  )
  const currencyIdx = headers.findIndex(h => h.includes('currency') || h.includes('mata wang'))
  const statusIdx = headers.findIndex(h => h.includes('status'))
  const sstIdx = headers.findIndex(h => h.includes('sst') || h.includes('tax') || h.includes('cukai'))
  const unitPriceIdx = headers.findIndex(h => 
    (h.includes('unit') && h.includes('price')) || 
    h === 'price' || 
    h === 'harga' || 
    h.includes('harga (rm)') ||
    h.includes('harga seunit')
  )
  const itemCodeIdx = headers.findIndex(h => 
    (h.includes('item') && h.includes('code')) || 
    h.includes('kod item') ||
    h === 'kod'
  )
  // NOTE: Be specific here — 'tempoh' alone matches 'Tempoh Kontrak', 'Tarikh Mula Tempoh Kontrak', etc.
  // Only match if 'serahan' is present, or BOTH 'delivery' + 'period'/'time'/'tempoh', or exact known headers.
  const deliveryPeriodIdx = headers.findIndex(h =>
    h.includes('serahan') ||
    h === 'delivery period' ||
    h === 'tempoh serahan' ||
    (h.includes('delivery') && (h.includes('period') || h.includes('time') || h.includes('tempoh'))) ||
    (h.includes('lead') && h.includes('time'))
  )

  const normalizedRows: any[][] = []
  const numberToNameMap = new Map<string, string>()

  // Pass 1: Normalization and Name Discovery
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    let row = [...rows[i]]
    if (!row || row.length === 0) continue

    // Normalize shifted rows (split regional names)
    if (contractNumberIdx >= 0 && row[contractNumberIdx]) {
      const val = String(row[contractNumberIdx]).trim().toLowerCase()
      if (val.includes('sabah') || val.includes('sarawak') || val.includes('labuan')) {
        row[contractNameIdx] = `${String(row[contractNameIdx] || '').trim()} ${String(row[contractNumberIdx]).trim()}`
        for (let j = contractNumberIdx; j < row.length - 1; j++) {
          row[j] = row[j + 1]
        }
        row[row.length - 1] = ''
      }
    }
    
    normalizedRows.push(row)

    // Map contract numbers to names
    const name = contractNameIdx >= 0 ? String(row[contractNameIdx] || '').trim() : ''
    const num = contractNumberIdx >= 0 ? String(row[contractNumberIdx] || '').trim() : ''
    const isNote = name.startsWith('(') || name.toLowerCase().includes('sabah') || name.toLowerCase().includes('sarawak')
    
    if (num && name && !isNote && !name.startsWith('KKM-')) {
      numberToNameMap.set(num, name)
    }
  }

  const contracts: ContractRow[] = []
  let lastValidName = ''

  // Pass 2: Final Mapping
  for (let i = 0; i < normalizedRows.length; i++) {
    const row = normalizedRows[i]
    const contract: ContractRow = {
      contract_name: '',
      status: 'active',
      metadata: { raw_row: row }
    }

    if (contractNameIdx >= 0 && row[contractNameIdx]) {
      contract.contract_name = String(row[contractNameIdx]).trim().replace(/^[,"\s]+/, '').trim()
    }

    if (contractNumberIdx >= 0 && row[contractNumberIdx]) {
      contract.contract_number = String(row[contractNumberIdx]).trim()
    }
    
    // Fix KKM number accidentally put in name column
    if (contract.contract_name.startsWith('KKM-') && !contract.contract_number) {
      contract.contract_number = contract.contract_name
      contract.contract_name = '' 
    }

    const isRegionalNote = contract.contract_name.startsWith('(') || 
                          contract.contract_name.toLowerCase().includes('sabah') || 
                          contract.contract_name.toLowerCase().includes('sarawak')

    // Inheritance logic
    if (!contract.contract_name && contract.contract_number && numberToNameMap.has(contract.contract_number)) {
      contract.contract_name = numberToNameMap.get(contract.contract_number)!
    }

    if (isRegionalNote) {
      const baseName = (contract.contract_number && numberToNameMap.get(contract.contract_number)) || lastValidName
      if (baseName && !contract.contract_name.includes(baseName)) {
        contract.contract_name = `${baseName} ${contract.contract_name}`
      }
    }

    if (contract.contract_name && !isRegionalNote && !contract.contract_name.startsWith('KKM-')) {
      lastValidName = contract.contract_name
    }

    // Map known columns
    if (supplierNameIdx >= 0 && row[supplierNameIdx]) {
      contract.supplier_name = String(row[supplierNameIdx]).trim()
    }
    if (contractTypeIdx >= 0 && row[contractTypeIdx]) {
      contract.contract_type = String(row[contractTypeIdx]).trim()
    }
    if (startDateIdx >= 0 && row[startDateIdx]) {
      contract.start_date = parseDate(String(row[startDateIdx]))
    }
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
    if (statusIdx >= 0 && row[statusIdx]) {
      contract.status = String(row[statusIdx]).trim().toLowerCase()
    }
    if (sstIdx >= 0 && row[sstIdx]) {
      const sstValue = String(row[sstIdx]).trim()
      if (
        sstValue.startsWith('http') || 
        sstValue.includes('drive.google.com') || 
        sstValue.toLowerCase().endsWith('.pdf') ||
        (sstValue.toLowerCase().includes('sst') && sstValue.toLowerCase().includes('.pdf'))
      ) {
        contract.document_url = sstValue
      } else {
        const rateMatch = sstValue.match(/(\d+(\.\d+)?)/)
        contract.sst_rate = rateMatch ? rateMatch[1] : sstValue
      }
    }
    if (unitPriceIdx >= 0 && row[unitPriceIdx]) {
      const priceStr = String(row[unitPriceIdx]).replace(/[^\d.-]/g, '')
      contract.unit_price = parseFloat(priceStr) || undefined
    }
    if (itemCodeIdx >= 0 && row[itemCodeIdx]) {
      contract.item_code = String(row[itemCodeIdx]).trim()
    }
    if (deliveryPeriodIdx >= 0 && row[deliveryPeriodIdx]) {
      contract.delivery_period = String(row[deliveryPeriodIdx]).trim()
    }
    // Apply contract-level delivery period (from merged-cell note section) to rows
    // that didn't get one from the column scan above.
    if (!contract.delivery_period && contractLevelDeliveryPeriod) {
      contract.delivery_period = contractLevelDeliveryPeriod
    }

    // Store all other columns in metadata
    const extraMetadata: Record<string, any> = {}
    headers.forEach((header, idx) => {
      if (row[idx] !== undefined && row[idx] !== null && row[idx] !== '') {
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
          idx !== sstIdx &&
          idx !== unitPriceIdx &&
          idx !== itemCodeIdx &&
          idx !== deliveryPeriodIdx
        ) {
          extraMetadata[header] = row[idx]
        }
      }
    })
    contract.metadata = { ...contract.metadata, ...extraMetadata }

    if (contract.contract_name === '' && !contract.contract_number) continue
    
    // Skip rows that have no contract number AND no price - these are usually just headers or placeholders
    if (!contract.contract_number && !contract.unit_price) continue

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
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
    
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
 * Sync contracts from Google Sheets to database
 */
export async function syncContractsFromGoogleSheets(
  hospitalId: string,
  config: GoogleSheetsSyncConfig
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

    // Parse contract rows
    const contracts = parseContractRows(fetchResult.data)

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
    const result: SyncResult = {
      success: true,
      rowsProcessed: contracts.length,
      rowsCreated: 0,
      rowsUpdated: 0,
      rowsDeleted: 0,
      errors: [],
    }

    // Get existing contracts for this hospital
    const { data: existingContracts } = await supabase
      .from('contracts_view')
      .select('id, contract_number, contract_name, sync_hash')
      .eq('hospital_id', hospitalId)

    // Get all suppliers for this hospital once to avoid query inside loop and enable fuzzy lookup
    const { data: allSuppliers } = await supabase
      .from('suppliers')
      .select('id, company_name')
      .eq('hospital_id', hospitalId)

    const cleanName = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // remove all non-alphanumeric
        .replace(/sdnbhd/g, '')     // remove sdn bhd
        .replace(/sdn/g, '')        // remove sdn
        .replace(/bhd/g, '')        // remove bhd
        .trim();
    };

    const supplierCache = new Map<string, string>(); // cleaned_name -> supplier_id
    if (allSuppliers) {
      allSuppliers.forEach(s => {
        if (s.company_name) {
          const key = cleanName(s.company_name);
          if (key) {
            supplierCache.set(key, s.id);
          }
        }
      });
    }

    const contractKeyMap = new Map<string, any>()
    const numberMap = new Map<string, any>()
    const nameMap = new Map<string, any>()

    ;(existingContracts || []).forEach(c => {
      if (c.contract_number && c.contract_name) {
        const key = `${c.contract_number.toUpperCase().trim()}_${c.contract_name.toLowerCase().trim()}`
        contractKeyMap.set(key, c)
      }
      if (c.contract_number) {
        numberMap.set(c.contract_number, c)
      }
      if (c.contract_name) {
        nameMap.set(c.contract_name.toLowerCase().trim(), c)
      }
    })

    // Process each contract
    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i]
      try {
        // Create sync hash
        const hashData = JSON.stringify({
          n: contract.contract_name,
          num: contract.contract_number,
          s: contract.supplier_name,
          p: contract.unit_price,
          sd: contract.start_date,
          ed: contract.end_date,
          u: contract.currency,
          v: 9 // Sync hash version
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
          value: contract.value || null,
          unit_price: contract.unit_price || null,
          sst_rate: contract.sst_rate || null,
          item_code: contract.item_code || null,
          delivery_period: contract.delivery_period || null,
          currency: (contract.currency || 'MYR').trim().toUpperCase(),
          status: finalStatus, // Always guaranteed to be exactly 'active', 'expired', 'terminated', or 'pending'
          metadata: contract.metadata || null,
          google_sheet_row_index: i + 2, // +2 because row 1 is header, row 2 is first data
          last_synced_at: new Date().toISOString(),
          sync_hash: syncHash,
        }

        // Try to find supplier by name (with cached fuzzy/substring matching)
        if (contract.supplier_name) {
          const cleanedContractSupplier = cleanName(contract.supplier_name);
          let matchedSupplierId = supplierCache.get(cleanedContractSupplier);
          
          if (!matchedSupplierId && allSuppliers) {
            const found = allSuppliers.find(s => {
              if (!s.company_name) return false;
              const cleanS = cleanName(s.company_name);
              return cleanS.includes(cleanedContractSupplier) || cleanedContractSupplier.includes(cleanS);
            });
            if (found) {
              matchedSupplierId = found.id;
            }
          }

          if (matchedSupplierId) {
            contractData.supplier_id = matchedSupplierId;
          } else {
            const { data: supplier } = await supabase
              .from('suppliers')
              .select('id')
              .ilike('company_name', contract.supplier_name.trim())
              .limit(1)
              .maybeSingle()

            if (supplier) {
              contractData.supplier_id = supplier.id
            }
          }
        }

        let existing = null
        if (contract.contract_number && contract.contract_name) {
          const key = `${contract.contract_number.toUpperCase().trim()}_${contract.contract_name.toLowerCase().trim()}`
          existing = contractKeyMap.get(key)
        }
        
        if (!existing && contract.contract_number) {
          existing = numberMap.get(contract.contract_number)
        }
        
        // Fallback to name-based matching if no number match or no number provided
        if (!existing && contract.contract_name) {
          existing = nameMap.get(contract.contract_name.toLowerCase().trim())
        }

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
          // Create new contract
          // Final safety check - ensure status is valid before insert
          if (!validStatuses.includes(contractData.status as any)) {
            console.error(`Row ${i + 2}: Status validation failed! Status value: "${contractData.status}", type: ${typeof contractData.status}`)
            contractData.status = 'active' // Force to valid value
          }

          const { error: insertError } = await supabase
            .from('contracts')
            .insert(contractData)

          if (insertError) {
            const errorDetails = insertError.details || insertError.hint || ''
            const errorMsg = `Failed to create contract "${contract.contract_number || contract.contract_name}": ${insertError.message}${errorDetails ? ` (${errorDetails})` : ''}`
            console.error('Insert error:', insertError, 'Contract data:', JSON.stringify(contractData, null, 2))
            result.errors.push(errorMsg)
          } else {
            result.rowsCreated++
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
      .maybeSingle()

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
        .maybeSingle()

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
        .maybeSingle()

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

