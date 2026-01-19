/**
 * Non-Drug Catalog Service
 * Handles non-drug catalog operations with full CRUD functionality
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { NonDrug, NonDrugWithRelations, Supplier } from '@/types/pharmacy'
import { getNonDrugCategories } from './inventoryService'

// Small helper to safely handle UUID fields coming from imports/forms.
// Returns a trimmed UUID string if valid, otherwise null so that we never
// send arbitrary text (e.g. "Cannula") to UUID columns in Supabase.
const sanitizeUuid = (value: any): string | null => {
  if (!value) return null
  const str = String(value).trim()
  // Standard UUID v1–v5 pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str) ? str : null
}

// =====================================================
// NON-DRUG CATALOG CRUD OPERATIONS
// =====================================================

export interface NonDrugCatalogFilter {
  search?: string
  category_id?: string
  supplier_id?: string
  procurement_vote?: 'appl' | 'cc' | 'dp' | 'lp'
  status?: 'active' | 'inactive'
}

export interface NonDrugCatalogKPIs {
  total: number
  active: number
  inactive: number
}

/**
 * Get non-drug catalog KPIs
 */
export async function getNonDrugCatalogKPIs(
  hospitalId: string
): Promise<ApiResponse<NonDrugCatalogKPIs>> {
  try {
    // Total
    const { count: total, error: totalError } = await supabase
      .from('non_drugs')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)

    if (totalError) throw totalError

    // Active
    const { count: active, error: activeError } = await supabase
      .from('non_drugs')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .eq('status', 'active')

    if (activeError) throw activeError

    // Inactive
    const { count: inactive, error: inactiveError } = await supabase
      .from('non_drugs')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .eq('status', 'inactive')

    if (inactiveError) throw inactiveError

    const kpis: NonDrugCatalogKPIs = {
      total: total || 0,
      active: active || 0,
      inactive: inactive || 0,
    }

    return { data: kpis, error: null }
  } catch (error) {
    console.error('Error fetching non-drug catalog KPIs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch non-drug catalog KPIs',
    }
  }
}

/**
 * Get non-drugs with search and filters
 */
