/**
 * Drug Catalog Service
 * Handles drug catalog operations with full CRUD functionality
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { Drug, DrugWithRelations } from '@/types/pharmacy'

// =====================================================
// DRUG CATALOG CRUD OPERATIONS
// =====================================================

export interface DrugCatalogFilter {
  search?: string
  category_id?: string
  supplier_id?: string
  procurement_vote?: 'appl' | 'cc' | 'dp' | 'lp'
  status?: 'active' | 'inactive'
}

export interface DrugCatalogKPIs {
  total: number
  active: number
  inactive: number
}

/**
 * Get drug catalog KPIs
 */
export async function getDrugCatalogKPIs(
  hospitalId: string
): Promise<ApiResponse<DrugCatalogKPIs>> {
  try {
    const { count: total, error: totalError } = await supabase
      .from('drugs')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)

    if (totalError) throw totalError

    const { count: active, error: activeError } = await supabase
      .from('drugs')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .eq('status', 'active')

    if (activeError) throw activeError

    const kpis: DrugCatalogKPIs = {
      total: total || 0,
      active: active || 0,
      inactive: (total || 0) - (active || 0),
    }

    return { data: kpis, error: null }
  } catch (error) {
    console.error('Error fetching drug catalog KPIs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch drug catalog KPIs',
    }
  }
}

/**
 * Get drugs with search and filters
 */
export async function getDrugCatalog(
  hospitalId: string,
  filter?: DrugCatalogFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<PaginatedResponse<DrugWithRelations>>> {
  try {
    let query = supabase
      .from('drugs')
      .select('*', { count: 'exact' })
      .eq('hospital_id', hospitalId)

    // Apply filters
    if (filter?.search) {
      const search = filter.search
      query = query.or(`drug_code.ilike.%${search}%,drug_name.ilike.%${search}%,generic_name.ilike.%${search}%,brand_name.ilike.%${search}%,sku.ilike.%${search}%,pku.ilike.%${search}%`)
    }

    if (filter?.category_id) {
      query = query.eq('category_id', filter.category_id)
    }

    if (filter?.supplier_id) {
      query = query.eq('supplier_id', filter.supplier_id)
    }

    if (filter?.procurement_vote) {
      query = query.eq('procurement_vote', filter.procurement_vote)
    }

    if (filter?.status) {
      query = query.eq('status', filter.status)
    }

    // Get total count
    const { count } = await query

    // Order alphabetically by drug_name (then by code)
    query = query
      .order('drug_name', { ascending: true })
      .order('drug_code', { ascending: true })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: drugs, error } = await query

    if (error) throw error

    // Fetch suppliers separately if needed or join them. For now, we'll map if supplier_id exists
    // Ideally we join them in the query
    const results = drugs as unknown as DrugWithRelations[]

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      data: {
        data: results,
        total,
        page,
        pageSize,
        totalPages,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching drug catalog:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch drug catalog',
    }
  }
}

/**
 * Search drugs with autocomplete suggestions
 */
export async function searchDrugs(
  hospitalId: string,
  query: string,
  limit: number = 10
): Promise<ApiResponse<DrugWithRelations[]>> {
  try {
    if (!query || query.length < 2) {
      return { data: [], error: null }
    }

    const { data: drugs, error } = await supabase
      .from('drugs')
      .select('*, supplier:suppliers(*)')
      .eq('hospital_id', hospitalId)
      .or(`drug_code.ilike.%${query}%,drug_name.ilike.%${query}%,generic_name.ilike.%${query}%,brand_name.ilike.%${query}%,sku.ilike.%${query}%,pku.ilike.%${query}%`)
      .limit(limit)

    if (error) throw error

    return { data: drugs as unknown as DrugWithRelations[], error: null }
  } catch (error) {
    console.error('Error searching drugs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to search drugs',
    }
  }
}

/**
 * Get drug by ID
 */
export async function getDrugById(drugId: string): Promise<ApiResponse<DrugWithRelations>> {
  try {
    const { data, error } = await supabase
      .from('drugs')
      .select('*, supplier:suppliers(*)')
      .eq('id', drugId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: 'Drug not found' }
      throw error
    }

    return { data: data as unknown as DrugWithRelations, error: null }
  } catch (error) {
    console.error('Error fetching drug:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch drug',
    }
  }
}

/**
 * Create new drug
 */
