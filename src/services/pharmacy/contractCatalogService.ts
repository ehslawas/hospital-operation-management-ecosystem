/**
 * Contract Catalog Service
 * Handles CRUD operations and batch import for Contract Catalog
 * Similar to Drug and Non-Drug catalog services
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse } from '@/types'
import type { Contract, ContractWithRelations, ContractCatalogKPIs, ContractCatalogFilter } from '@/types/pharmacy'

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all contracts for a hospital with optional filters
 */
export async function getContracts(
  hospitalId: string,
  filter?: ContractCatalogFilter
): Promise<ApiResponse<ContractWithRelations[]>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local development fallback
      const localData = localStorage.getItem(`contracts_${hospitalId}`)
      const contracts: ContractWithRelations[] = localData ? JSON.parse(localData) : []

      let filtered = contracts

      if (filter?.search) {
        const searchLower = filter.search.toLowerCase()
        filtered = filtered.filter(
          c =>
            c.item_name?.toLowerCase().includes(searchLower) ||
            c.contract_number?.toLowerCase().includes(searchLower) ||
            c.supplier_name?.toLowerCase().includes(searchLower)
        )
      }

      if (filter?.status && filter.status !== 'all') {
        filtered = filtered.filter(c => c.status === filter.status)
      }

      if (filter?.supplier_name) {
        filtered = filtered.filter(c => c.supplier_name === filter.supplier_name)
      }

      return { data: filtered, error: null }
    }

    // Build Supabase query
    // Note: Simplified select to avoid relationship errors
    // uploaded_file join removed as it's optional and may not have FK relationship yet
    let query = supabase
      .from('contracts')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filter?.search) {
      query = query.or(
        `item_name.ilike.%${filter.search}%,contract_number.ilike.%${filter.search}%,supplier_name.ilike.%${filter.search}%`
      )
    }

    // Handle status filter - special case for "expiring_soon" which is date-based, not status-based
    if (filter?.status && filter.status !== 'all') {
      if (filter.status === 'expiring_soon') {
        // Filter for contracts expiring within 60 days (active contracts with end_date in next 60 days)
        const now = new Date()
        const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
        query = query
          .eq('status', 'active')
          .gte('end_date', now.toISOString().split('T')[0])
          .lte('end_date', sixtyDaysFromNow.toISOString().split('T')[0])
      } else {
        query = query.eq('status', filter.status)
      }
    }

    if (filter?.supplier_id) {
      query = query.eq('supplier_id', filter.supplier_id)
    }

    if (filter?.date_from) {
      query = query.gte('start_date', filter.date_from)
    }

    if (filter?.date_to) {
      query = query.lte('end_date', filter.date_to)
    }

    if (filter?.min_price) {
      query = query.gte('unit_price', filter.min_price)
    }

    if (filter?.max_price) {
      query = query.lte('unit_price', filter.max_price)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching contracts:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ContractWithRelations[], error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch contracts'
    console.error('Exception in getContracts:', error)
    return { data: null, error: message }
  }
}

/**
 * Get a single contract by ID
 */
export async function getContractById(
  contractId: string
): Promise<ApiResponse<ContractWithRelations>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local development fallback
      const allHospitals = Object.keys(localStorage)
        .filter(key => key.startsWith('contracts_'))
        .map(key => localStorage.getItem(key))
        .filter(Boolean)

      for (const data of allHospitals) {
        const contracts: ContractWithRelations[] = JSON.parse(data!)
        const contract = contracts.find(c => c.id === contractId)
        if (contract) {
          return { data: contract, error: null }
        }
      }

      return { data: null, error: 'Contract not found' }
    }

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (error) {
      console.error('Error fetching contract:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ContractWithRelations, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch contract'
    console.error('Exception in getContractById:', error)
    return { data: null, error: message }
  }
}

/**
 * Create a new contract
 */