export async function getNonDrugCatalog(
  hospitalId: string,
  filter?: NonDrugCatalogFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<PaginatedResponse<NonDrugWithRelations>>> {
  try {
    // Build query
    let query = supabase
      .from('non_drugs')
      .select('*', { count: 'exact' })
      .eq('hospital_id', hospitalId)

    // Apply filters
    if (filter?.search) {
      const search = filter.search.trim()
      if (search) {
        query = query.or(`item_code.ilike.%${search}%,item_name.ilike.%${search}%,sku.ilike.%${search}%,pku.ilike.%${search}%`)
      }
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

    // Order alphabetically by item_name (then by code)
    query = query
      .order('item_name', { ascending: true })
      .order('item_code', { ascending: true })

    // Pagination
    const { data: nonDrugsData, error, count } = await query
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error

    let nonDrugs = (nonDrugsData || []) as NonDrug[]

    // Get categories and suppliers for relations
    const categoriesResult = await getNonDrugCategories()
    const categoriesList = categoriesResult.data || []

    // Get suppliers
    const { data: suppliersData } = await supabase
      .from('suppliers')
      .select('*')
      .eq('hospital_id', hospitalId)
    const suppliersList = (suppliersData || []) as Supplier[]

    // Enrich with relations
    const nonDrugsWithRelations: NonDrugWithRelations[] = nonDrugs.map(item => {
      const category = categoriesList.find(c => c.id === item.category_id)
      const supplier = suppliersList.find(s => s.id === item.supplier_id)

      return {
        ...item,
        category,
        supplier,
      }
    })

    const total = count || nonDrugsWithRelations.length
    const totalPages = Math.ceil(total / pageSize)

    return {
      data: {
        data: nonDrugsWithRelations,
        total,
        page,
        pageSize,
        totalPages,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching non-drug catalog:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch non-drug catalog',
    }
  }
}

/**
 * Search non-drugs with autocomplete suggestions
 */
export async function searchNonDrugs(
  hospitalId: string,
  query: string,
  limit: number = 10
): Promise<ApiResponse<NonDrugWithRelations[]>> {
  try {
    if (!query || query.length < 2) {
      return { data: [], error: null }
    }

    const { data: nonDrugs, error } = await supabase
      .from('non_drugs')
      .select('*')
      .eq('hospital_id', hospitalId)
      .or(`item_code.ilike.%${query}%,item_name.ilike.%${query}%,sku.ilike.%${query}%,pku.ilike.%${query}%`)
      .limit(limit)

    if (error) throw error

    // Get categories and suppliers
    const categoriesResult = await getNonDrugCategories()
    const categoriesList = categoriesResult.data || []

    const { data: suppliersData } = await supabase
      .from('suppliers')
      .select('*')
      .eq('hospital_id', hospitalId)
    const suppliersList = (suppliersData || []) as Supplier[]

    // Enrich with relations
    const nonDrugsWithRelations: NonDrugWithRelations[] = (nonDrugs || []).map(item => {
      const category = categoriesList.find(c => c.id === item.category_id)
      const supplier = suppliersList.find(s => s.id === item.supplier_id)

      return {
        ...item,
        category,
        supplier,
      }
    })
    return { data: nonDrugsWithRelations, error: null }
  } catch (error) {
    console.error('Error searching non-drugs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to search non-drugs',
    }
  }
}

/**
 * Get non-drug by ID
 */
export async function getNonDrugById(nonDrugId: string): Promise<ApiResponse<NonDrugWithRelations>> {
  try {
    const { data, error } = await supabase
      .from('non_drugs')
      .select('*')
      .eq('id', nonDrugId)
      .maybeSingle()

    if (error) throw error
    if (!data) return { data: null, error: 'Non-drug item not found' }

    const categoriesResult = await getNonDrugCategories()
    const categoriesList = categoriesResult.data || []
    const category = categoriesList.find(c => c.id === data.category_id)

    const { data: supplierData } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', data.supplier_id)
      .maybeSingle()
    const supplier = supplierData as Supplier | null

    const nonDrugWithRelations: NonDrugWithRelations = {
      ...(data as NonDrug),
      category,
      supplier,
    }

    return { data: nonDrugWithRelations, error: null }
  } catch (error) {
    console.error('Error fetching non-drug:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch non-drug',
    }
  }
}

/**
 * Create new non-drug
 */
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

export async function createNonDrug(
  hospitalId: string,
  nonDrugData: Partial<NonDrug>
): Promise<ApiResponse<NonDrugWithRelations>> {
  try {
    const insertData: any = {
      hospital_id: hospitalId,
      item_code: nonDrugData.item_code || `ND-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      item_name: nonDrugData.item_name || '',
      category_id: sanitizeUuid((nonDrugData as any).category_id),
      unit_of_measure: nonDrugData.unit_of_measure || 'unit',
      min_stock_level: nonDrugData.min_stock_level || 0,
      max_stock_level: nonDrugData.max_stock_level || null,
      reorder_level: nonDrugData.reorder_level || null,
      status: nonDrugData.status || 'active',
      sku: nonDrugData.sku || null,
      pku: nonDrugData.pku || null,
      supplier_id: sanitizeUuid((nonDrugData as any).supplier_id),
      procurement_vote: nonDrugData.procurement_vote || null,
      price: nonDrugData.price || null,
      packaging_description: (nonDrugData as any).packaging_description || null,
    }

    const { data, error } = await supabase
      .from('non_drugs')
      .insert(insertData)
      .select()
      .maybeSingle()

    if (error) {
      console.error('[createNonDrug] ✗ Supabase INSERT ERROR:', error)
      return {
        data: null,
        error: `Failed to create non-drug: ${error.message}`,
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'Failed to create non-drug: No data returned from database',
      }
    }

    // Get relations
    const categoriesResult = await getNonDrugCategories()
    const categoriesList = categoriesResult.data || []
    const category = categoriesList.find(c => c.id === data.category_id)

    let supplier = null
    if (data.supplier_id) {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', data.supplier_id)
        .maybeSingle()
      supplier = supplierData as Supplier | null
    }

    const nonDrugWithRelations: NonDrugWithRelations = {
      ...(data as NonDrug),
      category,
      supplier,
    }

    return { data: nonDrugWithRelations, error: null }
  } catch (error) {
    console.error('[createNonDrug] ✗ EXCEPTION in createNonDrug:', error)
    console.error('[createNonDrug] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create non-drug',
    }
  }
}

/**
 * Update non-drug
 */
export async function updateNonDrug(
  nonDrugId: string,
  nonDrugData: Partial<NonDrug>
): Promise<ApiResponse<NonDrugWithRelations>> {
  try {
    const updateData: any = {
      ...nonDrugData,
      // Sanitize UUID fields so accidental text values from imports
      // (e.g. category names) don't break Supabase updates.
      category_id: sanitizeUuid((nonDrugData as any).category_id),
      supplier_id: sanitizeUuid((nonDrugData as any).supplier_id),
      packaging_description: (nonDrugData as any).packaging_description !== undefined
        ? (nonDrugData as any).packaging_description
        : undefined,
    }

    const { data, error } = await supabase
      .from('non_drugs')
      .update(updateData)
      .eq('id', nonDrugId)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) return { data: null, error: 'Non-drug item not found' }

    // Get relations
    const categoriesResult = await getNonDrugCategories()
    const categoriesList = categoriesResult.data || []
    const category = categoriesList.find(c => c.id === data.category_id)

    let supplier = null
    if (data.supplier_id) {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', data.supplier_id)
        .maybeSingle()
      supplier = supplierData as Supplier | null
    }

    const nonDrugWithRelations: NonDrugWithRelations = {
      ...(data as NonDrug),
      category,
      supplier,
    }

    return { data: nonDrugWithRelations, error: null }
  } catch (error) {
    console.error('Error updating non-drug:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update non-drug',
    }
  }
}

/**
 * Delete non-drug
 */
export async function deleteNonDrug(nonDrugId: string): Promise<ApiResponse<void>> {
  try {
    console.log('deleteNonDrug called with ID:', nonDrugId)

    // First check if item exists
    const { data: existing, error: checkError } = await supabase
      .from('non_drugs')
      .select('id, item_code, item_name')
      .eq('id', nonDrugId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking non-drug existence:', checkError)
      throw checkError
    }

    if (!existing) {
      return { data: null, error: 'Non-drug item not found' }
    }

    const { error } = await supabase
      .from('non_drugs')
      .delete()
      .eq('id', nonDrugId)

    if (error) {
      console.error('Supabase delete error:', error)
      throw error
    }

    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error deleting non-drug:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete non-drug',
    }
  }
}

/**
 * Export non-drug catalog to CSV
 */
export async function exportNonDrugCatalog(
  hospitalId: string,
  filter?: NonDrugCatalogFilter
): Promise<ApiResponse<string>> {
  try {
    // Get all non-drugs matching filter
    const result = await getNonDrugCatalog(hospitalId, filter, 1, 10000)

    if (!result.data) {
      return { data: null, error: 'Failed to fetch non-drugs for export' }
    }

    // Generate CSV
    const headers = [
      'Item Code',
      'Non-Drug Name',
      'SKU',
      'PKU',
      'Category',
      'Supplier',
      'Procurement Vote',
      'Status',
      'Price',
    ]

    const rows = result.data.data.map(item => [
      item.item_code,
      item.item_name,
      item.sku || '',
      item.pku || '',
      item.category?.category_name || '',
      item.supplier?.company_name || '',
      item.procurement_vote?.toUpperCase() || '',
      item.status,
      item.price?.toFixed(2) || '0.00',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    return { data: csvContent, error: null }
  } catch (error) {
    console.error('Error exporting non-drug catalog:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to export non-drug catalog',
    }
  }
}

/**
 * Batch import non-drugs from Excel/Document data
 * Mirrors the behaviour of batchImportDrugs with validation, deduplication,
 * and optional progress reporting.
 */
export async function batchImportNonDrugs(
  hospitalId: string,
  nonDrugs: Partial<NonDrug>[],
  onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void
): Promise<ApiResponse<{ success: number; errors: string[] }>> {
  try {
    console.log('='.repeat(60))
    console.log('[batchImportNonDrugs] Starting import:')
    console.log('[batchImportNonDrugs] Hospital ID:', hospitalId)
    console.log('[batchImportNonDrugs] Total items to import:', nonDrugs.length)
    console.log('='.repeat(60))
    const errors: string[] = []
    let successCount = 0

    // Filter out undefined/null entries and empty objects
    const validNonDrugs = nonDrugs.filter(
      (item) => item != null && typeof item === 'object' && Object.keys(item).length > 0
    )
    console.log('Valid items after filtering:', validNonDrugs.length)

    const totalItems = validNonDrugs.length

    // Invalid item codes and names to filter out
    const invalidItemCodes = ['APPL', 'CC', 'DP', 'LP', 'CONTRACT', 'ITEM CODE', 'ITEM_CODE', 'NON-DRUG NAME', 'SKU', 'PKU', 'CATEGORY', 'SUPPLIER', 'PROCUREMENT VOTE', 'STATUS', 'PRICE', 'ACTIONS']

    // Preload existing non-drugs
    if (totalItems > 0) {
      try {
        const allCodes = Array.from(
          new Set(
            validNonDrugs
              .map(d => (d && d.item_code ? String(d.item_code).trim().toUpperCase() : null))
              .filter((code): code is string => !!code)
          )
        )

        const chunkSize = 500
        for (let start = 0; start < allCodes.length; start += chunkSize) {
          const chunk = allCodes.slice(start, start + chunkSize)
          const { error } = await supabase
            .from('non_drugs')
            .select('id, item_code')
            .eq('hospital_id', hospitalId)
            .in('item_code', chunk)

          if (error) {
            console.error('[batchImportNonDrugs] Error preloading existing items:', error)
            errors.push(`Failed to check existing non-drug items for some codes: ${error.message}`)
            break
          }
        }
      } catch (preloadError) {
        console.error('[batchImportNonDrugs] Exception while preloading existing items:', preloadError)
      }
    }

    // Initial progress callback
    if (onProgress) {
      onProgress({
        processed: 0,
        total: totalItems,
        success: 0,
        failed: 0,
      })
    }

    // Process in chunks for batch upsert
    const chunkSize = 50
    for (let i = 0; i < validNonDrugs.length; i += chunkSize) {
      const chunk = validNonDrugs.slice(i, i + chunkSize)
      const upsertCandidates: any[] = []

      for (let j = 0; j < chunk.length; j++) {
        const nonDrugData = chunk[j]
        const rowIndex = i + j

        if (!nonDrugData || typeof nonDrugData !== 'object') {
          errors.push(`Row ${rowIndex + 2}: Invalid data entry`)
          continue
        }

        if (!nonDrugData.item_code || !nonDrugData.item_name) {
          errors.push(`Row ${rowIndex + 2}: Missing required fields (Item Code or Non-Drug Name)`)
          continue
        }

        const itemCode = String(nonDrugData.item_code).trim().toUpperCase()

        if (invalidItemCodes.includes(itemCode)) {
          errors.push(`Row ${rowIndex + 2}: Invalid item code "${nonDrugData.item_code}"`)
          continue
        }

        // Apply standardizations
        const preparedNonDrug = {
          hospital_id: hospitalId,
          item_code: itemCode,
          item_name: nonDrugData.item_name.trim(),
          category_id: nonDrugData.category_id || null,
          supplier_id: nonDrugData.supplier_id || null,
          reorder_level: parseInt(String(nonDrugData.reorder_level || 0)) || 0,
          price: parseFloat(String(nonDrugData.price || 0)) || 0,
          status: normalizeStatus(nonDrugData.status || 'active'),
          notes: nonDrugData.notes || '',
          packaging_description: nonDrugData.packaging_description || '',
          procurement_vote: normalizeProcurementVote(nonDrugData.procurement_vote || ''),
          updated_at: new Date().toISOString()
        }

        upsertCandidates.push(preparedNonDrug)
      }

      if (upsertCandidates.length > 0) {
        const { error: upsertError } = await supabase
          .from('non_drugs')
          .upsert(upsertCandidates, {
            onConflict: 'hospital_id,item_code',
            ignoreDuplicates: false
          })

        if (upsertError) {
          console.error('[batchImportNonDrugs] Chunk upsert error:', upsertError)
          errors.push(`Chunk starting at row ${i + 2}: Bulk upload failed - ${upsertError.message}`)
        } else {
          successCount += upsertCandidates.length
        }
      }

      if (onProgress) {
        onProgress({
          processed: Math.min(i + chunkSize, validNonDrugs.length),
          total: totalItems,
          success: successCount,
          failed: errors.length,
        })
      }
    }

    console.log('Import complete. Success:', successCount, 'Errors:', errors.length)

    return {
      data: { success: successCount, errors },
      error: null,
    }
  } catch (error) {
    console.error('Error batch importing non-drugs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to batch import non-drugs',
    }
  }
}