// Helper function to validate UUID format
function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid) return true // null/undefined is valid (optional field)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Helper to normalise procurement vote to allowed values or null
function normalizeProcurementVote(value: any): 'appl' | 'cc' | 'dp' | 'lp' | null {
  if (!value && value !== 0) return null
  const v = String(value).trim().toLowerCase()
  if (!v) return null

  const allowed: ('appl' | 'cc' | 'dp' | 'lp')[] = ['appl', 'cc', 'dp', 'lp']
  if (allowed.includes(v as any)) {
    return v as any
  }

  console.warn('[procurement_vote] Invalid value, setting to null:', value)
  return null
}

// Helper to normalize status
function normalizeStatus(value: any): 'active' | 'inactive' {
  if (!value) return 'active'
  const v = String(value).trim().toLowerCase()
  return v === 'inactive' ? 'inactive' : 'active'
}

// Helper to normalize dosage form
function normalizeDosageForm(value: any): string {
  if (!value) return 'tablet'
  const v = String(value).trim().toLowerCase()
  const allowed = ['tablet', 'capsule', 'injection', 'syrup', 'suspension', 'cream', 'ointment', 'drops', 'inhaler', 'patch', 'suppository', 'powder', 'solution', 'other']

  if (allowed.includes(v)) return v

  // Try to find a match
  for (const form of allowed) {
    if (v.includes(form)) return form
  }

  return 'other'
}