export async function createContract(
  hospitalId: string,
  contractData: Partial<Contract>
): Promise<ApiResponse<Contract>> {
  try {
    const newContract: Partial<Contract> = {
      ...contractData,
      hospital_id: hospitalId,
      status: contractData.status || 'active',
      currency: contractData.currency || 'MYR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (!isSupabaseConfigured()) {
      // Local development fallback
      const localData = localStorage.getItem(`contracts_${hospitalId}`)
      const contracts: Contract[] = localData ? JSON.parse(localData) : []
      const contract: Contract = {
        ...newContract,
        id: `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      } as Contract
      contracts.push(contract)
      localStorage.setItem(`contracts_${hospitalId}`, JSON.stringify(contracts))
      return { data: contract, error: null }
    }

    const { data, error } = await supabase
      .from('contracts')
      .insert(newContract)
      .select()
      .single()

    if (error) {
      console.error('Error creating contract:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Contract, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create contract'
    console.error('Exception in createContract:', error)
    return { data: null, error: message }
  }
}

/**
 * Update an existing contract
 */
export async function updateContract(
  contractId: string,
  contractData: Partial<Contract>
): Promise<ApiResponse<Contract>> {
  try {
    const updates = {
      ...contractData,
      updated_at: new Date().toISOString(),
    }

    if (!isSupabaseConfigured()) {
      // Local development fallback
      const allHospitals = Object.keys(localStorage).filter(key => key.startsWith('contracts_'))

      for (const key of allHospitals) {
        const data = localStorage.getItem(key)
        if (data) {
          const contracts: Contract[] = JSON.parse(data)
          const index = contracts.findIndex(c => c.id === contractId)
          if (index !== -1) {
            contracts[index] = { ...contracts[index], ...updates }
            localStorage.setItem(key, JSON.stringify(contracts))
            return { data: contracts[index], error: null }
          }
        }
      }

      return { data: null, error: 'Contract not found' }
    }

    const { data, error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', contractId)
      .select()
      .single()

    if (error) {
      console.error('Error updating contract:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Contract, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update contract'
    console.error('Exception in updateContract:', error)
    return { data: null, error: message }
  }
}

/**
 * Delete a contract
 */
export async function deleteContract(contractId: string): Promise<ApiResponse<void>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local development fallback
      const allHospitals = Object.keys(localStorage).filter(key => key.startsWith('contracts_'))

      for (const key of allHospitals) {
        const data = localStorage.getItem(key)
        if (data) {
          const contracts: Contract[] = JSON.parse(data)
          const filtered = contracts.filter(c => c.id !== contractId)
          if (filtered.length < contracts.length) {
            localStorage.setItem(key, JSON.stringify(filtered))
            return { data: null, error: null }
          }
        }
      }

      return { data: null, error: 'Contract not found' }
    }

    const { error } = await supabase.from('contracts').delete().eq('id', contractId)

    if (error) {
      console.error('Error deleting contract:', error)
      return { data: null, error: error.message }
    }

    return { data: null, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete contract'
    console.error('Exception in deleteContract:', error)
    return { data: null, error: message }
  }
}

/**
 * Delete all contracts for a hospital (used when replacing with new import)
 */
export async function deleteAllContracts(hospitalId: string): Promise<ApiResponse<{ deleted: number }>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local development fallback
      localStorage.removeItem(`contracts_${hospitalId}`)
      return { data: { deleted: 0 }, error: null }
    }

    // First, count existing contracts
    const { data: existing, error: countError } = await supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)

    if (countError) {
      console.error('Error counting contracts:', countError)
      return { data: null, error: countError.message }
    }

    // Delete all contracts for this hospital
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('hospital_id', hospitalId)

    if (error) {
      console.error('Error deleting all contracts:', error)
      return { data: null, error: error.message }
    }

    return { data: { deleted: existing?.length || 0 }, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete all contracts'
    console.error('Exception in deleteAllContracts:', error)
    return { data: null, error: message }
  }
}

// =====================================================
// KPI / STATISTICS
// =====================================================

/**
 * Get contract catalog KPIs
 */
export async function getContractKPIs(
  hospitalId: string
): Promise<ApiResponse<ContractCatalogKPIs>> {
  try {
    const { data: contracts, error } = await getContracts(hospitalId)

    if (error || !contracts) {
      return {
        data: {
          total: 0,
          active: 0,
          expired: 0,
          expiring_soon: 0,
          pending: 0,
          total_value: 0,
          contracts_by_supplier: [],
        },
        error: error,
      }
    }

    const now = new Date()
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

    const kpis: ContractCatalogKPIs = {
      total: contracts.length,
      active: contracts.filter(c => c.status === 'active').length,
      expired: contracts.filter(c => c.status === 'expired').length,
      expiring_soon: contracts.filter(c => {
        if (!c.end_date) return false
        const endDate = new Date(c.end_date)
        return endDate >= now && endDate <= sixtyDaysFromNow
      }).length,
      pending: contracts.filter(c => c.status === 'pending').length,
      total_value: contracts.reduce((sum, c) => sum + (c.unit_price || 0), 0),
      contracts_by_supplier: [],
    }

    // Group by supplier
    const supplierMap = new Map<string, number>()
    contracts.forEach(contract => {
      const supplier = contract.supplier_name || 'Unknown'
      supplierMap.set(supplier, (supplierMap.get(supplier) || 0) + 1)
    })

    kpis.contracts_by_supplier = Array.from(supplierMap.entries())
      .map(([supplier_name, count]) => ({ supplier_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 suppliers

    return { data: kpis, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to calculate KPIs'
    console.error('Exception in getContractKPIs:', error)
    return { data: null, error: message }
  }
}

// =====================================================
// LOOKUP HELPERS (FUZZY MATCHING)
// =====================================================

/**
 * Normalizes string for fuzzy matching
 * 1. Lowercase
 * 2. Spaces out numbers and letters (5mg -> 5 mg)
 * 3. Removes special chars
 * 4. Collapses whitespace
 */
export function normalizeForMatch(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    // Insert space between number and letter (e.g. "5mg" -> "5 mg")
    .replace(/(\d+)([a-z]+)/g, '$1 $2')
    // Insert space between letter and number (e.g. "n95" -> "n 95")
    .replace(/([a-z]+)(\d+)/g, '$1 $2')
    // Remove special characters
    .replace(/[^a-z0-9\s]/g, ' ')
    // Collapse spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculates match score between two strings (0-1)
 * Uses Token Intersection / Dice Coefficient
 */
export function calculateMatchScore(str1: string, str2: string): number {
  const norm1 = normalizeForMatch(str1)
  const norm2 = normalizeForMatch(str2)

  if (norm1 === norm2) return 1

  const tokens1 = new Set(norm1.split(' '))
  const tokens2 = new Set(norm2.split(' '))

  // Intersection
  let matchCount = 0
  tokens1.forEach(t => {
    if (tokens2.has(t)) matchCount++
  })

  // Dice Coefficient: 2 * intersection / (len1 + len2)
  return (2 * matchCount) / (tokens1.size + tokens2.size)
}

/**
 * Find a contract by drug name (fuzzy match)
 */
export async function findContractByDrugName(
  hospitalId: string,
  drugName: string
): Promise<ApiResponse<ContractWithRelations | null>> {
  try {
    if (!drugName) return { data: null, error: null }

    // Strategy: Broad search then refined filter
    // Search using the first significant word (len > 2)
    const tokens = drugName.split(/[\s\-\(\)\.]+/).filter(t => t.length > 2)
    const broadSearchTerm = tokens.length > 0 ? tokens[0] : drugName.split(' ')[0]

    // Fallback if no term
    if (!broadSearchTerm) return { data: null, error: null }

    if (!isSupabaseConfigured()) {
      const localData = localStorage.getItem(`contracts_${hospitalId}`)
      const contracts: ContractWithRelations[] = localData ? JSON.parse(localData) : []

      const candidates = contracts.filter(c => c.status === 'active')
      if (candidates.length === 0) return { data: null, error: null }

      let bestMatch: ContractWithRelations | null = null
      let bestScore = 0

      for (const contract of candidates) {
        const score = calculateMatchScore(drugName, contract.item_name)
        if (score > bestScore && score > 0.4) {
          bestScore = score
          bestMatch = contract
        }
      }
      return { data: bestMatch, error: null }
    }

    // Supabase DB Search
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('status', 'active')
      .ilike('item_name', `%${broadSearchTerm}%`)
      .limit(20)

    if (error) throw error
    if (!data || data.length === 0) return { data: null, error: null }

    let bestMatch: ContractWithRelations | null = null
    let bestScore = 0

    // Refine matches in memory
    for (const contract of data as ContractWithRelations[]) {
      const score = calculateMatchScore(drugName, contract.item_name)
      if (score > bestScore && score > 0.4) {
        bestScore = score
        bestMatch = contract
      }
    }

    return { data: bestMatch, error: null }
  } catch (error) {
    console.error('Error finding contract by name:', error)
    return { data: null, error: null }
  }
}

/**
 * Find drug/item details by contract number
 */
export async function findContractByNumber(
  hospitalId: string,
  contractNumber: string
): Promise<ApiResponse<ContractWithRelations | null>> {
  try {
    if (!contractNumber) return { data: null, error: null }

    const normalizedNumber = contractNumber.toUpperCase().trim()

    if (!isSupabaseConfigured()) {
      const localData = localStorage.getItem(`contracts_${hospitalId}`)
      const contracts: ContractWithRelations[] = localData ? JSON.parse(localData) : []
      const match = contracts.find(c =>
        (c.contract_number || '').toUpperCase().trim() === normalizedNumber
      )
      return { data: match || null, error: null }
    }

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('hospital_id', hospitalId)
      .ilike('contract_number', normalizedNumber) // Case insensitive check
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return { data: data as ContractWithRelations, error: null }
  } catch (error) {
    console.error('Error finding contract by number:', error)
    return { data: null, error: null }
  }
}

// =====================================================
// BATCH IMPORT
// =====================================================

/**
 * Batch import contracts from Excel data
 * With validation, duplicate detection, and progress reporting
 */
export async function batchImportContracts(
  hospitalId: string,
  contracts: Partial<Contract>[],
  onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void,
  replaceExisting: boolean = false
): Promise<ApiResponse<{ success: number; errors: string[]; replaced: boolean }>> {
  try {
    const supabaseConfigured = isSupabaseConfigured()
    console.log('='.repeat(60))
    console.log('[batchImportContracts] DIAGNOSTICS:')
    console.log('[batchImportContracts] Supabase configured:', supabaseConfigured)
    console.log('[batchImportContracts] Hospital ID:', hospitalId)
    console.log('[batchImportContracts] Total items to import:', contracts.length)
    console.log('[batchImportContracts] Replace existing:', replaceExisting)
    console.log('='.repeat(60))

    // If replaceExisting is true, delete all existing contracts first
    if (replaceExisting) {
      console.log('[batchImportContracts] Clearing existing contracts...')
      const deleteResult = await deleteAllContracts(hospitalId)
      if (deleteResult.error) {
        return { data: null, error: `Failed to clear existing contracts: ${deleteResult.error}` }
      }
      console.log('[batchImportContracts] Cleared', deleteResult.data?.deleted || 0, 'existing contracts')
    }

    const errors: string[] = []
    let successCount = 0

    // Filter out invalid entries
    const validContracts = contracts.filter(
      (item, index) => item != null && typeof item === 'object' && Object.keys(item).length > 0
    )
    console.log('[batchImportContracts] Valid items after filtering:', validContracts.length)

    // Track duplicates
    const seenContractNumbers = new Set<string>()

    // Invalid values to filter out
    const invalidContractNumbers = [
      'CONTRACT',
      'NO KONTRAK',
      'CONTRACT_NUMBER',
      'CONTRACT NUMBER',
      'ITEM CODE',
      'SAMPLE',
      'TEST',
      'EXAMPLE',
      'DEMO',
    ]

    const invalidItemNames = [
      'item',
      'item name',
      'product',
      'contract',
      'sample',
      'test',
      'example',
    ]

    const totalItems = validContracts.length
    if (onProgress) {
      onProgress({
        processed: 0,
        total: totalItems,
        success: 0,
        failed: 0,
      })
    }

    // Preload existing contracts to avoid duplicates
    let existingByNumber: Map<string, { id: string }> | null = null
    if (supabaseConfigured && totalItems > 0) {
      const { data: existing } = await supabase
        .from('contracts')
        .select('id, contract_number')
        .eq('hospital_id', hospitalId)

      if (existing) {
        existingByNumber = new Map(
          existing.map(c => [c.contract_number?.trim().toUpperCase() || '', { id: c.id }])
        )
        console.log('[batchImportContracts] Preloaded existing contracts:', existingByNumber.size)
      }
    }

    // Track contracts processed in this batch (to prevent duplicates within the same import)
    const processedInBatch = new Set<string>()

    // Process each contract
    for (let i = 0; i < validContracts.length; i++) {
      const contractData = validContracts[i]

      // Validate required fields
      if (!contractData.item_name || !contractData.contract_number) {
        errors.push(`Row ${i + 2}: Missing required fields (Item Name or Contract Number)`)
        continue
      }

      // Validate contract number
      const contractNumber = String(contractData.contract_number).trim().toUpperCase()
      const itemName = String(contractData.item_name).trim().toLowerCase()

      // CRITICAL VALIDATION: Check if item_name looks like a date (column misalignment)
      // If item_name contains a date pattern, reject this row as misaligned
      const itemNameStr = String(contractData.item_name || '').trim()
      if (itemNameStr.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/) || // DD-MM-YYYY or DD/MM/YYYY
        itemNameStr.match(/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/i) || // DD Mon YYYY
        itemNameStr.match(/^\d{1,2}-[A-Za-z]{3}-\d{4}$/i)) { // DD-Mon-YYYY
        errors.push(
          `Row ${i + 2}: Data misalignment detected - "Drug Name" contains a date "${itemNameStr}". Please check your Excel file column alignment.`
        )
        continue // Skip misaligned rows
      }

      // Check if item_name looks like a contract number/code (column misalignment)
      if (itemNameStr.match(/^[A-Z0-9]{10,}$/)) { // Long alphanumeric code (like H01AB01000P3002)
        errors.push(
          `Row ${i + 2}: Data misalignment detected - "Drug Name" contains a code "${itemNameStr}". Please check your Excel file column alignment.`
        )
        continue // Skip misaligned rows
      }

      // Check for invalid contract numbers
      if (invalidContractNumbers.includes(contractNumber)) {
        errors.push(
          `Row ${i + 2}: Invalid contract number "${contractData.contract_number}" (appears to be a header or label)`
        )
        continue
      }

      // Check for duplicates in current upload - skip duplicates within the same batch
      // If we've already processed this contract number in this batch, skip it
      // (we'll process only the first occurrence)
      if (processedInBatch.has(contractNumber)) {
        continue // Skip duplicate in same batch
      }

      // Mark as seen and processed
      seenContractNumbers.add(contractNumber)
      processedInBatch.add(contractNumber)

      // Check for invalid item names
      if (invalidItemNames.includes(itemName)) {
        errors.push(
          `Row ${i + 2}: Invalid item name "${contractData.item_name}" (appears to be generic text or header)`
        )
        continue
      }

      // Validate contract number format (at least 3 characters)
      if (contractNumber.length < 3) {
        errors.push(
          `Row ${i + 2}: Contract number "${contractData.contract_number}" is too short (minimum 3 characters)`
        )
        continue
      }

      // Helper function to parse various date formats (DD-Mon-YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)
      const parseContractDate = (dateValue: any): string | null => {
        if (!dateValue) return null

        const dateStr = String(dateValue).trim()

        // Handle Excel date numbers (Excel stores dates as numbers)
        if (!isNaN(Number(dateStr)) && Number(dateStr) > 25569) {
          // Excel date (days since Jan 1, 1900)
          const excelDate = new Date((Number(dateStr) - 25569) * 86400 * 1000)
          if (!isNaN(excelDate.getTime())) {
            return excelDate.toISOString().split('T')[0]
          }
        }

        // Try parsing common date formats
        const dateFormats = [
          // DD-Mon-YYYY (e.g., "2-Sep-2025", "24-Oct-2025")
          /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/,
          // DD Mon YYYY (e.g., "2 Sep 2025")
          /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/,
          // DD/MM/YYYY
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
          // YYYY-MM-DD
          /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
          // DD.MM.YYYY
          /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
        ]

        const monthNames: Record<string, number> = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
          januari: 0, februari: 1, mac: 2, april: 3, mei: 4, jun: 5,
          julai: 6, ogos: 7, september: 8, oktober: 9, november: 10, disember: 11
        }

        for (const format of dateFormats) {
          const match = dateStr.match(format)
          if (match) {
            try {
              let day: number, month: number, year: number

              if (format.source.includes('[A-Za-z]')) {
                // DD-Mon-YYYY or DD Mon YYYY format
                day = parseInt(match[1], 10)
                const monthName = match[2].toLowerCase().substring(0, 3)
                month = monthNames[monthName] ?? -1
                year = parseInt(match[3], 10)
              } else if (format.source.includes('(\\d{4})') && match[3].length === 4) {
                // DD/MM/YYYY or DD.MM.YYYY format
                day = parseInt(match[1], 10)
                month = parseInt(match[2], 10) - 1
                year = parseInt(match[3], 10)
              } else {
                // YYYY-MM-DD format
                year = parseInt(match[1], 10)
                month = parseInt(match[2], 10) - 1
                day = parseInt(match[3], 10)
              }

              if (month >= 0 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
                const date = new Date(year, month, day)
                if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                  return date.toISOString().split('T')[0]
                }
              }
            } catch (e) {
              // Continue to next format
            }
          }
        }

        // Fallback: try standard Date parsing
        try {
          const parsed = new Date(dateStr)
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0]
          }
        } catch {
          // Return null if all parsing attempts fail
        }

        return null
      }

      // Validate dates
      let startDate: string | undefined
      let endDate: string | undefined

      if (contractData.start_date) {
        const parsed = parseContractDate(contractData.start_date)
        if (parsed) {
          startDate = parsed
        } else {
          errors.push(`Row ${i + 2}: Invalid start date format "${contractData.start_date}". Expected format: DD-Mon-YYYY (e.g., 2-Sep-2025)`)
          // Don't continue - allow the row to be imported with invalid date
          startDate = undefined
        }
      }

      if (contractData.end_date) {
        const parsed = parseContractDate(contractData.end_date)
        if (parsed) {
          endDate = parsed
        } else {
          errors.push(`Row ${i + 2}: Invalid end date format "${contractData.end_date}". Expected format: DD-Mon-YYYY (e.g., 1-Sep-2028)`)
          // Don't continue - allow the row to be imported with invalid date
          endDate = undefined
        }
      }

      // Validate end_date > start_date
      if (startDate && endDate && endDate < startDate) {
        errors.push(`Row ${i + 2}: End date must be after start date`)
        continue
      }

      // Determine status based on dates
      // Valid status values per database constraint: 'active', 'expired', 'terminated', 'pending'
      let status: 'active' | 'expired' | 'terminated' | 'pending' = 'active'

      // Normalize incoming status value to match database constraint
      if (contractData.status) {
        const normalizedStatus = String(contractData.status).trim().toLowerCase()
        if (['active', 'expired', 'terminated', 'pending'].includes(normalizedStatus)) {
          status = normalizedStatus as 'active' | 'expired' | 'terminated' | 'pending'
        } else {
          // Map invalid status values to valid ones
          if (['expiring', 'expiring_soon'].includes(normalizedStatus)) {
            status = 'active' // Contracts expiring soon are still active
          } else if (['inactive', 'cancelled', 'canceled'].includes(normalizedStatus)) {
            status = 'terminated' // Map inactive/cancelled to terminated
          }
          // Otherwise, keep default 'active'
        }
      }

      // Auto-determine status based on dates (only if status wasn't explicitly set)
      if (endDate && (!contractData.status || !['active', 'expired', 'terminated', 'pending'].includes(String(contractData.status).trim().toLowerCase()))) {
        const now = new Date()
        const end = new Date(endDate)
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        if (end < now) {
          status = 'expired'
        } else {
          // Contracts expiring soon are still 'active' (not 'expiring' which doesn't exist in constraint)
          status = 'active'
        }
      }
      if (startDate && new Date(startDate) > new Date() && (!contractData.status || !['active', 'expired', 'terminated', 'pending'].includes(String(contractData.status).trim().toLowerCase()))) {
        status = 'pending'
      }

      // Prepare contract data
      const newContract: Partial<Contract> = {
        hospital_id: hospitalId,
        item_name: contractData.item_name,
        item_code: contractData.item_code,
        contract_number: contractData.contract_number,
        contract_type: contractData.contract_type,
        supplier_id: contractData.supplier_id,
        supplier_name: contractData.supplier_name,
        start_date: startDate,
        end_date: endDate,
        unit: contractData.unit,
        unit_price: contractData.unit_price
          ? (() => {
            // Handle price with "RM" prefix or commas (e.g., "RM 107.40" or "1,107.40")
            const priceStr = String(contractData.unit_price).trim().replace(/^RM\s*/i, '').replace(/,/g, '')
            const price = parseFloat(priceStr)
            return isNaN(price) ? undefined : price
          })()
          : undefined,
        currency: contractData.currency || 'MYR',
        delivery_period: contractData.delivery_period,
        sst_rate: contractData.sst_rate,
        status,
        metadata: contractData.metadata || {},
        uploaded_file_id: contractData.uploaded_file_id,
        document_url: contractData.document_url,
      }

      // Check for existing contract (for local storage or for id lookup)
      const existingContract = existingByNumber?.get(contractNumber)

      try {
        if (!supabaseConfigured) {
          // Local storage fallback
          const localData = localStorage.getItem(`contracts_${hospitalId}`)
          const existingContracts: Contract[] = localData ? JSON.parse(localData) : []

          if (existingContract || existingContracts.some(c => c.contract_number === contractNumber)) {
            // Update existing
            const index = existingContracts.findIndex(c => c.contract_number === contractNumber)
            if (index !== -1) {
              existingContracts[index] = { ...existingContracts[index], ...newContract, updated_at: new Date().toISOString() }
            }
            localStorage.setItem(`contracts_${hospitalId}`, JSON.stringify(existingContracts))
          } else {
            // Create new
            const contract: Contract = {
              ...newContract,
              id: `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Contract
            existingContracts.push(contract)
            localStorage.setItem(`contracts_${hospitalId}`, JSON.stringify(existingContracts))
          }
          successCount++
        } else {
          // Supabase database - Use upsert pattern to handle duplicates
          // Check if contract already exists (in DB or in current batch)
          const { data: existingData, error: queryError } = await supabase
            .from('contracts')
            .select('id')
            .eq('hospital_id', hospitalId)
            .eq('contract_number', contractNumber)
            .maybeSingle()

          if (queryError && queryError.code !== 'PGRST116') { // PGRST116 = no rows returned
            errors.push(`Row ${i + 2}: Failed to check existing contract - ${queryError.message}`)
            continue
          }

          const contractToSave = {
            ...newContract,
            updated_at: new Date().toISOString(),
            ...(existingData ? {} : { created_at: new Date().toISOString() })
          }

          if (existingData) {
            // Update existing contract
            const { error: updateError } = await supabase
              .from('contracts')
              .update(contractToSave)
              .eq('id', existingData.id)

            if (updateError) {
              errors.push(`Row ${i + 2}: Failed to update - ${updateError.message}`)
            } else {
              successCount++
            }
          } else {
            // Insert new contract - handle duplicate key errors
            const { error: insertError } = await supabase
              .from('contracts')
              .insert(contractToSave)

            if (insertError) {
              // If duplicate key error (23505), try to update instead
              if (insertError.code === '23505' || insertError.message?.includes('duplicate key') || insertError.message?.includes('contracts_hospital_id_contract_number_key')) {
                // Contract was inserted between our check and insert (race condition)
                // Update instead
                const { error: updateError } = await supabase
                  .from('contracts')
                  .update(contractToSave)
                  .eq('hospital_id', hospitalId)
                  .eq('contract_number', contractNumber)

                if (updateError) {
                  errors.push(`Row ${i + 2}: Failed to upsert (duplicate key conflict) - ${updateError.message}`)
                } else {
                  successCount++
                }
              } else {
                errors.push(`Row ${i + 2}: Failed to insert - ${insertError.message}`)
              }
            } else {
              successCount++
              // Update local cache for subsequent checks in the same batch
              if (existingByNumber) {
                const { data: inserted } = await supabase
                  .from('contracts')
                  .select('id, contract_number')
                  .eq('hospital_id', hospitalId)
                  .eq('contract_number', contractNumber)
                  .maybeSingle()

                if (inserted) {
                  existingByNumber.set(contractNumber, { id: inserted.id })
                }
              }
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Row ${i + 2}: Exception - ${msg}`)
      }

      // Report progress
      if (onProgress) {
        onProgress({
          processed: i + 1,
          total: totalItems,
          success: successCount,
          failed: errors.length,
        })
      }
    }

    console.log('[batchImportContracts] Complete. Success:', successCount, 'Errors:', errors.length)

    return {
      data: { success: successCount, errors, replaced: replaceExisting },
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import contracts'
    console.error('[batchImportContracts] Exception:', error)
    return { data: null, error: message }
  }
}

// =====================================================
// EXPORT
// =====================================================

/**
 * Export contracts to CSV format
 */
export async function exportContractCatalog(
  hospitalId: string,
  filter?: ContractCatalogFilter
): Promise<ApiResponse<string>> {
  try {
    const { data: contracts, error } = await getContracts(hospitalId, filter)

    if (error || !contracts) {
      return { data: null, error: error || 'No contracts to export' }
    }

    // CSV Headers
    const headers = [
      'Drug Name',
      'No Kontrak',
      'Kontrak Mula',
      'Kontrak Tamat',
      'Pembekal',
      'Unit',
      'Harga (RM)',
      'Tempoh Serahan',
      'SST',
      'Status',
    ]

    // CSV Rows
    const rows = contracts.map(contract => [
      contract.item_name || '',
      contract.contract_number || '',
      contract.start_date || '',
      contract.end_date || '',
      contract.supplier_name || '',
      contract.unit || '',
      contract.unit_price?.toFixed(2) || '',
      contract.delivery_period || '',
      contract.sst_rate || '',
      contract.status || '',
    ])

    // Build CSV
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contract-catalog-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    return { data: 'Export successful', error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export contracts'
    console.error('Exception in exportContractCatalog:', error)
    return { data: null, error: message }
  }
}