export async function createDrug(
  hospitalId: string,
  drugData: Partial<Drug>
): Promise<ApiResponse<DrugWithRelations>> {
  try {
    // Validate category_id is a valid UUID
    if (drugData.category_id && !isValidUUID(drugData.category_id)) {
      console.error('Invalid category_id format (not a UUID):', drugData.category_id)
      return {
        data: null,
        error: `Invalid category_id format: "${drugData.category_id}". Category ID must be a valid UUID.`,
      }
    }

    // Validate supplier_id is a valid UUID
    if (drugData.supplier_id && !isValidUUID(drugData.supplier_id)) {
      console.error('Invalid supplier_id format (not a UUID):', drugData.supplier_id)
      return {
        data: null,
        error: `Invalid supplier_id format: "${drugData.supplier_id}". Supplier ID must be a valid UUID.`,
      }
    }

    const insertData: any = {
      hospital_id: hospitalId,
      drug_code: drugData.drug_code || `DRUG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      drug_name: drugData.drug_name || '',
      generic_name: drugData.generic_name || null,
      brand_name: drugData.brand_name || null,
      dosage_form: normalizeDosageForm(drugData.dosage_form),
      strength: drugData.strength || null,
      unit_of_measure: drugData.unit_of_measure || 'unit',
      category_id: drugData.category_id || null,
      is_controlled: drugData.is_controlled || false,
      requires_prescription: drugData.requires_prescription || false,
      storage_conditions: drugData.storage_conditions || null,
      min_stock_level: drugData.min_stock_level || 0,
      max_stock_level: drugData.max_stock_level || null,
      reorder_level: drugData.reorder_level || null,
      lead_time_days: drugData.lead_time_days || 7,
      status: normalizeStatus(drugData.status),
      sku: drugData.sku || null,
      pku: drugData.pku || null,
      supplier_id: drugData.supplier_id || null,
      procurement_vote: normalizeProcurementVote(drugData.procurement_vote),
      price: drugData.price || null,
      packaging_description: (drugData as any).packaging_description || null,
      item_sub_class: (drugData as any).item_sub_class || null,
    }

    console.log('[createDrug] Inserting drug:', insertData.drug_code, 'Procurement Vote:', insertData.procurement_vote)
    const { data, error } = await supabase
      .from('drugs')
      .insert(insertData)
      .select('*, supplier:suppliers(*)')
      .maybeSingle()

    if (error) {
      console.error('Error creating drug in Supabase:', error)
      return {
        data: null,
        error: `Failed to create drug: ${error.message}`,
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'Failed to create drug: No data returned from database',
      }
    }

    return { data: data as unknown as DrugWithRelations, error: null }
  } catch (error) {
    console.error('Error creating drug:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create drug',
    }
  }
}

/**
 * Update drug
 */
export async function updateDrug(
  drugId: string,
  drugData: Partial<Drug>
): Promise<ApiResponse<DrugWithRelations>> {
  try {
    // Validate category_id is a valid UUID
    if (drugData.category_id !== undefined && drugData.category_id !== null && !isValidUUID(drugData.category_id)) {
      console.error('Invalid category_id format (not a UUID):', drugData.category_id)
      return {
        data: null,
        error: `Invalid category_id format: "${drugData.category_id}". Category ID must be a valid UUID.`,
      }
    }

    // Validate supplier_id is a valid UUID
    if (drugData.supplier_id !== undefined && drugData.supplier_id !== null && !isValidUUID(drugData.supplier_id)) {
      console.error('Invalid supplier_id format (not a UUID):', drugData.supplier_id)
      return {
        data: null,
        error: `Invalid supplier_id format: "${drugData.supplier_id}". Supplier ID must be a valid UUID.`,
      }
    }

    const updateData: any = {
      ...drugData,
      dosage_form: drugData.dosage_form !== undefined
        ? normalizeDosageForm(drugData.dosage_form)
        : undefined,
      status: drugData.status !== undefined
        ? normalizeStatus(drugData.status)
        : undefined,
      procurement_vote: drugData.procurement_vote !== undefined
        ? normalizeProcurementVote(drugData.procurement_vote)
        : undefined,
      packaging_description: (drugData as any).packaging_description !== undefined
        ? (drugData as any).packaging_description
        : undefined,
      item_sub_class: (drugData as any).item_sub_class !== undefined
        ? (drugData as any).item_sub_class
        : undefined,
    }

    const { data, error } = await supabase
      .from('drugs')
      .update(updateData)
      .eq('id', drugId)
      .select('*, supplier:suppliers(*)')
      .maybeSingle()

    if (error) {
      console.error('Error updating drug in Supabase:', error)
      throw error
    }

    if (!data) {
      return { data: null, error: 'Drug not found' }
    }

    return { data: data as unknown as DrugWithRelations, error: null }
  } catch (error) {
    console.error('Error updating drug:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update drug',
    }
  }
}

/**
 * Delete drug
 */
export async function deleteDrug(drugId: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('drugs')
      .delete()
      .eq('id', drugId)

    if (error) throw error
    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error deleting drug:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete drug',
    }
  }
}

/**
 * Export drug catalog to CSV
 */
export async function exportDrugCatalog(
  hospitalId: string,
  filter?: DrugCatalogFilter
): Promise<ApiResponse<string>> {
  try {
    // Get all drugs matching filter
    const result = await getDrugCatalog(hospitalId, filter, 1, 10000)

    if (!result.data) {
      return { data: null, error: 'Failed to fetch drugs for export' }
    }

    // Generate CSV
    const headers = [
      'Item Code',
      'Drug Name',
      'SKU',
      'PKU',
      'Category',
      'Supplier',
      'Procurement Vote',
      'Status',
      'Price',
    ]

    const rows = result.data.data.map(drug => [
      drug.drug_code,
      drug.drug_name,
      drug.sku || '',
      drug.pku || '',
      drug.category?.category_name || '',
      drug.supplier?.company_name || '',
      drug.procurement_vote?.toUpperCase() || '',
      drug.status,
      drug.price?.toFixed(2) || '0.00',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    return { data: csvContent, error: null }
  } catch (error) {
    console.error('Error exporting drug catalog:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to export drug catalog',
    }
  }
}

/**
 * Batch import drugs from Excel/Document data
 * Optional onProgress callback is used by the UI to show real-time percentage.
 */
export async function batchImportDrugs(
  hospitalId: string,
  drugs: Partial<Drug>[],
  onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void
): Promise<ApiResponse<{ success: number; errors: string[] }>> {
  try {
    console.log('='.repeat(60))
    console.log('[batchImportDrugs] Starting import:')
    console.log('[batchImportDrugs] Hospital ID:', hospitalId)
    console.log('[batchImportDrugs] Total items to import:', drugs.length)
    console.log('='.repeat(60))

    const errors: string[] = []
    let successCount = 0

    // Filter out undefined/null entries and empty objects
    const validDrugs = drugs.filter(
      (item) => item != null && typeof item === 'object' && Object.keys(item).length > 0
    )
    console.log('[batchImportDrugs] Valid items after filtering:', validDrugs.length)

    // Initialise progress reporting
    const totalItems = validDrugs.length
    if (onProgress) {
      onProgress({
        processed: 0,
        total: totalItems,
        success: 0,
        failed: 0,
      })
    }

    // Invalid drug codes and names to filter out
    const invalidDrugCodes = ['APPL', 'CC', 'DP', 'LP', 'CONTRACT', 'ITEM CODE', 'ITEM_CODE', 'DRUG NAME', 'SKU', 'PKU', 'CATEGORY', 'SUPPLIER', 'PROCUREMENT VOTE', 'STATUS', 'PRICE', 'ACTIONS']

    // Preload existing drugs
    let existingByCode: Map<string, { id: string }> | null = null
    if (totalItems > 0) {
      try {
        const allCodes = Array.from(
          new Set(
            validDrugs
              .map(d => (d && d.drug_code ? String(d.drug_code).trim().toUpperCase() : null))
              .filter((code): code is string => !!code)
          )
        )

        existingByCode = new Map()
        const chunkSize = 500
        for (let start = 0; start < allCodes.length; start += chunkSize) {
          const chunk = allCodes.slice(start, start + chunkSize)
          const { data, error } = await supabase
            .from('drugs')
            .select('id, drug_code')
            .eq('hospital_id', hospitalId)
            .in('drug_code', chunk)

          if (error) {
            console.error('[batchImportDrugs] Error preloading existing drugs:', error)
            errors.push(`Failed to check existing items for some codes: ${error.message}`)
            break
          }

          ; (data || []).forEach((row: any) => {
            if (!row || !row.drug_code || !row.id) return
            const code = String(row.drug_code).trim().toUpperCase()
            existingByCode!.set(code, { id: row.id })
          })
        }

        console.log(
          '[batchImportDrugs] Preloaded existing drugs for hospital:',
          existingByCode.size,
          'codes'
        )
      } catch (preloadError) {
        console.error('[batchImportDrugs] Exception while preloading existing drugs:', preloadError)
      }
    }

    // Process in chunks for batch upsert
    const chunkSize = 50
    for (let i = 0; i < validDrugs.length; i += chunkSize) {
      const chunk = validDrugs.slice(i, i + chunkSize)
      const upsertCandidates: any[] = []

      for (let j = 0; j < chunk.length; j++) {
        const drugData = chunk[j]
        const rowIndex = i + j

        if (!drugData || typeof drugData !== 'object') {
          errors.push(`Row ${rowIndex + 2}: Invalid data entry`)
          continue
        }

        if (!drugData.drug_code || !drugData.drug_name) {
          errors.push(`Row ${rowIndex + 2}: Missing required fields (Item Code or Drug Name)`)
          continue
        }

        const drugCode = String(drugData.drug_code).trim().toUpperCase()

        if (invalidDrugCodes.includes(drugCode)) {
          errors.push(`Row ${rowIndex + 2}: Invalid drug code "${drugData.drug_code}"`)
          continue
        }

        // Apply same standardizations as update/create
        const preparedDrug = {
          hospital_id: hospitalId,
          drug_code: drugCode,
          drug_name: drugData.drug_name.trim(),
          category_id: drugData.category_id || null,
          supplier_id: drugData.supplier_id || null,
          dosage_form: normalizeDosageForm(drugData.dosage_form || ''),
          strength: drugData.strength || '',
          pku: drugData.pku || '',
          sku: drugData.sku || '',
          procurement_vote: normalizeProcurementVote(drugData.procurement_vote || ''),
          price: parseFloat(String(drugData.price || 0)) || 0,
          status: normalizeStatus(drugData.status || 'active'),
          notes: drugData.notes || '',
          packaging_description: drugData.packaging_description || '',
          item_sub_class: drugData.item_sub_class || '',
          updated_at: new Date().toISOString()
        }

        upsertCandidates.push(preparedDrug)
      }

      if (upsertCandidates.length > 0) {
        const { error: upsertError } = await supabase
          .from('drugs')
          .upsert(upsertCandidates, {
            onConflict: 'hospital_id,drug_code',
            ignoreDuplicates: false
          })

        if (upsertError) {
          console.error('[batchImportDrugs] Chunk upsert error:', upsertError)
          errors.push(`Chunk starting at row ${i + 2}: Bulk upload failed - ${upsertError.message}`)
        } else {
          successCount += upsertCandidates.length
        }
      }

      if (onProgress) {
        onProgress({
          processed: Math.min(i + chunkSize, validDrugs.length),
          total: totalItems,
          success: successCount,
          failed: errors.length,
        })
      }
    }

    console.log('[batchImportDrugs] Import complete. Success:', successCount, 'Errors:', errors.length)

    // Verify in Supabase
    const { count } = await supabase
      .from('drugs')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
    console.log('[batchImportDrugs] Total drugs in Supabase for hospital:', count)

    console.log('='.repeat(60))

    return {
      data: { success: successCount, errors },
      error: null,
    }
  } catch (error) {
    console.error('Error batch importing drugs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to batch import drugs',
    }
  }
}

